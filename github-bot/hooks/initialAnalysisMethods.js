const initialAnalysisMethods = () => {
  const initial_calculateCodeChurn = (repository) => {
    const pullRequests = repository.analyzed_branches[0].pullRequests;
    let branchFiles = repository.analyzed_branches[0].files;
    const churnThreshold = repository.settings.metric_management.highly_churn_file.file_threshold;
    
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

      pullRequest.analysis.highly_churn_file_result.value = metric_value;
    }
  };

  const initial_calculateBugFrequencies = (repository) => {
    const pullRequests = repository.analyzed_branches[0].pullRequests;
    let branchFiles = repository.analyzed_branches[0].files;
    const bugFreqThreshold = repository.settings.metric_management.highly_buggy_file.file_threshold;
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

      pullRequest.analysis.highly_buggy_file_result.value = metric_value;
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

  return {initial_calculateCodeChurn, initial_calculateBugFrequencies, initial_calculateCoChangeFiles}
};

module.exports = initialAnalysisMethods;