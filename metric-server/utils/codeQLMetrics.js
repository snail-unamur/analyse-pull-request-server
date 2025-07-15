const retreiveCodeQLMetrics = async (metric, repoOwner, repoName, pullRequestNumber) => {
    const sonnarMetrics = settings.filter(metric => metric.source === 'codeql');

} 

export default retreiveCodeQLMetrics;