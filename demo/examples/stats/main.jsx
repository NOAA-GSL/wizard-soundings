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
    //const [soundingData, setSoundingData] = useState(null);
    const [levelData, setLevelData] = useState(null);
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

    // Insert StatsTable where you'd like it to appear with the statsDictParam specified.
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
            <div id="hodograph" ref={hodographContainerDiv}>
                <Hodograph soundingParam={levelData} containerDiv={hodographContainerDiv} />
            </div>
        </>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <RenderStatsPage />
    </StrictMode>,
);
