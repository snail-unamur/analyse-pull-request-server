import retreiveCodeQLArtifact from "../../api/codeQLRequest.js";

const AFFERENT_COUPLING_METRIC_ID = 'java/afferent-coupling';
const EFFERENT_COUPLING_METRIC_ID = 'java/efferent-coupling';

const retreiveCodeQLMetrics = async (githubHead, metric, pullRequest) => {
    const metrics = metric.filter(metric => metric.source === 'codeql'); // METRIC_SOURCE);

    const artifact = await retreiveCodeQLArtifact(githubHead, pullRequest);
    const codeQLMetrics = extractMetricsFromArtifact(artifact);

    const meanInstability = calculateMeanInstability(codeQLMetrics);

    metrics[0].value = meanInstability;
    delete metrics[0]._id;

    return metrics;
}

const extractMetricsFromArtifact = (codeQLArtefact) => {
    const allMetrics = codeQLArtefact.runs[0].properties.metricResults;
    const afferentMetric = allMetrics.filter(m => m.rule.id === AFFERENT_COUPLING_METRIC_ID);
    const efferentMetric = allMetrics.filter(m => m.rule.id === EFFERENT_COUPLING_METRIC_ID);

    return afferentMetric.map(m => ({
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

export default retreiveCodeQLMetrics;