import { describe, expect, test } from 'vitest';
import { formatSkewTAxisTitles } from '../src/skewt/SkewT';

describe('formatSkewTAxisTitles', () => {
    test('combines labels and units', () => {
        expect(
            formatSkewTAxisTitles({
                axisLabels: { x: 'Temperature', y: 'Pressure' },
                units: { temperature: 'C', pressure: 'mb' },
            }),
        ).toEqual({ x: 'Temperature (C)', y: 'Pressure (mb)' });
    });

    test('accepts custom units and labels', () => {
        expect(
            formatSkewTAxisTitles({
                axisLabels: { x: 'Temp', y: 'Press' },
                units: { temperature: '°C', pressure: 'hPa' },
            }),
        ).toEqual({ x: 'Temp (°C)', y: 'Press (hPa)' });
    });

    test('omits empty units and hides titles with empty labels', () => {
        expect(
            formatSkewTAxisTitles({
                axisLabels: { x: 'Temperature', y: '' },
                units: { temperature: '', pressure: 'mb' },
            }),
        ).toEqual({ x: 'Temperature', y: null });
        expect(formatSkewTAxisTitles()).toEqual({ x: null, y: null });
    });
});
