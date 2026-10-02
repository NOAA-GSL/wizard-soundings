import { StrictMode, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import {
    createSounding,
    combineRh,
    DEFAULT_RH_ICE_THRESHOLD,
    toTemperatureUnit,
    toWindUnit,
    WIND_UNITS,
} from '@noaa-gsl/wizard-soundings';
import { SkewT, TallGraph, Hodograph, StatsTable, BoxPlot } from '@noaa-gsl/wizard-soundings';
import data from './soundingData.json';
import '@noaa-gsl/wizard-soundings/styles.css';
import './style.css';

// Data contains the sample data.
// Use createSounding to create the Sounding object for handling / manipulating sounding data

const DATES = data.metadata?.gh_isobaric?.availableDates ?? [];

// Shared display-mode labels so every chart uses the same terminology.
const MODE_LABELS = {
    mean: 'Mean Line',
    meanBars: 'Mean Bars',
    plumes: 'Plumes',
    boxwhisker: 'Box-Whisker Lines',
    boxwhiskerBars: 'Box-Whisker Bars',
};

const DISPLAY_MODE_OPTIONS = ['mean', 'plumes', 'boxwhisker'].map((value) => ({
    value,
    label: MODE_LABELS[value],
}));

const TALL_GRAPH_MODE_OPTIONS = ['meanBars', 'mean', 'plumes', 'boxwhiskerBars', 'boxwhisker'].map(
    (value) => ({ value, label: MODE_LABELS[value] }),
);

const TALL_GRAPH_ROWS = [
    { key: 'rh', label: 'RH' },
    { key: 'omega', label: 'Omega' },
];

// Level fields the TallGraph RH row can plot.
const RH_VARIABLE_OPTIONS = [
    { value: 'rh', label: 'RH' },
    { value: 'rhIce', label: 'RH (ice)' },
    { value: 'rhCombo', label: 'RH + RH (ice)' },
];

// Leaves room under the Skew-T plot for the TallGraph's two stacked x axes.
const SKEWT_MARGIN = { top: 20, right: 40, bottom: 76, left: 60 };

// RH color schemes for the TallGraph bar modes (Mean Bars, Box-Whisker Bars).
const COLORBAR_PRESETS = {
    none: {
        label: 'Trace Color',
        stops: null,
    },
    standard: {
        label: 'Green to Purple (Classic)',
        stops: [
            { value: 0, color: 'rgba(255, 255, 255, 0.5)' },
            { value: 70, color: 'rgba(20, 83, 45, 1)' },
            { value: 90, color: 'rgba(0, 255, 0, 1)' },
            { value: 95, color: 'rgba(147, 51, 234, 1)' },
        ],
    },
    cyanBlue: {
        label: 'Cyan to Deep Blue',
        stops: [
            { value: 0, color: 'rgba(255, 255, 255, 0.5)' },
            { value: 70, color: 'rgba(165, 243, 252, 1)' },
            { value: 90, color: 'rgba(2, 132, 199, 1)' },
            { value: 95, color: 'rgba(30, 58, 138, 1)' },
        ],
    },
    spectral: {
        label: 'Spectral (Multi-stop)',
        stops: [
            { value: 0, color: 'rgba(255, 255, 255, 0.5)' },
            { value: 70, color: 'rgba(254, 240, 138, 1)' },
            { value: 80, color: 'rgba(34, 197, 94, 1)' },
            { value: 90, color: 'rgba(6, 182, 212, 1)' },
            { value: 95, color: 'rgba(126, 34, 206, 1)' },
        ],
    },
    grayscale: {
        label: 'Grayscale',
        stops: [
            { value: 0, color: 'rgba(209, 213, 219, 1)' },
            { value: 70, color: 'rgba(209, 213, 219, 1)' },
            { value: 80, color: 'rgba(100, 100, 100, 1)' },
            { value: 90, color: 'rgba(50, 50, 50, 1)' },
            { value: 95, color: 'rgba(17, 24, 39, 1)' },
        ],
    },
};

const LINE_STYLE_OPTIONS = [
    { value: 'solid', label: 'Solid' },
    { value: 'dash', label: 'Dash' },
    { value: 'dot', label: 'Dot' },
    { value: 'dashDot', label: 'Dash-dot' },
];

const PARCEL_TYPE_OPTIONS = [
    { value: 'none', label: 'None' },
    { value: 'sfc', label: 'SFC' },
    { value: 'mu', label: 'MU' },
    { value: 'ml', label: 'ML' },
];

const THERMO_TRACE_ROWS = [
    { key: 'temp', label: 'Temperature' },
    { key: 'dwpt', label: 'Dew Point' },
    { key: 'wetb', label: 'Wet Bulb' },
    { key: 'vtmp', label: 'Virtual Temp' },
];

const PARCEL_TRACE_ROWS = [
    { key: 'parcel', label: 'Parcel Trace' },
    { key: 'parcelVirtual', label: 'Virtual Parcel' },
];

const MT_STAT_OPTIONS = [
    { value: 'mean', label: 'Mean' },
    { value: '50%', label: '50th' },
    { value: '90%', label: '90th' },
    { value: '100%', label: 'Max' },
];

const STAT_LABELS = {
    sfcCAPE: 'SFC CAPE',
    sfcCINH: 'SFC CINH',
    sfcLCL: 'SFC LCL',
    sfcLI: 'SFC LI',
    sfcLFC: 'SFC LFC',
    sfcEL: 'SFC EL',
    mlCAPE: 'ML CAPE',
    mlCINH: 'ML CINH',
    mlLCL: 'ML LCL',
    mlLI: 'ML LI',
    mlLFC: 'ML LFC',
    mlEL: 'ML EL',
    muCAPE: 'MU CAPE',
    muCINH: 'MU CINH',
    muLCL: 'MU LCL',
    muLI: 'MU LI',
    muLFC: 'MU LFC',
    muEL: 'MU EL',
    pw: 'Precipitable Water (PW)',
    kIndex: 'K Index',
    wndg: 'WNDG',
    meanMR: 'Mean Mixing Ratio',
    tTotals: 'Total Totals',
    tei: 'TEI',
    lowRH: 'Low-level RH',
    midRH: 'Mid-level RH',
    cTemp: 'Convective Temperature',
    mlcape3: 'ML 0-3 km CAPE',
    maxT: 'Maximum Temperature',
    mburst: 'Microburst',
    dcape: 'DCAPE',
    esp: 'ESP',
    mmp: 'MMP',
    sigsvr: 'Significant Severe',
    momentumTransferMag: 'Mean Momentum Transfer',
    momentumTransferMagMax: 'Max Momentum Transfer',
    pblDepth: 'PBL Top',
    right_srh1km: 'SFC-1 km SRH',
    right_srh3km: 'SFC-3 km SRH',
    right_srheff: 'Effective Inflow SRH',
    right_srh6km: 'SFC-6 km SRH',
    right_srh8km: 'SFC-8 km SRH',
    right_srhlclel: 'LCL-EL SRH',
    right_srhebwd: 'Effective Shear Layer SRH',
    sfc1kmshr: 'SFC-1 km Shear',
    sfc3kmshr: 'SFC-3 km Shear',
    effshr: 'Effective Inflow Shear',
    sfc6kmshr: 'SFC-6 km Shear',
    sfc8kmshr: 'SFC-8 km Shear',
    ellclshr: 'LCL-EL Shear',
    ebwdshr: 'Effective Shear',
    brnShear: 'BRN Shear',
};

function formatTime(timestamp) {
    const d = new Date(timestamp);
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
    });
}

