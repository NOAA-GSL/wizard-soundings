// import '../dist/desi-soundings.css';
import 'desi-soundings/draw.scss';
import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import * as d3 from 'd3';

/*--------------------------------*/
/* --- StatsTable and Helpers --- */
/*--------------------------------*/

// --- Helper: Safe Number Formatting ---
const fmt = (val, decimals = 0) => {
    if (!Number.isFinite(val)) return '-';
    return val.toFixed(decimals);
};

// --- Helper: Safe Vector Formatting ---
const fmtVec = (vec) => {
    if (!vec || vec.drx === null || vec.mag === null) return '-/-';
    return `${vec.drx.toFixed(0)}/${vec.mag.toFixed(0)}`;
};

// --- Configuration: Thermo Grid --
// This defines the structure: 4 rows, 5 columns
const THERMO_GRID = [
    [
        // Row 1
        { id: 'pw', label: 'PW =', prec: 2 },
        { id: 'kIndex', label: 'K =', prec: 0 },
        { id: 'wndg', label: 'WNDG =', prec: 1 },
        { id: 'meanMR', label: 'MeanW =', prec: 1 },
        { id: 'tTotals', label: 'TT =', prec: 0 },
    ],
    [
        // Row 2
        { id: 'tei', label: 'TEI =', prec: 0 },
        { id: 'lowRH', label: 'lowRH =', prec: 0 },
        { id: 'midRH', label: 'midRH =', prec: 0 },
        { id: 'cTemp', label: 'convT =', prec: 0 },
        { id: 'mlcape3', label: '3CAPE =', prec: 0 },
    ],
    [
        // Row 3
        { id: 'maxT', label: 'maxT =', prec: 0 },
        { id: 'mburst', label: 'MBURST =', prec: 1 },
        { id: 'dcape', label: 'dCAPE =', prec: 0 },
        { id: 'esp', label: 'ESP =', prec: 2 },
        { id: 'downT', label: 'downT =', prec: 1 },
    ],
    [
        // Row 4 (with tooltips)
        { id: 'mmp', label: 'MMP =', prec: 2 },
        { id: 'sigsvr', label: 'SigSvr =', prec: 0 },
        {
            id: 'momentumTransferMag',
            label: 'Mean MT =',
            prec: 1,
            // Custom getter for nested value
            getValue: (s) => s.momentumTransferVector?.mag,
            tooltip: {
                title: 'Mean MT',
                body: 'Calculated via Cook and Williams method, using mean wind vector through depth of PBL.',
            },
        },
        {
            id: 'momentumTransferMagMax',
            label: 'Max MT =',
            prec: 1,
            getValue: (s) => s.momentumTransferVectorMax?.mag,
            tooltip: {
                title: 'Max MT',
                body: 'Calculated by taking the max wind within the PBL and bringing it to the surface.',
            },
        },
        {
            id: 'pblDepth',
            label: 'PBL Top =',
            prec: 1,
            tooltip: {
                title: 'PBL Depth',
                body: 'Defined as the first level at which Tv >= 0.5 + Tv,sfc.',
            },
        },
    ],
];

// --- Configuration: Parcel Table ---
const PARCEL_ROWS = [
    { label: 'SFC', prefix: 'sfc' },
    { label: 'ML', prefix: 'ml' },
    { label: 'MU', prefix: 'mu' },
];
const PARCEL_COLS = ['CAPE', 'CINH', 'LCL', 'LI', 'LFC', 'EL'];

// --- Configuration: Wind Table ---
const WIND_COLS = [
    {
        header: 'SRH',
        keyProp: 'srh', // Matches the property in WIND_ROWS objects
        formatter: (val) => fmt(val, 0),
        isInteractive: true,
    },
    {
        header: 'Shear',
        keyProp: 'shear',
        formatter: (val) => fmt(val, 0),
        isInteractive: true,
    },
    {
        header: 'MnWind',
        keyProp: 'mw',
        formatter: fmtVec, // Uses the vector formatter
        isInteractive: false, // Adds 'noClick' class
    },
    {
        header: 'SRW',
        keyProp: 'srw',
        formatter: fmtVec,
        isInteractive: false,
    },
];

