import { math } from './Utilities';

export default class sharp {
    // Mixing ratio from pressure and temperature
    static mixRatio(p, t) {
        const mr = t.map((element, idx) => {
            const y =
                1 + 0.0000045 * p[idx] + 0.0014 * (0.02 * (element - 12.5 + 7500 / p[idx])) ** 2;
            const fwesw = y * this.vappres(element);
            return 621.97 * (fwesw / (p[idx] - fwesw));
        });
        return mr;
    }

    // Vapor pressure from temperature
    static vappres(t) {
        let pol = t * (1.1112018e-17 + t * -3.0994571e-20);
        pol = t * (2.1874425e-13 + t * (-1.789232e-15 + pol));
        pol = t * (4.388418e-9 + t * (-2.988388e-11 + pol));
        pol = t * (7.8736169e-5 + t * (-6.111796e-7 + pol));
        pol = 0.99999683 + t * (-9.082695e-3 + pol);
        return 6.1078 / pol ** 8;
    }

    // Mean potential temperature
    static meanTheta(profile) {
        const { pres } = profile;
        const { tmpc } = profile;
        const pbot = pres[0];
        const ptop = pbot - 100;
        const indbottom = this.myFindIndex(pres, pbot);
        const indtop = this.myFindIndex(pres, ptop, 'u');
        const theta1 = this.theta([pbot], [this.interp([pbot], pres, tmpc)[0]])[0];
        const theta2 = this.theta([ptop], [this.interp([ptop], pres, tmpc)[0]])[0];
        const thetamid = this.theta(pres.slice(indbottom, indtop), tmpc.slice(indbottom, indtop));
        const thetaall = [theta1].concat(thetamid).concat(thetamid).concat([theta2]);
        const tott = thetaall.reduce((partialSum, a) => partialSum + a, 0) / 2;
        const num = thetaall.length / 2;
        const thta = tott / num;
        const newtmpc = this.theta([1000], [thta], [pbot])[0];
        return newtmpc;
    }

    // Mean mixing ratio
    static meanMR(profile) {
        const { pres } = profile;
        const { dwpc } = profile;
        const pbot = pres[0];
        const ptop = pbot - 100;
        const indbottom = this.myFindIndex(pres, pbot);
        const indtop = this.myFindIndex(pres, ptop, 'u');
        const dwpt1 = this.interp([pbot], pres, dwpc)[0];
        const dwpt2 = this.interp([ptop], pres, dwpc)[0];
        const dwpt = [dwpt1]
            .concat(dwpc.slice(indbottom, indtop))
            .concat(dwpc.slice(indbottom, indtop))
            .concat([dwpt2]);
        const p = [pbot]
            .concat(pres.slice(indbottom, indtop))
            .concat(pres.slice(indbottom, indtop))
            .concat([ptop]);
        const totd = dwpt.reduce((partialSum, a) => partialSum + a, 0);
        const totp = p.reduce((partialSum, a) => partialSum + a, 0);
        const num = dwpt.length;
        const w = this.mixRatio([totp / num], [totd / num])[0];
        return [w, this.tempAtMR(w, [pbot])[0]];
    }

    // Temperature at given mixing ratio and pressure
    static tempAtMR(w, p) {
        const c1 = 0.0498646455;
        const c2 = 2.4082965;
        const c3 = 7.07475;
        const c4 = 38.9114;
        const c5 = 0.0915;
        const c6 = 1.2035;
        const x = p.map((element, idx) => {
            var x = Math.log10((w * element) / (622 + w));
            var x = 10 ** (c1 * x + c2) - c3 + c4 * (10 ** (c5 * x) - c6) ** 2 - 273.15;
            return x;
        });

        return x;
    }

    // Find first index meeting condition
    static myFindIndex(array, val, uorl = 'l') {
        if (uorl == 'l') {
            return array.findIndex((n) => n < val);
        }
        return array.findIndex((n) => n <= val);
    }

    // Interpolate a field to given pressure level
    static interp(p, pres, field) {
        const logp = p.map((element, idx) => Math.log10(element));
        const logpres = pres.map((element, idx) => Math.log10(element));
        const interped = this.linear(logp, logpres.slice().reverse(), field.slice().reverse());
        return interped;
    }

    // Potential temperature from temperature and pressure
    static theta(p, tmpc, pres = 1000) {
        const out = tmpc.map(
            (element, idx) => (element + 273.15) * (pres / p[idx]) ** 0.28571426 - 273.15,
        );
        return out;
    }

    // Linear interpolation function
    static linear(pointsToEvaluate, functionValuesX, functionValuesY) {
        const results = [];
        pointsToEvaluate = this.makeItArrayIfItsNot(pointsToEvaluate);
        pointsToEvaluate.forEach((point) => {
            let index = this.findIntervalBorderIndex(point, functionValuesX);
            if (index == functionValuesX.length - 1) index--;
            results.push(
                this.linearInterpolation(
                    point,
                    functionValuesX[index],
                    functionValuesY[index],
                    functionValuesX[index + 1],
                    functionValuesY[index + 1],
                ),
            );
        });
        return results;
    }

    static makeItArrayIfItsNot(input) {
        return Object.prototype.toString.call(input) !== '[object Array]' ? [input] : input;
    }

    static findIntervalBorderIndex(point, intervals, useRightBorder) {
        // If point is beyond given intervals
        if (point < intervals[0]) return 0;
        if (point > intervals[intervals.length - 1]) return intervals.length - 1;
        // If point is inside interval
        // Start searching on a full range of intervals
        let indexOfNumberToCompare;
        let leftBorderIndex = 0;
        let rightBorderIndex = intervals.length - 1;
        // Reduce searching range till it find an interval point belongs to using binary search
        while (rightBorderIndex - leftBorderIndex !== 1) {
            indexOfNumberToCompare =
                leftBorderIndex + Math.floor((rightBorderIndex - leftBorderIndex) / 2);
            point >= intervals[indexOfNumberToCompare]
                ? (leftBorderIndex = indexOfNumberToCompare)
                : (rightBorderIndex = indexOfNumberToCompare);
        }
        return useRightBorder ? rightBorderIndex : leftBorderIndex;
    }

    static linearInterpolation(x, x0, y0, x1, y1) {
        const a = (y1 - y0) / (x1 - x0);
        const b = -a * x0 + y0;
        return a * x + b;
    }

