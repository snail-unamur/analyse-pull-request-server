import retrieveCodeQLArtifact from "../../api/codeQLRequest.js";
import { retrieveFileInPR } from "../../api/pullRequest.js";

const AFFERENT_COUPLING_METRIC_ID = 'afferent-coupling';
const EFFERENT_COUPLING_METRIC_ID = 'efferent-coupling';
const METRIC_SOURCE = 'CodeQL';

const retrieveCodeQLMetrics = async (githubHead, metric, prNumber) => {
    const metrics = metric.filter(metric => metric.source === METRIC_SOURCE);
    if (!metrics.some(m => m.checked)) {
        return [];
    }

    const [artifact, modifiedFileInPr] = await Promise.all([
        retrieveCodeQLArtifact(githubHead, prNumber),
        retrieveFileInPR(githubHead, prNumber)
    ]);

    const codeQLMetrics = extractMetricsFromArtifact(artifact);
    const updatedModuleMetrics = codeQLMetrics.filter(m => modifiedFileInPr.includes(m.path));

    const meanInstability = calculateMeanInstability(updatedModuleMetrics);

    metrics[0].value = meanInstability;
    delete metrics[0]._id;

    return metrics;
}

const extractMetricsFromArtifact = (codeQLArtefact) => {
    const allMetrics = codeQLArtefact.runs[0].properties.metricResults;

    const afferentMetric = allMetrics.filter(m => m.ruleId.includes(AFFERENT_COUPLING_METRIC_ID));
    const efferentMetric = allMetrics.filter(m => m.ruleId.includes(EFFERENT_COUPLING_METRIC_ID));

    return afferentMetric.map(m => ({
        path: m.message.text,
        afferent: m.value,
        efferent: efferentMetric.find(ef => ef.message.text === m.message.text)?.value
    }));
}

const calculateMeanInstability = (metrics) => {
    const instabilityArray = metrics.map(metric => calculateInstabilityMetric(metric));
    const totalInstability = instabilityArray.reduce((acc, i) => acc + i, 0);

    return parseFloat((totalInstability / instabilityArray.length).toFixed(2));
}

const calculateInstabilityMetric = (metric) => {
    const efferent = parseFloat(metric.efferent) || 0;
    const afferent = parseFloat(metric.afferent) || 0;
    const total = efferent + afferent;

    return total === 0 ? 0 : efferent / total;
}

export default retrieveCodeQLMetrics;