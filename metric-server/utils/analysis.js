import { retreiveSonarQubeMetrics } from '../utils/sonarQubeMetrics.js';
import { retreiveRobotMetrics } from '../utils/robotMetrics.js';
import calculateRiskMetric from '../utils/metricsCalculator.js';

export const calculateMetrics = async (settings, pullRequest) => {
    const metric = settings.analysis_metrics;
    const riskValueTresholds = settings.risk_value;

    const robotMetrics = retreiveRobotMetrics(metric, pullRequest.analysis);
    const sonarqubeMetrics = await retreiveSonarQubeMetrics(metric, pullRequest.number);
    const allMetrics = [...sonarqubeMetrics, ...robotMetrics];

    const result = calculateRiskMetric(pullRequest.number, allMetrics, riskValueTresholds);
    return result;
}

export default calculateMetrics;