    // Calculate CAPE (this is the main thermo function)
    static CAPE(profile, pcltmpc, pcldwpc, pclpres) {
        const { tmpc } = profile;
        const { dwpc } = profile;
        const { pres } = profile;
        const { hght } = profile;
        const vtmps = profile.vtmp;

        // Pressure at bottom and top of layer; pbot can't be greater than parcel pressure
        var pbot = pres[0];

        const ptop = pres[pres.length - 1];
        if (pbot > pclpres) {
            pbot = pclpres;
        }

        // Lift parcel dry adiabatically to LCL and get hght/temp at new pressure level
        const ttrace = [this.vtmp([pcltmpc], [pcldwpc], [pclpres])[0]];
        const ptrace = [pbot];
        var [pe2, tp2] = this.dryLift([pcltmpc], [pcldwpc], [pclpres])[0];
        const blupper = Math.floor(pe2);
        var pe2ind = this.myFindIndex(pres, pe2);
        var h2 = this.interp([pe2], pres, hght)[0];
        var te2 = this.interp([pe2], pres, vtmps)[0];
        const lclpres = Math.min(pe2, pres[0]);
        const lclhght = h2 - hght[0];
        ttrace.push(this.vtmp([tp2], [tp2], [pe2])[0]);
        ptrace.push(pe2);

        // Calculate CINH in the boundary layer
        var pe1 = pbot;
        var pe1ind = this.myFindIndex(pres, pe1);
        var h2 = this.interp([pe2], pres, hght)[0];
        var te2 = this.interp([pe2], pres, vtmps)[0];
        var tp1 = this.wetLift([pe2], [tp2], [pe1])[0];
        const theta_parcel = this.theta([pe2], [tp2], [1000])[0];
        const pclpresidx = this.myFindIndex(pres, pclpres);
        const bltmpc = this.interp([pclpres], pres, tmpc)[0];
        const bltheta = this.theta([pclpres], [bltmpc], [1000])[0];
        const blmr = this.mixRatio([pclpres], [pcldwpc])[0];
        const pp = this.range(blupper, pbot + 10, 10).slice();
        const hh = this.interp(pp, pres, hght);

        const tmp1 = this.vtmpSpecial(theta_parcel, this.tempAtMR(blmr, pp), pp);
        const tmp_env_theta = this.theta(pp, this.interp(pp, pres, tmpc), 1000);
        const tv_env = this.vtmp(tmp_env_theta, this.interp(pp, pres, dwpc), pp);
        const tdef = tmp1.map((element, idx) => (element - tv_env[idx]) / (tv_env[idx] + 273.15));

        const tidx1 = Array.from(new Array(tdef.length - 1), (x, i) => i + 0);
        const tidx2 = Array.from(new Array(tdef.length - 1), (x, i) => i + 1);
        const tidxsum = tidx1.map(
            (element, idx) =>
                ((-1 * 9.80665 * (tdef[element] + tdef[tidx2[idx]])) / 2) *
                ((hh[tidx2[idx]] - hh[element]) / 10),
        );
        let totn = 0;
        for (let i = 0; i < tidxsum.length; i++) {
            if (tidxsum[i] < 0) {
                totn += tidxsum[i] * 10;
            }
        }

        // Reset bottom of layer to pressure of LCL
        if (pbot > pe2) {
            var pbot = pe2;
        }

        // Find pressure and height levels of various temperature thresholds
        const p0c = this.temp_lvl(tmpc, pres, 0);
        const pm10c = this.temp_lvl(tmpc, pres, -10);
        const pm20c = this.temp_lvl(tmpc, pres, -20);
        const pm30c = this.temp_lvl(tmpc, pres, -30);
        const p0cind = this.myFindIndex(pres, p0c);
        const pm10cind = this.myFindIndex(pres, pm10c);
        const pm20cind = this.myFindIndex(pres, pm20c);
        const pm30cind = this.myFindIndex(pres, pm30c);
        const hgt0c = this.interp([p0c], pres, hght)[0];
        const hgtm10c = this.interp([pm10c], pres, hght)[0];
        const hgtm20c = this.interp([pm20c], pres, hght)[0];
        const hgtm30c = this.interp([pm30c], pres, hght)[0];

        // Moist ascent (not sure why we wetlift from pe2 to pe1; think tp1=tp2)
        var pe1 = pbot;
        var pe1ind = this.myFindIndex(pres, pe1);
        var h1 = this.interp([pe1], pres, hght)[0];
        var te1 = this.interp([pe1], pres, vtmps)[0];
        var tp1 = this.wetLift([pe2], [tp2], [pe1])[0];

        // tp1 = tp2;

        // Various variable initializations
        var lyre = 0;
        var lyrlast = 0;
        var tote = 0;
        let totp = 0;
        var li_max = -9999;
        const li_maxpres = -9999;
        var cap_strength = -9999;
        const cap_strengthpres = -9999;
        var frzbreaker = 0;
        var n10breaker = 0;
        var n20breaker = 0;
        var n30breaker = 0;
        var libreaker = 0;
        let cape3breaker = 0;
        let cape3 = 0;
        let cape6breaker = 0;
        let cape6 = 0;

        // Index of LCL to index of top of layer
        const lptr = this.myFindIndex(pres, pbot);
        const uptr = this.myFindIndex(pres, ptop, 'u');

        // Begin iterative ascent

        for (let i = lptr; i <= uptr; i++) {
            var pe2 = pres[i];
            var h2 = hght[i];
            var te2 = vtmps[i];

            // Moist lift parcel from pe1 to pe2
            var tp2 = this.wetLift([pe1], [tp1], [pe2])[0];
            const tdef1 = (this.vtmp([tp1], [tp1], [pe1])[0] - te1) / (te1 + 273.15);
            var tdef2 = (this.vtmp([tp2], [tp2], [pe2])[0] - te2) / (te2 + 273.15);

            ptrace.push(pe2);
            ttrace.push(this.vtmp([tp2], [tp2], [pe2])[0]);

            // Calculate average layer energy
            var lyrlast = lyre;
            var lyre = ((9.80665 * (tdef1 + tdef2)) / 2) * (h2 - h1);
            if (lyre > 0) {
                totp += lyre;
            } else if (pe2 > 500) {
                totn += lyre;
            }

            // Reset variables to begin at next layer
            tote += lyre;
            const pelast = pe1;
            var pe1 = pe2;
            var te1 = te2;
            var tp1 = tp2;

            // Lift to interpolated top of the layer if this is last layer
            if (i == uptr) {
                var pe3 = pe1;
                var h3 = h2;
                var te3 = te1;
                var tp3 = tp1;
                var lyrf = lyre;
                var pe2 = ptop;
                var h2 = this.interp([pe2], pres, hght)[0];
                var te2 = this.interp([pe2], pres, vtmps)[0];
                var tp2 = this.wetLift([pe3], [tp3], [pe2])[0];
                var tdef3 = (this.vtmp([tp3], [tp3], [pe3])[0] - te3) / (te3 + 273.15);
                var tdef2 = (this.vtmp([tp2], [tp2], [pe2])[0] - te2) / (te2 + 273.15);
                var lyrf = ((9.80665 * (tdef3 + tdef2)) / 2) * (h2 - h3);
            }

            // Check for freezing level
            if (te2 < 0 && frzbreaker == 0) {
                var pe3 = pelast;
                var pe3ind = this.myFindIndex(pres, pe3);
                var h3 = this.interp([pe3], pres, hght)[0];
                var te3 = this.interp([pe3], pres, vtmps)[0];
                var tp3 = this.wetLift([pe1], [tp1], [pe3])[0];
                var lyrf = lyre;
                var pe2ind = this.myFindIndex(pres, pe2);
                var te2 = this.interp([pe2], pres, vtmps)[0];
                var tp2 = this.wetLift([pe3], [tp3], [pe2])[0];
                var tdef3 = (this.vtmp([tp3], [tp3], [pe3])[0] - te3) / (te3 + 273.15);
                var tdef2 = (this.vtmp([tp2], [tp2], [pe2])[0] - te2) / (te2 + 273.15);
                var lyrf = ((9.80665 * (tdef3 + tdef2)) / 2) * (hgt0c - h3);
                var frzbreaker = 1;
            }

            // Check for -10C level
            if (te2 < -10 && n10breaker == 0) {
                var pe3 = pelast;
                var pe3ind = this.myFindIndex(pres, pe3);
                var h3 = this.interp([pe3], pres, hght)[0];
                var te3 = this.interp([pe3], pres, vtmps)[0];
                var tp3 = this.wetLift([pe1], [tp1], [pe3])[0];
                var lyrf = lyre;
                var pe2ind = this.myFindIndex(pres, pe2);
                var te2 = this.interp([pe2], pres, vtmps)[0];
                var tp2 = this.wetLift([pe3], [tp3], [pe2])[0];
                var tdef3 = (this.vtmp([tp3], [tp3], [pe3])[0] - te3) / (te3 + 273.15);
                var tdef2 = (this.vtmp([tp2], [tp2], [pe2])[0] - te2) / (te2 + 273.15);
                var lyrf = ((9.80665 * (tdef3 + tdef2)) / 2) * (hgtm10c - h3);
                var n10breaker = 1;
            }

            // Check for -20C level
            if (te2 < -20 && n20breaker == 0) {
                var pe3 = pelast;
                var pe3ind = this.myFindIndex(pres, pe3);
                var h3 = this.interp([pe3], pres, hght)[0];
                var te3 = this.interp([pe3], pres, vtmps)[0];
                var tp3 = this.wetLift([pe1], [tp1], [pe3])[0];
                var lyrf = lyre;
                var pe2ind = this.myFindIndex(pres, pe2);
                var te2 = this.interp([pe2], pres, vtmps)[0];
                var tp2 = this.wetLift([pe3], [tp3], [pe2])[0];
                var tdef3 = (this.vtmp([tp3], [tp3], [pe3])[0] - te3) / (te3 + 273.15);
                var tdef2 = (this.vtmp([tp2], [tp2], [pe2])[0] - te2) / (te2 + 273.15);
                var lyrf = ((9.80665 * (tdef3 + tdef2)) / 2) * (hgtm20c - h3);
                var n20breaker = 1;
            }

            // Check for -30C level
            if (te2 < -30 && n30breaker == 0) {
                var pe3 = pelast;
                var pe3ind = this.myFindIndex(pres, pe3);
                var h3 = this.interp([pe3], pres, hght)[0];
                var te3 = this.interp([pe3], pres, vtmps)[0];
                var tp3 = this.wetLift([pe1], [tp1], [pe3])[0];
                var lyrf = lyre;
                var pe2ind = this.myFindIndex(pres, pe2);
                var te2 = this.interp([pe2], pres, vtmps)[0];
                var tp2 = this.wetLift([pe3], [tp3], [pe2])[0];
                var tdef3 = (this.vtmp([tp3], [tp3], [pe3])[0] - te3) / (te3 + 273.15);
                var tdef2 = (this.vtmp([tp2], [tp2], [pe2])[0] - te2) / (te2 + 273.15);
                var lyrf = ((9.80665 * (tdef3 + tdef2)) / 2) * (hgtm30c - h3);
                var n30breaker = 1;
            }

            // Check for 3km level
            if (lclhght < 3000) {
                if (h1 - hght[0] <= 3000 && h2 - hght[0] >= 3000) {
                    var pe3 = pelast;
                    var pe3ind = this.myFindIndex(pres, pe3);
                    var h3 = this.interp([pe3], pres, hght)[0];
                    var te3 = this.interp([pe3], pres, vtmps)[0];
                    var tp3 = this.wetLift([pe1], [tp1], [pe3])[0];
                    var lyrf = lyre;
                    var h4 = hght[0] + 3000;
                    // Check here
                    var pe4 = this.interpHght([h4], hght, pres);
                    var pe4ind = this.myFindIndex(pres, pe4);
                    var te2 = this.interp([pe4], pres, vtmps)[0];
                    var tp2 = this.wetLift([pe3], [tp3], [pe4])[0];
                    var tdef3 = (this.vtmp([tp3], [tp3], [pe3])[0] - te3) / (te3 + 273.15);
                    var tdef2 = (this.vtmp([tp2], [tp2], [pe4])[0] - te2) / (te2 + 273.15);
                    var lyrf = ((9.80665 * (tdef3 + tdef2)) / 2) * (h4 - h3);
                    if (lyrf > 0 && cape3breaker == 0) {
                        cape3 += lyrf;
                        cape3breaker = 1;
                    }
                }
            } else {
                cape3 = 0;
            }

            // Check for 6km level
            if (lclhght < 6000) {
                if (h1 - hght[0] <= 6000 && h2 - hght[0] >= 6000) {
                    var pe3 = pelast;
                    var pe3ind = this.myFindIndex(pres, pe3);
                    var h3 = this.interp([pe3], pres, hght)[0];
                    var te3 = this.interp([pe3], pres, vtmps)[0];
                    var tp3 = this.wetLift([pe1], [tp1], [pe3])[0];
                    var lyrf = lyre;
                    var h4 = hght[0] + 6000;
                    // Check here
                    var pe4 = this.interpHght([h4], hght, pres);
                    var pe4ind = this.myFindIndex(pres, pe4);
                    var te2 = this.interp([pe4], pres, vtmps)[0];
                    var tp2 = this.wetLift([pe3], [tp3], [pe4])[0];
                    var tdef3 = (this.vtmp([tp3], [tp3], [pe3])[0] - te3) / (te3 + 273.15);
                    var tdef2 = (this.vtmp([tp2], [tp2], [pe4])[0] - te2) / (te2 + 273.15);
                    var lyrf = ((9.80665 * (tdef3 + tdef2)) / 2) * (h4 - h3);
                    if (lyrf > 0 && cape6breaker == 0) {
                        cape6 += lyrf;
                        cape6breaker = 1;
                    }
                }
            } else {
                cape6 = 0;
            }

            var h1 = h2;

            // Check if this is LFC
            if (lyre >= 0 && lyrlast <= 0) {
                var tp3 = tp1;
                var pe2 = pe1;
                var pe3 = pelast;
                var pe3ind = this.myFindIndex(pres, pe3);
                if (
                    this.interp([pe3], pres, vtmps)[0] <
                    this.vtmp(
                        [this.wetLift([pe2], [tp3], [pe3])[0]],
                        [this.wetLift([pe2], [tp3], [pe3])[0]],
                        [pe3],
                    )[0]
                ) {
                    var lfcpres = pe3;
                    var elpres = null;
                    var elhght = null;
                    var mplpres = null;
                } else {
                    while (
                        this.interp([pe3], pres, vtmps)[0] >
                            this.vtmp(
                                [this.wetLift([pe2], [tp3], [pe3])[0]],
                                [this.wetLift([pe2], [tp3], [pe3])[0]],
                                [pe3],
                            )[0] &&
                        pe3 > 0
                    ) {
                        pe3 -= 5;
                    }
                    if (pe3 > 0) {
                        var lfcpres = pe3;
                        const cinh_old = totn;
                        var tote = 0;
                        var li_max = -9999;
                        if (cap_strength < 0) {
                            var cap_strength = 0;
                        }
                        var elpres = null;
                        var elhght = null;
                        var mplpres = null;
                    }
                }
                const lfcpresind = this.myFindIndex(pres, lfcpres);
                var lfchght = this.interp([lfcpres], pres, hght)[0] - hght[0];
                if (lfcpres >= lclpres) {
                    var lfcpres = lclpres;
                    var lfchght = lclhght;
                }
            }

            // Check if this is EL
            if (lyre <= 0 && lyrlast >= 0) {
                var tp3 = tp1;
                var pe2 = pe1;
                var pe3 = pelast;
                var pe3ind = this.myFindIndex(pres, pe3);
                while (
                    this.interp([pe3], pres, vtmps)[0] <
                    this.vtmp(
                        [this.wetLift([pe2], [tp3], [pe3])[0]],
                        [this.wetLift([pe2], [tp3], [pe3])[0]],
                        [pe3],
                    )[0]
                ) {
                    pe3 -= 5;
                }
                var elpres = pe3;
                const elpresind = this.myFindIndex(pres, elpres);
                var elhght = this.interp([elpres], pres, hght)[0] - hght[0];
                var mplpres = null;
            }

            // Check if this is MPL
            if (tote < 0 && !mplpres && elpres) {
                var pe3 = pelast;
                var pe3ind = this.myFindIndex(pres, pe3);
                var h3 = this.interp([pe3], pres, hght)[0];
                var te3 = this.interp([pe3], pres, vtmps)[0];
                var tp3 = this.wetLift([pe1], [tp1], [pe3])[0];
                let totx = tote - lyre;
                var pe2 = pelast;
                while (totx > 0) {
                    pe2 -= 1;
                    var pe2ind = this.myFindIndex(pres, pe2);
                    var te2 = this.interp([pe2], pres, vtmps)[0];
                    var tp2 = this.wetLift([pe3], [tp3], [pe2])[0];
                    var h2 = this.interp([pe2], pres, hght)[0];
                    var tdef3 = (this.vtmp([tp3], [tp3], [pe3])[0] - te3) / (te3 + 273.15);
                    var tdef2 = (this.vtmp([tp2], [tp2], [pe2])[0] - te2) / (te2 + 273.15);
                    var lyrf = ((9.80665 * (tdef3 + tdef2)) / 2) * (h2 - h3);
                    totx += lyrf;
                    var tp3 = tp2;
                    var te3 = te2;
                    var pe3 = pe2;
                }
                var mplpres = pe2;
                const mplpresind = this.myFindIndex(pres, mplpres);
                const mplhght = this.interp([mplpres], pres, hght)[0] - hght[0];
            }

            // 500 hPa Lifted Index
            if (pres[i] <= 500 && libreaker == 0) {
                const a = this.interp([500], pres, vtmps)[0];
                const b = this.wetLift([pe1], [tp1], [500])[0];
                var li5 = a - this.vtmp([b], [b], [500])[0];
                var libreaker = 1;
            }
        }
        if (totp == 0) {
            totn = 0;
        }
        return [totp, totn, lclhght, li5, lfchght, elhght, cape3, ptrace, ttrace];
    }

