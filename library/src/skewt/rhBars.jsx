import React, { useMemo } from 'react';
import * as d3 from 'd3';
import styles from './skewt.module.css';

/**
 * Default colorbar stop definition matching the original specification:
 * - 70% to 94%: Interpolates dark green to bright green
 * - 95% to 100%: Purple
 */
const DEFAULT_COLOR_STOPS = [
    { value: 70, color: '#14532d' },
    { value: 94, color: '#00ff00' },
    { value: 95, color: '#9333ea' },
    { value: 100, color: '#9333ea' },
];

/**
 * SkewTRHBars Component
 * Renders left-anchored RH bars where each sounding level represents the center point of its layer.
 */
export default function SkewTRHBars({
    profile = [],
    scales = {},
    transformState = { k: 1, x: 0, y: 0 },
    xPosition = 0,
    rhConfig = {},
}) {
    // Extract configuration options defensively with fallbacks
    const {
        minRH = 70,
        colorBar = DEFAULT_COLOR_STOPS,
        minBarWidth = 4,
        maxBarWidth = 24,
    } = rhConfig;
    // Construct a piecewise D3 scale from arbitrary color stops
    const colorScale = useMemo(() => {
        const validStops =
            Array.isArray(colorBar) && colorBar.length > 0 ? colorBar : DEFAULT_COLOR_STOPS;

        // Ensure stops are sorted ascending by threshold value
        const sortedStops = [...validStops].sort((a, b) => a.value - b.value);

        return d3
            .scaleLinear()
            .domain(sortedStops.map((stop) => stop.value))
            .range(sortedStops.map((stop) => stop.color))
            .clamp(true);
    }, [colorBar]);

    // D3 scale mapping RH percentage (minRH to 100%) to pixel width
    const widthScale = useMemo(() => {
        return d3.scaleLinear().domain([minRH, 100]).range([minBarWidth, maxBarWidth]).clamp(true);
    }, [minRH, minBarWidth, maxBarWidth]);

    // Construct point-centered vertical layers from profile levels
    const rhLayers = useMemo(() => {
        // Defensive checks for input structure
        if (!Array.isArray(profile) || profile.length === 0) {
            return [];
        }

        const validPoints = profile.filter(
            (pt) =>
                pt &&
                typeof pt.press === 'number' &&
                !Number.isNaN(pt.press) &&
                typeof pt.rh === 'number' &&
                !Number.isNaN(pt.rh),
        );

        if (validPoints.length === 0) {
            return [];
        }

        // Sort levels descending by pressure (surface to upper atmosphere)
        const sortedPoints = [...validPoints].sort((a, b) => b.press - a.press);
        const layers = [];
        const totalPoints = sortedPoints.length;

        for (let i = 0; i < totalPoints; i += 1) {
            const currentPoint = sortedPoints[i];
            const rhValue = currentPoint.rh;

            // Only generate render objects for levels meeting the minimum RH threshold
            if (rhValue < minRH) {
                continue;
            }

            // Calculate bottom pressure boundary for layer i
            // Geometric mean with level below (i - 1), or exact pressure if surface level
            const pressBottom =
                i === 0
                    ? currentPoint.press
                    : Math.sqrt(currentPoint.press * sortedPoints[i - 1].press);

            // Calculate top pressure boundary for layer i
            // Geometric mean with level above (i + 1), or exact pressure if top level
            const pressTop =
                i === totalPoints - 1
                    ? currentPoint.press
                    : Math.sqrt(currentPoint.press * sortedPoints[i + 1].press);

            layers.push({
                id: `rh-point-layer-${currentPoint.press}`,
                pressureBottom: pressBottom,
                pressureTop: pressTop,
                rh: rhValue,
                color: colorScale(rhValue),
                width: widthScale(rhValue),
            });
        }

        return layers;
    }, [profile, minRH, colorScale, widthScale]);

    if (!scales?.yScale || rhLayers.length === 0) {
        return null;
    }

    return (
        <g className={styles.rhBars} pointerEvents="none">
            {rhLayers.map((layer) => {
                // Compute unscaled Y screen positions from log-scale
                const unscaledYBottom = scales.yScale(layer.pressureBottom);
                const unscaledYTop = scales.yScale(layer.pressureTop);

                // Apply dynamic zoom transformation
                const yBottom = transformState.k * unscaledYBottom + transformState.y;
                const yTop = transformState.k * unscaledYTop + transformState.y;

                const startY = Math.min(yTop, yBottom);
                const height = Math.abs(yBottom - yTop);

                if (height <= 0) return null;

                return (
                    <rect
                        key={layer.id}
                        x={xPosition}
                        y={startY}
                        width={layer.width}
                        height={height}
                        fill={layer.color}
                    />
                );
            })}
        </g>
    );
}
