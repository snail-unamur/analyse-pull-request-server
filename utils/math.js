export const mean = (metrics) => {
    const valueArray = metrics.map(m => m.value);
    const total = valueArray.reduce((acc, i) => acc + i, 0);

    return parseFloat((total / valueArray.length).toFixed(2));
}