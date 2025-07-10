export const retreiveRobotMetrics = (settings, analysis) => {
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