import sharp from './Sharp';

export default class Sounding {
    constructor() {}

    updateData(d, time) {
        this.profileData = this.soundingFormat(d, time);
    }

// Preprocess data for drawing
    soundingFormat(d, time) {
    // Get data for current forecast hour
    const mydata = d.data[time];

    const obj = {};
    for (const i in mydata) {
        const { field } = mydata[i];
        const mem = mydata[i].model;

        if (!obj[mem]) obj[mem] = {};
        let { value } = mydata[i];

        if (['t2', 'd2'].includes(field)) {
            value = sharp.f2c(value);
            // value = value
        }
        if (['t_isobaric', 'dpt_isobaric'].includes(field)) {
            value = value.map((x) => sharp.f2c(x));
            // value = value.map(x => x)
        }
        if (field == 'gh_isobaric') value = value.map((x) => x * 10);
        obj[mem][field] = value;
    }

    // Sounding data for drawing
    const soundingdata = [];
    // Get pressure levels for dataset

    const ps = d.metadata.gh_isobaric.z;
    for (const mem in obj) {
        const memberdata = [];
        // console.log(obj['GEFS']['orog'])
        const orogs = obj[mem].orog;
        // Temporary values for testing LREF
        // let orogs = obj[mem]['orog']
        // let orogs = dataset != "LREF" ? obj[mem]['orog'] : 137

        const { mslp } = obj[mem];
        for (const level in ps) {
            // console.log("level",level,obj[mem]['gh_isobaric'])
            const leveldata = {
                press: ps[level],
                hght: obj[mem].gh_isobaric[level],
                temp: obj[mem].t_isobaric[level],
                dwpt: obj[mem].dpt_isobaric[level],
                uwnd: sharp.mph2kts(obj[mem].u_isobaric[level]),
                vwnd: sharp.mph2kts(obj[mem].v_isobaric[level]),
                twnd: obj[mem].totalwind[level],
                wdir: obj[mem].winddir[level],
                hghtagl: obj[mem].gh_isobaric[level] - orogs,
                orog: orogs,
                twind10: obj[mem].totalwind10,
                wdir10: obj[mem].winddir10,
                t2: obj[mem].t2,
                d2: obj[mem].d2,
                mslp,
                member: mem,
                rh2: obj[mem].rh2,
                u10: sharp.mph2kts(obj[mem].u10),
                v10: sharp.mph2kts(obj[mem].v10),
                sp: obj[mem].sp,
                mem,
            };
            memberdata.push(leveldata);
        }
        soundingdata.push(memberdata);
    }
    // Filter sounding data for points that are defined and above ground
    const filteredArrayTmp = soundingdata.map((innerArray) => {
        const filteredInnerArray = innerArray.filter(
            (obj) =>
                obj.press < obj.sp &&
                obj.hght != -9990 &&
                obj.temp < 200 &&
                obj.temp > -200 &&
                obj.dwpt < 200 &&
                obj.dwpt > -200 &&
                !isNaN(obj.temp) &&
                !isNaN(obj.dwpt),
        );
        return filteredInnerArray;
    });
    // Remove arrays that are of length zero
    let filteredArray = filteredArrayTmp.filter((array) => array.length > 0);

    // This inserts surface variables into bottom of sounding array
    filteredArray.map((innerArray) => {
        const temp = innerArray[0].t2 + 273.15;
        const dwpt = innerArray[0].d2 + 273.15;
        const twnd = innerArray[0].twind10;
        const wdir = innerArray[0].wdir10;
        const { rh2 } = innerArray[0];
        const { u10 } = innerArray[0];
        const { v10 } = innerArray[0];
        const { mslp } = innerArray[0];
        const { orog } = innerArray[0];
        const pres = innerArray[0].sp;
        const { mem } = innerArray[0];

        const insert = {
            press: pres,
            hght: orog,
            temp: temp - 273.15,
            dwpt: dwpt - 273.15,
            t2: temp - 273.15,
            d2: dwpt - 273.15,
            hghtagl: 0,
            orog,
            mslp,
            rh2,
            uwnd: u10,
            vwnd: v10,
            twind10: twnd,
            twnd,
            wdir,
            wdir10: wdir,
            mem,
        };
        innerArray.unshift(insert);
    });

    // Create profile data for calculating stats
    const profiledata = [];
    for (let i = 0; i < filteredArray.length; i++) {
        const memdata = {
            pres: [],
            hght: [],
            tmpc: [],
            dwpc: [],
            uwnd: [],
            vwnd: [],
            vtmp: [],
            hghtmsl: [],
        };
        for (let j = 0; j < filteredArray[i].length; j++) {
            memdata.mem = filteredArray[i][j].mem;
            memdata.pres.push(filteredArray[i][j].press);
            memdata.hght.push(filteredArray[i][j].hght - filteredArray[i][j].orog);
            memdata.hghtmsl.push(filteredArray[i][j].hght);
            memdata.tmpc.push(filteredArray[i][j].temp);
            memdata.dwpc.push(filteredArray[i][j].dwpt);
            memdata.uwnd.push(filteredArray[i][j].uwnd);
            memdata.vwnd.push(filteredArray[i][j].vwnd);
            memdata.vtmp.push(
                sharp.vtmp(
                    [filteredArray[i][j].temp],
                    [filteredArray[i][j].dwpt],
                    [filteredArray[i][j].press],
                )[0],
            );
        }
        profiledata.push(memdata);
        if (memdata.hght.length == 0) {
            memdata.mem.push(-999);
            memdata.pres.push(-999);
            memdata.hght.push(-999);
            memdata.tmpc.push(-999);
            memdata.dwpc.push(-999);
            memdata.uwnd.push(-999);
            memdata.vwnd.push(-999);
            memdata.vtmp.push(-999);
            memdata.hghtmsl.push(-999);
        }
    }

        return profiledata;
}

// Calculate thermo statistics
    sharpStats(profile) {
    // Most unstable pressure
        console.log(profile);
    const mupclpres = sharp.mostUnstableLayer(profile);

    // Most unstable temperature
    const mupcltmpc = sharp.interp([mupclpres], profile.pres, profile.tmpc)[0];

    // Most unstable dewpoint
    const mupcldwpc = sharp.interp([mupclpres], profile.pres, profile.dwpc)[0];

    // Most unstable thermo stuff
    const [muCAPE, muCINH, muLCL, muLI, muLFC, muEL, mucape3, muptrace, muttrace] = sharp.CAPE(
        profile,
        mupcltmpc,
        mupcldwpc,
        mupclpres,
    );
    // Surface thermo stuff
    const [sfcCAPE, sfcCINH, sfcLCL, sfcLI, sfcLFC, sfcEL, sfccape3, sfcptrace, sfcttrace] =
        sharp.CAPE(profile, profile.tmpc[0], profile.dwpc[0], profile.pres[0]);
    // Mixed layer temperature
    const mltmpc = sharp.meanTheta(profile);

    // Mixed layer dewpoint
    const mldwpc = sharp.meanMR(profile)[1];

    // Mixed layer thermo stuff
    const [mlCAPE, mlCINH, mlLCL, mlLI, mlLFC, mlEL, mlcape3, mlptrace, mlttrace] = sharp.CAPE(
        profile,
        mltmpc,
        mldwpc,
        profile.pres[0],
    );

    // Precipitable water
    const pw = sharp.precipWater(profile);

    // Theta-e index
    const tei = sharp.tei(profile);

    // Downward convective available potential energy
    const [dcape, downT] = sharp.dCAPE(profile);

    // K-index
    const kIndex = sharp.kIndex(profile);

    // Total totals
    const tTotals = sharp.tTotals(profile);

    // Wind damage parameter
    const wndg = sharp.wndg(profile, mlCAPE, mlCINH);

    // Mean mixing ratio
    const meanMR = sharp.meanMR(profile)[0];

    // Convective temperature
    const cTemp = sharp.convectiveTemp(profile);

    // Maximum forecast surface temp
    const maxT = sharp.maxT(profile);

    // Microburst composite index
    const mburst = sharp.mburst(profile, pw, dcape, tei, sfcCAPE, sfcLI);

    // Enhanced stretching potential
    const esp = sharp.esp(profile, mlcape3, mlCAPE);

    // MCS Maintenance Probability
    const mmp = sharp.mmp(profile, muCAPE);

    // Pressure at 1km
    const p1km = sharp.interpHght(sharp.toMSL(profile.hght, 1000), profile.hght, profile.pres);

    // Pressure at 3km
    const p3km = sharp.interpHght(sharp.toMSL(profile.hght, 3000), profile.hght, profile.pres);

    // Pressure at 4km
    const p4km = sharp.interpHght(sharp.toMSL(profile.hght, 4000), profile.hght, profile.pres);

    // Pressure at 6km
    const p6km = sharp.interpHght(sharp.toMSL(profile.hght, 6000), profile.hght, profile.pres);

    // Pressure at 8km
    const p8km = sharp.interpHght(sharp.toMSL(profile.hght, 8000), profile.hght, profile.pres);

    // Pressure at LCL
    const plcl = sharp.interpHght(sharp.toMSL(profile.hght, muLCL), profile.hght, profile.pres);

    // Pressure at EL
    const pel = sharp.interpHght(sharp.toMSL(profile.hght, muEL), profile.hght, profile.pres);

    // var interped = ptype.interpptype(profile)
    // var scaleddata = ptype.scaleptype(interped)
    // var ptypepreds = model.predict(scaleddata).arraySync()
    // ptypedata.push(ptypepreds[0])

    // Top and bottom pressure levels of effective inflow layer
    const [effp0, effp1] = sharp.effectiveInflowLayer(profile, muCAPE, muCINH);

    // Heights associated with effective inflow layer pressures
    const effh0 = sharp.interp([effp0], profile.pres, profile.hght)[0];
    const effh1 = sharp.interp([effp1], profile.pres, profile.hght)[0];

    // More effective inflow layer stuff
    const ebotm = sharp.interp([effp0], profile.pres, profile.hght)[0] - profile.hght[0];
    const depth = muEL ? (muEL - ebotm) / 2 : NaN;
    const elh = sharp.interpHght(
        sharp.toMSL(profile.hght, ebotm + depth),
        profile.hght,
        profile.pres,
    );

    // Shear components for each layer
    const [sfc1kmshearu, sfc1kmshearv] = sharp.shear(profile, profile.pres[0], p1km);
    const [sfc3kmshearu, sfc3kmshearv] = sharp.shear(profile, profile.pres[0], p3km);
    const [sfc6kmshearu, sfc6kmshearv] = sharp.shear(profile, profile.pres[0], p6km);
    const [sfc8kmshearu, sfc8kmshearv] = sharp.shear(profile, profile.pres[0], p8km);

    // Shear magnitudes for each layer
    const sfc1kmshr = sharp.mag(sfc1kmshearu, sfc1kmshearv);
    const sfc3kmshr = sharp.mag(sfc3kmshearu, sfc3kmshearv);
    const sfc6kmshr = sharp.mag(sfc6kmshearu, sfc6kmshearv);
    const sfc8kmshr = sharp.mag(sfc8kmshearu, sfc8kmshearv);

    // Significant severe parameter
    const sigsvr = sharp.sig_severe(sfc6kmshr, mlCAPE);

    // Bunkers storm motion components
    const [rstu, rstv, lstu, lstv] = sharp.bunkers(profile, muCAPE, muCINH, muEL);

    // Calculate storm relative helicities for each layer if Bunker's defined
    // Question: Is there a reason these are var instead of const?
    if (rstu) {
        var right_srh1km = sharp.helicity(profile, 0, 1000, rstu, rstv)[0];
        var right_srh3km = sharp.helicity(profile, 0, 3000, rstu, rstv)[0];
        var right_srh6km = sharp.helicity(profile, 0, 6000, rstu, rstv)[0];
        var right_srh8km = sharp.helicity(profile, 0, 8000, rstu, rstv)[0];
        var right_srheff = sharp.helicity(profile, effh0, effh1, rstu, rstv)[0];
        var right_srhlclel = sharp.helicity(profile, muLCL, muEL, rstu, rstv)[0];
        var right_srhebwd = sharp.helicity(
            profile,
            effh0,
            sharp.toMSL(profile.hght, ebotm + depth),
            rstu,
            rstv,
        );
    } else {
        var right_srh1km = null;
        var right_srh3km = null;
        var right_srh6km = null;
        var right_srh8km = null;
        var right_srheff = null;
    }

    // Mean winds for each layer
    const [mw1u, mw1v] = sharp.meanWind(profile, profile.pres[0], p1km);
    const [mw3u, mw3v] = sharp.meanWind(profile, profile.pres[0], p3km);
    const [mw6u, mw6v] = sharp.meanWind(profile, profile.pres[0], p6km);
    const [mw8u, mw8v] = sharp.meanWind(profile, profile.pres[0], p8km);

    // Storm relative winds for each layer
    const [srw1u, srw1v] = sharp.srWind(profile, profile.pres[0], p1km, rstu, rstv);
    const [srw3u, srw3v] = sharp.srWind(profile, profile.pres[0], p3km, rstu, rstv);
    const [srw6u, srw6v] = sharp.srWind(profile, profile.pres[0], p6km, rstu, rstv);
    const [srw8u, srw8v] = sharp.srWind(profile, profile.pres[0], p8km, rstu, rstv);

    // Mean winds, shear, SR winds for effective inflow layer
    const [effwu, effwv] = sharp.meanWind(profile, effp0, effp1);
    const [effshru, effshrv] = sharp.shear(profile, effp0, effp1);
    const effshr = sharp.mag(effshru, effshrv);
    const [srweffu, srweffv] = sharp.srWind(profile, effp0, effp1, rstu, rstv);

    // Mean winds, shear, SR winds for LCL-EL layer
    const [ellclwu, ellclwv] = sharp.meanWind(profile, plcl, pel, rstu, rstv);
    const [ellclshru, ellclshrv] = sharp.shear(profile, plcl, pel);
    const ellclshr = sharp.mag(ellclshru, ellclshrv);
    const [srwellclu, srwellclv] = sharp.srWind(profile, plcl, pel, rstu, rstv);

    // Mean winds, shear, SR winds for LCL-EL layer for (effective bulk wind difference?)
    const [ebwdu, ebwdv] = sharp.meanWind(profile, effp0, elh);
    const [ebwdshru, ebwdshrv] = sharp.shear(profile, effp0, elh);
    const ebwdshr = sharp.mag(ebwdshru, ebwdshrv);
    const [srwebwdu, srwebwdv] = sharp.srWind(profile, effp0, elh, rstu, rstv);

    // 4-6km storm relative winds
    const [srw46u, srw46v] = sharp.srWind(profile, p4km, p6km, rstu, rstv);

    // Bulk richardson shear
    const brnShear = sharp.brnShear(profile);

    // Corfidi index
    const [upu, upv, dnu, dnv] = sharp.corfidi(profile);

    // Low and mid level mean relative humidity
    const lowRH = sharp.meanRH(profile, profile.pres[0], profile.pres[0] - 100);
    const midRH = sharp.meanRH(profile, profile.pres[0] - 150, profile.pres[0] - 350);

    const momentumTransferVector = sharp.momentum_transfer_vector(profile, 'Mean');
    const momentumTransferMag = sharp.mag(momentumTransferVector[0], momentumTransferVector[1]);
    const momentumTransferVectorMax = sharp.momentum_transfer_vector(profile, 'Max');
    let momentumTransferMagMax = sharp.mag(
        momentumTransferVectorMax[0],
        momentumTransferVectorMax[1],
    );
    if (momentumTransferMagMax < momentumTransferMag) {
        momentumTransferMagMax = momentumTransferMag;
    }

    const pblDepth = sharp.pbl_lid(profile);

    return {
        sfcCAPE,
        mlCAPE,
        muCAPE,
        sfcCINH,
        mlCINH,
        muCINH,
        sfcLCL,
        mlLCL,
        muLCL,
        sfcLI,
        mlLI,
        muLI,
        sfcLFC,
        mlLFC,
        muLFC,
        sfcEL,
        mlEL,
        muEL,
        sfccape3,
        mlcape3,
        mucape3,
        pw,
        tei,
        dcape,
        kIndex,
        tTotals,
        wndg,
        meanMR,
        cTemp,
        maxT,
        right_srh1km,
        right_srh3km,
        right_srh6km,
        right_srh8km,
        sfc1kmshr,
        sfc3kmshr,
        sfc6kmshr,
        sfc8kmshr,
        mw1u,
        mw1v,
        mw3u,
        mw3v,
        mw6u,
        mw6v,
        mw8u,
        mw8v,
        srw1u,
        srw1v,
        srw3u,
        srw3v,
        srw6u,
        srw6v,
        srw8u,
        srw8v,
        lowRH,
        midRH,
        mburst,
        esp,
        downT,
        mmp,
        sigsvr,
        effshr,
        effwu,
        effwv,
        right_srheff,
        right_srhlclel,
        ellclshr,
        ellclwu,
        ellclwv,
        srweffu,
        srweffv,
        srwellclu,
        srwellclv,
        right_srhebwd,
        ebwdshr,
        ebwdu,
        ebwdv,
        srwebwdu,
        srwebwdv,
        brnShear,
        srw46u,
        srw46v,
        rstu,
        rstv,
        lstu,
        lstv,
        upu,
        upv,
        dnu,
        dnv,
        muptrace,
        muttrace,
        sfcptrace,
        sfcttrace,
        mlptrace,
        mlttrace,
        momentumTransferVector,
        momentumTransferMag,
        momentumTransferVectorMax,
        momentumTransferMagMax,
        pblDepth,
    };
}
}
