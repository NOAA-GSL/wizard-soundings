import { useState } from 'react';
import SkewT from './skewt/SkewT';
import Hodograph from './hodograph/Hodograph';
import StatsTable from './statsTable/StatsTable';
import BoxPlot from './statsTable/boxplot';
import styles from './soundingContainer.module.css';

/**
 * SoundingContainer: Orchestrates the meteorological display components.
 * @param {Array} soundingData - The raw sounding/ensemble data.
 * @param {Object} stats - The calculated thermo/wind statistics.
 * @param {Object} globalConfig - (Optional) Overrides for chart settings.
 */
export default function SoundingContainer({ soundingData, stats, derivedData, globalConfig = {} }) {
    // If data is missing, we can show a loading state or a placeholder
    const [selectedStat, setSelectedStat] = useState('sfcCAPE');

    if (!soundingData || !stats) {
        return (
            <div className={[styles.loading, 'ws-sounding-loading'].join(' ')}>
                Loading sounding data...
            </div>
        );
    }

    return (
        <div className={[styles.root, 'ws-sounding-dashboard'].join(' ')}>
            {/* Top Section: Visualization Grid */}
            <div className={styles.vizGrid}>
                <div className={[styles.vizItem, styles.skewtWrapper].join(' ')}>
                    <SkewT
                        soundingParam={soundingData}
                        statsDictParam={stats}
                        config={globalConfig.skewt}
                    />
                </div>
                <div className={[styles.vizItem, styles.hodoWrapper].join(' ')}>
                    <Hodograph
                        soundingParam={soundingData}
                        statsDictParam={stats}
                        config={globalConfig.hodo}
                    />
                </div>
            </div>

            {/* Bottom Section: Data Table */}
            <div className={styles.tableWrapper}>
                <StatsTable
                    statsDictParam={stats}
                    selectedStat={selectedStat}
                    onStatSelect={setSelectedStat}
                />
            </div>
            <div>
                <BoxPlot statsDictParam={derivedData} curStat={selectedStat} />
            </div>
        </div>
    );
}
