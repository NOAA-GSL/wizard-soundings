import { useMemo } from 'react';
import * as d3 from 'd3';

/**
 * Computes percentile profiles from ensemble member data at each pressure level.
 * Groups all members by pressure and computes the requested percentiles for
 * each variable in variableKeys.
 *
 * @param {Array} memberProfiles - Array of member arrays, each containing level objects.
 * @param {Array} percentiles - Array of percentiles to compute, e.g. [5, 25, 75, 95]. Median (50) is always included.
 * @param {Array} variableKeys - Variable keys to compute, e.g. ['temp', 'dwpt', 'wetb'].
 * @returns {Object} - { pressureLevels, [variableKey]: { p5: [...], p25: [...], ... } }
 */
export function computePercentileProfiles(
    memberProfiles,
    percentiles,
    variableKeys = ['temp', 'dwpt'],
) {
    if (!memberProfiles || memberProfiles.length === 0) return null;
    const keys = [...new Set(variableKeys)].filter(Boolean);
    if (keys.length === 0) return null;

    // Ensure 50 (median) is always included
    const allPercentiles = [...new Set([...percentiles, 50])].sort((a, b) => a - b);

    // Collect all unique pressure levels across members
    const pressureSet = new Set();
    for (const member of memberProfiles) {
        for (const level of member) {
            if (level.press != null) pressureSet.add(level.press);
        }
    }
    const pressureLevels = [...pressureSet].sort((a, b) => b - a); // High to low pressure

    // For each pressure level, gather variable values across members
    const result = { pressureLevels };
    for (const key of keys) result[key] = {};

    for (const p of allPercentiles) {
        for (const key of keys) {
            result[key][`p${p}`] = [];
        }
    }

    for (const press of pressureLevels) {
        const valuesByKey = Object.fromEntries(keys.map((key) => [key, []]));

        for (const member of memberProfiles) {
            const level = member.find((d) => d.press === press);
            if (level) {
                for (const key of keys) {
                    if (level[key] != null && !Number.isNaN(level[key])) {
                        valuesByKey[key].push(level[key]);
                    }
                }
            }
        }

        for (const key of keys) {
            valuesByKey[key].sort((a, b) => a - b);
        }

        for (const p of allPercentiles) {
            const q = p / 100;
            for (const key of keys) {
                const vals = valuesByKey[key];
                result[key][`p${p}`].push(vals.length >= 2 ? d3.quantile(vals, q) : null);
            }
        }
    }

    return result;
}

/**
 * Builds an SVG path for a filled area between two percentile lines on a skew-t.
 */
function buildAreaPath(pressureLevels, lowerValues, upperValues, xScale, yScale, tanAlpha, baseY) {
    const points = [];

    // Forward pass (lower percentile, top to bottom)
    for (let i = 0; i < pressureLevels.length; i++) {
        const press = pressureLevels[i];
        const val = lowerValues[i];
        if (val == null) continue;
        const x = xScale(val) + (baseY - yScale(press)) / tanAlpha;
        const y = yScale(press);
        points.push([x, y]);
    }

    // Reverse pass (upper percentile, bottom to top)
    for (let i = pressureLevels.length - 1; i >= 0; i--) {
        const press = pressureLevels[i];
        const val = upperValues[i];
        if (val == null) continue;
        const x = xScale(val) + (baseY - yScale(press)) / tanAlpha;
        const y = yScale(press);
        points.push([x, y]);
    }

    if (points.length < 3) return null;

    return d3.line().curve(d3.curveLinear)(points) + 'Z';
}

/**
 * Builds an SVG line path for a single percentile trace on a skew-t.
 */
function buildLinePath(pressureLevels, values, xScale, yScale, tanAlpha, baseY) {
    const points = [];
    for (let i = 0; i < pressureLevels.length; i++) {
        const press = pressureLevels[i];
        const val = values[i];
        if (val == null) continue;
        const x = xScale(val) + (baseY - yScale(press)) / tanAlpha;
        const y = yScale(press);
        points.push([x, y]);
    }
    if (points.length < 2) return null;
    return d3.line().curve(d3.curveLinear)(points);
}

