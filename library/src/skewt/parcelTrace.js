import { computeMeanProfile } from './meanProfile';
import { alignProfilesToPressureGrid } from './pressureAlignment.js';

/**
 * Resolves parcel trace selections from config.
 *
 * Supported config keys:
 * - parcelTrace: regular-temperature parcel trace parcel type
 * - virtualParcelTrace: virtual-temperature parcel trace parcel type
 */
export function resolveParcelTraceSelections(config = {}) {
    return {
        regularParcelType: config.parcelTrace ?? 'none',
        virtualParcelType: config.virtualParcelTrace ?? 'none',
    };
}

/**
 * Extracts and formats parcel trace data from the stats object.
 */
export function getParcelTraceData(derivedStats, parcelType, traceType = 'vt') {
    if (!derivedStats || parcelType === 'none') return null;

    const traceSuffix = traceType === 'regular' ? 'trace_regular' : 'trace';
    const traceKey = `${parcelType}${traceSuffix}`;
    const allTraces = derivedStats[traceKey];

    if (!allTraces || allTraces.length === 0) return null;
    return allTraces;
}

export function getParcelTraceSet(derivedStats, parcelType, traceType = 'vt') {
    const memberProfiles = getParcelTraceData(derivedStats, parcelType, traceType);
    const alignedMemberProfiles = memberProfiles
        ? alignProfilesToPressureGrid(
              memberProfiles,
              ['temp'],
              ({ exactLevel, pressure, interpolatedValues }) =>
                  exactLevel
                      ? { ...exactLevel }
                      : { press: pressure, temp: interpolatedValues.temp },
          )
        : null;

    return {
        memberProfiles: alignedMemberProfiles,
        meanProfile: alignedMemberProfiles ? computeMeanProfile(alignedMemberProfiles) : null,
    };
}

export function getSelectedParcelTraceSets(derivedStats, config = {}) {
    const { regularParcelType, virtualParcelType } = resolveParcelTraceSelections(config);

    return {
        parcel: getParcelTraceSet(derivedStats, regularParcelType, 'regular'),
        parcelVirtual: getParcelTraceSet(derivedStats, virtualParcelType, 'vt'),
    };
}

export function getPrimaryParcelMeanProfile(parcelTraceSets = {}) {
    return (
        parcelTraceSets.parcelVirtual?.meanProfile || parcelTraceSets.parcel?.meanProfile || null
    );
}

export function resolveParcelTraceDisplayData(allTraces, displayMode = 'mean') {
    if (!allTraces || allTraces.length === 0) return null;

    const alignedTraces = alignProfilesToPressureGrid(
        allTraces,
        ['temp'],
        ({ exactLevel, pressure, interpolatedValues }) =>
            exactLevel ? { ...exactLevel } : { press: pressure, temp: interpolatedValues.temp },
    );

    if (displayMode === 'plumes' || displayMode === 'boxwhisker') {
        return alignedTraces;
    }

    return computeMeanProfile(alignedTraces);
}
