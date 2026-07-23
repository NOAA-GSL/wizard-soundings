import React, { useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import sharp from '../Sharp';
import useContainerDimensions from '../utilities/useContainerDimensions';
import useZoomHandler from '../utilities/useZoomHandler';
import ChartTooltip from '../utilities/ToolTip';
import { math } from '../Utilities';
import SkewTBackground from './skewtBackground';
import SkewTBoxWhisker from './skewtBoxWhisker';
import WindBarb from './windBarb';
import { computeMeanProfile } from './meanProfile';
import './skewt.css';

/*-------------------------*/
/* --- SkewT & Helpers --- */
/*-------------------------*/

const DEFAULT_CONFIG = {
    // Canvas settings
    margin: { top: 20, right: 40, bottom: 30, left: 30 },
    // Pressure bounds (hPa)
    baseP: 1050,
    topP: 100,
    // Temperature bounds (C)
    minT: -45,
    maxT: 50,
    // Skew Angle (deg)
    skewAngle: 55,
    aspectRatio: 1,
    // Grid settings
    isobars: [1000, 850, 700, 500, 300, 200, 100],
    isotherms: { min: -50, max: 50, interval: 10 },
    dryAdiabats: { min: -30, max: 170, interval: 20 }, // Potential Temp (C)
    moistAdiabats: { min: -20, max: 40, interval: 5 }, // Start Temp at 1000mb
    mixingRatio: [2, 4, 8, 14, 20, 26], // g/kg
    // Colors
    colors: {
        isobar: 'rgba(200, 150, 150, 0.4)',
        isotherm: 'rgba(200, 150, 150, 0.4)',
        dryAdiabat: 'rgba(200, 150, 150, 0.3)',
        moistAdiabat: 'rgba(100, 200, 100, 0.3)',
        mixingRatio: 'rgba(150, 255, 0, 0.2)',
        temp: '#ff0000',
        dwpt: '#00ff00',
        wetb: '#00ffff',
        parcel: '#ffffff',
    },
    // Zoom settings
    zoom: {
        enabled: true,
        min: 1,
        max: 5,
    },
    renderTooltip: null,
};

const TRACE_RENDER_ORDER = ['wetb', 'dwpt', 'temp'];

/*--------------------------------*/
/* --- Sub-Components ----------- */
/*--------------------------------*/

function getSkewX(temp, press, xScale, yScale, tanAlpha, baseY) {
    return xScale(temp) + (baseY - yScale(press)) / tanAlpha;
}

function filterWindBarbs(profile, topP, baseP) {
    if (!profile) return [];
    return profile.filter(
        (d) =>
            (Math.round(d.press) % 50 === 0 || Math.round(d.press) === 1000) &&
            d.uwnd != null &&
            d.vwnd != null &&
            d.press >= topP &&
            d.press <= baseP,
    );
}

function addWetBulbToProfile(profile) {
    if (!profile) return [];
    return profile.map((level) => {
        const hasInputs =
            typeof level.press === 'number' &&
            typeof level.temp === 'number' &&
            typeof level.dwpt === 'number' &&
            !Number.isNaN(level.press) &&
            !Number.isNaN(level.temp) &&
            !Number.isNaN(level.dwpt);
        return {
            ...level,
            wetb: hasInputs ? sharp.wetBulb([level.press], [level.temp], [level.dwpt])[0] : null,
        };
    });
}

/**
 * Extracts and formats parcel trace data from the stats object.
 */
function useParcelTrace(stats, parcelType) {
    return useMemo(() => {
        // Extract from stats object
        if (!stats) return null;

        const pKey = `${parcelType}ptrace`; // e.g., 'sfcptrace'
        const tKey = `${parcelType}ttrace`; // e.g., 'sfcttrace'

        const pressures = stats[pKey];
        const temps = stats[tKey];

        if (!pressures || !temps || pressures.length !== temps.length) return null;

        // Zip arrays into objects
        return pressures.map((p, i) => ({
            press: p,
            temp: temps[i],
        }));
    }, [stats, parcelType]);
}

// Renders default tooltip content for the SkewT.
function SkewTTooltipContent({ data, colors, traceVisibility }) {
    if (!data) return null;

    // Use sharp.rh to calculate Relative Humidity (returns an array)
    const rhArray = sharp.rh([data.press], [data.temp], [data.dwpt]);
    const rh = rhArray && rhArray.length > 0 ? rhArray[0] : null;

    // Use math.convert for the height calculations
    const hghtMslFt = data.hght != null ? math.convert(data.hght, 'm', 'ft') : null;
    const hghtAglFt = data.hghtagl != null ? math.convert(data.hghtagl, 'm', 'ft') : null;

    return (
        <>
            <div>
                <strong>{data.press?.toFixed(0) ?? '--'} hPa</strong>
            </div>
            {traceVisibility.temp && (
                <div style={{ color: colors.temp }}>T: {data.temp?.toFixed(1) ?? '--'} &deg;C</div>
            )}
            {traceVisibility.dwpt && (
                <div style={{ color: colors.dwpt }}>Td: {data.dwpt?.toFixed(1) ?? '--'} &deg;C</div>
            )}
            {traceVisibility.wetb && (
                <div style={{ color: colors.wetb }}>
                    Tw: {typeof data.wetb === 'number' ? data.wetb.toFixed(1) : '--'} &deg;C
                </div>
            )}
            {data.uwnd != null && (
                <div>Wind: {Math.round(Math.sqrt(data.uwnd ** 2 + data.vwnd ** 2))} kts</div>
            )}
            {rh != null && <div>RH: {rh.toFixed(0)}%</div>}
            <div>
                Hght (MSL): {data.hght?.toFixed(0) ?? '--'} m / {hghtMslFt?.toFixed(0) ?? '--'} ft
            </div>
            <div>
                Hght (AGL): {data.hghtagl?.toFixed(0) ?? '--'} m / {hghtAglFt?.toFixed(0) ?? '--'}{' '}
                ft
            </div>
        </>
    );
}

/* Component: SkewT
    Renders an interactive skew-t with sounding data.
*/
export default function SkewT({
    soundingParam,
    statsDictParam,
    config = {},
    className = 'skewt-container',
    sx = {},
    displayMode,
    percentiles,
}) {
    // --- Dimensions and Setup ---
    const [containerRef, dimensions] = useContainerDimensions();
    const [hoverInfo, setHoverInfo] = useState(null);

    // Resolve displayMode and percentiles from props or config
    const resolvedDisplayMode = useMemo(
        () => displayMode || config.displayMode || 'plumes',
        [displayMode, config.displayMode],
    );
    const resolvedPercentiles = useMemo(
        () => percentiles || config.percentiles || [5, 25, 75, 95],
        [percentiles, config.percentiles],
    );
    const traceVisibility = useMemo(
        () => ({
            temp: config.showTemperature ?? config.traceVisibility?.temp ?? true,
            dwpt: config.showDewPoint ?? config.traceVisibility?.dwpt ?? true,
            wetb: config.showWetBulb ?? config.traceVisibility?.wetb ?? false,
        }),
        [config.showTemperature, config.traceVisibility, config.showDewPoint, config.showWetBulb],
    );
    const activeTraceKeys = useMemo(
        () => TRACE_RENDER_ORDER.filter((key) => traceVisibility[key]),
        [traceVisibility],
    );

    const settings = useMemo(
        () => ({
            ...DEFAULT_CONFIG,
            ...config,
            colors: { ...DEFAULT_CONFIG.colors, ...config.colors },
        }),
        [config],
    );

    const parcelType = 'sfc'; // Could be a prop to select 'sfc', 'ml', or 'mu'
    const parcelTraceData = useParcelTrace(statsDictParam, parcelType);

    // --- D3 Scales & Generators ---
    const { scales, lineGens } = useMemo(() => {
        if (dimensions.width === 0) return { scales: {}, lineGens: {} };
        const { margin, baseP, topP, minT, maxT, skewAngle } = settings;
        const availableW = dimensions.width - margin.left - margin.right;
        const availableH = dimensions.height - margin.top - margin.bottom;
        let innerW;
        let innerH;

        if (availableW / availableH > settings.aspectRatio) {
            // Container is too wide: constrain by height
            innerH = availableH;
            innerW = availableH * settings.aspectRatio;
        } else {
            // Container is too tall: constrain by width
            innerW = availableW;
            innerH = availableW / settings.aspectRatio;
        }

        // Calculate offsets to center the plot area
        const offsetX = margin.left + (availableW - innerW) / 2;
        const offsetY = margin.top + (availableH - innerH) / 2;

        // Scales
        const yScale = d3.scaleLog().domain([baseP, topP]).range([innerH, 0]);
        const xScale = d3.scaleLinear().domain([minT, maxT]).range([0, innerW]);

        // Skew Math
        const tanAlpha = Math.tan(skewAngle * (Math.PI / 180));
        const baseY = yScale(baseP);

        // Helper to generate line path from array
        const makeLine = (keyTemp, keyPressure = 'press') =>
            d3
                .line()
                .defined(
                    (d) =>
                        d[keyTemp] !== null &&
                        d[keyTemp] !== undefined &&
                        !Number.isNaN(d[keyTemp]),
                )
                .curve(d3.curveLinear)
                .x((d) => getSkewX(d[keyTemp], d[keyPressure], xScale, yScale, tanAlpha, baseY))
                .y((d) => yScale(d[keyPressure]));

        return {
            scales: { xScale, yScale, tanAlpha, baseY, innerW, innerH, offsetX, offsetY },
            lineGens: {
                temp: makeLine('temp'),
                dwpt: makeLine('dwpt'),
                wetb: makeLine('wetb'),
                parcel: makeLine('temp', 'press'),
            },
        };
    }, [dimensions.width, dimensions.height, settings]);

    // Zoom Logic
    const [zoomRefCallback, transformState] = useZoomHandler(dimensions, settings.zoom);

    // --- Data Preparation ---
    const { memberProfiles, memberBarbs } = useMemo(() => {
        if (!soundingParam || soundingParam.length === 0) {
            return { memberProfiles: [], memberBarbs: [] };
        }

        // 1. Map member profiles and always compute mean from these members
        const members = soundingParam.map(addWetBulbToProfile);

        return {
            memberProfiles: members,
            memberBarbs: members.map((m) => filterWindBarbs(m, settings.topP, settings.baseP)),
        };
    }, [soundingParam, settings]);

    // Compute mean profile from member profiles (used by 'mean' display mode)
    const { computedMeanProfile, computedMeanBarbs } = useMemo(() => {
        const profile = computeMeanProfile(memberProfiles);
        if (!profile) return { computedMeanProfile: null, computedMeanBarbs: [] };

        const barbs = filterWindBarbs(profile, settings.topP, settings.baseP);

        return { computedMeanProfile: profile, computedMeanBarbs: barbs };
    }, [memberProfiles, settings]);

    const handleMouseMove = useCallback(
        (e) => {
            const tooltipProfile = computedMeanProfile;
            if (!tooltipProfile || !scales.yScale) return;

            // Get raw mouse coordinates relative to the SVG using currentTarget
            const rect = e.currentTarget.getBoundingClientRect();
            const rawY = e.clientY - rect.top;

            // Inverse Zoom (Apply transform inverse to mouse Y)
            const transformedY = (rawY - transformState.y) / transformState.k;
            const pHover = scales.yScale.invert(transformedY);

            let closest = null;
            let minDiff = Infinity;

            const referenceData = tooltipProfile;

            for (const pt of referenceData) {
                const diff = Math.abs(pt.press - pHover);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = pt;
                }
            }

            if (closest && minDiff < 50) {
                const xTemp =
                    traceVisibility.temp && typeof closest.temp === 'number'
                        ? getSkewX(
                              closest.temp,
                              closest.press,
                              scales.xScale,
                              scales.yScale,
                              scales.tanAlpha,
                              scales.baseY,
                          )
                        : null;
                const xDwpt =
                    traceVisibility.dwpt && typeof closest.dwpt === 'number'
                        ? getSkewX(
                              closest.dwpt,
                              closest.press,
                              scales.xScale,
                              scales.yScale,
                              scales.tanAlpha,
                              scales.baseY,
                          )
                        : null;
                const xWetb =
                    traceVisibility.wetb && typeof closest.wetb === 'number'
                        ? getSkewX(
                              closest.wetb,
                              closest.press,
                              scales.xScale,
                              scales.yScale,
                              scales.tanAlpha,
                              scales.baseY,
                          )
                        : null;
                setHoverInfo({
                    data: closest,
                    y: scales.yScale(closest.press),
                    xT: xTemp,
                    xTd: xDwpt,
                    xTw: xWetb,
                    screenX: e.clientX,
                    screenY: e.clientY,
                });
            } else {
                setHoverInfo(null);
            }
        },
        [computedMeanProfile, traceVisibility, scales, transformState],
    );

    const transformString = `translate(${transformState.x || 0},${transformState.y || 0}) scale(${transformState.k || 1})`;

    return (
        <div ref={containerRef} className={className} style={sx}>
            {dimensions.width > 0 && scales.yScale && (
                <>
                    <svg width={dimensions.width} height={dimensions.height}>
                        {/* Clip Path for the chart area */}
                        <defs>
                            <clipPath id="skewt-chart-area">
                                <rect x={0} y={0} width={scales.innerW} height={scales.innerH} />
                            </clipPath>
                            <clipPath id="skewt-barb-area">
                                <rect
                                    x={0}
                                    y={0}
                                    width={scales.innerW + settings.margin.right}
                                    height={scales.innerH}
                                />
                            </clipPath>
                        </defs>
                        <g transform={`translate(${scales.offsetX}, ${scales.offsetY})`}>
                            {/* ZOOMABLE GROUP */}
                            <rect
                                ref={zoomRefCallback}
                                x={0}
                                y={0}
                                width={scales.innerW + settings.margin.right} // Covers chart & barbs
                                height={scales.innerH}
                                fill="transparent"
                                stroke="none"
                                onMouseMove={handleMouseMove}
                                onMouseLeave={() => setHoverInfo(null)}
                                style={{ touchAction: 'none', cursor: 'move' }}
                            />
                            <SkewTBackground
                                dimensions={{ width: scales.innerW, height: scales.innerH }}
                                scales={scales}
                                config={settings}
                                transformString={transformString}
                                transformState={transformState}
                            />
                            <g clipPath="url(#skewt-chart-area)" pointerEvents="none">
                                <g transform={transformString}>
                                    {/* Parcel Trace */}
                                    {parcelTraceData && (
                                        <path
                                            d={lineGens.parcel(parcelTraceData)}
                                            fill="none"
                                            stroke={settings.colors.parcel}
                                            strokeWidth={2}
                                            strokeDasharray="6,4"
                                            opacity={0.8}
                                        />
                                    )}
                                    {/* Background Ensemble Member Profiles */}
                                    {resolvedDisplayMode === 'plumes' &&
                                        memberProfiles.map((member, i) => (
                                            <React.Fragment key={`member-${member[0]?.mem || i}`}>
                                                {activeTraceKeys.map((key) => (
                                                    <path
                                                        key={`member-${member[0]?.mem || i}-${key}`}
                                                        d={lineGens[key](member)}
                                                        fill="none"
                                                        stroke={settings.colors[key]}
                                                        strokeWidth={1}
                                                        opacity={0.35}
                                                    />
                                                ))}
                                            </React.Fragment>
                                        ))}

                                    {/* Box-Whisker Mode */}
                                    {resolvedDisplayMode === 'boxwhisker' &&
                                        memberProfiles.length > 0 && (
                                            <SkewTBoxWhisker
                                                memberProfiles={memberProfiles}
                                                scales={scales}
                                                percentiles={resolvedPercentiles}
                                                variableKeys={activeTraceKeys}
                                                visibleVariables={traceVisibility}
                                                colors={settings.colors}
                                            />
                                        )}

                                    {/* Mean Profile */}
                                    {computedMeanProfile &&
                                        resolvedDisplayMode !== 'boxwhisker' && (
                                            <g className="mean-profile-group">
                                                {activeTraceKeys.map((key) => (
                                                    <path
                                                        key={`mean-${key}`}
                                                        d={lineGens[key](computedMeanProfile)}
                                                        fill="none"
                                                        stroke={settings.colors[key]}
                                                        strokeWidth={3}
                                                        opacity={1}
                                                    />
                                                ))}
                                            </g>
                                        )}
                                    {/* Tooltip Highlight Circles */}
                                    {hoverInfo && (
                                        <g pointerEvents="none">
                                            <line
                                                x1={0}
                                                y1={hoverInfo.y}
                                                x2={scales.innerW}
                                                y2={hoverInfo.y}
                                                stroke="white"
                                                strokeWidth={1}
                                                opacity={0.5}
                                            />
                                            {hoverInfo.xT != null && (
                                                <circle
                                                    cx={hoverInfo.xT}
                                                    cy={hoverInfo.y}
                                                    r={4}
                                                    fill={settings.colors.temp}
                                                    stroke="white"
                                                />
                                            )}
                                            {hoverInfo.xTd != null && (
                                                <circle
                                                    cx={hoverInfo.xTd}
                                                    cy={hoverInfo.y}
                                                    r={4}
                                                    fill={settings.colors.dwpt}
                                                    stroke="white"
                                                />
                                            )}
                                            {hoverInfo.xTw != null && (
                                                <circle
                                                    cx={hoverInfo.xTw}
                                                    cy={hoverInfo.y}
                                                    r={4}
                                                    fill={settings.colors.wetb}
                                                    stroke="white"
                                                />
                                            )}
                                        </g>
                                    )}
                                </g>
                            </g>
                            {/* --- Wind Barbs --- */}
                            {/* Drawn OUTSIDE the zoom group so they stay locked horizontally. */}
                            {
                                <g
                                    className="wind-barbs-container"
                                    pointerEvents="none"
                                    clipPath="url(#skewt-barb-area)"
                                >
                                    {/* 1. Ensemble Member Barbs (Background) - hidden in mean mode */}
                                    {resolvedDisplayMode !== 'mean' &&
                                        memberBarbs.map((barbSet, i) => (
                                            <g
                                                key={`member-barbs-${i}`}
                                                opacity={0.35}
                                                strokeWidth={1}
                                            >
                                                {barbSet.map((d, j) => {
                                                    // Manually calculate the exact screen Y coordinate based on the current zoom level
                                                    const zoomedY =
                                                        transformState.k * scales.yScale(d.press) +
                                                        transformState.y;
                                                    return (
                                                        <WindBarb
                                                            key={`m-barb-${i}-${j}`}
                                                            u={d.uwnd}
                                                            v={d.vwnd}
                                                            x={scales.innerW}
                                                            y={zoomedY}
                                                        />
                                                    );
                                                })}
                                            </g>
                                        ))}

                                    {/* Mean Barbs */}
                                    {computedMeanBarbs.length > 0 && (
                                        <g key="mean-barbs" opacity={1} strokeWidth={1.5}>
                                            {computedMeanBarbs.map((d, j) => {
                                                // Manually calculate the exact screen Y coordinate based on the current zoom level
                                                const zoomedY =
                                                    transformState.k * scales.yScale(d.press) +
                                                    transformState.y;
                                                return (
                                                    <WindBarb
                                                        key={`mean-barb-${j}`}
                                                        u={d.uwnd}
                                                        v={d.vwnd}
                                                        x={scales.innerW}
                                                        y={zoomedY}
                                                    />
                                                );
                                            })}
                                        </g>
                                    )}
                                </g>
                            }
                        </g>
                    </svg>

                    {/* HTML Tooltip */}
                    {hoverInfo && (
                        <ChartTooltip
                            x={hoverInfo.screenX}
                            y={hoverInfo.screenY}
                            content={
                                // If the user provided a custom render function, use it.
                                // Otherwise, fall back to the default component.
                                settings.renderTooltip ? (
                                    settings.renderTooltip(hoverInfo.data)
                                ) : (
                                    <SkewTTooltipContent
                                        data={hoverInfo.data}
                                        colors={settings.colors}
                                        traceVisibility={traceVisibility}
                                    />
                                )
                            }
                        />
                    )}
                </>
            )}
        </div>
    );
}