function ordinalSuffixOf(i) {
    const j = i % 10;
    const k = i % 100;
    if (j === 1 && k !== 11) {
        return `${i}st`;
    }
    if (j === 2 && k !== 12) {
        return `${i}nd`;
    }
    if (j === 3 && k !== 13) {
        return `${i}rd`;
    }
    return `${i}th`;
}

// --- Tooltip Override Configurations ---
// Defining these outside the component prevents them from being recreated on every render.

// Converts meters to feet
const mToFt = (meters) => meters * 3.28084;

// --- Tooltip Override Configurations ---

// 1. Skew-T Render Prop Demo (Expanded Readout)
const skewTTooltipOverride = (data, { temperatureUnit = 'C', windUnit = 'kts' } = {}) => {
    // Defensive check
    if (!data) return null;

    // Derived Calculations
    const hghtMslFt = data.hght != null ? mToFt(data.hght) : null;
    const hghtAglFt = data.hghtagl != null ? mToFt(data.hghtagl) : null;
    const fmtT = (value) => toTemperatureUnit(value, temperatureUnit)?.toFixed(1) ?? '--';

    // A reusable row style to keep the JSX clean
    const rowStyle = { display: 'flex', justifyContent: 'space-between', marginBottom: '2px' };

    return (
        <div
            style={{
                border: '2px solid #ff7043',
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: 'rgba(20,20,20,0.95)',
                minWidth: '180px',
            }}
        >
            <div
                style={{
                    color: '#ff7043',
                    fontWeight: 'bold',
                    borderBottom: '1px solid #555',
                    marginBottom: '6px',
                    paddingBottom: '4px',
                }}
            >
                Profile Readout
            </div>

            {/* Thermodynamics */}
            <div style={rowStyle}>
                <span style={{ color: '#aaa', marginRight: '16px' }}>Pressure:</span>
                <strong>{data.press?.toFixed(0) ?? '--'} hPa</strong>
            </div>
            <div style={rowStyle}>
                <span style={{ color: '#aaa' }}>Temp:</span>
                <strong style={{ color: '#ff5252' }}>
                    {fmtT(data.temp)} &deg;{temperatureUnit}
                </strong>
            </div>
            <div style={rowStyle}>
                <span style={{ color: '#aaa' }}>Dewpt:</span>
                <strong style={{ color: '#69f0ae' }}>
                    {fmtT(data.dwpt)} &deg;{temperatureUnit}
                </strong>
            </div>
            {data.rh != null && (
                <div style={rowStyle}>
                    <span style={{ color: '#aaa' }}>RH:</span>
                    <strong>{data.rh.toFixed(0)}%</strong>
                </div>
            )}

            {/* Kinematics */}
            <div style={rowStyle}>
                <span style={{ color: '#aaa' }}>Wind:</span>
                <strong>
                    {data.wdir?.toFixed(0) ?? '--'}&deg; @{' '}
                    {toWindUnit(data.twnd, windUnit)?.toFixed(0) ?? '--'} {windUnit}
                </strong>
            </div>

            <div style={{ borderTop: '1px solid #444', margin: '8px 0' }}></div>

            {/* Heights */}
            <div style={rowStyle}>
                <span style={{ color: '#aaa' }}>Hght (MSL):</span>
                <strong>
                    {data.hght?.toFixed(0) ?? '--'}m / {hghtMslFt?.toFixed(0) ?? '--'}ft
                </strong>
            </div>
            <div style={rowStyle}>
                <span style={{ color: '#aaa' }}>Hght (AGL):</span>
                <strong>
                    {data.hghtagl?.toFixed(0) ?? '--'}m / {hghtAglFt?.toFixed(0) ?? '--'}ft
                </strong>
            </div>
        </div>
    );
};

