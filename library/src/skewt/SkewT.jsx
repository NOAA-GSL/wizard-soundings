import React, { useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
import useContainerDimensions from '../utilities/useContainerDimensions';
import useZoomHandler from '../utilities/useZoomHandler';
import ChartTooltip from '../utilities/ToolTip';
import sharp from '../Sharp';
import { math } from '../Utilities';
import SkewTBackground from './skewtBackground';
import SkewTBoxWhisker from './skewtBoxWhisker';
import WindBarb from './windBarb';
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
        wetbulb: '#00ffff',
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

/*--------------------------------*/
/* --- Sub-Components ----------- */
/*--------------------------------*/

function getSkewX(temp, press, xScale, yScale, tanAlpha, baseY) {
    return xScale(temp) + (baseY - yScale(press)) / tanAlpha;
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
function SkewTTooltipContent({ data, colors }) {
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
            <div style={{ color: colors.temp }}>T: {data.temp?.toFixed(1) ?? '--'} &deg;C</div>
            <div style={{ color: colors.dwpt }}>Td: {data.dwpt?.toFixed(1) ?? '--'} &deg;C</div>
            <div>
                Wind: {data.wdir?.toFixed(0) ?? '--'}&deg; @ {data.twnd?.toFixed(0) ?? '--'} kts
            </div>
            {rh != null && <div>RH: {rh.toFixed(0)}%</div>}
            {data.parcelTemp != null && (
                <div style={{ color: colors.parcel }}>
                    Parcel T: {data.parcelTemp.toFixed(1)} &deg;C
                </div>
            )}
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
    const resolvedDisplayMode = displayMode || config.displayMode || 'plumes';
    const resolvedPercentiles = percentiles || config.percentiles || [5, 25, 75, 95];

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
                wetbulb: makeLine('wetb'),
                parcel: makeLine('temp', 'press'),
            },
        };
    }, [dimensions, settings]);

    // Zoom Logic
    const [zoomRefCallback, transformState] = useZoomHandler(dimensions, settings.zoom);

    // --- Data Preparation ---
    const { meanProfile, memberProfiles, meanBarbs, memberBarbs } = useMemo(() => {
        if (!soundingParam || soundingParam.length === 0) {
            return { meanProfile: null, memberProfiles: [], meanBarbs: [], memberBarbs: [] };
        }

        // 1. Separate Profiles
        const mean = soundingParam.find(
            (profile) => profile[0]?.mem === 'grandensemble' || profile[0]?.mem === 'mean',
        );
        const members = soundingParam.filter((profile) => profile !== mean);

        // 2. Prepare Wind Barb Data (50hPa intervals)
        const filterBarbs = (profile) =>
            profile.filter(
                (d) =>
                    (Math.round(d.press) % 50 === 0 || Math.round(d.press) === 1000) &&
                    d.uwnd != null &&
                    d.vwnd != null &&
                    d.press >= settings.topP &&
                    d.press <= settings.baseP,
            );

        return {
            meanProfile: mean,
            memberProfiles: members,
            meanBarbs: mean ? filterBarbs(mean) : [],
            memberBarbs: members.map((m) => filterBarbs(m)),
        };
    }, [soundingParam, settings.topP, settings.baseP]);

    // Tooltip Logic
    const handleMouseMove = useCallback(
        (e) => {
            if (!meanProfile || !scales.yScale) return;

            // Get raw mouse coordinates relative to the SVG using currentTarget
            const rect = e.currentTarget.getBoundingClientRect();
            const rawY = e.clientY - rect.top;

            // Inverse Zoom (Apply transform inverse to mouse Y)
            const transformedY = (rawY - transformState.y) / transformState.k;
            const pHover = scales.yScale.invert(transformedY);

            let closest = null;
            let minDiff = Infinity;

            const referenceData = meanProfile;

            for (const pt of referenceData) {
                const diff = Math.abs(pt.press - pHover);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = pt;
                }
            }

            if (closest && minDiff < 50) {
                setHoverInfo({
                    data: closest,
                    y: scales.yScale(closest.press),
                    xT: getSkewX(
                        closest.temp,
                        closest.press,
                        scales.xScale,
                        scales.yScale,
                        scales.tanAlpha,
                        scales.baseY,
                    ),
                    xTd: getSkewX(
                        closest.dwpt,
                        closest.press,
                        scales.xScale,
                        scales.yScale,
                        scales.tanAlpha,
                        scales.baseY,
                    ),
                    screenX: e.clientX,
                    screenY: e.clientY,
                });
            } else {
                setHoverInfo(null);
            }
        },
        [meanProfile, scales, transformState],
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
                                                {/* Member Dewpoint */}
                                                <path
                                                    d={lineGens.dwpt(member)}
                                                    fill="none"
                                                    stroke={settings.colors.dwpt}
                                                    strokeWidth={1}
                                                    opacity={0.35}
                                                />
                                                {/* Member Temperature */}
                                                <path
                                                    d={lineGens.temp(member)}
                                                    fill="none"
                                                    stroke={settings.colors.temp}
                                                    strokeWidth={1}
                                                    opacity={0.35}
                                                />
                                            </React.Fragment>
                                        ))}

                                    {/* Box-Whisker Mode */}
                                    {resolvedDisplayMode === 'boxwhisker' &&
                                        memberProfiles.length > 0 && (
                                            <SkewTBoxWhisker
                                                memberProfiles={memberProfiles}
                                                scales={scales}
                                                percentiles={resolvedPercentiles}
                                                colors={settings.colors}
                                            />
                                        )}

                                    {/* Mean Profile (Drawn on top, hidden in boxwhisker mode) */}
                                    {meanProfile && resolvedDisplayMode !== 'boxwhisker' && (
                                        <g className="mean-profile-group">
                                            {/* Mean Wetbulb */}
                                            {meanProfile[0]?.wetb != null && (
                                                <path
                                                    d={lineGens.wetbulb(meanProfile)}
                                                    fill="none"
                                                    stroke={settings.colors.wetbulb}
                                                    strokeWidth={2}
                                                    opacity={0.9}
                                                />
                                            )}
                                            {/* Mean Dewpoint */}
                                            <path
                                                d={lineGens.dwpt(meanProfile)}
                                                fill="none"
                                                stroke={settings.colors.dwpt}
                                                strokeWidth={3}
                                                opacity={1}
                                            />
                                            {/* Mean Temperature */}
                                            <path
                                                d={lineGens.temp(meanProfile)}
                                                fill="none"
                                                stroke={settings.colors.temp}
                                                strokeWidth={3}
                                                opacity={1}
                                            />
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
                                            <circle
                                                cx={hoverInfo.xT}
                                                cy={hoverInfo.y}
                                                r={4}
                                                fill={settings.colors.temp}
                                                stroke="white"
                                            />
                                            <circle
                                                cx={hoverInfo.xTd}
                                                cy={hoverInfo.y}
                                                r={4}
                                                fill={settings.colors.dwpt}
                                                stroke="white"
                                            />
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
                                    {/* 1. Ensemble Member Barbs (Background) */}
                                    {memberBarbs.map((barbSet, i) => (
                                        <g key={`member-barbs-${i}`} opacity={0.35} strokeWidth={1}>
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

                                    {/* 2. Mean Barbs (Foreground) */}
                                    {meanBarbs.length > 0 && (
                                        <g key="mean-barbs" opacity={1} strokeWidth={1.5}>
                                            {meanBarbs.map((d, j) => {
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
