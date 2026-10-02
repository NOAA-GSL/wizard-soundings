import { describe, expect, test } from 'vitest';
import { buildWindRings, convertWindStat, fromWindUnit, toWindUnit } from '../src/windUnits';

describe('toWindUnit / fromWindUnit', () => {
    test('converts kts to m/s and mph', () => {
        expect(toWindUnit(10, 'kts')).toBe(10);
        expect(toWindUnit(10, 'm/s')).toBeCloseTo(5.14444);
        expect(toWindUnit(10, 'mph')).toBeCloseTo(11.50779);
    });

    test('round-trips back to kts', () => {
        expect(fromWindUnit(toWindUnit(37, 'm/s'), 'm/s')).toBeCloseTo(37);
        expect(fromWindUnit(toWindUnit(37, 'mph'), 'mph')).toBeCloseTo(37);
    });

    test('passes through non-finite values and converts arrays', () => {
        expect(toWindUnit(undefined, 'mph')).toBeUndefined();
        expect(toWindUnit(NaN, 'mph')).toBeNaN();
        expect(toWindUnit([0, 10], 'm/s')[1]).toBeCloseTo(5.14444);
    });

    test('unknown units fall back to kts', () => {
        expect(toWindUnit(10, 'furlongs')).toBe(10);
    });
});

describe('convertWindStat', () => {
    test('converts wind-speed stats only', () => {
        expect(convertWindStat('sfc6kmshr', 10, 'm/s')).toBeCloseTo(5.14444);
        expect(convertWindStat('momentumTransferMag', [10], 'mph')[0]).toBeCloseTo(11.50779);
        expect(convertWindStat('right_srh1km', 200, 'm/s')).toBe(200);
        expect(convertWindStat('brnShear', 40, 'm/s')).toBe(40);
    });
});

describe('buildWindRings', () => {
    test('kts matches the original ring layout', () => {
        const { rings, labels } = buildWindRings(80, 10, 20, 'kts');
        expect(rings.map((r) => r.value)).toEqual([10, 20, 30, 40, 50, 60, 70, 80]);
        expect(labels.map((r) => r.value)).toEqual([10, 30, 50, 70]);
    });

    test('m/s rings are round display values positioned in kts', () => {
        const { rings } = buildWindRings(80, 10, 20, 'm/s');
        expect(rings.map((r) => r.value)).toEqual([10, 20, 30, 40]);
        expect(rings[0].kts).toBeCloseTo(19.438, 2);
    });
});
