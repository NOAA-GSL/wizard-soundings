# createSounding.js Input and Usage

Documentation index:

- [Main README](../README.md)
- [SkewT usage](./skewt.md)
- [Hodograph usage](./hodograph.md)
- [StatsTable usage](./stats-table.md)
- [BoxPlot usage](./boxplot.md)
- [TallGraph usage](./tall-graph.md)

This document explains how to format data for `library/src/createSounding.js` (exported as `createSounding`) and how to use it in code.

## Quick usage

```js
import { createSounding } from '@noaa-gsl/wizard-soundings';

const sounding = createSounding();

// records is an array of { field, model, units, value }
sounding.updateData(records);

const members = sounding.getMembers();
const levelData = sounding.getLevelData();
const profileData = sounding.getProfileData();
const derived = sounding.getDerivedData();

// Example stats call
const p90 = sounding.calcStats(members, '90%');
const mean = sounding.calcStats(members, 'mean');
```

## Record format

Each record must be:

```json
{
    "field": "t_isobaric",
    "model": "HRRR",
    "units": "F",
    "value": [81.23, 78.53, 77.63]
}
```

- `field`: variable name (see table below)
- `model`: ensemble member name
- `units`: required units string for that variable
- `value`: scalar or array depending on field

You must provide at least one member (`model` value), and you can provide as many members as you want.

You can use whatever pressure levels you want.

## Required fields and units

For every `model` member, provide the following fields. Required values are marked `yes`; fields marked `no` may be omitted. Fields marked `derived` are computed by `createSounding` and cannot be supplied as records; they appear on each level returned by `getLevelData()`.

