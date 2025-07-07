const RepositoryQuery = require("./queries.js");
const fetch = require("node-fetch");

const Repository = require("../models/Repository.js");
const TOKEN = "<some_github_token>";

// Get all the pull requests
const initialHelpers = (octokit, graphqlWithAuth) => {

  const getDefaultBranch = async (username, repo) => {
    // Get the default branch
    const {data: repoInfo} = await octokit.repos.get({
      owner: username,
      repo: repo,
    }); 
    return repoInfo
  }

  const getDefaultBranchFiles = async (username, repo, path, default_branch) => {
    const result = await octokit.repos.getContent({
      owner: username,
      repo: repo,
      path: path,
      ref: default_branch
    });
    const files = [];
    for (const file of result.data) {
      if (file.type === "dir") {
          files.push(...(await getDefaultBranchFiles(username, repo, file.path, default_branch)));
      } else {
        if(getFileNameFromPath(file.path).endsWith(".java")){
          file.total_line_of_code = await getTotalLOC(username, repo, file.path, default_branch);
          files.push({ name: file.name, path: file.path, sha: file.sha, total_line_of_code: file.total_line_of_code, total_code_churn: 0, total_buggy_pr_count: 0, total_pr_count: 0, total_bug_frequency: 0, total_co_changes: [] });
        }
      }
    }
    return files;
  }

  const getTotalLOC = async (owner, repo, path, branch_sha) => {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch_sha}`, {
      headers: {
        'Authorization': `Token ${TOKEN}`
      }
    })
    const data = await response.json()
    if(data.content){
      const content = Buffer.from(data.content, 'base64').toString('binary'); // decode base64-encoded content
      const numLines = content.split('\n').filter(line => line.trim() !== "").length;
      return numLines
    }
    else {
      return 0
    }
  }

  const getFileShaValue = async (octokit, owner, repo, baseCommitSha, fileName) => {
		try { 
      const { data: fileData } = await octokit.rest.repos.getContent({
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

  const getCollaborators = async (username, repo) => {
    let collaborators = []

    const {data: collaboratorsInfo} = await octokit.rest.repos.listCollaborators({
      owner: username,
      repo: repo,
    });

    for (const collaborator of collaboratorsInfo) {
      const {data: collaboratorInfo} = await octokit.rest.users.getByUsername({
        username: collaborator["login"]
      });
      
      let name = collaboratorInfo["login"] // Some GitHub accounts do not have display name, in that case we use their login name
      if (collaboratorInfo["name"]) {
        name = collaboratorInfo["name"]
      }
      collaborators.push({collaborator_name: name, collaborator_login: collaboratorInfo["login"], collaborator_id: collaboratorInfo["id"]})
    }
    return collaborators;
  }

  const getOverview = async (username, repo) => {
    let language_ratios = []
    let sum = 0
    let language_ratio = 0
    let language_and_ratios = {}

    const {data:languages} = await octokit.rest.repos.listLanguages({
      owner: username,
      repo: repo,
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

  const getPullRequestsDetails = async (owner, repository, baseBranch) => {
    const sizeCategories = repository.settings.metric_management.pr_size;
    const authorMergeRateCategories = repository.settings.metric_management.author_merge_rate;
    const repo = repository["repo_name"]
    let everyPullRequests = await octokit.paginate(
      "GET /repos/:owner/:repo/pulls",
      {
        owner,
        repo,
        state: "all",
        base: baseBranch,
        sort: "created",
        direction: "asc",
        per_page: 100,
      }
    );

    let mergedPullRequests = []
    let activePullRequests = []

    for (const pullRequest of everyPullRequests) {
      if(pullRequest.merged_at !== null){
        pullRequest.state = "merged";
      }

      let author = {
        name: pullRequest.user.name,
        login: pullRequest.user.login,
        id: pullRequest.user.id,
        cur_total_risk_score: 0,
        cur_pull_request_count: 0,
        cur_merged_pull_request_count: 0,
      }
      
      pullRequest.author = author;

      pullRequest.analysis = {
        likert_scale: {},
        quality_gate: {},
        risk_score: {},
        current_bug_frequencies: [],
        current_code_churns: [],
        current_co_changes: [],
        highly_buggy_file_result: {
          count: 0,
          category: 0,
        },
        highly_churn_file_result: {
          count: 0,
          category: 0,
        },
        pr_size_result: {},
        author_merge_rate_result: {},        
        current_page_rank_result: {},
      }

      // Update collaborator and author total information
      let collaborator = repository.collaborators.find(collaborator => collaborator.login === pullRequest.author.login);
      
      //This check is added to determine whether the collaborator should be pushed to the repository collaborators array after below changes done
      let ifCollaboratorExist = true 

      if(!collaborator){
        ifCollaboratorExist = false
        collaborator = {
          name: pullRequest.author.name,
          id: pullRequest.author.id,
          login: pullRequest.author.login,
          role: "contributor",
          is_active: false,
          total_risk_score: 0,
          total_pull_request_count: 0,
          total_merged_pull_request_count: 0,
        }
      }

      collaborator.total_pull_request_count += 1;

      if(pullRequest.state == "merged"){
        collaborator.total_merged_pull_request_count += 1;
      }

      if(!ifCollaboratorExist){
        repository.collaborators.push(collaborator);
      }

      pullRequest.author.cur_pull_request_count = collaborator.total_pull_request_count;
      pullRequest.author.cur_merged_pull_request_count = collaborator.total_merged_pull_request_count;
      
      const authorMergeRate = pullRequest.author.cur_merged_pull_request_count / pullRequest.author.cur_pull_request_count;
      pullRequest.analysis.author_merge_rate_result.category = calculateMetricCategory(authorMergeRate, authorMergeRateCategories, false);

      if(pullRequest.state == "merged"){
        mergedPullRequests.push(pullRequest)
      }

      else if(pullRequest.state == "open"){
        activePullRequests.push(pullRequest)
      }
    }

    let allPullRequests = []

    //Sort mergedPullRequests by merged_at date
    mergedPullRequests.sort((a, b) => (a.merged_at > b.merged_at) ? 1 : -1)
    
    //Concat merged pull requests and active pull requests
    temp = [...mergedPullRequests, ...activePullRequests]

    let previousItem = null;
    const maxRetries = 3; // To handle ETIMEDOUT error

    for (let pullRequest of temp) {
      previousItem = pullRequest; // Resend requests for previous request when ETIMEDOUT or RATE LIMIT error occurs
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {  // To check rate limit
          const number = pullRequest.number
          const response = await graphqlWithAuth(RepositoryQuery, {owner, repo, number});
          const pullRequestGraphQLInfo = response.repository.pullRequest;

          if(pullRequestGraphQLInfo.additions + pullRequestGraphQLInfo.deletions > 0 && 
            pullRequestGraphQLInfo.additions + pullRequestGraphQLInfo.deletions < 30000
            ){ // To filter empty pull requests like revert commits or too big pull requests
            const {data: allFiles} = await octokit.pulls.listFiles({ 
              owner,
              repo,
              pull_number: number
            });
            
            if (allFiles.some(file => file.filename.endsWith('.java'))) {
              const files = allFiles.filter(file => file.filename.endsWith('.java')) 
              const lastCommitSha = pullRequestGraphQLInfo.commits.edges[0].node.commit.oid;
              pullRequest.buggyIssueCount = 0;
              for(let i = 0; i < pullRequestGraphQLInfo.closingIssuesReferences.nodes.length; i++){
                const node = pullRequestGraphQLInfo.closingIssuesReferences.nodes[i].labels.edges?.map(edge => edge.node);
                const count = node[0]?.issues?.totalCount;
                if(count && count > 0){ 
                  pullRequest.buggyIssueCount = count;
                  break;
                }
              }

              pullRequest.files = files.map(file => ({ name: getFileNameFromPath(file.filename), path: file.filename, sha: file.sha, status: file.status, additions: file.additions, deletions: file.deletions, changes: file.changes })); //Add status
              for(const file of pullRequest.files){
                file.total_line_of_code = await getTotalLOC(owner, repo, file.path, lastCommitSha);
                file.origin_sha = file.sha;
                file.destination_sha = await getFileShaValue(octokit, owner, repo, pullRequest.base.sha, file.path);
              }
              pullRequest.labels = pullRequest.labels.map(node => node.name)
              pullRequest.sha = lastCommitSha;

              pullRequest.additions = pullRequestGraphQLInfo.additions;
              pullRequest.deletions = pullRequestGraphQLInfo.deletions;

              const size = pullRequest.additions + pullRequest.deletions;

              // Update pull request pr size analysis //
              pullRequest.analysis.pr_size_result.category = calculateMetricCategory(size, sizeCategories, true);

              pullRequest.changes = pullRequestGraphQLInfo.changes;
              pullRequest.mergedBy = pullRequestGraphQLInfo.mergedBy;
              pullRequest.reviews = pullRequestGraphQLInfo.reviews.edges.map(({ node }) => ({ name: node.author.name, login:node.login, id: node.author.id }));
              pullRequest.assignees = pullRequestGraphQLInfo.assignees.edges.map(({ node }) => ({ name: node.name, login:node.login, id: node.id }));

              if(pullRequestGraphQLInfo.author){
                pullRequest.author.name = pullRequestGraphQLInfo.author.name;
                // COLLABORATOR PART => Open this code if you own the repository
                // const collaborator = repository.collaborators.find(collaborator => collaborator.login === pullRequest.author.login);
                // collaborator.name = pullRequest.author.name;
              }
              allPullRequests.push(pullRequest)
            }
          }
          else {
            // If there is no commit in pullrequest, remove current pr from allPullRequests
            console.log("pullRequest ", pullRequest.number + " is empty")
          }
          console.log("pullRequest ", pullRequest.number + " done")
          retryCount = maxRetries; // To break while loop
        } catch (error) {
          if (error.status === 403 && error.headers && error.response.headers['x-ratelimit-remaining'] === '0') {
            await waitUntilTokenRefreshed(octokit);
            pullRequest = previousItem; // Retry the request for previous item
          } 
          else if (error.name === 'FetchError' && error.code === 'ETIMEDOUT') {
            console.log("pullRequest ", pullRequest.number + " is retrying because of ETIMEDOUT error")
            retryCount++; // Max retry count is 3 for time out error per pull request
            pullRequest = previousItem; // Retry the request for previous item
          }
          else {
            console.error(`Error processing pull request ${pullRequest.number}:`, error);
          }
        }
      }
    }

    const allPullRequestsDetails = allPullRequests.map(pullRequest => {
      return {
        id: pullRequest.id,
        number: pullRequest.number,
        title: pullRequest.title,
        description: pullRequest.body,
        url: pullRequest.html_url,
        sha: pullRequest.sha,
        state: pullRequest.state,
        labels: pullRequest.labels,
        buggyIssueCount: pullRequest.buggyIssueCount,
        createdAt: pullRequest.created_at,
        branch_name: {
          origin: pullRequest.head.ref,
          destination: pullRequest.base.ref,
        },
        lines: {
          additions: pullRequest.additions,
          deletions: pullRequest.deletions,
          changes: pullRequest.changes,
        },
        merger: pullRequest.mergedBy,
        reviewers: pullRequest.reviews,
        assignees: pullRequest.assignees,
        files: pullRequest.files,
        author: {
          name: pullRequest.author.name,
          id: pullRequest.author.id,
          login: pullRequest.author.login,
          cur_avg_risk_score: 0,
          cur_pull_request_count: pullRequest.author.cur_pull_request_count,
          cur_merged_pull_request_count: pullRequest.author.cur_merged_pull_request_count,
          weekly_pull_request_count: 0,
        },
        analysis: pullRequest.analysis,
      };
    })
    return allPullRequestsDetails;
  }

  const getFileNameFromPath = (path) => {
    let slashIndex = path.lastIndexOf('/');
    let fileName = path.substring(slashIndex + 1);
    return fileName
  }

  // Each github account has limited token request per hour
  // This function waits until the token request limit is reset if the limit is reached
  async function waitUntilTokenRefreshed(octokit) {
    const rateLimit = await octokit.rateLimit.get();
    const resetTime = rateLimit.data.rate.reset * 1000; // convert to milliseconds
    const sleepTime = resetTime - new Date().getTime();
    console.log(`Rate limit reached. Sleeping for ${sleepTime / 60000} minutes.`);
    await new Promise(resolve => setTimeout(resolve, sleepTime + 1000)); // add 1 second to make sure the rate limit has been reset
  }

  const calculateMetricCategory = (metric_value, metricSettings, shouldBeDivideByHundred) => {
    let category;

    if(shouldBeDivideByHundred){
      metric_value = metric_value / 100;
    }

    if (metricSettings.e.lower_bound / 100 <= metric_value && metric_value <= metricSettings.e.upper_bound / 100) {
      category = 4;
    }
    else if (metricSettings.d.lower_bound / 100 < metric_value && metric_value <= metricSettings.d.upper_bound / 100) {
      category = 3;
    }
    else if (metricSettings.c.lower_bound / 100 < metric_value && metric_value <= metricSettings.c.upper_bound / 100) {
      category = 2;
    }
    else if (metricSettings.b.lower_bound / 100 < metric_value && metric_value <= metricSettings.b.upper_bound / 100) {
      category = 1;
    }
    else if (metricSettings.a.lower_bound / 100 <= metric_value && metric_value <= metricSettings.a.upper_bound / 100) {
      category = 0;
    }

    return category
  }

  return {getDefaultBranch, getCollaborators, getOverview, getDefaultBranchFiles, getPullRequestsDetails, calculateMetricCategory};
}

module.exports = initialHelpers;