import { describe, expect, test } from 'vitest';

import {
    buildTraceConfigs,
    getStrokeDasharray,
    resolveTraceDisplayModes,
    resolveTraceLineStyles,
} from '../src/skewt/traceConfig.js';

describe('resolveTraceDisplayModes', () => {
    test('falls back to config.displayMode when no per-trace mode is set', () => {
        const modes = resolveTraceDisplayModes({ displayMode: 'mean' });

        expect(modes).toEqual({
            temp: 'mean',
            dwpt: 'mean',
            wetb: 'mean',
            vtmp: 'mean',
            parcel: 'mean',
            parcelVirtual: 'mean',
        });
    });

    test('allows per-trace display modes to override the global mode', () => {
        const modes = resolveTraceDisplayModes({
            displayMode: 'plumes',
            displayModes: {
                temp: 'boxwhisker',
                dwpt: 'mean',
            },
        });

        expect(modes).toEqual({
            temp: 'boxwhisker',
            dwpt: 'mean',
            wetb: 'plumes',
            vtmp: 'plumes',
            parcel: 'plumes',
            parcelVirtual: 'plumes',
        });
    });
});

describe('resolveTraceLineStyles', () => {
    test('preserves the existing parcel defaults and uses solid trace lines otherwise', () => {
        const styles = resolveTraceLineStyles();

        expect(styles).toEqual({
            temp: 'solid',
            dwpt: 'solid',
            wetb: 'solid',
            vtmp: 'solid',
            parcel: 'dot',
            parcelVirtual: 'dash',
        });
    });

    test('ignores unknown line styles', () => {
        const styles = resolveTraceLineStyles({
            traceLineStyles: {
                temp: 'dashDot',
                dwpt: 'zigzag',
            },
        });

        expect(styles.temp).toBe('dashDot');
        expect(styles.dwpt).toBe('solid');
        expect(getStrokeDasharray(styles.temp)).toBe('8,3,2,3');
        expect(getStrokeDasharray(styles.dwpt)).toBeNull();
    });
});

describe('buildTraceConfigs', () => {
    test('builds visible profile and parcel traces from shared definitions', () => {
        const traceConfigs = buildTraceConfigs({
            traceVisibility: { temp: true, dwpt: false, wetb: false, vtmp: false },
            resolvedDisplayModes: {
                temp: 'mean',
                dwpt: 'plumes',
                wetb: 'plumes',
                vtmp: 'plumes',
                parcel: 'boxwhisker',
                parcelVirtual: 'mean',
            },
            colors: {
                temp: 'red',
                dwpt: 'green',
                wetb: 'cyan',
                vtmp: 'pink',
                parcel: 'yellow',
                parcelVirtual: 'orange',
            },
            memberProfiles: [[{ press: 1000, temp: 20 }]],
            meanProfile: [{ press: 1000, temp: 20 }],
            parcelTraceSets: {
                parcel: {
                    memberProfiles: [[{ press: 1000, temp: 19 }]],
                    meanProfile: [{ press: 1000, temp: 19 }],
                },
                parcelVirtual: {
                    memberProfiles: [[{ press: 1000, temp: 21 }]],
                    meanProfile: [{ press: 1000, temp: 21 }],
                },
            },
        });

        expect(traceConfigs.map((traceConfig) => traceConfig.key)).toEqual([
            'temp',
            'parcel',
            'parcelVirtual',
        ]);
        expect(traceConfigs[1].lineGenKey).toBe('parcel');
        expect(traceConfigs[1].valueKeysByVariable).toEqual({ parcel: 'temp' });
        expect(traceConfigs[2].styleByMode.mean).toEqual({ strokeWidth: 2, opacity: 0.8 });
    });
});