    // Lift parcel to LCL
    static dryLift(t, d, p) {
        const p2t2 = t.map((element, idx) => {
            const t2 = this.lclTemp(element, d[idx]);
            const p2 = this.thalvl(this.theta([p[idx]], [element], [1000])[0], t2);
            return [p2, t2];
        });
        return p2t2;
    }

    // Temperature of parcel lifted to LCL
    static lclTemp(t, d) {
        const s = t - d;
        const dlt = s * (1.2185 + 0.001278 * t + s * (-0.00219 + 1.173e-5 * s - 0.0000052 * t));
        return t - dlt;
    }

    // Pressure level of parcel
    static thalvl(theta, t2) {
        var t2 = t2 + 273.15;
        var theta = theta + 273.15;
        return 1000 / (theta / t2) ** (1 / 0.28571426);
    }

    // Lift a parcel moist adiabatically
    static wetLift(p, t, p2) {
        const sl = t.map((element, idx) => {
            const thta = this.theta([p[idx]], [element], [1000])[0];
            const thetam = thta - this.wobf(thta) + this.wobf(element);
            return this.satlift(p2, thetam);
        });
        return sl;
    }

    // Wobus function for computing moist adiabats
    static wobf(t) {
        var t = t - 20;
        if (t <= 0) {
            let npol =
                1 +
                t *
                    (-8.841660499999999e-3 +
                        t *
                            (1.4714143e-4 +
                                t *
                                    (-9.671989000000001e-7 +
                                        t * (-3.2607217e-8 + t * -3.8598073e-10))));
            npol = 15.13 / npol ** 4;
            return npol;
        }
        let ppol =
            t *
            (4.9618922e-7 +
                t *
                    (-6.1059365e-9 +
                        t * (3.9401551e-11 + t * (-1.2588129e-13 + t * 1.668828e-16))));
        ppol = 1 + t * (3.6182989e-3 + t * (-1.3603273e-5 + ppol));
        ppol = 29.93 / ppol ** 4 + 0.96 * t - 14.8;
        return ppol;
    }

