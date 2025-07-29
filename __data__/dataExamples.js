export const configuration = {
    analysis_metrics: {
        default: [
            {
                id: 'ncloc',
                checked: true,
            },
            {
                id: 'new_coverage',
                checked: true,
            },
            {
                id: 'files',
                checked: true,
            }
        ],
        radar: [
            {
                id: 'complexity',
                checked: true,
                thresholds: {
                    a: { lower_bound: 0, upper_bound: 3 },
                    b: { lower_bound: 3, upper_bound: 6 },
                    c: { lower_bound: 6, upper_bound: 9 },
                    d: { lower_bound: 9, upper_bound: 12 },
                    e: { lower_bound: 12, upper_bound: 15 },
                },
            },
            {
                id: 'cognitive_complexity',
                checked: true,
                thresholds: {
                    a: { lower_bound: 0, upper_bound: 3 },
                    b: { lower_bound: 3, upper_bound: 6 },
                    c: { lower_bound: 6, upper_bound: 9 },
                    d: { lower_bound: 9, upper_bound: 12 },
                    e: { lower_bound: 12, upper_bound: 15 },
                },
            },
            {
                id: 'instability',
                checked: true,
                thresholds: {
                    a: { lower_bound: 0, upper_bound: 0.2 },
                    b: { lower_bound: 0.2, upper_bound: 0.4 },
                    c: { lower_bound: 0.4, upper_bound: 0.6 },
                    d: { lower_bound: 0.6, upper_bound: 0.8 },
                    e: { lower_bound: 0.8, upper_bound: 1 },
                },
            }
        ]
    }
}

export const sonarMetricsCatA = [
    {
        id: 'complexity',
        value: 2,
        default: false
    },
    {
        id: 'cognitive_complexity',
        value: 2,
        default: false
    },
    {
        id: 'ncloc',
        value: 2,
        default: true
    },
    {
        id: 'new_coverage',
        value: 0.9,
        default: true
    },
    {
        id: 'files',
        value: 3,
        default: true
    }
];

export const codeqlMetricsCatA = [
    {
        id: 'instability',
        value: 0.1,
        default: false
    },
];

export const metricsCatA = [...sonarMetricsCatA, ...codeqlMetricsCatA];

export const sonarMetricsCatB = [
    {
        id: 'complexity',
        value: 4,
        default: false
    },
    {
        id: 'cognitive_complexity',
        value: 4,
        default: false
    },
    {
        id: 'ncloc',
        value: 7,
        default: true
    },
    {
        id: 'new_coverage',
        value: 0.7,
        default: true
    },
    {
        id: 'files',
        value: 3,
        default: true
    }
];

export const codeqlMetricsCatB = [
    {
        id: 'instability',
        value: 0.3,
        default: false
    },
];

export const metricsCatB = [...sonarMetricsCatB, ...codeqlMetricsCatB];

export const sonarMetricsCatC = [
    {
        id: 'complexity',
        value: 7,
        default: false
    },
    {
        id: 'cognitive_complexity',
        value: 7,
        default: false
    },
    {
        id: 'ncloc',
        value: 15,
        default: true
    },
    {
        id: 'new_coverage',
        value: 0.5,
        default: true
    },
    {
        id: 'files',
        value: 3,
        default: true
    }
];

export const codeqlMetricsCatC = [
    {
        id: 'instability',
        value: 0.5,
        default: false
    },
];

export const metricsCatC = [...sonarMetricsCatC, ...codeqlMetricsCatC];

export const sonarMetricsCatD = [
    {
        id: 'complexity',
        value: 10,
        default: false
    },
    {
        id: 'cognitive_complexity',
        value: 10,
        default: false
    },
    {
        id: 'ncloc',
        value: 25,
        default: true
    },
    {
        id: 'new_coverage',
        value: 0.3,
        default: true
    },
    {
        id: 'files',
        value: 3,
        default: true
    }
];

export const codeqlMetricsCatD = [
    {
        id: 'instability',
        value: 0.7,
        default: false
    },
];

export const metricsCatD = [...sonarMetricsCatD, ...codeqlMetricsCatD];

export const sonarMetricsCatE = [
    {
        id: 'complexity',
        value: 20,
        default: false
    },
    {
        id: 'cognitive_complexity',
        value: 20,
        default: false
    },
    {
        id: 'ncloc',
        value: 35,
        default: true
    },
    {
        id: 'new_coverage',
        value: 0.1,
        default: true
    },
    {
        id: 'files',
        value: 3,
        default: true
    }
];

export const codeqlMetricsCatE = [
    {
        id: 'instability',
        value: 0.9,
        default: false
    },
];

export const metricsCatE = [...sonarMetricsCatE, ...codeqlMetricsCatE];

export const sonarMetricsWorstCase = [
    {
        id: 'complexity',
        value: 100,
        default: false
    },
    {
        id: 'cognitive_complexity',
        value: 100,
        default: false
    },
    {
        id: 'ncloc',
        value: 100,
        default: true
    },
    {
        id: 'new_coverage',
        value: 0.0,
        default: true
    },
    {
        id: 'files',
        value: 3,
        default: true
    }
];

export const codeqlMetricsWorstCase = [
    {
        id: 'instability',
        value: 1.0,
        default: false
    },
];

export const metricsWorstCase = [...sonarMetricsWorstCase, ...codeqlMetricsWorstCase];

export const sonarMetricsBestCase = [
    {
        id: 'complexity',
        value: 0,
        default: false
    },
    {
        id: 'cognitive_complexity',
        value: 0,
        default: false
    },
    {
        id: 'ncloc',
        value: 0,
        default: true
    },
    {
        id: 'new_coverage',
        value: 1.0,
        default: true
    },
    {
        id: 'files',
        value: 3,
        default: true
    }
];

export const codeqlMetricsBestCase = [
    {
        id: 'instability',
        value: 0.0,
        default: false
    },
];

export const metricsBestCase = [...sonarMetricsBestCase, ...codeqlMetricsBestCase];