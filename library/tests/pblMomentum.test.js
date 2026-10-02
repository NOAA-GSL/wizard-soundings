import { describe, expect, test } from 'vitest';
import { createVector } from '../src/vector';
import { calculateStatsVector } from '../src/createSounding';
import {
    computePblMomentumMarkers,
    interpolateAtPressure,
    reduceMomentumTransfer,
    resolveBoxWhiskerBounds,
} from '../src/skewt/pblMomentum';

describe('interpolateAtPressure', () => {
    const profile = [
        { press: 700, temp: 0 },
        { press: 1000, temp: 20 },
        { press: 850, temp: 10 },
    ];

    test('returns exact level values', () => {
        expect(interpolateAtPressure(profile, 850)).toBe(10);
    });

    test('interpolates linearly in log-pressure', () => {
        const p = Math.sqrt(1000 * 850);
        expect(interpolateAtPressure(profile, p)).toBeCloseTo(15);
    });

    test('returns null outside the profile or without data', () => {
        expect(interpolateAtPressure(profile, 500)).toBeNull();
        expect(interpolateAtPressure(null, 850)).toBeNull();
    });
});

describe('resolveBoxWhiskerBounds', () => {
    test('splits four percentiles into whiskers and boxes', () => {
        expect(resolveBoxWhiskerBounds([95, 5, 25, 75])).toEqual({
            whiskers: [5, 95],
            boxes: [25, 75],
        });
    });

    test('falls back to defaults for short lists', () => {
        expect(resolveBoxWhiskerBounds([])).toEqual({ whiskers: [5, 95], boxes: [25, 75] });
        expect(resolveBoxWhiskerBounds([10, 90])).toEqual({ whiskers: [10, 90], boxes: [25, 75] });
    });
});

describe('calculateStatsVector list mode', () => {
    test('returns the per-member vectors unchanged', () => {
        const vectors = [createVector(1, 2), createVector(3, 4)];
        expect(calculateStatsVector(vectors, 'list')).toBe(vectors);
    });
});

describe('reduceMomentumTransfer', () => {
    test('mean of member speeds with mean direction', () => {
        const reduced = reduceMomentumTransfer([createVector(10, 0), createVector(20, 0)], 'mean');
        expect(reduced.mag).toBeCloseTo(15);
        expect(reduced.drx).toBeCloseTo(270);
    });

    test('percentile statistic', () => {
        const vectors = [0, 10, 20, 30, 40].map((u) => createVector(u, 0));
        expect(reduceMomentumTransfer(vectors, '100%').mag).toBeCloseTo(40);
    });

    test('accepts a single vector and ignores invalid entries', () => {
        expect(reduceMomentumTransfer(createVector(0, 5)).mag).toBeCloseTo(5);
        expect(reduceMomentumTransfer([null, createVector(NaN, NaN)])).toBeNull();
    });
});

describe('computePblMomentumMarkers', () => {
    const pblDepth = [900, 850, 800, 750, 700];
    const mean = [5, 10, 15, 20, 25].map((u) => createVector(u, 0));
    const max = [10, 20, 30, 40, 50].map((u) => createVector(u, 0));

    test('box-whisker uses height percentiles mapped to pressure', () => {
        const markers = computePblMomentumMarkers({
            pblDepth,
            momentumTransferVector: mean,
            momentumTransferVectorMax: max,
            percentiles: [0, 25, 75, 100],
        });
        expect(markers.boxWhisker).toEqual({
            whiskerBottom: 900,
            boxBottom: 850,
            median: 800,
            boxTop: 750,
            whiskerTop: 700,
        });
    });

    test('mean MT at half the mean PBL depth, max MT at the mean PBL top', () => {
        const markers = computePblMomentumMarkers({
            pblDepth,
            momentumTransferVector: mean,
            momentumTransferVectorMax: max,
            percentiles: [5, 25, 75, 95],
            stat: 'mean',
            surfacePress: 1000,
        });
        expect(markers.meanPress).toBe(800);
        expect(markers.meanBarb.press).toBeCloseTo(Math.sqrt(1000 * 800));
        expect(Math.hypot(markers.meanBarb.u, markers.meanBarb.v)).toBeCloseTo(15);
        expect(markers.maxBarb.press).toBe(800);
        expect(Math.hypot(markers.maxBarb.u, markers.maxBarb.v)).toBeCloseTo(30);
    });

    test('mean MT falls back to the mean PBL top without a valid surface pressure', () => {
        const markers = computePblMomentumMarkers({
            pblDepth,
            momentumTransferVector: mean,
            momentumTransferVectorMax: max,
        });
        expect(markers.meanBarb.press).toBe(800);
    });

    test('single member has no box-whisker', () => {
        const markers = computePblMomentumMarkers({
            pblDepth: 820,
            momentumTransferVector: createVector(5, 5),
            momentumTransferVectorMax: createVector(10, 10),
        });
        expect(markers.boxWhisker).toBeNull();
        expect(markers.medianPress).toBe(820);
        expect(markers.maxBarb.press).toBe(820);
    });

    test('returns null without PBL data', () => {
        expect(computePblMomentumMarkers({ pblDepth: [NaN] })).toBeNull();
        expect(computePblMomentumMarkers()).toBeNull();
    });
});
