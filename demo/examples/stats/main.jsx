import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createSounding, SoundingContainer, data } from '@noaa-gsl/wizard-soundings';
import '@noaa-gsl/wizard-soundings/styles.css';
import './style.css';

// Data contains the sample data.
// Use createSounding to create the Sounding object for handling / manipulating sounding data

function getSounding() {
    // Create the sounding object.
    const sounding = createSounding();
    // Add data and specify the datetime to use
    sounding.updateData(data, '1753707600000');
    return sounding;
}

// --- Tooltip Override Configurations ---
// Defining these outside the component prevents them from being recreated on every render.

// Converts meters to feet
const mToFt = (meters) => meters * 3.28084;

// Calculates Relative Humidity from T and Td (in Celsius) using the Tetens formula
const calculateRH = (t, td) => {
    if (t == null || td == null) return null;
    // Saturation vapor pressure
    const es = 6.112 * Math.exp((17.67 * t) / (t + 243.5));
    // Actual vapor pressure
    const e = 6.112 * Math.exp((17.67 * td) / (td + 243.5));
    // Return constrained percentage
    return Math.max(0, Math.min(100, 100 * (e / es)));
};

// --- Tooltip Override Configurations ---

// 1. Skew-T Render Prop Demo (Expanded Readout)
const skewTTooltipOverride = (data) => {
    // Defensive check
    if (!data) return null;

    // Derived Calculations
    const rh = calculateRH(data.temp, data.dwpt);
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
            {rh != null && (
                <div style={rowStyle}>
                    <span style={{ color: '#aaa' }}>RH:</span>
                    <strong>{rh.toFixed(0)}%</strong>
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
    // Data Fetching
    const sounding = getSounding();
    const soundingData = sounding.getLevelData(); // Your data source
    const stats = sounding.calcStats(sounding.getMembers(), 'mean'); // Your stats source
    const derivedData = sounding.calcStats(sounding.getMembers(), 'list'); // Your derived data source

    // --- Tooltip Override Demo ---
    // Toggle this state to see the tooltips change!
    const [useCustomTooltips, setUseCustomTooltips] = useState(false);

    // Apply the overrides if the toggle is active
    const demoConfig = useCustomTooltips
        ? {
              skewt: { renderTooltip: skewTTooltipOverride },
              hodo: { renderTooltip: hodoTooltipOverride },
          }
        : {}; // Pass an empty object to fall back to the library defaults

    return (
        <div className="app-layout">
            <header>
                <h1>Welcome to Wizard Soundings!</h1>
            </header>
            {/* Button to easily enable/disable custom tooltips in the demo UI */}
            <button
                onClick={() => setUseCustomTooltips(!useCustomTooltips)}
                style={{
                    padding: '8px 16px',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                }}
            >
                {useCustomTooltips ? 'Disable Custom Tooltips' : 'Enable Custom Tooltips'}
            </button>

            <main className="main-content">
                <section className="display-area">
                    <SoundingContainer
                        soundingData={soundingData}
                        stats={stats}
                        derivedData={derivedData}
                        globalConfig={demoConfig}
                    />
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
