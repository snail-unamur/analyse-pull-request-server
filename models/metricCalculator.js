import retrieveSonarQubeMetrics from './metrics/sonarQubeMetrics.js';
import retrieveCodeQLMetrics from './metrics/codeQLMetrics.js';
import calculateRiskMetric from './metrics/riskMetrics.js';
import calculateRadarMetrics from './radarCalculator.js';
import { log } from '../utils/logger.js';

export const calculate = async (githubHead, configuration, prNumber) => {
    const metricsConfig = configuration.analysis_metrics;
    const enabledMetricsConfig = metricsConfig.filter(m => m.checked);

    log('Fetching metrics', prNumber);

    const [sonarqubeMetrics, codeQLMetrics] = await Promise.all([
        retrieveSonarQubeMetrics(githubHead, enabledMetricsConfig, prNumber),
        retrieveCodeQLMetrics(githubHead, enabledMetricsConfig, prNumber)
    ]);

    log('All metrics retrieved', prNumber);

    const calculatedMetrics = [...sonarqubeMetrics, ...codeQLMetrics];

    const radarMetrics = calculateRadarMetrics(calculatedMetrics, enabledMetricsConfig);
    const [riskValue, riskCategory] = calculateRiskMetric(radarMetrics);

    return {
        prNumber: prNumber,
        radarMetrics: radarMetrics,
        riskValue: riskValue,
        riskCategory: riskCategory
    };
}

export default calculate;