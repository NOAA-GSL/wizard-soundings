import proj4 from 'proj4';
import * as d3 from 'd3';

// Where we store the lonlatGrids of different projections
const lonlatGrid = {};

const weekdaynames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const weekdaynamesshort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthnames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
const monthnamesshort = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

export class math {
    //
    // 1D Math
    //

    // Max/min/mean/sum
    static filterNaN(arr) {
        return arr.filter((x) => x !== null && x !== undefined && !isNaN(x));
    }

    static max(arr, filterNaN = true) {
        if (filterNaN) arr = this.filterNaN(arr);
        return Math.max(...arr);
    }

    static min(arr, filterNaN = true) {
        if (filterNaN) arr = this.filterNaN(arr);
        return Math.min(...arr);
    }

    static mean(arr, filterNaN = true) {
        if (filterNaN) arr = this.filterNaN(arr);
        return this.sum(arr, filterNaN) / arr.length;
    }

    static sum(arr, filterNaN = true) {
        if (filterNaN) arr = this.filterNaN(arr);
        return arr.reduce((a, b) => a + b, 0);
    }

    static quantile(arr, q, filterNaN = true) {
        if (filterNaN) arr = this.filterNaN(arr);
        return d3.quantile(arr, q);
    }

    static percentage(arr, filterNaN = true) {
        const lenOrg = arr.length;
        if (filterNaN) arr = this.filterNaN(arr);
        return (arr.length / lenOrg) * 100;
    }

    static diff(arr1, arr2) {
        const arr = new Float32Array(arr1.length);
        for (let i = 0; i < arr.length; i++) {
            arr[i] = arr1[i] - arr2[i];
        }
        return arr;
    }

    static round(num, digits) {
        return Math.round(num * 10 ** digits) / 10 ** digits;
    }

    static clamp = (num, min, max) => Math.min(Math.max(num, min), max);

    // sort array in ascending order
    static asc(arr) {
        return arr.sort((a, b) => a - b);
    }

    static rankValue(arr, rank, side = 'start', filterNaN = true) {
        if (filterNaN) arr = this.filterNaN(arr);
        const len = filtered.length;
        if (len == 0) {
            return NaN;
        }
        filtered = filtered.sort((a, b) => a - b);
        let index;
        if (side == 'start') {
            index = rank;
        }
        if (side == 'end') {
            index = len - rank - 1;
        }
        // Make sure the index is in the array
        if (index > len - 1) {
            index = len - 1;
        }
        if (index < 0) {
            index = 0;
        }

        return filtered[index];
    }

    // Takes a 1D array and turns it into a 2D array
    static reshape1DArrayTo2D(arr1D, width) {
        const height = Math.ceil(arr1D.length / width);
        return Array.from({ length: height }, (_, rowIndex) =>
            arr1D.slice(rowIndex * width, rowIndex * width + width),
        );
    }

    // get dimensions of any array
    static getDimensions(a) {
        const dim = [];
        for (;;) {
            dim.push(a.length);
            // Is this an array or typed array?
            if (Array.isArray(a[0]) || ArrayBuffer.isView(a[0])) {
                a = a[0];
            } else {
                break;
            }
        }
        return dim;
    }

    static percentileToZScore(p) {
        const Z_MAX = 2.327; // 6
        const Z_EPSILON = 0.0001; /* Accuracy of z approximation */
        let minz = -Z_MAX;
        let maxz = Z_MAX;
        let zval = 0.0;
        let pval;
        if (p < 0.0) p = 0.0;
        if (p > 1.0) p = 1.0;

        while (maxz - minz > Z_EPSILON) {
            pval = poz(zval);
            if (pval > p) {
                maxz = zval;
            } else {
                minz = zval;
            }
            zval = (maxz + minz) * 0.5;
        }

        return zval;

        function poz(z) {
            let y;
            let x;
            let w;
            const Z_MAX = 6;
            if (z == 0.0) {
                x = 0.0;
            } else {
                y = 0.5 * Math.abs(z);
                if (y > Z_MAX * 0.5) {
                    x = 1.0;
                } else if (y < 1.0) {
                    w = y * y;
                    x =
                        ((((((((0.000124818987 * w - 0.001075204047) * w + 0.005198775019) * w -
                            0.019198292004) *
                            w +
                            0.059054035642) *
                            w -
                            0.151968751364) *
                            w +
                            0.319152932694) *
                            w -
                            0.5319230073) *
                            w +
                            0.797884560593) *
                        y *
                        2.0;
                } else {
                    y -= 2.0;
                    x =
                        (((((((((((((-0.000045255659 * y + 0.00015252929) * y - 0.000019538132) *
                            y -
                            0.000676904986) *
                            y +
                            0.001390604284) *
                            y -
                            0.00079462082) *
                            y -
                            0.002034254874) *
                            y +
                            0.006549791214) *
                            y -
                            0.010557625006) *
                            y +
                            0.011630447319) *
                            y -
                            0.009279453341) *
                            y +
                            0.005353579108) *
                            y -
                            0.002141268741) *
                            y +
                            0.000535310849) *
                            y +
                        0.999936657524;
                }
            }
            return z > 0.0 ? (x + 1.0) * 0.5 : (1.0 - x) * 0.5;
        }
    }

    static convert(value, iUnits, oUnits) {
        if (iUnits == 'm' && oUnits == 'km') {
            return value / 1000;
        }
        console.log(`ERROR: cannot find conversion from ${iUnits} to ${oUnits}`);
    }
}
