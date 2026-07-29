export const TRACE_RENDER_ORDER = ['wetb', 'dwpt', 'vtmp', 'temp'];
export const PARCEL_TRACE_KEYS = ['parcel', 'parcelVirtual'];
export const ALL_TRACE_KEYS = [...TRACE_RENDER_ORDER, ...PARCEL_TRACE_KEYS];

const PROFILE_TRACE_DEFINITIONS = TRACE_RENDER_ORDER.map((key) => ({
    key,
    lineGenKey: key,
    visibilityKey: key,
    valueKey: key,
    styleByMode: {
        plumes: { strokeWidth: 1, opacity: 0.35 },
        mean: { strokeWidth: 3, opacity: 1 },
    },
}));

const PARCEL_TRACE_DEFINITIONS = [
    {
        key: 'parcel',
        lineGenKey: 'parcel',
        valueKey: 'temp',
        styleByMode: {
            plumes: { strokeWidth: 1, opacity: 0.35 },
            mean: { strokeWidth: 2, opacity: 0.8 },
        },
    },
    {
        key: 'parcelVirtual',
        lineGenKey: 'parcel',
        valueKey: 'temp',
        styleByMode: {
            plumes: { strokeWidth: 1, opacity: 0.35 },
            mean: { strokeWidth: 2, opacity: 0.8 },
        },
    },
];

export const TRACE_DEFINITIONS = [...PROFILE_TRACE_DEFINITIONS, ...PARCEL_TRACE_DEFINITIONS];

export const DISPLAY_MODE_OPTIONS = ['plumes', 'boxwhisker', 'mean'];

export const LINE_STYLE_DASHARRAYS = {
    solid: null,
    dash: '6,4',
    dot: '2,3',
    dashDot: '8,3,2,3',
};

const TRACE_DISPLAY_MODE_KEYS = ALL_TRACE_KEYS;

const TRACE_LINE_STYLE_KEYS = ALL_TRACE_KEYS;

const DEFAULT_TRACE_LINE_STYLES = {
    temp: 'solid',
    dwpt: 'solid',
    wetb: 'solid',
    vtmp: 'solid',
    parcel: 'dot',
    parcelVirtual: 'dash',
};

function isKnownDisplayMode(value) {
    return DISPLAY_MODE_OPTIONS.includes(value);
}

function isKnownLineStyle(value) {
    return Object.prototype.hasOwnProperty.call(LINE_STYLE_DASHARRAYS, value);
}

export function resolveTraceDisplayModes(config = {}) {
    const fallbackMode = isKnownDisplayMode(config.displayMode) ? config.displayMode : 'plumes';

    return TRACE_DISPLAY_MODE_KEYS.reduce((acc, key) => {
        const requestedMode = config.displayModes?.[key];
        acc[key] = isKnownDisplayMode(requestedMode) ? requestedMode : fallbackMode;
        return acc;
    }, {});
}

export function resolveTraceLineStyles(config = {}) {
    return TRACE_LINE_STYLE_KEYS.reduce((acc, key) => {
        const requestedStyle = config.traceLineStyles?.[key];
        acc[key] = isKnownLineStyle(requestedStyle)
            ? requestedStyle
            : DEFAULT_TRACE_LINE_STYLES[key];
        return acc;
    }, {});
}

export function getStrokeDasharray(lineStyle) {
    if (!isKnownLineStyle(lineStyle)) {
        return null;
    }

    return LINE_STYLE_DASHARRAYS[lineStyle];
}

export function buildTraceConfigs({
    traceVisibility,
    resolvedDisplayModes,
    colors,
    memberProfiles,
    meanProfile,
    parcelTraceSets,
}) {
    return TRACE_DEFINITIONS.map((definition) => {
        const sourceSet = definition.visibilityKey
            ? { memberProfiles, meanProfile }
            : parcelTraceSets[definition.key];

        return {
            ...definition,
            displayMode: resolvedDisplayModes[definition.key],
            color: colors[definition.key],
            memberProfiles: sourceSet?.memberProfiles ?? null,
            meanProfile: sourceSet?.meanProfile ?? null,
            valueKeysByVariable: { [definition.key]: definition.valueKey },
            visible: definition.visibilityKey ? traceVisibility[definition.visibilityKey] : true,
        };
    }).filter(
        (traceConfig) =>
            traceConfig.visible && (traceConfig.memberProfiles?.length || traceConfig.meanProfile),
    );
}
