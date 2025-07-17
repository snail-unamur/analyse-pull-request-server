import retreiveSonarQubeMetrics from './metrics/sonarQubeMetrics.js';
import calculateRiskMetric from './metrics/riskMetrics.js';
import retreiveCodeQLMetrics from './metrics/codeQLMetrics.js';
import calculateRadarMetrics from './radarCalculator.js';
import { log } from '../utils/logger.js';

export const calculate = async (githubHead, settings, prNumber) => {
    const metric = settings.analysis_metrics;
    const radarThresholds = settings.radar_thresholds;

    log('Fetching metrics', prNumber);

    const [sonarqubeMetrics, codeQLMetrics] = await Promise.all([
        retreiveSonarQubeMetrics(githubHead, metric, prNumber),
        retreiveCodeQLMetrics(githubHead, metric, prNumber)
    ]);

    log('All metrics retrieved', prNumber);

    const allMetrics = [...sonarqubeMetrics, ...codeQLMetrics].filter(m => m.checked);

    const radarMetrics = calculateRadarMetrics(allMetrics, radarThresholds);
    const [riskValue, riskCategory] = calculateRiskMetric(radarMetrics);

    return {
        prNumber: prNumber,
        radarMetrics: radarMetrics,
        riskValue: riskValue,
        riskCategory: riskCategory
    };
}

export default calculate;