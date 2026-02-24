import React, { useMemo } from 'react';
import * as d3 from 'd3';

function HodographBackground({ rScale, maxWind, ringConfig }) {
    const { interval, labelInterval, units } = ringConfig;

    const ringTicks = useMemo(() => d3.range(interval, maxWind + 1, interval), [interval, maxWind]);

    const labelTicks = useMemo(
        () => d3.range(interval, maxWind + 1, labelInterval),
        [interval, maxWind, labelInterval],
    );

    return (
        <g className="grid">
            {ringTicks.map((tick) => (
                <circle key={tick} cx={0} cy={0} r={rScale(tick)} className="hodorings" />
            ))}
            {labelTicks.map((tick) => (
                <text
                    key={`label-${tick}`}
                    x={0}
                    y={rScale(tick)}
                    dy="0.9em"
                    className="hodolabels"
                >
                    {tick}
                    {units}
                </text>
            ))}
        </g>
    );
}

export default React.memo(HodographBackground);
