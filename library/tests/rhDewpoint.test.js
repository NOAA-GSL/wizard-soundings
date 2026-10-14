import { describe, expect, test } from 'vitest';
import sharp from '../src/Sharp';

// pressure over water and ice. `tol` is the allowed absolute difference in % RH; the library's
// polynomial vappres drifts slightly from Murphy & Koop at very cold temperatures.
// Still need to confirm these values with bufkit or other reliable sources
const RH_CASES = [
    { p: 1000, t: 30, d: 20, rh: 55.086, rhIce: 55.086, tol: 0.05 },
    { p: 1000, t: 20, d: 10, rh: 52.503, rhIce: 52.503, tol: 0.05 },
    { p: 850, t: 10, d: -5, rh: 34.338, rhIce: 34.338, tol: 0.05 },
    { p: 700, t: 0, d: -10, rh: 46.866, rhIce: 46.866, tol: 0.05 },
    { p: 500, t: -10, d: -15, rh: 66.786, rhIce: 73.611, tol: 0.1 },
    { p: 500, t: -20, d: -25, rh: 64.362, rhIce: 78.233, tol: 0.1 },
    { p: 500, t: -20, d: -20, rh: 100, rhIce: 121.551, tol: 0.15 },
    { p: 300, t: -40, d: -45, rh: 58.633, rhIce: 86.332, tol: 0.25 },
    { p: 300, t: -40, d: -40, rh: 100, rhIce: 147.242, tol: 0.25 },
    { p: 250, t: -50, d: -60, rh: 29.502, rhIce: 47.312, tol: 1 },
];

//
// Confired with online calculators
const DEWPOINT_CASES = [
    { t: 30, rh: 50, td: 18.445 },
    { t: 25, rh: 5, td: -17.259 },
    { t: 20, rh: 80, td: 16.447 },
    { t: 10, rh: 100, td: 10 },
    { t: 0, rh: 60, td: -6.831 },
    { t: -20, rh: 40, td: -30.154 },
    { t: -40, rh: 90, td: -41.007 },
];

const PRESSURES = [1000, 850, 700, 500, 300, 200];

describe('sharp.rh (RH over water)', () => {
    test.each(RH_CASES)('p=$p hPa, T=$t C, Td=$d C -> $rh %', ({ p, t, d, rh, tol }) => {
        expect(Math.abs(sharp.rh([p], [t], [d])[0] - rh)).toBeLessThanOrEqual(tol);
    });

    test('is 100% when dewpoint equals temperature', () => {
        for (const t of [35, 15, 0, -15, -30, -50]) {
            expect(sharp.rh([500], [t], [t])[0]).toBeCloseTo(100, 10);
        }
    });

    test('is independent of pressure', () => {
        const values = PRESSURES.map((p) => sharp.rh([p], [5], [-3])[0]);
        values.forEach((value) => expect(value).toBeCloseTo(values[0], 10));
    });

    test('handles multiple levels in one call', () => {
        const result = sharp.rh(
            RH_CASES.map((c) => c.p),
            RH_CASES.map((c) => c.t),
            RH_CASES.map((c) => c.d),
        );
        result.forEach((value, i) =>
            expect(Math.abs(value - RH_CASES[i].rh)).toBeLessThanOrEqual(RH_CASES[i].tol),
        );
    });
});

describe('sharp.rhIce (RH over ice)', () => {
    test.each(RH_CASES)('p=$p hPa, T=$t C, Td=$d C -> $rhIce %', ({ p, t, d, rhIce, tol }) => {
        expect(Math.abs(sharp.rhIce([p], [t], [d])[0] - rhIce)).toBeLessThanOrEqual(tol);
    });

    test('equals RH over water at or above 0 C', () => {
        for (const [t, d] of [
            [30, 10],
            [10, 5],
            [0, -8],
        ]) {
            expect(sharp.rhIce([850], [t], [d])[0]).toBeCloseTo(sharp.rh([850], [t], [d])[0], 10);
        }
    });

    test('exceeds RH over water below 0 C, with the gap growing as it gets colder', () => {
        const ratios = [-5, -15, -25, -35].map((t) => {
            const rhIce = sharp.rhIce([500], [t], [t - 3])[0];
            const rh = sharp.rh([500], [t], [t - 3])[0];
            expect(rhIce).toBeGreaterThan(rh);
            return rhIce / rh;
        });
        for (let i = 1; i < ratios.length; i += 1) {
            expect(ratios[i]).toBeGreaterThan(ratios[i - 1]);
        }
    });

    test('is independent of pressure', () => {
        const values = PRESSURES.map((p) => sharp.rhIce([p], [-25], [-30])[0]);
        values.forEach((value) => expect(value).toBeCloseTo(values[0], 10));
    });

    test('vappresIce matches Murphy & Koop reference values (hPa)', () => {
        expect(sharp.vappresIce(0)).toBeCloseTo(6.1115, 3);
        expect(sharp.vappresIce(-20)).toBeCloseTo(1.0326, 3);
        expect(sharp.vappresIce(-40)).toBeCloseTo(0.1284, 3);
    });
});

describe('sharp.dewpointFromRH', () => {
    test.each(DEWPOINT_CASES)('T=$t C, RH=$rh % -> Td=$td C', ({ t, rh, td }) => {
        expect(sharp.dewpointFromRH([t], [rh])[0]).toBeCloseTo(td, 1);
    });

    test('round-trips with sharp.rh at several pressures', () => {
        for (const p of PRESSURES) {
            for (const { t, d } of RH_CASES) {
                const rh = sharp.rh([p], [t], [d])[0];
                expect(sharp.dewpointFromRH([t], [rh])[0]).toBeCloseTo(d, 5);
            }
        }
    });

    test('never exceeds temperature', () => {
        const temps = [30, 0, -30];
        sharp
            .dewpointFromRH(temps, [100, 100, 100])
            .forEach((td, i) => expect(td).toBeLessThanOrEqual(temps[i]));
        sharp
            .dewpointFromRH(temps, [120, 120, 120])
            .forEach((td, i) => expect(td).toBeCloseTo(temps[i], 6));
    });

    test('decreases monotonically as RH decreases', () => {
        const td = sharp.dewpointFromRH([15, 15, 15, 15, 15], [100, 75, 50, 25, 5]);
        for (let i = 1; i < td.length; i += 1) {
            expect(td[i]).toBeLessThan(td[i - 1]);
        }
    });

    test('returns NaN for missing temperature or RH', () => {
        const td = sharp.dewpointFromRH([NaN, 10, undefined, 10], [50, undefined, 50, -5]);
        td.forEach((value) => expect(value).toBeNaN());
    });
});
