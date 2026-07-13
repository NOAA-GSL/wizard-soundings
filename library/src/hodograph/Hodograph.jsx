import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import useContainerDimensions from '../utilities/useContainerDimensions';
import useZoomHandler from '../utilities/useZoomHandler';
import ChartTooltip from '../utilities/tooltip';
import HodographBackground from './hodographBackground';
import './hodograph.css';

/*-------------------------------*/
/* --- Hodograph and Helpers --- */
/*-------------------------------*/

const DEFAULT_CONFIG = {
    // Max wind speed for scaling
    margin: 25,
    maxWind: 80,
    // Ring settings for background grid
    rings: {
        interval: 10,
        labelInterval: 20,
        units: 'kts',
    },
    // Altitude Segments for Mean Line
    segments: [
        { maxHeight: 1000, color: 'red', label: '0-1 km' },
        { maxHeight: 3000, color: 'orange', label: '1-3 km' },
        { maxHeight: 6000, color: 'purple', label: '3-6 km' },
        { maxHeight: Infinity, color: 'blue', label: '>6 km' },
    ],
    // Zoom settings
    zoom: {
        enabled: true,
        min: 1,
        max: 10,
    },
    renderTooltip: null,
};

// Helper to split the mean line into colored altitude segments
function getColoredSegments(meanMemberData, segmentConfig) {
    if (!meanMemberData || meanMemberData.length === 0) return [];

    const segments = [];
    let minHeight = -Infinity;
    let lastPoint = null;

    segmentConfig.forEach((config) => {
        const currentSegment = meanMemberData.filter(
            (d) => d.hght >= minHeight && d.hght < config.maxHeight,
        );

        if (lastPoint && currentSegment.length > 0) {
            currentSegment.unshift(lastPoint);
        }

        if (currentSegment.length > 0) {
            segments.push({ points: currentSegment, color: config.color });
            lastPoint = currentSegment[currentSegment.length - 1];
        }
        minHeight = config.maxHeight;
    });

    return segments;
}

// Helper: Convert meteorological polar coordinates (wind) to Cartesian (X/Y)
function getCartesianCoords(wdir, twnd, rScale) {
    const angleRad = (wdir + 180) * (Math.PI / 180);
    const r = rScale(twnd);
    return {
        x: r * Math.sin(angleRad),
        y: -r * Math.cos(angleRad),
    };
}

// Renders default tooltip content for the Hodograph based on data type.
function HodographTooltipContent({ data, type }) {
    if (!data) return null;

    switch (type) {
        case 'datapoint':
            return (
                <>
                    <div>Height: {data.hght?.toFixed(0) ?? '--'} m</div>
                    <div>Spd: {data.twnd?.toFixed(0) ?? '--'} kts</div>
                    <div>Dir: {data.wdir?.toFixed(0) ?? '--'}°</div>
                </>
            );
        case 'member': {
            const memberId = Array.isArray(data) ? data[0]?.mem : data.mem;
            return <div>Member: {memberId || 'Unknown'}</div>;
        }
        case 'bunkers-right':
        case 'bunkers-left': {
            const title = type === 'bunkers-right' ? 'Bunkers Right' : 'Bunkers Left';
            return (
                <>
                    <div>
                        <b>{title}</b>
                    </div>
                    <div>Spd: {data.mag?.toFixed(0) ?? '--'} kts</div>
                    <div>Dir: {data.drx?.toFixed(0) ?? '--'}°</div>
                </>
            );
        }
        default:
            return <div>Unknown Data</div>;
    }
}

