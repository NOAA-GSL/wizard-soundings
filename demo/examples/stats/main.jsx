import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getSounding } from 'desi-soundings';
import { StatsTable } from 'desi-soundings';

const sounding = getSounding();

function RenderStatsPage() {
    // 1 - Get json data and pass to sounding object (check)
    // 2 - Obtain a list of members. Display this list to user, allowing the user to check members on/off
    // 3 - Create a "calc stats" button
    // 4 - onClick, calcStats from this all members
    // 5 - Create a function to calculate the mean of each stat, using selected members
    // 6 - Display these results in a table.
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
// TODO: Create a function to calculate stats using selected models.

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <RenderStatsPage />
    </StrictMode>,
);
