import { useMemo, useState } from 'react';
import * as d3 from 'd3';
import useContainerDimensions from '../utilities/useContainerDimensions';
import useZoomHandler from '../utilities/useZoomHandler';
import ChartTooltip from '../utilities/tooltip';
import HodographBackground from './hodographBackground';
import './hodograph.css';

/*-------------------------------*/
/* --- Hodograph and Helpers --- */
/*-------------------------------*/

// --- Configuration: ---
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
            soundingParam?.filter((d) => d?.length > 0 && d[0]?.mem === 'grandensemble')?.[0] || [];
        const segs = getColoredSegments(meanM, settings.segments);

        const points = segs.map((s) => s.points[0]);

        return {
            segments: segs,
            majorPoints: points,
            allMembers: soundingParam,
        };
    }, [soundingParam, settings.segments]);

    // --- Tooltip Helper ---
    const handleMouseOver = (e, content) => {
        setHoverInfo({
            x: e.clientX + 10,
            y: e.clientY - 15,
            content,
        });
    };

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    const transformString = `translate(${transformState.x},${transformState.y}) scale(${transformState.k})`;

    return (
        <div ref={containerRef} className="hodobox" style={styles}>
            {/* Only render SVG if we have dimensions */}
            {dimensions.width > 0 && (
                <>
                    <svg
                        ref={zoomRefCallback}
                        width={dimensions.width}
                        height={dimensions.height}
                        style={{ cursor: 'move', display: 'block' }}
                    >
                        <rect
                            width={dimensions.width}
                            height={dimensions.height}
                            fill="transparent"
                        />
                        <g transform={transformString} style={{ pointerEvents: 'none' }}>
                            <g transform={`translate(${centerX}, ${centerY})`}>
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
                                                handleMouseOver(
                                                    e,
                                                    <div>Member: {memberData[0]?.mem}</div>,
                                                )
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
                                    const angleRad = (d.wdir + 180) * (Math.PI / 180);
                                    const r = rScale(d.twnd);
                                    const cx = r * Math.sin(angleRad);
                                    const cy = -r * Math.cos(angleRad);

                                    return (
                                        <circle
                                            key={i}
                                            cx={cx}
                                            cy={cy}
                                            r={3 / transformState.k} // Adjust radius based on zoom
                                            className="hodo-datapoint"
                                            onMouseOver={(e) =>
                                                handleMouseOver(
                                                    e,
                                                    <div>
                                                        Height: {d.hght.toFixed(0)}
                                                        <br />
                                                        Spd: {d.twnd.toFixed(0)}
                                                        <br />
                                                        Dir: {d.wdir.toFixed(0)}
                                                    </div>,
                                                )
                                            }
                                            onMouseOut={() => setHoverInfo(null)}
                                        />
                                    );
                                })}

                                {/* Bunkers Storm Motion (Crosses) */}
                                {statsDictParam &&
                                    [statsDictParam.rstVector, statsDictParam.lstVector].map(
                                        (vec, i) => {
                                            if (!vec) return null;
                                            const angleRad = (vec.drx + 180) * (Math.PI / 180);
                                            const r = rScale(vec.mag);
                                            const x = r * Math.sin(angleRad);
                                            const y = -r * Math.cos(angleRad);

                                            return (
                                                <path
                                                    key={`bunker-${i}`}
                                                    d={symbolGenerator()}
                                                    transform={`translate(${x}, ${y}) scale(${1 / transformState.k})`} // Scale symbol inverse to zoom
                                                    className="hodo-bunkers"
                                                    onMouseOver={(e) =>
                                                        handleMouseOver(
                                                            e,
                                                            <div>
                                                                <b>
                                                                    Bunkers{' '}
                                                                    {i === 0 ? 'Right' : 'Left'}
                                                                </b>
                                                                <br />
                                                                Spd: {vec.mag.toFixed(0)}
                                                                <br />
                                                                Dir: {vec.drx.toFixed(0)}
                                                            </div>,
                                                        )
                                                    }
                                                    onMouseOut={() => setHoverInfo(null)}
                                                />
                                            );
                                        },
                                    )}
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
                                    style={{
                                        backgroundColor: item.color,
                                    }}
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
                            content={hoverInfo.content}
                        />
                    )}
                </>
            )}
        </div>
    );
}
