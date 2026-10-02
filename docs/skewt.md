# SkewT Component Usage

Documentation index:

- [Main README](../README.md)
- [createSounding input and usage](./create-sounding.md)
- [Hodograph usage](./hodograph.md)
- [StatsTable usage](./stats-table.md)
- [BoxPlot usage](./boxplot.md)
- [TallGraph usage](./tall-graph.md)

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

| prop             | type                  | required | default                                        | description                                                                                                                                                                                                                                                                                                               |
| ---------------- | --------------------- | -------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `soundingParam`  | `Array<Array<Level>>` | yes      | none                                           | Member profile arrays, typically from `getLevelData()`.                                                                                                                                                                                                                                                                   |
| `statsDictParam` | `object`              | no       | `undefined`                                    | Stats dictionary from `calcStats(..., 'list')`; used for parcel traces (e.g., `sfctrace`, `sfctrace_regular`), PBL depth (`pblDepth`), and momentum transfer (`momentumTransferVector`, `momentumTransferVectorMax`).                                                                                                    |
| `config`         | `object`              | no       | `{}`                                           | Chart behavior and rendering options (see config table).                                                                                                                                                                                                                                                                  |
| `className`      | `string`              | no       | `'skewt-container'`                            | CSS class for the root container.                                                                                                                                                                                                                                                                                         |
| `sx`             | `object`              | no       | `{}`                                           | Inline style object applied to the root container.                                                                                                                                                                                                                                                                        |
| `percentiles`    | `number[]`            | no       | from `config.percentiles` or `[5, 25, 75, 95]` | Optional top-level override for percentile display mode settings.                                                                                                                                                                                                                                                         |
| `onYAxisChange`  | `(yAxis) => void`     | no       | `undefined`                                    | Called with `{ baseP, topP, offsetY, innerH, transform: { k, y }, zoomBy(factor, y), panBy(dy) }` when the pressure axis layout or zoom changes. `zoomBy`/`panBy` drive the SkewT zoom from outside (no-ops when `zoom.enabled` is `false`). Pass the value to [`TallGraph`](./tall-graph.md)'s `yAxis` prop to align it. |

## `config` options

