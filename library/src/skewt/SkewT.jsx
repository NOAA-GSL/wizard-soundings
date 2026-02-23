import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';
//import PropTypes from 'prop-types';
import sharp from '../Sharp';
import useContainerDimensions from '../utilities/useContainerDimensions';
import useZoomHandler from '../utilities/useZoomHandler';
import ChartTooltip from '../utilities/tooltip';
import SkewTBackground from './skewtBackground';
import WindBarb from './windBarb';
import './skewt.css';

/*-------------------------*/
/* --- SkewT & Helpers --- */
/*-------------------------*/

const DEFAULT_CONFIG = {
    // Canvas settings
    margin: { top: 20, right: 40, bottom: 20, left: 30 },
    // Pressure bounds (hPa)
    baseP: 1050,
    topP: 100,
    // Temperature bounds (C)
    minT: -40,
    maxT: 50,
    // Skew Angle (deg)
    skewAngle: 55,
    // Grid settings
    isobars: [1000, 850, 700, 500, 300, 200, 100],
    isotherms: { min: -100, max: 50, interval: 10 },
    dryAdiabats: { min: -30, max: 170, interval: 20 }, // Potential Temp (C)
    moistAdiabats: { min: -20, max: 40, interval: 5 }, // Start Temp at 1000mb
    mixingRatio: [2, 4, 8, 14, 20, 26], // g/kg
    // Colors
    colors: {
        isobar: 'rgba(255, 255, 255, 0.2)',
        isotherm: 'rgba(255, 255, 255, 0.2)',
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
};

/*--------------------------------*/
/* --- Sub-Components ----------- */
/*--------------------------------*/

function getSkewX(temp, press, xScale, yScale, tanAlpha, baseY) {
    return xScale(temp) + (baseY - yScale(press)) / tanAlpha;
}

/**
 * Extracts and formats parcel trace data from the stats object.
 * Supports 'sfc' (Surface), 'ml' (Mixed Layer), 'mu' (Most Unstable).
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

function SkewTTooltipContent({ data, colors }) {
    return (
        <>
            <div>
                <strong>{data.press.toFixed(0)} hPa</strong>
            </div>
            <div style={{ color: colors.temp }}>T: {data.temp?.toFixed(1) ?? '--'} °C</div>
            <div style={{ color: colors.dwpt }}>Td: {data.dwpt?.toFixed(1) ?? '--'} °C</div>
            {data.uwnd != null && (
                <div>Wind: {Math.round(Math.sqrt(data.uwnd ** 2 + data.vwnd ** 2))} kts</div>
            )}
        </>
    );
}

/* Component: SkewT
    Renders an interactive skew-t with sounding data.
*/

export default function SkewT({ soundingParam, statsDictParam, config = {}, style = {} }) {
    // --- Dimensions and Setup ---
    const [containerRef, dimensions] = useContainerDimensions();
    const [hoverInfo, setHoverInfo] = useState(null);

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

        // const { w, h } = dims;
        const { margin, baseP, topP, minT, maxT, skewAngle } = settings;
        const innerW = dimensions.width - margin.left - margin.right;
        const innerH = dimensions.height - margin.top - margin.bottom;

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
            scales: { xScale, yScale, tanAlpha, baseY, innerW, innerH },
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
            if (!soundingParam || !scales.yScale) return;

            // 1. Get raw mouse coordinates relative to the SVG using currentTarget!
            const rect = e.currentTarget.getBoundingClientRect();
            const rawY = e.clientY - rect.top;

            // 2. Adjust for Margin
            const yInGroup = rawY - settings.margin.top;

            // 3. Inverse Zoom (Apply transform inverse to mouse Y)
            const transformedY = (yInGroup - transformState.y) / transformState.k;

            // 4. Invert scale to get Pressure
            const pHover = scales.yScale.invert(transformedY);

            let closest = null;
            let minDiff = Infinity;
            for (const d of soundingParam) {
                const referenceData = Array.isArray(soundingParam[0])
                    ? soundingParam[0]
                    : soundingParam;

                for (const pt of referenceData) {
                    const diff = Math.abs(pt.press - pHover);
                    if (diff < minDiff) {
                        minDiff = diff;
                        closest = pt;
                    }
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
        [soundingParam, scales, settings.margin, transformState],
    );

    const transformString = `translate(${transformState.x},${transformState.y}) scale(${transformState.k})`;
    return (
        <div ref={containerRef} className="skewt-container">
            {dimensions.width > 0 && scales.yScale && (
                <>
                    <svg
                        ref={zoomRefCallback}
                        width={dimensions.width}
                        height={dimensions.height}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoverInfo(null)}
                    >
                        {/* Clip Path for the chart area */}
                        <defs>
                            <clipPath id="skewt-chart-area">
                                <rect
                                    x={0}
                                    y={0}
                                    width={scales.innerW + settings.margin.right}
                                    height={scales.innerH}
                                />
                            </clipPath>
                        </defs>
                        <g transform={`translate(${settings.margin.left}, ${settings.margin.top})`}>
                            {/* ZOOMABLE GROUP */}
                            <g transform={transformString} clipPath="url(#skewt-chart-area)">
                                <SkewTBackground
                                    dimensions={{ width: scales.innerW, height: scales.innerH }}
                                    scales={scales}
                                    config={settings}
                                />

                                {/* 2. Parcel Trace */}
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

                                {
                                    <>
                                        {/* 3. Background Ensemble Member Profiles */}
                                        {memberProfiles.map((member, i) => (
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

                                        {/* 4. Mean Profile (Drawn on top) */}
                                        {meanProfile && (
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
                                    </>
                                }

                                {/* 5. Tooltip Highlight Circles */}
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
                            <g className="wind-barbs-container">
                                {/* 1. Ensemble Member Barbs (Background) */}
                                {memberBarbs.map((barbSet, i) => (
                                    <g key={`member-barbs-${i}`} opacity={0.35} strokeWidth={1}>
                                        {barbSet.map((d, j) => (
                                            <WindBarb
                                                key={`m-barb-${i}-${j}`}
                                                u={d.uwnd}
                                                v={d.vwnd}
                                                x={scales.innerW + 25}
                                                y={
                                                    transformState.y +
                                                    scales.yScale(d.press) * transformState.k
                                                }
                                            />
                                        ))}
                                    </g>
                                ))}

                                {/* 2. Mean Barbs (Foreground) */}
                                {meanBarbs.length > 0 && (
                                    <g key="mean-barbs" opacity={1} strokeWidth={1.5}>
                                        {meanBarbs.map((d, j) => (
                                            <WindBarb
                                                key={`mean-barb-${j}`}
                                                u={d.uwnd}
                                                v={d.vwnd}
                                                x={scales.innerW + 25}
                                                y={
                                                    transformState.y +
                                                    scales.yScale(d.press) * transformState.k
                                                }
                                            />
                                        ))}
                                    </g>
                                )}
                            </g>
                        }
                    </svg>

                    {/* HTML Tooltip */}
                    {hoverInfo && (
                        <ChartTooltip
                            x={hoverInfo.screenX}
                            y={hoverInfo.screenY}
                            content={
                                <SkewTTooltipContent
                                    data={hoverInfo.data}
                                    colors={settings.colors}
                                />
                            }
                        />
                    )}
                </>
            )}
        </div>
    );
}

// SkewT.propTypes = {
//     // Accepts either row-based (Array of objects) or column-based (Object of arrays)
//     soundingParam: PropTypes.oneOfType([
//         PropTypes.arrayOf(PropTypes.object),
//         PropTypes.shape({
//             pres: PropTypes.arrayOf(PropTypes.number),
//             tmpc: PropTypes.arrayOf(PropTypes.number),
//             dwpc: PropTypes.arrayOf(PropTypes.number),
//             uwnd: PropTypes.arrayOf(PropTypes.number),
//             vwnd: PropTypes.arrayOf(PropTypes.number)
//         })
//     ]),
//     parcelTraceData: PropTypes.arrayOf(PropTypes.shape({
//         press: PropTypes.number,
//         temp: PropTypes.number
//     })),
//     config: PropTypes.object,
//     style: PropTypes.object
// };
