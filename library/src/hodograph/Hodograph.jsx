import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import useContainerDimensions from '../utilities/useContainerDimensions';
import useZoomHandler from '../utilities/useZoomHandler';
import ChartTooltip from '../utilities/tooltip';
import { computeMeanProfile } from '../skewt/meanProfile';
import HodographBackground from './hodographBackground';
import HodographLegend, { DEFAULT_HODOGRAPH_SEGMENTS } from './HodographLegend';
import { toWindUnit } from '../windUnits';
import styles from './hodograph.module.css';

/*-------------------------------*/
/* --- Hodograph and Helpers --- */
/*-------------------------------*/

const DEFAULT_CONFIG = {
    // Max wind speed for scaling (kts)
    margin: 25,
    maxWind: 80,
    // Display unit for ring labels and readouts; data and maxWind stay in kts
    windUnit: 'kts',
    // Ring settings for background grid (interval/labelInterval in windUnit)
    rings: {
        interval: 10,
        labelInterval: 20,
    },
    // Altitude Segments for Mean Line
    segments: DEFAULT_HODOGRAPH_SEGMENTS,
    // Built-in legend overlay; set to false to hide
    legend: {
        enabled: true,
        position: 'top-left',
        title: 'Mean Wind',
        className: '',
        sx: {},
    },
    // Zoom settings
    zoom: {
        enabled: true,
        min: 1,
        max: 10,
    },
    renderTooltip: null,
};

const LEGEND_POSITION_CLASSES = {
    'top-left': 'legendTopLeft',
    'top-right': 'legendTopRight',
    'bottom-left': 'legendBottomLeft',
    'bottom-right': 'legendBottomRight',
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
function HodographTooltipContent({ data, type, windUnit }) {
    if (!data) return null;
    const fmtSpd = (value) =>
        Number.isFinite(value) ? toWindUnit(value, windUnit).toFixed(0) : '--';

    switch (type) {
        case 'datapoint':
            return (
                <>
                    <div>
                        <strong>Wind Level</strong>
                    </div>
                    <div>Height: {data.hght?.toFixed(0) ?? '--'} m</div>
                    <div>
                        Spd: {fmtSpd(data.twnd)} {windUnit}
                    </div>
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
                    <div>
                        Spd: {fmtSpd(data.mag)} {windUnit}
                    </div>
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
export default function Hodograph({
    soundingParam,
    statsDictParam,
    config = {},
    className = 'hodobox',
    sx = {},
}) {
    // --- Dimensions and Setup ---
    const [containerRef, dimensions] = useContainerDimensions();
    const [hoverInfo, setHoverInfo] = useState(null);

    const settings = useMemo(
        () => ({
            ...DEFAULT_CONFIG,
            ...config,
            rings: {
                ...DEFAULT_CONFIG.rings,
                units: config.windUnit ?? DEFAULT_CONFIG.windUnit,
                ...config.rings,
            },
            zoom: { ...DEFAULT_CONFIG.zoom, ...config.zoom },
            legend:
                typeof config.legend === 'boolean'
                    ? { ...DEFAULT_CONFIG.legend, enabled: config.legend }
                    : { ...DEFAULT_CONFIG.legend, ...config.legend },
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

        // Always compute mean line from member profiles.
        const meanM = computeMeanProfile(soundingParam) || [];
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
        <div
            ref={containerRef}
            className={[styles.root, 'ws-hodograph', className].filter(Boolean).join(' ')}
            style={sx}
        >
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
                                                windUnit={settings.windUnit}
                                            />
                                        )}

                                        {/* Ensemble Member Lines */}
                                        <g>
                                            {allMembers.map((memberData, i) => (
                                                <path
                                                    key={i}
                                                    d={lineGenerator(memberData)}
                                                    className={styles.lineMember}
                                                    onMouseOver={(e) =>
                                                        handleMouseOver(e, memberData, 'member')
                                                    }
                                                    onMouseOut={() => setHoverInfo(null)}
                                                />
                                            ))}
                                        </g>

                                        {/* Mean Line Segments */}
                                        <g>
                                            {segments.map((seg, i) => (
                                                <path
                                                    key={i}
                                                    d={lineGenerator(seg.points)}
                                                    stroke={seg.color}
                                                    className={styles.lineMean}
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
                                                    className={styles.dataPoint}
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
                                                        className={styles.bunkers}
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

                    {settings.legend.enabled && (
                        <HodographLegend
                            segments={settings.segments}
                            title={settings.legend.title}
                            className={[
                                styles.legendOverlay,
                                styles[LEGEND_POSITION_CLASSES[settings.legend.position]] ??
                                    styles.legendTopLeft,
                                settings.legend.className,
                            ]
                                .filter(Boolean)
                                .join(' ')}
                            sx={settings.legend.sx}
                        />
                    )}

                    {/* Tooltip */}
                    {hoverInfo && (
                        <ChartTooltip
                            x={hoverInfo.x || hoverInfo.screenX}
                            y={hoverInfo.y || hoverInfo.screenY}
                            content={
                                settings.renderTooltip ? (
                                    settings.renderTooltip(hoverInfo.data, hoverInfo.type, {
                                        windUnit: settings.windUnit,
                                    })
                                ) : (
                                    <HodographTooltipContent
                                        data={hoverInfo.data}
                                        type={hoverInfo.type}
                                        windUnit={settings.windUnit}
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
