import * as d3 from 'd3';

export const TALL_GRAPH_VARIABLE_KEYS = ['rh', 'omega'];

export const TALL_GRAPH_DISPLAY_MODES = [
    'meanBars',
    'mean',
    'plumes',
    'boxwhiskerBars',
    'boxwhisker',
];

export const DEFAULT_TALL_GRAPH_CONFIG = {
    margin: { top: 20, right: 12, bottom: 4, left: 12 },
    baseP: 1050,
    topP: 100,
    axisHeight: 34,
    percentiles: [5, 25, 75, 95],
    isobars: [1000, 850, 700, 500, 300, 200, 100],
    colors: {
        isobar: 'rgba(200, 150, 150, 0.4)',
        zeroLine: 'rgba(150, 150, 150, 0.8)',
    },
    rh: {
        enabled: true,
        displayMode: 'meanBars',
        valueKey: 'rh',
        color: '#22c55e',
        lineStyle: 'solid',
        domain: [0, 100],
        colorBar: null,
        ticks: 3,
        label: 'RH',
        units: '%',
    },
    omega: {
        enabled: true,
        displayMode: 'mean',
        valueKey: 'wwnd',
        color: '#60a5fa',
        lineStyle: 'solid',
        domain: null,
        colorBar: null,
        ticks: 3,
        label: 'Omega',
        units: '',
    },
    renderTooltip: null,
};

export function isKnownTallGraphDisplayMode(value) {
    return TALL_GRAPH_DISPLAY_MODES.includes(value);
}

function isValidDomain(domain) {
    return (
        Array.isArray(domain) &&
        domain.length === 2 &&
        domain.every((v) => Number.isFinite(v)) &&
        domain[0] !== domain[1]
    );
}

function isValidColorBar(colorBar) {
    return (
        Array.isArray(colorBar) &&
        colorBar.length > 0 &&
        colorBar.every(
            (stop) =>
                Number.isFinite(stop?.value) && typeof stop.color === 'string' && stop.color !== '',
        )
    );
}

/**
 * Returns a value -> color function using discrete colorBar steps: a value takes the color of the
 * highest stop at or below it. Values below the lowest stop (or non-finite) return fallbackColor.
 */
export function createColorBarScale(colorBar, fallbackColor) {
    if (!isValidColorBar(colorBar)) return () => fallbackColor;

    const stops = [...colorBar].sort((a, b) => a.value - b.value);
    const scale = d3
        .scaleThreshold()
        .domain(stops.map((stop) => stop.value))
        .range([fallbackColor, ...stops.map((stop) => stop.color)]);

    return (value) => (Number.isFinite(value) ? scale(value) : fallbackColor);
}

export function resolveTallGraphConfig(config = {}) {
    const resolved = {
        ...DEFAULT_TALL_GRAPH_CONFIG,
        ...config,
        margin: { ...DEFAULT_TALL_GRAPH_CONFIG.margin, ...config.margin },
        colors: { ...DEFAULT_TALL_GRAPH_CONFIG.colors, ...config.colors },
    };

    for (const key of TALL_GRAPH_VARIABLE_KEYS) {
        const defaults = DEFAULT_TALL_GRAPH_CONFIG[key];
        const merged = { ...defaults, ...config[key] };
        if (!isKnownTallGraphDisplayMode(merged.displayMode)) {
            merged.displayMode = defaults.displayMode;
        }
        if (!isValidDomain(merged.domain)) {
            merged.domain = defaults.domain;
        }
        if (!isValidColorBar(merged.colorBar)) {
            merged.colorBar = null;
        }
        resolved[key] = merged;
    }

    if (!Array.isArray(resolved.percentiles) || resolved.percentiles.length === 0) {
        resolved.percentiles = DEFAULT_TALL_GRAPH_CONFIG.percentiles;
    }

    return resolved;
}

/**
 * Returns the x-domain for a variable: the configured domain when valid, otherwise a
 * "nice" domain symmetric about zero covering every finite member value.
 */
export function computeValueDomain(memberProfiles, valueKey, domain = null) {
    if (isValidDomain(domain)) return domain;

    let maxAbs = 0;
    for (const profile of memberProfiles ?? []) {
        for (const level of profile ?? []) {
            const value = level?.[valueKey];
            if (Number.isFinite(value)) maxAbs = Math.max(maxAbs, Math.abs(value));
        }
    }
    if (maxAbs === 0) maxAbs = 1;

    return d3.scaleLinear().domain([-maxAbs, maxAbs]).nice().domain();
}

/**
 * Builds point-centered pressure layers. Each level's layer extends halfway (in log-pressure)
 * to its neighbours; the first and last levels end at their own pressure.
 */
export function computeLayerBounds(pressures) {
    const sorted = [...new Set((pressures ?? []).filter((p) => Number.isFinite(p) && p > 0))].sort(
        (a, b) => b - a,
    );

    return sorted.map((press, i) => ({
        press,
        bottom: i === 0 ? press : Math.sqrt(press * sorted[i - 1]),
        top: i === sorted.length - 1 ? press : Math.sqrt(press * sorted[i + 1]),
    }));
}

/**
 * Stacks one x-axis per enabled variable below the plot, in TALL_GRAPH_VARIABLE_KEYS order.
 */
export function getAxisLayout(settings) {
    const axisHeight = settings.axisHeight ?? DEFAULT_TALL_GRAPH_CONFIG.axisHeight;
    const axes = TALL_GRAPH_VARIABLE_KEYS.filter((key) => settings[key]?.enabled).map(
        (key, index) => ({ key, offset: index * axisHeight }),
    );

    return { axes, totalHeight: axes.length * axisHeight };
}

/**
 * Returns whisker/box/median percentile keys, matching the SkewT box-whisker convention.
 */
export function getBoxWhiskerPercentileKeys(percentiles) {
    const sorted = [...new Set([...percentiles, 50])].sort((a, b) => a - b);
    return {
        whiskerLow: `p${sorted[0]}`,
        boxLow: `p${sorted[1] ?? 50}`,
        median: 'p50',
        boxHigh: `p${sorted[sorted.length - 2] ?? 50}`,
        whiskerHigh: `p${sorted[sorted.length - 1]}`,
    };
}

export function formatAxisTitle({ label, units }) {
    return units ? `${label} (${units})` : label;
}
