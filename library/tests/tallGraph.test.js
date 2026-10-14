import { describe, expect, test } from 'vitest';

import {
    DEFAULT_TALL_GRAPH_CONFIG,
    computeLayerBounds,
    computeValueDomain,
    createColorBarScale,
    formatAxisTitle,
    getAxisLayout,
    getBoxWhiskerPercentileKeys,
    getPressureAxisWidth,
    resolveTallGraphConfig,
} from '../src/tallGraph/tallGraphConfig.js';
import TallGraph from '../src/tallGraph/TallGraph.jsx';
import * as library from '../src/index.js';

describe('pressureAxis', () => {
    test('values and label are hidden by default', () => {
        const { pressureAxis } = resolveTallGraphConfig();
        expect(pressureAxis).toEqual({
            showValues: false,
            showLabel: false,
            label: 'Pressure',
            units: 'mb',
        });
        expect(getPressureAxisWidth(pressureAxis)).toBe(0);
    });

    test('merges partial overrides with defaults', () => {
        const { pressureAxis } = resolveTallGraphConfig({
            pressureAxis: { showLabel: true, units: 'hPa' },
        });
        expect(pressureAxis).toEqual({
            showValues: false,
            showLabel: true,
            label: 'Pressure',
            units: 'hPa',
        });
        expect(formatAxisTitle(pressureAxis)).toBe('Pressure (hPa)');
    });

    test('reserves left space only for the parts that are shown', () => {
        expect(getPressureAxisWidth({ showValues: true })).toBe(40);
        expect(getPressureAxisWidth({ showLabel: true })).toBe(20);
        expect(getPressureAxisWidth({ showValues: true, showLabel: true })).toBe(60);
    });
});

describe('resolveTallGraphConfig', () => {
    test('returns defaults for both variables', () => {
        const settings = resolveTallGraphConfig();

        expect(settings.rh.enabled).toBe(true);
        expect(settings.rh.displayMode).toBe('meanBars');
        expect(settings.rh.valueKey).toBe('rh');
        expect(settings.rh.domain).toEqual([0, 100]);
        expect(settings.omega.enabled).toBe(true);
        expect(settings.omega.displayMode).toBe('mean');
        expect(settings.omega.valueKey).toBe('wwnd');
        expect(settings.omega.domain).toBeNull();
        expect(settings.percentiles).toEqual([5, 25, 75, 95]);
    });

    test('merges per-variable overrides and accepts every display mode', () => {
        for (const mode of ['meanBars', 'mean', 'plumes', 'boxwhiskerBars', 'boxwhisker']) {
            const settings = resolveTallGraphConfig({
                rh: { displayMode: mode, color: '#123456' },
                omega: { displayMode: mode, units: 'Pa/s' },
            });
            expect(settings.rh.displayMode).toBe(mode);
            expect(settings.omega.displayMode).toBe(mode);
            expect(settings.rh.color).toBe('#123456');
            expect(settings.omega.units).toBe('Pa/s');
            expect(settings.rh.label).toBe(DEFAULT_TALL_GRAPH_CONFIG.rh.label);
        }
    });

    test('falls back on unknown display modes and invalid domains', () => {
        const settings = resolveTallGraphConfig({
            rh: { displayMode: 'zigzag', domain: [5, 5] },
            omega: { displayMode: 'bars', domain: 'auto' },
            percentiles: [],
        });

        expect(settings.rh.displayMode).toBe('meanBars');
        expect(settings.rh.domain).toEqual([0, 100]);
        expect(settings.omega.displayMode).toBe('mean');
        expect(settings.omega.domain).toBeNull();
        expect(settings.percentiles).toEqual([5, 25, 75, 95]);
    });

    test('merges margin and colors with defaults', () => {
        const settings = resolveTallGraphConfig({
            margin: { top: 5 },
            colors: { isobar: 'red' },
        });

        expect(settings.margin).toEqual({ ...DEFAULT_TALL_GRAPH_CONFIG.margin, top: 5 });
        expect(settings.colors.isobar).toBe('red');
        expect(settings.colors.zeroLine).toBe(DEFAULT_TALL_GRAPH_CONFIG.colors.zeroLine);
    });
});

describe('computeValueDomain', () => {
    test('uses a valid configured domain as-is, including reversed domains', () => {
        expect(computeValueDomain([], 'wwnd', [0, 100])).toEqual([0, 100]);
        expect(computeValueDomain([], 'wwnd', [2, -2])).toEqual([2, -2]);
    });

    test('auto domain is symmetric about zero and covers every member value', () => {
        const members = [
            [{ wwnd: 0.4 }, { wwnd: -1.3 }],
            [{ wwnd: 0.9 }, { wwnd: NaN }],
        ];
        const [lo, hi] = computeValueDomain(members, 'wwnd');

        expect(lo).toBe(-hi);
        expect(hi).toBeGreaterThanOrEqual(1.3);
    });

    test('auto domain defaults to [-1, 1] when there is no data', () => {
        expect(computeValueDomain([], 'wwnd')).toEqual([-1, 1]);
    });
});

