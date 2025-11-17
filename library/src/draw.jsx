// import { Tooltip } from '@mui/material';
// import '../dist/desi-soundings.css';
import 'desi-soundings/draw.scss';
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';

export function StatsTable({ statsDictParam }) {
    const statsDict = statsDictParam;

    function statClick() {
        return null;
        /* TODO: Add a "statClick function back in" */
    }

    // function updateStats(newStatsDict) {
    //    setStatsDict(newStatsDict);
    // }

    if (statsDict === null) {
        return null;
    }

    for (const key in statsDict) {
        if (statsDict[key] === null) {
            statsDict[key] = NaN;
        }
    }

    return (
        <div id="statsContainer">
            <div id="meteostats" className="meteostats">
                <div className="statscolumn">
                    <table id="parcelstats">
                        <tbody>
                            <tr>
                                <th>PCL</th>
                                <th>CAPE</th>
                                <th>CINH</th>
                                <th>LCL</th>
                                <th>LI</th>
                                <th>LFC</th>
                                <th>EL</th>
                            </tr>
                            <tr>
                                <th>SFC</th>

                                <td onClick={(event) => statClick('sfcCAPE', event)}>
                                    {statsDict.sfcCAPE.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('sfcCINH', event)}>
                                    {statsDict.sfcCINH.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('sfcLCL', event)}>
                                    {statsDict.sfcLCL.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('sfcLI', event)}>
                                    {statsDict.sfcLI.toFixed(1)}
                                </td>
                                <td onClick={(event) => statClick('sfcLFC', event)}>
                                    {statsDict.sfcLFC.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('sfcEL', event)}>
                                    {statsDict.sfcEL.toFixed(0)}
                                </td>
                            </tr>
                            <tr>
                                <th>ML</th>
                                <td onClick={(event) => statClick('mlCAPE', event)}>
                                    {statsDict.mlCAPE.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('mlCINH', event)}>
                                    {statsDict.mlCINH.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('mlLCL', event)}>
                                    {statsDict.mlLCL.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('mlLI', event)}>
                                    {statsDict.mlLI.toFixed(1)}
                                </td>
                                <td onClick={(event) => statClick('mlLFC', event)}>
                                    {statsDict.mlLFC.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('mlEL', event)}>
                                    {statsDict.mlEL.toFixed(0)}
                                </td>
                            </tr>
                            <tr>
                                <th>MU</th>
                                <td onClick={(event) => statClick('muCAPE', event)}>
                                    {statsDict.muCAPE.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('muCINH', event)}>
                                    {statsDict.muCINH.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('muLCL', event)}>
                                    {statsDict.muLCL.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('muLI', event)}>
                                    {statsDict.muLI.toFixed(1)}
                                </td>
                                <td onClick={(event) => statClick('muLFC', event)}>
                                    {statsDict.muLFC.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('muEL', event)}>
                                    {statsDict.muEL.toFixed(0)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table id="thermostats">
                        <tbody>
                            <tr>
                                <td onClick={(event) => statClick('pw', event)}>
                                    PW = {statsDict.pw.toFixed(2)}
                                </td>
                                <td onClick={(event) => statClick('kIndex', event)}>
                                    K = {statsDict.kIndex.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('wndg', event)}>
                                    WNDG = {statsDict.wndg.toFixed(1)}
                                </td>
                                <td onClick={(event) => statClick('meanMR', event)}>
                                    MeanW = {statsDict.meanMR.toFixed(1)}
                                </td>
                                <td onClick={(event) => statClick('tTotals', event)}>
                                    TT = {statsDict.tTotals.toFixed(0)}
                                </td>
                            </tr>
                            <tr>
                                <td onClick={(event) => statClick('tei', event)}>
                                    TEI = {statsDict.tei.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('lowRH', event)}>
                                    lowRH = {statsDict.lowRH.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('midRH', event)}>
                                    midRH = {statsDict.midRH.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('cTemp', event)}>
                                    convT = {statsDict.cTemp.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('mlcape3', event)}>
                                    3CAPE = {statsDict.mlcape3.toFixed(0)}
                                </td>
                            </tr>
                            <tr>
                                <td onClick={(event) => statClick('maxT', event)}>
                                    maxT = {statsDict.maxT.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('mburst', event)}>
                                    MBURST = {statsDict.mburst.toFixed(1)}
                                </td>
                                <td onClick={(event) => statClick('dcape', event)}>
                                    dCAPE = {statsDict.dcape.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('esp', event)}>
                                    ESP = {statsDict.esp.toFixed(2)}
                                </td>
                                <td onClick={(event) => statClick('downT', event)}>
                                    downT = {statsDict.downT.toFixed(1)}
                                </td>
                            </tr>
                            <tr>
                                <td onClick={(event) => statClick('mmp', event)}>
                                    MMP = {statsDict.mmp.toFixed(2)}
                                </td>
                                <td onClick={(event) => statClick('sigsvr', event)}>
                                    SigSvr = {statsDict.sigsvr.toFixed(0)}
                                </td>
                                {/* <Tooltip
                                        enterDelay={750}
                                        title={
                                            'Momentum transfer wind gusts\nCalculated via Cook and Williams method, which takes the mean wind vector through depth of PBL'
                                        }
                                        placement="top"
                                        disableInteractive
                                    >
                                        <td
                                            onClick={(event) =>
                                                statClick('momentumTransferMag', event)
                                            }
                                        >
                                            Mean MT ={' '}
                                            {statsDict.momentumTransferVector.mag.toFixed(1)}
                                        </td>
                                    </Tooltip>
                                    <Tooltip
                                        enterDelay={750}
                                        title={
                                            'Momentum transfer wind gusts\nCalculated by taking the max wind within the PBL and bringing it to the surface'
                                        }
                                        placement="top"
                                        disableInteractive
                                    >
                                        <td
                                            onClick={(event) =>
                                                statClick('momentumTransferMagMax', event)
                                            }
                                        >
                                            Max MT ={' '}
                                            {statsDict.momentumTransferVectorMax.mag.toFixed(1)}
                                        </td>
                                    </Tooltip>
                                    <Tooltip
                                        enterDelay={750}
                                        title={
                                            'PBL depth calculated using\nvirtual temperature profile\nPBL Top defined as the first level at which Tv >= 0.5+Tv,sfc'
                                        }
                                        placement="top"
                                        disableInteractive
                                    >
                                        <td onClick={(event) => statClick('pblDepth', event)}>
                                            PBL Top = {statsDict.pblDepth.toFixed(1)}
                                        </td>
                                    </Tooltip> */}
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="statscolumn">
                    <table id="windstats">
                        <tbody>
                            <tr>
                                <th>Layer</th>
                                <th>SRH</th>
                                <th>Shear</th>
                                <th>MnWind</th>
                                <th>SRW</th>
                            </tr>
                            <tr>
                                <th>SFC-1km</th>
                                <td onClick={(event) => statClick('right_srh1km', event)}>
                                    {statsDict.right_srh1km.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('sfc1kmshr', event)}>
                                    {statsDict.sfc1kmshr.toFixed(0)}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.mw1Vector.drx.toFixed(
                                        0,
                                    )}/${statsDict.mw1Vector.mag.toFixed(0)}`}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.srw1Vector.drx.toFixed(0)}/${statsDict.srw1Vector.mag.toFixed(0)}`}
                                </td>
                            </tr>
                            <tr>
                                <th>SFC-3km</th>
                                <td onClick={(event) => statClick('right_srh3km', event)}>
                                    {statsDict.right_srh3km.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('sfc3kmshr', event)}>
                                    {statsDict.sfc3kmshr.toFixed(0)}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.mw3Vector.drx.toFixed(
                                        0,
                                    )}/${statsDict.mw3Vector.mag.toFixed(0)}`}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.srw3Vector.drx.toFixed(0)}/${statsDict.srw3Vector.mag.toFixed(0)}`}
                                </td>
                            </tr>
                            <tr>
                                <th>Eff Inflow Layer</th>
                                <td onClick={(event) => statClick('right_srheff', event)}>
                                    {statsDict.right_srheff.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('effshr', event)}>
                                    {statsDict.effshr.toFixed(0)}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.effwVector.drx.toFixed(0)}/${statsDict.effwVector.mag.toFixed(0)}`}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.srweffVector.drx.toFixed(0)}/${statsDict.srweffVector.mag.toFixed(0)}`}
                                </td>
                            </tr>
                            <tr>
                                <th>SFC-6km</th>
                                <td onClick={(event) => statClick('right_srh6km', event)}>
                                    {statsDict.right_srh6km.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('sfc6kmshr', event)}>
                                    {statsDict.sfc6kmshr.toFixed(0)}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.mw6Vector.drx.toFixed(
                                        0,
                                    )}/${statsDict.mw6Vector.mag.toFixed(0)}`}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.srw6Vector.drx.toFixed(0)}/${statsDict.srw6Vector.mag.toFixed(0)}`}
                                </td>
                            </tr>
                            <tr>
                                <th>SFC-8km</th>
                                <td onClick={(event) => statClick('right_srh1km', event)}>
                                    {statsDict.right_srh1km.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('sfc8kmshr', event)}>
                                    {statsDict.sfc8kmshr.toFixed(0)}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.mw8Vector.drx.toFixed(
                                        0,
                                    )}/${statsDict.mw8Vector.mag.toFixed(0)}`}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.srw8Vector.drx.toFixed(0)}/${statsDict.srw8Vector.mag.toFixed(0)}`}
                                </td>
                            </tr>
                            <tr>
                                <th>LCL-EL (Cloud Layer)</th>
                                <td onClick={(event) => statClick('right_srhlclel', event)}>
                                    {statsDict.right_srhlclel.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('ellclshr', event)}>
                                    {statsDict.ellclshr.toFixed(0)}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.ellclwVector.drx.toFixed(0)}/${statsDict.ellclwVector.mag.toFixed(0)}`}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.srwellclVector.drx.toFixed(0)}/${statsDict.srwellclVector.mag.toFixed(0)}`}
                                </td>
                            </tr>
                            <tr>
                                <th>Eff Shear (EBWD)</th>
                                <td onClick={(event) => statClick('right_srhebwd', event)}>
                                    {statsDict.right_srhebwd.toFixed(0)}
                                </td>
                                <td onClick={(event) => statClick('ebwdshr', event)}>
                                    {statsDict.ebwdshr.toFixed(0)}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.ebwdVector.drx.toFixed(0)}/${statsDict.ebwdVector.mag.toFixed(0)}`}
                                </td>
                                <td className="noClick">
                                    {`${statsDict.srwebwdVector.drx.toFixed(0)}/${statsDict.srwebwdVector.mag.toFixed(0)}`}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="statscolumn">
                    <div id="firsthalf">
                        <table id="morewindstats">
                            <tbody>
                                <tr>
                                    <td onClick={(event) => statClick('brnShear', event)}>
                                        BRN Shear = {statsDict.brnShear.toFixed(0)}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="noClick">
                                        4-6 km SR Wind ={' '}
                                        {`${statsDict.srw46Vector.drx.toFixed(0)}/${statsDict.srw46Vector.mag.toFixed(0)}`}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="noClick">
                                        Bunkers Right ={' '}
                                        {`${statsDict.rstVector.drx.toFixed(0)}/${statsDict.rstVector.mag.toFixed(0)}`}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="noClick">
                                        Bunkers Left ={' '}
                                        {`${statsDict.lstVector.drx.toFixed(0)}/${statsDict.lstVector.mag.toFixed(0)}`}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="noClick">
                                        Corfidi Upshear ={' '}
                                        {`${statsDict.upVector.drx.toFixed(0)}/${statsDict.upVector.mag.toFixed(0)}`}
                                    </td>
                                </tr>
                                <tr>
                                    <td className="noClick">
                                        Corfidi Downshear ={' '}
                                        {`${statsDict.dnVector.drx.toFixed(0)}/${statsDict.dnVector.mag.toFixed(0)}`}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {/*
                        <div id="secondhalf">
                            <div id="ptypediv"></div>
                        </div>
                        */}
                </div>
            </div>
        </div>
    );
}
export function Hodograph({ soundingParam, statsDictParam, containerDiv }) {
    const d3Container = useRef(null);

    useEffect(() => {
        //    Don't do anything if we don't have data or the container ref.
        if (!soundingParam || !containerDiv.current) {
            console.log('No data and/or container ref for hodograph');
            return;
        }
        console.log('Calculating hodograph!');

        // --- D3 Drawing Logic ---

        // Function to calculate dimensions based on the parent container
        function calcPositions() {
            const hodomargin = 25;
            const hodographMargin = {
                top: hodomargin,
                bottom: hodomargin,
                left: hodomargin,
                right: hodomargin,
            };
            // Use the passed containerDiv for sizing
            const height =
                containerDiv.current.clientHeight - hodographMargin.top - hodographMargin.bottom;
            const width =
                containerDiv.current.clientWidth - hodographMargin.left - hodographMargin.right;

            return {
                hodograph: {
                    height,
                    width,
                    margin: hodographMargin,
                },
            };
        }

        const positions = calcPositions();

        const totalWidth =
            positions.hodograph.width +
            positions.hodograph.margin.left +
            positions.hodograph.margin.right;
        const totalHeight =
            positions.hodograph.height +
            positions.hodograph.margin.top +
            positions.hodograph.margin.bottom;

        // Select the D3 container using our ref and clear any previous SVG
        // to prevent duplicates when data updates.
        const svgContainer = d3.select(d3Container.current);
        svgContainer.selectAll('*').remove();

        // Setup svg groups and transforms
        const svgRoot = svgContainer
            .append('svg')
            .attr('width', totalWidth)
            .attr('height', totalHeight);

        const svghodo = svgRoot.append('g');
        const centeringTransform = `translate(${totalWidth / 2},${totalHeight / 2})`;
        const hodoRadius = Math.min(positions.hodograph.width, positions.hodograph.height) / 2;

        const hodogroup = svghodo
            .append('g')
            .attr('class', 'hodo')
            .attr('transform', centeringTransform);
        const hodoBackgroundGroup = svghodo
            .append('g')
            .attr('class', 'hodo')
            .attr('transform', centeringTransform);

        // Setup zoom/pan
        function zoomed(event) {
            svghodo.attr('transform', event.transform);
        }
        const zoom = d3
            .zoom()
            .scaleExtent([0.5, 10])
            .translateExtent([
                [0, 0], // [x0, y0] - top-left limit
                [totalWidth, totalHeight], // [x1, y1] - bottom-right limit
            ])
            .on('zoom', zoomed);
        svgRoot.call(zoom);

        // Setup tooltip
        const tooltip = d3
            .select('body')
            .append('div')
            .attr('class', 'hodo-tooltip') // For styling
            .style('opacity', 0); // Start hidden

        // Draw hodograph background (circles and labels)
        function drawBackground() {
            const r = d3.scaleLinear().range([0, positions.hodograph.width]).domain([0, 150]);
            console.log(r);

            hodoBackgroundGroup
                .selectAll('.circles')
                .data(d3.range(10, 80, 10))
                .enter()
                .append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', (d) => r(d))
                .attr('class', 'gridline');

            hodoBackgroundGroup
                .selectAll('hodolabels')
                .data(d3.range(10, 80, 20))
                .enter()
                .append('text')
                .attr('x', 0)
                .attr('y', (d, i) => r(d))
                .attr('dy', '0.4em')
                .attr('class', 'hodolabels')
                .attr('text-anchor', 'middle')
                .text((d) => `${d}kts`);
        }

        // Draw the actual hodograph plot
        function draw(alldata, statsDict) {
            // const maxWind = d3.max(alldata.flat(), (d) => d.twnd) || 80;
            // const rDomain = Math.ceil(maxWind / 10) * 10;
            // const r = d3.scaleLinear().range([0, hodoRadius]).domain([0, rDomain]);
            const r = d3.scaleLinear().range([0, positions.hodograph.width]).domain([0, 150]);

            // Setup groups for mean and members
            const hodoline = d3
                .lineRadial()
                .radius((d) => r(d.twnd))
                .angle((d) => (d.wdir + 180) * (Math.PI / 180));
            // .curve(d3.curveCatmullRom);

            const memberLinesGroup = hodogroup
                .selectAll('.member-lines-group')
                .data([null]) // Bind a single dummy item
                .join('g')
                .attr('class', 'member-lines-group');

            const meanLineGroup = hodogroup
                .selectAll('.mean-line-group')
                .data([null]) // Bind a single dummy item
                .join('g')
                .attr('class', 'mean-line-group');

            const meanmember = alldata.filter((d) => d.length > 0 && d[0].mem === 'grandensemble');

            // Setup segment coloring for hodograph mean line
            const segmentConfig = [
                { maxHeight: 1000, color: 'red' },
                { maxHeight: 3000, color: 'orange' },
                { maxHeight: 6000, color: 'purple' },
                { maxHeight: Infinity, color: 'blue' }, // 'Infinity' catches everything else
            ];

            const segments = [];
            const segmentColors = [];
            const majorPoints = [];
            let minHeight = -Infinity;
            let lastPoint = null;

            // Loop through the configuration
            segmentConfig.forEach((config) => {
                const { maxHeight } = config;
                const currentSegment = meanmember[0].filter(
                    (d) => d.hght >= minHeight && d.hght < maxHeight,
                );
                if (lastPoint && currentSegment.length > 0) {
                    currentSegment.unshift(lastPoint);
                }
                if (currentSegment.length > 0) {
                    segments.push(currentSegment);
                    segmentColors.push(config.color);

                    lastPoint = currentSegment[currentSegment.length - 1];
                    const firstPoint = currentSegment[0];
                    majorPoints.push(firstPoint);
                }
                minHeight = maxHeight;
            });

            // Draw ensemble member lines
            const hodoLines = memberLinesGroup.selectAll('.hodoline.member').data(alldata);
            const mergedHodoLines = hodoLines.enter().append('path').merge(hodoLines);
            mergedHodoLines
                .on('mouseover', (event, d) => {
                    const memberId = d[0].mem;
                    console.log('Hovering member:', memberId);
                    tooltip.transition().duration(50).style('opacity', 1);
                    tooltip
                        .html(memberId) // Set text
                        .style('left', `${event.pageX + 10}px`) // Position near mouse
                        .style('top', `${event.pageY - 15}px`);
                    d3.select(event.currentTarget).raise().classed('hovered', true);
                })
                .on('mousemove', (event) => {
                    tooltip
                        .style('left', `${event.pageX + 10}px`)
                        .style('top', `${event.pageY - 15}px`);
                })
                .on('mouseout', (event, d) => {
                    const memberId = d[0].mem;
                    tooltip.transition().duration(200).style('opacity', 0);
                    d3.select(event.currentTarget).lower().classed('hovered', false);
                });

            mergedHodoLines.transition().attr('class', 'hodoline member').attr('d', hodoline);
            hodoLines.exit().remove();

            // Draw mean member in multiple segments
            const hodoSegments = meanLineGroup.selectAll('.hodoline.mean').data(segments); // Data is: [ [segment1_points], [segment2_points] ]
            hodoSegments
                .enter()
                .append('path')
                .merge(hodoSegments)
                .attr('class', 'hodoline mean')
                .style('stroke', (d, i) => {
                    // 'd' is the segment data ([segment_points])
                    // 'i' is the index (0 or 1)
                    return segmentColors[i];
                })
                .attr('d', hodoline);
            hodoSegments.exit().remove();

            // Draw mean member data points
            const hodoDataPoints = meanLineGroup.selectAll('.hodo-datapoint').data(majorPoints);
            const mergedHodoDataPoints = hodoDataPoints
                .enter()
                .append('circle')
                .merge(hodoDataPoints);

            mergedHodoDataPoints
                .on('mouseover', (event, d) => {
                    const { twnd } = d;
                    const { wdir } = d;
                    const { hght } = d;
                    console.log('Wind speed: ', twnd, 'Wind Dir: ', wdir);
                    tooltip.transition().duration(50).style('opacity', 1);
                    tooltip
                        .html(
                            `Height: ${hght.toFixed(0)}<br>Spd: ${twnd.toFixed(0)}<br>Dir: ${wdir.toFixed(0)}`,
                        )
                        .style('left', `${event.pageX + 10}px`) // Position near mouse
                        .style('top', `${event.pageY - 15}px`);
                    d3.select(event.currentTarget).raise().classed('hovered', true);
                })
                .on('mousemove', (event) => {
                    tooltip
                        .style('left', `${event.pageX + 10}px`)
                        .style('top', `${event.pageY - 15}px`);
                })
                .on('mouseout', (event, d) => {
                    const { twnd } = d;
                    const { wdir } = d;
                    tooltip.transition().duration(200).style('opacity', 0);
                    d3.select(event.currentTarget).classed('hovered', false);
                });

            mergedHodoDataPoints
                .attr('class', 'hodo-datapoint')
                .attr('cx', (d) => r(d.twnd) * Math.sin((d.wdir + 180) * (Math.PI / 180)))
                .attr('cy', (d) => -r(d.twnd) * Math.cos((d.wdir + 180) * (Math.PI / 180)))
                .attr('r', 2);
            hodoDataPoints.exit().remove();

            // Draw bunkers motion points
            const bunkerPoints = meanLineGroup
                .selectAll('.hodo-bunkers')
                .data([statsDict.rstVector, statsDict.lstVector]);
            const mergedBunkerPoints = bunkerPoints.enter().append('path').merge(bunkerPoints);

            mergedBunkerPoints
                .on('mouseover', (event, d) => {
                    const { drx } = d;
                    const { mag } = d;
                    tooltip.transition().duration(50).style('opacity', 1);
                    tooltip
                        .html(`Spd: ${mag.toFixed(0)}<br>Dir: ${drx.toFixed(0)}`)
                        .style('left', `${event.pageX + 10}px`) // Position near mouse
                        .style('top', `${event.pageY - 15}px`);
                    d3.select(event.currentTarget).raise().classed('hovered', true);
                })
                .on('mousemove', (event) => {
                    tooltip
                        .style('left', `${event.pageX + 10}px`)
                        .style('top', `${event.pageY - 15}px`);
                })
                .on('mouseout', (event, d) => {
                    const { drx } = d;
                    const { mag } = d;
                    tooltip.transition().duration(200).style('opacity', 0);
                    d3.select(event.currentTarget).lower().classed('hovered', false);
                });

            const symbolGenerator = d3
                .symbol()
                .type(d3.symbolCross) // Use a star
                .size(30);

            mergedBunkerPoints
                .attr('class', 'hodo-bunkers')
                .attr('d', symbolGenerator)
                .attr('transform', (d) => {
                    // Get the x and y coordinates
                    const x = r(d.mag) * Math.sin((d.drx + 180) * (Math.PI / 180));
                    const y = -r(d.mag) * Math.cos((d.drx + 180) * (Math.PI / 180)); // Return a 'translate' string
                    return `translate(${x}, ${y})`;
                })
                //  .attr('cx', (d) => r(d.mag) * Math.sin((d.drx + 180) * (Math.PI / 180)))
                //  .attr('cy', (d) => -r(d.mag) * Math.cos((d.drx + 180) * (Math.PI / 180)))
                .attr('r', 2);
            bunkerPoints.exit().remove();
        }

        if (soundingParam.length > 0) {
            drawBackground();
            draw(soundingParam, statsDictParam);
        }
    }, [soundingParam, statsDictParam, containerDiv]);

    return <div id="hodobox" className="hodobox" ref={d3Container} />;
}
