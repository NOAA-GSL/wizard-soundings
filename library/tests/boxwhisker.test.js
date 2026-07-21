import { expect, test, describe } from 'vitest';
import { computePercentileProfiles } from '../src/skewt/skewtBoxWhisker';

describe('SkewT Box Whisker - Percentile Computation', () => {
    // Create synthetic ensemble data: 10 members at 3 pressure levels
    const createMember = (tempOffset, dwptOffset) => [
        {
            press: 1000,
            temp: 20 + tempOffset,
            dwpt: 10 + dwptOffset,
            wetb: 15 + tempOffset,
        },
        { press: 850, temp: 10 + tempOffset, dwpt: 2 + dwptOffset, wetb: 6 + tempOffset },
        {
            press: 500,
            temp: -15 + tempOffset,
            dwpt: -25 + dwptOffset,
            wetb: -20 + tempOffset,
        },
    ];

    const memberProfiles = [];
    for (let i = 0; i < 20; i++) {
        memberProfiles.push(createMember(i - 10, i - 10));
    }

    test('returns null for empty input', () => {
        expect(computePercentileProfiles([], [5, 25, 75, 95], ['temp', 'dwpt'])).toBeNull();
        expect(computePercentileProfiles(null, [5, 25, 75, 95], ['temp', 'dwpt'])).toBeNull();
    });

    test('computes all requested percentiles plus median', () => {
        const result = computePercentileProfiles(
            memberProfiles,
            [5, 25, 75, 95],
            ['temp', 'dwpt', 'wetb'],
        );
        expect(result).not.toBeNull();
        expect(result.temp).toHaveProperty('p5');
        expect(result.temp).toHaveProperty('p25');
        expect(result.temp).toHaveProperty('p50');
        expect(result.temp).toHaveProperty('p75');
        expect(result.temp).toHaveProperty('p95');
        expect(result.dwpt).toHaveProperty('p50');
        expect(result.wetb).toHaveProperty('p50');
    });

    test('pressure levels are sorted high to low', () => {
        const result = computePercentileProfiles(
            memberProfiles,
            [5, 25, 75, 95],
            ['temp', 'dwpt', 'wetb'],
        );
        expect(result.pressureLevels).toEqual([1000, 850, 500]);
    });

    test('percentile values are monotonically ordered', () => {
        const result = computePercentileProfiles(
            memberProfiles,
            [5, 25, 75, 95],
            ['temp', 'dwpt', 'wetb'],
        );
        for (let i = 0; i < result.pressureLevels.length; i++) {
            expect(result.temp.p5[i]).toBeLessThanOrEqual(result.temp.p25[i]);
            expect(result.temp.p25[i]).toBeLessThanOrEqual(result.temp.p50[i]);
            expect(result.temp.p50[i]).toBeLessThanOrEqual(result.temp.p75[i]);
            expect(result.temp.p75[i]).toBeLessThanOrEqual(result.temp.p95[i]);
        }
    });

    test('median is the correct value for uniform distribution', () => {
        const result = computePercentileProfiles(memberProfiles, [25, 75], ['temp', 'dwpt']);
        // At 1000 hPa, temps range from 10 to 29 (20 + [-10..9])
        // Median should be approximately 19.5 for 20 evenly spaced values
        const medianAt1000 = result.temp.p50[0];
        expect(medianAt1000).toBeCloseTo(19.5, 0);
    });

    test('handles members with missing data gracefully', () => {
        const membersWithGaps = [
            [
                { press: 1000, temp: 20, dwpt: 10 },
                { press: 850, temp: null, dwpt: 5 },
            ],
            [
                { press: 1000, temp: 22, dwpt: 12 },
                { press: 850, temp: 12, dwpt: 4 },
            ],
            [
                { press: 1000, temp: 18, dwpt: 8 },
                { press: 850, temp: 8, dwpt: 2 },
            ],
        ];
        const result = computePercentileProfiles(membersWithGaps, [25, 75], ['temp', 'dwpt']);
        expect(result).not.toBeNull();
        // At 850 hPa, only 2 valid temps (12, 8) - should still compute
        expect(result.temp.p50[1]).not.toBeNull();
    });

    test('computes only requested variable keys', () => {
        const result = computePercentileProfiles(memberProfiles, [25, 75], ['wetb']);
        expect(result).not.toBeNull();
        expect(result.wetb).toHaveProperty('p50');
        expect(result.temp).toBeUndefined();
        expect(result.dwpt).toBeUndefined();
    });
});
