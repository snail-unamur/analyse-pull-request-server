import { mean } from "../utils/math.js";

describe('mean', () => {

    it('calcule correctement la moyenne de valeurs entières', () => {
        const metrics = [{ value: 2 }, { value: 4 }, { value: 6 }];
        expect(mean(metrics)).toBe(4.00);
    });

    it('calcule correctement la moyenne avec des flottants', () => {
        const metrics = [{ value: 1.5 }, { value: 2.5 }, { value: 3.5 }];
        expect(mean(metrics)).toBe(2.5);
    });

    it('retourne NaN si le tableau est vide', () => {
        expect(mean([])).toBeNaN();
    });

    it('calcule correctement la moyenne avec des valeurs négatives', () => {
        const metrics = [{ value: -2 }, { value: -4 }, { value: -6 }];
        expect(mean(metrics)).toBe(-4.00);
    });

    it('arrondit le résultat à deux décimales', () => {
        const metrics = [{ value: 1 }, { value: 2 }, { value: 2 }];
        expect(mean(metrics)).toBe(1.67); // (1+2+2)/3 = 1.666...
    });

    it('gère les valeurs mixtes entières et décimales', () => {
        const metrics = [{ value: 1.1 }, { value: 2 }, { value: 3 }];
        expect(mean(metrics)).toBe(2.03); // (1.1 + 2 + 3) / 3 = 2.033...
    });

});