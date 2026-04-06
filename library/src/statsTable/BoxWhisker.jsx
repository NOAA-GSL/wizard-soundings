import React, { useMemo } from 'react';
import * as d3 from 'd3';
import './BoxWhisker.css'; // Importing separated styles

function BoxWhisker({
    data = [],
    width = 600,
    height = 400,
    margin = { top: 20, right: 30, bottom: 40, left: 50 },
}) {
    // Defensive coding: Validate data
    if (!data || data.length === 0) {
        return <div className="box-whisker-empty">No data available to plot.</div>;
    }

    // Calculate inner dimensions
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Memoize the D3 scales so they only recalculate when data/dimensions change
    const { xScale, yScale } = useMemo(() => {
        // Y Scale: Categorical data (Names)
        const yaxisNames = data.map((d) => d.name);
        const y = d3.scaleBand().range([innerHeight, 0]).domain(yaxisNames).padding(0.1);

        // X Scale: Linear data (Values)
        // Dynamically find the min and max across ALL data points for a safer axis
        const minX = d3.min(data, (d) => d.whisker1);
        const maxX = d3.max(data, (d) => d.whisker2);

        const x = d3.scaleLinear().domain([minX, maxX]).range([0, innerWidth]).nice(); // .nice() rounds the domain to readable numbers

        return { xScale: x, yScale: y };
    }, [data, innerWidth, innerHeight]);

    // Generate tick values for the X-axis
    const xTicks = xScale.ticks(4);

    return (
        <svg
            width={width}
            height={height}
            className="box-whisker-container"
            aria-label="Box and whisker plot"
        >
            <g transform={`translate(${margin.left},${margin.top})`}>
                {/* --- X Axis --- */}
                <g className="xaxis" transform={`translate(0,0)`}>
                    {xTicks.map((tickValue, i) => (
                        <g
                            key={i}
                            className="axis-tick"
                            transform={`translate(${xScale(tickValue)},0)`}
                        >
                            <line
                                y1={0}
                                y2={innerHeight}
                                className="axis-line"
                                strokeDasharray="4 4"
                            />
                            <text y={innerHeight + 20} textAnchor="middle">
                                {tickValue}
                            </text>
                        </g>
                    ))}
                </g>

                {/* --- Y Axis --- */}
                <g className="yaxis" transform={`translate(-15,0)`}>
                    {data.map((d) => {
                        const yCenter = yScale(d.name) + yScale.bandwidth() / 2;
                        return (
                            <text
                                key={d.name}
                                y={yCenter}
                                dy=".32em"
                                textAnchor="end"
                                className="axis-tick"
                            >
                                {d.name}
                            </text>
                        );
                    })}
                </g>

                {/* --- Box & Whisker Data Marks --- */}
                {data.map((d, i) => {
                    // Pre-calculate common Y positions for this row
                    const yPos = yScale(d.name);
                    const bandwidth = yScale.bandwidth();
                    const yCenter = yPos + bandwidth / 2;
                    // Prevent negative widths if data is malformed
                    const boxWidth = Math.max(0, xScale(d.box2) - xScale(d.box1)) || 0;

                    return (
                        <g key={`mark-${d.name || i}`} className="data-row">
                            {/* Left Whisker */}
                            <line
                                x1={xScale(d.whisker1)}
                                x2={xScale(d.box1)}
                                y1={yCenter}
                                y2={yCenter}
                                className="whisker-line"
                            />

                            {/* Right Whisker */}
                            <line
                                x1={xScale(d.box2)}
                                x2={xScale(d.whisker2)}
                                y1={yCenter}
                                y2={yCenter}
                                className="whisker-line"
                            />

                            {/* Main Box */}
                            <rect
                                x={xScale(d.box1)}
                                y={yPos}
                                width={boxWidth}
                                height={bandwidth}
                                className="box-rect"
                            />

                            {/* Median Line */}
                            <line
                                x1={xScale(d.median)}
                                x2={xScale(d.median)}
                                y1={yPos}
                                y2={yPos + bandwidth}
                                className="median-line"
                            />

                            {/* Foci / Data points (from your original code) */}
                            {[d.whisker1, d.box1, d.box2, d.whisker2].map((val, idx) => (
                                <circle
                                    key={`focus-${i}-${idx}`}
                                    className="focus-circle"
                                    r={4}
                                    style={{
                                        transform: `translate(${xScale(val)}px, ${yCenter}px)`,
                                    }}
                                />
                            ))}
                        </g>
                    );
                })}
            </g>
        </svg>
    );
}

export default BoxWhisker;
