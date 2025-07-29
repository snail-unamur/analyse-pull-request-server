export const calculateInstability = (afferent, efferent) => {
    const total = efferent + afferent;
    return total === 0 ? 0 : parseFloat((efferent / total).toFixed(2));
}

export default calculateInstability;