import { describe, expect, test } from 'vitest';
import {
    getParcelTraceData,
    getParcelTraceSet,
    resolveParcelTraceDisplayData,
    resolveParcelTraceSelections,
} from '../src/skewt/parcelTrace.js';

describe('resolveParcelTraceSelections', () => {
    test('supports independent parcel and virtual parcel selections', () => {
        const resolved = resolveParcelTraceSelections({
            parcelTrace: 'mu',
            virtualParcelTrace: 'ml',
        });

        expect(resolved).toEqual({
            regularParcelType: 'mu',
            virtualParcelType: 'ml',
        });
    });

    test('defaults missing independent selectors to none', () => {
        const resolved = resolveParcelTraceSelections({ parcelTrace: 'sfc' });

        expect(resolved).toEqual({
            regularParcelType: 'sfc',
            virtualParcelType: 'none',
        });
    });

    test('defaults both parcel selectors to none when not provided', () => {
        const resolved = resolveParcelTraceSelections({});

        expect(resolved).toEqual({
            regularParcelType: 'none',
            virtualParcelType: 'none',
        });
    });
});

describe('getParcelTraceData', () => {
    const derivedStats = {
        sfctrace: [
            [
                { press: 1000, temp: 20 },
                { press: 900, temp: 16 },
                { press: 800, temp: 12 },
            ],
            [
                { press: 980, temp: 22 },
                { press: 900, temp: 18 },
                { press: 800, temp: 14 },
            ],
        ],
        sfctrace_regular: [
            [
                { press: 1000, temp: 19 },
                { press: 900, temp: 14 },
                { press: 800, temp: 10 },
            ],
            [
                { press: 980, temp: 21 },
                { press: 900, temp: 16 },
                { press: 800, temp: 12 },
            ],
        ],
    };

    test('returns null when parcel trace is disabled', () => {
        expect(getParcelTraceData(derivedStats, 'none', 'vt')).toBeNull();
    });

    test('returns all virtual parcel traces for requested parcel type', () => {
        const trace = getParcelTraceData(derivedStats, 'sfc', 'vt');

        expect(trace).toHaveLength(2);
        expect(trace[0][0].press).toBe(1000);
        expect(trace[1][0].temp).toBeCloseTo(22);
    });

    test('returns all regular parcel traces for requested parcel type', () => {
        const trace = getParcelTraceData(derivedStats, 'sfc', 'regular');

        expect(trace).toHaveLength(2);
        expect(trace[0][0].press).toBe(1000);
        expect(trace[1][0].temp).toBeCloseTo(21);
    });

    test('returns both member and mean parcel trace data in one structure', () => {
        const traceSet = getParcelTraceSet(derivedStats, 'sfc', 'vt');

        expect(traceSet.memberProfiles).toHaveLength(2);
        expect(traceSet.meanProfile).toHaveLength(5);
        expect(traceSet.meanProfile.map((level) => level.press)).toEqual([
            1000, 990, 980, 900, 800,
        ]);
    });

    test('aligns parcel traces before reducing them to a mean profile', () => {
        const trace = resolveParcelTraceDisplayData(derivedStats.sfctrace, 'mean');

        expect(trace).toHaveLength(5);
        expect(trace[0].press).toBe(1000);
        expect(trace.map((level) => level.press)).toEqual([1000, 990, 980, 900, 800]);
    });

    test('aligns member parcel traces in plumes and boxwhisker modes', () => {
        const plumes = resolveParcelTraceDisplayData(derivedStats.sfctrace, 'plumes');
        const boxwhisker = resolveParcelTraceDisplayData(derivedStats.sfctrace, 'boxwhisker');

        expect(plumes[0].map((level) => level.press)).toEqual([1000, 990, 980, 900, 800]);
        expect(boxwhisker[0].map((level) => level.press)).toEqual([1000, 990, 980, 900, 800]);
    });
});
