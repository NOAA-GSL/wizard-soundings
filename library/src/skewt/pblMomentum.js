import { math } from '../Utilities';
import { isVector } from '../vector';
import { calculateStatsVector } from '../createSounding';

export const DEFAULT_PBL_DEPTH_CONFIG = {
    enabled: false,
    color: 'rgb(255,255,100)',
    width: 8,
};

export const DEFAULT_MOMENTUM_TRANSFER_CONFIG = {
    enabled: false,
    stat: 'mean',
    color: 'rgb(255,255,100)',
    strokeWidth: 2.5,
    showMean: true,
    showMax: true,
};

const toList = (value) => {
    if (value == null) return [];
    return Array.isArray(value) ? value : [value];
};

/**
 * Splits a percentile list into whisker and box bounds the same way the demo BoxPlot does.
 * @param {number[]} percentiles - e.g. [5, 25, 75, 95]
 * @returns {{ whiskers: [number, number], boxes: [number, number] }}
 */
export function resolveBoxWhiskerBounds(percentiles = []) {
    const sorted = [...new Set(percentiles.filter(Number.isFinite))].sort((a, b) => a - b);
    return {
        whiskers: sorted.length >= 2 ? [sorted[0], sorted[sorted.length - 1]] : [5, 95],
        boxes: sorted.length >= 4 ? [sorted[1], sorted[sorted.length - 2]] : [25, 75],
    };
}

/**
 * Reduces per-member MT vectors to one vector: direction from the mean u/v, speed from `stat`.
 * @param {object|object[]} vectors - Vector or list of Vectors.
 * @param {string} stat - 'mean' or a percentile string such as '90%'.
 * @returns {object|null} Vector, or null when no valid members exist.
 */
export function reduceMomentumTransfer(vectors, stat = 'mean') {
    const valid = toList(vectors).filter(
        (vec) => isVector(vec) && Number.isFinite(vec.u) && Number.isFinite(vec.v),
    );
    if (valid.length === 0) return null;
    const reduced = calculateStatsVector(valid, stat);
    if (!Number.isFinite(reduced.u) || !Number.isFinite(reduced.v)) return null;
    return reduced;
}

/**
 * Interpolates (linear in log-p) a level field at a pressure from a profile of level objects.
 * @returns {number|null} null when the pressure is outside the profile.
 */
export function interpolateAtPressure(profile, press, key = 'temp') {
    if (!Array.isArray(profile) || !Number.isFinite(press)) return null;
    const levels = profile
        .filter((d) => Number.isFinite(d?.press) && Number.isFinite(d?.[key]))
        .sort((a, b) => b.press - a.press);
    for (let i = 0; i < levels.length; i++) {
        const lo = levels[i];
        if (lo.press === press) return lo[key];
        const hi = levels[i + 1];
        if (hi && lo.press > press && hi.press < press) {
            const t = Math.log(lo.press / press) / Math.log(lo.press / hi.press);
            return lo[key] + t * (hi[key] - lo[key]);
        }
    }
    return null;
}

/**
 * Builds the PBL depth box-whisker and MT barb positions from `calcStats(..., 'list')` output.
 * All positions are pressures (hPa).
 * @param {object} params
 * @param {number|number[]} params.pblDepth - Per-member PBL top pressure.
 * @param {object|object[]} params.momentumTransferVector - Per-member mean MT vectors.
 * @param {object|object[]} params.momentumTransferVectorMax - Per-member max MT vectors.
 * @param {number[]} params.percentiles - Box-whisker percentiles (height based).
 * @param {string} params.stat - Statistic applied to the MT speeds ('mean' or e.g. '90%').
 * @param {number} [params.surfacePress] - Surface pressure used for the half-depth level.
 * @returns {object|null}
 */
export function computePblMomentumMarkers({
    pblDepth,
    momentumTransferVector,
    momentumTransferVectorMax,
    percentiles,
    stat = 'mean',
    surfacePress,
} = {}) {
    const pbl = toList(pblDepth).filter(Number.isFinite);
    if (pbl.length === 0) return null;

    // Pressure falls with height, so height percentile p is pressure percentile 100 - p.
    const heightPercentile = (p) => math.quantile(pbl, (100 - p) / 100);
    const { whiskers, boxes } = resolveBoxWhiskerBounds(percentiles);

    const median = heightPercentile(50);
    const meanTop = math.mean(pbl);
    // Geometric mean of pressures is the half-height level in log-p.
    const halfDepth =
        Number.isFinite(surfacePress) && surfacePress > meanTop
            ? Math.sqrt(surfacePress * meanTop)
            : meanTop;

    const boxWhisker =
        pbl.length > 1
            ? {
                  whiskerBottom: heightPercentile(whiskers[0]),
                  boxBottom: heightPercentile(boxes[0]),
                  median,
                  boxTop: heightPercentile(boxes[1]),
                  whiskerTop: heightPercentile(whiskers[1]),
              }
            : null;

    const meanVec = reduceMomentumTransfer(momentumTransferVector, stat);
    const maxVec = reduceMomentumTransfer(momentumTransferVectorMax, stat);

    return {
        memberCount: pbl.length,
        medianPress: median,
        meanPress: meanTop,
        halfDepthPress: halfDepth,
        boxWhisker,
        meanBarb: meanVec ? { u: meanVec.u, v: meanVec.v, press: halfDepth } : null,
        maxBarb: maxVec ? { u: maxVec.u, v: maxVec.v, press: meanTop } : null,
    };
}