describe('computeLayerBounds', () => {
    test('builds point-centered log-pressure layers sorted surface to top', () => {
        const layers = computeLayerBounds([500, 1000, 700, 700]);

        expect(layers.map((l) => l.press)).toEqual([1000, 700, 500]);
        expect(layers[0].bottom).toBe(1000);
        expect(layers[0].top).toBeCloseTo(Math.sqrt(1000 * 700));
        expect(layers[1].bottom).toBeCloseTo(Math.sqrt(1000 * 700));
        expect(layers[1].top).toBeCloseTo(Math.sqrt(700 * 500));
        expect(layers[2].top).toBe(500);
    });

    test('ignores invalid pressures', () => {
        expect(computeLayerBounds([NaN, null, -5, 850])).toEqual([
            { press: 850, bottom: 850, top: 850 },
        ]);
    });
});

describe('getAxisLayout', () => {
    test('stacks one axis per enabled variable', () => {
        const layout = getAxisLayout(resolveTallGraphConfig({ axisHeight: 30 }));

        expect(layout.axes).toEqual([
            { key: 'rh', offset: 0 },
            { key: 'omega', offset: 30 },
        ]);
        expect(layout.totalHeight).toBe(60);
    });

    test('removes the axis of a disabled variable', () => {
        const layout = getAxisLayout(resolveTallGraphConfig({ rh: { enabled: false } }));

        expect(layout.axes).toEqual([{ key: 'omega', offset: 0 }]);
        expect(layout.totalHeight).toBe(DEFAULT_TALL_GRAPH_CONFIG.axisHeight);
    });

    test('has no axes when both variables are disabled', () => {
        const layout = getAxisLayout(
            resolveTallGraphConfig({ rh: { enabled: false }, omega: { enabled: false } }),
        );

        expect(layout).toEqual({ axes: [], totalHeight: 0 });
    });
});

describe('colorBar', () => {
    const stops = [
        { value: 100, color: '#0000ff' },
        { value: 70, color: '#ff0000' },
    ];

    test('resolveTallGraphConfig keeps valid color bars and drops invalid ones', () => {
        const settings = resolveTallGraphConfig({
            rh: { colorBar: stops },
            omega: { colorBar: [{ value: 'x', color: 'red' }] },
        });

        expect(settings.rh.colorBar).toBe(stops);
        expect(settings.omega.colorBar).toBeNull();
        expect(resolveTallGraphConfig().rh.colorBar).toBeNull();
    });

    test('uses discrete steps from unsorted stops without interpolating', () => {
        const scale = createColorBarScale(stops, 'green');

        expect(scale(70)).toBe('#ff0000');
        expect(scale(85)).toBe('#ff0000');
        expect(scale(99.9)).toBe('#ff0000');
        expect(scale(100)).toBe('#0000ff');
        expect(scale(150)).toBe('#0000ff');
    });

    test('uses the fallback color below the lowest stop, for missing values, and without stops', () => {
        const scale = createColorBarScale(stops, 'green');

        expect(scale(50)).toBe('green');
        expect(scale(NaN)).toBe('green');
        expect(createColorBarScale(null, 'green')(90)).toBe('green');
    });

    test('supports a single stop', () => {
        const scale = createColorBarScale([{ value: 90, color: 'purple' }], 'green');

        expect(scale(95)).toBe('purple');
        expect(scale(80)).toBe('green');
    });
});

describe('helpers', () => {
    test('getBoxWhiskerPercentileKeys always includes the median', () => {
        expect(getBoxWhiskerPercentileKeys([95, 5, 75, 25])).toEqual({
            whiskerLow: 'p5',
            boxLow: 'p25',
            median: 'p50',
            boxHigh: 'p75',
            whiskerHigh: 'p95',
        });
        expect(getBoxWhiskerPercentileKeys([10, 90])).toEqual({
            whiskerLow: 'p10',
            boxLow: 'p50',
            median: 'p50',
            boxHigh: 'p50',
            whiskerHigh: 'p90',
        });
    });

    test('formatAxisTitle appends units when provided', () => {
        expect(formatAxisTitle({ label: 'RH', units: '%' })).toBe('RH (%)');
        expect(formatAxisTitle({ label: 'Omega', units: '' })).toBe('Omega');
    });

    test('TallGraph is exported from the library entry point', () => {
        expect(library.TallGraph).toBe(TallGraph);
    });
});
