const RepositoryQuery = require("./queries.js");
const fetch = require("node-fetch");
const atob = require("atob");
const Repository = require("../models/Repository.js");
const TOKEN = "<some_github_token>";
const incrementalAnalysisMethods = require("./incrementalAnalysisMethods.js");

const incrementalHelpers = () => {
	const {calculateMetricCategory} = incrementalAnalysisMethods();

	const getTotalLOC = async (owner, repo, path, branch_sha) => {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch_sha}`, {
      headers: {
        'Authorization': `Token ${TOKEN}`
      }
    })
    const data = await response.json()
    if(data.content){
      const content = Buffer.from(data.content, 'base64').toString('binary'); // decode base64-encoded content
      //console.log("content:", content);
      const numLines = content.split('\n').filter(line => line.trim() !== "").length;
      return numLines
    }
    else {
      return 0
    }
  }

	const getFileShaValue = async (context, owner, repo, baseCommitSha, fileName) => {
		try {
			const { data: fileData } = await context.octokit.rest.repos.getContent({
				owner,
				repo,
				path: fileName,
				ref: baseCommitSha,
			});
			return fileData.sha;
		} catch (err) {
			// Return empty string for newly added files
			return "";
		}
	};

  const createPullRequestItem = async (context, sizeSettings, mergeRateSettings) => {
    const owner = context.payload.repository.owner.login;
		const repo = context.payload.repository.name;
		const authorLoginName = context.payload.pull_request.user.login;
		const number = context.payload.number;
		const response = await context.octokit.graphql(RepositoryQuery, {owner, repo, number});
		const payloadPullRequestInfo = context.payload.pull_request;
		const graphqlPullRequestInfo = response.repository.pullRequest;

		for(let i = 0; i < response.repository.pullRequest.closingIssuesReferences.nodes.length; i++){
			const node = response.repository.pullRequest.closingIssuesReferences.nodes[i].labels.edges?.map(edge => edge.node);
			const count = node[0]?.issues?.totalCount;
			if(count && count > 0){ 
				payloadPullRequestInfo.buggyIssueCount = count;
				break;
			}
		}

		const {data: files} = await context.octokit.pulls.listFiles({ 
			owner,
			repo,
			pull_number: number
		});

		const lastCommitSha = graphqlPullRequestInfo.commits.edges[0].node.commit.oid;
    const updatedFiles = files.map(file => ({ name: getFileNameFromPath(file.filename), path: file.filename, status: file.status, sha: file.sha, additions: file.additions, deletions: file.deletions, changes: file.changes })); 

    for(const file of updatedFiles){
      file.total_line_of_code = await getTotalLOC(owner, repo, file.path, lastCommitSha);
			file.origin_sha = file.sha;
			file.destination_sha = await getFileShaValue(context, owner, repo, payloadPullRequestInfo.base.sha, file.path);
    } 

		payloadPullRequestInfo.analysis = {
			likert_scale: {},
			quality_gate: {},
			risk_score: {},
			current_bug_frequencies: [],
			current_code_churns: [],
			current_co_changes: [],
			highly_buggy_file_result: {
				count: 0,
			},
			highly_churn_file_result: {
				count: 0,
			},
			pr_size_result: {},
			author_merge_rate_result: {},        
			current_page_rank_result: {
				score: 0
			},
		}

		let collaborator_info;
		// Update collaborator and author total information
		try{
      let result = await Repository.findOne(
        { repo_name: repo },
        { "collaborators": { $elemMatch: { login: authorLoginName } } }
      )
			collaborator_info = result.collaborators[0];
    } catch(error) {
      console.error(error);
    }

		let author_cur_merged_pull_request_count = 0
		let author_cur_pull_request_count = 0

		if(collaborator_info){
			
			if(context.payload.action == "reopened" || context.payload.action == "synchronize"){
				author_cur_pull_request_count = collaborator_info.total_pull_request_count;
			}
			if(context.payload.action == "opened"){
				author_cur_pull_request_count = collaborator_info.total_pull_request_count + 1; //Because this pr is opened
			}
			

			author_cur_merged_pull_request_count = collaborator_info.total_merged_pull_request_count; //Because this pr is not closed yet
			const authorMergeRate = author_cur_merged_pull_request_count / author_cur_pull_request_count;
			payloadPullRequestInfo.analysis.author_merge_rate_result.category = calculateMetricCategory(authorMergeRate, mergeRateSettings, false);

			author_cur_total_risk_score = collaborator_info.total_risk_score;
		}

		// Update pull request pr size analysis //

		const size = graphqlPullRequestInfo.additions + graphqlPullRequestInfo.deletions;
		payloadPullRequestInfo.analysis.pr_size_result.category = calculateMetricCategory(size, sizeSettings, true);

		const pullRequest = {
			id: payloadPullRequestInfo.id,
			number: payloadPullRequestInfo.number,
			title: payloadPullRequestInfo.title,
			description: payloadPullRequestInfo.body,
			isAddedInIncrementalAnalysis: true,
			url: payloadPullRequestInfo.html_url,
			state: payloadPullRequestInfo.state,
			labels: payloadPullRequestInfo.labels.map(node => node.name),
			buggyIssueCount: payloadPullRequestInfo.buggyIssueCount,
			createdAt: payloadPullRequestInfo.created_at,
			branch_name: {
				origin: payloadPullRequestInfo.head.ref,
				destination: payloadPullRequestInfo.base.ref,
			},
			lines: {
				additions: graphqlPullRequestInfo.additions,
				deletions: graphqlPullRequestInfo.deletions,
				changes: graphqlPullRequestInfo.changes,
			},
			merger: graphqlPullRequestInfo.mergedBy,
			reviewers: graphqlPullRequestInfo.reviews.edges.map(({ node }) => ({ name: node.author.name, login:node.author.name, id: node.author.id })),
			assignees: graphqlPullRequestInfo.assignees.edges.map(({ node }) => ({ name: node.name, login: node.name, id: node.id })),
			files: updatedFiles,
			author: {
				name: graphqlPullRequestInfo.author.name,
				id: graphqlPullRequestInfo.author.id,
				login: graphqlPullRequestInfo.author.login,
				cur_total_risk_score: author_cur_total_risk_score,
				cur_pull_request_count: author_cur_pull_request_count,
				cur_merged_pull_request_count: author_cur_merged_pull_request_count,
			},
			analysis: payloadPullRequestInfo.analysis
		}
		
    return pullRequest
  }

  const getFileNameFromPath = (path) => {
    let slashIndex = path.lastIndexOf('/');
    let fileName = path.substring(slashIndex + 1);
    return fileName
  }

	const buildComment = (pullRequest, settings, repoID) => {
		const set_analysis_metrics = settings.analysis_metrics;
		const data = pullRequest.author;
		
		let comment = "";

		//////////////////////////
		// Impact Graph Section //
		//////////////////////////

		const changed_code_files = pullRequest.files;
		const total_changes_of_the_lines = pullRequest.lines;

		comment += `#### ![#FFA500](https://placehold.co/15x15/FFA500/FFA500.png) **MODIFIED** ![#FF6961](https://placehold.co/15x15/FF6961/FF6961.png) **REMOVED** ![#ADD8E6](https://placehold.co/15x15/ADD8E6/ADD8E6.png) **POSSIBLY AFFECTED**` + "\n";
		comment += `## :pencil: GENERAL INFORMATION` + "\n";
		comment += `* **Number of Changed Code Files in This Pull Request**     :point_right:     `  +  changed_code_files.length + "\n";
		comment += `* **Total Added Lines**     :point_right:     ` + total_changes_of_the_lines.additions + "\n"
		+ `* **Total Deleted Lines**     :point_right:     ` + total_changes_of_the_lines.deletions + "\n";

		////////////////////////////
		// Category Table Section //
		////////////////////////////

		const files_in_pr = pullRequest.files;
		const bug_frequency_category_of_pr = pullRequest.analysis.highly_buggy_file_result.category;
		const code_churn_category_of_pr = pullRequest.analysis.highly_churn_file_result.category;
		const pr_size_result_category_of_pr = pullRequest.analysis.pr_size_result.category;
		const page_rank_category_of_pr = pullRequest.analysis.current_page_rank_result.category;
		const author_merge_rate_category_of_pr = pullRequest.analysis.author_merge_rate_result.category;
		const risk_score_category = pullRequest.analysis.risk_score.category;
		const risk_score_score = pullRequest.analysis.risk_score.score;
		const total_code_churn_count = pullRequest.analysis.highly_churn_file_result.count;
		const total_bug_frequency_count = pullRequest.analysis.highly_buggy_file_result.count;
		let current_page_rank_result = pullRequest.analysis.current_page_rank_result.score;

		const categoriesTable_const = '| Metric                   | Category    | Numeric Value    |\n| :---         |     :---:      |     :---:      |\n';
		let categoriesTable = '| Metric                   | Category    | Numeric Value    |\n| :---         |     :---:      |     :---:      |\n';

		metric_shown = set_analysis_metrics.find(metric_of_metrics => metric_of_metrics.metric == "Previous Bug Frequency");
		let total = total_bug_frequency_count / files_in_pr.length;
		const percentage_of_bug_frequency = (100 * total).toFixed(2);

		if (metric_shown) {
			if (metric_shown.checked) {
				categoriesTable += updateCategoriesTable(metric_shown.metric, bug_frequency_category_of_pr, percentage_of_bug_frequency);
			}
		}

		metric_shown = set_analysis_metrics.find(metric_of_metrics => metric_of_metrics.metric == "Code Churn");
		total = total_code_churn_count / files_in_pr.length;
		const percentage_of_code_churn = (100 * total).toFixed(2);

		if (metric_shown) {
			if (metric_shown.checked) {
				categoriesTable += updateCategoriesTable(metric_shown.metric, code_churn_category_of_pr, percentage_of_code_churn);
			}
		}

		total_line = total_changes_of_the_lines.additions + total_changes_of_the_lines.deletions;
		categoriesTable += updateCategoriesTable("PR Size", pr_size_result_category_of_pr, total_line);

		current_page_rank_result = (current_page_rank_result * 100).toFixed(2);
		categoriesTable += updateCategoriesTable("Page Rank", page_rank_category_of_pr, current_page_rank_result);

		const rate = ((data.cur_merged_pull_request_count / data.cur_pull_request_count) * 100).toFixed(2)
		categoriesTable += updateCategoriesTable("Author Merge Rate", author_merge_rate_category_of_pr, rate);

		metric_shown = set_analysis_metrics.find(metric_of_metrics => metric_of_metrics.metric == "Risk Score");
		score = (risk_score_score).toFixed(2);
		
		if (metric_shown) {
			if (metric_shown.checked) {
				categoriesTable += updateCategoriesTable(metric_shown.metric, risk_score_category, score);
			}
		}
		
		if(categoriesTable !== categoriesTable_const){
			comment += `## :open_file_folder: METRICS` + "\n" + `${categoriesTable}` + "\n";
			comment += `##### ***Risk is calculated as weighted sum of above metrics**` + "\n";
			comment += `##### **Category Scala => Best: :green_square: A | Good: :blue_square: B | Mediocre: :yellow_square: C | Bad: :orange_square: D | Worst: :red_square: E**` + "\n";
		}

		////////////////////////////////
		// Author Information Section //
		////////////////////////////////
		
		const author_information = pullRequest.author;
		const author_avg_risk_score = (pullRequest.author.cur_total_risk_score / pullRequest.author.cur_pull_request_count).toFixed(2);

		metric_shown = set_analysis_metrics.find(metric_of_metrics => metric_of_metrics.metric == "Developer Statistics");

		if (metric_shown && metric_shown.checked) {
			let author_display_name = author_information.login;

			if (author_information.name) {
				author_display_name = author_information.name;
			}

			comment += `## :information_source: :information_desk_person: AUTHOR INFORMATION` + "\n"
			+ "* **The current status of the**  " + author_display_name + " **is**: " + "\n"
			+ "* **Current Pull Request Count**     :point_right:      " + author_information.cur_pull_request_count + "\n"
			+ "* **Current Merged Pull Request Count**     :point_right:      " + author_information.cur_merged_pull_request_count + "\n"
			+ `* **Author Risk Score Average** :point_right: ` + `**` + author_avg_risk_score + `**` + "\n";
		}

		//////////////////////////////
		// Co-Changed Files Section //
		//////////////////////////////

		const current_co_changes = pullRequest.analysis.current_co_changes;
		const current_bug_frequencies = pullRequest.analysis.current_bug_frequencies;
		const co_change_threshold = settings.metric_management.highly_co_change_file.file_threshold;

		metric_shown = set_analysis_metrics.find(metric_of_metrics => metric_of_metrics.metric == "Co-changed Files");
		console.log("Co changed Files shown: " + metric_shown.checked);		
		if (metric_shown) {
			if (metric_shown.checked) {
				comment += `## :sun_with_face: :new_moon_with_face: CO-CHANGE FILES INFORMATION ` + "\n";

				let no_sibling_file_risk = 0;
				for (const file_in_current_co_change of current_co_changes) {
					const pr_count_of_file = current_bug_frequencies.find(file => file.path === file_in_current_co_change.path).current_pr_count;
					const name_of_file = changed_code_files.find(file => file.path === file_in_current_co_change.path);

					let missing_sibling_files_table_const = `| Missing Sibling Files of ${name_of_file.name} | Co Changed Ratio | Co-Changed Count | PR Count of ${name_of_file.name} |\n|     :---:      |     :---:      |     :---:      |     :---:      |\n`;
					let missing_sibling_files_table = `| Missing Sibling Files of ${name_of_file.name} | Co Changed Ratio | Co-Changed Count | PR Count of ${name_of_file.name} |\n|     :---:      |     :---:      |     :---:      |     :---:      |\n`;
		
					for (const co_changed_file of file_in_current_co_change.current_co_change) {
						let co_change_rate_btw_files = co_changed_file.co_change_rate;
						let change_rate = (((co_change_rate_btw_files / pr_count_of_file) * 100)).toFixed(2);
		
						let not_exist = 1;
						for (const exist_file_in_pr of files_in_pr) {
							if (exist_file_in_pr.path != co_changed_file.path) {
								no_sibling_file_risk ++;
							}
							else {
								not_exist = 0;
								break;
							}
						}
		
						if(change_rate >= co_change_threshold && not_exist == 1) {
							missing_sibling_files_table += ` | ` + co_changed_file.path + ` | ${change_rate}% | ${co_change_rate_btw_files} | ${pr_count_of_file} |` + "\n";
						}
					}

					if(missing_sibling_files_table !== missing_sibling_files_table_const){
						comment += `${missing_sibling_files_table}` + "\n";
					}
				}

				if (no_sibling_file_risk == 0) {
					comment += `### There is no problem for usage of sibling files :grin:` + "\n";
				}
			}
		}
		
		//////////////////////////
		// Quality Gate Section //
		//////////////////////////

		const qualityGateMetrics = settings.quality_gate;
		const quality_gate_results = pullRequest.analysis.quality_gate;

		const qualityGate = {}
		for (const metric of qualityGateMetrics) {
			qualityGate[metric.metric_name] = metric.threshold;
		}
		reasons = [];
		
		// Calculate quality gate status
		if (qualityGate.hasOwnProperty("risk_score") && pullRequest.analysis.risk_score.score >= qualityGate.risk_score) {
			if (qualityGate['risk_score']) {
				reasons.push(`Risk score should be lower than ${qualityGate['risk_score']}%`);
			}
		}
		else {
			if (qualityGate['risk_score']) {
				reasons.push(`Risk score is lower than ${qualityGate['risk_score']}%`)
			}
		}
		if (qualityGate.hasOwnProperty("highly_buggy_file") && (pullRequest.analysis.highly_buggy_file_result.count / pullRequest.files.length) * 100 >= qualityGate.highly_buggy_file) {
			if (qualityGate['highly_buggy_file']) {
				reasons.push(`Highly buggy file ratio should be lower than ${qualityGate['highly_buggy_file']}%`)
			}
		}
		else { 
			if (qualityGate['highly_buggy_file']) { 
				reasons.push(`Highly buggy file ratio is lower than ${qualityGate['highly_buggy_file']}%`)
			}
		}
		if (qualityGate.hasOwnProperty("highly_churn_file") && (pullRequest.analysis.highly_churn_file_result.count / pullRequest.files.length) * 100 >= qualityGate.highly_churn_file) {
			if (qualityGate['highly_churn_file']) {
					reasons.push(`Highly churn file ratio should be lower than ${qualityGate['highly_churn_file']}%`)
				}
		}
		else { 
			if (qualityGate['highly_churn_file']) {
				reasons.push(`Highly churn file ratio is lower than ${qualityGate['highly_churn_file']}%`)
			}
		}
		if (qualityGate.hasOwnProperty("pr_size") && (pullRequest.lines.additions + pullRequest.lines.deletions) >= qualityGate.pr_size) {
			if (qualityGate['pr_size']) {
				reasons.push(`Pull request size should be lower than ${qualityGate['pr_size']} lines of code`)
			}
		}
		else {
			if (qualityGate['pr_size']) {
				reasons.push(`Pull request size is lower than ${qualityGate['pr_size']} lines of code`)
			}
		}
		
		comment += `## :trophy: QUALITY GATE` + "\n";

		let quality_gate_color = "Failed/red";
		if (quality_gate_results.status) {
			quality_gate_color = "Passed/green";
		}
		const quality_gate_status = `<p><img src="https://badgen.net/badge/QUALITY GATE/` + quality_gate_color + `?&scale=2" alt="ALERT!" style="max-width: 100%;"></p>` + "\n";

		comment += `${quality_gate_status} \n` + `### CONDITIONS` + "\n";

		for (const reason of reasons) {
			if (reason.includes("should")) {
				comment += ` :x: **`;
			}
			else {
				comment += ` :heavy_check_mark: **`;
			}
			comment += reason + `**` + "\n"
		}

		/////////////////////////
		// Risky Files Section //
		/////////////////////////

		const bug_frequency_threshold = settings.metric_management.highly_buggy_file.file_threshold;
		const code_churn_threshold = settings.metric_management.highly_churn_file.file_threshold;
		const current_code_churns = pullRequest.analysis.current_code_churns;

		const buggyFileAlertTable_const = '| File Name                   | Bug Frequency    |\n|     :---:      |     :---:      |\n';;
		const codeChurnAlertTable_const = '| File Name                   | Current Code Churn    |\n|     :---:      |     :---:      |\n';
		let buggyFileAlertTable = '| File Name                   | Bug Frequency    |\n|     :---:      |     :---:      |\n';
		let codeChurnAlertTable = '| File Name                   | Current Code Churn    |\n|     :---:      |     :---:      |\n';

		let bug_frequency_checked;
		metric_shown = set_analysis_metrics.find(metric_of_metrics => metric_of_metrics.metric == "Previous Bug Frequency");
		
		if (metric_shown) {
			if (metric_shown.checked) {
				bug_frequency_checked = metric_shown.checked;
				for (const file of current_bug_frequencies) {
					if (file.current_bug_frequency >= bug_frequency_threshold) {
						const fileName = getFileNameFromPath(file.path);
						buggyFileAlertTable += `|` + fileName + `|` + (file.current_bug_frequency * 100) + `%|\n `;
					}
				}
			}
		}

		let code_churn_checked;
		metric_shown = set_analysis_metrics.find(metric_of_metrics => metric_of_metrics.metric == "Code Churn");
		
		if (metric_shown) {
			if (metric_shown.checked) {
				code_churn_checked = metric_shown.checked;
				for (const file of current_code_churns) {
					if (file.current_code_churn >= code_churn_threshold) { 
						const fileName = getFileNameFromPath(file.path);
						let code_churn_file = (file.current_code_churn).toFixed(2);
						codeChurnAlertTable += `|` + fileName + `| ` + code_churn_file + `|\n `;
					}
				}
			}
		}

		if (bug_frequency_checked && code_churn_checked) {
			comment += `## :exclamation: POSSIBLE RISKY FILES` + "\n"; //if all categories has false for seeming on github bot comment then, Categories title will not be seen too
			if (buggyFileAlertTable === buggyFileAlertTable_const && codeChurnAlertTable === codeChurnAlertTable_const) {	
				comment += `### There is no possible risky files YEY! :grin:` + "\n";
			}
			else {
				if (buggyFileAlertTable !== buggyFileAlertTable_const) {
					comment += `${buggyFileAlertTable}` + "\n";
				}

				if (codeChurnAlertTable !== codeChurnAlertTable_const) {
					comment += "\n" + `${codeChurnAlertTable}` + "\n";
				}
			}
		}

		//////////////////
		// Link Section //
		//////////////////
			
		let websiteUrl = `http://localhost:3005/repositories/${repoID}/pullRequests/${pullRequest.number}/pullRequestSummary`;
		let website_url_shown = `<p><a href="${websiteUrl}"><img src="https://badgen.net/badge/CLICK/for More Details/grey?scale=1.5" alt="Click for Website" style="max-width: 100%;></a></p>`;

		comment += `\n`+ `## :link: LINK OF THE WEBSITE` + "\n" + `${website_url_shown}` + "\n";
		const alertBadgeUrl = "\n" + `[](https://translate.google.com/?sl=tr&tl=en&text=%0A&op=translate)` + "\n";
		comment += "\n" + `${alertBadgeUrl}` + "\n";
		
		if (comment == "") {
			comment = "All files are newly created. So no analysis metric is found for this pull request";
		}

		return comment;
	}
	
	const addComment = async (context, pullRequest, settings) => {
		const repoID = context.payload.repository.id;
		const {owner, repo} = context.issue();
		const commentBody = buildComment(pullRequest, settings, repoID);

		//Check if there is a comment from the bot
		const {data: comments} = await context.octokit.rest.issues.listComments({
			owner,
			repo,
			issue_number: pullRequest.number,
		});

		// const botComment = comments.find((comment) => comment.user.login == "change-impact-detector-bot[bot]");
		const botComment = comments.find((comment) => comment.user.login == "git-bot-cid[bot]");

		if (botComment) {
			try {
				await context.octokit.issues.updateComment({owner, repo, comment_id: botComment.id, body: commentBody });
			} catch (error) {
				console.error(error);
			}
		} 
		else {
			await context.octokit.issues.createComment({ owner, repo, issue_number: pullRequest.number, body: commentBody })
		}
	}

	const getBranchFiles = async (repoID, destinationBranchName) => {
		try {
			const files = await Repository.aggregate([
				{ $match: { repo_id: repoID } },
				{ $unwind: "$analyzed_branches" },
				{ $match: { "analyzed_branches.branch_name": destinationBranchName } },
				{ $project: { files: "$analyzed_branches.files" } },
				{ $limit: 1 }
			]);
			return files[0].files;
		} catch(error) {
			console.error(error);
		};  
	}

	const getSpesificPullRequest = async (repoID, destinationBranchName, pullRequestID) => {
		try {
			const result = await Repository.aggregate([
				{ $match: { repo_id: repoID } },
				{ $unwind: "$analyzed_branches" },
				{ $match: { "analyzed_branches.branch_name": destinationBranchName } },
				{ $project: {
						pullRequest: {
							$filter: {
								input: "$analyzed_branches.pullRequests",
								as: "pr",
								cond: { $eq: [ "$$pr.id", pullRequestID ] }
							}
						}
					}
				}
			])
			return result[0].pullRequest[0];
		} catch(error) {
			console.error(error);
			return null
		};
	}

	const getAllActivePullRequests = async (repoID, destinationBranchName) => {
		try {
			const result = await Repository.aggregate([
				{ $match: { repo_id: repoID } },
				{ $unwind: "$analyzed_branches" },
				{ $match: { "analyzed_branches.branch_name": destinationBranchName } },
				{ $project: {
						pullRequests: {
							$filter: {
								input: "$analyzed_branches.pullRequests",
								as: "pr",
								cond: { $eq: [ "$$pr.state", "open" ] }
							}
						}
					}
				}
			])
			return result[0].pullRequests;
		} catch(error) {
			console.error(error);
			return null
		}
	}

	const getSettings = async (repoID) => {
		try {
			const result = await Repository.aggregate([
				{ $match: { repo_id: repoID } },
				{ $project: { settings: "$settings" } },
				{ $limit: 1 }
			]);
			return result[0].settings;
		} catch(error) {
			console.error(error);
		};
	}

	const getOverview = async (context) => {
		const repoName = context.payload.repository.name;
		const username = context.payload.repository.owner.login;
    let language_ratios = []
    let sum = 0
    let language_ratio = 0
    let language_and_ratios = {}

    const {data:languages} = await context.octokit.rest.repos.listLanguages({
      owner: username,
      repo: repoName,
    });

    const language_byte_array = Object.values(languages)
    const language_types = Object.keys(languages)

    for (const language_byte of language_byte_array) {
      sum = sum + language_byte
    }
    
    for (const language_byte of language_byte_array) {
      language_ratio = (language_byte / sum) * 100
      language_ratio = Number(language_ratio.toString().match(/^\d+(?:\.\d{0,2})?/))
      language_ratios.push((language_ratio))
    }

    for (let i = 0; i < language_types.length; i++) {
      language_and_ratios[language_types[i]] = language_ratios[i]
    }
    language_and_ratios = Object.entries(language_and_ratios).map(([language_name, percentage]) => ({language_name, percentage}));
    return language_and_ratios;
  }

	const divideSettings = (settings) => {
		const churnSettings = settings.metric_management.highly_churn_file;
		const bugFreqSettings = settings.metric_management.highly_buggy_file;
		const coChangeSettings = settings.metric_management.highly_co_change_file;
		const riskSettings = settings.metric_management.risk_score;
		const sizeSettings = settings.metric_management.pr_size;
		const mergeRateSettings = settings.metric_management.author_merge_rate;
		const pageRankSettings = settings.metric_management.page_rank_score;
		const qualityGateMetrics = settings.quality_gate;

		return { churnSettings, bugFreqSettings, coChangeSettings, riskSettings, sizeSettings, mergeRateSettings, pageRankSettings, qualityGateMetrics };
	}

	const updateCategoriesTable = (metric_name, category, score) => {
		const metric_name_map = {"Risk Score": "**_RISK_***", "Previous Bug Frequency": "Highly Buggy File Ratio", "Code Churn": "Highly Code Churned File Ratio", "PR Size": "PR Size", "Page Rank": "Impact Size", "Author Merge Rate": "Author PR Merge Rate"};
		const metric_header = metric_name_map[metric_name];

		let squareType = ''
		if (category == 0) {
			squareType = `:green_square: **A**`;
		} 
		else if (category == 1) {
			squareType = `:blue_square: **B**`;
		} 
		else if (category == 2) {
			squareType = `:yellow_square: **C**`;
		} 
		else if (category == 3) {
			squareType = `:orange_square: **D**`;
		} 
		else if (category == 4) {
			squareType = `:red_square: **E**`;
		}
		let categoriesTable = `| ` + metric_header + ` | ` + squareType + ` | ${score}`
		if (metric_header != "PR Size"){	
			categoriesTable += `%`;
		}
		categoriesTable += ` |\n`;
		return categoriesTable;
	}

  return {createPullRequestItem, addComment, getBranchFiles, getSpesificPullRequest, getAllActivePullRequests, getSettings, divideSettings, getOverview };
}

module.exports = incrementalHelpers;