import retreiveSonarQubeMetrics from './metrics/sonarQubeMetrics.js';
import calculateRiskMetric from './metrics/riskMetrics.js';
import retreiveCodeQLMetrics from './metrics/codeQLMetrics.js';
import { log } from '../utils/logger.js';

export const calculate = async (githubHead, settings, prNumber) => {
    const metric = settings.analysis_metrics;
    const riskValueTresholds = settings.risk_threshold_value;

    log('Fetching metrics', prNumber);

    const [sonarqubeMetrics, codeQLMetrics] = await Promise.all([
        retreiveSonarQubeMetrics(githubHead, metric, prNumber),
        retreiveCodeQLMetrics(githubHead, metric, prNumber)
    ]);

    log('All metrics retrieved', prNumber);

    const allMetrics = [...sonarqubeMetrics, ...codeQLMetrics];

    const result = calculateRiskMetric(allMetrics, riskValueTresholds);
    result.prNumber = prNumber;

    return result;
}

export default calculate;