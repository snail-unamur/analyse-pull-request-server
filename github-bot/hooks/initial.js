const initialHelpers = require("./initialHelpers.js");
const initialAnalysisMethods = require("./initialAnalysisMethods.js");

const Repository = require("../models/Repository.js");

const initial = async (octokit, graphqlWithAuth, username, repo) => {

  // Import hooks
  const {getDefaultBranch, getOverview, getDefaultBranchFiles, getPullRequestsDetails} = initialHelpers(octokit, graphqlWithAuth);
  const {initial_calculateCodeChurn, initial_calculateBugFrequencies, initial_calculateCoChangeFiles} = initialAnalysisMethods();

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

  try {
    await Repository.findOneAndUpdate(
      {repo_id: repository.repo_id}, 
      {$set: 
        {repo_id: repository.repo_id,
        repo_name: repository.repo_name,
        repo_owner: repository.repo_owner,
        repo_url: repository.repo_url,
        overview: repository.overview,
        analyzed_branches: repository.analyzed_branches,
        settings: repository.settings,
        is_initial_analyze_finished: true,
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
