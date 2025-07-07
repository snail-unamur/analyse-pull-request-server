const initialHelpers = require("./initialHelpers.js");
const initialAnalysisMethods = require("./initialAnalysisMethods.js");

const Repository = require("../models/Repository.js");
const User = require("../models/User.js");

const axios = require("axios");

const initial = async (octokit, graphqlWithAuth, username, repo) => {

  // Import hooks
  const {getDefaultBranch, getOverview, getDefaultBranchFiles, getPullRequestsDetails} = initialHelpers(octokit, graphqlWithAuth);
  const {initial_calculateCodeChurn, initial_calculateBugFrequencies, initial_calculateCoChangeFiles, initial_calculateRiskScore} = initialAnalysisMethods();

  /////////////////////////////
  // General Repository Info //
  /////////////////////////////

  const repoInfo = await getDefaultBranch(username, repo);

  const repository = new Repository({
    repo_id: repoInfo["id"],
    repo_name: repoInfo["name"],
    repo_owner: repoInfo["owner"]["login"],
    repo_url: repoInfo["html_url"],
  })

  let default_branch = repoInfo["default_branch"]
  console.log("Default Branch: ", default_branch)

  repository.analyzed_branches.push({
    branch_name: default_branch,
  })

  ////////////////////////
  // Callgraph Creation //
  ////////////////////////

  // const { user_gh_access_token: githubToken } = await User.findOne({ user_login: repoInfo['owner']['login'] });

  // const { data: srcPath } = await axios.post(`http://localhost:8080/api/v1/callgraph/create-save`, {
  //  projectIdentifier: repoInfo["full_name"],
  //  branchName: repoInfo["default_branch"],
  //  githubToken,
  // })

  // repository.source_code_location_path = srcPath;

  ///////////////////
  // Collaborators //
  ///////////////////

  // This section is commented out because we use a fork project for testing purposes
  // Since we need to need to have ownership of a project to be able to add our bot, we fork these open source projects

  /*
  const collaboratorsInfo = await getCollaborators(username, repo);
  
  for(const collaboratorInfo of collaboratorsInfo) {
    const check = await User.findOne({user_github_id: collaboratorInfo["collaborator_id"]})
    let user_role = ""
    if(repoInfo["owner"]["id"] == collaboratorInfo["collaborator_id"]){
      user_role = "owner"
    } else {
      user_role = "collaborator"
    }

    if(!check) {
      const collaborator = new User({
        user_github_id: collaboratorInfo["collaborator_id"],
        user_name: collaboratorInfo["collaborator_name"],
        user_login: collaboratorInfo["collaborator_login"],
        user_repo_ids: [repository.repo_id],
      })
      await collaborator.save()
      repository.collaborators.push({ name: collaborator.user_name, id: collaborator.user_github_id, login: collaborator.user_login, role: user_role, total_pull_request_count: 0, total_merged_pull_request_count: 0, total_risk_score: 0 })
    } else {
      repository.collaborators.push({ name: check.user_name, id: check.user_github_id, login: check.user_login, role: user_role, total_pull_request_count: 0, total_merged_pull_request_count: 0, total_risk_score: 0 })
    }
  }
  console.log("Collaborators calculated");
  */

  //////////////
  // Overview //
  //////////////

  const overview = await getOverview(username, repo);
  repository.overview = overview
  console.log("Overview calculated");

  ////////////////////////////////////////
  // Default Branch Information - Files //
  ////////////////////////////////////////

  const branch_files_in_given_path = await getDefaultBranchFiles(username, repo, "", default_branch);
  
  repository.analyzed_branches[0].files = branch_files_in_given_path
  console.log("Main Branch Files calculated")

  /////////////////////////////////////////////////
  // Default Branch Information - Pull Requests //
  ////////////////////////////////////////////////
  
  repository.settings = {} // This line is added for settings to be added to the database

  const initialPullRequestsDetails = await getPullRequestsDetails(username, repository, default_branch);
  repository.analyzed_branches[0].pullRequests = initialPullRequestsDetails

  initial_calculateBugFrequencies(repository)
  console.log("Bug Frequencies calculated")

  initial_calculateCodeChurn(repository)
  console.log("Code Churn calculated")

  initial_calculateCoChangeFiles(repository)
  console.log("Co-Change Files calculated")

  initial_calculateRiskScore(repository)
  console.log("Risk Score calculated")

  try {
    await Repository.findOneAndUpdate(
      {repo_id: repository.repo_id}, 
      {$set: 
        {repo_id: repository.repo_id,
        repo_name: repository.repo_name,
        repo_owner: repository.repo_owner,
        repo_url: repository.repo_url,
        collaborators: repository.collaborators,
        overview: repository.overview,
        analyzed_branches: repository.analyzed_branches,
        settings: repository.settings,
        is_initial_analyze_finished: true,
        source_code_location_path: repository.source_code_location_path,
        }
      },
      {new: true, upsert: true}
    )
    console.log("Repository " + repository.repo_name + " successfully saved to database")
    return true;
  } catch (error) {
    console.log(error)
    return false;
  }
};

module.exports = initial;
