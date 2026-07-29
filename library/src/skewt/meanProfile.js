/**
 * Computes a mean profile by averaging all numeric fields across all member
 * profiles at each unique pressure level. Fields listed in MEAN_SKIP_FIELDS are
 * treated as identifiers and excluded from averaging.
 *
 * @param {Array} memberProfiles - Array of member profiles (each is an array of level objects).
 * @param {number} minPresencePercent - Optional minimum percent of members that must contain a pressure level.
 * @returns {Array|null} Sorted mean profile (highest pressure first), or null if input is empty.
 */
const MEAN_SKIP_FIELDS = new Set(['press', 'mem', 'member']);

export function computeMeanProfile(memberProfiles, minPresencePercent = 0) {
    if (!memberProfiles || memberProfiles.length === 0) return null;

    const validProfiles = memberProfiles.filter(
        (profile) => Array.isArray(profile) && profile.length > 0,
    );

    if (validProfiles.length === 0) return null;

    const totalMembers = validProfiles.length;
    const pressMap = new Map();
    for (const profile of validProfiles) {
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
        .filter(([, acc]) => {
            // Check if this pressure level has enough representation to be kept
            if (minPresencePercent > 0) {
                const maxCount = Math.max(0, ...Object.values(acc).map((v) => v.count));
                const presence = (maxCount / totalMembers) * 100;
                if (presence < minPresencePercent) return false;
            }
            return true;
        })
        .map(([press, acc]) => {
            const result = { press };
            for (const [key, { sum, count }] of Object.entries(acc)) {
                result[key] = count > 0 ? sum / count : null;
            }
            return result;
        });
}
