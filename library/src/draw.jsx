export default function createStatsTable(statsDict) {
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
                                    {/* TODO: Add a "statClick function back in" */}
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
                                            {/* TODO: Remove calculateStatsVector and use vector objects instead. Stats are precalculated by the sounding object
                                            and passed here as statsDict. Do this for all calculateStatsVector occurrences in this file. */}
                                            {calculateStatsVector(
                                                cape.momentumTransferVectorMax?.map((x) => x[0]),
                                                cape.momentumTransferVectorMax?.map((x) => x[1]),
                                            ).mag.toFixed(1)}
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
                                        {`${calculateStatsVector(cape.mw1u, cape.mw1v).drx.toFixed(
                                            0,
                                        )}/${calculateStatsVector(cape.mw1u, cape.mw1v).mag.toFixed(
                                            0,
                                        )}`}
                                    </td>
                                    <td className="noClick">
                                        {`${calculateStatsVector(
                                            cape.srw1u,
                                            cape.srw1v,
                                        ).drx.toFixed(0)}/${calculateStatsVector(
                                            cape.srw1u,
                                            cape.srw1v,
                                        ).mag.toFixed(0)}`}
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
                                        {`${calculateStatsVector(cape.mw3u, cape.mw3v).drx.toFixed(
                                            0,
                                        )}/${calculateStatsVector(cape.mw3u, cape.mw3v).mag.toFixed(
                                            0,
                                        )}`}
                                    </td>
                                    <td className="noClick">
                                        {`${calculateStatsVector(
                                            cape.srw3u,
                                            cape.srw3v,
                                        ).drx.toFixed(0)}/${calculateStatsVector(
                                            cape.srw3u,
                                            cape.srw3v,
                                        ).mag.toFixed(0)}`}
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
                                        {`${calculateStatsVector(
                                            cape.effwu,
                                            cape.effwv,
                                        ).drx.toFixed(0)}/${calculateStatsVector(
                                            cape.effwu,
                                            cape.effwv,
                                        ).mag.toFixed(0)}`}
                                    </td>
                                    <td className="noClick">
                                        {`${calculateStatsVector(
                                            cape.srweffu,
                                            cape.srweffv,
                                        ).drx.toFixed(0)}/${calculateStatsVector(
                                            cape.srweffu,
                                            cape.srweffv,
                                        ).mag.toFixed(0)}`}
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
                                        {`${calculateStatsVector(cape.mw6u, cape.mw6v).drx.toFixed(
                                            0,
                                        )}/${calculateStatsVector(cape.mw6u, cape.mw6v).mag.toFixed(
                                            0,
                                        )}`}
                                    </td>
                                    <td className="noClick">
                                        {`${calculateStatsVector(
                                            cape.srw6u,
                                            cape.srw6v,
                                        ).drx.toFixed(0)}/${calculateStatsVector(
                                            cape.srw6u,
                                            cape.srw6v,
                                        ).mag.toFixed(0)}`}
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
                                        {`${calculateStatsVector(cape.mw8u, cape.mw8v).drx.toFixed(
                                            0,
                                        )}/${calculateStatsVector(cape.mw8u, cape.mw8v).mag.toFixed(
                                            0,
                                        )}`}
                                    </td>
                                    <td className="noClick">
                                        {`${calculateStatsVector(
                                            cape.srw8u,
                                            cape.srw8v,
                                        ).drx.toFixed(0)}/${calculateStatsVector(
                                            cape.srw8u,
                                            cape.srw8v,
                                        ).mag.toFixed(0)}`}
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
                                        {`${calculateStatsVector(
                                            cape.ellclwu,
                                            cape.ellclwv,
                                        ).drx.toFixed(0)}/${calculateStatsVector(
                                            cape.ellclwu,
                                            cape.ellclwv,
                                        ).mag.toFixed(0)}`}
                                    </td>
                                    <td className="noClick">
                                        {`${calculateStatsVector(
                                            cape.srwellclu,
                                            cape.srwellclv,
                                        ).drx.toFixed(0)}/${calculateStatsVector(
                                            cape.srwellclu,
                                            cape.srwellclv,
                                        ).mag.toFixed(0)}`}
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
                                        {`${calculateStatsVector(
                                            cape.ebwdu,
                                            cape.ebwdv,
                                        ).drx.toFixed(0)}/${calculateStatsVector(
                                            cape.ebwdu,
                                            cape.ebwdv,
                                        ).mag.toFixed(0)}`}
                                    </td>
                                    <td className="noClick">
                                        {`${calculateStatsVector(
                                            cape.srwebwdu,
                                            cape.srwebwdv,
                                        ).drx.toFixed(0)}/${calculateStatsVector(
                                            cape.srwebwdu,
                                            cape.srwebwdv,
                                        ).mag.toFixed(0)}`}
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
                                            {`${calculateStatsVector(
                                                cape.srw46u,
                                                cape.srw46v,
                                            ).drx.toFixed(0)}/${calculateStatsVector(
                                                cape.srw46u,
                                                cape.srw46v,
                                            ).mag.toFixed(0)}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="noClick">
                                            Bunkers Right ={' '}
                                            {`${calculateStatsVector(
                                                cape.rstu,
                                                cape.rstv,
                                            ).drx.toFixed(0)}/${calculateStatsVector(
                                                cape.rstu,
                                                cape.rstv,
                                            ).mag.toFixed(0)}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="noClick">
                                            Bunkers Left ={' '}
                                            {`${calculateStatsVector(
                                                cape.lstu,
                                                cape.lstv,
                                            ).drx.toFixed(0)}/${calculateStatsVector(
                                                cape.lstu,
                                                cape.lstv,
                                            ).mag.toFixed(0)}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="noClick">
                                            Corfidi Upshear ={' '}
                                            {`${calculateStatsVector(
                                                cape.upu,
                                                cape.upv,
                                            ).drx.toFixed(0)}/${calculateStatsVector(
                                                cape.upu,
                                                cape.upv,
                                            ).mag.toFixed(0)}`}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="noClick">
                                            Corfidi Downshear ={' '}
                                            {`${calculateStatsVector(
                                                cape.dnu,
                                                cape.dnv,
                                            ).drx.toFixed(0)}/${calculateStatsVector(
                                                cape.dnu,
                                                cape.dnv,
                                            ).mag.toFixed(0)}`}
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
