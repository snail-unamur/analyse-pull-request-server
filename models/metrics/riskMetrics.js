const calculateRiskMetric = (defaultMetrics, radarMetrics) => {
    if (radarMetrics.length == 0) {
        return 0;
    }

    const coordofAxes = polarToCartesian(radarMetrics);
    const area = shoelaceCalculation(coordofAxes);

    const fileFactor = defaultMetrics.find(m => m.id === 'files')?.value || 1;
    const lineFactor = defaultMetrics.find(m => m.id === 'ncloc')?.value || 1;
    const coverage = defaultMetrics.find(m => m.id === 'new_coverage')?.value || 1;

    const rawValue = area / ((1 / fileFactor) * (1 / lineFactor) * coverage);
    return Math.round(rawValue);
}

const polarToCartesian = (axes) => {
    const angleStep = (2 * Math.PI) / axes.length;
    const origin = Math.PI / 2; // Point at the top of the chart

    return axes.map((a, i) => {
        const thetaI = origin - (i * angleStep);
        const x = a.value * Math.cos(thetaI);
        const y = a.value * Math.sin(thetaI);
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