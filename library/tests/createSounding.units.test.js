import { describe, expect, test } from 'vitest';
import createSounding from '../src/createSounding';
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
});
