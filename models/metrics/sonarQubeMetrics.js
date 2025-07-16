import askSonarQube from "../../api/sonarqubeRepoRequest.js";

const METRIC_SOURCE = 'SonarQube';
const METRIC_WITH_PERIODS = ['new_coverage'];

const retreiveSonarQubeMetrics = async (githubHead, settings, prNumber) => {
    const sonnarMetrics = settings.filter(metric => metric.source === METRIC_SOURCE);
    if (!sonnarMetrics.some(m => m.checked)) {
        return [];
    }

    const projectKey = `${githubHead.repoOwner}_${githubHead.repoName}`;
    const metricsQuery = sonnarMetrics.map(metric => metric.id).join('%2C');

    const response = await askSonarQube(projectKey, prNumber, metricsQuery);
    const data = await response.json();

    return data.component.measures.map(measure => {
        const metricSetting = sonnarMetrics.find(metric => metric.id === measure.metric);

        let value = measure.value;

        if (METRIC_WITH_PERIODS.includes(measure.metric)) {
            value = measure.periods[0].value;
        }

        return {
            id: metricSetting.id,
            name: metricSetting.name,
            checked: metricSetting.checked,
            coefficient: metricSetting.coefficient,
            value: parseFloat(value),
            source: metricSetting.source
        };
    });
}

export default retreiveSonarQubeMetrics;