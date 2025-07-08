const githubApi = 'https://api.github.com';

const checkGitHubRepoAccess = async (repoOwner, repoName, accessToken) => {
    const repoUrl = `${githubApi}/repos/${repoOwner}/${repoName}`;
    const header = {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28"
    };

    const accessQuery = await fetch(repoUrl, {
        headers: header,
    });

    return accessQuery.status === 200;
}

export default checkGitHubRepoAccess;