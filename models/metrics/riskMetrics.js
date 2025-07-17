const calculateRiskMetric = (radarMetrics) => {
    const total = radarMetrics.reduce((acc, m) => acc + m.radarValue, 0);

    const value = Math.floor(total / radarMetrics.length);
    const label = getLabelForValue(value);

    return [value, label];
}

const getLabelForValue = (value) => {
    switch (value) {
        case 0:
            return 'A';
        case 1:
            return 'B';
        case 2:
            return 'C';
        case 3:
            return 'D';
        default:
            return 'E';
    }
}


export default calculateRiskMetric;