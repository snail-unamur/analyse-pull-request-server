import JSZip from 'jszip';
import askGitHub from '../utils/githubRepoRequest.js';

const METRIC_SOURCE = "CodeQL"

const retreiveCodeQLMetrics = async (githubHead, metric, pullRequest) => {
    const metrics = metric.filter(metric => metric.source === 'codeql'); // METRIC_SOURCE);

    const runId = await retreiveRunIdForPR(githubHead, pullRequest);
    const artefactId = await retreiveCodeQLArtefactId(githubHead, runId);
    const artefact = await retreiveCodeQLArtefact(githubHead, artefactId);
    const codeQLMetrics = getCodeQLMetricsFromArtefact(artefact);
    const meanInstability = calculateMeanInstabilityMetric(codeQLMetrics);

    metrics[0].value = meanInstability;
    delete metrics[0]._id;

    return metrics;
}

const retreiveRunIdForPR = async (githubHead, pullRequest) => {
    const head = pullRequest.sha;
    const number = pullRequest.number;
    const queryUrl = `actions/runs?head_sha=${head}&event=pull_request&status=completed`;

    const response = await askGitHub(githubHead, queryUrl)
    const data = await response.json();

    const runs = data.workflow_runs.filter(run => run.name === METRIC_SOURCE && run.pull_requests.some(pr => pr.number === number));
    const sortedRuns = runs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (runs.length === 0) {
        throw new Error(`Analysis still pending for PR #${pullRequestNumber}.`);
    }

    return sortedRuns[0].id;
}

const retreiveCodeQLArtefactId = async (githubHead, runId) => {
    const queryUrl = `actions/runs/${runId}/artifacts`;

    const response = await askGitHub(githubHead, queryUrl);
    const data = await response.json();
    const artefact = data.artifacts.find(artifact => artifact.name === 'codeql-results');

    if (!artefact) {
        throw new Error('CodeQL artefact not found');
    }

    return artefact.id;
}

const retreiveCodeQLArtefact = async (githubHead, artefactId) => {
    const queryUrl = `actions/artifacts/${artefactId}/zip`;

    const response = await askGitHub(githubHead, queryUrl);

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const file = zip.file('java.sarif');

    if (!file) {
        throw new Error('CodeQL results file not found in artefact');
    }

    const content = await file.async('string');
    return JSON.parse(content);
}

const getCodeQLMetricsFromArtefact = (codeQLArtefact) => {
    const allMetrics = codeQLArtefact.runs[0].properties.metricResults;
    const afferentMetric = allMetrics.filter(m => m.rule.id === 'java/afferent-coupling');
    const efferentMetric = allMetrics.filter(m => m.rule.id === 'java/efferent-coupling');

    return afferentMetric.map(m => ({
        afferent: m.value,
        efferent: efferentMetric.find(ef => ef.message.text === m.message.text)?.value
    }));
}

const calculateMeanInstabilityMetric = (metrics) => {
    const instability = metrics.map(m => {
        const efferent = parseFloat(m.efferent) || 0;
        const afferent = parseFloat(m.afferent) || 0;
        const total = efferent + afferent;

        return total === 0 ? 0 : efferent / total;
    });

    const totalInstability = instability.reduce((acc, i) => acc + i, 0);

    return parseFloat((totalInstability / instability.length).toFixed(2));
}

export default retreiveCodeQLMetrics;