import { Tooltip } from '@mui/material';

export default function createStatsTable(statsDict) {
    // TODO: Make statsDict a state so that the table updates whenever statsDict updates.
    function statClick() {
        return null;
        /* TODO: Add a "statClick function back in" */
    }

    return (
        <>
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
                                    <Tooltip
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
                                    </Tooltip>
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
            ;
        </>
    );
}
