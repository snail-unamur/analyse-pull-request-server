const retreiveSonarQubeMetrics = async (settings, prNumber) => {
    const sonnarMetrics = settings.filter(metric => metric.source === 'sonarqube');

    const sonarqubeToken = process.env.SONARQUBE_CLOUD_TOKEN;
    const sonarqubeUrl = process.env.SONARQUBE_CLOUD_URL;
    const sonarqubeProjectKey = "RasWinIste_Repo-test"; //"myJavaProject";

    const metricsQuery = sonnarMetrics.map(metric => metric.id).join('%2C');
    const metricUrl = `${sonarqubeUrl}/api/measures/component?metricKeys=${metricsQuery}&component=${sonarqubeProjectKey}&pullRequest=${prNumber}`;

    const response = await fetch(metricUrl, {
        headers: {
            "Authorization": `Bearer ${sonarqubeToken}`,
            "Accept": "application/json"
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch SonarQube metrics');
    }
    const data = await response.json();
    return data.component.measures.map(measure => {
        const metricSetting = sonnarMetrics.find(metric => metric.id === measure.metric);
        if (!metricSetting) {
            throw new Error(`Metric setting not found for ${measure.metric}`);
        }

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