const WIND_ROWS = [
    {
        label: 'SFC-1km',
        srh: 'right_srh1km',
        shear: 'sfc1kmshr',
        mw: 'mw1Vector',
        srw: 'srw1Vector',
    },
    {
        label: 'SFC-3km',
        srh: 'right_srh3km',
        shear: 'sfc3kmshr',
        mw: 'mw3Vector',
        srw: 'srw3Vector',
    },
    {
        label: 'Eff Inflow',
        srh: 'right_srheff',
        shear: 'effshr',
        mw: 'effwVector',
        srw: 'srweffVector',
    },
    {
        label: 'SFC-6km',
        srh: 'right_srh6km',
        shear: 'sfc6kmshr',
        mw: 'mw6Vector',
        srw: 'srw6Vector',
    },
    {
        label: 'SFC-8km',
        srh: 'right_srh1km',
        shear: 'sfc8kmshr',
        mw: 'mw8Vector',
        srw: 'srw8Vector',
    },
    {
        label: 'LCL-EL',
        srh: 'right_srhlclel',
        shear: 'ellclshr',
        mw: 'ellclwVector',
        srw: 'srwellclVector',
    },
    {
        label: 'Eff Shear',
        srh: 'right_srhebwd',
        shear: 'ebwdshr',
        mw: 'ebwdVector',
        srw: 'srwebwdVector',
    },
];

// --- Configuration: Extra Wind Stats ---

const EXTRA_WIND_ROWS = [
    {
        label: 'BRN Shear =',
        id: 'brnShear',
        formatter: (val) => fmt(val, 0),
        isInteractive: true,
    },
    {
        label: '4-6 km SR Wind =',
        getValue: (s) => s.srw46Vector, // Custom getter for vectors
        formatter: fmtVec,
        isInteractive: false,
    },
    {
        label: 'Bunkers Right =',
        getValue: (s) => s.rstVector,
        formatter: fmtVec,
        isInteractive: false,
    },
    {
        label: 'Bunkers Left =',
        getValue: (s) => s.lstVector,
        formatter: fmtVec,
        isInteractive: false,
    },
    {
        label: 'Corfidi Upshear =',
        getValue: (s) => s.upVector,
        formatter: fmtVec,
        isInteractive: false,
    },
    {
        label: 'Corfidi Downshear =',
        getValue: (s) => s.dnVector,
        formatter: fmtVec,
        isInteractive: false,
    },
];

/* Component: StatCell
   A reusable table cell that can handle clicks and tooltips.
*/

function StatCell({
    label,
    value,
    statKey, // The key used for statClick
    tooltip, // Object: { title: string, body: string }
    className, // e.g., "noClick"
    handlers, // { onStatClick, onMouseOver, onMouseOut }
}) {
    const { onStatClick, onShowTooltip, onHideTooltip } = handlers;

    // Determine if this cell is interactive
    const isInteractive = !!statKey && !className?.includes('noClick');

    // Handle Tooltip Hover (reusable JSX)
    const handleActive = (e) => {
        if (!tooltip) return;
        const content = (
            <div style={{ maxWidth: '200px' }}>
                <strong>{tooltip.title}</strong>
                <br />
                {tooltip.body}
            </div>
        );
        onShowTooltip(e, content);
    };

    // Handle Click
    const handleClick = (e) => {
        if (isInteractive && onStatClick) {
            onStatClick(statKey, e);
        }
    };

    // Handle Keyboard Enter/Space
    const handleKeyDown = (e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleClick(e);
        }
    };

    return (
        <td
            className={className}
            onClick={handleClick}
            onMouseOver={tooltip ? handleActive : undefined}
            onMouseOut={onHideTooltip}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            style={isInteractive ? { cursor: 'pointer' } : undefined}
            onKeyDown={isInteractive ? handleKeyDown : undefined}
            onFocus={isInteractive && tooltip ? handleActive : undefined}
            onBlur={isInteractive && tooltip ? onHideTooltip : undefined}
        >
            {label} {value}
        </td>
    );
}

/* Component: StatsTable
   Renders the meteorological statistics table with parcels, thermo, and wind stats.
*/

