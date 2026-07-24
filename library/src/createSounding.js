import sharp from './Sharp';
import { createVector, isVector, vec2comp, comp2vec } from './vector';
import { math } from './Utilities';

const WIND_MPS_TO_KTS = 1.9438444924406;
const FT_TO_M = 0.3048;

const PRESSURE_FIELDS = new Set(['pressure', 'sp', 'mslp']);
const TEMP_FIELDS = new Set(['t2', 'd2', 't_isobaric', 'dpt_isobaric']);
const WIND_FIELDS = new Set(['u10', 'v10', 'u_isobaric', 'v_isobaric']);
const PERCENT_FIELDS = new Set(['rh2', 'r_isobaric']);

const normalizeUnit = (unit, field, model) => {
    if (typeof unit !== 'string' || unit.trim() === '') {
        throw new Error(
            `Missing units for field "${field}" (model "${model}"). Every record requires a units value.`,
        );
    }
    return unit.trim().toLowerCase();
};

const convertValueByUnit = (value, field, unit, model, allowMissing = false) => {
    if (value == null) return value;
    if (Number.isNaN(value)) {
        if (allowMissing) return value;
        throw new Error(
            `Invalid numeric value for field "${field}" (model "${model}"). Received: ${value}`,
        );
    }
    if (typeof value !== 'number' || Number.isNaN(value)) {
        throw new Error(
            `Invalid numeric value for field "${field}" (model "${model}"). Received: ${value}`,
        );
    }

    if (PRESSURE_FIELDS.has(field)) {
        if (unit === 'hpa') return value;
        if (unit === 'pa') return value / 100;
        throw new Error(
            `Unsupported units "${unit}" for field "${field}" (model "${model}"). Allowed: hPa, Pa.`,
        );
    }

    if (field === 'gh_isobaric') {
        if (unit === 'dam') return value * 10;
        if (unit === 'm') return value;
        throw new Error(
            `Unsupported units "${unit}" for field "${field}" (model "${model}"). Allowed: dam, m.`,
        );
    }

    if (TEMP_FIELDS.has(field)) {
        if (unit === 'f' || unit === 'degf') return sharp.f2c(value);
        if (unit === 'c' || unit === 'degc') return value;
        if (unit === 'k') return value - 273.15;
        throw new Error(
            `Unsupported units "${unit}" for field "${field}" (model "${model}"). Allowed: F, C, K.`,
        );
    }

    if (WIND_FIELDS.has(field)) {
        if (unit === 'mph') return sharp.mph2kts(value);
        if (unit === 'kts' || unit === 'kt') return value;
        if (unit === 'm/s' || unit === 'mps') return value * WIND_MPS_TO_KTS;
        throw new Error(
            `Unsupported units "${unit}" for field "${field}" (model "${model}"). Allowed: mph, kts, m/s.`,
        );
    }

    if (field === 'orog') {
        if (unit === 'm') return value;
        if (unit === 'ft') return value * FT_TO_M;
        throw new Error(
            `Unsupported units "${unit}" for field "${field}" (model "${model}"). Allowed: m, ft.`,
        );
    }

    if (PERCENT_FIELDS.has(field)) {
        if (unit === '%') return value;
        throw new Error(
            `Unsupported units "${unit}" for field "${field}" (model "${model}"). Allowed: % only.`,
        );
    }

    return value;
};

const convertRecordValue = (record) => {
    const { field, model } = record;
    const unit = normalizeUnit(record.units, field, model);
    const { value } = record;

    if (Array.isArray(value)) {
        return value.map((entry) => convertValueByUnit(entry, field, unit, model, true));
    }

    return convertValueByUnit(value, field, unit, model);
};

const isMissingValue = (value) => value == null || Number.isNaN(value);

const interpolateMemberLevels = (levels) => {
    if (!Array.isArray(levels) || levels.length === 0) return;

    if (levels.length >= 3) {
        for (const fieldName of ['temp', 'dwpt', 'uwnd', 'vwnd']) {
            for (let i = 1; i < levels.length; i += 1) {
                if (!isMissingValue(levels[i][fieldName])) continue;
                if (isMissingValue(levels[i - 1][fieldName])) continue;

                let nextIndex = -1;
                for (let j = i + 1; j < levels.length; j += 1) {
                    if (!isMissingValue(levels[j][fieldName])) {
                        nextIndex = j;
                        break;
                    }
                }

                if (nextIndex === -1) continue;

                levels[i][fieldName] = sharp.interp(
                    [levels[i].hght],
                    [levels[i - 1].hght, levels[nextIndex].hght],
                    [levels[i - 1][fieldName], levels[nextIndex][fieldName]],
                )[0];
            }
        }
    }
};

