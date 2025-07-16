import askGitHub from "./githubRepoRequest.js";
import { logGithub } from "../utils/logger.js";

export const retrieveFileInPR = async (githubHead, prNumber) => {
    const queryUrl = `pulls/${prNumber}/files`;

    logGithub(`retrieving files in PR#${prNumber}`);
    const response = await askGitHub(githubHead, queryUrl);
    const data = await response.json();

    return data.map(d => d.filename);
}