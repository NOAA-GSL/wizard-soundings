import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import useContainerDimensions from '../utilities/useContainerDimensions';
import ChartTooltip from '../utilities/tooltip';
import SkewTBoxWhisker, { computePercentileProfiles } from '../skewt/skewtBoxWhisker';
import { computeMeanProfile } from '../skewt/meanProfile';
import { getStrokeDasharray } from '../skewt/traceConfig';
import {
    TALL_GRAPH_VARIABLE_KEYS,
    computeLayerBounds,
    computeValueDomain,
    createColorBarScale,
    formatAxisTitle,
    getAxisLayout,
    getBoxWhiskerPercentileKeys,
    resolveTallGraphConfig,
} from './tallGraphConfig';
import styles from './tallGraph.module.css';

const IDENTITY_TRANSFORM = { k: 1, y: 0 };
const TICK_SIZE = 4;

function TallGraphTooltipContent({ data, settings, activeKeys }) {
    return (
        <>
            <div>
                <strong>{data.press?.toFixed(0) ?? '--'} hPa</strong>
            </div>
            {activeKeys.map((key) => {
                const vs = settings[key];
                const value = data[vs.valueKey];
                return (
                    <div key={key} style={{ color: vs.color }}>
                        {vs.label}:{' '}
                        {Number.isFinite(value) ? value.toFixed(key === 'rh' ? 0 : 2) : '--'}
                        {vs.units ? ` ${vs.units}` : ''}
                    </div>
                );
            })}
        </>
    );
}

