const mongoose = require("mongoose");
mongoose.connect(process.env.MONGO_URI);

const Repository = require("./models/Repository.js");
const incrementalHelpers = require("./hooks/incrementalHelpers.js");
const incrementalAnalysisMethods = require("./hooks/incrementalAnalysisMethods.js");
const initial = require("./hooks/initial.js");

module.exports = (app) => {
  app.log.info("The app was loaded");

  const { createPullRequestItem, addComment, getBranchFiles, getSpesificPullRequest, getAllActivePullRequests, getSettings, divideSettings, getOverview } = incrementalHelpers();
  const { incremental_calculateCurrentCodeChurn, incremental_calculateCurrentBugFrequencies, incremental_calculateCurrentCoChangeFiles, incremental_updateBranch, incremental_calculateRiskScore, incremental_calculateMergeRate, incremental_calculate_pagerank } = incrementalAnalysisMethods();

  ////////////////////////////////
  // Installation Created Event //
  ////////////////////////////////

  app.on("installation_repositories.added", async (context) => {
    const octokit = context.octokit;
    const username = context.payload.installation.account.login;
    const repoNames = context.payload.repositories_added;
    const graphql = context.octokit.graphql;

    try {
      for(const repoName of repoNames){
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
		const projectIdentifier = context.payload.repository.full_name;

    if(destinationBranchName == default_branch){

      const settings = await getSettings(repoID);
      const {churnSettings, bugFreqSettings, coChangeSettings, riskSettings, sizeSettings, mergeRateSettings, pageRankSettings, qualityGateMetrics} = divideSettings(settings);
      
      const pullRequest = await createPullRequestItem(context, sizeSettings, mergeRateSettings); 
      const branchFiles = await getBranchFiles(repoID, destinationBranchName);
      
      // Calculate our file metrics 
      incremental_calculateCurrentCodeChurn(pullRequest, branchFiles, churnSettings)
      incremental_calculateCurrentBugFrequencies(pullRequest, branchFiles, bugFreqSettings)
      incremental_calculateCurrentCoChangeFiles(pullRequest, branchFiles, coChangeSettings)
			await incremental_calculate_pagerank(pullRequest, projectIdentifier, pageRankSettings) 
      incremental_calculateRiskScore(pullRequest, riskSettings, qualityGateMetrics)

      await addUpdatePullRequest(repoID, destinationBranchName, pullRequest, mode="add")

      // Increase author's total pull request count in branch
      // await increaseAuthorTotalPullRequest(repoID, pullRequest, destinationBranchName);

      await addComment(context, pullRequest, settings);
    }
  });

  /////////////////////////////////
  // Pull Request Reopened Event //
  /////////////////////////////////

  app.on("pull_request.reopened", async (context) => {
    const repoID = context.payload.repository.id;
    const default_branch = context.payload.repository.default_branch;
    const destinationBranchName = context.payload.pull_request.base.ref;
		const projectIdentifier = context.payload.repository.full_name;

    if(destinationBranchName == default_branch){
      
      const settings = await getSettings(repoID);
      const {churnSettings, bugFreqSettings, coChangeSettings, riskSettings, sizeSettings, mergeRateSettings, pageRankSettings, qualityGateMetrics} = divideSettings(settings);
      const pullRequest = await createPullRequestItem(context, sizeSettings, mergeRateSettings); 
      const branchFiles = await getBranchFiles(repoID, destinationBranchName);

      // Calculate our metrics depending on the new status of the repository
      incremental_calculateCurrentCodeChurn(pullRequest, branchFiles, churnSettings)
      incremental_calculateCurrentBugFrequencies(pullRequest, branchFiles, bugFreqSettings)
      incremental_calculateCurrentCoChangeFiles(pullRequest, branchFiles, coChangeSettings)
			await incremental_calculate_pagerank(pullRequest, projectIdentifier, pageRankSettings) 
      incremental_calculateRiskScore(pullRequest, riskSettings, qualityGateMetrics)

      // This check is added for pull request which is close when initial analysis is done and reopened while in incremental analysis
      // Since we do not add closed pull requests in the database with initial analysis, it is necessary to check here
      const ifprExists = await getSpesificPullRequest(repoID, destinationBranchName, pullRequest.id)

      if(ifprExists){
        await addUpdatePullRequest(repoID, destinationBranchName, pullRequest, mode="update")
      }
      else {
        await addUpdatePullRequest(repoID, destinationBranchName, pullRequest, mode="add")

        // Increase author's total pull request count in branch
        try { 
          const result = await Repository.findOneAndUpdate(
            { repo_id: repoID },
            { $inc: { "collaborators.$[collaborator].total_pull_request_count": 1 } },
            { arrayFilters: [{ "collaborator.login": pullRequest.author.login}], new: true }
          );
          
        } catch (error) {
          console.error(error);
        }
      }
      // Create and save the impact graph png
      // impactGraphUrl = await incremental_generate_save_impact_graph(repoID, context.payload.pull_request.number);
      await addComment(context, pullRequest, settings);
    }
  })

  ////////////////////////////////////
  // Pull Request Synchronize Event //
  ////////////////////////////////////

  app.on("pull_request.synchronize", async (context) => {
    const repoID = context.payload.repository.id;
    const default_branch = context.payload.repository.default_branch;
    const destinationBranchName = context.payload.pull_request.base.ref;
		const projectIdentifier = context.payload.repository.full_name;

    if(destinationBranchName == default_branch){
      const settings = await getSettings(repoID);
      const {churnSettings, bugFreqSettings, coChangeSettings, riskSettings, sizeSettings, mergeRateSettings, pageRankSettings, qualityGateMetrics} = divideSettings(settings);

      const pullRequest = await createPullRequestItem(context, sizeSettings, mergeRateSettings);
      const branchFiles = await getBranchFiles(repoID, destinationBranchName);

      // Calculate our metrics depending on the new status of the repository
      incremental_calculateCurrentCodeChurn(pullRequest, branchFiles, churnSettings)
      incremental_calculateCurrentBugFrequencies(pullRequest, branchFiles, bugFreqSettings)
      incremental_calculateCurrentCoChangeFiles(pullRequest, branchFiles, coChangeSettings)
			await incremental_calculate_pagerank(pullRequest, projectIdentifier, pageRankSettings) 
      incremental_calculateRiskScore(pullRequest, riskSettings, qualityGateMetrics)

      const oldPullRequest = await getSpesificPullRequest(repoID, destinationBranchName, pullRequest.id)
      const oldRiskScore = oldPullRequest.analysis.risk_score.score
      
      const newRiskScore = pullRequest.analysis.risk_score.score

      const changeAmount = newRiskScore - oldRiskScore

      // Update author's total risk score 
      if(pullRequest.author.login == context.payload.sender.login){ // Check if the author is the one who pushed the changes
        try { 
          const result = await Repository.findOneAndUpdate(
            { repo_id: repoID },
            { $inc: {"collaborators.$[collaborator].total_risk_score": changeAmount}},
            { arrayFilters: [{ "collaborator.login": pullRequest.author.login}], new: true }
          );

          console.log(`The total risk score of ${pullRequest.author} is updated in collaborators`);
          const updatedRiskScore = result.collaborators.find(collaborator => collaborator.login == pullRequest.author.login).total_risk_score
          
          // Update author's total risk score in pullRequest
          const result2 = await Repository.findOneAndUpdate(
            { repo_id: repoID },
            { $set: { "analyzed_branches.$[branch].pullRequests.$[pullRequest].author.cur_total_risk_score": updatedRiskScore } },
            { new: true, arrayFilters: [{ "branch.branch_name": destinationBranchName }, { "pullRequest.id": pullRequest.id }] }
          );
          console.log(`The total risk score of ${pullRequest.author} is updated in pullRequests`);

          // Create and save the impact graph png
          // impactGraphUrl = await incremental_generate_save_impact_graph(repoID, context.payload.pull_request.number);
        } catch (error) {
          console.error(error);
        }
      }

      await addUpdatePullRequest(repoID, destinationBranchName, pullRequest, mode="update")

      addComment(context, pullRequest, settings);
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
    const projectIdentifier = context.payload.repository.full_name;

    if(destinationBranchName == default_branch){
      const pullRequest = await getSpesificPullRequest(repoID, destinationBranchName, pullRequestID)
      let branchFiles = await getBranchFiles(repoID, destinationBranchName);

      const isMerged = context.payload.pull_request.merged;
      let state = "closed"

      if (isMerged) {
        state = "merged"
        // Update file metrics in branch
        const newBranchFiles = incremental_updateBranch(pullRequest, branchFiles);

				const { source_code_location_path: srcPath } = await Repository.findOne(
					{ repo_id: repoID },
					'source_code_location_path'
				);

				const { data: prFiles } = await context.octokit.rest.pulls.listFiles({
					owner: context.payload.repository.owner.login,
					repo: context.payload.repository.name,
					pull_number: context.payload.number,
				});

        console.log(`Query ${prFiles.length} is merged.`);

				const changedFilesWithPath = prFiles.map((file) => {
					const index = file.filename.lastIndexOf('/') + 1;

					return {
						filePath: srcPath + '/' + file.filename,
						fileName: file.filename.substring(index),
						status: file.status.toUpperCase(),
					};
				});

				// Update the callgraph
				// axios.post(`http://localhost:8080/api/v1/callgraph/update`, {
				//	projectIdentifier,
				//	prNumber: context.payload.pull_request.number,
				//	originBranchSha: context.payload.pull_request.head.sha,
				//	destinationBranchSha: context.payload.pull_request.base.sha,
				//	destinationBranchName: context.payload.pull_request.base.ref,
				//	changedFilesWithPath,
				// });

        try { // Update branch files
          const result = await Repository.findOneAndUpdate(
            { repo_id: repoID },
            { $set: { "analyzed_branches.$[branch].files": newBranchFiles} },
            { new: true, arrayFilters: [{ "branch.branch_name": destinationBranchName }] }
          );
        } catch(error) {
          console.error(error);
        }

        try { // Increase author's merged pull request count in branch
          const result = await Repository.findOneAndUpdate(
            { repo_id: repoID },
            { $inc: { "collaborators.$[collaborator].total_merged_pull_request_count": 1 } },
            { arrayFilters: [{ "collaborator.login": pullRequest.author.login}], new: true }
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
        const {churnSettings, bugFreqSettings, coChangeSettings, riskSettings, sizeSettings, mergeRateSettings, pageRankSettings, qualityGateMetrics} = divideSettings(settings);

        // Update the analyses of active pull requests 
        activePullRequests.forEach(async (activePullRequest) => {
          activePullRequest.analysis.current_code_churns = [];
          activePullRequest.analysis.current_bug_frequencies = [];
          activePullRequest.analysis.current_co_changes = [];

          // Calculate our metrics depending on the new status of the repository
          incremental_calculateCurrentCodeChurn(activePullRequest, branchFiles, churnSettings)
          incremental_calculateCurrentBugFrequencies(activePullRequest, branchFiles, bugFreqSettings)
          incremental_calculateCurrentCoChangeFiles(activePullRequest, branchFiles, coChangeSettings)
          await incremental_calculate_pagerank(activePullRequest, projectIdentifier, pageRankSettings)

          // Normally, merge rate is calculated when a pull request is created with createPullRequestItem function
          // However, when a pull request is merged, other active pull request should not created with createPullRequestItem function
          // Therefore, we need to calculate merge rate of active pull requests with external function here
          await incremental_calculateMergeRate(activePullRequest, repoID, mergeRateSettings) 
          incremental_calculateRiskScore(activePullRequest, riskSettings, qualityGateMetrics)

          try { // Update current active pr analysis
            const result = await Repository.findOneAndUpdate(
              { repo_id: repoID },
              { $set: { "analyzed_branches.$[branch].pullRequests.$[pullRequest].analysis": activePullRequest.analysis } },
              { new: true, arrayFilters: [{ "branch.branch_name": destinationBranchName }, { "pullRequest.id": activePullRequest.id }] }
            );
            console.log(`The analysis of pull request number ${activePullRequest.number} is renewed`);

            // Create and save the impact graph png
            // impactGraphUrl = await incremental_generate_save_impact_graph(repoID, context.payload.pull_request.number);
          } catch (error) {
            console.error(error);
            console.log(`The analysis of pull request number ${activePullRequest.number} could not be renewed`)
          }

          // addComment(context, activePullRequest, settings, impactGraphUrl);
        });
      }

      try {
        await Repository.findOneAndUpdate(
          { repo_id: repoID },
          { $set: { "analyzed_branches.$[branch].pullRequests.$[pullRequest].state": state } },
          { new: true, arrayFilters: [{ "branch.branch_name": destinationBranchName }, { "pullRequest.id": pullRequestID }] }
        )
          console.log("Pull request state changed successfully. Changed to: " + state);
        } catch(error) {
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
        { new: true} 
      )
      console.log("Repository name updated successfully.");
    } catch(error) {
      console.error(error);
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
    } catch(error) {
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
        { new: true, arrayFilters: [{ "branch.branch_name": destinationBranchName }, { "pullRequest.id": pullRequestID }]}
      )
      console.log("Pull request labels deleted successfully. Changed to: ", updatedLabels);
    } catch(error) {
      console.error(error);
    }
  });

  /////////////////////////////////
  // Pull Request Assigned Event //
  /////////////////////////////////

  app.on("pull_request.assigned", async (context) => {
    const repoID = context.payload.repository.id;
    const destinationBranchName = context.payload.pull_request.base.ref;
    const pullRequestID = context.payload.pull_request.id;

    const updatedAssignees = context.payload.pull_request.assignees.map((assignee) => ({ name: assignee.login, id: assignee.id }));

    try {
      await Repository.findOneAndUpdate(
        { repo_id: repoID },
        { $set: { "analyzed_branches.$[branch].pullRequests.$[pullRequest].assignees": updatedAssignees } },
        { new: true, arrayFilters: [{ "branch.branch_name": destinationBranchName},{"pullRequest.id": pullRequestID}] }
      )
      console.log("Assignees added successfully. Changed to: ", updatedAssignees);
    } catch(error) {
      console.error(error);
    }
  });

  ///////////////////////////////////
  // Pull Request Unassigned Event //
  ///////////////////////////////////

  app.on("pull_request.unassigned", async (context) => {
    const repoID = context.payload.repository.id;
    const destinationBranchName = context.payload.pull_request.base.ref;
    const pullRequestID = context.payload.pull_request.id;
    const updatedAssignees = context.payload.pull_request.assignees.map((assignee) => ({ name: assignee.login, id: assignee.id }));
    
    try {
      await Repository.findOneAndUpdate(
        { repo_id: repoID },
        { $set: { "analyzed_branches.$[branch].pullRequests.$[pullRequest].assignees": updatedAssignees } },
        { new: true, arrayFilters: [ { "branch.branch_name": destinationBranchName }, { "pullRequest.id": pullRequestID }] }
      )
      console.log("Assignees deleted successfully. Changed to: ", updatedAssignees);
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

  //////////////////////////
  // Collaborator Removed //
  //////////////////////////

  app.on("member.removed", async (context) => {
    const repoID = context.payload.repository.id;
    const memberID = context.payload.member.id;

    try {
      await Repository.findOneAndUpdate(
        { repo_id: repoID },
        { $set: { "collaborators.$[collaborator].is_active": false } },
        { new: true, arrayFilters: [ { "collaborator.id": memberID } ]}
      )
      console.log("Collaborator removed successfully.");
    } catch (err) {
      console.error(err);
    }

    try {
      await User.updateOne(
        { user_id: memberID },
        { $pull: { user_repo_ids: repoID } }
      )
      console.log("Repo id removed successfully from user's repository list.");
    } catch (err) {
      console.error(err);
    }
  });

  ////////////////////////
  // Collaborator Added //
  ////////////////////////

  app.on("member.added", async (context) => {
    const repoID = context.payload.repository.id;
    const memberID = context.payload.member.id;
    const memberName = context.payload.member.login;

    const existInUsers = await User.find({ user_id: memberID });

    if (existInUsers) {
			const user = new User({ user_name: memberName, user_id: memberID, user_repo_ids: [repoID] });
			await user.save();
		}
		else {
      try {
        await User.findOneAndUpdate(
          { user_id: memberID },
          { $push: { user_repo_ids: repoID } }
        )
        console.log("Repo id added successfully to user's repository list.");
      } catch (err) {
        console.error(err);
			};
		}

    try {
      await Repository.findOneAndUpdate(
        { repo_id: repoID },
        { $push: { collaborators: { user_id: memberID, user_name: memberName, user_role: "collaborator" } } },
        { new: true }
      )
      console.log("Collaborator added successfully.");
    } catch (err) {
      console.error(err);
    }
  });
};

const addUpdatePullRequest = async (repoID, destinationBranchName, pullRequest, mode) => {
  if (mode == "update") {
    try {
      const result = await Repository.findOneAndUpdate(
        { repo_id: repoID },
        { $set: { "analyzed_branches.$[branch].pullRequests.$[pullRequest]": pullRequest } },
        { arrayFilters: [{ "branch.branch_name": destinationBranchName }, {"pullRequest.id": pullRequest.id }], new: true }
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
