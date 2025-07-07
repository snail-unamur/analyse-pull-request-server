const axios = require("axios");
const Repository = require("../models/Repository.js");

const incrementalAnalysisMethods = () => {
  // Get all the pull requests
  const incremental_calculateCurrentCodeChurn = (pullRequest, branchFiles, churnSettings) => {
    const churnThreshold = churnSettings.file_threshold;
    
    for (const file of pullRequest.files) {
      // Find the file in the branch files with path
      const fileFoundInBranch = branchFiles.find(obj => obj.path === file.path);
      
      if (fileFoundInBranch) {
        // Create a new file and get total_code_churn from branch file
        const createdFile = {
          path: fileFoundInBranch.path, 
          current_code_churn: fileFoundInBranch.total_code_churn,
        }

        if(createdFile.current_code_churn >= churnThreshold){
          pullRequest.analysis.highly_churn_file_result.count += 1;
        }

        // Add the file to the pull request analysis
        pullRequest.analysis.current_code_churns.push(createdFile);
      }
    }
    
    let metric_value = (pullRequest.analysis.highly_churn_file_result.count / pullRequest.files.length);
    let category = calculateMetricCategory(metric_value, churnSettings, false);
    
    // Prs that contains revert commit shows there is no file difference which leads to 0 file in changeset 
    // When they processed, metric_value is NaN. So we set the metric_value to 0 to prevent this case
    if(!metric_value){
      metric_value = 0;
    }

    pullRequest.analysis.highly_churn_file_result.category = category;
  }
    
  // Get all the pull requests
  const incremental_calculateCurrentBugFrequencies = (pullRequest, branchFiles, bugFreqSettings) => {
    const bugFreqThreshold = bugFreqSettings.file_threshold;

    for (const file of pullRequest.files) {
      // Find the file in the branch files with path
      const fileFoundInBranch = branchFiles.find(obj => obj.path === file.path);

      if(fileFoundInBranch){
        // Create a new file and get total_bug_frequency from branch file
        const createdFile = {
          path: fileFoundInBranch.path,
          current_bug_frequency: fileFoundInBranch.total_bug_frequency,
          current_pr_count: fileFoundInBranch.total_pr_count,
          current_buggy_pr_count: fileFoundInBranch.total_buggy_pr_count,
        }

        if(createdFile.current_bug_frequency >= bugFreqThreshold){
          pullRequest.analysis.highly_buggy_file_result.count += 1;
        }

        // Add the file to the pull request analysis
        pullRequest.analysis.current_bug_frequencies.push(createdFile);
      }
    }

    let metric_value = (pullRequest.analysis.highly_buggy_file_result.count / pullRequest.files.length);
    pullRequest.analysis.highly_buggy_file_result.category = calculateMetricCategory(metric_value, bugFreqSettings, false);

    // Prs that contains revert commit shows there is no file difference which leads to 0 file in changeset 
    // When they processed, metric_value is NaN. So we set the metric_value to 0 to prevent this case
    if(!metric_value){
      metric_value = 0;
    }
  }

  // Get all the pull requests
  const incremental_calculateCurrentCoChangeFiles = (pullRequest, branchFiles, coChangeSettings) => {
    const coChangeThreshold = coChangeSettings.file_threshold;

    for (const file of pullRequest.files) {
      // Find the file in the branch files with path
      const fileFoundInBranch = branchFiles.find(obj => obj.path === file.path);
      
      if(fileFoundInBranch){
        // Create a new file and get total_co_changed_files from branch file
        const createdFile = {
          path: fileFoundInBranch.path,
          current_co_change: fileFoundInBranch.total_co_changes,
        }

        // Add the file to the pull request analysis
        if(createdFile.current_co_change.length > 0 &&
          createdFile.current_co_change.filter(obj => (obj.co_change_rate / fileFoundInBranch.total_pr_count) >= coChangeThreshold)){
          pullRequest.analysis.current_co_changes.push(createdFile);
        }

      }
    }
  }

  // Get all the pull requests
  const incremental_updateBranch = (pullRequest, branchFiles) => {
    const bugFlag = (pullRequest.labels?.includes("bug") || pullRequest.labels.includes("Type: Bug") || pullRequest.buggyIssueCount > 0);

    for (const file of pullRequest.files) {
      // Find the file in the branch files with path
      const fileFoundInBranch = branchFiles.find(obj => obj.path === file.path);
      
      if(file.status === "removed"){ //If file is removed in the pull request
        branchFiles = branchFiles.filter(obj => obj.path !== file.path); //Remove the file from the branch files
      }

      else { //If file is added or modified in the pull request
        if(!fileFoundInBranch){ // If file is added
          // Create a new file 
          const createdFile = {
            path: file.path, 
            total_code_churn: (file.additions + file.deletions) / file.total_line_of_code,
            total_pr_count: 1,
            total_buggy_pr_count: 0,
            total_bug_frequency: 0,
            total_co_changes: [],
          }
          if(bugFlag){
            createdFile.total_bug_frequency = 1;
            createdFile.total_buggy_pr_count = 1;
          }
          branchFiles.push(createdFile);
          update_coChangeFilesOfAFile(file, pullRequest, branchFiles);
        }
        else { //If file is modified
          //Calculate new code churn
          const newChanges = file.additions + file.deletions;
          const oldChanges = fileFoundInBranch.total_line_of_code * fileFoundInBranch.total_code_churn;
          const total = oldChanges + newChanges
          const newLineOfCode = file.total_line_of_code;
          
          // This part is added to prevent division by zero, which makes code_churn of file infinite
          let newlineOfCodeforCalculation = newLineOfCode
        
          if(newlineOfCodeforCalculation == 0){
            newlineOfCodeforCalculation = 1
          }
        
          const newChurn = total / newlineOfCodeforCalculation;
          fileFoundInBranch.total_code_churn = newChurn;
          fileFoundInBranch.total_line_of_code = newLineOfCode;

          //Calculate new bug freq
          if(bugFlag){
            fileFoundInBranch.total_buggy_pr_count += 1;
          }
          fileFoundInBranch.total_pr_count += 1;
          fileFoundInBranch.total_bug_frequency = fileFoundInBranch.total_buggy_pr_count / fileFoundInBranch.total_pr_count;
          update_coChangeFilesOfAFile(file, pullRequest, branchFiles);
        }
      }
    }
    return branchFiles
  }

  const update_coChangeFilesOfAFile = (file, pullRequest, branchFiles) => {
    const fileFoundInBranch = branchFiles.find(obj => obj.path === file.path);

    for(const siblingFile of pullRequest.files) { //For every sibling file in the pull request
      if (siblingFile.path !== file.path) {
        let temp = fileFoundInBranch.total_co_changes.find(obj => obj.path === siblingFile.path); //Check if the sibling file exist in the org file's co_change list 
        if(temp) { // If it exists, increment the co_change_rate in the branch
          temp.co_change_rate += 1;
        } 
        else { // If it does not exist, create a new object and add it to the org file's co_change list
          fileFoundInBranch.total_co_changes.push({ 
            path: siblingFile.path,
            co_change_rate: 1
          })
        }
      }
    }
  }

  const incremental_calculateRiskScore = (pullRequest, riskScoreSettings, qualityGateMetrics) => {
    const riskScoreCoefficients = riskScoreSettings.formula;

    const qualityGate = {}

    for (const metric of qualityGateMetrics) {
      qualityGate[metric.metric_name] = metric.threshold;
    }

    const coefficientSum = riskScoreCoefficients.page_rank_score_coefficient + 
                riskScoreCoefficients.highly_buggy_file_coefficient + 
                riskScoreCoefficients.pr_size_coefficient + 
                riskScoreCoefficients.highly_churn_file_coefficient +
                riskScoreCoefficients.author_merge_rate_coefficient

    // Risk score formulation
    const risk_value = parseFloat((((riskScoreCoefficients.page_rank_score_coefficient * pullRequest.analysis.current_page_rank_result.score + 
                            riskScoreCoefficients.highly_buggy_file_coefficient * pullRequest.analysis.highly_buggy_file_result.category +
                            riskScoreCoefficients.pr_size_coefficient * pullRequest.analysis.pr_size_result.category +
                            riskScoreCoefficients.highly_churn_file_coefficient * pullRequest.analysis.highly_churn_file_result.category +
                            riskScoreCoefficients.author_merge_rate_coefficient * pullRequest.analysis.author_merge_rate_result.category) / coefficientSum) * 25).toFixed(2));
                
    pullRequest.analysis.risk_score.score = risk_value;

    // Calculate category of risk score
    pullRequest.analysis.risk_score.category = calculateMetricCategory(risk_value, riskScoreSettings, true);

    pullRequest.analysis.quality_gate.status = true;
    pullRequest.analysis.quality_gate.fail_reasons = [];
    
    // Calculate quality gate status
    if (qualityGate.hasOwnProperty("risk_score") && pullRequest.analysis.risk_score.score >= qualityGate.risk_score) {
      pullRequest.analysis.quality_gate.status = false;
      pullRequest.analysis.quality_gate.fail_reasons.push(`Risk score should be lower than ${qualityGate['risk_score']}%`)
    }
    if (qualityGate.hasOwnProperty("highly_buggy_file") && (pullRequest.analysis.highly_buggy_file_result.count / pullRequest.files.length) * 100 >= qualityGate.highly_buggy_file) {
      pullRequest.analysis.quality_gate.status = false;
      pullRequest.analysis.quality_gate.fail_reasons.push(`Highly buggy file ratio should be lower than ${qualityGate['highly_buggy_file']}%`)
    }
    if (qualityGate.hasOwnProperty("highly_churn_file") && (pullRequest.analysis.highly_churn_file_result.count / pullRequest.files.length) * 100 >= qualityGate.highly_churn_file) {
      pullRequest.analysis.quality_gate.status = false;
      pullRequest.analysis.quality_gate.fail_reasons.push(`Highly churn file ratio should be lower than ${qualityGate['highly_churn_file']}%`)
    }
    if (qualityGate.hasOwnProperty("pr_size") && (pullRequest.lines.additions + pullRequest.lines.deletions) >= qualityGate.pr_size) {
      pullRequest.analysis.quality_gate.status = false;
      pullRequest.analysis.quality_gate.fail_reasons.push(`Pull request size should be lower than ${qualityGate['pr_size']}`)
    }
  };

  const incremental_calculateMergeRate = async (pullRequest, repoID, mergeRateSettings) => {
    let collaborator_info;
    const authorLoginName = pullRequest.author.login;
		// Update collaborator and author total information
		try{
      let result = await Repository.findOne(
        { repo_id: repoID },
        { "collaborators": { $elemMatch: { login: authorLoginName } } }
      )
			collaborator_info = result;
    } catch(error) {
      console.error(error);
      console.log("Error in finding collaborator info in incremental_calculateMergeRate")
    }

		let author_cur_merged_pull_request_count = 0
		let author_cur_pull_request_count = 0

		if(collaborator_info){
			author_cur_pull_request_count = collaborator_info.total_pull_request_count + 1; //Because this pr is opened
			author_cur_merged_pull_request_count = collaborator_info.total_merged_pull_request_count; //Because this pr is not closed yet

			const authorMergeRate = (author_cur_merged_pull_request_count / author_cur_pull_request_count);
      pullRequest.analysis.author_merge_rate_result.category = calculateMetricCategory(authorMergeRate, mergeRateSettings, false);
		}
  }

  const incremental_calculate_pagerank = async (pullRequest, projectIdentifier, pageRankSettings) => {
		const changedFilesWithSha = pullRequest.files.map((file) => {
			return {
				fileName: file.name,
				status: file.status.toUpperCase(),
				oldSha: file.destination_sha,
				newSha: file.origin_sha,
			};
		});

		try {
			const { data: totalPageRank } = await axios.post('http://localhost:8080/api/v1/callgraph/pagerank', {
				prNumber: pullRequest.number,
				destinationBranchName: pullRequest.branch_name.destination,
				projectIdentifier,
				changedFilesWithSha,
			});

      pullRequest.analysis.current_page_rank_result.score = totalPageRank;

      const scaledTotalPageRank = totalPageRank * 100;
      pullRequest.analysis.current_page_rank_result.category = calculateMetricCategory(scaledTotalPageRank, pageRankSettings, true);
		} catch (e) {
			console.log(e.message);
		}
	};

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

  const incremental_generate_save_impact_graph = async (repoID, prNumber) => {
		const { analyzed_branches, repo_owner, repo_name } = await Repository.findOne({
			repo_id: repoID,
		}).lean();

		const pullRequest = analyzed_branches[0].pullRequests.find((pullRequest) => pullRequest.number == prNumber);

		const changedFilesWithSha = pullRequest.files.map((file) => {
			return {
				fileName: file.name,
				status: file.status.toUpperCase(),
				oldSha: file.destination_sha,
				newSha: file.origin_sha,
			};
		});

    console.log("changedFilesWithSha: ", changedFilesWithSha)

		const { data: impactGraphUrl } = await axios.post('http://localhost:8080/api/v1/callgraph/impact_image', {
			prNumber,
			destinationBranchName: pullRequest.branch_name.destination,
			projectIdentifier: repo_owner + '/' + repo_name,
			impactLevel: 3,
			changedFilesWithSha,
		});

		return impactGraphUrl;
	};

  return {incremental_calculateCurrentBugFrequencies, incremental_calculateCurrentCoChangeFiles, incremental_calculateCurrentCodeChurn, incremental_updateBranch, incremental_calculateRiskScore, incremental_calculateMergeRate, incremental_calculate_pagerank, calculateMetricCategory};
}

module.exports = incrementalAnalysisMethods;