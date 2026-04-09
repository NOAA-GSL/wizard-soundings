import { StrictMode } from 'react';
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

function App() {
    // Data Fetching
    const sounding = getSounding();
    const soundingData = sounding.getLevelData(); // Your data source
    const stats = sounding.calcStats(sounding.getMembers(), 'mean'); // Your stats source
    const derivedData = sounding.calcStats(sounding.getMembers(), 'list'); // Your derived data source

    return (
        <div className="app-layout">
            <header>
                <h1>Welcome to Wizard Soundings!</h1>
            </header>

            <main className="main-content">
                <section className="display-area">
                    <SoundingContainer
                        soundingData={soundingData}
                        stats={stats}
                        derivedData={derivedData}
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
