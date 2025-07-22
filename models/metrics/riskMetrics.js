const calculateRiskMetric = (radarMetrics) => {
    if (radarMetrics.length == 0) {
        return [0, 'A'];
    }

    const worseValue = radarMetrics.reduce(
        (max, item) => Math.max(max, item.radarValue),
        -Infinity
    );
    const label = getLabelForValue(worseValue);

    return [worseValue, label];
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