import sharp from './Sharp';
import { createVector, isVector, vec2comp, comp2vec } from './vector';
import { math } from './Utilities';

/**
 * Formats raw data into a structured sounding profile.
 * @param {object} d - The raw data object.
 * @param {number} time - The forecast hour/time index.
 * @returns {Array} - An array containing [profileData, members].
 */
const soundingFormat = (d, time) => {
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
        if (field === 'gh_isobaric') value = value.map((x) => x * 10);
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
                obj.hght !== -9990 &&
                obj.temp < 200 &&
                obj.temp > -200 &&
                obj.dwpt < 200 &&
                obj.dwpt > -200 &&
                !Number.isNaN(obj.temp) &&
                !Number.isNaN(obj.dwpt),
        );
        return filteredInnerArray;
    });
    // Remove arrays that are of length zero
    const filteredArray = filteredArrayTmp.filter((array) => array.length > 0);
    // Now grab the members now that the filtering is done
    const members = filteredArray.map((x) => x[0].member);

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
        if (memdata.hght.length === 0) {
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
    console.log('The saved members are: ');
    console.log(members);
    return [profiledata, members];
};

/**
 * Calculates thermodynamic and kinematic statistics for a single profile.
 * @param {object} profile - A formatted sounding profile object.
 * @returns {object} - An object containing dozens of derived parameters.
 */

