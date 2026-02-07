import { StrictMode, useMemo, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createSounding, StatsTable, Hodograph, data } from 'desi-soundings';
import 'desi-soundings/desi-soundings.css';
import './style.css';

// Data contains the sample data.
// Use createSounding to create the Sounding object for handling / manipulating sounding data
// Use StatsTable for displaying derived parameters (stored in the Sounding object) in a table format.
// Desi-soundings.css controls the look/feel of StatsTable

function getSounding() {
    // Create the sounding object.
    const sounding = createSounding();
    // Add data and specify the datetime to use
    sounding.updateData(data, '1753707600000');
    return sounding;
}

const sounding = getSounding();

function RenderStatsPage() {
    // Create a state variable to tie table updates to derived data changes.
    const [statsDict, setStatsDict] = useState(null);
    // const [soundingData, setSoundingData] = useState(null);
    const [levelData, setLevelData] = useState(null);

    const [bgColor, setBgColor] = useState('white');

    // Configuration State
    const [hodoConfig, setHodoConfig] = useState({
        maxWind: 80,
        rings: {
            interval: 20,
            labelInterval: 20,
            units: 'kts',
        },
        zoom: {
            enabled: true,
            extent: [1, 10],
        },
    });

    const hodographContainerDiv = useRef();

    // Obtain a list of members from the sounding object using .getMembers
    const memberList = sounding.getMembers().map((member, i) => {
        return (
            <li key={member}>
                <button>{member}</button>{' '}
                {/* TODO: Add onClick to function that adds/removes models from list. */}
            </li>
        );
    });

    const handleCalculateStats = () => {
        // Calculate the stats for only the selected members. Set state variable.
        const stats = sounding.calcStats(sounding.getMembers(), 'mean'); //TODO: Update to use selected models.
        console.log(stats);
        setStatsDict(stats);
        //setSoundingData(sounding.getProfileData());
        setLevelData(sounding.getLevelData());
    };

    // Generic handler for updating nested config state
    // This allows us to update 'rings.interval' or 'maxWind' dynamically
    const updateConfig = (section, key, value) => {
        setHodoConfig((prev) => {
            if (section) {
                // Update nested object (e.g., rings or zoom)
                return {
                    ...prev,
                    [section]: {
                        ...prev[section],
                        [key]: value,
                    },
                };
            } else {
                // Update top-level property (e.g., maxWind)
                return { ...prev, [key]: value };
            }
        });
    };

    const statsTableStyles = { '--background-color': 'lightblue' };
    const hodographStyles = {
        '--background-color': bgColor,
        '--ring-color': ['black', '#333'].includes(bgColor) ? '#eee' : 'black',
    };

    // Insert StatsTable where you'd like it to appear with the statsDictParam specified.
    return (
        <>
            <div>Example of sounding stats!</div>

            {/* Settings Panel */}
            <div
                style={{
                    border: '1px solid #ccc',
                    padding: '15px',
                    marginBottom: '20px',
                    backgroundColor: '#f9f9f9',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '10px',
                }}
            >
                <h3>Hodograph Settings</h3>
                <label>
                    Background:
                    <select
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        style={{ marginLeft: '5px' }}
                    >
                        <option value="lightblue">Light Blue</option>
                        <option value="white">White</option>
                        <option value="#f0f0f0">Light Gray</option>
                        <option value="#ffebcd">Blanched Almond</option>
                        <option value="black">Dark Mode (Black)</option>
                        <option value="#333">Dark Gray</option>
                    </select>
                </label>
                {/* Max Wind Scale */}
                <label>
                    Max Wind Speed:
                    <input
                        type="number"
                        value={hodoConfig.maxWind}
                        onChange={(e) => updateConfig(null, 'maxWind', Number(e.target.value))}
                        style={{ marginLeft: '5px', width: '60px' }}
                    />
                </label>

                {/* Ring Interval */}
                <label>
                    Ring Interval:
                    <input
                        type="number"
                        value={hodoConfig.rings.interval}
                        onChange={(e) => updateConfig('rings', 'interval', Number(e.target.value))}
                        style={{ marginLeft: '5px', width: '60px' }}
                    />
                </label>

                {/* Units Toggle */}
                <label>
                    Units:
                    <select
                        value={hodoConfig.rings.units}
                        onChange={(e) => updateConfig('rings', 'units', e.target.value)}
                        style={{ marginLeft: '5px' }}
                    >
                        <option value="kts">Knots (kts)</option>
                        <option value="m/s">Meters/Sec (m/s)</option>
                        <option value="mph">Miles/Hour (mph)</option>
                    </select>
                </label>

                {/* Zoom Toggle */}
                <label>
                    <input
                        type="checkbox"
                        checked={hodoConfig.zoom.enabled}
                        onChange={(e) => updateConfig('zoom', 'enabled', e.target.checked)}
                        style={{ marginRight: '5px' }}
                    />
                    Enable Zoom
                </label>
            </div>

            <div>
                <ul id="model-list">{memberList}</ul>
            </div>

            <button
                id="calc-stats-button"
                onClick={handleCalculateStats}
                disabled={memberList.length === 0}
            >
                Calculate Stats{' '}
            </button>

            <div id="stats-table">
                <StatsTable statsDictParam={statsDict} styles={statsTableStyles} />
            </div>

            <div id="hodograph">
                {/* [UPDATED] Pass the hodoConfig state to the component */}
                <Hodograph
                    soundingParam={levelData}
                    statsDictParam={statsDict}
                    styles={hodographStyles}
                    config={hodoConfig}
                />
            </div>
        </>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <RenderStatsPage />
    </StrictMode>,
);