const addDerivedProfileFields = (levels) => {
    if (!Array.isArray(levels) || levels.length === 0) return;

    for (const level of levels) {
        // Derive twnd and wdir
        if (isMissingValue(level.uwnd) || isMissingValue(level.vwnd)) {
            level.twnd = NaN;
            level.wdir = NaN;
            continue;
        }
        const [twnd, wdir] = comp2vec(level.uwnd, level.vwnd);
        level.twnd = twnd;
        level.wdir = wdir;
    }
};

const createSurfaceData = (memberData, mem) => {
    const { orog } = memberData;
    const { u10 } = memberData;
    const { v10 } = memberData;
    const [twind10, wdir10] = comp2vec(u10, v10);

    return {
        mem,
        orog,
        sp: memberData.sp,
        mslp: memberData.mslp,
        t2: memberData.t2,
        d2: memberData.d2,
        rh2: memberData.rh2,
        u10,
        v10,
        twind10,
        wdir10,
    };
};

const createMemberLevels = (memberData, surface) => {
    const levels = [];
    const ps = memberData.pressure;

    if (!Array.isArray(ps)) return levels;

    for (let level = 0; level < ps.length; level += 1) {
        const hght = memberData.gh_isobaric[level];
        levels.push({
            press: ps[level],
            hght,
            temp: memberData.t_isobaric[level],
            dwpt: memberData.dpt_isobaric[level],
            uwnd: memberData.u_isobaric[level],
            vwnd: memberData.v_isobaric[level],
            twnd: NaN,
            wdir: NaN,
            hghtagl: hght - surface.orog,
            orog: surface.orog,
            sp: surface.sp,
            mem: surface.mem,
            member: surface.mem,
        });
    }

    return levels;
};

const isValidLevel = (level) => {
    const hasValidThermo =
        level.temp < 200 &&
        level.temp > -200 &&
        level.dwpt < 200 &&
        level.dwpt > -200 &&
        !Number.isNaN(level.temp) &&
        !Number.isNaN(level.dwpt);

    return hasValidThermo;
};

const insertSurfaceLevel = (levels, surface, averageSurfaceValues) => {
    // First, filter out any levels that are above the surface
    for (let i = levels.length - 1; i >= 0; i -= 1) {
        if (levels[i].press >= averageSurfaceValues.press) {
            levels.splice(i, 1);
        }
    }

    levels.unshift({
        press: averageSurfaceValues.press,
        hght: averageSurfaceValues.hght,
        temp: surface.t2,
        dwpt: surface.d2,
        t2: surface.t2,
        d2: surface.d2,
        sp: surface.sp,
        hghtagl: 0,
        sfcflag: true,
        orog: surface.orog,
        mslp: surface.mslp,
        rh2: surface.rh2,
        uwnd: surface.u10,
        vwnd: surface.v10,
        twind10: surface.twind10,
        twnd: surface.twind10,
        wdir: surface.wdir10,
        wdir10: surface.wdir10,
        mem: surface.mem,
    });
};

/**
 * Formats raw data into a structured sounding profile.
 * @param {Array} records - Flat list of field/model/value records for a single valid time.
 * @returns {Array} - An array containing [levelData, profileData, members].
 */
