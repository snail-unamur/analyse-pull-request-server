import { logSonar } from "../utils/logger.js";

const askSonar = async (projectKey, prNumber, metricsQuery) => {
    const sonarToken = process.env.SONAR_TOKEN;
    const sonarUrl = process.env.SONAR_URL;
    const url = `${sonarUrl}/api/measures/component?metricKeys=${metricsQuery}&component=${projectKey}&pullRequest=${prNumber}`;

    logSonar('Retrieving Sonar metrics');

    const response = await fetch(url, {
        headers: {
            "Authorization": `Bearer ${sonarToken}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error('Request to Sonar failed.');
    }
    return response;
}

export default askSonar;