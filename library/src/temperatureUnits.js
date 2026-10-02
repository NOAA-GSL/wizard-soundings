// Absolute-temperature stats from createSounding (deg C). Differences such as LI are left in C.
export const TEMPERATURE_STAT_KEYS = ['cTemp', 'maxT', 'downT'];

export const isFahrenheit = (unit) => String(unit ?? 'C').toUpperCase() === 'F';

/**
 * Converts a deg C value (or array of values) to the display unit.
 * @param {number|number[]} valueC
 * @param {'C'|'F'} unit
 */
export function toTemperatureUnit(valueC, unit = 'C') {
    if (Array.isArray(valueC)) return valueC.map((v) => toTemperatureUnit(v, unit));
    if (!isFahrenheit(unit) || !Number.isFinite(valueC)) return valueC;
    return (valueC * 9) / 5 + 32;
}

/**
 * Converts a display-unit value back to deg C.
 * @param {number} value
 * @param {'C'|'F'} unit
 */
export function fromTemperatureUnit(value, unit = 'C') {
    if (!isFahrenheit(unit) || !Number.isFinite(value)) return value;
    return ((value - 32) * 5) / 9;
}

/**
 * Isotherm lines for the Skew-T. `isotherms` bounds are deg C; `interval` is in the display unit
 * so labels land on round numbers. Returns `{ tempC, label, freezing }`; label is null when unlabeled.
 */
export function buildIsotherms({ min, max, interval }, unit = 'C') {
    const lo = toTemperatureUnit(min, unit);
    const hi = toTemperatureUnit(max, unit);
    const lines = [];
    for (let t = Math.ceil(lo / interval) * interval; t <= hi + 1e-9; t += interval) {
        const tempC = fromTemperatureUnit(t, unit);
        lines.push({ tempC, label: t, freezing: Math.abs(tempC) < 1e-9 });
    }
    if (!lines.some((line) => line.freezing) && min <= 0 && max >= 0) {
        lines.push({ tempC: 0, label: null, freezing: true });
    }
    return lines;
}

/** Converts a stats value to the display unit only when `key` is an absolute-temperature stat. */
export function convertTemperatureStat(key, value, unit = 'C') {
    return TEMPERATURE_STAT_KEYS.includes(key) ? toTemperatureUnit(value, unit) : value;
}
