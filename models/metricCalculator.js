import retreiveSonarQubeMetrics from './metrics/sonarQubeMetrics.js';
import calculateRiskMetric from './metrics/riskMetrics.js';
import retreiveCodeQLMetrics from './metrics/codeQLMetrics.js';

export const calculate = async (githubHead, settings, prNumber) => {
    const metric = settings.analysis_metrics;
    const riskValueTresholds = settings.risk_threshold_value;

    const sonarqubeMetrics = await retreiveSonarQubeMetrics(githubHead, metric, prNumber);
    const codeQLMetrics = await retreiveCodeQLMetrics(githubHead, metric, prNumber);

    const allMetrics = [...sonarqubeMetrics, ...codeQLMetrics];

    const result = calculateRiskMetric(allMetrics, riskValueTresholds);
    result.prNumber = prNumber;

    return result;
}

export default calculate;