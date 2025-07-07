const initialHelpers = require("./initialHelpers.js");

const initialAnalysisMethods = () => {
  const {calculateMetricCategory} = initialHelpers();

  const initial_calculateCodeChurn = (repository) => {
    const pullRequests = repository.analyzed_branches[0].pullRequests;
    let branchFiles = repository.analyzed_branches[0].files;
    const churnThreshold = repository.settings.metric_management.highly_churn_file.file_threshold;
    const churnCategories = repository.settings.metric_management.highly_churn_file;
    
    for (const pullRequest of pullRequests) {
      
      for (const file of pullRequest.files) {
        // Find the file in the branch files with path
        const fileFoundInBranch = branchFiles.find(obj => obj.path === file.path);
        if (fileFoundInBranch){
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
        let isMerged = false;

        if(pullRequest.state == "merged"){
          isMerged = true;
        }

        if(isMerged && file.status !== "removed"){
          const newChanges = file.additions + file.deletions;
          const oldChanges = fileFoundInBranch.total_line_of_code * fileFoundInBranch.total_code_churn;
          const total = oldChanges + newChanges;
          const newLineOfCode = file.total_line_of_code;
          
          // This part is added to prevent division by zero, which makes code_churn of file infinite
          let newlineOfCodeforCalculation = newLineOfCode
          
          if(newlineOfCodeforCalculation == 0){
            newlineOfCodeforCalculation = 1
          }

          const newChurn = total / newlineOfCodeforCalculation;
          fileFoundInBranch.total_code_churn = newChurn;
          fileFoundInBranch.total_line_of_code = newLineOfCode;
        }

        else if(isMerged && file.status === "removed"){
          branchFiles = branchFiles.filter(obj => obj.path !== file.path);
        }
      }
    }

      let metric_value = (pullRequest.analysis.highly_churn_file_result.count / pullRequest.files.length);
      
      // Prs that contains revert commit shows there is no file difference which leads to 0 file in changeset 
      // When they processed, metric_value is NaN. So we set the metric_value to 0 to prevent this case
      // So we set the highly buggy file and highly churn file count to 0 to prevent this case
      if(!metric_value){
        metric_value = 0;
      }

      // Calculate category of bug frequency
      pullRequest.analysis.highly_churn_file_result.category = calculateMetricCategory(metric_value, churnCategories, false);

    }
  };

  const initial_calculateBugFrequencies = (repository) => {
    const pullRequests = repository.analyzed_branches[0].pullRequests;
    let branchFiles = repository.analyzed_branches[0].files;
    const bugFreqThreshold = repository.settings.metric_management.highly_buggy_file.file_threshold;
    const bugFrequencyCategories = repository.settings.metric_management.highly_buggy_file;
    let bugFlag;

    for (const pullRequest of pullRequests) {
      bugFlag = (pullRequest.labels.includes("bug") || pullRequest.labels.includes("Type: Bug") || pullRequest.buggyIssueCount > 0);
      for (const file of pullRequest.files) {
        // Find the file in the branch files with path
        const fileFoundInBranch = branchFiles.find((obj) => obj.path === file.path);
        
        if (fileFoundInBranch){
          // Create a new file and get total_bug_frequency from branch file
          const createdFile = {
            path: fileFoundInBranch.path,
            current_bug_frequency: fileFoundInBranch.total_bug_frequency,
            current_pr_count: fileFoundInBranch.total_pr_count,
            current_buggy_pr_count: fileFoundInBranch.total_buggy_pr_count,
          };

          if(createdFile.current_bug_frequency >= bugFreqThreshold){
            pullRequest.analysis.highly_buggy_file_result.count += 1;
          }

          // Add the file to the pull request analysis
          pullRequest.analysis.current_bug_frequencies.push(createdFile);
          
          let isMerged = false;
          
          if(pullRequest.state == "merged"){
            isMerged = true;
          }

          if (isMerged && file.status !== "removed") {
            // Increase current total_bug_frequency by 1
            if (bugFlag) {
              fileFoundInBranch.total_buggy_pr_count += 1;
            }
            fileFoundInBranch.total_pr_count += 1;
            fileFoundInBranch.total_bug_frequency = fileFoundInBranch.total_buggy_pr_count / fileFoundInBranch.total_pr_count;
          } 
          else if (isMerged && file.status === "removed") {
            branchFiles = branchFiles.filter((obj) => obj.path !== file.path);
          }
        }
      }

      let metric_value = pullRequest.analysis.highly_buggy_file_result.count / pullRequest.files.length;
      
      // Prs that contains revert commit shows there is no file difference which leads to 0 file in changeset 
      // When they processed, metric_value is NaN. So we set the metric_value to 0 to prevent this case
      if(!metric_value){
        metric_value = 0;
      }

      // Calculate category of bug frequency
      pullRequest.analysis.highly_buggy_file_result.category = calculateMetricCategory(metric_value, bugFrequencyCategories, false);
    }
  };

  // Get all the pull requests
  const initial_calculateCoChangeFiles = (repository) => {
    const pullRequests = repository.analyzed_branches[0].pullRequests;
    const branchFiles = repository.analyzed_branches[0].files;
    const coChangeThreshold = repository.settings.metric_management.highly_co_change_file.file_threshold;
    
    for (const pullRequest of pullRequests) {
      for (const file of pullRequest.files) { 
      
        ////////////////////////////
        // UPDATE CURRENT VERSION // 
        ////////////////////////////

        // Find the file in the branch files with path
        const fileFoundInBranch = branchFiles.find(obj => obj.path === file.path);

        if(fileFoundInBranch) {
          // Create a new file and get total_co_changed_files from branch file
          const createdFile = {
            path: fileFoundInBranch.path,
            current_co_change: fileFoundInBranch.total_co_changes.slice(0),
          }

          // Add the file to the pull request analysis
          if(createdFile.current_co_change.length > 0 &&
            createdFile.current_co_change.filter(obj => (obj.co_change_rate / fileFoundInBranch.total_pr_count) >= coChangeThreshold)){
            pullRequest.analysis.current_co_changes.push(createdFile);
          }

          //////////////////////////
          // UPDATE TOTAL VERSION //
          //////////////////////////
          let isMerged = false;
          
          if(pullRequest.state == "merged"){
            isMerged = true;
          }

          if(isMerged) {
            for(const siblingFile of pullRequest.files) {
              if (siblingFile.path !== file.path) {
                let temp = fileFoundInBranch.total_co_changes.find(obj => obj.path === siblingFile.path);
                if(temp) { // If the siblingFile is already in the total_co_changes of the file, simply increase co_change_rate
                  temp.co_change_rate += 1;
                } 
                else { // If the siblingFile is not in the total_co_changes of the file, create a new object and push it to the array
                  fileFoundInBranch.total_co_changes.push({
                    path: siblingFile.path,
                    co_change_rate: 1
                  })
                }
              }
            }
          }
        }
      }
    }
  }

  const initial_calculateRiskScore = (repository) => {
    const pullRequests = repository.analyzed_branches[0].pullRequests;
    const riskScoreSettings = repository.settings.metric_management.risk_score;
    let collaborators = repository.collaborators;

    const qualityGateMetrics = repository.settings.quality_gate;
    const qualityGate = {}

    for (const metric of qualityGateMetrics) {
      qualityGate[metric.metric_name] = metric.threshold;
    }

    for (const pullRequest of pullRequests) {
      // Risk score formulation
      const risk_value = parseFloat((( 3.4 * pullRequest.analysis.highly_buggy_file_result.category +
                            2.9 * pullRequest.analysis.pr_size_result.category +
                            2.1 * pullRequest.analysis.highly_churn_file_result.category +
                            1.6 * pullRequest.analysis.author_merge_rate_result.category) * 2.5).toFixed(2));

      pullRequest.analysis.risk_score.score = risk_value;
      const collaborator = collaborators.find(collaborator => collaborator.login === pullRequest.author.login)
      collaborator.total_risk_score += risk_value;
      pullRequest.author.cur_total_risk_score = collaborator.total_risk_score;

      // Calculate category of risk score
      pullRequest.analysis.risk_score.category = calculateMetricCategory(risk_value, riskScoreSettings, true)
      
      // Add risk score of pull request to the author's total risk score
      if (collaborator) {
        collaborator.total_avg_risk_score += risk_value;
        pullRequest.author.cur_avg_risk_score += collaborator.total_avg_risk_score;
      }

      // Calculate quality gate status
      pullRequest.analysis.quality_gate.status = true;
      pullRequest.analysis.quality_gate.fail_reasons = [];

      if (qualityGate.hasOwnProperty("risk_score") && pullRequest.analysis.risk_score.score >= qualityGate.risk_score) {
        pullRequest.analysis.quality_gate.status = false;
        pullRequest.analysis.quality_gate.fail_reasons.push(`Risk score should be lower than ${qualityGate['risk_score']}`)
      }
  
      if (qualityGate.hasOwnProperty("highly_buggy_file") && pullRequest.analysis.highly_buggy_file_result.count != undefined &&
        (pullRequest.analysis.highly_buggy_file_result.count / pullRequest.files.length) * 100 >= qualityGate.highly_buggy_file) {
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
    }
  };

  return {initial_calculateCodeChurn, initial_calculateBugFrequencies, initial_calculateCoChangeFiles, initial_calculateRiskScore}
};

module.exports = initialAnalysisMethods;