/**
 * SkewTBoxWhisker: Draws box-and-whisker style shaded areas on the SkewT.
 *
 * Props:
 * - memberProfiles: Array of member data arrays
 * - scales: { xScale, yScale, tanAlpha, baseY }
 * - percentiles: Array of percentile values, e.g. [5, 25, 75, 95]
 * - variableKeys: Variables to render, e.g. ['temp', 'dwpt', 'wetb']
 * - visibleVariables: Optional variable visibility map, e.g. { temp: true, dwpt: true }
 * - colors: { temp, dwpt } - base colors for temp and dewpoint
 */
export default function SkewTBoxWhisker({
    memberProfiles,
    scales,
    percentiles = [5, 25, 75, 95],
    variableKeys = ['temp', 'dwpt'],
    visibleVariables = {},
    colors,
}) {
    const { xScale, yScale, tanAlpha, baseY } = scales;
    const activeVariableKeys = useMemo(
        () => variableKeys.filter((key) => visibleVariables[key] !== false),
        [variableKeys, visibleVariables],
    );

    const percentileData = useMemo(
        () => computePercentileProfiles(memberProfiles, percentiles, activeVariableKeys),
        [memberProfiles, percentiles, activeVariableKeys],
    );

    const paths = useMemo(() => {
        if (!percentileData || !xScale) return null;

        const { pressureLevels } = percentileData;
        const sortedPercentiles = [...new Set([...percentiles, 50])].sort((a, b) => a - b);

        // Build whisker and box areas for temp and dwpt
        // Whisker: outermost percentiles (e.g., 5th to 25th and 75th to 95th)
        // Box: inner percentiles (e.g., 25th to 75th)
        const whiskerLow = sortedPercentiles[0]; // e.g., 5
        const boxLow = sortedPercentiles[1]; // e.g., 25
        const median = 50;
        const boxHigh = sortedPercentiles[sortedPercentiles.length - 2]; // e.g., 75
        const whiskerHigh = sortedPercentiles[sortedPercentiles.length - 1]; // e.g., 95

        const buildPaths = (data, color) => {
            // Whisker area (outer)
            const whiskerPath = buildAreaPath(
                pressureLevels,
                data[`p${whiskerLow}`],
                data[`p${whiskerHigh}`],
                xScale,
                yScale,
                tanAlpha,
                baseY,
            );
            // Box area (inner)
            const boxPath = buildAreaPath(
                pressureLevels,
                data[`p${boxLow}`],
                data[`p${boxHigh}`],
                xScale,
                yScale,
                tanAlpha,
                baseY,
            );
            // Median line
            const medianPath = buildLinePath(
                pressureLevels,
                data[`p${median}`],
                xScale,
                yScale,
                tanAlpha,
                baseY,
            );

            return { whiskerPath, boxPath, medianPath, color };
        };

        return activeVariableKeys.reduce((acc, key) => {
            acc[key] = buildPaths(percentileData[key], colors[key]);
            return acc;
        }, {});
    }, [percentileData, xScale, yScale, tanAlpha, baseY, percentiles, colors, activeVariableKeys]);

    if (!paths) return null;

    const renderVariable = (varPaths) => {
        if (!varPaths) return null;
        const { whiskerPath, boxPath, medianPath, color } = varPaths;
        return (
            <g>
                {/* Whisker area (lightest fill) */}
                {whiskerPath && (
                    <path
                        d={whiskerPath}
                        fill={color}
                        fillOpacity={0.12}
                        stroke={color}
                        strokeWidth={0.5}
                        strokeOpacity={0.3}
                    />
                )}
                {/* Box area (darker fill) */}
                {boxPath && (
                    <path
                        d={boxPath}
                        fill={color}
                        fillOpacity={0.3}
                        stroke={color}
                        strokeWidth={0.8}
                        strokeOpacity={0.6}
                    />
                )}
                {/* Median line (solid) */}
                {medianPath && (
                    <path
                        d={medianPath}
                        fill="none"
                        stroke={color}
                        strokeWidth={2.5}
                        strokeOpacity={1}
                    />
                )}
            </g>
        );
    };

    return (
        <g className="skewt-box-whisker">
            {activeVariableKeys.map((key) => (
                <g key={`boxwhisker-${key}`}>{renderVariable(paths[key])}</g>
            ))}
        </g>
    );
}
