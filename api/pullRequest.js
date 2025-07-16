import askGitHub from "./githubRepoRequest.js";

export const retrieveFileInPR = async (githubHead, prNumber) => {
    const queryUrl = `pulls/${prNumber}/files`;

    const response = await askGitHub(githubHead, queryUrl);
    const data = await response.json();

    return data.map(d => d.filename);
}