import { StrictMode, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { createSounding } from '@noaa-gsl/wizard-soundings';
import { SkewT, Hodograph, StatsTable, BoxPlot } from '@noaa-gsl/wizard-soundings';
import data from './soundingData.json';
import '@noaa-gsl/wizard-soundings/styles.css';
import './style.css';

// Data contains the sample data.
// Use createSounding to create the Sounding object for handling / manipulating sounding data

const DATES = data.metadata?.gh_isobaric?.availableDates ?? [];

// Pre-defined Colorbar Presets
const COLORBAR_PRESETS = {
    standard: {
        label: 'Green to Purple (Classic)',
        stops: [
            { value: 70, color: '#14532d' },
            { value: 94, color: '#00ff00' },
            { value: 95, color: '#9333ea' },
            { value: 100, color: '#9333ea' },
        ],
    },
    cyanBlue: {
        label: 'Cyan to Deep Blue',
        stops: [
            { value: 70, color: '#a5f3fc' },
            { value: 85, color: '#0284c7' },
            { value: 100, color: '#1e3a8a' },
        ],
    },
    spectral: {
        label: 'Spectral (Multi-stop)',
        stops: [
            { value: 70, color: '#fef08a' },
            { value: 80, color: '#22c55e' },
            { value: 90, color: '#06b6d4' },
            { value: 100, color: '#7e22ce' },
        ],
    },
    grayscale: {
        label: 'Grayscale',
        stops: [
            { value: 70, color: '#d1d5db' },
            { value: 100, color: '#111827' },
        ],
    },
};

const DISPLAY_MODE_OPTIONS = [
    { value: 'plumes', label: 'Plumes' },
    { value: 'boxwhisker', label: 'Box' },
    { value: 'mean', label: 'Mean' },
];

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
const skewTTooltipOverride = (data) => {
    // Defensive check
    if (!data) return null;

    // Derived Calculations
    const hghtMslFt = data.hght != null ? mToFt(data.hght) : null;
    const hghtAglFt = data.hghtagl != null ? mToFt(data.hghtagl) : null;

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
                <strong style={{ color: '#ff5252' }}>{data.temp?.toFixed(1) ?? '--'} &deg;C</strong>
            </div>
            <div style={rowStyle}>
                <span style={{ color: '#aaa' }}>Dewpt:</span>
                <strong style={{ color: '#69f0ae' }}>{data.dwpt?.toFixed(1) ?? '--'} &deg;C</strong>
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
                    {data.wdir?.toFixed(0) ?? '--'}&deg; @ {data.twnd?.toFixed(0) ?? '--'} kts
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
const hodoTooltipOverride = (data, type) => {
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
                        <strong>{data.twnd?.toFixed(0) ?? '--'} kts</strong>
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
                        <strong>{data.mag?.toFixed(0) ?? '--'} kts</strong>
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
        parcel: { type: 'none', mode: 'mean', lineStyle: 'dot' },
        parcelVirtual: { type: 'sfc', mode: 'mean', lineStyle: 'dash' },
    });
    const [rhBarControls, setRhBarControls] = useState({
        enabled: true,
        minRH: 70,
        colorBarKey: 'standard',
        minBarWidth: 2,
        maxBarWidth: 24,
    });

    // Parse percentile input into array of numbers
    const percentiles = percentileInput
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 100);

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

    const rhBarsConfig = useMemo(
        () => ({
            enabled: rhBarControls.enabled,
            minRH: rhBarControls.minRH,
            colorBar:
                COLORBAR_PRESETS[rhBarControls.colorBarKey]?.stops ??
                COLORBAR_PRESETS.standard.stops,
            minBarWidth: rhBarControls.minBarWidth,
            maxBarWidth: rhBarControls.maxBarWidth,
        }),
        [rhBarControls],
    );

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

    return (
        <div className="app-layout" data-theme={theme}>
            <header>
                <h1>Welcome to Wizard Soundings!</h1>
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
                    </div>
                    {/* RH Bar Configuration Section */}
                    <div className="trace-controls">
                        <div className="trace-controls-title">RH Bar Controls</div>
                        <div className="rh-controls-single-row">
                            {/* Toggle Checkbox */}
                            <label className="rh-control-inline">
                                <input
                                    type="checkbox"
                                    checked={rhBarControls.enabled}
                                    onChange={(e) =>
                                        setRhBarControls((prev) => ({
                                            ...prev,
                                            enabled: e.target.checked,
                                        }))
                                    }
                                />
                                <span>Enable</span>
                            </label>

                            {/* Min RH Slider */}
                            <label className="rh-control-inline">
                                <span>Min: {rhBarControls.minRH}%</span>
                                <input
                                    type="range"
                                    min={50}
                                    max={90}
                                    step={5}
                                    value={rhBarControls.minRH}
                                    onChange={(e) =>
                                        setRhBarControls((prev) => ({
                                            ...prev,
                                            minRH: Number(e.target.value),
                                        }))
                                    }
                                />
                            </label>

                            {/* Color Scheme Dropdown */}
                            <label className="rh-control-inline">
                                <span>Scheme:</span>
                                <select
                                    value={rhBarControls.colorBarKey}
                                    onChange={(e) =>
                                        setRhBarControls((prev) => ({
                                            ...prev,
                                            colorBarKey: e.target.value,
                                        }))
                                    }
                                >
                                    {Object.entries(COLORBAR_PRESETS).map(([key, preset]) => (
                                        <option key={key} value={key}>
                                            {preset.label}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>
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
                                    config={{
                                        percentiles,
                                        traceVisibility,
                                        displayModes,
                                        traceLineStyles,
                                        parcelTrace: parcelControls.parcel.type,
                                        virtualParcelTrace: parcelControls.parcelVirtual.type,
                                        rhBars: rhBarsConfig,
                                        ...(useCustomTooltips
                                            ? { renderTooltip: skewTTooltipOverride }
                                            : {}),
                                    }}
                                />
                            </div>
                            <div className="viz-item hodo-wrapper">
                                <Hodograph
                                    soundingParam={soundingData}
                                    statsDictParam={stats}
                                    config={{
                                        ...(useCustomTooltips
                                            ? { renderTooltip: hodoTooltipOverride }
                                            : {}),
                                    }}
                                />
                            </div>
                        </div>

                        {/* Bottom Section: Data Table */}
                        <div className="table-wrapper">
                            <StatsTable
                                statsDictParam={stats}
                                selectedStat={selectedStat}
                                onStatSelect={setSelectedStat}
                            />
                        </div>
                        <div>
                            <div id="boxwhiskertitle">
                                <div className="linkColor">Box Whiskers:</div>

                                <p>
                                    {`${ordinalSuffixOf(boxPlotPercentiles.whiskers[0])}, ${ordinalSuffixOf(
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
                                    percentiles: boxPlotPercentiles,
                                }}
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
