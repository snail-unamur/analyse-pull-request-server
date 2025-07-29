import calculateInstability from "../models/metrics/instabilityCalculation.js";

describe('calculateInstabilityMetric', () => {
    test('returns correct instability when efferent and afferent are non-zero', () => {
        expect(calculateInstability(5, 5)).toBe(0.5);
        expect(calculateInstability(8, 2)).toBe(0.2);
        expect(calculateInstability(3, 7)).toBe(0.7);
    });

    test('rounds the result to two decimal places', () => {
        expect(calculateInstability(3, 1)).toBe(0.25);
        expect(calculateInstability(6, 1)).toBe(0.14);
    });

    test('returns 0 when both efferent and afferent are 0', () => {
        expect(calculateInstability(0, 0)).toBe(0);
    });

    test('returns 1 when afferent is 0 and efferent > 0', () => {
        expect(calculateInstability(0, 10)).toBe(1);
    });

    test('returns 0 when efferent is 0 and afferent > 0', () => {
        expect(calculateInstability(10, 0)).toBe(0);
    });

    test('handles large numbers correctly', () => {
        expect(calculateInstability(1000000, 1000000)).toBe(0.5);
        expect(calculateInstability(1, 999999)).toBe(1);
    });
})