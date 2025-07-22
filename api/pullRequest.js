import askGitHub from "./githubRequest.js";
import { logGithub } from "../utils/logger.js";

export const retrieveFileInPR = async (githubHead, prNumber) => {
    const queryUrl = `pulls/${prNumber}/files`;

    logGithub(`Retrieving files in PR#${prNumber}`);
    const response = await askGitHub(githubHead, queryUrl);
    const data = await response.json();

    return data.map(d => d.filename);
}