/* Component: Hodograph
    Renders an interactive hodograph with wind data.
*/
export default function Hodograph({ soundingParam, statsDictParam, config = {}, styles = {} }) {
    // --- Dimensions and Setup ---
    const [containerRef, dimensions] = useContainerDimensions();
    const [hoverInfo, setHoverInfo] = useState(null);

    const settings = useMemo(
        () => ({
            ...DEFAULT_CONFIG,
            ...config,
            rings: { ...DEFAULT_CONFIG.rings, ...config.rings },
            zoom: { ...DEFAULT_CONFIG.zoom, ...config.zoom },
        }),
        [config],
    );

    const innerW = Math.max(0, dimensions.width);
    const innerH = Math.max(0, dimensions.height);
    const minDim = Math.min(innerW, innerH);
    const xOffset = (innerW - minDim) / 2;
    const yOffset = (innerH - minDim) / 2;

    // --- D3 Scales & Generators ---
    const { rScale, lineGenerator, symbolGenerator } = useMemo(() => {
        if (dimensions.width === 0) return {};

        const innerW = dimensions.width - settings.margin * 2;
        const innerH = dimensions.height - settings.margin * 2;
        const minDim = Math.min(innerW, innerH);
        const radius = minDim / 2;

        // Scale
        const scale = d3.scaleLinear().domain([0, settings.maxWind]).range([0, radius]);

        // Line Generator
        const lineGen = d3
            .lineRadial()
            .radius((d) => scale(d.twnd))
            .angle((d) => (d.wdir + 180) * (Math.PI / 180));

        // Symbol Generator (Cross)
        const symbolGen = d3.symbol().type(d3.symbolCross).size(30);

        return { rScale: scale, lineGenerator: lineGen, symbolGenerator: symbolGen };
    }, [dimensions, settings.margin, settings.maxWind]);

    // --- Zoom Logic ---
    const [zoomRefCallback, transformState] = useZoomHandler(dimensions, settings.zoom);

    // --- Data Preparation ---
    const { segments, majorPoints, allMembers } = useMemo(() => {
        if (!soundingParam) return { segments: [], majorPoints: [], allMembers: [] };

        // Flatten logic
        const meanM =
            soundingParam?.find((d) => d?.length > 0 && d[0]?.mem === 'grandensemble') || [];
        const segs = getColoredSegments(meanM, settings.segments);
        const points = segs.map((s) => s.points[0]);

        return {
            segments: segs,
            majorPoints: points,
            allMembers: soundingParam,
        };
    }, [soundingParam, settings.segments]);

    // --- Tooltip Helper ---
    const handleMouseOver = (e, data, type) => {
        setHoverInfo({
            x: e.clientX + 10,
            y: e.clientY - 15,
            data,
            type,
        });
    };

    const transformString = `translate(${transformState.x || 0},${transformState.y || 0}) scale(${transformState.k || 1})`;

    return (
        <div ref={containerRef} className="hodobox" style={styles}>
            {dimensions.width > 0 && (
                <>
                    <svg
                        width={dimensions.width}
                        height={dimensions.height}
                        style={{ display: 'block' }}
                    >
                        <defs>
                            {/* Clip Path for the chart area */}
                            <clipPath id="hodo-chart-area">
                                <rect x={xOffset} y={yOffset} width={minDim} height={minDim} />
                            </clipPath>
                        </defs>
                        <g ref={zoomRefCallback} style={{ cursor: 'move' }}>
                            {/* ZOOMABLE GROUP */}
                            <rect
                                x={xOffset}
                                y={yOffset}
                                width={minDim}
                                height={minDim}
                                fill="transparent"
                                stroke="black"
                                style={{ touchAction: 'none' }}
                            />
                            <g clipPath="url(#hodo-chart-area)" style={{ pointerEvents: 'none' }}>
                                <g transform={transformString}>
                                    <g transform={`translate(${innerW / 2}, ${innerH / 2})`}>
                                        {rScale && (
                                            <HodographBackground
                                                rScale={rScale}
                                                maxWind={settings.maxWind}
                                                ringConfig={settings.rings}
                                            />
                                        )}

                                        {/* Ensemble Member Lines */}
                                        <g className="member-lines-group">
                                            {allMembers.map((memberData, i) => (
                                                <path
                                                    key={i}
                                                    d={lineGenerator(memberData)}
                                                    className="hodoline member"
                                                    onMouseOver={(e) =>
                                                        handleMouseOver(e, memberData, 'member')
                                                    }
                                                    onMouseOut={() => setHoverInfo(null)}
                                                />
                                            ))}
                                        </g>

                                        {/* Mean Line Segments */}
                                        <g className="mean-line-group">
                                            {segments.map((seg, i) => (
                                                <path
                                                    key={i}
                                                    d={lineGenerator(seg.points)}
                                                    stroke={seg.color}
                                                    className="hodoline mean"
                                                />
                                            ))}
                                        </g>

                                        {/* Major Data Points (Circles) */}
                                        {majorPoints.map((d, i) => {
                                            const { x, y } = getCartesianCoords(
                                                d.wdir,
                                                d.twnd,
                                                rScale,
                                            );
                                            return (
                                                <circle
                                                    key={`point-${i}`}
                                                    cx={x}
                                                    cy={y}
                                                    r={3 / transformState.k} // Adjust radius based on zoom
                                                    className="hodo-datapoint"
                                                    onMouseOver={(e) =>
                                                        handleMouseOver(e, d, 'datapoint')
                                                    }
                                                    onMouseOut={() => setHoverInfo(null)}
                                                />
                                            );
                                        })}

                                        {/* Bunkers Storm Motion (Crosses) */}
                                        {statsDictParam &&
                                            [
                                                statsDictParam.rstVector,
                                                statsDictParam.lstVector,
                                            ].map((vec, i) => {
                                                if (!vec) return null;
                                                const { x, y } = getCartesianCoords(
                                                    vec.drx,
                                                    vec.mag,
                                                    rScale,
                                                );

                                                return (
                                                    <path
                                                        key={`bunker-${i}`}
                                                        d={symbolGenerator()}
                                                        transform={`translate(${x}, ${y}) scale(${1 / transformState.k})`}
                                                        className="hodo-bunkers"
                                                        onMouseOver={(e) =>
                                                            handleMouseOver(
                                                                e,
                                                                vec,
                                                                i === 0
                                                                    ? 'bunkers-right'
                                                                    : 'bunkers-left',
                                                            )
                                                        }
                                                        onMouseOut={() => setHoverInfo(null)}
                                                    />
                                                );
                                            })}
                                    </g>
                                </g>
                            </g>
                        </g>
                    </svg>

                    {/* Legend */}
                    <div className="hodo-legend">
                        <strong style={{ display: 'block', marginBottom: '4px' }}>Mean Wind</strong>
                        {settings.segments.map((item, i) => (
                            <div className="hodo-legend-item" key={i}>
                                {/* The Color Box */}
                                <span
                                    className="hodo-legend-colorbox"
                                    style={{ backgroundColor: item.color }}
                                />
                                <span>{item.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Tooltip */}
                    {hoverInfo && (
                        <ChartTooltip
                            x={hoverInfo.x || hoverInfo.screenX}
                            y={hoverInfo.y || hoverInfo.screenY}
                            content={
                                settings.renderTooltip ? (
                                    settings.renderTooltip(hoverInfo.data, hoverInfo.type)
                                ) : (
                                    <HodographTooltipContent
                                        data={hoverInfo.data}
                                        type={hoverInfo.type}
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
