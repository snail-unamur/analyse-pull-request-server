const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);

const Repository = require("./models/Repository.js");
const incrementalHelpers = require("./hooks/incrementalHelpers.js");
const incrementalAnalysisMethods = require("./hooks/incrementalAnalysisMethods.js");
const initial = require("./hooks/initial.js");

module.exports = (app) => {
  app.log.info("The app was loaded");

  const { createPullRequestItem, getBranchFiles, getSpesificPullRequest, getAllActivePullRequests, getSettings, divideSettings, getOverview } = incrementalHelpers();
  const { incremental_calculateCurrentCodeChurn, incremental_calculateCurrentBugFrequencies, incremental_calculateCurrentCoChangeFiles, incremental_updateBranch } = incrementalAnalysisMethods();

  ////////////////////////////////
  // Installation Created Event //
  ////////////////////////////////

  app.on("installation_repositories.added", async (context) => {
    const octokit = context.octokit;
    const username = context.payload.installation.account.login;
    const repoNames = context.payload.repositories_added;
    const graphql = context.octokit.graphql;

    try {
      for (const repoName of repoNames) {
        await initial(octokit, graphql, username, repoName.name);
      }
    } catch (err) {
      console.log(err);
    }
  });


  ///////////////////////////////
  // Pull Request Opened Event //
  //////////////////////////////

  app.on("pull_request.opened", async (context) => {
    const repoID = context.payload.repository.id;
    const default_branch = context.payload.repository.default_branch;
    const destinationBranchName = context.payload.pull_request.base.ref;

    if (destinationBranchName == default_branch) {

      const settings = await getSettings(repoID);
      const { churnSettings, bugFreqSettings, coChangeSettings } = divideSettings(settings);

      const pullRequest = await createPullRequestItem(context);
      const branchFiles = await getBranchFiles(repoID, destinationBranchName);

      // Calculate our file metrics 
      incremental_calculateCurrentCodeChurn(pullRequest, branchFiles, churnSettings)
      incremental_calculateCurrentBugFrequencies(pullRequest, branchFiles, bugFreqSettings)
      incremental_calculateCurrentCoChangeFiles(pullRequest, branchFiles, coChangeSettings)

      await addUpdatePullRequest(repoID, destinationBranchName, pullRequest, mode = "add")
    }
  });

  /////////////////////////////////
  // Pull Request Reopened Event //
  /////////////////////////////////

  app.on("pull_request.reopened", async (context) => {
    const repoID = context.payload.repository.id;
    const default_branch = context.payload.repository.default_branch;
    const destinationBranchName = context.payload.pull_request.base.ref;

    if (destinationBranchName == default_branch) {
      const settings = await getSettings(repoID);
      const { churnSettings, bugFreqSettings, coChangeSettings } = divideSettings(settings);
      const pullRequest = await createPullRequestItem(context);
      const branchFiles = await getBranchFiles(repoID, destinationBranchName);

      // Calculate our metrics depending on the new status of the repository
      incremental_calculateCurrentCodeChurn(pullRequest, branchFiles, churnSettings)
      incremental_calculateCurrentBugFrequencies(pullRequest, branchFiles, bugFreqSettings)
      incremental_calculateCurrentCoChangeFiles(pullRequest, branchFiles, coChangeSettings)

      // This check is added for pull request which is close when initial analysis is done and reopened while in incremental analysis
      // Since we do not add closed pull requests in the database with initial analysis, it is necessary to check here
      const ifprExists = await getSpesificPullRequest(repoID, destinationBranchName, pullRequest.id)

      if (ifprExists) {
        await addUpdatePullRequest(repoID, destinationBranchName, pullRequest, mode = "update")
      }
      else {
        await addUpdatePullRequest(repoID, destinationBranchName, pullRequest, mode = "add")
      }
    }
  })

  app.on("pull_request.synchronize", async (context) => {
    const repoID = context.payload.repository.id;
    const default_branch = context.payload.repository.default_branch;
    const destinationBranchName = context.payload.pull_request.base.ref;

    if (destinationBranchName == default_branch) {
      const settings = await getSettings(repoID);
      const { churnSettings, bugFreqSettings, coChangeSettings, sizeSettings, mergeRateSettings } = divideSettings(settings);

      const pullRequest = await createPullRequestItem(context, sizeSettings, mergeRateSettings);
      const branchFiles = await getBranchFiles(repoID, destinationBranchName);

      // Calculate our metrics depending on the new status of the repository
      incremental_calculateCurrentCodeChurn(pullRequest, branchFiles, churnSettings)
      incremental_calculateCurrentBugFrequencies(pullRequest, branchFiles, bugFreqSettings)
      incremental_calculateCurrentCoChangeFiles(pullRequest, branchFiles, coChangeSettings)

      await addUpdatePullRequest(repoID, destinationBranchName, pullRequest, mode = "update")
    }
  });

  ///////////////////////////////
  // Pull Request Closed Event //
  ///////////////////////////////

  app.on("pull_request.closed", async (context) => {
    const repoID = context.payload.repository.id;
    const destinationBranchName = context.payload.pull_request.base.ref;
    const default_branch = context.payload.repository.default_branch;
    const pullRequestID = context.payload.pull_request.id;

    if (destinationBranchName == default_branch) {
      const pullRequest = await getSpesificPullRequest(repoID, destinationBranchName, pullRequestID)
      let branchFiles = await getBranchFiles(repoID, destinationBranchName);

      const isMerged = context.payload.pull_request.merged;
      let state = "closed"

      if (isMerged) {
        state = "merged"
        // Update file metrics in branch
        const newBranchFiles = incremental_updateBranch(pullRequest, branchFiles);

        const { data: prFiles } = await context.octokit.rest.pulls.listFiles({
          owner: context.payload.repository.owner.login,
          repo: context.payload.repository.name,
          pull_number: context.payload.number,
        });

        console.log(`Query ${prFiles.length} is merged.`);

        try { // Update branch files
          const result = await Repository.findOneAndUpdate(
            { repo_id: repoID },
            { $set: { "analyzed_branches.$[branch].files": newBranchFiles } },
            { new: true, arrayFilters: [{ "branch.branch_name": destinationBranchName }] }
          );
        } catch (error) {
          console.error(error);
        }

        const updatedOverview = await getOverview(context)

        try { // Update overview of repo
          const result = await Repository.findOneAndUpdate(
            { repo_id: repoID },
            { $set: { "overview": updatedOverview } },
          );
        } catch (error) {
          console.error(error);
        }

        // Determine active pull requests when a pull request is merged 
        const activePullRequests = await getAllActivePullRequests(repoID, destinationBranchName, pullRequestID);

        const settings = await getSettings(repoID);
        const { churnSettings, bugFreqSettings, coChangeSettings } = divideSettings(settings);

        // Update the analyses of active pull requests 
        activePullRequests.forEach(async (activePullRequest) => {
          activePullRequest.analysis.current_code_churns = [];
          activePullRequest.analysis.current_bug_frequencies = [];
          activePullRequest.analysis.current_co_changes = [];

          // Calculate our metrics depending on the new status of the repository
          incremental_calculateCurrentCodeChurn(activePullRequest, branchFiles, churnSettings)
          incremental_calculateCurrentBugFrequencies(activePullRequest, branchFiles, bugFreqSettings)
          incremental_calculateCurrentCoChangeFiles(activePullRequest, branchFiles, coChangeSettings)

          try { // Update current active pr analysis
            const result = await Repository.findOneAndUpdate(
              { repo_id: repoID },
              { $set: { "analyzed_branches.$[branch].pullRequests.$[pullRequest].analysis": activePullRequest.analysis } },
              { new: true, arrayFilters: [{ "branch.branch_name": destinationBranchName }, { "pullRequest.id": activePullRequest.id }] }
            );
            console.log(`The analysis of pull request number ${activePullRequest.number} is renewed`);
          } catch (error) {
            console.error(error);
            console.log(`The analysis of pull request number ${activePullRequest.number} could not be renewed`)
          }
        });
      }

      try {
        await Repository.findOneAndUpdate(
          { repo_id: repoID },
          { $set: { "analyzed_branches.$[branch].pullRequests.$[pullRequest].state": state } },
          { new: true, arrayFilters: [{ "branch.branch_name": destinationBranchName }, { "pullRequest.id": pullRequestID }] }
        )
        console.log("Pull request state changed successfully. Changed to: " + state);
      } catch (error) {
        console.error(error);
        console.log("Pull request state could not be changed.");
      }
    }
  });

  //////////////////////////////
  // Repository Deleted Event //
  //////////////////////////////

  app.on("repository.deleted", async (context) => {
    const repoID = context.payload.repository.id;
    await Repository.deleteOne({ repo_id: repoID });
  });

  //////////////////////////////
  // Repository Renamed Event //
  //////////////////////////////

  app.on("repository.renamed", async (context) => {
    const repoID = context.payload.repository.id;
    const repoName = context.payload.repository.name;

    try {
      await Repository.findOneAndUpdate(
        { repo_id: repoID },
        { $set: { repo_name: repoName } },
        { new: true }
      )
      console.log("Repository name updated successfully.");
    } catch (error) {
      console.error(error);
    }
  });

  ///////////////////////////
  // Branch Deleted Event //
  //////////////////////////

  app.on("delete", async (context) => {
    const repoID = context.payload.repository.id;
    const ifBranchDeleted = context.payload.ref_type === "branch";

    if (ifBranchDeleted) {
      try {
        await Repository.updateOne(
          { repo_id: repoID },
          { $pull: { analyzed_branches: { branch_name: context.payload.ref } } }
        )
        console.log("Branch deleted successfully.");
      } catch (err) {
        console.error(err);
      }
    }
  });

  ////////////////////////////////
  // Pull Request Labeled Event //
  ////////////////////////////////

  app.on("pull_request.labeled", async (context) => {
    const repoID = context.payload.repository.id;
    const destinationBranchName = context.payload.pull_request.base.ref;
    const pullRequestID = context.payload.pull_request.id;
    const updatedLabels = context.payload.pull_request.labels.map((label) => label.name);

    try {
      await Repository.findOneAndUpdate(
        { repo_id: repoID },
        { $set: { "analyzed_branches.$[branch].pullRequests.$[pullRequest].labels": updatedLabels } },
        { new: true, arrayFilters: [{ "branch.branch_name": destinationBranchName }, { "pullRequest.id": pullRequestID }] }
      )
      console.log("Pull request labels added successfully. Changed to: ", updatedLabels);
    } catch (error) {
      console.error(error);
    }
  });

  //////////////////////////////////
  // Pull Request Unlabeled Event //
  //////////////////////////////////

  app.on("pull_request.unlabeled", async (context) => {
    const repoID = context.payload.repository.id;
    const destinationBranchName = context.payload.pull_request.base.ref;
    const pullRequestID = context.payload.pull_request.id;
    const newLabels = context.payload.pull_request.labels;
    const updatedLabels = newLabels.map((label) => label.name);

    try {
      await Repository.findOneAndUpdate(
        { repo_id: repoID },
        { $set: { "analyzed_branches.$[branch].pullRequests.$[pullRequest].labels": updatedLabels } },
        { new: true, arrayFilters: [{ "branch.branch_name": destinationBranchName }, { "pullRequest.id": pullRequestID }] }
      )
      console.log("Pull request labels deleted successfully. Changed to: ", updatedLabels);
    } catch (error) {
      console.error(error);
    }
  });

};

const addUpdatePullRequest = async (repoID, destinationBranchName, pullRequest, mode) => {
  if (mode == "update") {
    try {
      const result = await Repository.findOneAndUpdate(
        { repo_id: repoID },
        { $set: { "analyzed_branches.$[branch].pullRequests.$[pullRequest]": pullRequest } },
        { arrayFilters: [{ "branch.branch_name": destinationBranchName }, { "pullRequest.id": pullRequest.id }], new: true }
      );
      console.log(`Successfully update pull request number ${pullRequest.number}`);
    } catch (error) {
      console.error(error);
    }
  }
  else if (mode == "add") {
    try {
      const result = await Repository.updateOne(
        { repo_id: repoID },
        { $push: { "analyzed_branches.$[branch].pullRequests": pullRequest } },
        { arrayFilters: [{ "branch.branch_name": destinationBranchName }], new: true }
      );
      console.log(`Successfully added pull request number ${pullRequest.number}`);
    } catch (error) {
      console.error(error);
    }
  }
}