| field          | required | type          | allowed input units | internal normalized units | level field (`getLevelData()`) / notes                                                                                     |
| -------------- | -------- | ------------- | ------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `pressure`     | yes      | array<number> | `hPa`, `Pa`         | hPa                       | `press`                                                                                                                    |
| `gh_isobaric`  | yes      | array<number> | `dam`, `m`          | m (MSL)                   | `hght`                                                                                                                     |
| `t_isobaric`   | yes      | array<number> | `F`, `C`, `K`       | C                         | `temp`                                                                                                                     |
| `dpt_isobaric` | one of\* | array<number> | `F`, `C`, `K`       | C                         | `dwpt`                                                                                                                     |
| `rh_isobaric`  | one of\* | array<number> | `%`                 | % (converted to dewpoint) | Converted to `dwpt` (see [Moisture](#moisture-dewpoint-vs-relative-humidity))                                              |
| `u_isobaric`   | yes      | array<number> | `mph`, `kts`, `m/s` | kts                       | `uwnd`                                                                                                                     |
| `v_isobaric`   | yes      | array<number> | `mph`, `kts`, `m/s` | kts                       | `vwnd`                                                                                                                     |
| `orog`         | yes      | number        | `m`, `ft`           | m                         | `orog`                                                                                                                     |
| `sp`           | yes      | number        | `hPa`, `Pa`         | hPa                       | `sp`; members' `sp` are averaged to set the surface level `press`                                                          |
| `mslp`         | yes      | number        | `hPa`, `Pa`         | hPa                       | `mslp` (surface level)                                                                                                     |
| `t2`           | yes      | number        | `F`, `C`, `K`       | C                         | `t2`, and `temp` of the surface level                                                                                      |
| `d2`           | yes      | number        | `F`, `C`, `K`       | C                         | `d2`, and `dwpt` of the surface level                                                                                      |
| `u10`          | yes      | number        | `mph`, `kts`, `m/s` | kts                       | `u10`, and `uwnd` of the surface level                                                                                     |
| `v10`          | yes      | number        | `mph`, `kts`, `m/s` | kts                       | `v10`, and `vwnd` of the surface level                                                                                     |
| `w_isobaric`   | no       | array<number> | any (not validated) | unchanged from input      | `wwnd`. A non-empty `units` string is required but values are not converted. Missing → `NaN`; surface level is always `0`. |
| `rh2`          | no       | number        | `%`                 | %                         | `rh2` (surface level). Derived from `sp`, `t2`, `d2` when omitted.                                                         |
| `hghtagl`      | derived  | number        | —                   | m (AGL)                   | `hght - orog`; `0` at the surface level                                                                                    |
| `twnd`         | derived  | number        | —                   | kts                       | Wind speed from `uwnd`, `vwnd`                                                                                             |
| `wdir`         | derived  | number        | —                   | degrees                   | Wind direction (from) from `uwnd`, `vwnd`                                                                                  |
| `twind10`      | derived  | number        | —                   | kts                       | 10 m wind speed from `u10`, `v10` (surface level)                                                                          |
| `wdir10`       | derived  | number        | —                   | degrees                   | 10 m wind direction from `u10`, `v10` (surface level)                                                                      |
| `vtmp`         | derived  | number        | —                   | C                         | Virtual temperature from `temp`, `dwpt`, `press`                                                                           |
| `wetb`         | derived  | number        | —                   | C                         | Wet-bulb temperature from `temp`, `dwpt`, `press`                                                                          |
| `rh`           | derived  | number        | —                   | %                         | RH over liquid water from `temp`, `dwpt`                                                                                   |
| `rhIce`        | derived  | number        | —                   | %                         | RH over ice from `temp`, `dwpt`; equals `rh` at or above 0 C                                                               |

\* Each member must provide **exactly one** of `dpt_isobaric` or `rh_isobaric`:

- Providing both throws `Model "<model>" provides both "dpt_isobaric" and "rh_isobaric". Provide only one.`
- Providing neither throws `Model "<model>" is missing moisture data. Provide either "dpt_isobaric" or "rh_isobaric".`

The choice can differ between members.

`rh2` is derived from `sp`, `t2`, and `d2` when omitted.

## Derived relative humidity fields

Every level returned by `getLevelData()` includes these derived fields (computed from `press`, `temp`, and `dwpt`, regardless of which moisture field was provided):

| level field | description                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `rh`        | RH with respect to liquid water (%).                                                                                                       |
| `rhIce`     | RH with respect to ice (%). Uses the Murphy & Koop (2005) ice saturation vapor pressure when `temp < 0` C. At or above 0 C it equals `rh`. |
| `rhCombo`   | Only present after calling `combineRh` (below). RH over ice when `temp <= iceThreshold`, otherwise RH over water.                          |

Levels missing `temp` or `dwpt` have `vtmp`, `wetb`, `rh`, and `rhIce` set to `NaN`. Levels missing `uwnd` or `vwnd` have `twnd` and `wdir` set to `NaN`, and `vtmp`, `wetb`, `rh`, and `rhIce` are not set.

### `combineRh(levelData, iceThreshold)`

```js
import { createSounding, combineRh, DEFAULT_RH_ICE_THRESHOLD } from '@noaa-gsl/wizard-soundings';

sounding.updateData(records);
const withCombo = combineRh(sounding.getLevelData(), -23);

// e.g. plot it on the TallGraph
<TallGraph
    soundingParam={withCombo}
    config={{ rh: { valueKey: 'rhCombo', label: 'RH + RH (ice)' } }}
/>;
```

| argument       | type   | default                          | description                                                                 |
| -------------- | ------ | -------------------------------- | --------------------------------------------------------------------------- |
| `levelData`    | array  | required                         | Output of `getLevelData()`. Non-array input is returned unchanged.          |
| `iceThreshold` | number | `DEFAULT_RH_ICE_THRESHOLD` (-23) | Temperature (C). Levels at or below it use `rhIce`; warmer levels use `rh`. |

Returns a new array (input is not mutated) where every level has an added `rhCombo` field.

## Missing profile values

During profile formatting, `createSounding` linearly interpolates interior missing values for:

- `t_isobaric`
- `dpt_isobaric` (or the dewpoint derived from `rh_isobaric`)
- `u_isobaric`
- `v_isobaric`
- `w_isobaric`

Interpolation is done along the vertical height coordinate and only when both bounding values exist.
Leading and trailing missing segments are not extrapolated.

## Array length rules

For each member (`model`), these arrays must have the same length and aligned index-by-index:

- `pressure`
- `gh_isobaric`
- `t_isobaric`
- `dpt_isobaric` or `rh_isobaric`
- `u_isobaric`
- `v_isobaric`

Index `i` in each array represents the same pressure level.

## Pressure alignment

After formatting, `createSounding` aligns every member to a shared pressure grid before exposing `getLevelData()` and `getProfileData()`.

- The shared grid is built from the union of all member pressure levels.
- The common surface pressure is treated specially by averaging the member surface pressures first.
- Values at missing intermediate pressures are linearly interpolated before stats and rendering.
- This is only for plotting the variables. The sounding states derived from sounding.getMembers() uses the unaligned pressure values

## Multi-member example

Example with two members (same format as your full dataset):

```json
[
    {
        "field": "pressure",
        "model": "HRRR",
        "units": "hPa",
        "value": [1000, 925, 850, 700, 500, 300]
    },
    {
        "field": "gh_isobaric",
        "model": "HRRR",
        "units": "dam",
        "value": [17.1, 86.0, 159.9, 324.8, 597.3, 977.5]
    },
    {
        "field": "t_isobaric",
        "model": "HRRR",
        "units": "F",
        "value": [81.23, 77.63, 69.53, 52.43, 20.93, -24.97]
    },
    {
        "field": "dpt_isobaric",
        "model": "HRRR",
        "units": "F",
        "value": [71.33, 61.43, 57.83, 35.33, 9.23, -36.67]
    },
    {
        "field": "u_isobaric",
        "model": "HRRR",
        "units": "mph",
        "value": [5.6, 20.1, 14.5, 5.6, 2.2, -15.7]
    },
    {
        "field": "v_isobaric",
        "model": "HRRR",
        "units": "mph",
        "value": [10.1, 24.6, 13.4, 8.9, 3.4, -5.6]
    },
    {
        "field": "orog",
        "model": "HRRR",
        "units": "m",
        "value": 362
    },
    {
        "field": "sp",
        "model": "HRRR",
        "units": "hPa",
        "value": 979
    },
    {
        "field": "mslp",
        "model": "HRRR",
        "units": "hPa",
        "value": 1019.4
    },
    {
        "field": "t2",
        "model": "HRRR",
        "units": "F",
        "value": 78.53
    },
    {
        "field": "d2",
        "model": "HRRR",
        "units": "F",
        "value": 69.53
    },
    {
        "field": "u10",
        "model": "HRRR",
        "units": "mph",
        "value": 4.5
    },
    {
        "field": "v10",
        "model": "HRRR",
        "units": "mph",
        "value": 8.9
    },
    {
        "field": "rh2",
        "model": "HRRR",
        "units": "%",
        "value": 73
    },

    {
        "field": "pressure",
        "model": "HRW_ARW",
        "units": "hPa",
        "value": [1000, 925, 850, 700, 500, 300]
    },
    {
        "field": "gh_isobaric",
        "model": "HRW_ARW",
        "units": "dam",
        "value": [17.4, 85.9, 159.8, 324.7, 596.9, 976.9]
    },
    {
        "field": "t_isobaric",
        "model": "HRW_ARW",
        "units": "F",
        "value": [78.53, 77.63, 69.53, 51.53, 20.03, -25.87]
    },
    {
        "field": "dpt_isobaric",
        "model": "HRW_ARW",
        "units": "F",
        "value": [71.33, 63.23, 57.83, 31.73, 13.73, -34.87]
    },
    {
        "field": "u_isobaric",
        "model": "HRW_ARW",
        "units": "mph",
        "value": [4.5, 21.3, 16.8, 5.6, 1.1, -16.8]
    },
    {
        "field": "v_isobaric",
        "model": "HRW_ARW",
        "units": "mph",
        "value": [8.9, 24.6, 13.4, 7.8, 4.5, -3.4]
    },
    {
        "field": "orog",
        "model": "HRW_ARW",
        "units": "m",
        "value": 352
    },
    {
        "field": "sp",
        "model": "HRW_ARW",
        "units": "hPa",
        "value": 980
    },
    {
        "field": "mslp",
        "model": "HRW_ARW",
        "units": "hPa",
        "value": 1020.6
    },
    {
        "field": "t2",
        "model": "HRW_ARW",
        "units": "F",
        "value": 77.63
    },
    {
        "field": "d2",
        "model": "HRW_ARW",
        "units": "F",
        "value": 69.53
    },
    {
        "field": "u10",
        "model": "HRW_ARW",
        "units": "mph",
        "value": 4.5
    },
    {
        "field": "v10",
        "model": "HRW_ARW",
        "units": "mph",
        "value": 8.9
    },
    {
        "field": "rh2",
        "model": "HRW_ARW",
        "units": "%",
        "value": 77
    }
]
```

## Notes

- Members with invalid profile points are filtered internally.
- The formatter inserts a surface level built from `sp`, `orog`, `t2`, `d2`, `u10`, and `v10`.
- If all levels are filtered out for a member, that member will not appear in `getMembers()`.
