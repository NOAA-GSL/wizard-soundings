import React, { useMemo } from 'react';
import SkewT from './skewt/SkewT';
import Hodograph from './hodograph/Hodograph';
import StatsTable from './statsTable/StatsTable';
import './soundingContainer.css';

/**
 * SoundingContainer: Orchestrates the meteorological display components.
 * @param {Array} soundingData - The raw sounding/ensemble data.
 * @param {Object} stats - The calculated thermo/wind statistics.
 * @param {Object} globalConfig - (Optional) Overrides for chart settings.
 */
export default function SoundingContainer({ soundingData, stats, globalConfig = {} }) {
    // If data is missing, we can show a loading state or a placeholder
    if (!soundingData || !stats) {
        return <div className="sounding-loading">Loading sounding data...</div>;
    }

    return (
        <div className="sounding-dashboard">
            {/* Top Section: Visualization Grid */}
            <div className="viz-grid">
                <div className="viz-item skewt-wrapper">
                    <SkewT
                        soundingParam={soundingData}
                        statsDictParam={stats}
                        config={globalConfig.skewt}
                    />
                </div>
                <div className="viz-item hodo-wrapper">
                    <Hodograph
                        soundingParam={soundingData}
                        statsDictParam={stats}
                        config={globalConfig.hodo}
                    />
                </div>
            </div>

            {/* Bottom Section: Data Table */}
            <div className="table-wrapper">
                <StatsTable statsDictParam={stats} />
            </div>
        </div>
    );
}
