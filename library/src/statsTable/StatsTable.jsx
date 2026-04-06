import { useState } from 'react';
import ChartTooltip from '../utilities/tooltip';
import './statstable.css';

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
    isSelected,
    handlers, // { onStatClick, onMouseOver, onMouseOut }
}) {
    const { onStatClick, onShowTooltip, onHideTooltip } = handlers;

    // Determine if this cell is interactive
    const isInteractive = !!statKey && !className?.includes('noClick');

    let finalClass = className || '';
    if (isSelected) finalClass += ' selected-stat';

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
            className={finalClass.trim()}
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

export default function StatsTable({
    statsDictParam,
    selectedStat: externalStat,
    onStatSelect,
    styles = {},
}) {
    // --- Dimensions and Setup ---
    const [hoverInfo, setHoverInfo] = useState(null);

    const [internalStat, setInternalStat] = useState(null);
    const isControlled = externalStat !== undefined;
    const activeStat = isControlled ? externalStat : internalStat;

    const stats = statsDictParam;

    const statClick = (key, event) => {
        if (!key) return;

        // If a parent wants to know about the click, tell them
        if (onStatSelect) {
            onStatSelect(key, event);
        }

        // If we are uncontrolled, manage our own highlighting
        if (!isControlled) {
            setInternalStat(key);
        }
    };

    // Mouse handlers for showing/hiding tooltips
    const handleMouseOver = (e, content) => {
        setHoverInfo({
            x: e.clientX + 10,
            y: e.clientY - 15,
            content,
        });
    };

    const handleMouseOut = () => setHoverInfo(null);

    // Group handlers to pass down easily
    const handlers = {
        onStatClick: statClick,
        onShowTooltip: handleMouseOver,
        onHideTooltip: handleMouseOut,
    };

    if (!stats) return null;

    return (
        <div id="statsContainer" style={styles}>
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
                                                isSelected={activeStat === key}
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
                                                isSelected={activeStat === cell.id}
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
                                                isSelected={activeStat === dataKey}
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
                                            isSelected={activeStat === row.id}
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
                <ChartTooltip
                    x={hoverInfo.x}
                    y={hoverInfo.y}
                    content={hoverInfo.content}
                    positionType="fixed"
                />
            )}
        </div>
    );
}
