/**
 * Computes a mean profile by averaging all numeric fields across all member
 * profiles at each unique pressure level. Fields listed in MEAN_SKIP_FIELDS are
 * treated as identifiers and excluded from averaging.
 *
 * @param {Array} memberProfiles - Array of member profiles (each is an array of level objects).
 * @returns {Array|null} Sorted mean profile (highest pressure first), or null if input is empty.
 */
const MEAN_SKIP_FIELDS = new Set(['press', 'mem', 'member']);

export function computeMeanProfile(memberProfiles) {
    if (!memberProfiles || memberProfiles.length === 0) return null;

    const pressMap = new Map();
    for (const profile of memberProfiles) {
        for (const level of profile) {
            const p = level.press;
            if (!pressMap.has(p)) pressMap.set(p, {});
            const acc = pressMap.get(p);
            for (const [key, val] of Object.entries(level)) {
                if (MEAN_SKIP_FIELDS.has(key) || typeof val !== 'number' || Number.isNaN(val)) {
                    continue;
                }
                if (!acc[key]) acc[key] = { sum: 0, count: 0 };
                acc[key].sum += val;
                acc[key].count++;
            }
        }
    }

    return Array.from(pressMap.entries())
        .sort(([a], [b]) => b - a)
        .map(([press, acc]) => {
            const result = { press };
            for (const [key, { sum, count }] of Object.entries(acc)) {
                result[key] = count > 0 ? sum / count : null;
            }
            return result;
        });
}
