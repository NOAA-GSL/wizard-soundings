# TallGraph Component Usage

Documentation index:

- [Main README](../README.md)
- [createSounding input and usage](./create-sounding.md)
- [SkewT usage](./skewt.md)
- [Hodograph usage](./hodograph.md)
- [StatsTable usage](./stats-table.md)
- [BoxPlot usage](./boxplot.md)

`TallGraph` is a narrow companion plot for the `SkewT`. It shares the SkewT's pressure (y) axis and plots relative humidity (RH) and omega, each with its own x axis. Enabled variables get one x axis each; the axes stack below the plot, and a disabled variable's axis is removed.

## Basic usage

```jsx
import { useState } from 'react';
import { createSounding, SkewT, TallGraph } from '@noaa-gsl/wizard-soundings';
import '@noaa-gsl/wizard-soundings/styles.css';

const sounding = createSounding();
sounding.updateData(recordsForDate);
const soundingData = sounding.getLevelData();

function Soundings() {
    const [skewTYAxis, setSkewTYAxis] = useState(null);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', height: 850 }}>
            <SkewT
                soundingParam={soundingData}
                onYAxisChange={setSkewTYAxis}
                config={{ margin: { top: 20, right: 40, bottom: 76, left: 30 } }}
            />
            <TallGraph
                soundingParam={soundingData}
                yAxis={skewTYAxis}
                config={{
                    rh: { displayMode: 'meanBars' },
                    omega: { displayMode: 'boxwhisker', units: 'Pa/s' },
                }}
            />
        </div>
    );
}
```

### Aligning with the SkewT

- Pass the SkewT's `onYAxisChange` callback output to `TallGraph`'s `yAxis` prop. The TallGraph then uses the SkewT's pressure bounds, vertical plot offset/height, and follows the SkewT zoom/pan.
- Scrolling the mouse wheel over the TallGraph zooms the SkewT (and therefore both plots) around the cursor's pressure level; dragging vertically pans. This needs the `zoomBy`/`panBy` functions from `onYAxisChange`, and is disabled when SkewT `zoom.enabled` is `false`.
- Give both containers the same height and top edge so the y axes line up.
- The stacked x axes are drawn below the plot area. With `yAxis` set, leave room with the SkewT `margin.bottom` (about `axisHeight` × number of enabled variables, e.g. `76` for two axes at the default `34`).
- Without `yAxis`, the TallGraph lays itself out using its own `margin`, `baseP`, and `topP`, and reserves room for the axes automatically.

## Props

| prop            | type                  | required | default                                        | description                                                      |
| --------------- | --------------------- | -------- | ---------------------------------------------- | ---------------------------------------------------------------- |
| `soundingParam` | `Array<Array<Level>>` | yes      | none                                           | Member profile arrays, typically from `getLevelData()`.          |
| `config`        | `object`              | no       | `{}`                                           | Chart options (see config table).                                |
| `yAxis`         | `object \| null`      | no       | `undefined`                                    | Shared y-axis layout from `SkewT`'s `onYAxisChange` (see below). |
| `className`     | `string`              | no       | `'tallgraph-container'`                        | CSS class for the root container.                                |
| `sx`            | `object`              | no       | `{}`                                           | Inline style object applied to the root container.               |
| `percentiles`   | `number[]`            | no       | from `config.percentiles` or `[5, 25, 75, 95]` | Optional top-level override for box-whisker percentiles.         |

### `yAxis` object

| key         | type                                  | description                                                                            |
| ----------- | ------------------------------------- | -------------------------------------------------------------------------------------- |
| `baseP`     | `number`                              | Bottom pressure bound (hPa).                                                           |
| `topP`      | `number`                              | Top pressure bound (hPa).                                                              |
| `offsetY`   | `number`                              | Pixel offset of the plot area from the top of the container.                           |
| `innerH`    | `number`                              | Pixel height of the plot area.                                                         |
| `transform` | `{ k, y }`                            | Zoom scale and vertical translation.                                                   |
| `zoomBy`    | `(factor: number, y: number) => void` | Optional. Zooms the SkewT by `factor` around plot-area pixel `y`. Used for wheel zoom. |
| `panBy`     | `(dy: number) => void`                | Optional. Pans the SkewT vertically by `dy` screen pixels. Used for drag panning.      |

