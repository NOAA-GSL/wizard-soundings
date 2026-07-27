# StatsTable Component Usage

Documentation index:

- [Main README](../README.md)
- [createSounding input and usage](./create-sounding.md)
- [SkewT usage](./skewt.md)
- [Hodograph usage](./hodograph.md)
- [BoxPlot usage](./boxplot.md)

This document explains how to use the `StatsTable` React component exported by `@noaa-gsl/wizard-soundings`.

## When to use `createSounding`

`StatsTable` expects a statistics dictionary in the format returned by:

- `createSounding().calcStats(members, 'mean')`

Build your profile data with [create-sounding.md](./create-sounding.md), then compute member statistics.

## `calcStats` options

`calcStats(memberList, stat)` supports these `stat` values:

| stat value | output behavior | common use |
| --- | --- | --- |
| `'mean'` | Returns mean values for scalar stats and mean-magnitude vectors with mean direction for vector stats. | Default for `StatsTable` display |
| `'list'` | Returns per-member arrays (no reduction). | Inputs for `BoxPlot` and custom distributions |
| `'<N>%'` | Returns the percentile at `N` (for example `'90%'`, `'25%'`, `'5%'`). | Percentile dashboards or threshold views |

Percentile notes:

- `N` should be in the range `0-100`.
- Examples: `'0%'` (minimum-like), `'50%'` (median-like), `'100%'` (maximum-like).
- For vectors, percentile is applied to vector magnitudes; direction uses the mean vector direction.

Examples:

```jsx
const members = sounding.getMembers();

const statsMean = sounding.calcStats(members, 'mean');
const statsP90 = sounding.calcStats(members, '90%');
const statsP25 = sounding.calcStats(members, '25%');
const statsList = sounding.calcStats(members, 'list');
```

## Basic usage

```jsx
import { createSounding, StatsTable } from '@noaa-gsl/wizard-soundings';
import '@noaa-gsl/wizard-soundings/styles.css';

const sounding = createSounding();
sounding.updateData(recordsForDate);

const members = sounding.getMembers();
const stats = sounding.calcStats(members, 'mean');

const [selectedStat, setSelectedStat] = useState('sfcCAPE');

<StatsTable
  statsDictParam={stats}
  selectedStat={selectedStat}
  onStatSelect={setSelectedStat}
/>;
```

## Props

| prop | type | required | default | description |
| --- | --- | --- | --- | --- |
| `statsDictParam` | `object` | yes | none | Statistics dictionary from `calcStats(..., stat)`. Most common for `StatsTable` is `'mean'` or a percentile like `'90%'`. |
| `selectedStat` | `string` | no | uncontrolled mode | Active/selected stat key for controlled highlighting. |
| `onStatSelect` | `(statKey, event) => void` | no | `undefined` | Callback when an interactive stat cell is clicked. |
| `className` | `string` | no | `'statsContainer'` | CSS class for root container. |
| `sx` | `object` | no | `{}` | Inline style object applied to root container. |

## Controlled vs uncontrolled selection

- Controlled mode: provide `selectedStat` and `onStatSelect`.
- Uncontrolled mode: omit `selectedStat`, and `StatsTable` manages local highlight state internally.

## Interactive stat keys

`StatsTable` sends the clicked stat key to `onStatSelect`. Common examples include:

- Parcel stats: `sfcCAPE`, `sfcCINH`, `mlCAPE`, `muCAPE`
- Thermo stats: `pw`, `kIndex`, `dcape`, `sigsvr`
- Wind/shear stats: `right_srh1km`, `sfc6kmshr`, `ebwdshr`, `brnShear`

Use these keys to drive downstream visualizations such as `BoxPlot`.

## Typical wiring with BoxPlot

```jsx
const stats = sounding.calcStats(sounding.getMembers(), 'mean');
const derivedData = sounding.calcStats(sounding.getMembers(), 'list');
const [selectedStat, setSelectedStat] = useState('sfcCAPE');

<StatsTable
  statsDictParam={stats}
  selectedStat={selectedStat}
  onStatSelect={setSelectedStat}
/>

<BoxPlot statsDictParam={derivedData} curStat={selectedStat} />
```

## Tooltip behavior

`StatsTable` includes built-in tooltip text for selected derived rows (for example momentum transfer and PBL top definitions). No prop is required to enable this.

## Data flow recommendation

1. Build sounding records via `createSounding().updateData(...)`.
2. Compute `statsDictParam` from `calcStats(..., 'mean')`.
3. Use `onStatSelect` to synchronize selected stat with `BoxPlot`.

## Demo reference

See practical usage in:

- `demo/examples/stats/main.jsx`
