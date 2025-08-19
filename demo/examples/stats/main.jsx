import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { displayResults } from 'desi-soundings';

function MapContainer() {
    // memoizing so that it doesn't re-run when moving the map or other re-renders
    displayResults();
    // 1 - Get json data and pass to sounding object (check)
    // 2 - Obtain a list of members. Display this list to user, allowing the user to check members on/off
    // 3 - Create a "calc stats" button
    // 4 - onClick, calcStats from this all members
    // 5 - Create a function to calculate the mean of each stat, using selected members
    // 6 - Display these results in a table.
    return (
        <>
            <div>Example of sounding stats!</div>
            <div>(under construction)</div>
            {/* TODO: Add a list that can be dynamically updated with member names. Each member should be toggleable. */}
            {/* TODO: Add a calc stats button */}
            {/* TODO: Add a placeholder for stats table. */}
        </>
    );
}

// TODO: Create a function to create the member name list. Store toggled members in state. (where is the best place for this function?)

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <MapContainer />
    </StrictMode>,
);
