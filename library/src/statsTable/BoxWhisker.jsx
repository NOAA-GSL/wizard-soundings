import { useMemo } from 'react';
import * as d3 from 'd3';
import './BoxWhisker.css';

function BoxWhisker({
    data = [],
    width = 600,
    height = 400,
    margin = { top: 20, right: 30, bottom: 40, left: 50 },
    orientation = 'horizontal',
}) {
    // Calculate inner dimensions
    const isHoriz = orientation === 'horizontal';
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Memoize the D3 scales so they only recalculate when data/dimensions change
    const { linearScale, bandScale } = useMemo(() => {
        // Handle empty data safely
        const hasData = Array.isArray(data) && data.length > 0;

        // Y Scale: Categorical data (Names)
        const minVal = hasData ? d3.min(data, (d) => d.whisker1) : 0;
        const maxVal = hasData ? d3.max(data, (d) => d.whisker2) : 1;

        const linear = d3.scaleLinear().domain([minVal, maxVal]);
        if (hasData) linear.nice();

        const band = d3
            .scaleBand()
            .domain(hasData ? data.map((d) => d.name) : [])
            .padding(0.1);

        // Assign ranges based on orientation
        if (isHoriz) {
            linear.range([0, innerWidth]);
            band.range([innerHeight, 0]);
        } else {
            // Vertical: SVG Y goes top-to-bottom, so lower values = higher Y coordinate
            linear.range([innerHeight, 0]);
            band.range([0, innerWidth]);
        }

        return { linearScale: linear, bandScale: band };
    }, [data, innerWidth, innerHeight, isHoriz]);

    // Return early if no data to render (hooks are already called)
    if (!data || data.length === 0) return null;

    // Generate tick values for the X-axis
    const ticks = linearScale.ticks(4);

    return (
        <svg
            width={width}
            height={height}
            className="box-whisker-container"
            aria-label="Box and whisker plot"
        >
            <g transform={`translate(${margin.left},${margin.top})`}>
                <g className="value-axis" transform="translate(0,0)">
                    {ticks.map((tickValue, i) => {
                        const pos = linearScale(tickValue);
                        return (
                            <g
                                key={i}
                                className="axis-tick"
                                transform={isHoriz ? `translate(${pos},0)` : `translate(0,${pos})`}
                            >
                                {/* Grid Line */}
                                <line
                                    x1={0}
                                    y1={0}
                                    x2={isHoriz ? 0 : innerWidth}
                                    y2={isHoriz ? innerHeight : 0}
                                    className="axis-line"
                                    strokeDasharray="4 4"
                                />
                                {/* Label */}
                                <text
                                    x={isHoriz ? 0 : -10}
                                    y={isHoriz ? innerHeight + 20 : 4}
                                    textAnchor={isHoriz ? 'middle' : 'end'}
                                >
                                    {tickValue}
                                </text>
                            </g>
                        );
                    })}
                </g>

                {/* --- Data Marks --- */}
                {data.map((d) => {
                    // Map data to pixels based on scale
                    const w1 = linearScale(d.whisker1);
                    const b1 = linearScale(d.box1);
                    const med = linearScale(d.median);
                    const b2 = linearScale(d.box2);
                    const w2 = linearScale(d.whisker2);

                    const bandPos = bandScale(d.name);
                    const bw = bandScale.bandwidth();
                    const bandCenter = bandPos + bw / 2;

                    // Compute dynamic coordinates
                    // For vertical, b2 (higher value) has a SMALLER Y-coordinate.
                    const rectX = isHoriz ? b1 : bandPos;
                    const rectY = isHoriz ? bandPos : b2;
                    const rectWidth = isHoriz ? Math.max(0, b2 - b1) : bw;
                    const rectHeight = isHoriz ? bw : Math.max(0, b1 - b2);

                    // Whisker 1 (Lower) Math (3px thick)
                    const w1Width = isHoriz ? Math.max(0, b1 - w1) : 3;
                    const w1Height = isHoriz ? 3 : Math.max(0, w1 - b1);
                    const w1X = isHoriz ? w1 : bandCenter - 1.5;
                    const w1Y = isHoriz ? bandCenter - 1.5 : b1;

                    // Whisker 2 (Upper) Math (3px thick)
                    const w2Width = isHoriz ? Math.max(0, w2 - b2) : 3;
                    const w2Height = isHoriz ? 3 : Math.max(0, b2 - w2);
                    const w2X = isHoriz ? b2 : bandCenter - 1.5;
                    const w2Y = isHoriz ? bandCenter - 1.5 : w2;

                    // Median Line Math (4px thick)
                    const medX = isHoriz ? med - 2 : rectX;
                    const medY = isHoriz ? rectY : med - 2;
                    const medWidth = isHoriz ? 4 : rectWidth;
                    const medHeight = isHoriz ? rectHeight : 4;

                    return (
                        <g key={`mark-${d}`} className="data-row">
                            {/* Whisker 1 (Lower) */}
                            <rect
                                x={w1X}
                                y={w1Y}
                                width={w1Width}
                                height={w1Height}
                                className="whisker-rect"
                            />
                            {/* Whisker 2 (Upper) */}
                            <rect
                                x={w2X}
                                y={w2Y}
                                width={w2Width}
                                height={w2Height}
                                className="whisker-rect"
                            />
                            {/* Main Box */}
                            <rect
                                x={rectX}
                                y={rectY}
                                width={rectWidth}
                                height={rectHeight}
                                className="box-rect"
                            />
                            {/* Median Line */}
                            <rect
                                x={medX}
                                y={medY}
                                width={medWidth}
                                height={medHeight}
                                className="median-rect"
                            />
                            {/* Data points (Foci) */}
                            {[w1, b1, b2, w2].map((val, idx) => {
                                const cx = isHoriz ? val : bandCenter;
                                const cy = isHoriz ? bandCenter : val;
                                return (
                                    <circle
                                        key={`focus-${idx}`}
                                        className="focus-circle"
                                        r={4}
                                        transform={`translate(${cx}, ${cy})`}
                                    />
                                );
                            })}
                        </g>
                    );
                })}
            </g>
        </svg>
    );
}

export default BoxWhisker;
