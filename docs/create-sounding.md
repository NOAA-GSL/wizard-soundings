# createSounding.js Input and Usage

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

For every `model` member, provide the following fields.

| field | required | type | allowed input units | internal normalized units |
| --- | --- | --- | --- | --- |
| `pressure` | yes | array<number> | `hPa`, `Pa` | hPa |
| `gh_isobaric` | yes | array<number> | `dam`, `m` | m |
| `t_isobaric` | yes | array<number> | `F`, `C`, `K` | C |
| `dpt_isobaric` | yes | array<number> | `F`, `C`, `K` | C |
| `u_isobaric` | yes | array<number> | `mph`, `kts`, `m/s` | kts |
| `v_isobaric` | yes | array<number> | `mph`, `kts`, `m/s` | kts |
| `orog` | yes | number | `m`, `ft` | m |
| `sp` | yes | number | `hPa`, `Pa` | hPa |
| `mslp` | yes | number | `hPa`, `Pa` | hPa |
| `t2` | yes | number | `F`, `C`, `K` | C |
| `d2` | yes | number | `F`, `C`, `K` | C |
| `u10` | yes | number | `mph`, `kts`, `m/s` | kts |
| `v10` | yes | number | `mph`, `kts`, `m/s` | kts |
| `rh2` | yes | number | `%` only | % |

## Optional fields

These fields can be present and are preserved in your input bundle, but are not required by `updateData` formatting:

| field | type | units |
| --- | --- | --- |
| `r_isobaric` | array<number\|null> | `%` only |
| `w_isobaric` | array<number> | source-dependent |

If a record is missing the `units` field or provides an unsupported unit for that variable, `createSounding().updateData(...)` throws an error.

## Missing profile values

During profile formatting, `createSounding` linearly interpolates interior missing values for:

- `t_isobaric`
- `dpt_isobaric`
- `u_isobaric`
- `v_isobaric`

Interpolation is done along the vertical height coordinate and only when both bounding values exist.
Leading and trailing missing segments are not extrapolated.

## Array length rules

For each member (`model`), these arrays must have the same length and aligned index-by-index:

- `pressure`
- `gh_isobaric`
- `t_isobaric`
- `dpt_isobaric`
- `u_isobaric`
- `v_isobaric`

Index `i` in each array represents the same pressure level.

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