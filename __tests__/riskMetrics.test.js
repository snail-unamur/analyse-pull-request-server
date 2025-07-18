import calculateRiskMetric from '../models/metrics/riskMetrics';

describe('Testing of the calculations of the risk metric', () => {
    test('Category A', () => {
        const metrics = [
            { radarValue: 0 },
            { radarValue: 1 },
            { radarValue: 2 },
            { radarValue: 3 },
            { radarValue: 4 },
        ];
        const [value, category] = calculateRiskMetric(metrics);

        expect(value).toBe(2);
        expect(category).toBe('C');
    })

    test('Lower edge of Category A (value just below 1)', () => {
        const metrics = Array(5).fill({ radarValue: 0.99 });
        const [value, category] = calculateRiskMetric(metrics);

        expect(value).toBe(0);        // floor(0.99)
        expect(category).toBe('A');
    });

    test('Exact transition to Category B (average = 1)', () => {
        const metrics = Array(5).fill({ radarValue: 1 });
        const [value, category] = calculateRiskMetric(metrics);

        expect(value).toBe(1);        // floor(1)
        expect(category).toBe('B');
    });

    test('Upper edge of Category B (value just below 2)', () => {
        const metrics = Array(5).fill({ radarValue: 1.99 });
        const [value, category] = calculateRiskMetric(metrics);

        expect(value).toBe(1);        // floor(1.99)
        expect(category).toBe('B');
    });

    test('Exact transition to Category C (average = 2)', () => {
        const metrics = Array(5).fill({ radarValue: 2 });
        const [value, category] = calculateRiskMetric(metrics);

        expect(value).toBe(2);        // floor(2)
        expect(category).toBe('C');
    });

    test('Upper edge of Category D (average just below 4)', () => {
        const metrics = Array(5).fill({ radarValue: 3.99 });
        const [value, category] = calculateRiskMetric(metrics);

        expect(value).toBe(3);        // floor(3.99)
        expect(category).toBe('D');
    });

    test('Overflow above last category (average ≥ 5)', () => {
        const metrics = Array(5).fill({ radarValue: 10 });
        const [value, category] = calculateRiskMetric(metrics);

        expect(value).toBe(10);
        expect(category).toBe('E');   // capped at last category
    });

    test('Empty metrics returns [0, "A"]', () => {
        const metrics = [];
        const [value, category] = calculateRiskMetric(metrics);

        expect(value).toBe(0);
        expect(category).toBe('A');
    });

})