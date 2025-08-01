import calculateRiskMetric from "../models/metrics/riskMetrics.js";

describe('calculateRiskMetric', () => {

    it('return 0 if radar empty', () => {
        const defaultMetrics = [{ id: 'files', value: 10 }, { id: 'ncloc', value: 100 }, { id: 'new_coverage', value: 0.8 }];
        expect(calculateRiskMetric(defaultMetrics, [])).toBe(0);
    });

    it('base case', () => {
        const defaultMetrics = [
            { id: 'files', value: 10 },
            { id: 'ncloc', value: 100 },
            { id: 'new_coverage', value: 0.8 }
        ];

        const radarMetrics = [
            { id: 'metric1', value: 3 },
            { id: 'metric2', value: 4 },
            { id: 'metric3', value: 5 }
        ];

        const result = calculateRiskMetric(defaultMetrics, radarMetrics);
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
    });

    it('uses default values', () => {
        const defaultMetrics = [];
        const radarMetrics = [
            { id: 'a', value: 2 },
            { id: 'b', value: 2 },
            { id: 'c', value: 2 }
        ];

        const result = calculateRiskMetric(defaultMetrics, radarMetrics);
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0);
    });

    it('Handle null value in default metrics', () => {
        const defaultMetrics = [
            { id: 'files', value: null },
            { id: 'ncloc', value: undefined },
            { id: 'new_coverage', value: 0 }
        ];

        const radarMetrics = [
            { id: 'a', value: 1 },
            { id: 'b', value: 1 },
            { id: 'c', value: 1 }
        ];

        const result = calculateRiskMetric(defaultMetrics, radarMetrics);
        expect(typeof result).toBe('number');
        expect(result).toBeGreaterThan(0); // coverage = 1 fallback
    });

    it('return valid result for regular triangle', () => {
        const defaultMetrics = [
            { id: 'files', value: 1 },
            { id: 'ncloc', value: 1 },
            { id: 'new_coverage', value: 1 }
        ];

        const radarMetrics = [
            { id: 'a', value: 1 },
            { id: 'b', value: 1 },
            { id: 'c', value: 1 }
        ];

        const result = calculateRiskMetric(defaultMetrics, radarMetrics);
        expect(result).toBeCloseTo(1, 1);
    });

});