// 2. Hodograph Render Prop Demo (Custom JSX based on data type)
const hodoTooltipOverride = (data, type, { windUnit = 'kts' } = {}) => {
    // Defensive check
    if (!data) return null;

    // Reusable styling objects to keep the JSX clean
    const containerStyle = {
        border: '2px solid #64b5f6',
        padding: '8px',
        borderRadius: '4px',
        backgroundColor: 'rgba(20,20,20,0.95)',
        minWidth: '120px',
    };

    const headerStyle = {
        color: '#64b5f6',
        fontWeight: 'bold',
        borderBottom: '1px solid #555',
        marginBottom: '6px',
        paddingBottom: '4px',
    };

    // Row layout for labels and values
    const rowStyle = { display: 'flex', justifyContent: 'space-between' };

    switch (type) {
        case 'datapoint':
            return (
                <div style={containerStyle}>
                    <div style={headerStyle}>Wind Level</div>
                    <div style={rowStyle}>
                        <span style={{ color: '#aaa', marginRight: '12px' }}>Alt:</span>
                        <strong>{data.hght?.toFixed(0) ?? '--'} m</strong>
                    </div>
                    <div style={rowStyle}>
                        <span style={{ color: '#aaa' }}>Spd:</span>
                        <strong>
                            {toWindUnit(data.twnd, windUnit)?.toFixed(0) ?? '--'} {windUnit}
                        </strong>
                    </div>
                    <div style={rowStyle}>
                        <span style={{ color: '#aaa' }}>Dir:</span>
                        <strong>{data.wdir?.toFixed(0) ?? '--'}&deg;</strong>
                    </div>
                </div>
            );

        case 'member': {
            // Safely grab the member ID whether data is an array or an object
            const memberId = Array.isArray(data) ? data[0]?.mem : data.mem;

            return (
                <div style={{ ...containerStyle, borderColor: '#aed581' }}>
                    <div
                        style={{
                            ...headerStyle,
                            color: '#aed581',
                            borderBottom: 'none',
                            marginBottom: 0,
                            paddingBottom: 0,
                        }}
                    >
                        Member: {memberId || 'Unknown'}
                    </div>
                </div>
            );
        }

        case 'bunkers-right':
        case 'bunkers-left': {
            const title = type === 'bunkers-right' ? 'Bunkers Right' : 'Bunkers Left';

            return (
                <div style={{ ...containerStyle, borderColor: '#ef5350' }}>
                    <div style={{ ...headerStyle, color: '#ef5350' }}>{title}</div>
                    <div style={rowStyle}>
                        <span style={{ color: '#aaa', marginRight: '12px' }}>Spd:</span>
                        <strong>
                            {toWindUnit(data.mag, windUnit)?.toFixed(0) ?? '--'} {windUnit}
                        </strong>
                    </div>
                    <div style={rowStyle}>
                        <span style={{ color: '#aaa' }}>Dir:</span>
                        <strong>{data.drx?.toFixed(0) ?? '--'}&deg;</strong>
                    </div>
                </div>
            );
        }

        default:
            // Fallback for unexpected types
            return (
                <div
                    style={{
                        ...containerStyle,
                        borderColor: '#999',
                        color: '#ccc',
                        fontStyle: 'italic',
                    }}
                >
                    Unknown Type: {type}
                </div>
            );
    }
};