/* Component: TallGraph
    Narrow companion plot to the SkewT showing RH and omega against pressure.
*/
export default function TallGraph({
    soundingParam,
    config = {},
    yAxis,
    className = 'tallgraph-container',
    sx = {},
    percentiles,
}) {
    const [containerRef, dimensions] = useContainerDimensions();
    const [hoverInfo, setHoverInfo] = useState(null);
    const clipId = `ws-tallgraph-clip-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

    const settings = useMemo(() => resolveTallGraphConfig(config), [config]);
    const resolvedPercentiles = percentiles || settings.percentiles;
    const axisLayout = useMemo(() => getAxisLayout(settings), [settings]);
    const activeKeys = useMemo(() => axisLayout.axes.map((axis) => axis.key), [axisLayout]);

    const memberProfiles = useMemo(
        () =>
            Array.isArray(soundingParam)
                ? soundingParam.filter((profile) => Array.isArray(profile) && profile.length > 0)
                : [],
        [soundingParam],
    );
    const meanProfile = useMemo(() => computeMeanProfile(memberProfiles) ?? [], [memberProfiles]);

    const layout = useMemo(() => {
        if (dimensions.width === 0) return null;
        const { margin } = settings;
        const baseP = yAxis?.baseP ?? settings.baseP;
        const topP = yAxis?.topP ?? settings.topP;
        const offsetY = yAxis?.offsetY ?? margin.top;
        const innerH =
            yAxis?.innerH ??
            Math.max(0, dimensions.height - margin.top - margin.bottom - axisLayout.totalHeight);
        const innerW = Math.max(0, dimensions.width - margin.left - margin.right);

        return {
            offsetX: margin.left,
            offsetY,
            innerW,
            innerH,
            yScale: d3.scaleLog().domain([baseP, topP]).range([innerH, 0]),
        };
    }, [dimensions.width, dimensions.height, settings, yAxis, axisLayout.totalHeight]);

    const xScales = useMemo(() => {
        if (!layout) return {};
        return Object.fromEntries(
            TALL_GRAPH_VARIABLE_KEYS.map((key) => {
                const vs = settings[key];
                const domain = computeValueDomain(memberProfiles, vs.valueKey, vs.domain);
                return [key, d3.scaleLinear().domain(domain).range([0, layout.innerW])];
            }),
        );
    }, [layout, settings, memberProfiles]);

    const barColorScales = useMemo(
        () =>
            Object.fromEntries(
                TALL_GRAPH_VARIABLE_KEYS.map((key) => [
                    key,
                    createColorBarScale(settings[key].colorBar, settings[key].color),
                ]),
            ),
        [settings],
    );

    const percentileData = useMemo(
        () =>
            Object.fromEntries(
                activeKeys
                    .filter((key) => settings[key].displayMode === 'boxwhiskerBars')
                    .map((key) => [
                        key,
                        computePercentileProfiles(memberProfiles, resolvedPercentiles, [key], {
                            [key]: settings[key].valueKey,
                        }),
                    ]),
            ),
        [activeKeys, settings, memberProfiles, resolvedPercentiles],
    );

    const transform = yAxis?.transform ?? IDENTITY_TRANSFORM;
    const zoomBy = yAxis?.zoomBy;
    const panBy = yAxis?.panBy;
    const [frameNode, setFrameNode] = useState(null);
    const dragYRef = useRef(null);

    // Native listener: React wheel handlers are passive and can't stop the page from scrolling.
    useEffect(() => {
        if (!frameNode || !zoomBy) return undefined;
        const handleWheel = (e) => {
            e.preventDefault();
            const modeScale = e.deltaMode === 1 ? 0.05 : e.deltaMode ? 1 : 0.002;
            const factor = 2 ** (-e.deltaY * modeScale * (e.ctrlKey ? 10 : 1));
            zoomBy(factor, e.clientY - frameNode.getBoundingClientRect().top);
        };
        frameNode.addEventListener('wheel', handleWheel, { passive: false });
        return () => frameNode.removeEventListener('wheel', handleWheel);
    }, [frameNode, zoomBy]);

    const handlePointerDown = (e) => {
        if (!panBy) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragYRef.current = e.clientY;
    };
    const handlePointerMove = (e) => {
        if (dragYRef.current == null || !panBy) return;
        panBy(e.clientY - dragYRef.current);
        dragYRef.current = e.clientY;
    };
    const handlePointerUp = () => {
        dragYRef.current = null;
    };

    const handleMouseMove = useCallback(
        (e) => {
            if (!layout || meanProfile.length === 0) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const unzoomedY = (e.clientY - rect.top - transform.y) / transform.k;
            const pHover = layout.yScale.invert(unzoomedY);

            let closest = null;
            let minDiff = Infinity;
            for (const level of meanProfile) {
                const diff = Math.abs(level.press - pHover);
                if (diff < minDiff) {
                    minDiff = diff;
                    closest = level;
                }
            }

            if (closest && minDiff < 50) {
                setHoverInfo({
                    data: closest,
                    y: transform.k * layout.yScale(closest.press) + transform.y,
                    screenX: e.clientX,
                    screenY: e.clientY,
                });
            } else {
                setHoverInfo(null);
            }
        },
        [layout, meanProfile, transform],
    );

    if (!layout) {
        return (
            <div
                ref={containerRef}
                className={[styles.root, 'ws-tallgraph', className].filter(Boolean).join(' ')}
                style={sx}
            />
        );
    }

    const { innerW, innerH, yScale } = layout;
    const zoomY = (press) => transform.k * yScale(press) + transform.y;

    const makeLine = (xScale, valueKey) =>
        d3
            .line()
            .defined((d) => Number.isFinite(d[valueKey]) && Number.isFinite(d.press))
            .x((d) => xScale(d[valueKey]))
            .y((d) => zoomY(d.press));

    const renderVariable = (key) => {
        const vs = settings[key];
        const xScale = xScales[key];
        const dash = getStrokeDasharray(vs.lineStyle) || undefined;
        const [d0, d1] = xScale.domain();
        const baselineX = xScale(Math.min(Math.max(0, Math.min(d0, d1)), Math.max(d0, d1)));

        switch (vs.displayMode) {
            case 'mean':
                return (
                    <path
                        d={makeLine(xScale, vs.valueKey)(meanProfile) ?? undefined}
                        fill="none"
                        stroke={vs.color}
                        strokeWidth={2.5}
                        strokeDasharray={dash}
                    />
                );
            case 'plumes': {
                const line = makeLine(xScale, vs.valueKey);
                return memberProfiles.map((profile, i) => (
                    <path
                        key={`${key}-plume-${profile[0]?.mem ?? i}`}
                        d={line(profile) ?? undefined}
                        fill="none"
                        stroke={vs.color}
                        strokeWidth={1}
                        opacity={0.35}
                        strokeDasharray={dash}
                    />
                ));
            }
            case 'boxwhisker':
                // tanAlpha = Infinity removes the skew so the shared SkewT renderer draws upright areas.
                return (
                    <SkewTBoxWhisker
                        memberProfiles={memberProfiles}
                        scales={{ xScale, yScale: zoomY, tanAlpha: Infinity, baseY: 0 }}
                        percentiles={resolvedPercentiles}
                        variableKeys={[key]}
                        visibleVariables={{ [key]: true }}
                        colors={{ [key]: vs.color }}
                        lineDasharrays={{ [key]: dash }}
                        valueKeysByVariable={{ [key]: vs.valueKey }}
                    />
                );
            case 'boxwhiskerBars': {
                const data = percentileData[key]?.[key];
                const levels = percentileData[key]?.pressureLevels ?? [];
                if (!data) return null;
                const pk = getBoxWhiskerPercentileKeys(resolvedPercentiles);
                const boundsByPress = new Map(
                    computeLayerBounds(levels).map((layer) => [layer.press, layer]),
                );

                return levels.map((press, i) => {
                    const values = Object.fromEntries(
                        Object.entries(pk).map(([name, pKey]) => [name, data[pKey]?.[i]]),
                    );
                    if (!Object.values(values).every(Number.isFinite)) return null;
                    const layer = boundsByPress.get(press);
                    const y = zoomY(press);
                    const halfH = Math.max(
                        1,
                        (Math.abs(zoomY(layer.top) - zoomY(layer.bottom)) * 0.7) / 2,
                    );
                    const boxX0 = xScale(values.boxLow);
                    const boxX1 = xScale(values.boxHigh);
                    const barColor = barColorScales[key](values.median);

                    return (
                        <g key={`${key}-bw-${press}`} stroke={barColor}>
                            <line
                                x1={xScale(values.whiskerLow)}
                                x2={xScale(values.whiskerHigh)}
                                y1={y}
                                y2={y}
                                strokeWidth={1}
                            />
                            <rect
                                x={Math.min(boxX0, boxX1)}
                                y={y - halfH}
                                width={Math.abs(boxX1 - boxX0)}
                                height={halfH * 2}
                                fill={barColor}
                                fillOpacity={0.35}
                                strokeWidth={0.8}
                            />
                            <line
                                x1={xScale(values.median)}
                                x2={xScale(values.median)}
                                y1={y - halfH}
                                y2={y + halfH}
                                strokeWidth={2}
                            />
                        </g>
                    );
                });
            }
            case 'meanBars':
            default: {
                const valid = meanProfile.filter((d) => Number.isFinite(d[vs.valueKey]));
                const byPress = new Map(valid.map((d) => [d.press, d[vs.valueKey]]));
                return computeLayerBounds(valid.map((d) => d.press)).map((layer) => {
                    const value = byPress.get(layer.press);
                    const x = xScale(value);
                    const yTop = zoomY(layer.top);
                    const yBottom = zoomY(layer.bottom);
                    const height = Math.abs(yBottom - yTop);
                    if (height <= 0) return null;
                    return (
                        <rect
                            key={`${key}-bar-${layer.press}`}
                            x={Math.min(baselineX, x)}
                            y={Math.min(yTop, yBottom)}
                            width={Math.abs(x - baselineX)}
                            height={height}
                            fill={barColorScales[key](value)}
                            fillOpacity={0.7}
                            className={styles.bar}
                        />
                    );
                });
            }
        }
    };

    const omegaScale = xScales.omega;
    const [omegaD0, omegaD1] = omegaScale.domain();
    const showZeroLine =
        settings.omega.enabled && Math.min(omegaD0, omegaD1) < 0 && Math.max(omegaD0, omegaD1) > 0;

    return (
        <div
            ref={containerRef}
            className={[styles.root, 'ws-tallgraph', className].filter(Boolean).join(' ')}
            style={sx}
        >
            <svg width={dimensions.width} height={dimensions.height} className={styles.svg}>
                <defs>
                    <clipPath id={clipId}>
                        <rect x={0} y={0} width={innerW} height={innerH} />
                    </clipPath>
                </defs>
                <g transform={`translate(${layout.offsetX}, ${layout.offsetY})`}>
                    <g clipPath={`url(#${clipId})`} pointerEvents="none">
                        <g className={styles.grid}>
                            {settings.isobars.map((p) => (
                                <line
                                    key={`isobar-${p}`}
                                    x1={0}
                                    x2={innerW}
                                    y1={zoomY(p)}
                                    y2={zoomY(p)}
                                    stroke={settings.colors.isobar}
                                />
                            ))}
                            {showZeroLine && (
                                <line
                                    x1={omegaScale(0)}
                                    x2={omegaScale(0)}
                                    y1={0}
                                    y2={innerH}
                                    stroke={settings.colors.zeroLine}
                                    strokeDasharray="3,3"
                                />
                            )}
                        </g>
                        {activeKeys.map((key) => (
                            <g key={`variable-${key}`} className={styles.variable}>
                                {renderVariable(key)}
                            </g>
                        ))}
                        {hoverInfo && (
                            <line
                                x1={0}
                                x2={innerW}
                                y1={hoverInfo.y}
                                y2={hoverInfo.y}
                                className={styles.hoverLine}
                            />
                        )}
                    </g>
                    <rect
                        ref={setFrameNode}
                        x={0}
                        y={0}
                        width={innerW}
                        height={innerH}
                        className={styles.frame}
                        style={zoomBy ? { touchAction: 'none', cursor: 'move' } : undefined}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={() => setHoverInfo(null)}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                    />
                    {axisLayout.axes.map(({ key, offset }) => {
                        const vs = settings[key];
                        const xScale = xScales[key];
                        return (
                            <g
                                key={`axis-${key}`}
                                className={styles.axis}
                                transform={`translate(0, ${innerH + offset})`}
                            >
                                <line x1={0} x2={innerW} y1={0} y2={0} stroke={vs.color} />
                                {xScale.ticks(vs.ticks).map((tick) => (
                                    <g
                                        key={`tick-${key}-${tick}`}
                                        transform={`translate(${xScale(tick)}, 0)`}
                                    >
                                        <line y1={0} y2={TICK_SIZE} stroke={vs.color} />
                                        <text y={TICK_SIZE + 2} textAnchor="middle">
                                            {tick}
                                        </text>
                                    </g>
                                ))}
                                <text
                                    className={styles.axisTitle}
                                    x={innerW / 2}
                                    y={TICK_SIZE + 16}
                                    textAnchor="middle"
                                    style={{ fill: vs.color }}
                                >
                                    {formatAxisTitle(vs)}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>
            {hoverInfo && (
                <ChartTooltip
                    x={hoverInfo.screenX}
                    y={hoverInfo.screenY}
                    content={
                        settings.renderTooltip ? (
                            settings.renderTooltip(hoverInfo.data)
                        ) : (
                            <TallGraphTooltipContent
                                data={hoverInfo.data}
                                settings={settings}
                                activeKeys={activeKeys}
                            />
                        )
                    }
                />
            )}
        </div>
    );
}
