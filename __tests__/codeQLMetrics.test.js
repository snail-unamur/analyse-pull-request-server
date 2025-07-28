import { calculateInstabilityMetric, calculateMeanInstability, extractMetricsFromArtifact } from "../models/metrics/codeQLMetrics.js";
import { mockArtifact, noAfferent, partialArtifact } from "../__data__/codeQLArtifact.js";

describe('calculateInstabilityMetric', () => {
    test('calculateInstabilityMetric: returns correct instability when efferent and afferent are non-zero', () => {
        expect(calculateInstabilityMetric({ efferent: 5, afferent: 5 })).toBe(0.5);
        expect(calculateInstabilityMetric({ efferent: 2, afferent: 8 })).toBe(0.2);
        expect(calculateInstabilityMetric({ efferent: 7, afferent: 3 })).toBe(0.7);
    });

    test('calculateInstabilityMetric: rounds the result to two decimal places', () => {
        expect(calculateInstabilityMetric({ efferent: 1, afferent: 3 })).toBe(0.25);
        expect(calculateInstabilityMetric({ efferent: 1, afferent: 6 })).toBe(0.14);
    });

    test('calculateInstabilityMetric: returns 0 when both efferent and afferent are 0', () => {
        expect(calculateInstabilityMetric({ efferent: 0, afferent: 0 })).toBe(0);
    });

    test('calculateInstabilityMetric: returns 1 when afferent is 0 and efferent > 0', () => {
        expect(calculateInstabilityMetric({ efferent: 10, afferent: 0 })).toBe(1);
    });

    test('calculateInstabilityMetric: returns 0 when efferent is 0 and afferent > 0', () => {
        expect(calculateInstabilityMetric({ efferent: 0, afferent: 10 })).toBe(0);
    });

    test('calculateInstabilityMetric: handles large numbers correctly', () => {
        expect(calculateInstabilityMetric({ efferent: 1000000, afferent: 1000000 })).toBe(0.5);
        expect(calculateInstabilityMetric({ efferent: 999999, afferent: 1 })).toBe(1);
    });

    test('calculateMeanInstability: returns correct mean instability for multiple inputs', () => {
        const metrics = [
            { efferent: 5, afferent: 5 },  // instability = 0.5
            { efferent: 2, afferent: 8 },  // instability = 0.2
            { efferent: 7, afferent: 3 },  // instability = 0.7
        ];
        const result = calculateMeanInstability(metrics);
        expect(result).toBe(0.47); // (0.5 + 0.2 + 0.7) / 3 = 1.4 / 3 = 0.4666... => 0.47
    });

    test('calculateMeanInstability: returns 0 when all metrics are zero', () => {
        const metrics = [
            { efferent: 0, afferent: 0 },
            { efferent: 0, afferent: 0 },
        ];
        expect(calculateMeanInstability(metrics)).toBe(0);
    });

    test('calculateMeanInstability: returns correct mean when efferent is 0 for all', () => {
        const metrics = [
            { efferent: 0, afferent: 10 },  // instability = 0
            { efferent: 0, afferent: 20 },  // instability = 0
        ];
        expect(calculateMeanInstability(metrics)).toBe(0);
    });

    test('calculateMeanInstability: returns correct mean when afferent is 0 for all', () => {
        const metrics = [
            { efferent: 10, afferent: 0 },  // instability = 1
            { efferent: 5, afferent: 0 },   // instability = 1
        ];
        expect(calculateMeanInstability(metrics)).toBe(1);
    });

    test('calculateMeanInstability: rounds result to 2 decimal places', () => {
        const metrics = [
            { efferent: 1, afferent: 3 }, // 0.25
            { efferent: 1, afferent: 6 }, // 0.14
            { efferent: 1, afferent: 8 }, // 0.11
        ];
        const result = calculateMeanInstability(metrics);
        expect(result).toBe(0.17); // (0.25 + 0.14 + 0.11) / 3 = 0.166... => 0.17
    });

    test('calculateMeanInstability: returns NaN if array is empty', () => {
        expect(calculateMeanInstability([])).toBeNaN();
    });

    test('extractMetricsFromArtifact: correctly extracts and matches afferent and efferent metrics', () => {
        const result = extractMetricsFromArtifact(mockArtifact);
        expect(result).toEqual([
            {
                path: 'src/utils/helper.js',
                afferent: 5,
                efferent: 10,
            },
            {
                path: 'src/core/index.js',
                afferent: 3,
                efferent: 7,
            },
        ]);
    });

    test('extractMetricsFromArtifact: returns efferent as undefined when no match is found', () => {
        const result = extractMetricsFromArtifact(partialArtifact);
        expect(result).toEqual([
            {
                path: 'src/isolated/file.js',
                afferent: 1,
                efferent: undefined,
            },
        ]);
    });

    test('extractMetricsFromArtifact: returns empty array if no afferent metrics exist', () => {
        const result = extractMetricsFromArtifact(noAfferent);
        expect(result).toEqual([]);
    });

    test('extractMetricsFromArtifact: throws or fails gracefully if structure is invalid', () => {
        expect(() => extractMetricsFromArtifact({})).toThrow();
        expect(() => extractMetricsFromArtifact({ runs: [] })).toThrow();
    });
});
