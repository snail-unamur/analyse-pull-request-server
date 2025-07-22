import metricsDescription from '../metricsDescription.json' with { type: 'json' };

const calculateRadarMetrics = (metrics, metricsConfig) => {
    return metrics.map(metric => {
        const config = metricsConfig.find(m => m.id === metric.id);
        const metricDescription = metricsDescription[metric.id];

        // Special handle for new_coverage metric that need to use the complementary
        if (config.complementary) {
            metric.value = 1 - metric.value;
        }

        const radarValue = calculateValue(metric.value, config.thresholds);

        return {
            id: metric.id,
            name: metricDescription.name,
            fullName: metricDescription.fullName,
            description: metricDescription.description,
            radarValue: radarValue
        }
    })
}

const calculateValue = (value, thresholds) => {
    if (thresholds.a.lower_bound <= value && value < thresholds.a.upper_bound) {
        return 0;
    }
    else if (thresholds.b.lower_bound <= value && value < thresholds.b.upper_bound) {
        return 1;
    }
    else if (thresholds.c.lower_bound <= value && value < thresholds.c.upper_bound) {
        return 2;
    }
    else if (thresholds.d.lower_bound <= value && value < thresholds.d.upper_bound) {
        return 3;
    }
    return 4;
}

export default calculateRadarMetrics;