## `config` options

| key             | type                           | default                                                                        | description                                                                     |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `margin`        | `{ top, right, bottom, left }` | `{ top: 20, right: 12, bottom: 4, left: 12 }`                                  | Plot margins. `top`/`bottom` are ignored for the plot area when `yAxis` is set. |
| `baseP`         | `number`                       | `1050`                                                                         | Bottom pressure bound (hPa), used when `yAxis` is not set.                      |
| `topP`          | `number`                       | `100`                                                                          | Top pressure bound (hPa), used when `yAxis` is not set.                         |
| `axisHeight`    | `number`                       | `34`                                                                           | Pixel height of each stacked x axis.                                            |
| `percentiles`   | `number[]`                     | `[5, 25, 75, 95]`                                                              | Whisker/box percentiles for the box-whisker modes. `50` is always included.     |
| `isobars`       | `number[]`                     | `[1000, 850, 700, 500, 300, 200, 100]`                                         | Pressure grid lines.                                                            |
| `colors`        | `{ isobar, zeroLine }`         | `{ isobar: 'rgba(200, 150, 150, 0.4)', zeroLine: 'rgba(150, 150, 150, 0.8)' }` | Grid colors. `zeroLine` is the dashed omega = 0 line.                           |
| `pressureAxis`  | `object`                       | see pressure axis options                                                      | Pressure (y) axis values and label.                                             |
| `rh`            | `object`                       | see variable options                                                           | RH settings.                                                                    |
| `omega`         | `object`                       | see variable options                                                           | Omega settings.                                                                 |
| `renderTooltip` | `(data) => ReactNode`          | `null`                                                                         | Custom tooltip renderer. Receives the hovered mean-profile level.               |

### Pressure axis options (`pressureAxis`)

The TallGraph shares the SkewT's pressure axis, so its own y values and y-axis label are hidden by default. Turn them on when the TallGraph is shown on its own or away from the SkewT.

| key          | type      | default      | description                                                                                                          |
| ------------ | --------- | ------------ | -------------------------------------------------------------------------------------------------------------------- |
| `showValues` | `boolean` | `false`      | Show pressure values at each `isobars` level on the left edge. Values outside the visible (zoomed) range are hidden. |
| `showLabel`  | `boolean` | `false`      | Show the rotated y-axis title on the left edge.                                                                      |
| `label`      | `string`  | `'Pressure'` | y-axis title text.                                                                                                   |
| `units`      | `string`  | `'mb'`       | y-axis title units, shown as `label (units)`. Empty string shows the label only. Display text only.                  |

When shown, the TallGraph reserves extra left space automatically (40 px for values, 20 px for the label) on top of `margin.left`, so the plot area gets narrower. Values and label use the same font size (14px), weight, and placement as the SkewT isobar labels and y-axis title, colored with `--ws-tallgraph-text`.

```js
config: {
    pressureAxis: { showValues: true, showLabel: true, units: 'hPa' },
}
```

### Variable options (`rh` and `omega`)

