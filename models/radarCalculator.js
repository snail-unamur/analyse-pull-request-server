const calculateRadarMetrics = (metrics, thresholds) => {
    return metrics.map(m => {
        const threshold = thresholds[m.id];
        const radarValue = calculateValue(m.value, threshold);

        return {
            id: m.id,
            name: m.name,
            radarValue: radarValue
        }
    })
}

const calculateValue = (value, threshold) => {
    if (threshold.a.lower_bound <= value && value < threshold.a.upper_bound) {
        return 0;
    }
    else if (threshold.b.lower_bound <= value && value < threshold.b.upper_bound) {
        return 1;
    }
    else if (threshold.c.lower_bound <= value && value < threshold.c.upper_bound) {
        return 2;
    }
    else if (threshold.d.lower_bound <= value && value < threshold.d.upper_bound) {
        return 3;
    }
    return 4;
}

export default calculateRadarMetrics;