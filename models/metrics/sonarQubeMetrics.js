import askSonarQube from "../../api/sonarqubeRepoRequest.js";

const METRIC_SOURCE = 'SonarQube';
const METRIC_WITH_PERIODS = ['new_coverage'];

const retrieveSonarQubeMetrics = async (githubHead, metrics, prNumber) => {
    const sonarMetrics = metrics.filter(metric => metric.source === METRIC_SOURCE);
    if (!sonarMetrics) {
        return [];
    }

    const projectKey = `${githubHead.repoOwner}_${githubHead.repoName}`;
    const metricsQuery = sonarMetrics.map(metric => metric.id).join('%2C');

    const response = await askSonarQube(projectKey, prNumber, metricsQuery);
    const data = await response.json();

    return data.component.measures.map(measure => {
        const metric = sonarMetrics.find(m => m.id === measure.metric);

        let value = measure.value;

        if (METRIC_WITH_PERIODS.includes(measure.metric)) {
            value = measure.periods[0].value;
        }

        return {
            id: metric.id,
            value: parseFloat(value),
        };
    });
}

export default retrieveSonarQubeMetrics;