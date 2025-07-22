import calculateRadarMetrics from '../models/radarCalculator.js';
import { metricsCatA, metricsCatB, metricsCatC, metricsCatD, metricsCatE, metricsWorstCase, metricsBestCase, configuration } from '../dataExamples/dataExamples.js';

describe('Testing of the radar calucation ', () => {

    test('Category A', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatA, configuration);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(0);
        })
    })

    test('Category B', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatB, configuration);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(1);
        })
    })

    test('Category C', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatC, configuration);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(2);
        })
    })

    test('Category D', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatD, configuration);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(3);
        })
    })

    test('Category E', () => {
        const radarMetrics = calculateRadarMetrics(metricsCatE, configuration);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(4);
        })
    })

    test('Best case', () => {
        const radarMetrics = calculateRadarMetrics(metricsBestCase, configuration);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(0);
        })
    })

    test('Worst case', () => {
        const radarMetrics = calculateRadarMetrics(metricsWorstCase, configuration);

        radarMetrics.forEach(m => {
            expect(m.radarValue).toBe(4);
        })
    })
})