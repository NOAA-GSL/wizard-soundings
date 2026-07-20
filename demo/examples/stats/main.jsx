import { StrictMode, useState, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { createSounding, SoundingContainer, SkewT, data } from '@noaa-gsl/wizard-soundings';
import '@noaa-gsl/wizard-soundings/styles.css';
import './style.css';

// Data contains the sample data.
// Use createSounding to create the Sounding object for handling / manipulating sounding data

const DATES = [
    1753707600000, 1753711200000, 1753714800000, 1753718400000, 1753722000000, 1753725600000,
    1753729200000, 1753732800000, 1753736400000, 1753740000000, 1753743600000, 1753747200000,
    1753750800000, 1753754400000, 1753758000000, 1753761600000, 1753765200000, 1753768800000,
    1753772400000, 1753776000000, 1753779600000, 1753783200000, 1753786800000, 1753790400000,
    1753794000000, 1753797600000, 1753801200000, 1753804800000, 1753808400000, 1753812000000,
    1753815600000, 1753819200000, 1753822800000, 1753826400000, 1753830000000, 1753833600000,
    1753837200000, 1753840800000, 1753844400000, 1753848000000, 1753851600000, 1753855200000,
    1753858800000, 1753862400000, 1753866000000, 1753869600000, 1753873200000, 1753876800000,
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

function App() {
    // Display mode state
    const [displayMode, setDisplayMode] = useState('boxwhisker');
    const [percentileInput, setPercentileInput] = useState('5, 25, 75, 95');
    const [timeIndex, setTimeIndex] = useState(0);

    // Parse percentile input into array of numbers
    const percentiles = percentileInput
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 100);

    // Data Fetching - recompute when time changes
    const { soundingData, stats, derivedData } = useMemo(() => {
        const sounding = createSounding();
        sounding.updateData(data, String(DATES[timeIndex]));
        return {
            soundingData: sounding.getLevelData(),
            stats: sounding.calcStats(sounding.getMembers(), 'mean'),
            derivedData: sounding.calcStats(sounding.getMembers(), 'list'),
        };
    }, [timeIndex]);

    return (
        <div className="app-layout">
            <header>
                <h1>Welcome to Wizard Soundings!</h1>
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
                        Display Mode
                        <select
                            value={displayMode}
                            onChange={(e) => setDisplayMode(e.target.value)}
                        >
                            <option value="plumes">Plumes</option>
                            <option value="boxwhisker">Box Whisker</option>
                        </select>
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
                    {percentiles.length >= 2 && (
                        <p className="percentile-info">
                            Whiskers: {percentiles[0]}th &amp;{' '}
                            {percentiles[percentiles.length - 1]}th
                            <br />
                            Box:{' '}
                            {percentiles.length >= 4
                                ? `${percentiles[1]}th & ${percentiles[percentiles.length - 2]}th`
                                : 'N/A'}
                            <br />
                            Median: 50th (always included)
                        </p>
                    )}
                </aside>

                <section className="display-area">
                    <SoundingContainer
                        soundingData={soundingData}
                        stats={stats}
                        derivedData={derivedData}
                        globalConfig={{
                            skewt: { displayMode, percentiles },
                        }}
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
