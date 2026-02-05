import 'desi-soundings/hodograph.css';
import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';

/*--------------------------------*/
/* --- Hodograph and Helpers --- */
/*--------------------------------*/

// --- Configuration: Altitude Segments for Mean Line ---
const SEGMENT_CONFIG = [
    { maxHeight: 1000, color: 'red' },
    { maxHeight: 3000, color: 'orange' },
    { maxHeight: 6000, color: 'purple' },
    { maxHeight: Infinity, color: 'blue' },
];

const LEGEND_DATA = [
    { label: '0-1 km', color: 'red' },
    { label: '1-3 km', color: 'orange' },
    { label: '3-6 km', color: 'purple' },
    { label: '>6 km', color: 'blue' },
];

const MAX_WIND = 80; // Max wind speed for scaling

// Helper to split the mean line into colored altitude segments
function getColoredSegments(meanMemberData) {
    if (!meanMemberData || meanMemberData.length === 0) return [];

    const segments = [];
    let minHeight = -Infinity;
    let lastPoint = null;

    SEGMENT_CONFIG.forEach((config) => {
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

const BackgroundGrid = React.memo(({ rScale }) => (
    <g className="grid">
        {d3.range(10, MAX_WIND + 1, 10).map((tick) => (
            <circle key={tick} cx={0} cy={0} r={rScale(tick)} className="hodorings" />
        ))}
        {d3.range(10, MAX_WIND + 1, 20).map((tick) => (
            <text key={`label-${tick}`} x={0} y={rScale(tick)} dy="0.4em" className="hodolabels">
                {tick}kts
            </text>
        ))}
    </g>
));

/* Component: Hodograph
    Renders an interactive hodograph with wind data.
*/

export default function Hodograph({ soundingParam, statsDictParam, styles = {} }) {
    // --- Dimensions and Setup ---
    const [containerNode, setContainerNode] = useState(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0, innerW: 0, innerH: 0 });
    const [transformState, setTransformState] = useState({ k: 1, x: 0, y: 0 });
    const transformRef = useRef({ k: 1, x: 0, y: 0 });
    const [hoverInfo, setHoverInfo] = useState(null);

    // --- ResizeObserver: update size on container changes ---
    useEffect(() => {
        if (!containerNode) return () => {};
        const margin = 25;

        const updateSize = () => {
            const { clientWidth, clientHeight } = containerNode;
            setDimensions({
                width: clientWidth,
                height: clientHeight,
                innerW: Math.max(0, clientWidth - margin * 2),
                innerH: Math.max(0, clientHeight - margin * 2),
            });
        };

        // initial measurement
        updateSize();

        // Observe size changes
        const supportsResizeObserver = typeof ResizeObserver !== 'undefined';
        let ro;

        if (supportsResizeObserver) {
            ro = new ResizeObserver(() => updateSize());
            ro.observe(containerNode);
        } else {
            window.addEventListener('resize', updateSize);
        }

        return () => {
            if (supportsResizeObserver) {
                if (ro) ro.disconnect();
            } else {
                window.removeEventListener('resize', updateSize);
            }
        };
    }, [containerNode]);

    // --- D3 Scales & Generators ---
    const { rScale, lineGenerator, symbolGenerator } = useMemo(() => {
        if (dimensions.width === 0) return {};

        const minDim = Math.min(dimensions.innerW, dimensions.innerH);
        const radius = minDim / 2;

        // Scale
        const scale = d3.scaleLinear().domain([0, MAX_WIND]).range([0, radius]);

        // Line Generator
        const lineGen = d3
            .lineRadial()
            .radius((d) => scale(d.twnd))
            .angle((d) => (d.wdir + 180) * (Math.PI / 180));

        // Symbol Generator (Cross)
        const symbolGen = d3.symbol().type(d3.symbolCross).size(30);

        return { rScale: scale, lineGenerator: lineGen, symbolGenerator: symbolGen };
    }, [dimensions]);

    // --- Zoom Logic ---
    const zoomRefCallback = useCallback(
        (node) => {
            if (!node || dimensions.width === 0) return;
            const zoom = d3
                .zoom()
                .scaleExtent([1, 10])
                .translateExtent([
                    [0, 0],
                    [dimensions.width, dimensions.height],
                ])
                .on('zoom', (event) => {
                    const t = event.transform;
                    setTransformState({ k: t.k, x: t.x, y: t.y });
                    transformRef.current = { k: t.k, x: t.x, y: t.y };
                });

            const selection = d3.select(node);
            selection.on('.zoom', null); // Clear previous zoom handlers
            selection.call(zoom);
            // Restore previous transform so re-renders don't reset view
            const { k, x, y } = transformRef.current;
            if (k !== 1 || x !== 0 || y !== 0) {
                selection.call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(k));
            }
        },
        [dimensions],
    );

    // --- Data Preparation ---
    const { segments, majorPoints, allMembers } = useMemo(() => {
        if (!soundingParam) return { segments: [], majorPoints: [], allMembers: [] };

        // Flatten logic
        const meanM =
            soundingParam?.filter((d) => d?.length > 0 && d[0]?.mem === 'grandensemble')?.[0] || [];
        const segs = getColoredSegments(meanM);

        const points = segs.map((s) => s.points[0]);

        return {
            segments: segs,
            majorPoints: points,
            allMembers: soundingParam,
        };
    }, [soundingParam]);

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
        <div ref={setContainerNode} className="hodobox" style={styles}>
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
                                {rScale && <BackgroundGrid rScale={rScale} />}

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
                        {LEGEND_DATA.map((item, i) => (
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
                        <div
                            className="hodo-tooltip"
                            style={{
                                left: hoverInfo.x,
                                top: hoverInfo.y,
                            }}
                        >
                            {hoverInfo.content}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
