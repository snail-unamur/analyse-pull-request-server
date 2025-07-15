import retreiveSonarQubeMetrics from './sonarQubeMetrics.js';
import retreiveRobotMetrics from './robotMetrics.js';
import calculateRiskMetric from './riskMetrics.js';
import retreiveCodeQLMetrics from './codeQLMetrics.js';

export const calculate = async (githubHead, settings, pullRequest) => {
    const metric = settings.analysis_metrics;
    const riskValueTresholds = settings.risk_value;

    const robotMetrics = retreiveRobotMetrics(metric, pullRequest.analysis);
    const sonarqubeMetrics = await retreiveSonarQubeMetrics(githubHead, metric, pullRequest.number);
    const codeQLMetrics = await retreiveCodeQLMetrics(githubHead, metric, pullRequest);
    const allMetrics = [...sonarqubeMetrics, ...robotMetrics, ...codeQLMetrics];

    const result = calculateRiskMetric(pullRequest.number, allMetrics, riskValueTresholds);
    return result;
}

export default calculate;