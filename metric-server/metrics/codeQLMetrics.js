import JSZip from 'jszip';

const baseUrl = 'https://api.github.com/repos';

const retreiveCodeQLMetrics = async (metric, repoOwner, repoName, pullRequest, token) => {
    const metrics = metric.filter(metric => metric.source === 'codeql');

    const runIdForPR = await retreiveRunIdForPR(repoOwner, repoName, pullRequest, token);
    const codeQLArtefactId = await retreiveCodeQLArtefactId(repoOwner, repoName, runIdForPR, token);
    const codeQLArtefact = await retreiveCodeQLArtefact(repoOwner, repoName, codeQLArtefactId, token);
    const codeQLMetrics = getCodeQLMetricsFromArtefact(codeQLArtefact);
    const meanInstability = calculateMeanInstabilityMetric(codeQLMetrics);

    metrics[0].value = meanInstability;
    delete metrics[0]._id;

    return metrics;
}

const retreiveRunIdForPR = async (repoOwner, repoName, pullRequest, token) => {
    const head = pullRequest.sha;
    const number = pullRequest.number;

    const url = `${baseUrl}/${repoOwner}/${repoName}/actions/runs?head_sha=${head}&event=pull_request&status=completed`;

    const response = await fetch(url, {
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${token}`,

            "X-GitHub-Api-Version": "2022-11-28"
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch CodeQL metrics');
    }
    const data = await response.json();
    const runs = data.workflow_runs.filter(run => run.name === 'CodeQL' && run.pull_requests.some(pr => pr.number === number));
    const sortedRuns = runs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (runs.length === 0) {
        throw new Error(`Analysis still pending for PR #${pullRequestNumber}.`);
    }

    return sortedRuns[0].id;
}

const retreiveCodeQLArtefactId = async (repoOwner, repoName, runId, token) => {
    const url = `${baseUrl}/${repoOwner}/${repoName}/actions/runs/${runId}/artifacts`;

    const response = await fetch(url, {
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28"
        }
    });
    if (!response.ok) {
        throw new Error('Failed to fetch CodeQL artefacts');
    }
    const data = await response.json();
    const artefact = data.artifacts.find(artifact => artifact.name === 'codeql-results');

    if (!artefact) {
        throw new Error('CodeQL artefact not found');
    }

    return artefact.id;
}

const retreiveCodeQLArtefact = async (repoOwner, repoName, artefactId, token) => {
    const url = `${baseUrl}/${repoOwner}/${repoName}/actions/artifacts/${artefactId}/zip`;

    const response = await fetch(url, {
        headers: {
            "Accept": "application/vnd.github+json",
            "Authorization": `Bearer ${token}`,
            "X-GitHub-Api-Version": "2022-11-28"
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch CodeQL artefact');
    }

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