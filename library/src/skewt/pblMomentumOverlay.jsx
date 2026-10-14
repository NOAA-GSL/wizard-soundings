import React from 'react';
import WindBarb from './windBarb';

const OVERLAP_PX = 6;
const OVERLAP_SHIFT_PX = 14;

/**
 * Draws the PBL depth box-whisker and the mean/max momentum-transfer barbs.
 * `toY`/`toBarbX` map pressure to screen coordinates (including zoom); `pblX` is the box column.
 */
export default function PblMomentumOverlay({ markers, toY, toBarbX, pblX, pblConfig, mtConfig }) {
    if (!markers) return null;
    const { boxWhisker, medianPress, meanBarb, maxBarb } = markers;
    const boxX = pblX;
    const half = pblConfig.width / 2;

    const meanY = meanBarb && toY(meanBarb.press);
    const maxY = maxBarb && toY(maxBarb.press);
    const meanX = meanBarb && toBarbX(meanBarb.press);
    const rawMaxX = maxBarb && toBarbX(maxBarb.press);
    const showMean = mtConfig.enabled && mtConfig.showMean && meanBarb && meanX != null;
    const showMax = mtConfig.enabled && mtConfig.showMax && maxBarb && rawMaxX != null;
    const maxX =
        showMean && showMax && Math.abs(maxY - meanY) < OVERLAP_PX
            ? rawMaxX - OVERLAP_SHIFT_PX
            : rawMaxX;

    return (
        <g className="ws-skewt-pbl-mt" pointerEvents="none">
            {pblConfig.enabled && boxWhisker && (
                <g className="ws-skewt-pbl" stroke={pblConfig.color} strokeWidth={1.5}>
                    <line
                        x1={boxX}
                        x2={boxX}
                        y1={toY(boxWhisker.whiskerBottom)}
                        y2={toY(boxWhisker.whiskerTop)}
                    />
                    <line
                        x1={boxX - half / 2}
                        x2={boxX + half / 2}
                        y1={toY(boxWhisker.whiskerBottom)}
                        y2={toY(boxWhisker.whiskerBottom)}
                    />
                    <line
                        x1={boxX - half / 2}
                        x2={boxX + half / 2}
                        y1={toY(boxWhisker.whiskerTop)}
                        y2={toY(boxWhisker.whiskerTop)}
                    />
                    <rect
                        x={boxX - half}
                        y={toY(boxWhisker.boxTop)}
                        width={pblConfig.width}
                        height={Math.max(0, toY(boxWhisker.boxBottom) - toY(boxWhisker.boxTop))}
                        fill={pblConfig.color}
                        fillOpacity={0.35}
                    />
                    <line
                        x1={boxX - half}
                        x2={boxX + half}
                        y1={toY(boxWhisker.median)}
                        y2={toY(boxWhisker.median)}
                        strokeWidth={2.5}
                    />
                </g>
            )}
            {pblConfig.enabled && !boxWhisker && (
                <line
                    className="ws-skewt-pbl"
                    x1={boxX - half}
                    x2={boxX + half}
                    y1={toY(medianPress)}
                    y2={toY(medianPress)}
                    stroke={pblConfig.color}
                    strokeWidth={2.5}
                />
            )}
            {(showMean || showMax) && (
                <g className="ws-skewt-mt" style={{ color: mtConfig.color }}>
                    {showMean && (
                        <WindBarb
                            u={meanBarb.u}
                            v={meanBarb.v}
                            x={meanX}
                            y={meanY}
                            strokeWidth={mtConfig.strokeWidth}
                        />
                    )}
                    {showMax && (
                        <WindBarb
                            u={maxBarb.u}
                            v={maxBarb.v}
                            x={maxX}
                            y={maxY}
                            strokeWidth={mtConfig.strokeWidth}
                        />
                    )}
                </g>
            )}
        </g>
    );
}
