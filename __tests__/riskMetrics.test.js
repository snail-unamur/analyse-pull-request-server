import calculateRiskMetric from '../models/metrics/riskMetrics';

describe('Testing of the calculations of the risk metric (max value, integer 0-4)', () => {
    test('Base case', () => {
        const metrics = [
            { value: 0 },
            { value: 1 },
            { value: 2 },
            { value: 3 },
            { value: 4 },
        ];
        const [value, category] = calculateRiskMetric(metrics);

        expect(value).toBe(4);
        expect(category).toBe('E');
    });

    test('One metric', () => {
        const metrics = [{ value: 2 }];
        const [value, category] = calculateRiskMetric(metrics);

        expect(value).toBe(2);
        expect(category).toBe('C');
    });

    test('Empty metrics returns [4, "E"]', () => {
        const metrics = [];
        const [value, category] = calculateRiskMetric(metrics);

        expect(value).toBe(0);
        expect(category).toBe('A');
    });
});
