import JSZip from 'jszip';
import askGitHub from './githubRepoRequest.js';

const METRIC_SOURCE = 'CodeQL';
const ARTEFACT_FILE_NAME= 'codeql-results';

const retreiveCodeQLArtifact = async (githubHead, pullRequest) => {
    const runId = await retrieveRunIdForPR(githubHead, pullRequest);
    const artifactId = await retrieveCodeQLArtifactId(githubHead, runId);
    const artifact = await retrieveCodeQLArtifact(githubHead, artifactId);

    return artifact;
}

const retrieveRunIdForPR = async (githubHead, pullRequest) => {
    const head = pullRequest.sha;
    const number = pullRequest.number;
    const queryUrl = `actions/runs?head_sha=${head}&event=pull_request&status=completed`;

    const response = await askGitHub(githubHead, queryUrl)
    const data = await response.json();

    const runs = data.workflow_runs.filter(run => run.name === METRIC_SOURCE && run.pull_requests.some(pr => pr.number === number));
    const sortedRuns = runs.sort((run1, run2) => new Date(run2.created_at) - new Date(run1.created_at));

    if (runs.length === 0) {
        throw new Error(`Analysis still pending for PR #${pullRequestNumber}.`);
    }

    return sortedRuns[0].id;
}

const retrieveCodeQLArtifactId = async (githubHead, runId) => {
    const queryUrl = `actions/runs/${runId}/artifacts`;

    const response = await askGitHub(githubHead, queryUrl);
    const data = await response.json();

    const artefact = data.artifacts.find(artifact => artifact.name === ARTEFACT_FILE_NAME);

    if (!artefact) {
        throw new Error('CodeQL artefact not found');
    }

    return artefact.id;
}

const retrieveCodeQLArtifact = async (githubHead, artifactId) => {
    const artifactUrl = `actions/artifacts/${artifactId}/zip`;

    try {
        const response = await askGitHub(githubHead, artifactUrl);
        const zipBuffer = await response.arrayBuffer();

        const zip = await JSZip.loadAsync(zipBuffer);
        const sarifFile = zip.file('java.sarif');

        if (!sarifFile) {
            throw new Error('CodeQL SARIF file "java.sarif" not found in artifact.');
        }

        const sarifContent = await sarifFile.async('string');
        return JSON.parse(sarifContent);
    } catch (error) {
        console.error('Failed to retrieve and parse CodeQL artifact:', error);
        throw error;
    }
};

export default retreiveCodeQLArtifact;