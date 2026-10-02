import React, { useMemo } from 'react';
import { buildWindRings } from '../windUnits';
import styles from './hodograph.module.css';

function HodographBackground({ rScale, maxWind, ringConfig, windUnit = 'kts' }) {
    const { interval, labelInterval, units } = ringConfig;

    const { rings, labels } = useMemo(
        () => buildWindRings(maxWind, interval, labelInterval, windUnit),
        [maxWind, interval, labelInterval, windUnit],
    );

    return (
        <g className={styles.grid}>
            {rings.map(({ kts, value }) => (
                <circle key={value} cx={0} cy={0} r={rScale(kts)} className={styles.rings} />
            ))}
            {labels.map(({ kts, value }) => (
                <text
                    key={`label-${value}`}
                    x={0}
                    y={rScale(kts)}
                    dy="0.9em"
                    className={styles.labels}
                >
                    {value}
                    {units}
                </text>
            ))}
        </g>
    );
}

export default React.memo(HodographBackground);
