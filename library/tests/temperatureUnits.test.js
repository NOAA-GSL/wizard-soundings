import { describe, expect, test } from 'vitest';
import {
    buildIsotherms,
    convertTemperatureStat,
    fromTemperatureUnit,
    toTemperatureUnit,
} from '../src/temperatureUnits';

describe('toTemperatureUnit / fromTemperatureUnit', () => {
    test('converts C to F and back', () => {
        expect(toTemperatureUnit(0, 'F')).toBe(32);
        expect(toTemperatureUnit(100, 'f')).toBe(212);
        expect(fromTemperatureUnit(212, 'F')).toBe(100);
    });

    test('C is a no-op and non-finite values pass through', () => {
        expect(toTemperatureUnit(12.5, 'C')).toBe(12.5);
        expect(toTemperatureUnit(null, 'F')).toBeNull();
        expect(toTemperatureUnit(NaN, 'F')).toBeNaN();
    });

    test('converts arrays', () => {
        expect(toTemperatureUnit([0, 10], 'F')).toEqual([32, 50]);
    });
});

describe('convertTemperatureStat', () => {
    test('converts absolute temperature stats only', () => {
        expect(convertTemperatureStat('maxT', 20, 'F')).toBe(68);
        expect(convertTemperatureStat('downT', [0], 'F')).toEqual([32]);
        expect(convertTemperatureStat('sfcLI', -5, 'F')).toBe(-5);
        expect(convertTemperatureStat('sfcCAPE', 1000, 'F')).toBe(1000);
    });
});

describe('buildIsotherms', () => {
    const isotherms = { min: -50, max: 50, interval: 10 };

    test('C grid matches the configured range', () => {
        const lines = buildIsotherms(isotherms, 'C');
        expect(lines.map((l) => l.label)).toEqual([-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50]);
        expect(lines.find((l) => l.freezing).tempC).toBe(0);
    });

    test('F grid uses round F labels inside the C range and keeps an unlabeled freezing line', () => {
        const lines = buildIsotherms(isotherms, 'F');
        const labels = lines.filter((l) => l.label != null).map((l) => l.label);
        expect(labels[0]).toBe(-50);
        expect(labels[labels.length - 1]).toBe(120);
        expect(labels.every((t) => t % 10 === 0)).toBe(true);
        const freezing = lines.find((l) => l.freezing);
        expect(freezing).toEqual({ tempC: 0, label: null, freezing: true });
        const fifty = lines.find((l) => l.label === 50);
        expect(fifty.tempC).toBeCloseTo(10);
    });
});
