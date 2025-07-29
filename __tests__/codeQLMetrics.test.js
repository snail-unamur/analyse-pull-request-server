import { extractInstabilityMetricsFromArtifact } from "../models/metrics/codeQLMetrics.js";
import { mockArtifact, noAfferent, partialArtifact } from "../__data__/codeQLArtifact.js";

describe('calculateCodeQLMetric', () => {
    test('extractMetricsFromArtifact: correctly extracts and matches afferent and efferent metrics', () => {
        const result = extractInstabilityMetricsFromArtifact(mockArtifact);
        expect(result).toEqual([
            {
                path: 'src/utils/helper.js',
                value: 0.67,
            },
            {
                path: 'src/core/index.js',
                value: 0.7,
            },
        ]);
    });

    test('extractMetricsFromArtifact: returns efferent as undefined when no match is found', () => {
        const result = extractInstabilityMetricsFromArtifact(partialArtifact);
        expect(result).toEqual([
            {
                path: 'src/isolated/file.js',
                value: 0,
            },
        ]);
    });

    test('extractMetricsFromArtifact: returns empty array if no afferent metrics exist', () => {
        const result = extractInstabilityMetricsFromArtifact(noAfferent);
        expect(result).toEqual([]);
    });

    test('extractMetricsFromArtifact: throws or fails gracefully if structure is invalid', () => {
        expect(() => extractInstabilityMetricsFromArtifact({})).toThrow();
        expect(() => extractInstabilityMetricsFromArtifact({ runs: [] })).toThrow();
    });
});
