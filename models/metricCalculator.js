import retrieveSonarMetrics from './metrics/sonarMetrics.js';
import retrieveCodeQLMetrics from './metrics/codeQLMetrics.js';
import calculateRiskMetric from './metrics/riskMetrics.js';
import calculateRadarMetrics from './radarCalculator.js';
import { log } from '../utils/logger.js';

export const calculate = async (githubHead, configuration, prNumber) => {
    const defaultMetricsConfig = configuration.analysis_metrics.default;
    const radarMetricsConfig = configuration.analysis_metrics.radar;

    const enabledMetricsConfig = radarMetricsConfig.filter(m => m.checked);

    const metricsConfig = [...defaultMetricsConfig, ...enabledMetricsConfig]

    log('Fetching metrics', prNumber);

    const [sonarMetrics, codeQLMetrics] = await Promise.all([
        retrieveSonarMetrics(githubHead, metricsConfig, prNumber),
        retrieveCodeQLMetrics(githubHead, metricsConfig, prNumber)
    ]);

    log('All metrics retrieved', prNumber);

    const calculatedMetrics = [...sonarMetrics, ...codeQLMetrics];

    const defaultCalculatedMetrics = calculatedMetrics.filter(m => m.default);
    const radarCalculatedMetrics = calculatedMetrics.filter(m => !m.default);

    const radarMetricThresholds = calculateRadarMetrics(radarCalculatedMetrics, enabledMetricsConfig);
    const [riskValue, riskCategory] = calculateRiskMetric(radarMetricThresholds);

    return {
        prNumber: prNumber,
        radarMetrics: radarMetricThresholds,
        defaultMetrics: defaultCalculatedMetrics,
        riskValue: riskValue,
        riskCategory: riskCategory
    };
}

export default calculate;