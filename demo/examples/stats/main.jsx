import { StrictMode, useMemo, useState, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { createSounding, SoundingContainer, data } from 'desi-soundings';
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

function App() {
    // 1. Manage Settings State
    const [settings, setSettings] = useState({
        skewt: {
            showWetbulb: true,
        },
        hodo: {
            maxWind: 80,
            showMembers: true,
        },
    });

    // 2. Data Fetching (Placeholder for your logic)
    const sounding = getSounding();
    const soundingData = sounding.getLevelData(); // Your data source
    const stats = sounding.calcStats(sounding.getMembers(), 'mean'); // Your stats source

    // 3. Handle Settings Changes
    const updateSettings = (path, value) => {
        setSettings((prev) => {
            const next = { ...prev };
            // Simple path update logic (e.g., 'skewt.skewAngle')
            const keys = path.split('.');
            next[keys[0]][keys[1]] = value;
            return { ...next };
        });
    };

    return (
        <div className="app-layout">
            <header>
                <h1>Welcome to desi soundings!</h1>
            </header>

            <main className="main-content">
                {/* 1. The Settings Panel */}
                <aside className="settings-sidebar">
                    <h3>Chart Settings</h3>
                    <label>
                        Max Wind (Hodo):
                        <input
                            type="number"
                            value={settings.hodo.maxWind}
                            onChange={(e) => updateSettings('hodo.maxWind', +e.target.value)}
                        />
                    </label>
                </aside>

                {/* 2. The Interactive Charts */}
                <section className="display-area">
                    <SoundingContainer
                        soundingData={soundingData}
                        stats={stats}
                        globalConfig={settings}
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