    // Returns the temperature (C) of a saturated parcel (thm) when lifted to a
    // new pressure level (hPa)
    static satlift(p, thetam) {
        if (Math.abs(p - 1000) - 0.001 <= 0) {
            return thetam;
        }
        let eor = 999;
        while (Math.abs(eor) - 0.1 > 0) {
            if (eor == 999) {
                var pwrp = (p / 1000) ** 0.28571426;
                var t1 = (thetam + 273.15) * pwrp - 273.15;
                var e1 = this.wobf(t1) - this.wobf(thetam);
                var rate = 1;
            } else {
                var rate = (t2 - t1) / (e2 - e1);
                var t1 = t2;
                var e1 = e2;
            }
            var t2 = t1 - e1 * rate;
            var e2 = (t2 + 273.15) / pwrp - 273.15;
            e2 += this.wobf(t2) - this.wobf(e2) - thetam;
            eor = e2 * rate;
        }
        return t2 - eor;
    }

    // Create an array between start and stop with step valeus
    static range(start, stop, step) {
        if (typeof stop === 'undefined') {
            // one param defined
            stop = start;
            start = 0;
        }

        if (typeof step === 'undefined') {
            step = 1;
        }

        if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
            return [];
        }

        const result = [];
        for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
            result.push(i);
        }
        return result;
    }

    // Calculate virtual temperature
    static vtmp(t, dwpc, pres) {
        const tmpk = t.map((element, idx) => element + 273.15);
        const vt = this.mixRatio(pres, dwpc).map((element, idx) => {
            const w = element * 0.001;
            return (tmpk[idx] * (1 + w / 0.62197)) / (1 + w) - 273.15;
        });
        return vt;
    }

    // Calculate level of first occurrence of given temperature
    static temp_lvl(t, p, tref) {
        // Work in log coordinates
        const logpres = p.map((element, idx) => Math.log10(element));

        // Difference between temps for subsequent layers
        const difft = t.map((element, idx) => element - tref);

        // If minimum difference positive, temp is never reached
        if (Math.min.apply(Math, difft) > 0) {
            return null;
        }

        // Find if temperature is in the exact profile
        var ind = null;
        for (let i = 0; i <= t.length - 1; i++) {
            if (t[i] == tref) {
                ind = i;
                break;
            }
        }

        // Find first layer where difference is nevative
        const difft1 = difft.slice(0, difft.length - 1);
        const difft2 = difft.slice(1, difft.length);
        for (let i = 0; i <= difft1.length; i++) {
            if (difft1[i] * difft2[i] < 0) {
                var ind = i;
                break;
            }
        }

        // Return interpolated pressure level between two layers
        return 10 ** this.linear(tref, [t[ind + 1], t[ind]], [logpres[ind + 1], logpres[ind]]);
    }

    // Interpolate field to given height
    static interpHght(h, hght, field) {
        const logfield = field.map((element, idx) => Math.log10(element));
        const interped = this.linear(h, hght, logfield);
        if (interped.length == 1) {
            return 10 ** interped;
        }
        const out = interped.map((element, idx) => 10 ** element);
        return out;
    }

    // Pressure level of most unstable layer
    static mostUnstableLayer(profile) {
        const { pres } = profile;
        const { tmpc } = profile;
        const { dwpc } = profile;
        const pbot = pres[0];
        const ptop = pbot - 300;
        const indbottom = this.myFindIndex(pres, pbot);
        const indtop = this.myFindIndex(pres, ptop, 'u');
        const t1 = this.interp([pbot], pres, tmpc)[0];
        var t2 = this.interp([ptop], pres, tmpc)[0];
        const d1 = this.interp([pbot], pres, dwpc)[0];
        const d2 = this.interp([ptop], pres, dwpc)[0];
        var t = tmpc.slice(indbottom, indtop);
        var d = dwpc.slice(indbottom, indtop);
        var p = pres.slice(indbottom, indtop);
        var t = [t1].concat(t).concat([t2]);
        var d = [d1].concat(d).concat([d2]);
        var p = [pbot].concat(p).concat([ptop]);
        const p2t2 = this.dryLift(t, d, p);
        const p2 = p2t2.map((element, index) => element[0]);
        var t2 = p2t2.map((element, index) => element[1]);

        const mt = this.wetLift(p2, t2, 1000);
        const muindcheck = (element) => Math.abs(element - Math.max.apply(Math, mt)) < 1e-10;
        const muind = mt.findIndex(muindcheck);
        return p[muind];
    }

    // Convert to height relative to mean sea level
    static toMSL(hght, h) {
        return h + hght[0];
    }

    static components(pres, p, ind, uwnd, vwnd) {
        const U = this.interp([p], pres, uwnd)[0];
        const V = this.interp([p], pres, vwnd)[0];
        return [U, V];
    }

    // Wind magnitude from components
    static mag(u, v) {
        return Math.sqrt(u ** 2 + v ** 2);
    }

    // Bunkers storm relative winds (right and left)
    static bunkers(profile, muCAPE, muCINH, muEL) {
        const { hght } = profile;
        const { pres } = profile;
        const d = 7.5 * 1.94384449;

        var [pbot, ptop] = this.effectiveInflowLayer(profile, muCAPE, muCINH);
        if (pbot && ptop) {
            const base = this.interp([pbot], pres, hght)[0] - hght[0];
            if (muCAPE > 100 && muEL !== null) {
                const depth = muEL - base;
                const htop = base + depth * (65 / 100);
                var ptop = this.interpHght(htop + hght[0], hght, pres);
                const [uavg, vavg] = this.meanWind(profile, pbot, ptop);
                const [sru, srv] = this.shear(profile, pbot, ptop);
                const srmag = this.mag(sru, srv);
                const uchg = (d / srmag) * srv;
                const vchg = (d / srmag) * sru;
                var rstu = uavg + uchg;
                var rstv = vavg - vchg;
                var lstu = uavg - uchg;
                var lstv = vavg + vchg;
            } else {
                [rstu, rstv, lstu, lstv] = this.nonParcelBunkers(profile);
            }
        } else {
            return [null, null, null, null];
        }
        return [rstu, rstv, lstu, lstv];
    }

    // Top and bottom pressure of effective inflow layer
    static effectiveInflowLayer(profile, muCAPE, muCINH) {
        const { pres } = profile;
        if (muCAPE != 0) {
            if (muCAPE >= 100 && muCINH > -250) {
                for (i = 0; i < profile.pres.length; i++) {
                    var tmpci = profile.tmpc[i];
                    var dwpci = profile.dwpc[i];
                    var presi = profile.pres[i];
                    var [pclCAPE, pclCINH] = this.shortcape(profile, tmpci, dwpci, presi, false);
                    if (pclCAPE >= 100 && pclCINH > -250) {
                        var pbot = pres[i];
                        break;
                    }
                }
                bptr = i;
                for (i = bptr; i < profile.pres.length; i++) {
                    var tmpci = profile.tmpc[i];
                    var dwpci = profile.dwpc[i];
                    var presi = profile.pres[i];
                    var [pclCAPE, pclCINH] = this.shortcape(profile, tmpci, dwpci, presi, false);
                    if (pclCAPE < 100 || pclCINH <= -250) {
                        var ptop = pres[i - 1];
                        break;
                    }
                    if (ptop > pbot) {
                        var ptop = pbot;
                    }
                }
            }
        } else {
            pbot = null;
            ptop = null;
        }
        return [pbot, ptop];
    }

    // CAPE function without frills
    static shortcape(profile, pcltmpc, pcldwpc, pclpres, trunc) {
        const { tmpc } = profile;
        const { dwpc } = profile;
        const { pres } = profile;
        const { hght } = profile;
        const vtmps = profile.vtmp;

        let totp = 0;
        var totn = 0;

        var pbot = pres[0];
        const ptop = pres[pres.length - 1];
        if (pbot > pclpres) {
            var pbot = pclpres;
        }
        var pe1 = pbot;
        // CINH in the boundary layer
        var pe1ind = this.myFindIndex(pres, pe1, 'u');
        var h1 = this.interp([pe1], pres, hght)[0];
        var tp1 = this.vtmp([pcltmpc], [pcldwpc], [pclpres])[0];

        var [pe2, tp2] = this.dryLift([pcltmpc], [pcldwpc], [pclpres])[0];
        const blupper = Math.floor(pe2);
        const blmr = this.mixRatio([pclpres], [pcldwpc])[0];
        const pp = this.range(blupper, pbot + 10, 10).slice();
        const hh = this.interp(pp, pres, hght);
        const tmp_env_theta = this.theta(pp, this.interp(pp, pres, tmpc), 1000);
        const tv_env = this.vtmp(tmp_env_theta, this.interp(pp, pres, dwpc), pp);
        const theta_parcel = this.theta([pe2], [tp2], [1000])[0];
        const tmp1 = this.vtmpSpecial(theta_parcel, this.tempAtMR(blmr, pp), pp);
        const tdef = tmp1.map((element, idx) => (element - tv_env[idx]) / (tv_env[idx] + 273.15));
        const tidx1 = Array.from(new Array(tdef.length - 1), (x, i) => i + 0);
        const tidx2 = Array.from(new Array(tdef.length - 1), (x, i) => i + 1);
        const tidxsum = tidx1.map(
            (element, idx) =>
                ((-1 * 9.80665 * (tdef[element] + tdef[tidx2[idx]])) / 2) *
                ((hh[tidx2[idx]] - hh[element]) / 10),
        );
        var totn = 0;
        for (let i = 0; i < tidxsum.length; i++) {
            if (tidxsum[i] < 0) {
                totn += tidxsum[i] * 10;
            }
        }
        // Reset bottom of layer to pressure of LCL
        if (pbot > pe2) {
            var pbot = pe2;
        }

        const lptr = this.myFindIndex(pres, pbot);
        const uptr = this.myFindIndex(pres, ptop, 'u');

        var pe1 = pbot;
        var pe1ind = this.myFindIndex(pres, pe1);
        var h1 = this.interp([pe1], pres, hght)[0];
        var te1 = this.interp([pe1], pres, vtmps)[0];
        var tp1 = this.wetLift([pe2], [tp2], [pe1])[0];
        var lyre = 0;

        // Begin iterative ascent
        for (let i = lptr; i <= uptr; i++) {
            var pe2 = pres[i];
            var h2 = hght[i];
            var te2 = vtmps[i];
            // Moist lift parcel from pe1 to pe2
            var tp2 = this.wetLift([pe1], [tp1], [pe2])[0];
            const tdef1 = (this.vtmp([tp1], [tp1], [pe1])[0] - te1) / (te1 + 273.15);
            var tdef2 = (this.vtmp([tp2], [tp2], [pe2])[0] - te2) / (te2 + 273.15);

            // Calculate average layer energy, add to CAPE, CINH
            var lyre = ((9.80665 * (tdef1 + tdef2)) / 2) * (h2 - h1);
            if (lyre > 0) {
                totp += lyre;
            } else if (pe2 > 500) {
                totn += lyre;
            }
            var pe1 = pe2;
            var te1 = te2;
            var tp1 = tp2;
            var h1 = h2;
            // Lift to interpolated top of the layer if this is last layer
            if ((trunc && pe2 <= 500) || i >= uptr) {
                const pe3 = pe1;
                const h3 = h2;
                const te3 = te1;
                const tp3 = tp1;
                var lyrf = lyre;

                if (lyrf > 0) {
                    var outcape = totp - lyrf;
                    var outcinh = totn;
                } else {
                    var outcape = totp;
                    if (pe2 > 500) {
                        var outcinh = totn + lyrf;
                    } else {
                        var outcinh = totn;
                    }
                }

                var pe2 = ptop;
                var h2 = this.interp([pe2], pres, hght)[0];
                var te2 = this.interp([pe2], pres, vtmps)[0];
                var tp2 = this.wetLift([pe3], [tp3], [pe2])[0];
                const tdef3 = (this.vtmp([tp3], [tp3], [pe3])[0] - te3) / (te3 + 273.15);
                var tdef2 = (this.vtmp([tp2], [tp2], [pe2])[0] - te2) / (te2 + 273.15);
                var lyrf = ((9.80665 * (tdef3 + tdef2)) / 2) * (h2 - h3);

                if (lyrf > 0) {
                    outcape += lyrf;
                } else if (pe2 > 500) {
                    outcinh += lyrf;
                }
                if (outcape == 0) {
                    var outcinh = 0;
                }
                break;
            }
        }
        return [outcape, outcinh];
    }

    // Virtual temperature special case
    static vtmpSpecial(tmpc, dwpc, pres) {
        const tmpk = tmpc + 273.15;
        const vt = this.mixRatio(pres, dwpc).map((element, idx) => {
            const w = element * 0.001;
            return (tmpk * (1 + w / 0.62197)) / (1 + w) - 273.15;
        });
        return vt;
    }

    // Max wind through layer
    static maxWind(profile, pbot, ptop) {
        const ps = this.range(ptop - 10, pbot + 10, 10);
        const { pres } = profile;
        const { uwnd } = profile;
        const { vwnd } = profile;
        const [u, v] = this.componentsArr(pres, ps, uwnd, vwnd);
        const mags = u.map((element, idx) => this.mag(element, v[idx]));
        const maxMag = Math.max(...mags);
        const maxMagIdx = mags.indexOf(maxMag);
        const umax = u[maxMagIdx];
        const vmax = v[maxMagIdx];
        return [umax, vmax];
    }

    // Mean wind over layer
    static meanWind(profile, pbot, ptop) {
        const ps = this.range(ptop, pbot + 10, 10);
        const { pres } = profile;
        const { uwnd } = profile;
        const { vwnd } = profile;
        const [u, v] = this.componentsArr(pres, ps, uwnd, vwnd);
        let pssum = 0;
        ps.map((element, idx) => {
            pssum += element;
        });
        const pswts = ps.map((element, idx) => element / pssum);
        let uavg = 0;
        let vavg = 0;
        u.map((element, idx) => {
            uavg += element * pswts[idx];
            vavg += v[idx] * pswts[idx];
        });
        return [uavg, vavg];
    }

    static componentsArr(pres, p, uwnd, vwnd) {
        const U = this.interp(p, pres, uwnd);
        const V = this.interp(p, pres, vwnd);
        return [U, V];
    }

    // Compute the Bunkers Storm Motion for a Right Moving Supercell
    static nonParcelBunkers(profile) {
        const { pres } = profile;
        const { hght } = profile;
        const { uwnd } = profile;
        const { vwnd } = profile;
        const d = 7.5 * 1.94384449;
        const msl6km = 6000 + hght[0];
        const p6km = this.interpHght(msl6km, hght, pres);
        const [mnu6, mnv6] = this.meanWindNpw(pres, uwnd, vwnd, pres[0], p6km);
        const [shru, shrv] = this.shear(profile, pres[0], p6km);
        const tmp = d / this.mag(shru, shrv);
        const rstu = mnu6 + tmp * shrv;
        const rstv = mnv6 - tmp * shru;
        const lstu = mnu6 - tmp * shrv;
        const lstv = mnv6 + tmp * shru;
        return [rstu, rstv, lstu, lstv];
    }

    // Non pressure weighted mean wind
    static meanWindNpw(pres, uwnd, vwnd, pbot, ptop) {
        const ps = this.range(ptop, pbot + 10, 10);
        const [u, v] = this.componentsArr(pres, ps, uwnd, vwnd);
        let usum = 0;
        let vsum = 0;
        u.map((element, idx) => {
            usum += element;
            vsum += v[idx];
        });
        const uavg = usum / u.length;
        const vavg = vsum / v.length;
        return [uavg, vavg];
    }

    // Storm relative helicity
    static helicity(profile, lower, upper, stu, stv) {
        const { hght } = profile;
        const { pres } = profile;
        const { uwnd } = profile;
        const { vwnd } = profile;
        var lower = this.toMSL(hght, lower);
        var upper = this.toMSL(hght, upper);
        const plower = this.interpHght(lower, hght, pres);
        const pupper = this.interpHght(upper, hght, pres);
        const ind1 = this.myFindIndex(pres, plower);
        const ind2 = this.myFindIndex(pres, pupper, 'u');
        const [u1, v1] = this.components(pres, plower, ind1, uwnd, vwnd);
        const [u2, v2] = this.components(pres, pupper, ind2, uwnd, vwnd);
        const u = [u1].concat(uwnd.slice(ind1, ind2)).concat([u2]);
        const v = [v1].concat(vwnd.slice(ind1, ind2)).concat([v2]);

        const sru = u.map((element, idx) => 0.514444 * (element - stu));
        const srv = v.map((element, idx) => 0.514444 * (element - stv));

        const sru1 = sru.slice(0, sru.length - 1);
        const sru2 = sru.slice(1, sru.length);
        const srv1 = srv.slice(0, srv.length - 1);
        const srv2 = srv.slice(1, srv.length);

        const layers = sru2.map((element, idx) => element * srv1[idx] - sru1[idx] * srv2[idx]);
        let phel = 0;
        let nhel = 0;
        layers.map((element, idx) => {
            if (element > 0) {
                phel += element;
            } else {
                nhel += element;
            }
        });
        return [phel + nhel, nhel];
    }

    // Calculate wind vector from components
    static comp2vec(u, v) {
        let wdir = (180 / Math.PI) * Math.atan2(-u, -v);
        const wdsp = Math.sqrt(u ** 2 + v ** 2);
        if (wdir < 0) {
            wdir += 360;
        }
        return [wdsp, wdir];
    }

    // Significant tornado parameter for fixed layer
    static stpFixed(sfcCAPE, sfcLCL, right_srh1km, bwd6) {
        if (sfcLCL < 1000) {
            var lclTerm = 1.0;
        } else if (sfcLCL > 2000) {
            var lclTerm = 0.0;
        } else {
            var lclTerm = (2000 - sfcLCL) / 1000;
        }

        if (bwd6 > 30) {
            var bwd6 = 30;
        } else if (bwd6 < 12.5) {
            var bwd6 = 0.0;
        }

        const bwd6Term = bwd6 / 20;

        const capeTerm = sfcCAPE / 1500;
        const srhTerm = right_srh1km / 150;

        const stp_fixed = capeTerm * lclTerm * srhTerm * bwd6Term;
        return stp_fixed;
    }

    // Precipitable water
    static precipWater(profile) {
        const { pres } = profile;
        const { dwpc } = profile;
        const pbot = pres[0];
        const ptop = 400;

        const ind1 = this.myFindIndex(pres, pbot);
        const ind2 = this.myFindIndex(pres, ptop, 'u');
        const dwpt1 = this.interp([pbot], pres, dwpc)[0];
        const dwpt2 = this.interp([ptop], pres, dwpc)[0];
        const dwpt = [dwpt1].concat(dwpc.slice(ind1, ind2)).concat([dwpt2]);
        const p = [pbot].concat(pres.slice(ind1, ind2)).concat([ptop]);
        const mr = this.mixRatio(p, dwpt);
        const mr1 = mr.slice(0, mr.length - 1);
        const mr2 = mr.slice(1, mr.length);
        const p1 = p.slice(0, p.length - 1);
        const p2 = p.slice(1, p.length);
        let sum = 0;
        mr1.map((element, idx) => {
            sum += ((element + mr2[idx]) / 2) * (p1[idx] - p2[idx]) * 0.00040173;
        });
        return sum;
    }

    // Theta-e index
    static tei(profile) {
        const { hght } = profile;
        const { pres } = profile;
        const { tmpc } = profile;
        const { dwpc } = profile;
        const vtmps = profile.vtmp;
        const sfcpres = pres[0];
        const toppres = sfcpres - 400;

        const topidx = this.myFindIndex(pres, toppres);

        let minthetae = 999;
        let maxthetae = -999;
        for (let i = 0; i <= topidx; i++) {
            const the = this.thetae([pres[i]], [tmpc[i]], [dwpc[i]])[0];
            if (the < minthetae) {
                minthetae = the;
            }
            if (the > maxthetae) {
                maxthetae = the;
            }
        }
        return maxthetae - minthetae;
    }

    // Equivalent potential temperature
    static thetae(pres, temp, dwpt) {
        const p2t2 = this.dryLift(temp, dwpt, pres);
        const p2 = [];
        const t2 = [];
        p2t2.map((element, idx) => {
            p2.push(element[0]);
            t2.push(element[1]);
        });
        const p1 = Array(p2.length).fill(100);
        return this.theta(p1, this.wetLift(p2, t2, 100), 1000);
    }

    // Downward convective available potential energy
    static dCAPE(profile) {
        const { pres } = profile;
        var { tmpc } = profile;
        const { dwpc } = profile;
        var { tmpc } = profile;
        const { hght } = profile;
        const the = this.thetae(pres, tmpc, dwpc);
        const wetbulb = this.wetBulb(pres, tmpc, dwpc);
        const idx = this.myFindIndex(pres, profile.pres[0] - 400);
        var mine = 1000.0;
        var minp = -999.0;

        for (let i = 0; i <= idx; i++) {
            const pbot = pres[i];
            const ptop = pres[i] - 100;
            const thta_e_mean = this.meanThetae(profile, pbot, ptop);
            if (thta_e_mean < mine) {
                var minp = pres[i] - 50;
                var mine = thta_e_mean;
            }
        }
        const upper = minp;
        const uptr = this.myFindIndex(pres, upper) - 1;

        var tp1 = this.wetBulb(
            [upper],
            [this.interp([upper], pres, tmpc)[0]],
            [this.interp([upper], pres, dwpc)[0]],
        )[0];
        var pe1 = upper;
        var te1 = this.interp([pe1], pres, tmpc)[0];
        var h1 = this.interp([pe1], pres, hght)[0];
        let tote = 0;
        var lyre = 0;

        const ttrace = [tp1];
        const ptrace = [upper];

        const ttraces = Array(uptr).fill(0);
        const ptraces = Array(uptr).fill(0);
        for (let i = uptr; i >= 0; i--) {
            const pe2 = pres[i];
            const te2 = tmpc[i];
            const h2 = hght[i];
            var tp2 = this.wetLift([pe1], [tp1], [pe2])[0];
            const tdef1 = (tp1 - te1) / (te1 + 273.15);
            const tdef2 = (tp2 - te2) / (te2 + 273.15);
            const lyrlast = lyre;
            var lyre = ((9.8 * (tdef1 + tdef2)) / 2.0) * (h2 - h1);
            tote += lyre;

            ttraces[i] = tp2;
            ptraces[i] = pe2;

            var pe1 = pe2;
            var te1 = te2;
            var h1 = h2;
            var tp1 = tp2;
        }
        const drtemp = tp2;
        const ttraceout = ttrace.concat(ttraces.slice().reverse());
        const downT = ttraceout[ttraceout.length - 1];
        return [tote, downT];
    }

    // Mean equivalent potential temperature over layer
    static meanThetae(profile, pbot, ptop) {
        const { pres } = profile;
        const { tmpc } = profile;
        const { dwpc } = profile;
        const ind1 = this.myFindIndex(pres, pbot);
        const ind2 = this.myFindIndex(pres, ptop, 'u');
        const tmpc0 = this.interp([pbot], pres, tmpc)[0];
        const dwpc0 = this.interp([pbot], pres, dwpc)[0];
        const thetae1 = this.thetae([pbot], [tmpc0], [dwpc0])[0];
        const tmpc1 = this.interp([ptop], pres, tmpc)[0];
        const dwpc1 = this.interp([ptop], pres, dwpc)[0];
        const thetae2 = this.thetae([ptop], [tmpc1], [dwpc1])[0];
        const thetaemid = this.thetae(
            pres.slice(ind1, ind2),
            tmpc.slice(ind1, ind2),
            dwpc.slice(ind1, ind2),
        );
        const thetaes = [thetae1].concat(thetaemid).concat(thetaemid).concat([thetae2]);

        const tott = thetaes.reduce((partialSum, a) => partialSum + a, 0) / 2;
        const num = thetaes.length / 2;
        const thtae = tott / num;
        return thtae;
        // var thta = tott / num;
    }

    // Wet bulb temperature
    static wetBulb(pres, temp, dwpt) {
        const p2t2 = this.dryLift(temp, dwpt, pres);
        const p2 = [];
        const t2 = [];
        p2t2.map((element, idx) => {
            p2.push(element[0]);
            t2.push(element[1]);
        });

        return this.wetLiftSpecial(p2, t2, pres);
    }

    // Wet lift special case
    static wetLiftSpecial(p, t, p2) {
        const sl = t.map((element, idx) => {
            const thta = this.theta([p[idx]], [element], [1000])[0];
            const thetam = thta - this.wobf(thta) + this.wobf(element);
            return this.satlift(p2[idx], thetam);
        });
        return sl;
    }

    // K-index
    static kIndex(profile) {
        const { pres } = profile;
        const { tmpc } = profile;
        const { dwpc } = profile;
        const t8 = this.interp([850], pres, tmpc)[0];
        const t7 = this.interp([700], pres, tmpc)[0];
        const t5 = this.interp([500], pres, tmpc)[0];
        const td7 = this.interp([700], pres, dwpc)[0];
        const td8 = this.interp([850], pres, dwpc)[0];
        return t8 - t5 + td8 - (t7 - td7);
    }

    // Total totals
    static tTotals(profile) {
        const ctotal = this.cTotals(profile);
        const vtotal = this.vTotals(profile);
        return ctotal + vtotal;
    }

    // c-totals
    static cTotals(profile) {
        const { dwpc } = profile;
        const { tmpc } = profile;
        const { pres } = profile;
        return this.interp([850], pres, dwpc)[0] - this.interp([500], pres, tmpc)[0];
    }

    // v-totals
    static vTotals(profile) {
        const { dwpc } = profile;
        const { tmpc } = profile;
        const { pres } = profile;
        profile.vtotals = this.interp([850], pres, tmpc)[0] - this.interp([500], pres, tmpc)[0];
        return this.interp([850], pres, tmpc)[0] - this.interp([500], pres, tmpc)[0];
    }

    // Wind damage parameter
    static wndg(profile, mlCAPE, mlCINH) {
        const { hght } = profile;
        const { pres } = profile;
        let lr03 = this.lapseRate(profile, 0, 3000);
        const bot = this.interpHght([1000], hght, pres);
        const top = this.interpHght([3500], hght, pres);

        const [mean_windu, mean_windv] = this.meanWind(profile, bot, top);
        let mean_wind = this.mag(mean_windu, mean_windv);
        mean_wind *= 0.514444;
        if (lr03 < 7) {
            lr03 = 0;
        }
        if (mlCINH < -50) {
            mlCINH = -50;
        }
        const wdamage = (mlCAPE / 2000) * (lr03 / 9) * (mean_wind / 15) * ((50 + mlCINH) / 40);
        return wdamage;
    }

    // Lapse rate over layer
    static lapseRate(profile, lower, upper, prescoord = false) {
        const { hght } = profile;
        const { vtmp } = profile;
        const { pres } = profile;
        if (!prescoord) {
            var z1 = this.toMSL(hght, lower);
            var z2 = this.toMSL(hght, upper);
            var p1 = this.interpHght([z1], hght, pres);
            var p2 = this.interpHght([z2], hght, pres);
        } else {
            if (pres[-1] > upper) {
                return null;
            }
            var p1 = lower;
            var p2 = upper;
            var z1 = this.interp([lower], pres, hght)[0];
            var z2 = this.interp([upper], pres, hght)[0];
        }
        const tv1 = this.interp([p1], pres, vtmp)[0];
        const tv2 = this.interp([p2], pres, vtmp)[0];
        return ((tv2 - tv1) / (z2 - z1)) * -1000;
    }

    // Convective temperature
    static convectiveTemp(profile) {
        const mincinh = 0;
        const { dwpc } = profile;
        const { tmpc } = profile;
        const { pres } = profile;
        const mmr = this.meanMR(profile)[0];
        const pres1 = pres[0];
        let tmpc1 = tmpc[0];
        const dwpc1 = this.tempAtMRSpecial([mmr], [pres1])[0];
        var [pclCAPE, pclCINH] = this.shortcape(profile, tmpc1 + 25, dwpc1, pres1, true);
        if (pclCAPE == 0 || pclCINH < mincinh) {
            return null;
        }
        const excess = dwpc1 - tmpc1;
        if (excess > 0) {
            tmpc1 = tmpc1 + excess + 4;
        }
        var [pclCAPE, pclCINH] = this.shortcape(profile, tmpc1, dwpc1, pres1, true);
        if (pclCAPE == 0) {
            pclCINH = null;
        }
        while (pclCINH < mincinh) {
            if (pclCINH < -100) {
                tmpc1 += 2;
            } else {
                tmpc1 += 0.5;
            }
            var [pclCAPE, pclCINH] = this.shortcape(profile, tmpc1, dwpc1, pres1, true);
            if (pclCAPE == 0) {
                pclCINH = null;
            }
        }
        return tmpc1;
    }

    // Temperature for given mixing ratio special case
    static tempAtMRSpecial(w, p) {
        const c1 = 0.0498646455;
        const c2 = 2.4082965;
        const c3 = 7.07475;
        const c4 = 38.9114;
        const c5 = 0.0915;
        const c6 = 1.2035;
        const x = p.map((element, idx) => {
            var x = Math.log10((w[idx] * element) / (622 + w[idx]));
            var x = 10 ** (c1 * x + c2) - c3 + c4 * (10 ** (c5 * x) - c6) ** 2 - 273.15;
            return x;
        });

        return x;
    }

    // maximum temperature forecast based on the depth of the mixing
    // layer and low-level temperatures
    static maxT(profile) {
        const { tmpc } = profile;
        const { pres } = profile;
        const mixlayerdepth = 100;
        const sfcpres = pres[0];
        const mixlayer = sfcpres - mixlayerdepth;
        const temp = this.interp([mixlayer], pres, tmpc)[0] + 273.15 + 2;
        return temp * (sfcpres / mixlayer) ** 0.28571426 - 273.15;
    }

    // Microburst parameter
    static mburst(profile, pwat, dcape, thetaei, sfcCAPE, sfcLI) {
        const lrsfc3km = this.lapseRate(profile, 0, 3000);
        const sfcpres = profile.pres[0];
        const sfctmpc = profile.tmpc[0];
        const sfcdwpc = profile.dwpc[0];
        const sfc_thetae = this.thetae([sfcpres], [sfctmpc], [sfcdwpc])[0];
        const vt = this.vTotals(profile);

        if (sfc_thetae + 273.15 >= 355) {
            var te = 1;
        } else {
            var te = 0;
        }

        if (sfcCAPE < 2000) {
            var sfcCAPETerm = -5;
        }
        if (sfcCAPE >= 2000) {
            var sfcCAPETerm = 0;
        }
        if (sfcCAPE >= 3300) {
            var sfcCAPETerm = 1;
        }
        if (sfcCAPE >= 3700) {
            var sfcCAPETerm = 2;
        }
        if (sfcCAPE >= 4300) {
            var sfcCAPETerm = 4;
        }

        if (sfcLI > -7.5) {
            var sfcLITerm = 0;
        }
        if (sfcLI <= -7.5) {
            var sfcLITerm = 1;
        }
        if (sfcLI <= -9.0) {
            var sfcLITerm = 2;
        }
        if (sfcLI <= -10.0) {
            var sfcLITerm = 3;
        }

        if (pwat < 1.5) {
            var pwatTerm = -3;
        } else {
            var pwatTerm = 0;
        }

        if (pwat > 1.7) {
            if (dcape > 900) {
                var dcapeTerm = 1;
            } else {
                var dcapeTerm = 0;
            }
        } else {
            var dcapeTerm = 0;
        }

        if (lrsfc3km <= 8.4) {
            var lr03Term = 0;
        } else {
            var lr03Term = 1;
        }

        if (vt < 27) {
            var vtTerm = 0;
        } else if (vt >= 27 && vt < 28) {
            var vtTerm = 1;
        } else if (vt >= 28 && vt < 29) {
            var vtTerm = 2;
        } else {
            var vtTerm = 3;
        }

        if (thetaei >= 35) {
            var ted = 1;
        } else {
            var ted = 0;
        }

        var mburstval =
            te + sfcCAPETerm + sfcLITerm + pwatTerm + dcapeTerm + lr03Term + vtTerm + ted;
        if (mburstval < 0) {
            var mburstval = 0;
        }
        return mburstval;
    }

    // Calculates the top and bottom of the effective inflow layer
    static effectiveInflowLayer(profile, muCAPE, muCINH) {
        const { pres } = profile;
        if (muCAPE != 0) {
            if (muCAPE >= 100 && muCINH > -250) {
                for (var i = 0; i < profile.pres.length; i++) {
                    var tmpci = profile.tmpc[i];
                    var dwpci = profile.dwpc[i];
                    var presi = profile.pres[i];
                    var [pclCAPE, pclCINH] = this.shortcape(profile, tmpci, dwpci, presi, false);
                    if (pclCAPE >= 100 && pclCINH > -250) {
                        var pbot = pres[i];
                        break;
                    }
                }
                const bptr = i;
                for (var i = bptr; i < profile.pres.length; i++) {
                    var tmpci = profile.tmpc[i];
                    var dwpci = profile.dwpc[i];
                    var presi = profile.pres[i];
                    var [pclCAPE, pclCINH] = this.shortcape(profile, tmpci, dwpci, presi, false);
                    if (pclCAPE < 100 || pclCINH <= -250) {
                        var ptop = pres[i - 1];
                        break;
                    }
                    if (ptop > pbot) {
                        var ptop = pbot;
                    }
                }
            }
        } else {
            var pbot = null;
            var ptop = null;
        }
        return [pbot, ptop];
    }

    // Wind shear between two levels
    static shear(profile, pbot, ptop, stu, stv) {
        const { pres } = profile;
        const { uwnd } = profile;
        const { vwnd } = profile;

        const indbottom = this.myFindIndex(pres, pbot);
        const indtop = this.myFindIndex(pres, ptop, 'u');

        const [ubot, vbot] = this.components(pres, pbot, indbottom, uwnd, vwnd);
        const [utop, vtop] = this.components(pres, ptop, indtop, uwnd, vwnd);

        const u = [ubot].concat(uwnd.slice(indbottom, indtop)).concat([utop]);
        const v = [vbot].concat(vwnd.slice(indbottom, indtop)).concat([vtop]);
        const sru = u.map((element, idx) => (element - 14.84) * 0.514444);
        const srv = v.map((element, idx) => (element - 22.05) * 0.514444);
        const sru1 = sru.slice(1, sru.length);
        const sru2 = sru.slice(0, sru.length - 1);
        const srv1 = srv.slice(0, srv.length - 1);
        const srv2 = srv.slice(1, srv.length);

        const layers = sru1.map((element, idx) => element * srv1[idx] - sru2[idx] * srv2[idx]);
        let phel = 0;
        let nhel = 0;
        for (let i = 0; i < layers.length; i++) {
            if (layers[i] > 0) {
                phel += layers[i];
            } else {
                nhel += layers[i];
            }
        }

        const shu = utop - ubot;
        const shv = vtop - vbot;
        return [shu, shv];
    }

    // Storm relative winds
    static srWind(profile, pbot, ptop, stu, stv) {
        const ps = this.range(ptop, pbot + 10, 10);
        const { pres } = profile;
        const { uwnd } = profile;
        const { vwnd } = profile;
        const [u, v] = this.componentsArr(pres, ps, uwnd, vwnd);
        let pssum = 0;
        ps.map((element, idx) => {
            pssum += element;
        });
        const pswts = ps.map((element, idx) => element / pssum);
        let uavg = 0;
        let vavg = 0;
        u.map((element, idx) => {
            uavg += element * pswts[idx];
            vavg += v[idx] * pswts[idx];
        });
        return [uavg - stu, vavg - stv];
    }

    // Bulk richardson shear
    static brnShear(profile) {
        const ptop = this.interpHght(this.toMSL(profile.hght, 6000), profile.hght, profile.pres);
        const pbot = profile.pres[0];
        const p = this.interpHght(
            this.interp([pbot], profile.pres, profile.hght)[0] + 500,
            profile.hght,
            profile.pres,
        );
        const [mnlu, mnlv] = this.meanWind(profile, pbot, p);
        const [mnuu, mnuv] = this.meanWind(profile, pbot, ptop);

        const dx = mnuu - mnlu;
        const dy = mnuv - mnlv;
        const brnshear = (this.mag(dx, dy) * 0.514444) ** 2 / 2;
        return brnshear;
    }

    // Corfidi vectors
    static corfidi(profile) {
        if (profile.pres[0] < 850) {
            var [mnu1, mnv1] = this.meanWindNpw(
                profile.pres,
                profile.uwnd,
                profile.vwnd,
                profile.pres[0],
                300,
            );
        } else {
            var [mnu1, mnv1] = this.meanWindNpw(profile.pres, profile.uwnd, profile.vwnd, 850, 300);
        }
        const p1p5km = this.interpHght(this.toMSL(profile.hght, 1500), profile.hght, profile.pres);
        const [mnu2, mnv2] = this.meanWindNpw(
            profile.pres,
            profile.uwnd,
            profile.vwnd,
            profile.pres[0],
            p1p5km,
        );

        const upu = mnu1 - mnu2;
        const upv = mnv1 - mnv2;

        const dnu = mnu1 + upu;
        const dnv = mnv1 + upv;

        return [upu, upv, dnu, dnv];
    }

    // Mean relative humidity over layer
    static meanRH(profile, pbot, ptop) {
        const { pres } = profile;
        const { dwpc } = profile;
        const { tmpc } = profile;
        const dp = -1;
        const p = this.range(pbot, ptop + dp, dp);
        const tmpinterp = this.interp(p, pres, tmpc);
        const dwptinterp = this.interp(p, pres, dwpc);
        const rh = this.rh(p, tmpinterp, dwptinterp);
        let pssum = 0;
        p.map((element, idx) => {
            pssum += element;
        });
        const pswts = p.map((element, idx) => element / pssum);
        let rhavg = 0;
        rh.map((element, idx) => {
            rhavg += element * pswts[idx];
        });
        return rhavg;
    }

    // Relative humidity
    static rh(p, t, d) {
        const rh = p.map((element, idx) => (100 * this.vappres(d[idx])) / this.vappres(t[idx]));
        return rh;
    }

    // Enhanced stretching potential
    static esp(profile, mlCAPE03, mlCAPE) {
        const lrsfc3km = this.lapseRate(profile, 0, 3000);
        if (lrsfc3km < 7 || mlCAPE < 250) {
            return 0;
        }
        const esp = (mlCAPE03 / 50) * ((lrsfc3km - 7) / 1.0);
        return esp;
    }

    // MCS Maintenance Probability
    static mmp(profile, muCAPE) {
        const { hght } = profile;
        const { pres } = profile;
        const agl_hght = hght.map((element, idx) => element - hght[0]);
        const lidx = agl_hght.findIndex((val) => val > 1000);
        const hidx1 = agl_hght.findIndex((val) => val >= 6000);
        const hidx2 = agl_hght.findIndex((val) => val >= 10000);
        const lidxrange = this.range(0, lidx);
        const hidxrange = this.range(hidx1, hidx2);
        const lidxArray = lidxrange.map((index) => hght[index]);
        const hidxArray = hidxrange.map((index) => hght[index]);

        let max_shear = 0;

        const pbots = this.interpHght(lidxArray, hght, pres);
        const ptops = this.interpHght(hidxArray, hght, pres);
        for (let i = 0; i < pbots.length; i++) {
            for (let j = 0; j < ptops.length; j++) {
                if (i < j) {
                    continue;
                } else {
                    const [u_shear, v_shear] = this.shear(profile, pbots[i], ptops[j]);
                    if (this.mag(u_shear, v_shear) > max_shear) {
                        max_shear = this.mag(u_shear, v_shear);
                    }
                }
            }
        }
        max_shear *= 0.514444;
        const lr38 = this.lapseRate(profile, 3000, 8000);
        const plower = this.interpHght(this.toMSL(hght, 3000), hght, pres);
        const pupper = this.interpHght(this.toMSL(hght, 12000), hght, pres);

        const [mean_wind_3t12u, mean_wind_3t12v] = this.meanWind(profile, plower, pupper);
        const mean_wind_3t12 = this.mag(mean_wind_3t12u, mean_wind_3t12v) * 0.514444;

        const a_0 = 13.0;
        const a_1 = -4.59 * 10 ** -2;
        const a_2 = -1.16;
        const a_3 = -6.17 * 10 ** -4;
        const a_4 = -0.17;
        const mmp =
            1 /
            (1 +
                Math.exp(a_0 + a_1 * max_shear + a_2 * lr38 + a_3 * muCAPE + a_4 * mean_wind_3t12));
        return mmp;
    }

    // Signficant severe parameter
    static sig_severe(sfc6shr, mlCAPE) {
        return mlCAPE * (sfc6shr * 0.514444);
    }

    // PBL depth
    static pbl_lid(profile) {
        // extract the needed variables to calculate virtual temperature
        const temp = profile.tmpc;
        const { pres } = profile;
        const { dwpc } = profile;
        const theta = this.theta(pres, temp);

        // calculate the virtual potential temperature profile
        const thetav = this.vtmp(theta, dwpc, pres);

        // calculate the PBL depth
        // the scheme here is borrowed from NSHARP in AWIPS
        // essentially, follow the virtual potential temperature upward until you find the first occurrence where theta-v + 0.5K >= theta-v_sfc
        const thetaVMin = thetav[0]; // .shift()
        // var presMin = pres.shift()
        const pbl_top = this.temp_lvl(thetav, pres, thetaVMin + 0.5);

        return pbl_top;
    }

    // Momentum transfer thru PBL
    static momentum_transfer_vector(profile, method) {
        // first get the PBL top
        const pbl_top = this.pbl_lid(profile);
        let mom_wind;

        if (method === 'Max') {
            // if we're using the max MT method just get the max wind thru the PBL
            // had to write this code, which was more effort than it may have been worth
            mom_wind = this.maxWind(profile, profile.pres[0], pbl_top);
        } else {
            // if we're using the mean MT method just get the mean wind thru the PBL
            // already have built-in code for this
            mom_wind = this.meanWind(profile, profile.pres[0], pbl_top);
        }

        return mom_wind;
    }

    static mph2kts(wnd) {
        const wndkts = wnd * 0.868976;
        return wndkts;
    }

    static f2c(ftemp) {
        const ctemp = Math.round((((ftemp - 32) * 5) / 9) * 10) / 10;
        return ctemp;
    }

    static calculateMean(array) {
        if (!array) return NaN;
        let value;
        value = math.mean(array);

        if (!value) value = NaN;

        return value;
    }
}
