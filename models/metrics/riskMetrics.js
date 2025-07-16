const calculateRiskMetric = (metrics, riskValueTresholds) => {
    const enabledMetrics = metrics.filter(metric => metric.checked && !isNaN(metric.value));
    const riskValue = calculateRiskValue(enabledMetrics);
    const riskCategory = calculateRiskCategory(riskValue, riskValueTresholds);

    return {
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

    return (metricSum / coefficientSum).toFixed(2);
}

const calculateRiskCategory = (value, metricLevel) => {
    value = value / 10; // Should be multiply by 100

    if (metricLevel.a.lower_bound <= value && value <= metricLevel.a.upper_bound) {
        return 'A';
    }
    else if (metricLevel.b.lower_bound < value && value <= metricLevel.b.upper_bound) {
        return 'B';
    }
    else if (metricLevel.c.lower_bound < value && value <= metricLevel.c.upper_bound) {
        return 'C';
    }
    else if (metricLevel.d.lower_bound < value && value <= metricLevel.d.upper_bound) {
        return 'D';
    }
    return 'E';
}

export default calculateRiskMetric;