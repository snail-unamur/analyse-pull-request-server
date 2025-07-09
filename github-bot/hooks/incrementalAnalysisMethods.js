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
          pullRequest.analysis.highly_churn_file.count += 1;
        }

        // Add the file to the pull request analysis
        pullRequest.analysis.current_code_churns.push(createdFile);
      }
    }
    
    let metric_value = (pullRequest.analysis.highly_churn_file.count / pullRequest.files.length);
    
    // Prs that contains revert commit shows there is no file difference which leads to 0 file in changeset 
    // When they processed, metric_value is NaN. So we set the metric_value to 0 to prevent this case
    if(!metric_value){
      metric_value = 0;
    }

    pullRequest.analysis.highly_churn_file.value = metric_value;
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
          pullRequest.analysis.highly_buggy_file.count += 1;
        }

        // Add the file to the pull request analysis
        pullRequest.analysis.current_bug_frequencies.push(createdFile);
      }
    }

    let metric_value = (pullRequest.analysis.highly_buggy_file.count / pullRequest.files.length);

    // Prs that contains revert commit shows there is no file difference which leads to 0 file in changeset 
    // When they processed, metric_value is NaN. So we set the metric_value to 0 to prevent this case
    if(!metric_value){
      metric_value = 0;
    }

    pullRequest.analysis.highly_buggy_file.value = metric_value;
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

  return {incremental_calculateCurrentBugFrequencies, incremental_calculateCurrentCoChangeFiles, incremental_calculateCurrentCodeChurn, incremental_updateBranch};
}

module.exports = incrementalAnalysisMethods;