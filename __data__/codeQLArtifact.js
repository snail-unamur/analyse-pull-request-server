import { AFFERENT_COUPLING_METRIC_ID, EFFERENT_COUPLING_METRIC_ID } from "../models/metrics/codeQLMetrics.js";

export const mockArtifact = {
    runs: [
        {
            properties: {
                metricResults: [
                    {
                        ruleId: `some-tool/${AFFERENT_COUPLING_METRIC_ID}`,
                        message: { text: 'src/utils/helper.js' },
                        value: 5,
                    },
                    {
                        ruleId: `some-tool/${EFFERENT_COUPLING_METRIC_ID}`,
                        message: { text: 'src/utils/helper.js' },
                        value: 10,
                    },
                    {
                        ruleId: `some-tool/${AFFERENT_COUPLING_METRIC_ID}`,
                        message: { text: 'src/core/index.js' },
                        value: 3,
                    },
                    {
                        ruleId: `some-tool/${EFFERENT_COUPLING_METRIC_ID}`,
                        message: { text: 'src/core/index.js' },
                        value: 7,
                    },
                ],
            },
        },
    ],
};

export const partialArtifact = {
    runs: [
        {
            properties: {
                metricResults: [
                    {
                        ruleId: `some-tool/${AFFERENT_COUPLING_METRIC_ID}`,
                        message: { text: 'src/isolated/file.js' },
                        value: 1,
                    },
                    // No matching efferent
                ],
            },
        },
    ],
};

export const noAfferent = {
    runs: [
        {
            properties: {
                metricResults: [
                    {
                        ruleId: `some-tool/${EFFERENT_COUPLING_METRIC_ID}`,
                        message: { text: 'src/only/efferent.js' },
                        value: 4,
                    },
                ],
            },
        },
    ],
};