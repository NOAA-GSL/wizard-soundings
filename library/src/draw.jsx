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
export function Hodograph({ soundingParam, containerDiv }) {
    // A ref for the div that D3 will manage
    const d3Container = useRef(null);

    useEffect(() => {
        // 1. A "guard clause" to prevent errors.
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

        // 2. Select the D3 container using our ref and clear any previous SVG
        //    to prevent duplicates when data updates.
        const svgContainer = d3.select(d3Container.current);
        svgContainer.selectAll('*').remove();

        // Append the new SVG
        const svghodo = svgContainer
            .append('svg')
            .attr(
                'width',
                positions.hodograph.width +
                    positions.hodograph.margin.left +
                    positions.hodograph.margin.right,
            )
            .attr(
                'height',
                positions.hodograph.height +
                    positions.hodograph.margin.top +
                    positions.hodograph.margin.bottom,
            )
            .append('g')
            .attr(
                'transform',
                `translate(${
                    (positions.hodograph.width +
                        positions.hodograph.margin.left +
                        positions.hodograph.margin.right) /
                    2
                },${
                    (positions.hodograph.height +
                        positions.hodograph.margin.top +
                        positions.hodograph.margin.bottom) /
                    2
                })`,
            );

        const hodogroup = svghodo.append('g').attr('class', 'hodo');
        const hodoRadius = Math.min(positions.hodograph.width, positions.hodograph.height) / 2;

        // Draw hodograph background (circles and labels)
        function drawBackground() {
            // console.log('drawBackground');
            // const maxWind = d3.max(soundingParam.flat(), (d) => d.twnd) || 80;
            // console.log(maxWind);
            // const rDomain = Math.ceil(maxWind / 10) * 10;
            // console.log(rDomain);
            // const r = d3.scaleLinear().range([0, hodoRadius]).domain([0, rDomain]);
            const r = d3.scaleLinear().range([0, positions.hodograph.width]).domain([0, 150]);
            console.log(r);

            svghodo
                .selectAll('.circles')
                .data(d3.range(10, 80, 10))
                .enter()
                .append('circle')
                .attr('cx', 0)
                .attr('cy', 0)
                .attr('r', (d) => r(d))
                .attr('class', 'gridline');

            svghodo
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
        // Calculate total winds and directions
        // function calcWinds(d, length) {
        //     // TODO: Decide where to put this function (draw.jsx or sounding.js) and simplify/clean up code
        //     // Loop through times
        //     for (let time = 0; time < length; time++) {
        //         // Filter for u and v winds
        //         const uwnd = d.data[Object.keys(d.data)[time]].filter(
        //             (item) => item.field === 'u_isobaric',
        //         );
        //         var vwnd = d.data[Object.keys(d.data)[time]].filter(
        //             (item) => item.field === 'v_isobaric',
        //         );

        //         // Loop through members (and means)
        //         uwnd.map((val, idx) => {
        //             // Prepare data entries for total wind and wind direction
        //             const twndvals = [];
        //             var twnd = {
        //                 field: 'totalwind',
        //                 model: val.model,
        //                 mem: val.mem,
        //                 reqNum: 5,
        //                 value: twndvals,
        //             };
        //             const wnddirvals = [];
        //             const wnddir = {
        //                 field: 'winddir',
        //                 model: val.model,
        //                 mem: val.mem,
        //                 reqNum: 5,
        //                 value: wnddirvals,
        //             };
        //             d.data[Object.keys(d.data)[time]].push(twnd);
        //             d.data[Object.keys(d.data)[time]].push(wnddir);

        //             // Loop through levels
        //             for (let lev = 0; lev < val.value.length; lev++) {
        //                 // Calculate total wind for components (convert mph to kts)
        //                 var twnd = Math.sqrt(
        //                     sharp.mph2kts(val.value[lev]) ** 2 +
        //                         sharp.mph2kts(vwnd[idx].value[lev]) ** 2,
        //                 );
        //                 twndvals.push(twnd);

        //                 // Calculate directions from components (convert mph to kts)
        //                 let wnddirval =
        //                     (180 / Math.PI) *
        //                     Math.atan2(
        //                         -sharp.mph2kts(val.value[lev]),
        //                         -sharp.mph2kts(vwnd[idx].value[lev]),
        //                     );
        //                 if (wnddirval < 0) {
        //                     wnddirval += 360;
        //                 }
        //                 wnddirvals.push(wnddirval);
        //             }
        //         });

        //         // Filter for 10m u and v winds
        //         const uwnd10 = d.data[Object.keys(d.data)[time]].filter((item) => item.field === 'u10');
        //         var vwnd10 = d.data[Object.keys(d.data)[time]].filter((item) => item.field === 'v10');

        //         // Loop through members (and means)
        //         uwnd10.map((val, idx) => {
        //             // Calculate and create data entry for 10m total wind
        //             const twnd10vals = Math.sqrt(
        //                 sharp.mph2kts(val.value) ** 2 + sharp.mph2kts(vwnd10[idx].value) ** 2,
        //             );
        //             const twnd10 = {
        //                 field: 'totalwind10',
        //                 model: val.model,
        //                 mem: val.mem,
        //                 reqNum: 5,
        //                 value: twnd10vals,
        //             };

        //             // Calculate and create data entry for 10m wind directions
        //             let wnddir10vals =
        //                 (180 / Math.PI) *
        //                 Math.atan2(-sharp.mph2kts(val.value), -sharp.mph2kts(vwnd10[idx].value));
        //             if (wnddir10vals < 0) {
        //                 wnddir10vals += 360;
        //             }
        //             const wnddir10 = {
        //                 field: 'winddir10',
        //                 model: val.model,
        //                 mem: val.mem,
        //                 reqNum: 5,
        //                 value: wnddir10vals,
        //             };

        //             // Push entries to main data
        //             d.data[Object.keys(d.data)[time]].push(twnd10);
        //             d.data[Object.keys(d.data)[time]].push(wnddir10);
        //         });
        //     }
        // }
        // Draw the actual hodograph plot
        function draw(alldata) {
            // animationSpeed, chartOptions
            const maxWind = d3.max(alldata.flat(), (d) => d.twnd) || 80;
            const rDomain = Math.ceil(maxWind / 10) * 10;
            const chartOptions = {};
            chartOptions.x2dGraphStyle = 'mean';
            const r = d3.scaleLinear().range([0, hodoRadius]).domain([0, rDomain]);

            const hodoline = d3
                .lineRadial()
                .radius((d) => r(d.twnd))
                .angle((d) => (d.wdir + 180) * (Math.PI / 180));

            const meanmember = alldata.filter((d) => d.length > 0 && d[0].mem === 'grandensemble');
            //const meanmember = alldata.filter((d) => d.mem === 'grandensemble');
            console.log('mean member');
            console.log(meanmember);

            // Update the hodograph lines mean
            console.log(chartOptions.x2dGraphStyle);
            const segmentConfig = [
                { maxHeight: 3000, color: 'blue' },
                { maxHeight: 8000, color: 'green' },
                { maxHeight: Infinity, color: 'red' }, // 'Infinity' catches everything else
            ];

            const segments = []; // This will hold the final data arrays for each path
            const segmentColors = []; // This will hold the corresponding colors
            let minHeight = -Infinity; // Tracks the *start* height for the current segment
            let lastPoint = null; // Tracks the overlap point from the previous segment

            // Loop through the configuration
            segmentConfig.forEach((config) => {
                const { maxHeight } = config;

                // 1. Filter the main data to get points for this segment
                const currentSegment = meanmember[0].filter(
                    (d) => d.hght >= minHeight && d.hght < maxHeight,
                );

                // 2. Add the overlap point (the "handoff") from the previous segment
                if (lastPoint && currentSegment.length > 0) {
                    currentSegment.unshift(lastPoint);
                }

                // 3. If this segment has data, save it
                if (currentSegment.length > 0) {
                    segments.push(currentSegment);
                    segmentColors.push(config.color);

                    // 4. Save the last point of *this* segment for the *next* segment
                    lastPoint = currentSegment[currentSegment.length - 1];
                }

                // 5. Set the starting height for the next loop
                minHeight = maxHeight;
            });

            //const segment1Data = meanmember[0].filter((d) => d.hght < 3000);
            //const segment2Data = meanmember[0].filter((d) => d.hght >= 3000 && d.hght < 8000);
            //const segment3Data = meanmember[0].filter((d) => d.hght >= 8000);

            // 2. JOIN AN ARRAY OF THOSE SEGMENTS
            //const segments = [segment1Data, segment2Data, segment3Data];
            //const segmentColors = ['blue', 'green', 'red'];

            // We select by a new class, '.hodo-segment'

            if (chartOptions.x2dGraphStyle === 'mean') {
                const hodoSegments = hodogroup.selectAll('.hodoline.mean').data(segments); // Data is: [ [segment1_points], [segment2_points] ]
                hodoSegments
                    .enter()
                    .append('path')
                    .merge(hodoSegments)
                    .attr('class', 'hodoline mean')
                    .style('stroke', (d, i) => {
                        // 'd' is the segment data ([segment_points])
                        // 'i' is the index (0 or 1)
                        return segmentColors[i]; // 1st segment is blue, 2nd is red
                    })
                    .attr('d', hodoline); // 'hodoline' is called ONCE for each segment

                hodoSegments.exit().remove();

                const hodoLines = hodogroup.selectAll('.hodoline.member').data(alldata);
                // hodoLines
                //     .enter()
                //     .append('path')
                //     .merge(hodoLines)
                //     .transition()
                //     // .duration(animationSpeed)
                //     .attr('class', 'hodoline member')
                //     // (d, i) =>
                //     // i < alldata.length - 1 ? 'hodoline member' : 'hodoline mean',
                //     // )
                //     .style('stroke', null) // Clear inline styles from previous (segment) renders
                //     .attr('d', hodoline);
                // hodoLines
                //     .enter()
                //     .append('path')
                //     .merge(hodoLines)
                //     .attr('class', 'hodoline mean')
                //     .attr('d', hodoline);
                const mergedHodoLines = hodoLines.enter().append('path').merge(hodoLines);
                mergedHodoLines
                    .on('mouseover', (event, d) => {
                        // **NEW**: Get the member ID and log it
                        const memberId = d[0].mem;
                        console.log('Hovering member:', memberId);
                        // In the future, you would call your shared function here
                        // highlightOtherPlots(memberId);
                        d3.select(event.currentTarget)
                            .raise() // Bring to front
                            .style('opacity', 1.0)
                            .style('stroke-width', '3px')
                            .style('stoke', 'yellow');
                    })
                    .on('mouseout', (event, d) => {
                        // **NEW**: Get the member ID for 'un-highlighting'
                        const memberId = d[0].mem;
                        // In the future, you would call your shared function here
                        // unHighlightOtherPlots(memberId);
                        d3.select(event.currentTarget)
                            .lower() // Send to back
                            .style('opacity', 0.3) // Return to original
                            .style('stroke-width', '1.5px'); // Return to original
                    });

                // Now, apply attributes and transitions
                mergedHodoLines
                    .transition()
                    .attr('class', 'hodoline member')
                    .style('stroke', 'gray')
                    .style('opacity', 0.3)
                    .style('stroke-width', '1.5px') // **NEW**: Set a base width
                    .style('fill', 'none') // <-- **FIX 1: Remove fill**
                    .style('pointer-events', 'stroke')
                    .attr('d', hodoline);

                hodoLines.exit().remove();
            }
        }

        if (soundingParam.length > 0) {
            drawBackground();
            draw(soundingParam);
        }
    }, [soundingParam, containerDiv]);

    // 4. The component now returns a single div with the ref that D3 uses.
    //    The stray `ref={hodographDiv}` has also been removed.
    return <div id="hodobox" className="hodobox" ref={d3Container} />;
}
