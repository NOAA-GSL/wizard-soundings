import React, { useMemo } from 'react';
import * as d3 from 'd3';
import sharp from '../Sharp';

/**
 * Coordinate Transformer: Skew-X
 */
function getSkewX(temp, press, xScale, yScale, tanAlpha, baseY) {
    return xScale(temp) + (baseY - yScale(press)) / tanAlpha;
}

const SkewTBackground = React.memo(({ dimensions, scales, config }) => {
    const { width, height } = dimensions;
    const { xScale, yScale, tanAlpha, baseY } = scales;

    // 1. Isotherms
    const isothermLines = useMemo(
        () => d3.range(config.isotherms.min, config.isotherms.max + 1, config.isotherms.interval),
        [config.isotherms],
    );

    // 2. Dry Adiabats
    const dryAdiabatPaths = useMemo(() => {
        const paths = [];
        const pressures = d3.range(config.baseP, config.topP - 1, -25);
        const potentialTemps = d3.range(
            config.dryAdiabats.min,
            config.dryAdiabats.max,
            config.dryAdiabats.interval,
        );

        potentialTemps.forEach((thetaC) => {
            const lineData = [];
            const thetaK = thetaC + 273.15;
            pressures.forEach((p) => {
                const tempK = thetaK * (p / 1000) ** 0.286;
                const tempC = tempK - 273.15;
                lineData.push({ temp: tempC, press: p });
            });
            paths.push(lineData);
        });
        return paths;
    }, [config.baseP, config.topP, config.dryAdiabats]);

    // 3. Moist Adiabats
    const moistAdiabatPaths = useMemo(() => {
        const paths = [];
        const startTemps = d3.range(
            config.moistAdiabats.min,
            config.moistAdiabats.max + 1,
            config.moistAdiabats.interval,
        );
        const pressures = d3.range(1000, config.topP - 1, -25);

        startTemps.forEach((startT) => {
            const lineData = [];
            pressures.forEach((p) => {
                const result = sharp.wetLift([1000], [startT], [p]);
                if (result && result.length > 0) {
                    lineData.push({ press: p, temp: result[0] });
                }
            });
            paths.push(lineData);
        });
        return paths;
    }, [config.topP, config.moistAdiabats]);

    // 4. Mixing Ratio Lines
    const mixingRatioPaths = useMemo(() => {
        const paths = [];
        const pressures = d3.range(config.baseP, 400 - 1, -50);
        config.mixingRatio.forEach((mr) => {
            const lineData = [];
            const mrArray = Array(pressures.length).fill(mr);
            const temps = sharp.tempAtMRSpecial(mrArray, pressures);
            pressures.forEach((p, i) => {
                lineData.push({ press: p, temp: temps[i] });
            });
            paths.push(lineData);
        });
        return paths;
    }, [config.baseP, config.mixingRatio]);

    const lineGen = d3
        .line()
        .curve(d3.curveLinear)
        .x((d) => getSkewX(d.temp, d.press, xScale, yScale, tanAlpha, baseY))
        .y((d) => yScale(d.press));

    return (
        <g className="skewt-grid">
            <defs>
                <clipPath id="skewt-clip-bg">
                    <rect width={width} height={height} />
                </clipPath>
            </defs>
            <rect
                className="skewt-background"
                width={width}
                height={height}
                fill="none"
                stroke="black"
                strokeWidth={2}
            />

            <g clipPath="url(#skewt-clip-bg)">
                {dryAdiabatPaths.map((d, i) => (
                    <path
                        key={`dry-${i}`}
                        d={lineGen(d)}
                        fill="none"
                        stroke={config.colors.dryAdiabat}
                        strokeWidth={1}
                    />
                ))}
                {moistAdiabatPaths.map((d, i) => (
                    <path
                        key={`moist-${i}`}
                        d={lineGen(d)}
                        fill="none"
                        stroke={config.colors.moistAdiabat}
                        strokeWidth={1}
                    />
                ))}
                {mixingRatioPaths.map((d, i) => (
                    <path
                        key={`mr-${i}`}
                        d={lineGen(d)}
                        fill="none"
                        stroke={config.colors.mixingRatio}
                        strokeWidth={1}
                        strokeDasharray="4,4"
                    />
                ))}
                {/* Isotherm Lines */}
                {isothermLines.map((t) => {
                    const xTop = getSkewX(t, config.topP, xScale, yScale, tanAlpha, baseY);
                    console.log('Isotherm:', t, 'xTop:', xTop);
                    const xBottom = getSkewX(t, config.baseP, xScale, yScale, tanAlpha, baseY);
                    console.log('Isotherm:', t, 'xBottom:', xBottom, 'height:', height);

                    return (
                        <g key={`iso-${t}`}>
                            <line
                                x1={xTop}
                                y1={0}
                                x2={xBottom}
                                y2={height}
                                stroke={config.colors.isotherm}
                                strokeWidth={4}
                                strokeDasharray={t === 0 ? '' : '2,2'}
                            />
                        </g>
                    );
                })}
            </g>
            {/* Isotherm Labels (outside of clipping area) */}
            {isothermLines.map((t) => {
                const xBottom = getSkewX(t, config.baseP, xScale, yScale, tanAlpha, baseY);
                // Only draw if the label falls within the horizontal bounds of the chart
                if (xBottom < 0 || xBottom > width) return null;
                return (
                    <text
                        key={`label-iso-${t}`}
                        x={xBottom}
                        y={height + 8} // Safely below the clipped area
                        fontSize="14px"
                        textAnchor="middle"
                    >
                        {t}
                    </text>
                );
            })}
            {/* Isobar Lines and Labels */}
            {config.isobars.map((p) => (
                <g key={`p-${p}`}>
                    <line
                        x1={0}
                        y1={yScale(p)}
                        x2={width}
                        y2={yScale(p)}
                        stroke={config.colors.isobar}
                        strokeWidth={1}
                    />
                    <text
                        x={-5} // Positioned to the left of the border
                        y={yScale(p)}
                        dy="-0.35em"
                        fontSize="14px"
                        textAnchor="end"
                    >
                        {p}
                    </text>
                </g>
            ))}
        </g>
    );
});

export default SkewTBackground;
