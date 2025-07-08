const checkGitHubRepoAccess = async (repoOwner, repoName, accessToken) => {
    const githubUserApi = 'https://api.github.com/user';
    const header = {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28"
    };

    const user = await fetch(githubUserApi, {
        headers: header
    });

    const userName = (await user.json()).login;
    const repoUrl = `  https://api.github.com/repos/${repoOwner}/${repoName}/collaborators/${userName}`;

    const accessQuery = await fetch(repoUrl, {
        headers: header
    });

    return accessQuery.status === 204;
}

export default checkGitHubRepoAccess;