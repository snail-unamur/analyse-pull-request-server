import askSonarQube from "../../api/sonarqubeRepoRequest.js";

const METRIC_SOURCE = 'SonarQube';

const retreiveSonarQubeMetrics = async (githubHead, settings, prNumber) => {
    const sonnarMetrics = settings.filter(metric => metric.source === 'sonarqube');// METRIC_SOURCE);

    const projectKey = `${githubHead.repoOwner}_${githubHead.repoName}`;
    const metricsQuery = sonnarMetrics.map(metric => metric.id).join('%2C');

    const response = await askSonarQube(projectKey, prNumber, metricsQuery);
    const data = await response.json();

    return data.component.measures.map(measure => {
        const metricSetting = sonnarMetrics.find(metric => metric.id === measure.metric);

        return {
            id: metricSetting.id,
            name: metricSetting.name,
            checked: metricSetting.checked,
            coefficient: metricSetting.coefficient,
            value: parseFloat(measure.value),
            source: metricSetting.source
        };
    });
}

export default retreiveSonarQubeMetrics;