import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { getSounding } from 'desi-soundings';

function MapContainer() {
    // memoizing so that it doesn't re-run when moving the map or other re-renders

    const sounding = getSounding();

    const memberList = sounding.members.map((member, i) => {
        return (
            <li key={member}>
                <button>{member}</button>{' '}
                {/* TODO: Add onClick to function that adds/removes models from list. */}
            </li>
        );
    });

    console.log(sounding.profileData);
    const stats = sounding.sharpStats(sounding.profileData[0]);
    console.log(stats);
    // 1 - Get json data and pass to sounding object (check)
    // 2 - Obtain a list of members. Display this list to user, allowing the user to check members on/off
    // 3 - Create a "calc stats" button
    // 4 - onClick, calcStats from this all members
    // 5 - Create a function to calculate the mean of each stat, using selected members
    // 6 - Display these results in a table.
    return (
        <>
            <div>Example of sounding stats!</div>
            <div>
                <ul id="model-list">{memberList}</ul>
            </div>
            <button id="calc-stats-button">
                Calculate Stats{' '}
                {/* TODO: Add onClick to function that calculates stats using selected models. */}
            </button>
            <div id="stats-table">Table</div>
        </>
    );
}

// TODO: Create a function to calculate stats using selected models.

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <MapContainer />
    </StrictMode>,
);
