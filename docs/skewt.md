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
        displayMode: 'plumes',
        displayModes: {
            temp: 'boxwhisker',
            dwpt: 'mean',
            parcel: 'mean',
            parcelVirtual: 'mean',
        },
        percentiles: [5, 25, 75, 95],
        traceVisibility: {
            temp: true,
            dwpt: true,
            wetb: false,
            vtmp: false,
        },
        traceLineStyles: {
            temp: 'solid',
            dwpt: 'dash',
            parcelVirtual: 'dash',
        },
    }}
/>;
```

## Props

| prop             | type                  | required | default                                        | description                                                                                                    |
| ---------------- | --------------------- | -------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `soundingParam`  | `Array<Array<Level>>` | yes      | none                                           | Member profile arrays, typically from `getLevelData()`.                                                        |
| `statsDictParam` | `object`              | no       | `undefined`                                    | Stats dictionary from `calcStats(..., 'list')`; used for parcel traces (e.g., `sfctrace`, `sfctrace_regular`). |
| `config`         | `object`              | no       | `{}`                                           | Chart behavior and rendering options (see config table).                                                       |
| `className`      | `string`              | no       | `'skewt-container'`                            | CSS class for the root container.                                                                              |
| `sx`             | `object`              | no       | `{}`                                           | Inline style object applied to the root container.                                                             |
| `percentiles`    | `number[]`            | no       | from `config.percentiles` or `[5, 25, 75, 95]` | Optional top-level override for percentile display mode settings.                                              |

## `config` options

| key                  | type                                                      | default                                        | description                                                                                              |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `margin`             | `{ top, right, bottom, left }`                            | `{ top: 20, right: 40, bottom: 30, left: 30 }` | Inner chart margins.                                                                                     |
| `baseP`              | `number`                                                  | `1050`                                         | Bottom pressure bound (hPa).                                                                             |
| `topP`               | `number`                                                  | `100`                                          | Top pressure bound (hPa).                                                                                |
| `minT`               | `number`                                                  | `-45`                                          | Left temperature bound (deg C).                                                                          |
| `maxT`               | `number`                                                  | `50`                                           | Right temperature bound (deg C).                                                                         |
| `skewAngle`          | `number`                                                  | `55`                                           | Skew angle for the Skew-T transform.                                                                     |
| `aspectRatio`        | `number`                                                  | `1`                                            | Plot width/height ratio target.                                                                          |
| `isobars`            | `number[]`                                                | `[1000, 850, 700, 500, 300, 200, 100]`         | Pressure lines drawn in the background.                                                                  |
| `isotherms`          | `{ min, max, interval }`                                  | `{ min: -50, max: 50, interval: 10 }`          | Background temperature-line generation.                                                                  |
| `dryAdiabats`        | `{ min, max, interval }`                                  | `{ min: -30, max: 170, interval: 20 }`         | Dry adiabat background settings.                                                                         |
| `moistAdiabats`      | `{ min, max, interval }`                                  | `{ min: -20, max: 40, interval: 5 }`           | Moist adiabat background settings.                                                                       |
| `mixingRatio`        | `number[]`                                                | `[2, 4, 8, 14, 20, 26]`                        | Mixing ratio guide lines (g/kg).                                                                         |
| `colors`             | `object`                                                  | built-in colors                                | Color map for traces and grid lines (`temp`, `dwpt`, `wetb`, `vtmp`, `parcel`, `parcelVirtual`, etc.).   |
| `zoom`               | `{ enabled, min, max }`                                   | `{ enabled: true, min: 1, max: 5 }`            | Zoom enablement and limits.                                                                              |
| `displayMode`        | `'plumes' \| 'boxwhisker' \| 'mean'`                      | `'plumes'`                                     | Global fallback for trace rendering mode.                                                                |
| `displayModes`       | `{ temp?, dwpt?, wetb?, vtmp?, parcel?, parcelVirtual? }` | `undefined`                                    | Per-trace display mode overrides using `'plumes'`, `'boxwhisker'`, or `'mean'`, including parcel traces. |
| `percentiles`        | `number[]`                                                | `[5, 25, 75, 95]`                              | Used by `boxwhisker` mode for whisker/box bounds.                                                        |
| `showTemperature`    | `boolean`                                                 | `true`                                         | Show/hide temperature trace.                                                                             |
| `showDewPoint`       | `boolean`                                                 | `true`                                         | Show/hide dewpoint trace.                                                                                |
| `showWetBulb`        | `boolean`                                                 | `false`                                        | Show/hide wet-bulb trace.                                                                                |
| `showVirtualTemp`    | `boolean`                                                 | `false`                                        | Show/hide virtual-temperature trace.                                                                     |
| `traceVisibility`    | `{ temp?, dwpt?, wetb?, vtmp? }`                          | derived                                        | Alternate trace visibility object (used if specific booleans are not set).                               |
| `traceLineStyles`    | `{ temp?, dwpt?, wetb?, vtmp?, parcel?, parcelVirtual? }` | built-in styles                                | Line-style map using `'solid'`, `'dash'`, `'dot'`, or `'dashDot'`.                                       |
| `parcelTrace`        | `'sfc' \| 'mu' \| 'ml' \| 'none'`                         | `'none'` in independent mode                   | Regular-temperature parcel trace selector.                                                               |
| `virtualParcelTrace` | `'sfc' \| 'mu' \| 'ml' \| 'none'`                         | `'none'` in independent mode                   | Virtual-temperature parcel trace selector.                                                               |
| `renderTooltip`      | `(data) => ReactNode`                                     | `null`                                         | Custom tooltip renderer for hover level data.                                                            |

## Display mode behavior

- `displayMode` is a global fallback for all traces.
- `displayModes` can override per trace key: `temp`, `dwpt`, `wetb`, `vtmp`, `parcel`, `parcelVirtual`.
- Supported mode values are: `'plumes'`, `'boxwhisker'`, `'mean'`.
- In `'boxwhisker'` mode, the `50` percentile (median) is always included automatically.

## Line style options

Use `traceLineStyles` with these values:

- `'solid'`: no dash pattern
- `'dash'`: `6,4`
- `'dot'`: `2,3`
- `'dashDot'`: `8,3,2,3`

Default line styles:

```js
{
    temp: 'solid',
    dwpt: 'solid',
    wetb: 'solid',
    vtmp: 'solid',
    parcel: 'dot',
    parcelVirtual: 'dash',
}
```

## Parcel trace configuration

Recommended (independent) configuration:

```js
config: {
    parcelTrace: 'none',         // regular-temperature parcel trace
    virtualParcelTrace: 'sfc',   // virtual-temperature parcel trace
}
```

Selection behavior:

- Both `parcelTrace` and `virtualParcelTrace` are optional and default to `'none'` when omitted.

## Parcel trace stats requirements

Parcel traces read from `statsDictParam` keys generated by `createSounding`:

- Virtual parcel traces: `sfctrace`, `mutrace`, `mltrace`
- Regular parcel traces: `sfctrace_regular`, `mutrace_regular`, `mltrace_regular`

These keys are available when stats are computed with:

```js
const stats = sounding.calcStats(sounding.getMembers(), 'list');
```

## Pressure alignment

`SkewT` aligns regular member profiles and parcel traces to a shared pressure grid before mean rendering.

- The common pressure grid is formed from all available member pressures.
- The shared surface pressure is averaged across members before alignment.
- Mean parcel traces and mean profile traces therefore use interpolated points instead of comparing mismatched pressure levels directly.

## Default colors

```js
{
    isobar: 'rgba(200, 150, 150, 0.4)',
    isotherm: 'rgba(200, 150, 150, 0.4)',
    dryAdiabat: 'rgba(200, 150, 150, 0.3)',
    moistAdiabat: 'rgba(100, 200, 100, 0.3)',
    mixingRatio: 'rgba(150, 255, 0, 0.2)',
    temp: '#ff0000',
    dwpt: '#00ff00',
    wetb: '#00ffff',
    vtmp: '#ff8181',
    parcel: '#eaff00',
    parcelVirtual: '#eaff00',
}
```

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
