const calculateMetrics = (prNumber, metrics, riskValueTresholds) => {
    const enabledMetrics = metrics.filter(metric => metric.checked);
    const riskValue = calculateRiskValue(enabledMetrics);
    const riskCategory = calculateMetricCategory(riskValue, riskValueTresholds);

    return {
        prNumber: prNumber,
        analysis: {
            riskValue: riskValue,
            riskCategory: riskCategory,
            metrics: enabledMetrics,
        }
    }
}

const calculateRiskValue = (enabledMetrics) => {
    let coefficientSum = 0;
    let metricSum = 0;

    enabledMetrics.forEach(metric => {
        metricSum += metric.value * metric.coefficient;
        coefficientSum += metric.coefficient;
    });

    return ((metricSum / coefficientSum) * 25).toFixed(2);
}

const calculateMetricCategory = (value, metricLevel) => {
    let category;

    value = value / 1000;

    if (metricLevel.e.lower_bound / 100 <= value && value <= metricLevel.e.upper_bound / 100) {
        category = 'E';
    }
    else if (metricLevel.d.lower_bound / 100 < value && value <= metricLevel.d.upper_bound / 100) {
        category = 'D';
    }
    else if (metricLevel.c.lower_bound / 100 < value && value <= metricLevel.c.upper_bound / 100) {
        category = 'C';
    }
    else if (metricLevel.b.lower_bound / 100 < value && value <= metricLevel.b.upper_bound / 100) {
        category = 'B';
    }
    else if (metricLevel.a.lower_bound / 100 <= value && value <= metricLevel.a.upper_bound / 100) {
        category = 'A';
    }

    return category
}

export default calculateMetrics;