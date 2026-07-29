import { describe, expect, test } from 'vitest';
import createSounding, { filterNearSurfaceLevels } from '../src/createSounding';
import sharp from '../src/Sharp';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const demoPath = join(__dirname, '../../demo/examples/stats/soundingData.json');
const demoData = JSON.parse(readFileSync(demoPath, 'utf-8'));

const DEFAULT_UNITS_BY_FIELD = {
    pressure: 'hPa',
    gh_isobaric: 'dam',
    t_isobaric: 'F',
    dpt_isobaric: 'F',
    u_isobaric: 'mph',
    v_isobaric: 'mph',
    orog: 'm',
    sp: 'hPa',
    mslp: 'hPa',
    t2: 'F',
    d2: 'F',
    u10: 'mph',
    v10: 'mph',
    rh2: '%',
    r_isobaric: '%',
    w_isobaric: 'm/s',
};

const getRecordsForDate = () => {
    const selectedDate = String(demoData.metadata.gh_isobaric.availableDates[0]);
    const baseRecordsForDate = demoData.data[selectedDate] ?? [];
    const pressureLevels = demoData.metadata.gh_isobaric.z ?? [];
    const models = [...new Set(baseRecordsForDate.map((record) => record?.model).filter(Boolean))];

    const pressureRecords = models.map((model) => ({
        field: 'pressure',
        model,
        units: 'hPa',
        value: pressureLevels,
    }));

    const withUnits = baseRecordsForDate.map((record) => ({
        ...record,
        units: DEFAULT_UNITS_BY_FIELD[record.field] ?? 'unitless',
    }));

    return [...withUnits, ...pressureRecords];
};

const fToC = (f) => ((f - 32) * 5) / 9;
const mphToMps = (mph) => mph * 0.44704;

