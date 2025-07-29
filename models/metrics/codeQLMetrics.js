import retrieveCodeQLArtifact from "../../api/codeQLRequest.js";
import { retrieveFileInPR } from "../../api/pullRequest.js";
import { mean } from "../../utils/math.js";
import calculateInstability from "./instabilityCalculation.js";

export const AFFERENT_COUPLING_CODEQL_ID = 'afferent-coupling';
export const EFFERENT_COUPLING_CODEQL_ID = 'efferent-coupling';
export const LACK_OF_COHESION_CODEQL_ID = 'lack-cohesion-ck';

const METRIC_SOURCE = 'CodeQL';

const retrieveCodeQLMetrics = async (githubHead, metricConfigs, prNumber) => {
    const codeQLMetrics = metricConfigs.filter(
        metric => metric.source === METRIC_SOURCE
    );

    if (!codeQLMetrics || codeQLMetrics.length === 0) {
        return [];
    }

    const [artifact, modifiedFilesInPr] = await Promise.all([
        retrieveCodeQLArtifact(githubHead, prNumber),
        retrieveFileInPR(githubHead, prNumber)
    ]);

    return codeQLMetrics.map(metric => {
        const strategy = metricStrategies.find(s => s.id === metric.id);

        const rawMetrics = strategy.extract(artifact);
        const filteredMetrics = strategy.filter(rawMetrics, modifiedFilesInPr);
        const value = strategy.aggregate(filteredMetrics);

        return {
            id: strategy.id,
            value,
            default: metric.thresholds === undefined
        };
    })
};

export const extractInstabilityMetricsFromArtifact = (codeQLArtefact) => {
    const allMetrics = codeQLArtefact.runs[0].properties.metricResults;

    const afferentMetric = allMetrics.filter(m => m.ruleId.includes(AFFERENT_COUPLING_CODEQL_ID));
    const efferentMetric = allMetrics.filter(m => m.ruleId.includes(EFFERENT_COUPLING_CODEQL_ID));

    return afferentMetric.map(m => {
        const afferent = parseFloat(m.value) || 0;
        const efferent = parseFloat(efferentMetric.find(ef => ef.message.text === m.message.text)?.value) || 0;

        const instability = calculateInstability(afferent, efferent);

        return {
            path: m.message.text,
            value: instability
        }
    });
}

export const extractCohesionMetricsFromArtifact = (codeQLArtefact) => {
    const allMetrics = codeQLArtefact.runs[0].properties.metricResults;

    const cohesionMetric = allMetrics.filter(m => m.ruleId.includes(LACK_OF_COHESION_CODEQL_ID));

    return cohesionMetric.map(m => ({
        path: m.message.text,
        value: m.value
    }))
}

const metricStrategies = [
    {
        id: 'instability',
        extract: extractInstabilityMetricsFromArtifact,
        filter: (metrics, modifiedFiles) =>
            metrics.filter(metric => modifiedFiles.includes(metric.path)),
        aggregate: mean,
    },
    {
        id: 'lackOfCohesion',
        extract: extractCohesionMetricsFromArtifact,
        filter: (metrics, modifiedFiles) =>
            metrics.filter(metric => modifiedFiles.includes(metric.path)),
        aggregate: mean,
    },
];

export default retrieveCodeQLMetrics;