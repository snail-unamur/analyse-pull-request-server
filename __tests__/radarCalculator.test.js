import calculateRadarMetrics from '../models/radarCalculator.js';
import { metricsCatA, metricsCatB, metricsCatC, metricsCatD, metricsCatE, metricsWorstCase, metricsBestCase, configuration } from '../__data__/dataExamples.js';

describe('Testing of the radar calucation ', () => {

    test('Category A', () => {
        const calculatedMetrics = metricsCatA.filter(m => !m.default);
        const radarMetrics = calculateRadarMetrics(calculatedMetrics, configuration.analysis_metrics.radar);

        radarMetrics.forEach(m => {
            expect(m. radarValue).toBe(0);
        })
    })

    test('Category B', () => {
        const calculatedMetrics = metricsCatB.filter(m => !m.default);
        const radarMetrics = calculateRadarMetrics(calculatedMetrics, configuration.analysis_metrics.radar);

        radarMetrics.forEach(m => {
            expect(m. radarValue).toBe(1);
        })
    })

    test('Category C', () => {
        const calculatedMetrics = metricsCatC.filter(m => !m.default);
        const radarMetrics = calculateRadarMetrics(calculatedMetrics, configuration.analysis_metrics.radar);

        radarMetrics.forEach(m => {
            expect(m. radarValue).toBe(2);
        })
    })

    test('Category D', () => {
        const calculatedMetrics = metricsCatD.filter(m => !m.default);
        const radarMetrics = calculateRadarMetrics(calculatedMetrics, configuration.analysis_metrics.radar);

        radarMetrics.forEach(m => {
            expect(m. radarValue).toBe(3);
        })
    })

    test('Category E', () => {
        const calculatedMetrics = metricsCatE.filter(m => !m.default);
        const radarMetrics = calculateRadarMetrics(calculatedMetrics, configuration.analysis_metrics.radar);

        radarMetrics.forEach(m => {
            expect(m. radarValue).toBe(4);
        })
    })

    test('Best case', () => {
        const calculatedMetrics = metricsBestCase.filter(m => !m.default);
        const radarMetrics = calculateRadarMetrics(calculatedMetrics, configuration.analysis_metrics.radar);

        radarMetrics.forEach(m => {
            expect(m. radarValue).toBe(0);
        })
    })

    test('Worst case', () => {
        const calculatedMetrics = metricsWorstCase.filter(m => !m.default);
        const radarMetrics = calculateRadarMetrics(calculatedMetrics, configuration.analysis_metrics.radar);

        radarMetrics.forEach(m => {
            expect(m. radarValue).toBe(4);
        })
    })
})