import { describe, expect, test } from 'vitest';
import { filterWindBarbs } from '../src/skewt/SkewT';

describe('filterWindBarbs', () => {
    const profile = [
        { press: 967.3, uwnd: 3, vwnd: 4, sfcflag: true },
        { press: 950, uwnd: 5, vwnd: 5 },
        { press: 925, uwnd: 6, vwnd: 6 },
        { press: 900, uwnd: 7, vwnd: 7 },
        { press: 150, uwnd: 30, vwnd: 0 },
    ];

    test('includes the surface (u10/v10) level even when pressure is not a multiple of 50', () => {
        const barbs = filterWindBarbs(profile, 100, 1050);
        expect(barbs.map((d) => d.press)).toEqual([967.3, 950, 900, 150]);
    });

    test('includes the first level of a mean profile without sfcflag', () => {
        const meanProfile = profile.map(({ sfcflag, ...rest }) => rest);
        const barbs = filterWindBarbs(meanProfile, 100, 1050);
        expect(barbs[0].press).toBe(967.3);
    });

    test('respects the topP/baseP bounds', () => {
        const barbs = filterWindBarbs(profile, 200, 960);
        expect(barbs.map((d) => d.press)).toEqual([950, 900]);
    });
});