| key                  | type                                                      | default                                        | description                                                                                                           |
| -------------------- | --------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `margin`             | `{ top, right, bottom, left }`                            | `{ top: 20, right: 40, bottom: 50, left: 60 }` | Inner chart margins. Not merged with the default: pass all four sides. Leave room on the bottom/left for axis titles. |
| `baseP`              | `number`                                                  | `1050`                                         | Bottom pressure bound (hPa).                                                                                          |
| `topP`               | `number`                                                  | `100`                                          | Top pressure bound (hPa).                                                                                             |
| `minT`               | `number`                                                  | `-45`                                          | Left temperature bound (deg C).                                                                                       |
| `maxT`               | `number`                                                  | `50`                                           | Right temperature bound (deg C).                                                                                      |
| `skewAngle`          | `number`                                                  | `55`                                           | Skew angle for the Skew-T transform.                                                                                  |
| `aspectRatio`        | `number`                                                  | `1`                                            | Plot width/height ratio target.                                                                                       |
| `isobars`            | `number[]`                                                | `[1000, 850, 700, 500, 300, 200, 100]`         | Pressure lines drawn in the background.                                                                               |
| `isotherms`          | `{ min, max, interval }`                                  | `{ min: -50, max: 50, interval: 10 }`          | Background temperature-line generation.                                                                               |
| `dryAdiabats`        | `{ min, max, interval }`                                  | `{ min: -30, max: 170, interval: 20 }`         | Dry adiabat background settings.                                                                                      |
| `moistAdiabats`      | `{ min, max, interval }`                                  | `{ min: -20, max: 40, interval: 5 }`           | Moist adiabat background settings.                                                                                    |
| `mixingRatio`        | `number[]`                                                | `[2, 4, 8, 14, 20, 26]`                        | Mixing ratio guide lines (g/kg).                                                                                      |
| `colors`             | `object`                                                  | built-in colors                                | Color map for traces and grid lines (`temp`, `dwpt`, `wetb`, `vtmp`, `parcel`, `parcelVirtual`, etc.).                |
| `zoom`               | `{ enabled, min, max }`                                   | `{ enabled: true, min: 1, max: 5 }`            | Zoom enablement and limits.                                                                                           |
| `displayMode`        | `'plumes' \| 'boxwhisker' \| 'mean'`                      | `'plumes'`                                     | Global fallback for trace rendering mode.                                                                             |
| `displayModes`       | `{ temp?, dwpt?, wetb?, vtmp?, parcel?, parcelVirtual? }` | `undefined`                                    | Per-trace display mode overrides using `'plumes'`, `'boxwhisker'`, or `'mean'`, including parcel traces.              |
| `percentiles`        | `number[]`                                                | `[5, 25, 75, 95]`                              | Used by `boxwhisker` mode for whisker/box bounds.                                                                     |
| `showTemperature`    | `boolean`                                                 | `true`                                         | Show/hide temperature trace.                                                                                          |
| `showDewPoint`       | `boolean`                                                 | `true`                                         | Show/hide dewpoint trace.                                                                                             |
| `showWetBulb`        | `boolean`                                                 | `false`                                        | Show/hide wet-bulb trace.                                                                                             |
| `showVirtualTemp`    | `boolean`                                                 | `false`                                        | Show/hide virtual-temperature trace.                                                                                  |
| `traceVisibility`    | `{ temp?, dwpt?, wetb?, vtmp? }`                          | derived                                        | Alternate trace visibility object (used if specific booleans are not set).                                            |
| `traceLineStyles`    | `{ temp?, dwpt?, wetb?, vtmp?, parcel?, parcelVirtual? }` | built-in styles                                | Line-style map using `'solid'`, `'dash'`, `'dot'`, or `'dashDot'`.                                                    |
| `parcelTrace`        | `'sfc' \| 'mu' \| 'ml' \| 'none'`                         | `'none'` in independent mode                   | Regular-temperature parcel trace selector.                                                                            |
| `virtualParcelTrace` | `'sfc' \| 'mu' \| 'ml' \| 'none'`                         | `'none'` in independent mode                   | Virtual-temperature parcel trace selector.                                                                            |
| `renderTooltip`      | `(data) => ReactNode`                                     | `null`                                         | Custom tooltip renderer for hover level data.                                                                         |
| `pblDepth`           | `{ enabled?, color?, width? }`                            | `{ enabled: false, color: '#90caf9', width: 8 }` | PBL depth box-whisker. See [PBL depth and momentum transfer](#pbl-depth-and-momentum-transfer).                     |
| `momentumTransfer`   | `{ enabled?, stat?, color?, showMean?, showMax? }`        | `{ enabled: false, stat: 'mean', color: '#ffb74d', showMean: true, showMax: true }` | Mean/max momentum-transfer barbs. See [PBL depth and momentum transfer](#pbl-depth-and-momentum-transfer). |
| `axisLabels`         | `{ x?: string, y?: string }`                              | `{ x: 'Temperature', y: 'Pressure' }`          | Axis title text. An empty string hides that title.                                                                    |
| `units`              | `{ temperature?: string, pressure?: string }`             | `{ temperature: 'C', pressure: 'mb' }`         | Units shown in the axis titles as `label (units)`. An empty string omits the parentheses.                             |

## Axis titles and units

The x axis is titled `Temperature (C)` and the y axis `Pressure (mb)` by default. Override either part:

```js
config: {
    axisLabels: { x: 'Temperature', y: 'Pressure' },
    units: { temperature: '°C', pressure: 'hPa' },
}
```

- `units` is display text only; no conversion is applied. Profile data must be in deg C and hPa (mb).
- `axisLabels` and `units` are merged with the defaults, so you can pass a single key.
- The x title sits below the isotherm labels and the y title is rotated left of the isobar labels; they use `--ws-skewt-text` for color.

## Display mode behavior

- `displayMode` is a global fallback for all traces.
- `displayModes` can override per trace key: `temp`, `dwpt`, `wetb`, `vtmp`, `parcel`, `parcelVirtual`.
- Supported mode values are: `'plumes'`, `'boxwhisker'`, `'mean'`.
- In `'boxwhisker'` mode, the `50` percentile (median) is always included automatically.

Display names used in the demo (shared with [`TallGraph`](./tall-graph.md)):

| mode         | label             |
| ------------ | ----------------- |
| `mean`       | Mean Line         |
| `plumes`     | Plumes            |
| `boxwhisker` | Box-Whisker Lines |

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

## PBL depth and momentum transfer

Both overlays follow zoom/pan vertically. The PBL box is drawn left of the wind-barb column; the MT barbs sit on the mean temperature trace. They read per-member values from `statsDictParam`, so pass `calcStats(..., 'list')` output.

```js
config: {
    percentiles: [5, 25, 75, 95],
    pblDepth: { enabled: true },
    momentumTransfer: { enabled: true, stat: 'mean' },
}
```

PBL depth (`pblDepth`):

| key       | type      | default     | description                                                    |
| --------- | --------- | ----------- | -------------------------------------------------------------- |
| `enabled` | `boolean` | `false`     | Show the PBL depth box-whisker.                                |
| `color`   | `string`  | `'#90caf9'` | Stroke and fill color.                                         |
| `width`   | `number`  | `8`         | Box width in pixels.                                           |

- PBL top per member comes from `pblDepth` (first level where virtual potential temperature is at least 0.5 K above the surface value).
- Whiskers and box use `percentiles` (lowest/highest are whiskers, second/second-to-last are the box). Percentiles are of PBL **height**, so the 95th percentile is the deepest PBL.
- The median is drawn as a thick line. With one member, only a single line at the PBL top is drawn.

Momentum transfer (`momentumTransfer`):

| key        | type      | default     | description                                                                                 |
| ---------- | --------- | ----------- | ------------------------------------------------------------------------------------------- |
| `enabled`  | `boolean` | `false`     | Show the MT barbs.                                                                          |
| `stat`     | `string`  | `'mean'`    | Statistic applied across members to MT speed: `'mean'` or a percentile such as `'90%'`.    |
| `color`    | `string`  | `'#ffb74d'` | Barb color.                                                                                 |
| `strokeWidth` | `number` | `2.5`    | Barb line thickness in pixels.                                                              |
| `showMean` | `boolean` | `true`      | Show the mean-MT barb (`momentumTransferVector`).                                           |
| `showMax`  | `boolean` | `true`      | Show the max-MT barb (`momentumTransferVectorMax`).                                         |

- `stat` follows the same values as [`calcStats`](./stats-table.md#calcstats-options). With `'mean'`, the barbs show the mean of the members' mean MT and the mean of the members' max MT.
- Barb direction is the direction of the mean u/v across members; barb speed is `stat` applied to member speeds.
- The mean-MT barb sits at half the mean PBL depth: the log-pressure midpoint between the surface (highest pressure in the mean profile) and the mean member PBL top. Without a surface pressure it falls back to the mean PBL top.
- The max-MT barb sits at the mean member PBL top.
- Each MT barb is placed horizontally on the mean temperature trace at its height (interpolated in log-pressure) and follows zoom/pan. A barb is hidden if the mean profile does not reach its pressure.
- If both barbs land at the same height, the max-MT barb is shifted left so they do not overlap.

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

## Styling overrides

`SkewT` uses CSS Modules for internal selectors and exposes `.ws-skewt` as the stable public styling hook. Override these CSS variables on `.ws-skewt`, a parent element, or the `sx` prop:

| variable          | default       | description                              |
| ----------------- | ------------- | ---------------------------------------- |
| `--ws-skewt-text` | `#333`        | Default SVG stroke and grid label color. |
| `--ws-skewt-bg`   | `transparent` | Optional SVG background color.           |

Example:

```css
.weather-panel .ws-skewt {
    --ws-skewt-text: #111827;
    --ws-skewt-bg: #fff;
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
