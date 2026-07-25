# SkewT Component Usage

Documentation index:

- [Main README](../README.md)
- [createSounding input and usage](./create-sounding.md)
- [Hodograph usage](./hodograph.md)
- [StatsTable usage](./stats-table.md)
- [BoxPlot usage](./boxplot.md)

This document explains how to use the `SkewT` React component exported by `@noaa-gsl/wizard-soundings`.

## When to use `createSounding`

`SkewT` expects profile data in the same format returned by:

- `createSounding().getLevelData()`

Use [create-sounding.md](./create-sounding.md) to prepare and validate your input records before rendering `SkewT`.

## Basic usage

```jsx
import { createSounding, SkewT } from '@noaa-gsl/wizard-soundings';
import '@noaa-gsl/wizard-soundings/styles.css';

const sounding = createSounding();
sounding.updateData(recordsForDate);

const soundingData = sounding.getLevelData();
const stats = sounding.calcStats(sounding.getMembers(), 'mean');

<SkewT
  soundingParam={soundingData}
  statsDictParam={stats}
  config={{
    displayMode: 'boxwhisker',
    percentiles: [5, 25, 75, 95],
    showTemperature: true,
    showDewPoint: true,
    showWetBulb: false,
  }}
/>;
```

## Props

| prop | type | required | default | description |
| --- | --- | --- | --- | --- |
| `soundingParam` | `Array<Array<Level>>` | yes | none | Member profile arrays, typically from `getLevelData()`. |
| `statsDictParam` | `object` | no | `undefined` | Stats dictionary; used for parcel trace (e.g., `sfcptrace`, `sfcttrace`). |
| `config` | `object` | no | `{}` | Chart behavior and rendering options (see config table). |
| `className` | `string` | no | `'skewt-container'` | CSS class for the root container. |
| `sx` | `object` | no | `{}` | Inline style object applied to the root container. |
| `displayMode` | `'plumes' \| 'boxwhisker' \| 'mean'` | no | from `config.displayMode` or `'plumes'` | Optional top-level override for display mode. |
| `percentiles` | `number[]` | no | from `config.percentiles` or `[5, 25, 75, 95]` | Optional top-level override for percentile display mode settings. |

## `config` options

| key | type | default | description |
| --- | --- | --- | --- |
| `margin` | `{ top, right, bottom, left }` | `{ top: 20, right: 40, bottom: 30, left: 30 }` | Inner chart margins. |
| `baseP` | `number` | `1050` | Bottom pressure bound (hPa). |
| `topP` | `number` | `100` | Top pressure bound (hPa). |
| `minT` | `number` | `-45` | Left temperature bound (deg C). |
| `maxT` | `number` | `50` | Right temperature bound (deg C). |
| `skewAngle` | `number` | `55` | Skew angle for the Skew-T transform. |
| `aspectRatio` | `number` | `1` | Plot width/height ratio target. |
| `isobars` | `number[]` | `[1000, 850, 700, 500, 300, 200, 100]` | Pressure lines drawn in the background. |
| `isotherms` | `{ min, max, interval }` | `{ min: -50, max: 50, interval: 10 }` | Background temperature-line generation. |
| `dryAdiabats` | `{ min, max, interval }` | `{ min: -30, max: 170, interval: 20 }` | Dry adiabat background settings. |
| `moistAdiabats` | `{ min, max, interval }` | `{ min: -20, max: 40, interval: 5 }` | Moist adiabat background settings. |
| `mixingRatio` | `number[]` | `[2, 4, 8, 14, 20, 26]` | Mixing ratio guide lines (g/kg). |
| `colors` | `object` | built-in colors | Color map for traces and grid lines (`temp`, `dwpt`, `wetb`, etc.). |
| `zoom` | `{ enabled, min, max }` | `{ enabled: true, min: 1, max: 5 }` | Zoom enablement and limits. |
| `displayMode` | `'plumes' \| 'boxwhisker' \| 'mean'` | `'plumes'` | Draw all members, box/whisker envelope, or mean-only profile. |
| `percentiles` | `number[]` | `[5, 25, 75, 95]` | Used by `boxwhisker` mode for whisker/box bounds. |
| `showTemperature` | `boolean` | `true` | Show/hide temperature trace. |
| `showDewPoint` | `boolean` | `true` | Show/hide dewpoint trace. |
| `showWetBulb` | `boolean` | `false` | Show/hide wet-bulb trace. |
| `traceVisibility` | `{ temp?, dwpt?, wetb? }` | derived | Alternate trace visibility object (used if specific booleans are not set). |
| `renderTooltip` | `(data) => ReactNode` | `null` | Custom tooltip renderer for hover level data. |

## Tooltip override

If `config.renderTooltip` is provided, `SkewT` calls it with one argument:

- `data`: the hovered level object (e.g., pressure, temperature, dewpoint, winds, heights)

```jsx
const customSkewtTooltip = (data) => {
  if (!data) return null;
  return (
    <div>
      <strong>{data.press?.toFixed(0)} hPa</strong>
      <div>T: {data.temp?.toFixed(1)} deg C</div>
      <div>Td: {data.dwpt?.toFixed(1)} deg C</div>
    </div>
  );
};

<SkewT
  soundingParam={soundingData}
  statsDictParam={stats}
  config={{ renderTooltip: customSkewtTooltip }}
/>;
```

## Demo reference

See practical usage in:

- `demo/examples/stats/main.jsx`
