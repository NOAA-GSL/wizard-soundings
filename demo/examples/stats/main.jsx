import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createSounding, StatsTable, data } from 'desi-soundings';
import 'desi-soundings/desi-soundings.css';

function getSounding() {
    const sounding = createSounding();
    sounding.updateData(data, '1753707600000');
    return sounding;
}

const sounding = getSounding();

function RenderStatsPage() {
    const [statsDict, setStatsDict] = useState(null);

    const memberList = sounding.getMembers().map((member, i) => {
        return (
            <li key={member}>
                <button>{member}</button>{' '}
                {/* TODO: Add onClick to function that adds/removes models from list. */}
            </li>
        );
    });

    const handleCalculateStats = () => {
        // 1. Calculate the stats for only the selected members.
        const stats = sounding.calcStats(sounding.getMembers(), 'mean'); //TODO: Update to use selected models.
        console.log(stats);
        setStatsDict(stats);
    };

    console.log(sounding.getProfileData());
    return (
        <>
            <div>Example of sounding stats!</div>
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
                <StatsTable statsDictParam={statsDict} />
            </div>
        </>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <RenderStatsPage />
    </StrictMode>,
);
