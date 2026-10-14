import * as d3 from 'd3';

export const WIND_UNITS = ['kts', 'm/s', 'mph'];

const KTS_TO_UNIT = { kts: 1, 'm/s': 0.514444, mph: 1.150779 };

// Wind-speed stats from createSounding (kts). SRH and BRN shear are not speeds and stay unconverted.
export const WIND_STAT_KEYS = [
    'sfc1kmshr',
    'sfc3kmshr',
    'sfc6kmshr',
    'sfc8kmshr',
    'effshr',
    'ellclshr',
    'ebwdshr',
    'momentumTransferMag',
    'momentumTransferMagMax',
];

const factor = (unit) => KTS_TO_UNIT[unit] ?? 1;

/**
 * Converts a knots value (or array of values) to the display unit.
 * @param {number|number[]} valueKts
 * @param {'kts'|'m/s'|'mph'} unit
 */
export function toWindUnit(valueKts, unit = 'kts') {
    if (Array.isArray(valueKts)) return valueKts.map((v) => toWindUnit(v, unit));
    if (!Number.isFinite(valueKts)) return valueKts;
    return valueKts * factor(unit);
}

/**
 * Converts a display-unit value back to knots.
 * @param {number} value
 * @param {'kts'|'m/s'|'mph'} unit
 */
export function fromWindUnit(value, unit = 'kts') {
    if (!Number.isFinite(value)) return value;
    return value / factor(unit);
}

/** Converts a stats value to the display unit only when `key` is a wind-speed stat. */
export function convertWindStat(key, value, unit = 'kts') {
    return WIND_STAT_KEYS.includes(key) ? toWindUnit(value, unit) : value;
}

/**
 * Hodograph rings up to `maxWindKts`, spaced in the display unit.
 * Returns `{ rings, labels }`; each entry is `{ kts, value }` where `value` is in the display unit.
 */
export function buildWindRings(maxWindKts, interval, labelInterval, unit = 'kts') {
    const max = toWindUnit(maxWindKts, unit);
    const toEntry = (value) => ({ kts: fromWindUnit(value, unit), value });
    return {
        rings: d3.range(interval, max + 1e-9, interval).map(toEntry),
        labels: d3.range(interval, max + 1e-9, labelInterval).map(toEntry),
    };
}
