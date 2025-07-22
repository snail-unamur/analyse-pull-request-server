const GITHUB_BASE_URL = 'https://api.github.com/repos';

const askGitHub = async (githubHead, queryUrl) => {
    let url = `${GITHUB_BASE_URL}/${githubHead.repoOwner}/${githubHead.repoName}`;
    if (queryUrl) {
        url = url.concat(`/${queryUrl}`);
    }

    const header = {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${githubHead.accessToken}`,
        "X-GitHub-Api-Version": "2022-11-28"
    };

    const result = await fetch(url, {
        headers: header,
    });

    if (!result.ok) {
        throw new Error('Request to GitHub failed.');
    }

    return result;
}

export default askGitHub;