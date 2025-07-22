import calculateRadarMetrics from '../models/radarCalculator.js';
import { metricsCatA, metricsCatB, metricsCatC, metricsCatD, metricsCatE, metricsWorstCase, metricsBestCase, configuration } from '../__data__/dataExamples.js';

describe('Testing of the radar calucation ', () => {

    test('Category A', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatA, configuration.analysis_metrics);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(0);
        })
    })

    test('Category B', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatB, configuration.analysis_metrics);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(1);
        })
    })

    test('Category C', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatC, configuration.analysis_metrics);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(2);
        })
    })

    test('Category D', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatD, configuration.analysis_metrics);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(3);
        })
    })

    test('Category E', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatE, configuration.analysis_metrics);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(4);
        })
    })

    test('Best case', () => {
        const radarMetrics = calculateRadarMetrics(metricsBestCase, configuration.analysis_metrics);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(0);
        })
    })

    test('Worst case', () => {
        const radarMetrics = calculateRadarMetrics(metricsWorstCase, configuration.analysis_metrics);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(4);
        })
    })
})