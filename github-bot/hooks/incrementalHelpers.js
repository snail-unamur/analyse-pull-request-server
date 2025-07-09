const RepositoryQuery = require("./queries.js");
const fetch = require("node-fetch");
const Repository = require("../models/Repository.js");
const TOKEN = "<some_github_token>";

const incrementalHelpers = () => {
	const getTotalLOC = async (owner, repo, path, branch_sha) => {
		const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch_sha}`, {
			headers: {
				'Authorization': `Token ${TOKEN}`
			}
		})
		const data = await response.json()
		if (data.content) {
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

	const createPullRequestItem = async (context) => {
		const owner = context.payload.repository.owner.login;
		const repo = context.payload.repository.name;
		const number = context.payload.number;
		const response = await context.octokit.graphql(RepositoryQuery, { owner, repo, number });
		const payloadPullRequestInfo = context.payload.pull_request;
		const graphqlPullRequestInfo = response.repository.pullRequest;

		for (let i = 0; i < response.repository.pullRequest.closingIssuesReferences.nodes.length; i++) {
			const node = response.repository.pullRequest.closingIssuesReferences.nodes[i].labels.edges?.map(edge => edge.node);
			const count = node[0]?.issues?.totalCount;
			if (count && count > 0) {
				payloadPullRequestInfo.buggyIssueCount = count;
				break;
			}
		}

		const { data: files } = await context.octokit.pulls.listFiles({
			owner,
			repo,
			pull_number: number
		});

		const lastCommitSha = graphqlPullRequestInfo.commits.edges[0].node.commit.oid;
		const updatedFiles = files.map(file => ({ name: getFileNameFromPath(file.filename), path: file.filename, status: file.status, sha: file.sha, additions: file.additions, deletions: file.deletions, changes: file.changes }));

		for (const file of updatedFiles) {
			file.total_line_of_code = await getTotalLOC(owner, repo, file.path, lastCommitSha);
			file.origin_sha = file.sha;
			file.destination_sha = await getFileShaValue(context, owner, repo, payloadPullRequestInfo.base.sha, file.path);
		}

		payloadPullRequestInfo.analysis = {
			likert_scale: {},
			current_bug_frequencies: [],
			current_code_churns: [],
			current_co_changes: [],
			highly_buggy_file_result: {
				count: 0,
				value: 0,
			},
			highly_churn_file_result: {
				count: 0,
				value: 0,
			},
			pr_size_result: {
				value: 0,
			},
		}

		// Update pull request pr size analysis //

		const size = graphqlPullRequestInfo.additions + graphqlPullRequestInfo.deletions;
		payloadPullRequestInfo.analysis.pr_size_result.value = size;

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
			files: updatedFiles,
			analysis: payloadPullRequestInfo.analysis
		}

		return pullRequest
	}

	const getFileNameFromPath = (path) => {
		let slashIndex = path.lastIndexOf('/');
		let fileName = path.substring(slashIndex + 1);
		return fileName
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
		} catch (error) {
			console.error(error);
		};
	}

	const getSpesificPullRequest = async (repoID, destinationBranchName, pullRequestID) => {
		try {
			const result = await Repository.aggregate([
				{ $match: { repo_id: repoID } },
				{ $unwind: "$analyzed_branches" },
				{ $match: { "analyzed_branches.branch_name": destinationBranchName } },
				{
					$project: {
						pullRequest: {
							$filter: {
								input: "$analyzed_branches.pullRequests",
								as: "pr",
								cond: { $eq: ["$$pr.id", pullRequestID] }
							}
						}
					}
				}
			])
			return result[0].pullRequest[0];
		} catch (error) {
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
				{
					$project: {
						pullRequests: {
							$filter: {
								input: "$analyzed_branches.pullRequests",
								as: "pr",
								cond: { $eq: ["$$pr.state", "open"] }
							}
						}
					}
				}
			])
			return result[0].pullRequests;
		} catch (error) {
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
		} catch (error) {
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

		const { data: languages } = await context.octokit.rest.repos.listLanguages({
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
		language_and_ratios = Object.entries(language_and_ratios).map(([language_name, percentage]) => ({ language_name, percentage }));
		return language_and_ratios;
	}

	const divideSettings = (settings) => {
		const churnSettings = settings.metric_management.highly_churn_file;
		const bugFreqSettings = settings.metric_management.highly_buggy_file;
		const coChangeSettings = settings.metric_management.highly_co_change_file;

		return { churnSettings, bugFreqSettings, coChangeSettings };
	}

	return { createPullRequestItem, getBranchFiles, getSpesificPullRequest, getAllActivePullRequests, getSettings, getOverview, divideSettings };
}

module.exports = incrementalHelpers;