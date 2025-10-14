const calculateRiskMetric = (defaultMetrics, radarMetrics) => {
    if (radarMetrics.length == 0) {
        return 0;
    }

    const coordofAxes = polarToCartesian(radarMetrics);
    const area = shoelaceCalculation(coordofAxes);

    return area.toFixed(2);
}

const polarToCartesian = (axes) => {
    const angleStep = (2 * Math.PI) / axes.length;
    const origin = Math.PI / 2;

    return axes.map((a, i) => {
        const thetaI = origin - (i * angleStep);
        const x = a.radarValue * Math.cos(thetaI);
        const y = a.radarValue * Math.sin(thetaI);
        return { x, y };
    });
};

const shoelaceCalculation = (coordAxes) => {
    const n = coordAxes.length;
    let accumulator = 0;

    for (let i = 0; i < n; i++) {
        const current = coordAxes[i];
        const next = coordAxes[(i + 1) % n]; // loop for the last point

        accumulator += (current.x * next.y) - (next.x * current.y);
    }

    return Math.abs(accumulator) / 2;
};

export default calculateRiskMetric;