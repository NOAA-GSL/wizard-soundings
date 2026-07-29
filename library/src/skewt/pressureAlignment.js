import sharp from '../Sharp';

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const interpolateField = (profile, field, pressure) => {
    const validPairs = profile
        .map((level) => [level.press, level[field]])
        .filter(([, value]) => isFiniteNumber(value));

    if (validPairs.length === 0) return NaN;
    if (validPairs.length === 1) return validPairs[0][1];

    const exactValue = profile.find(
        (level) => level.press === pressure && isFiniteNumber(level[field]),
    );
    if (exactValue) return exactValue[field];

    return sharp.interp(
        [pressure],
        validPairs.map(([press]) => press),
        validPairs.map(([, value]) => value),
    )[0];
};

export function alignProfilesToPressureGrid(memberProfiles, valueKeys, pointFactory) {
    if (!Array.isArray(memberProfiles) || memberProfiles.length === 0) return null;

    const validProfiles = memberProfiles.filter(
        (profile) => Array.isArray(profile) && profile.length > 0,
    );

    if (validProfiles.length === 0) return null;

    const surfacePressures = validProfiles
        .map((profile) => profile[0]?.press)
        .filter(isFiniteNumber);

    if (surfacePressures.length === 0) return null;

    const averageSurfacePressure =
        surfacePressures.reduce((sum, value) => sum + value, 0) / surfacePressures.length;

    const pressureSet = new Set([averageSurfacePressure]);
    for (const profile of validProfiles) {
        for (const level of profile) {
            if (isFiniteNumber(level.press)) pressureSet.add(level.press);
        }
    }

    const targetPressures = Array.from(pressureSet).sort((a, b) => b - a);

    return validProfiles.map((profile) => {
        const surfaceLevel = profile[0];

        return targetPressures.map((pressure) => {
            const exactLevel = profile.find((level) => level.press === pressure);
            const interpolatedValues = {};

            for (const key of valueKeys) {
                interpolatedValues[key] = interpolateField(profile, key, pressure);
            }

            return pointFactory({
                profile,
                surfaceLevel,
                pressure,
                exactLevel,
                interpolatedValues,
                averageSurfacePressure,
                isSurface: pressure === averageSurfacePressure,
            });
        });
    });
}
