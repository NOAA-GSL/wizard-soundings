import { StrictMode, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { displayResults } from 'desi-soundings';

function MapContainer() {
    // memoizing so that it doesn't re-run when moving the map or other re-renders
    console.log('Starting');

    const num1 = 2;
    const num2 = 3;
    displayResults();
    return (
        <>
            <div>Example of sounding stats!</div>
            <div>
                {num1} plus {num2} equal {add(num1, num2)}
            </div>
        </>
    );
}

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <MapContainer />
    </StrictMode>,
);