| key           | type                                                                   | `rh` default | `omega` default | description                                                                                                                                                                                                                        |
| ------------- | ---------------------------------------------------------------------- | ------------ | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`     | `boolean`                                                              | `true`       | `true`          | Show the variable and its x axis.                                                                                                                                                                                                  |
| `displayMode` | `'meanBars' \| 'mean' \| 'plumes' \| 'boxwhiskerBars' \| 'boxwhisker'` | `'meanBars'` | `'mean'`        | Rendering mode (see below). Unknown values fall back to the default.                                                                                                                                                               |
| `valueKey`    | `string`                                                               | `'rh'`       | `'wwnd'`        | Level field to plot. Omega comes from the `w_isobaric` record field (stored as `wwnd`). For RH use `'rh'` (water), `'rhIce'` (ice), or `'rhCombo'` (requires [`combineRh`](./create-sounding.md#combinerhleveldata-icethreshold)). |
| `color`       | `string`                                                               | `'#22c55e'`  | `'#60a5fa'`     | Trace, bar, and axis color.                                                                                                                                                                                                        |
| `lineStyle`   | `'solid' \| 'dash' \| 'dot' \| 'dashDot'`                              | `'solid'`    | `'solid'`       | Dash pattern for line modes (`mean`, `plumes`, and the `boxwhisker` median).                                                                                                                                                       |
| `domain`      | `[number, number] \| null`                                             | `[0, 100]`   | `null`          | x-axis range. `null` = automatic range symmetric about zero. A reversed domain (e.g. `[2, -2]`) flips the axis.                                                                                                                    |
| `ticks`       | `number`                                                               | `3`          | `3`             | Approximate number of axis ticks.                                                                                                                                                                                                  |
| `colorBar`    | `Array<{ value: number, color: string }> \| null`                      | `null`       | `null`          | Color scheme for `meanBars` and `boxwhiskerBars` (see below). `null` uses `color`.                                                                                                                                                 |
| `label`       | `string`                                                               | `'RH'`       | `'Omega'`       | Axis title.                                                                                                                                                                                                                        |
| `units`       | `string`                                                               | `'%'`        | `''`            | Axis title units, shown as `label (units)`. Omega values are plotted in their input units.                                                                                                                                         |

## Display modes

These names match the SkewT display modes where they overlap (`mean`, `plumes`, `boxwhisker`).

| mode             | label             | description                                                                                                      |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `meanBars`       | Mean Bars         | One bar per level from zero (or the nearest domain edge) to the ensemble mean. Each bar spans its level's layer. |
| `mean`           | Mean Line         | Line through the ensemble mean profile.                                                                          |
| `plumes`         | Plumes            | One thin line per ensemble member.                                                                               |
| `boxwhiskerBars` | Box-Whisker Bars  | Per-level box-and-whisker glyphs: whisker line, box between the inner percentiles, and a median tick.            |
| `boxwhisker`     | Box-Whisker Lines | Shaded whisker and box areas with a median line, like the SkewT temperature `boxwhisker` mode.                   |

Percentile mapping for both box-whisker modes (after sorting and adding `50`): the lowest/highest values are the whiskers, the second-lowest/second-highest are the box, and `50` is the median.

## Bar color schemes (`colorBar`)

`colorBar` colors each bar by its value in the `meanBars` and `boxwhiskerBars` modes. Line modes always use `color`.

- Stops can be in any order. Colors are not interpolated: a value uses the color of the highest stop at or below it (e.g. with stops at 70 and 94, values 70–93.9 use the 70 color).
- Values at or above the highest stop use the highest stop's color.
- Values below the lowest stop (and missing values) use the variable's `color`.
- `meanBars` colors each bar by the mean value; `boxwhiskerBars` colors each whole glyph by its median.
- An invalid `colorBar` (empty, or a stop without a finite `value` and a non-empty `color`) is ignored.

```js
config: {
    rh: {
        displayMode: 'meanBars',
        colorBar: [
            { value: 70, color: '#14532d' },
            { value: 94, color: '#00ff00' },
            { value: 95, color: '#9333ea' },
            { value: 100, color: '#9333ea' },
        ],
    },
}
```

The demo offers these RH presets: Green to Purple (Classic), Cyan to Deep Blue, Spectral (Multi-stop), and Grayscale.

## Styling overrides

`TallGraph` uses CSS Modules and exposes `.ws-tallgraph` as the stable public styling hook. Override these CSS variables on `.ws-tallgraph`, a parent element, or the `sx` prop:

| variable              | default       | description                                                                                                     |
| --------------------- | ------------- | --------------------------------------------------------------------------------------------------------------- |
| `--ws-tallgraph-text` | `#333`        | Hover line, tick label, and pressure axis value/label color. The plot frame is black, matching the SkewT frame. |
| `--ws-tallgraph-bg`   | `transparent` | SVG background color.                                                                                           |

## Tooltip

Hovering the plot shows the nearest mean-profile level: pressure plus the value of each enabled variable. Provide `config.renderTooltip(data)` to replace the default content.

## Demo reference

See practical usage in:

- `demo/examples/stats/main.jsx`