const soundingFormat = (records) => {
    const mydata = Array.isArray(records) ? records : [];

    const obj = {};
    for (const i in mydata) {
        const { field } = mydata[i];
        const mem = mydata[i].model;

        if (!field || !mem) {
            throw new Error('Each record must include both field and model values.');
        }

        if (!obj[mem]) obj[mem] = {};
        const value = convertRecordValue(mydata[i]);
        obj[mem][field] = value;
    }

    const memberKeys = Object.keys(obj);

    // Calculate surface baseline values for pressure and height
    const sfcPres = [];
    const sfcHgt = [];
    for (const mem of memberKeys) {
        const press = obj[mem].sp;
        const hght = obj[mem].orog;

        if (Number.isFinite(press)) {
            sfcPres.push(press);
        }

        if (Number.isFinite(hght)) {
            sfcHgt.push(hght);
        }
    }

    const averageSurfaceValues = {
        press: sfcPres.length > 0 ? sfcPres.reduce((a, b) => a + b, 0) / sfcPres.length : undefined,
        hght: sfcHgt.length > 0 ? sfcHgt.reduce((a, b) => a + b, 0) / sfcHgt.length : undefined,
    };

    const levelData = [];
    for (const mem in obj) {
        const surface = createSurfaceData(obj[mem], mem);
        const memberLevels = createMemberLevels(obj[mem], surface);
        insertSurfaceLevel(memberLevels, surface, averageSurfaceValues);
        interpolateMemberLevels(memberLevels);
        addDerivedProfileFields(memberLevels);

        // Filtering must come after interpolation, otherwise the layer will be filetered out
        const validLevels = memberLevels.filter(isValidLevel);
        if (validLevels.length === 0) continue;

        levelData.push(validLevels);
    }

    const members = levelData.map((levels) => levels[0].mem);

    // Create profile data for calculating stats
    const profiledata = [];
    for (let i = 0; i < levelData.length; i++) {
        const memdata = {
            pres: [],
            hght: [],
            tmpc: [],
            dwpc: [],
            uwnd: [],
            vwnd: [],
            vtmp: [],
            twnd: [],
            wdir: [],
            hghtmsl: [],
            mem: levelData[i][0].mem,
        };
        for (let j = 0; j < levelData[i].length; j++) {
            memdata.pres.push(levelData[i][j].press);
            memdata.hght.push(levelData[i][j].hght - levelData[i][j].orog);
            memdata.hghtmsl.push(levelData[i][j].hght);
            memdata.tmpc.push(levelData[i][j].temp);
            memdata.dwpc.push(levelData[i][j].dwpt);
            memdata.uwnd.push(levelData[i][j].uwnd);
            memdata.vwnd.push(levelData[i][j].vwnd);
            memdata.twnd.push(levelData[i][j].twnd);
            memdata.wdir.push(levelData[i][j].wdir);
        }

        memdata.vtmp = memdata.tmpc.map(
            (tmpc, index) => sharp.vtmp([tmpc], [memdata.dwpc[index]], [memdata.pres[index]])[0],
        );

        profiledata.push(memdata);
    }
    return [levelData, profiledata, members];
};

/**
 * Calculates thermodynamic and kinematic statistics for a single profile.
 * @param {object} profile - A formatted sounding profile object.
 * @returns {object} - An object containing dozens of derived parameters.
 */

// Calculate thermo statistics
export const sharpStats = (profile) => {
    // Most unstable pressure
    const { mem } = profile;
    const mupclpres = sharp.mostUnstableLayer(profile);

    // Most unstable temperature
    const mupcltmpc = sharp.interp([mupclpres], profile.pres, profile.tmpc)[0];

    // Most unstable dewpoint
    const mupcldwpc = sharp.interp([mupclpres], profile.pres, profile.dwpc)[0];

    // Most unstable thermo stuff
    console.log('yo', profile);
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
    } else if (stat === 'list') {
        value = componentOne;
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
    } else if (stat === 'list') {
        mag = mags;
    } else {
        const q = Number(stat.substring(0, stat.length - 1));
        mag = math.quantile(mags, q / 100);
    }

    // so now <xValue,yValue> has the direction we want
    // and mag has the value we want
    const [, drx] = comp2vec(xValue, yValue);
    const [u, v] = vec2comp(mag, drx);
    const newVector = createVector(u, v);

    //if (!mag) mag = NaN;
    //if (!drx) drx = NaN;
    return newVector;
};

const calculateStats = (components, key, stat) => {
    // Check if the value is a scalar or vector
    let returnStat = null;
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
        // This must be a profile, nothing to do here
        // console.error('Error: Data array must contain either numbers or Vector objects.');
        // console.log(key, isVector(key, validComponents[0]), validComponents[0]);
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
    // Used for drawing skew-T diagrams
    let levelData = null;
    // Used for calculating statistics
    let profileData = null;
    let members = null;
    let profileDerivedData = null;

    return {
        updateData(records) {
            [levelData, profileData, members] = soundingFormat(records);
            profileDerivedData = calcDerivedParameters(profileData);
        },

        calcStats(memberList, stat) {
            // console.log('calculating stats for:', memberList, 'with stat:', stat);

            const statsDict = {};

            // Return an empty object if the input array is empty to avoid errors.
            if (memberList.length === 0 || !profileDerivedData) {
                return {};
            }

            for (const profile of profileDerivedData) {
                if (memberList.includes(profile.mem)) {
                    const stats = profile;

                    // Push all HREF member stats to appropriate array (each will be length 10)
                    for (const key in stats) {
                        if (!statsDict[key]) statsDict[key] = [];
                        statsDict[key].push(stats[key]);
                    }
                }
            }
            const selectedStats = {};
            Object.entries(statsDict).forEach(([key, value]) => {
                const statOutput = calculateStats(value, key, stat);
                selectedStats[key] = statOutput;
            });
            return selectedStats;
        },

        /**
         * Getter to safely access the processed profile data.
         * Organized by element first.
         * @returns {Array|null} The profile data.
         */
        getProfileData() {
            return profileData;
        },

        /**
         * Getter to safely access the processed level data.
         * Organized by level first
         * @returns {Array|null} The profile data.
         */
        getLevelData() {
            return levelData;
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
