import calculateRadarMetrics from '../models/radarCalculator.js';
import { metricsCatA, metricsCatB, metricsCatC, metricsCatD, metricsCatE, metricsWorstCase, metricsBestCase, pullRequest } from '../dataExamples/dataExamples.js';

describe('Testing of the radar calucation ', () => {

    test('Category A', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatA, pullRequest.radar_thresholds);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(0);
        })
    })

    test('Category B', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatB, pullRequest.radar_thresholds);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(1);
        })
    })

    test('Category C', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatC, pullRequest.radar_thresholds);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(2);
        })
    })

    test('Category D', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatD, pullRequest.radar_thresholds);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(3);
        })
    })

    test('Category E', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatE, pullRequest.radar_thresholds);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(4);
        })
    })

    test('Best case', () => {
        const radarMetrics = calculateRadarMetrics(metricsBestCase, pullRequest.radar_thresholds);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(0);
        })
    })

    test('Worst case', () => {
        const radarMetrics = calculateRadarMetrics(metricsWorstCase, pullRequest.radar_thresholds);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(4);
        })
    })
})