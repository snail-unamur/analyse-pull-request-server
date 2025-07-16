import askGitHub from "../api/githubRepoRequest.js";
import { logGithub } from "./logger.js";

const hasAccessToGitHubRepository = async (githubHead) => {
    logGithub('Retrieving repository access')
    const request = await askGitHub(githubHead);

    return request.status === 200;
}

export default hasAccessToGitHubRepository;