export function StatsTable({ statsDictParam }) {
    const stats = statsDictParam;
    const [hoverInfo, setHoverInfo] = useState(null);

    const handleMouseOver = (e, content) => {
        setHoverInfo({
            x: e.clientX + 10,
            y: e.clientY - 15,
            content,
        });
    };

    const handleMouseOut = () => setHoverInfo(null);
    const statClick = (key, event) => {
        console.log('Clicked', key);
    }; // Placeholder

    // Group handlers to pass down easily
    const handlers = {
        onStatClick: statClick,
        onShowTooltip: handleMouseOver,
        onHideTooltip: handleMouseOut,
    };

    if (!stats) return null;

    return (
        <div id="statsContainer">
            <div id="meteostats" className="meteostats">
                {/* --- Left Column: Parcels & Thermo --- */}
                <div className="statscolumn">
                    {/* 1. Parcel Stats */}
                    <table id="parcelstats">
                        <tbody>
                            <tr>
                                <th>PCL</th>
                                {PARCEL_COLS.map((col) => (
                                    <th key={col}>{col}</th>
                                ))}
                            </tr>
                            {PARCEL_ROWS.map((row) => (
                                <tr key={row.prefix}>
                                    <th>{row.label}</th>
                                    {PARCEL_COLS.map((col) => {
                                        const key = `${row.prefix}${col}`;
                                        const prec = col === 'LI' ? 1 : 0;
                                        return (
                                            <StatCell
                                                key={key}
                                                statKey={key}
                                                value={fmt(stats[key], prec)}
                                                handlers={handlers}
                                            />
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* 2. Thermo Stats (Refactored to Grid) */}
                    <table id="thermostats">
                        <tbody>
                            {THERMO_GRID.map((row, rIndex) => (
                                <tr key={rIndex}>
                                    {row.map((cell) => {
                                        // Determine the value: use custom getter or standard key lookup
                                        const rawVal = cell.getValue
                                            ? cell.getValue(stats)
                                            : stats[cell.id];

                                        return (
                                            <StatCell
                                                key={cell.id}
                                                statKey={cell.id}
                                                label={cell.label}
                                                value={fmt(rawVal, cell.prec)}
                                                tooltip={cell.tooltip}
                                                handlers={handlers}
                                            />
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- Right Column: Wind Stats --- */}
                <div className="statscolumn">
                    <table id="windstats">
                        <tbody>
                            <tr>
                                <th>Layer</th>
                                {WIND_COLS.map((col) => (
                                    <th key={col.header}>{col.header}</th>
                                ))}
                            </tr>
                            {WIND_ROWS.map((row) => (
                                <tr key={row.label}>
                                    <th>{row.label}</th>
                                    {WIND_COLS.map((col) => {
                                        const dataKey = row[col.keyProp]; // e.g., 'right_srh1km'
                                        const rawValue = stats[dataKey];

                                        return (
                                            <StatCell
                                                key={col.header}
                                                statKey={col.isInteractive ? dataKey : undefined}
                                                value={col.formatter(rawValue)}
                                                className={
                                                    !col.isInteractive ? 'noClick' : undefined
                                                }
                                                handlers={handlers}
                                            />
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Extra Wind Vectors */}
                <div className="statscolumn">
                    <table id="morewindstats">
                        <tbody>
                            {EXTRA_WIND_ROWS.map((row, i) => {
                                const rawVal = row.getValue ? row.getValue(stats) : stats[row.id];

                                return (
                                    <tr key={i}>
                                        <StatCell
                                            label={row.label}
                                            statKey={row.isInteractive ? row.id : undefined}
                                            value={row.formatter(rawVal)}
                                            className={!row.isInteractive ? 'noClick' : undefined}
                                            handlers={handlers}
                                        />
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- Shared Tooltip Renderer --- */}
            {hoverInfo && (
                <div
                    className="hodo-tooltip"
                    style={{
                        position: 'fixed',
                        left: hoverInfo.x,
                        top: hoverInfo.y,
                        zIndex: 9999,
                        pointerEvents: 'none',
                    }}
                >
                    {hoverInfo.content}
                </div>
            )}
        </div>
    );
}

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

export function Hodograph({ soundingParam, statsDictParam }) {
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
        <div
            ref={setContainerNode}
            className="hodobox"
            style={{ position: 'relative', width: '100%', height: '100%' }}
        >
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
