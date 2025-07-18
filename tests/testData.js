export const pullRequest = {
    analysis_metrics: [
        { id: 'complexity', checked: true, source: 'SonarQube' },
        { id: 'cognitive_complexity', checked: true, source: 'SonarQube' },
        { id: 'ncloc', checked: true, source: 'SonarQube' },
        { id: 'instability', checked: true, source: 'CodeQL' },
        { id: 'new_coverage', checked: true, source: 'SonarQube' }
    ],
    radar_thresholds: {
        complexity: {
            a: {
                lower_bound: 0,
                upper_bound: 3,
            },
            b: {
                lower_bound: 3,
                upper_bound: 6,
            },
            c: {
                lower_bound: 6,
                upper_bound: 9,
            },
            d: {
                lower_bound: 9,
                upper_bound: 12,
            },
            e: {
                lower_bound: 12,
                upper_bound: 15,
            },
        },
        cognitive_complexity: {
            a: {
                lower_bound: 0,
                upper_bound: 3,
            },
            b: {
                lower_bound: 3,
                upper_bound: 6,
            },
            c: {
                lower_bound: 6,
                upper_bound: 9,
            },
            d: {
                lower_bound: 9,
                upper_bound: 12,
            },
            e: {
                lower_bound: 12,
                upper_bound: 15,
            },
        },
        ncloc: {
            a: {
                lower_bound: 0,
                upper_bound: 5,
            },
            b: {
                lower_bound: 5,
                upper_bound: 10,
            },
            c: {
                lower_bound: 10,
                upper_bound: 20,
            },
            d: {
                lower_bound: 20,
                upper_bound: 30,
            },
            e: {
                lower_bound: 30,
                upper_bound: 40,
            },
        },
        instability: {
            a: {
                lower_bound: 0,
                upper_bound: 0.2,
            },
            b: {
                lower_bound: 0.2,
                upper_bound: 0.4,
            },
            c: {
                lower_bound: 0.4,
                upper_bound: 0.6,
            },
            d: {
                lower_bound: 0.6,
                upper_bound: 0.8,
            },
            e: {
                lower_bound: 0.8,
                upper_bound: 1,
            },
        },
        new_coverage: {
            a: {
                lower_bound: 0,
                upper_bound: 0.2,
            },
            b: {
                lower_bound: 0.2,
                upper_bound: 0.4,
            },
            c: {
                lower_bound: 0.4,
                upper_bound: 0.6,
            },
            d: {
                lower_bound: 0.6,
                upper_bound: 0.8,
            },
            e: {
                lower_bound: 0.8,
                upper_bound: 1,
            },
        },
    }
}

export const sonarMetricsCatA = [
    {
        id: 'complexity',
        value: 2,
    },
    {
        id: 'cognitive_complexity',
        value: 2,
    },
    {
        id: 'ncloc',
        value: 2
    },
    {
        id: 'new_coverage',
        value: 0.9
    }
];

export const codeqlMetricsCatA = [
    {
        id: 'instability',
        value: 0.1,
    },
];

export const metricsCatA = [...sonarMetricsCatA, ...codeqlMetricsCatA];

export const sonarMetricsCatB = [
    {
        id: 'complexity',
        value: 4,
    },
    {
        id: 'cognitive_complexity',
        value: 4,
    },
    {
        id: 'ncloc',
        value: 7
    },
    {
        id: 'new_coverage',
        value: 0.7
    }
];

export const codeqlMetricsCatB = [
    {
        id: 'instability',
        value: 0.3,
    },
];

export const metricsCatB = [...sonarMetricsCatB, ...codeqlMetricsCatB];

export const sonarMetricsCatC = [
    {
        id: 'complexity',
        value: 7,
    },
    {
        id: 'cognitive_complexity',
        value: 7,
    },
    {
        id: 'ncloc',
        value: 15
    },
    {
        id: 'new_coverage',
        value: 0.5
    }
];

export const codeqlMetricsCatC = [
    {
        id: 'instability',
        value: 0.5,
    },
];

export const metricsCatC = [...sonarMetricsCatC, ...codeqlMetricsCatC];

export const sonarMetricsCatD = [
    {
        id: 'complexity',
        value: 10,
    },
    {
        id: 'cognitive_complexity',
        value: 10,
    },
    {
        id: 'ncloc',
        value: 25
    },
    {
        id: 'new_coverage',
        value: 0.3
    }
];

export const codeqlMetricsCatD = [
    {
        id: 'instability',
        value: 0.7,
    },
];

export const metricsCatD = [...sonarMetricsCatD, ...codeqlMetricsCatD];

export const sonarMetricsCatE = [
    {
        id: 'complexity',
        value: 20,
    },
    {
        id: 'cognitive_complexity',
        value: 20,
    },
    {
        id: 'ncloc',
        value: 35
    },
    {
        id: 'new_coverage',
        value: 0.1
    }
];

export const codeqlMetricsCatE = [
    {
        id: 'instability',
        value: 0.9,
    },
];

export const metricsCatE = [...sonarMetricsCatE, ...codeqlMetricsCatE];

export const sonarMetricsWorstCase = [
    {
        id: 'complexity',
        value: 100,
    },
    {
        id: 'cognitive_complexity',
        value: 100,
    },
    {
        id: 'ncloc',
        value: 100
    },
    {
        id: 'new_coverage',
        value: 0.0
    }
];

export const codeqlMetricsWorstCase = [
    {
        id: 'instability',
        value: 1.0,
    },
];

export const metricsWorstCase = [...sonarMetricsWorstCase, ...codeqlMetricsWorstCase];

export const sonarMetricsBestCase = [
    {
        id: 'complexity',
        value: 0,
    },
    {
        id: 'cognitive_complexity',
        value: 0,
    },
    {
        id: 'ncloc',
        value: 0
    },
    {
        id: 'new_coverage',
        value: 1.0
    }
];

export const codeqlMetricsBestCase = [
    {
        id: 'instability',
        value: 0.0,
    },
];

export const metricsBestCase = [...sonarMetricsBestCase, ...codeqlMetricsBestCase];