import askGitHub from "./githubRepoRequest.js";

const hasAccessToGitHubRepository = async (githubHead) => {
    const request = await askGitHub(githubHead);

    return request.status === 200;
}

export default hasAccessToGitHubRepository;