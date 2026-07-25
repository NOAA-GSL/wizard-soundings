# BoxPlot Component Usage

Documentation index:

- [Main README](../README.md)
- [createSounding input and usage](./create-sounding.md)
- [SkewT usage](./skewt.md)
- [Hodograph usage](./hodograph.md)
- [StatsTable usage](./stats-table.md)

This document explains how to use the `BoxPlot` React component exported by `@noaa-gsl/wizard-soundings`.

## When to use `createSounding`

`BoxPlot` expects member-list values for a selected stat from:

- `createSounding().calcStats(members, 'list')`

Use [create-sounding.md](./create-sounding.md) to prepare data first, then compute list stats.

## Basic usage

```jsx
import { createSounding, BoxPlot } from '@noaa-gsl/wizard-soundings';
import '@noaa-gsl/wizard-soundings/styles.css';

const sounding = createSounding();
sounding.updateData(recordsForDate);

const members = sounding.getMembers();
const derivedData = sounding.calcStats(members, 'list');

<BoxPlot
  statsDictParam={derivedData}
  curStat="sfcCAPE"
  config={{
    orientation: 'horizontal',
    percentiles: {
      whiskers: [5, 95],
      boxes: [25, 75],
    },
  }}
/>;
```

## Props

| prop | type | required | default | description |
| --- | --- | --- | --- | --- |
| `statsDictParam` | `object` | yes | none | Stats dictionary containing per-member arrays from `calcStats(..., 'list')`. |
| `curStat` | `string` | yes | none | Key in `statsDictParam` to visualize (for example `sfcCAPE`). |
| `config` | `object` | no | `{}` | Plot options for margins, percentiles, orientation, and height. |

If `statsDictParam[curStat]` is missing, `BoxPlot` renders `null`.

## `config` options

| key | type | default | description |
| --- | --- | --- | --- |
| `margin` | `{ top, right, bottom, left }` | `{ top: 20, right: 40, bottom: 30, left: 30 }` | Inner plotting margins. |
| `percentiles.whiskers` | `[number, number]` | `[5, 95]` | Lower and upper whisker percentiles. |
| `percentiles.boxes` | `[number, number]` | `[25, 75]` | Lower and upper quartile-style bounds for the box. |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Axis orientation for rendering. |
| `height` | `number \| null` | `null` | Optional explicit plot height. If omitted: `120` for horizontal, `400` for vertical. |

## Wiring with StatsTable

A common pattern is using `StatsTable` selection to drive `BoxPlot`:

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

## Percentile interpretation

`BoxPlot` computes quantiles from the selected stat's member array:

- whisker 1: `percentiles.whiskers[0]`
- box 1: `percentiles.boxes[0]`
- median: fixed 50th percentile
- box 2: `percentiles.boxes[1]`
- whisker 2: `percentiles.whiskers[1]`

## Demo reference

See practical usage in:

- `demo/examples/stats/main.jsx`
