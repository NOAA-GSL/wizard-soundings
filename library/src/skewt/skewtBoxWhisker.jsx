import { useMemo } from 'react';
import * as d3 from 'd3';

/**
 * Computes percentile profiles from ensemble member data at each pressure level.
 * Groups all members by pressure and computes the requested percentiles for temp and dwpt.
 *
 * @param {Array} memberProfiles - Array of member arrays, each containing level objects with {press, temp, dwpt}
 * @param {Array} percentiles - Array of percentiles to compute, e.g. [5, 25, 75, 95]. Median (50) is always included.
 * @returns {Object} - { pressureLevels, temp: { p5: [...], p25: [...], ... }, dwpt: { ... } }
 */
export function computePercentileProfiles(memberProfiles, percentiles) {
    if (!memberProfiles || memberProfiles.length === 0) return null;

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

    // For each pressure level, gather temp/dwpt values across members
    const result = {
        pressureLevels,
        temp: {},
        dwpt: {},
    };

    for (const p of allPercentiles) {
        result.temp[`p${p}`] = [];
        result.dwpt[`p${p}`] = [];
    }

    for (const press of pressureLevels) {
        const temps = [];
        const dwpts = [];

        for (const member of memberProfiles) {
            const level = member.find((d) => d.press === press);
            if (level) {
                if (level.temp != null && !Number.isNaN(level.temp)) temps.push(level.temp);
                if (level.dwpt != null && !Number.isNaN(level.dwpt)) dwpts.push(level.dwpt);
            }
        }

        temps.sort((a, b) => a - b);
        dwpts.sort((a, b) => a - b);

        for (const p of allPercentiles) {
            const q = p / 100;
            result.temp[`p${p}`].push(temps.length >= 2 ? d3.quantile(temps, q) : null);
            result.dwpt[`p${p}`].push(dwpts.length >= 2 ? d3.quantile(dwpts, q) : null);
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
 * - colors: { temp, dwpt } - base colors for temp and dewpoint
 */
export default function SkewTBoxWhisker({
    memberProfiles,
    scales,
    percentiles = [5, 25, 75, 95],
    colors,
}) {
    const { xScale, yScale, tanAlpha, baseY } = scales;

    const percentileData = useMemo(
        () => computePercentileProfiles(memberProfiles, percentiles),
        [memberProfiles, percentiles],
    );

    const paths = useMemo(() => {
        if (!percentileData || !xScale) return null;

        const { pressureLevels, temp, dwpt } = percentileData;
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

        return {
            temp: buildPaths(temp, colors.temp),
            dwpt: buildPaths(dwpt, colors.dwpt),
        };
    }, [percentileData, xScale, yScale, tanAlpha, baseY, percentiles, colors]);

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
            {renderVariable(paths.dwpt)}
            {renderVariable(paths.temp)}
        </g>
    );
}