describe('createSounding unit handling', () => {
    test('converts alternative input units to same normalized result', () => {
        const baseRecords = getRecordsForDate();

        const altUnitRecords = baseRecords.map((record) => {
            if (record.field === 'pressure' || record.field === 'sp' || record.field === 'mslp') {
                return {
                    ...record,
                    units: 'Pa',
                    value: Array.isArray(record.value)
                        ? record.value.map((v) => (v == null ? v : v * 100))
                        : record.value * 100,
                };
            }

            if (record.field === 't2' || record.field === 'd2') {
                return {
                    ...record,
                    units: 'C',
                    value: fToC(record.value),
                };
            }

            if (record.field === 'u10' || record.field === 'v10') {
                return {
                    ...record,
                    units: 'm/s',
                    value: mphToMps(record.value),
                };
            }

            return record;
        });

        const baseline = createSounding();
        baseline.updateData(baseRecords);

        const converted = createSounding();
        converted.updateData(altUnitRecords);

        const baseLevels = baseline.getLevelData();
        const convLevels = converted.getLevelData();
        expect(baseLevels.length).toBe(convLevels.length);

        const baseFirstMember = baseLevels[0];
        const convFirstMember = convLevels[0];

        expect(baseFirstMember[0].press).toBeCloseTo(convFirstMember[0].press, 6);
        expect(baseFirstMember[0].temp).toBeCloseTo(convFirstMember[0].temp, 0);
        expect(baseFirstMember[0].dwpt).toBeCloseTo(convFirstMember[0].dwpt, 0);
        expect(baseFirstMember[0].uwnd).toBeCloseTo(convFirstMember[0].uwnd, 4);
        expect(baseFirstMember[0].vwnd).toBeCloseTo(convFirstMember[0].vwnd, 4);

        expect(baseFirstMember[1].press).toBeCloseTo(convFirstMember[1].press, 6);
        expect(baseFirstMember[1].temp).toBeCloseTo(convFirstMember[1].temp, 0);
        expect(baseFirstMember[1].dwpt).toBeCloseTo(convFirstMember[1].dwpt, 0);
        expect(baseFirstMember[1].uwnd).toBeCloseTo(convFirstMember[1].uwnd, 4);
        expect(baseFirstMember[1].vwnd).toBeCloseTo(convFirstMember[1].vwnd, 4);
    });

    test('throws when units are missing', () => {
        const sounding = createSounding();
        const records = getRecordsForDate();
        delete records[0].units;

        expect(() => sounding.updateData(records)).toThrow(/missing units/i);
    });

    test('throws when units are invalid for a field', () => {
        const sounding = createSounding();
        const records = getRecordsForDate();
        const rhRecord = records.find((record) => record.field === 'rh2');
        rhRecord.units = 'fraction';

        expect(() => sounding.updateData(records)).toThrow(/unsupported units/i);
    });

    test('derives rh2 when it is omitted', () => {
        const records = getRecordsForDate().filter((record) => record.field !== 'rh2');

        const sounding = createSounding();
        sounding.updateData(records);

        const levels = sounding.getLevelData();
        const firstMember = levels[0];
        const surfaceLevel = firstMember[0];
        const expectedRh2 = sharp.rh(
            [surfaceLevel.press],
            [surfaceLevel.temp],
            [surfaceLevel.dwpt],
        )[0];

        expect(surfaceLevel.rh2).toBeCloseTo(expectedRh2, 6);
    });

    test('interpolates interior wwnd values', () => {
        const records = getRecordsForDate().map((record) => ({
            ...record,
            value: Array.isArray(record.value) ? [...record.value] : record.value,
        }));

        const pressureRecord = records.find((record) => record.field === 'pressure');
        const heightRecord = records.find((record) => record.field === 'gh_isobaric');
        const wRecord = records.find((record) => record.field === 'w_isobaric');

        const missingIndex = 4;
        const targetModel = wRecord.model;

        wRecord.value[missingIndex] = NaN;

        const sounding = createSounding();
        sounding.updateData(records);

        const profile = sounding.getLevelData().find((levels) => levels[0].mem === targetModel);
        const targetPressure = pressureRecord.value[missingIndex];
        const targetLevel = profile.find((level) => level.press === targetPressure);

        const expectedW = sharp.interp(
            [heightRecord.value[missingIndex]],
            [heightRecord.value[missingIndex - 1], heightRecord.value[missingIndex + 1]],
            [wRecord.value[missingIndex - 1], wRecord.value[missingIndex + 1]],
        )[0];

        expect(Number.isFinite(targetLevel.wwnd)).toBe(true);
        expect(targetLevel.wwnd).toBeCloseTo(expectedW, 6);
    });

    test('interpolates interior missing tmpc and wind components', () => {
        const records = getRecordsForDate().map((record) => ({
            ...record,
            value: Array.isArray(record.value) ? [...record.value] : record.value,
        }));

        const pressureRecord = records.find((record) => record.field === 'pressure');
        const targetModel = pressureRecord.model;
        const missingIndex = 4;

        const tempRecord = records.find(
            (record) => record.model === targetModel && record.field === 't_isobaric',
        );
        const uRecord = records.find(
            (record) => record.model === targetModel && record.field === 'u_isobaric',
        );

        tempRecord.value[missingIndex] = NaN;
        uRecord.value[missingIndex] = NaN;

        const sounding = createSounding();
        sounding.updateData(records);

        const profile = sounding.getProfileData().find((item) => item.mem === targetModel);
        const targetPressure = pressureRecord.value[missingIndex];
        const profileIndex = profile.pres.findIndex((pres) => pres === targetPressure);

        expect(profileIndex).toBeGreaterThan(0);
        expect(Number.isFinite(profile.tmpc[profileIndex])).toBe(true);
        expect(Number.isFinite(profile.uwnd[profileIndex])).toBe(true);
    });

    test('aligns member profiles to a shared pressure grid', () => {
        const records = [
            { field: 'pressure', model: 'A', units: 'hPa', value: [960, 900, 850, 700, 500, 300] },
            {
                field: 'gh_isobaric',
                model: 'A',
                units: 'm',
                value: [100, 800, 1200, 3000, 5500, 9000],
            },
            { field: 't_isobaric', model: 'A', units: 'C', value: [20, 15, 10, 0, -12, -32] },
            { field: 'dpt_isobaric', model: 'A', units: 'C', value: [15, 10, 5, -5, -22, -40] },
            { field: 'u_isobaric', model: 'A', units: 'kts', value: [10, 15, 20, 25, 30, 35] },
            { field: 'v_isobaric', model: 'A', units: 'kts', value: [5, 8, 10, 12, 15, 18] },
            { field: 'orog', model: 'A', units: 'm', value: 100 },
            { field: 'sp', model: 'A', units: 'hPa', value: 960 },
            { field: 'mslp', model: 'A', units: 'hPa', value: 1010 },
            { field: 't2', model: 'A', units: 'C', value: 20 },
            { field: 'd2', model: 'A', units: 'C', value: 15 },
            { field: 'u10', model: 'A', units: 'kts', value: 10 },
            { field: 'v10', model: 'A', units: 'kts', value: 5 },
            { field: 'rh2', model: 'A', units: '%', value: 70 },
            { field: 'pressure', model: 'B', units: 'hPa', value: [940, 925, 850, 700, 500, 300] },
            {
                field: 'gh_isobaric',
                model: 'B',
                units: 'm',
                value: [120, 350, 1210, 3050, 5550, 9050],
            },
            { field: 't_isobaric', model: 'B', units: 'C', value: [19, 17, 11, 1, -11, -31] },
            { field: 'dpt_isobaric', model: 'B', units: 'C', value: [14, 12, 6, -4, -21, -39] },
            { field: 'u_isobaric', model: 'B', units: 'kts', value: [12, 16, 21, 26, 31, 36] },
            { field: 'v_isobaric', model: 'B', units: 'kts', value: [6, 9, 11, 13, 16, 19] },
            { field: 'orog', model: 'B', units: 'm', value: 120 },
            { field: 'sp', model: 'B', units: 'hPa', value: 940 },
            { field: 'mslp', model: 'B', units: 'hPa', value: 1008 },
            { field: 't2', model: 'B', units: 'C', value: 19 },
            { field: 'd2', model: 'B', units: 'C', value: 14 },
            { field: 'u10', model: 'B', units: 'kts', value: 12 },
            { field: 'v10', model: 'B', units: 'kts', value: 6 },
            { field: 'rh2', model: 'B', units: '%', value: 72 },
        ];

        const sounding = createSounding();
        sounding.updateData(records);

        const levels = sounding.getLevelData();
        const firstPressures = levels[0].map((level) => level.press);
        const secondPressures = levels[1].map((level) => level.press);

        expect(firstPressures).toEqual(secondPressures);
        expect(firstPressures[0]).toBeCloseTo(950);
        expect(firstPressures).toContain(940);
        expect(firstPressures).toContain(925);
        expect(firstPressures).toContain(900);
    });

    test('removes pressure levels that are within 0.5 hPa of the aligned surface', () => {
        const levels = [
            [
                { press: 980.1000000000001, mem: 'A' },
                { press: 980.1, mem: 'A' },
                { press: 975, mem: 'A' },
            ],
            [
                { press: 980.1, mem: 'B' },
                { press: 980.0999999999999, mem: 'B' },
                { press: 950, mem: 'B' },
            ],
        ];

        const filteredLevels = filterNearSurfaceLevels(levels[0]);
        const filteredAlignedLevels = levels.map(filterNearSurfaceLevels);

        expect(filteredLevels.map((level) => level.press)).toEqual([980.1000000000001, 975]);
        expect(filteredAlignedLevels[0].map((level) => level.press)).toEqual([
            980.1000000000001, 975,
        ]);
        expect(filteredAlignedLevels[1].map((level) => level.press)).toEqual([980.1, 950]);
    });
});
