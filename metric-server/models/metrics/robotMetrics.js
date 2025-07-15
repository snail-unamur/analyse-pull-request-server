const retreiveRobotMetrics = (settings, analysis) => {
    if (!analysis) {
        throw new Error('Analysis still pending.');
    }

    const robotMetrics = settings.filter(metric => metric.source === 'robot');

    return robotMetrics.map(metric => {
        const value = analysis[metric.id] ? parseFloat(analysis[metric.id].value) : 0;

        return {
            id: metric.id,
            name: metric.name,
            checked: metric.checked,
            coefficient: metric.coefficient,
            value: value,
            source: metric.source
        };
    });
}

export default retreiveRobotMetrics;