// Calculate thermo statistics
const sharpStats = (profile) => {
    // Most unstable pressure
    const { mem } = profile;
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
    const rstVector = createVector(rstu, rstv);
    const lstVector = createVector(lstu, lstv);
    // Calculate storm relative helicities for each layer if Bunker's defined
    let right_srh1km = null;
    let right_srh3km = null;
    let right_srh6km = null;
    let right_srh8km = null;
    let right_srheff = null;
    let right_srhlclel = null;
    let right_srhebwd = null;
    if (rstu) {
        right_srh1km = sharp.helicity(profile, 0, 1000, rstu, rstv)[0];
        right_srh3km = sharp.helicity(profile, 0, 3000, rstu, rstv)[0];
        right_srh6km = sharp.helicity(profile, 0, 6000, rstu, rstv)[0];
        right_srh8km = sharp.helicity(profile, 0, 8000, rstu, rstv)[0];
        right_srheff = sharp.helicity(profile, effh0, effh1, rstu, rstv)[0];
        right_srhlclel = sharp.helicity(profile, muLCL, muEL, rstu, rstv)[0];
        right_srhebwd = sharp.helicity(
            profile,
            effh0,
            sharp.toMSL(profile.hght, ebotm + depth),
            rstu,
            rstv,
        );
    }

    // Mean winds for each layer
    const mw1Vector = createVector(...sharp.meanWind(profile, profile.pres[0], p1km));
    const mw3Vector = createVector(...sharp.meanWind(profile, profile.pres[0], p3km));
    const mw6Vector = createVector(...sharp.meanWind(profile, profile.pres[0], p6km));
    const mw8Vector = createVector(...sharp.meanWind(profile, profile.pres[0], p8km));

    // Storm relative winds for each layer
    const srw1Vector = createVector(...sharp.srWind(profile, profile.pres[0], p1km, rstu, rstv));
    const srw3Vector = createVector(...sharp.srWind(profile, profile.pres[0], p3km, rstu, rstv));
    const srw6Vector = createVector(...sharp.srWind(profile, profile.pres[0], p6km, rstu, rstv));
    const srw8Vector = createVector(...sharp.srWind(profile, profile.pres[0], p8km, rstu, rstv));

    // Mean winds, shear, SR winds for effective inflow layer
    const effwVector = createVector(...sharp.meanWind(profile, effp0, effp1));
    const effshrVector = createVector(...sharp.shear(profile, effp0, effp1));
    const effshr = effshrVector.mag;
    const srweffVector = createVector(...sharp.srWind(profile, effp0, effp1, rstu, rstv));

    // Mean winds, shear, SR winds for LCL-EL layer
    const ellclwVector = createVector(...sharp.meanWind(profile, plcl, pel, rstu, rstv));
    const ellclshrVector = createVector(...sharp.shear(profile, plcl, pel));
    const ellclshr = ellclshrVector.mag;
    const srwellclVector = createVector(...sharp.srWind(profile, plcl, pel, rstu, rstv));

    // Mean winds, shear, SR winds for LCL-EL layer for (effective bulk wind difference?)
    const ebwdVector = createVector(...sharp.meanWind(profile, effp0, elh));
    const ebwdshrVector = createVector(...sharp.shear(profile, effp0, elh));
    const ebwdshr = ebwdshrVector.mag;
    const srwebwdVector = createVector(...sharp.srWind(profile, effp0, elh, rstu, rstv));

    // 4-6km storm relative winds
    const srw46Vector = createVector(...sharp.srWind(profile, p4km, p6km, rstu, rstv));

    // Bulk richardson shear
    const brnShear = sharp.brnShear(profile);

    // Corfidi index
    const [upu, upv, dnu, dnv] = sharp.corfidi(profile);
    const upVector = createVector(upu, upv);
    const dnVector = createVector(dnu, dnv);

    // Low and mid level mean relative humidity
    const lowRH = sharp.meanRH(profile, profile.pres[0], profile.pres[0] - 100);
    const midRH = sharp.meanRH(profile, profile.pres[0] - 150, profile.pres[0] - 350);

    const momentumTransferVector = createVector(...sharp.momentum_transfer_vector(profile, 'Mean'));
    const momentumTransferMag = momentumTransferVector.mag;
    const momentumTransferVectorMax = createVector(
        ...sharp.momentum_transfer_vector(profile, 'Max'),
    );
    let momentumTransferMagMax = momentumTransferVectorMax.mag;
    if (momentumTransferMagMax < momentumTransferMag) {
        momentumTransferMagMax = momentumTransferMag;
    }

    const pblDepth = sharp.pbl_lid(profile);

    return {
        mem,
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
        // mw1u,
        // mw1v,
        // mw3u,
        // mw3v,
        // mw6u,
        // mw6v,
        // mw8u,
        // mw8v,
        mw1Vector,
        mw3Vector,
        mw6Vector,
        mw8Vector,
        // srw1u,
        // srw1v,
        // srw3u,
        // srw3v,
        // srw6u,
        // srw6v,
        // srw8u,
        // srw8v,
        srw1Vector,
        srw3Vector,
        srw6Vector,
        srw8Vector,
        lowRH,
        midRH,
        mburst,
        esp,
        downT,
        mmp,
        sigsvr,
        effshr,
        // effwu,
        // effwv,
        effwVector,
        right_srheff,
        right_srhlclel,
        ellclshr,
        ellclwVector,
        // srweffu,
        // srweffv,
        // srwellclu,
        // srwellclv,
        srweffVector,
        srwellclVector,
        right_srhebwd,
        ebwdshr,
        // ebwdu,
        // ebwdv,
        // srwebwdu,
        // srwebwdv,
        ebwdVector,
        srwebwdVector,
        brnShear,
        // srw46u,
        // srw46v,
        // rstu,
        // rstv,
        // lstu,
        // lstv,
        // upu,
        // upv,
        // dnu,
        // dnv,
        srw46Vector,
        rstVector,
        lstVector,
        upVector,
        dnVector,
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
};

/**
 * Calculates derived parameters for all profiles.
 * @param {Array} profileData - An array of profile objects.
 * @returns {Array} - An array of derived data for each profile.
 */

const calcDerivedParameters = (profileData) => {
    const profileDerivedData = [];
    for (const profile of profileData) {
        profileDerivedData.push(sharpStats(profile));
    }
    return profileDerivedData;
};

const calculateStatsScalar = (componentOne, stat) => {
    // in this case we have a scalar input
    // really simple, just calculate the mean (or percentile) and boom done
    if (!componentOne) return NaN;
    let value;
    if (stat === 'mean') {
        value = math.mean(componentOne);
    } else {
        const q = Number(stat.substring(0, stat.length - 1));
        value = math.quantile(componentOne, q / 100);
    }
    if (!value) value = NaN;
    return value;
};

const calculateStatsVector = (components, stat) => {
    // in this case we have a vector-valued input
    // first, calculate the mean u and mean v winds...and this will be our direction
    const uList = components.map((vec) => vec.u);
    const vList = components.map((vec) => vec.v);
    // TODO: Need to handle vector lists full of null values
    if (!uList || !vList) return { mag: NaN, drx: NaN };
    const xValue = math.mean(uList);
    const yValue = math.mean(vList);
    let mag;
    const mags = uList.map((element, idx) => sharp.mag(element, vList[idx]));
    if (stat == 'mean') {
        mag = math.mean(mags);
    } else {
        const q = Number(stat.substring(0, stat.length - 1));
        mag = math.quantile(mags, q / 100);
    }

    // so now <xValue,yValue> has the direction we want
    // and mag has the value we want
    const [sp, drx] = comp2vec(xValue, yValue);
    const [u, v] = vec2comp(mag, drx);
    const newVector = createVector(u, v);

    //if (!mag) mag = NaN;
    //if (!drx) drx = NaN;
    return newVector;
};

const calculateStats = (components, key, stat) => {
    // Check if the value is a scalar or vector
    let returnStat = null;
    console.log(components);
    // 1. Filter out any null or undefined entries from the components array.
    // The condition `vec != null` conveniently checks for both null and undefined.
    const validComponents = components.filter((value) => value != null);

    // 2. Add an edge case check. If the array is empty after filtering,
    // we can't perform calculations, so we return a createVector with NaN values.
    if (validComponents.length === 0) {
        if (key.includes('Vector')) {
            // Cheap check to make sure a vector is returned if a vector is expected.
            // TODO: This may not be necessary.
            return createVector(NaN, NaN);
        }
        return null;
    }
    if (isVector(validComponents[0])) {
        returnStat = calculateStatsVector(validComponents, stat);
    } else if (typeof validComponents[0] === 'number') {
        returnStat = calculateStatsScalar(validComponents, stat);
    } else {
        console.error('Error: Data array must contain either numbers or Vector objects.');
        return null;
    }
    return returnStat;
};

// ====================================================================================
// Sounding Factory Function
// ====================================================================================

/**
 * Creates a new Sounding object.
 * @returns {object} A Sounding object with methods to update and analyze data.
 */

export default function createSounding() {
    let profileData = null;
    let members = null;
    let profileDerivedData = null;

    return {
        updateData(d, time) {
            [profileData, members] = soundingFormat(d, time);
            profileDerivedData = calcDerivedParameters(profileData);
        },

        calcStats(memberList, stat) {
            console.log('calculating stats for:', memberList, 'with stat:', stat);

            const statsDict = {};

            // Return an empty object if the input array is empty to avoid errors.
            if (memberList.length === 0 || !profileDerivedData) {
                return {};
            }

            for (const profile of profileDerivedData) {
                console.log(profile);
                if (memberList.includes(profile.mem)) {
                    console.log(profile.mem);
                    const stats = profile;

                    // Push all HREF member stats to appropriate array (each will be length 10)
                    for (const key in stats) {
                        if (!statsDict[key]) statsDict[key] = [];
                        statsDict[key].push(stats[key]);
                    }
                }
            }
            console.log(statsDict);
            const selectedStats = {};
            Object.entries(statsDict).forEach(([key, value]) => {
                console.log(key);
                const statOutput = calculateStats(value, key, stat);
                selectedStats[key] = statOutput;
            });
            console.log(selectedStats);
            return selectedStats;
        },

        /**
         * Getter to safely access the processed profile data.
         * @returns {Array|null} The profile data.
         */
        getProfileData() {
            return profileData;
        },

        /**
         * Getter to safely access the list of ensemble members.
         * @returns {Array|null} The list of members.
         */
        getMembers() {
            return members;
        },

        /**
         * Getter to safely access the derived parameters.
         * @returns {Array|null} The derived data.
         */
        getDerivedData() {
            return profileDerivedData;
        },
    };
}
