import { expect, test, describe } from 'vitest';
import { computeMeanProfile } from '../src/skewt/meanProfile.js';

describe('computeMeanProfile', () => {
    const createMember = (tempOffset, dwptOffset, uwndOffset = 0, vwndOffset = 0) => [
        {
            press: 850,
            temp: 10 + tempOffset,
            dwpt: 2 + dwptOffset,
            uwnd: 10 + uwndOffset,
            vwnd: 6 + vwndOffset,
        },
        {
            press: 1000,
            temp: 20 + tempOffset,
            dwpt: 10 + dwptOffset,
            uwnd: 5 + uwndOffset,
            vwnd: 3 + vwndOffset,
        },
        {
            press: 500,
            temp: -15 + tempOffset,
            dwpt: -25 + dwptOffset,
            uwnd: 20 + uwndOffset,
            vwnd: 12 + vwndOffset,
        },
    ];

    test('returns null for empty input', () => {
        expect(computeMeanProfile([])).toBeNull();
        expect(computeMeanProfile(null)).toBeNull();
    });

    test('returns single member unchanged', () => {
        const member = createMember(0, 0);
        const result = computeMeanProfile([member]);
        expect(result).toHaveLength(3);
        expect(result[0].temp).toBeCloseTo(20);
        expect(result[0].dwpt).toBeCloseTo(10);
    });

    test('averages temp and dwpt across members', () => {
        // Two members: offsets of +5 and -5 → mean should equal offset 0
        const members = [createMember(5, 5), createMember(-5, -5)];
        const result = computeMeanProfile(members);
        expect(result[0].temp).toBeCloseTo(20); // (25 + 15) / 2
        expect(result[0].dwpt).toBeCloseTo(10); // (15 + 5) / 2
        expect(result[1].temp).toBeCloseTo(10); // (15 + 5) / 2
    });

    test('averages wind components across members', () => {
        const members = [createMember(0, 0, 10, 4), createMember(0, 0, 0, 0)];
        const result = computeMeanProfile(members);
        expect(result[0].uwnd).toBeCloseTo(10); // (15 + 5) / 2
        expect(result[0].vwnd).toBeCloseTo(5); // (7 + 3) / 2
    });

    test('averages additional numeric variables generically', () => {
        const members = [
            [
                { press: 1000, temp: 20, dwpt: 10, wetb: 15 },
                { press: 850, temp: 10, dwpt: 2, wetb: 6 },
            ],
            [
                { press: 1000, temp: 22, dwpt: 12, wetb: 16 },
                { press: 850, temp: 12, dwpt: 4, wetb: 7 },
            ],
        ];

        const result = computeMeanProfile(members);
        expect(result.find((l) => l.press === 1000).wetb).toBeCloseTo(15.5);
        expect(result.find((l) => l.press === 850).wetb).toBeCloseTo(6.5);
    });

    test('pressure levels are sorted highest (surface) first', () => {
        const members = [createMember(0, 0)];
        const result = computeMeanProfile(members);
        const pressures = result.map((l) => l.press);
        expect(pressures).toEqual([1000, 850, 500]);
    });

    test('handles null/NaN values gracefully', () => {
        const memberWithNull = [
            { press: 1000, temp: null, dwpt: 10, uwnd: 5, vwnd: 3 },
            { press: 850, temp: NaN, dwpt: 2, uwnd: 10, vwnd: 6 },
        ];
        const memberNormal = [
            { press: 1000, temp: 20, dwpt: 12, uwnd: 7, vwnd: 5 },
            { press: 850, temp: 10, dwpt: 4, uwnd: 14, vwnd: 8 },
        ];
        const result = computeMeanProfile([memberWithNull, memberNormal]);
        // Only memberNormal has valid temp at 1000 and 850
        expect(result.find((l) => l.press === 1000).temp).toBeCloseTo(20);
        expect(result.find((l) => l.press === 850).temp).toBeCloseTo(10);
        // dwpt should average both
        expect(result.find((l) => l.press === 1000).dwpt).toBeCloseTo(11); // (10 + 12) / 2
    });

    test('merges levels from members with different pressure levels', () => {
        const memberA = [
            { press: 1000, temp: 20, dwpt: 10, uwnd: 5, vwnd: 3 },
            { press: 850, temp: 10, dwpt: 2, uwnd: 10, vwnd: 6 },
        ];
        const memberB = [
            { press: 850, temp: 12, dwpt: 4, uwnd: 8, vwnd: 4 },
            { press: 500, temp: -14, dwpt: -24, uwnd: 20, vwnd: 12 },
        ];
        const result = computeMeanProfile([memberA, memberB]);
        const pressures = result.map((l) => l.press);
        expect(pressures).toContain(1000);
        expect(pressures).toContain(850);
        expect(pressures).toContain(500);
        // 1000 hPa only in memberA
        expect(result.find((l) => l.press === 1000).temp).toBeCloseTo(20);
        // 850 hPa in both
        expect(result.find((l) => l.press === 850).temp).toBeCloseTo(11); // (10 + 12) / 2
    });
});
