const askSonarQube = async (projectKey, prNumber, metricsQuery) => {
    const sonarqubeToken = process.env.SONARQUBE_CLOUD_TOKEN;
    const sonarqubeUrl = process.env.SONARQUBE_CLOUD_URL;
    const url = `${sonarqubeUrl}/api/measures/component?metricKeys=${metricsQuery}&component=${projectKey}&pullRequest=${prNumber}`;

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${sonarqubeToken}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error('Request to SonarQube failed.');
    }
    return response;
}

export default askSonarQube;