function App() {
    const [theme, setTheme] = useState('dark');
    const [temperatureUnit, setTemperatureUnit] = useState('C');
    const [windUnit, setWindUnit] = useState('kts');
    const [percentileInput, setPercentileInput] = useState('5, 25, 75, 95');
    const [timeIndex, setTimeIndex] = useState(0);
    const [selectedStat, setSelectedStat] = useState('sfcCAPE');
    const [traceControls, setTraceControls] = useState({
        temp: { enabled: true, mode: 'boxwhisker', lineStyle: 'solid' },
        dwpt: { enabled: true, mode: 'boxwhisker', lineStyle: 'solid' },
        wetb: { enabled: false, mode: 'boxwhisker', lineStyle: 'dash' },
        vtmp: { enabled: false, mode: 'boxwhisker', lineStyle: 'dashDot' },
    });
    const [parcelControls, setParcelControls] = useState({
        parcel: { type: 'sfc', mode: 'mean', lineStyle: 'dot' },
        parcelVirtual: { type: 'none', mode: 'mean', lineStyle: 'dash' },
    });
    const [tallGraphControls, setTallGraphControls] = useState({
        rh: { enabled: true, displayMode: 'meanBars', lineStyle: 'solid' },
        omega: { enabled: true, displayMode: 'mean', lineStyle: 'solid' },
    });
    const [skewTYAxis, setSkewTYAxis] = useState(null);
    const [showPblDepth, setShowPblDepth] = useState(true);
    const [showMomentumTransfer, setShowMomentumTransfer] = useState(true);
    const [momentumTransferStat, setMomentumTransferStat] = useState('mean');
    const [rhColorBarKey, setRhColorBarKey] = useState('standard');
    const [rhVariable, setRhVariable] = useState('rh');
    const [rhIceThreshold, setRhIceThreshold] = useState(DEFAULT_RH_ICE_THRESHOLD);
    const [tallGraphPressureAxis, setTallGraphPressureAxis] = useState({
        showValues: false,
        showLabel: false,
    });

    // Parse percentile input into array of numbers
    const percentiles = useMemo(
        () =>
            percentileInput
                .split(',')
                .map((s) => Number(s.trim()))
                .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 100),
        [percentileInput],
    );

    const sortedPercentiles = [...percentiles].sort((a, b) => a - b);
    const boxPlotPercentiles = {
        whiskers:
            sortedPercentiles.length >= 2
                ? [sortedPercentiles[0], sortedPercentiles[sortedPercentiles.length - 1]]
                : [5, 95],
        boxes:
            sortedPercentiles.length >= 4
                ? [sortedPercentiles[1], sortedPercentiles[sortedPercentiles.length - 2]]
                : [25, 75],
    };

    // Data Fetching - recompute when time changes
    const { soundingData, stats, derivedData } = useMemo(() => {
        const sounding = createSounding();
        const selectedDate = String(DATES[timeIndex]);
        const recordsForDate = data.data?.[selectedDate] ?? [];

        sounding.updateData(recordsForDate);

        return {
            soundingData: sounding.getLevelData(),
            stats: sounding.calcStats(sounding.getMembers(), 'mean'),
            derivedData: sounding.calcStats(sounding.getMembers(), 'list'),
        };
    }, [timeIndex]);

    const traceVisibility = useMemo(
        () =>
            Object.fromEntries(
                Object.entries(traceControls).map(([key, value]) => [key, value.enabled]),
            ),
        [traceControls],
    );

    const displayModes = useMemo(
        () => ({
            ...Object.fromEntries(
                Object.entries(traceControls).map(([key, value]) => [key, value.mode]),
            ),
            parcel: parcelControls.parcel.mode,
            parcelVirtual: parcelControls.parcelVirtual.mode,
        }),
        [parcelControls, traceControls],
    );

    const traceLineStyles = useMemo(
        () => ({
            ...Object.fromEntries(
                Object.entries(traceControls).map(([key, value]) => [key, value.lineStyle]),
            ),
            parcel: parcelControls.parcel.lineStyle,
            parcelVirtual: parcelControls.parcelVirtual.lineStyle,
        }),
        [parcelControls, traceControls],
    );

    const updateTraceControl = (key, field, value) => {
        setTraceControls((current) => ({
            ...current,
            [key]: {
                ...current[key],
                [field]: value,
            },
        }));
    };

    const tallGraphConfig = useMemo(
        () => ({
            percentiles,
            rh: {
                ...tallGraphControls.rh,
                valueKey: rhVariable,
                label: RH_VARIABLE_OPTIONS.find((option) => option.value === rhVariable).label,
                colorBar: COLORBAR_PRESETS[rhColorBarKey].stops,
            },
            omega: { ...tallGraphControls.omega, units: 'm/s' },
            pressureAxis: tallGraphPressureAxis,
        }),
        [tallGraphControls, percentiles, rhColorBarKey, rhVariable, tallGraphPressureAxis],
    );

    const tallGraphSoundingData = useMemo(
        () => combineRh(soundingData, rhIceThreshold),
        [soundingData, rhIceThreshold],
    );

    const updateTallGraphControl = (key, field, value) => {
        setTallGraphControls((current) => ({
            ...current,
            [key]: {
                ...current[key],
                [field]: value,
            },
        }));
    };

    const updateParcelControl = (key, field, value) => {
        setParcelControls((current) => ({
            ...current,
            [key]: {
                ...current[key],
                [field]: value,
            },
        }));
    };

    // --- Tooltip Override Demo ---
    // Toggle this state to see the tooltips change!
    const [useCustomTooltips, setUseCustomTooltips] = useState(false);
    const [showHodoLegend, setShowHodoLegend] = useState(true);

    return (
        <div className="app-layout" data-theme={theme}>
            <header>
                <h1>Welcome to Wizard Soundings!</h1>
                <div className="header-controls">
                    <div className="theme-toggle" role="group" aria-label="Color theme">
                        <button
                            type="button"
                            className={theme === 'light' ? 'active' : ''}
                            onClick={() => setTheme('light')}
                        >
                            Light
                        </button>
                        <button
                            type="button"
                            className={theme === 'dark' ? 'active' : ''}
                            onClick={() => setTheme('dark')}
                        >
                            Dark
                        </button>
                    </div>
                    <div className="theme-toggle" role="group" aria-label="Temperature units">
                        {['C', 'F'].map((unit) => (
                            <button
                                key={unit}
                                type="button"
                                className={temperatureUnit === unit ? 'active' : ''}
                                onClick={() => setTemperatureUnit(unit)}
                            >
                                &deg;{unit}
                            </button>
                        ))}
                    </div>
                    <div className="theme-toggle" role="group" aria-label="Wind units">
                        {WIND_UNITS.map((unit) => (
                            <button
                                key={unit}
                                type="button"
                                className={windUnit === unit ? 'active' : ''}
                                onClick={() => setWindUnit(unit)}
                            >
                                {unit}
                            </button>
                        ))}
                    </div>
                </div>
            </header>
            <main className="main-content">
                <aside className="settings-sidebar">
                    <label>
                        Forecast Time
                        <input
                            type="range"
                            min={0}
                            max={DATES.length - 1}
                            value={timeIndex}
                            onChange={(e) => setTimeIndex(Number(e.target.value))}
                        />
                        <span className="time-label">{formatTime(DATES[timeIndex])}</span>
                    </label>
                    <label>
                        Percentiles (comma-separated)
                        <input
                            type="text"
                            value={percentileInput}
                            onChange={(e) => setPercentileInput(e.target.value)}
                            placeholder="5, 25, 75, 95"
                        />
                    </label>
                    <div className="trace-controls">
                        <div className="trace-controls-title">Skew-T Controls</div>
                        <table className="trace-controls-table">
                            <thead>
                                <tr>
                                    <th>Trace</th>
                                    <th>On / Type</th>
                                    <th>Mode</th>
                                    <th>Line</th>
                                </tr>
                            </thead>
                            <tbody>
                                {THERMO_TRACE_ROWS.map((row) => (
                                    <tr key={row.key}>
                                        <td>{row.label}</td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={traceControls[row.key].enabled}
                                                onChange={(e) =>
                                                    updateTraceControl(
                                                        row.key,
                                                        'enabled',
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                        </td>
                                        <td>
                                            <select
                                                value={traceControls[row.key].mode}
                                                onChange={(e) =>
                                                    updateTraceControl(
                                                        row.key,
                                                        'mode',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                {DISPLAY_MODE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                value={traceControls[row.key].lineStyle}
                                                onChange={(e) =>
                                                    updateTraceControl(
                                                        row.key,
                                                        'lineStyle',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                {LINE_STYLE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {PARCEL_TRACE_ROWS.map((row) => (
                                    <tr key={row.key}>
                                        <td>{row.label}</td>
                                        <td>
                                            <select
                                                value={parcelControls[row.key].type}
                                                onChange={(e) =>
                                                    updateParcelControl(
                                                        row.key,
                                                        'type',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                {PARCEL_TYPE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                value={parcelControls[row.key].mode}
                                                onChange={(e) =>
                                                    updateParcelControl(
                                                        row.key,
                                                        'mode',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                {DISPLAY_MODE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                value={parcelControls[row.key].lineStyle}
                                                onChange={(e) =>
                                                    updateParcelControl(
                                                        row.key,
                                                        'lineStyle',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                {LINE_STYLE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <label className="checkbox-row">
                            PBL Depth
                            <input
                                type="checkbox"
                                checked={showPblDepth}
                                onChange={(e) => setShowPblDepth(e.target.checked)}
                            />
                        </label>
                        <label className="checkbox-row">
                            MT Barbs
                            <input
                                type="checkbox"
                                checked={showMomentumTransfer}
                                onChange={(e) => setShowMomentumTransfer(e.target.checked)}
                            />
                        </label>
                        <label className="checkbox-row">
                            MT Statistic
                            <select
                                value={momentumTransferStat}
                                onChange={(e) => setMomentumTransferStat(e.target.value)}
                            >
                                {MT_STAT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <div className="trace-controls">
                        <div className="trace-controls-title">Tall Graph Controls</div>
                        <table className="trace-controls-table">
                            <thead>
                                <tr>
                                    <th>Trace</th>
                                    <th>On</th>
                                    <th>Mode</th>
                                    <th>Line</th>
                                </tr>
                            </thead>
                            <tbody>
                                {TALL_GRAPH_ROWS.map((row) => (
                                    <tr key={row.key}>
                                        <td>{row.label}</td>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={tallGraphControls[row.key].enabled}
                                                onChange={(e) =>
                                                    updateTallGraphControl(
                                                        row.key,
                                                        'enabled',
                                                        e.target.checked,
                                                    )
                                                }
                                            />
                                        </td>
                                        <td>
                                            <select
                                                value={tallGraphControls[row.key].displayMode}
                                                onChange={(e) =>
                                                    updateTallGraphControl(
                                                        row.key,
                                                        'displayMode',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                {TALL_GRAPH_MODE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <select
                                                value={tallGraphControls[row.key].lineStyle}
                                                onChange={(e) =>
                                                    updateTallGraphControl(
                                                        row.key,
                                                        'lineStyle',
                                                        e.target.value,
                                                    )
                                                }
                                            >
                                                {LINE_STYLE_OPTIONS.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <label className="checkbox-row">
                            Y Values
                            <input
                                type="checkbox"
                                checked={tallGraphPressureAxis.showValues}
                                onChange={(e) =>
                                    setTallGraphPressureAxis((current) => ({
                                        ...current,
                                        showValues: e.target.checked,
                                    }))
                                }
                            />
                        </label>
                        <label className="checkbox-row">
                            Y Axis Label
                            <input
                                type="checkbox"
                                checked={tallGraphPressureAxis.showLabel}
                                onChange={(e) =>
                                    setTallGraphPressureAxis((current) => ({
                                        ...current,
                                        showLabel: e.target.checked,
                                    }))
                                }
                            />
                        </label>
                        <label className="checkbox-row">
                            RH Variable
                            <select
                                value={rhVariable}
                                onChange={(e) => setRhVariable(e.target.value)}
                            >
                                {RH_VARIABLE_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        {rhVariable === 'rhCombo' && (
                            <label>
                                RH (ice) at or below:{' '}
                                {toTemperatureUnit(rhIceThreshold, temperatureUnit).toFixed(0)}
                                &deg;{temperatureUnit}
                                <input
                                    type="range"
                                    min={-40}
                                    max={0}
                                    step={1}
                                    value={rhIceThreshold}
                                    onChange={(e) => setRhIceThreshold(Number(e.target.value))}
                                />
                            </label>
                        )}
                        <label className="checkbox-row">
                            RH Bar Colors
                            <select
                                value={rhColorBarKey}
                                onChange={(e) => setRhColorBarKey(e.target.value)}
                            >
                                {Object.entries(COLORBAR_PRESETS).map(([key, preset]) => (
                                    <option key={key} value={key}>
                                        {preset.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    {percentiles.length >= 2 && (
                        <p className="percentile-info">
                            Whiskers: {percentiles[0]}th &amp; {percentiles[percentiles.length - 1]}
                            th
                            <br />
                            Box:{' '}
                            {percentiles.length >= 4
                                ? `${percentiles[1]}th & ${percentiles[percentiles.length - 2]}th`
                                : 'N/A'}
                            <br />
                            Median: 50th (always included)
                        </p>
                    )}
                    <label className="checkbox-row">
                        Hodograph Legend
                        <input
                            type="checkbox"
                            checked={showHodoLegend}
                            onChange={(e) => setShowHodoLegend(e.target.checked)}
                        />
                    </label>
                    {/* Button to easily enable/disable custom tooltips in the demo UI */}
                    <button
                        className="tooltips-toggle"
                        onClick={() => setUseCustomTooltips(!useCustomTooltips)}
                    >
                        {useCustomTooltips ? 'Disable Custom Tooltips' : 'Enable Custom Tooltips'}
                    </button>
                </aside>

                <section className="display-area">
                    <div className="sounding-dashboard">
                        {/* Top Section: Visualization Grid */}
                        <div className="viz-grid">
                            <div className="viz-item skewt-wrapper">
                                <SkewT
                                    soundingParam={soundingData}
                                    statsDictParam={derivedData}
                                    onYAxisChange={setSkewTYAxis}
                                    config={{
                                        margin: SKEWT_MARGIN,
                                        temperatureUnit,
                                        windUnit,
                                        percentiles,
                                        traceVisibility,
                                        displayModes,
                                        traceLineStyles,
                                        parcelTrace: parcelControls.parcel.type,
                                        virtualParcelTrace: parcelControls.parcelVirtual.type,
                                        pblDepth: { enabled: showPblDepth },
                                        momentumTransfer: {
                                            enabled: showMomentumTransfer,
                                            stat: momentumTransferStat,
                                        },
                                        ...(useCustomTooltips
                                            ? { renderTooltip: skewTTooltipOverride }
                                            : {}),
                                    }}
                                />
                            </div>
                            <div className="viz-item tallgraph-wrapper">
                                <TallGraph
                                    soundingParam={tallGraphSoundingData}
                                    yAxis={skewTYAxis}
                                    config={tallGraphConfig}
                                />
                            </div>
                            <div className="hodo-column">
                                <div className="viz-item hodo-wrapper">
                                    <Hodograph
                                        soundingParam={soundingData}
                                        statsDictParam={stats}
                                        config={{
                                            legend: showHodoLegend,
                                            windUnit,
                                            ...(useCustomTooltips
                                                ? { renderTooltip: hodoTooltipOverride }
                                                : {}),
                                        }}
                                    />
                                </div>
                                <div className="boxplot-wrapper">
                                    <div id="boxwhiskertitle">
                                        <strong aria-live="polite">
                                            {STAT_LABELS[selectedStat] ?? selectedStat}
                                        </strong>
                                        <p>
                                            {`Box Whiskers: ${ordinalSuffixOf(boxPlotPercentiles.whiskers[0])}, ${ordinalSuffixOf(
                                                boxPlotPercentiles.boxes[0],
                                            )}, ${ordinalSuffixOf(boxPlotPercentiles.boxes[1])}, & ${ordinalSuffixOf(
                                                boxPlotPercentiles.whiskers[1],
                                            )}`}
                                        </p>
                                    </div>
                                    <BoxPlot
                                        statsDictParam={derivedData}
                                        curStat={selectedStat}
                                        config={{
                                            height: 72,
                                            margin: { top: 8, right: 40, bottom: 26, left: 30 },
                                            percentiles: boxPlotPercentiles,
                                            temperatureUnit,
                                            windUnit,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Data Table */}
                        <div className="viz-item table-wrapper">
                            <StatsTable
                                statsDictParam={stats}
                                selectedStat={selectedStat}
                                onStatSelect={setSelectedStat}
                                temperatureUnit={temperatureUnit}
                                windUnit={windUnit}
                            />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
