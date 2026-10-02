# Hodograph Component Usage

Documentation index:

- [Main README](../README.md)
- [createSounding input and usage](./create-sounding.md)
- [SkewT usage](./skewt.md)
- [StatsTable usage](./stats-table.md)
- [BoxPlot usage](./boxplot.md)
- [TallGraph usage](./tall-graph.md)

This document explains how to use the `Hodograph` React component exported by `@noaa-gsl/wizard-soundings`.

## When to use `createSounding`

`Hodograph` expects member profile arrays from:

- `createSounding().getLevelData()`

Use [create-sounding.md](./create-sounding.md) first so winds and levels are formatted correctly.

## Basic usage

```jsx
import { createSounding, Hodograph } from '@noaa-gsl/wizard-soundings';
import '@noaa-gsl/wizard-soundings/styles.css';

const sounding = createSounding();
sounding.updateData(recordsForDate);

const soundingData = sounding.getLevelData();
const stats = sounding.calcStats(sounding.getMembers(), 'mean');

<Hodograph
    soundingParam={soundingData}
    statsDictParam={stats}
    config={{
        maxWind: 90,
        windUnit: 'kts',
        rings: { interval: 10, labelInterval: 20 },
    }}
/>;
```

## Props

| prop             | type                  | required | default     | description                                                                |
| ---------------- | --------------------- | -------- | ----------- | -------------------------------------------------------------------------- |
| `soundingParam`  | `Array<Array<Level>>` | yes      | none        | Member profile arrays, usually from `getLevelData()`.                      |
| `statsDictParam` | `object`              | no       | `undefined` | Stats dictionary used for storm-motion markers (`rstVector`, `lstVector`). |
| `config`         | `object`              | no       | `{}`        | Hodograph behavior and style options (see config table).                   |
| `className`      | `string`              | no       | `'hodobox'` | CSS class for root container.                                              |
| `sx`             | `object`              | no       | `{}`        | Inline style object applied to root container.                             |

## `config` options

| key                   | type                                                           | default             | description                                                                                |
| --------------------- | -------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------ |
| `margin`              | `number`                                                       | `25`                | Margin used to compute plotting radius.                                                    |
| `maxWind`             | `number`                                                       | `80`                | Maximum wind speed (kts) used for the radial scale. Stays in kts for every `windUnit`.     |
| `windUnit`            | `'kts' \| 'm/s' \| 'mph'`                                      | `'kts'`             | Display unit for ring labels and tooltip speeds. Wind data stays in kts.                   |
| `rings.interval`      | `number`                                                       | `10`                | Ring spacing, in `windUnit`.                                                               |
| `rings.labelInterval` | `number`                                                       | `20`                | Label interval for ring text, in `windUnit`.                                               |
| `rings.units`         | `string`                                                       | `windUnit`          | Unit label displayed on ring labels.                                                       |
| `segments`            | `Array<{ maxHeight, color, label }>`                           | see source defaults | Mean-hodograph segment color bands by height.                                              |
| `legend`              | `boolean \| object`                                            | `true`              | Built-in legend overlay. `false` hides it; an object configures it (see below).            |
| `legend.enabled`      | `boolean`                                                      | `true`              | Show/hide the built-in legend.                                                             |
| `legend.position`     | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'top-left'`        | Corner of the hodograph the legend is placed in. Unknown values fall back to `'top-left'`. |
| `legend.title`        | `string`                                                       | `'Mean Wind'`       | Legend heading. Empty string hides it.                                                     |
| `legend.className`    | `string`                                                       | `''`                | Extra CSS class added to the legend element.                                               |
| `legend.sx`           | `object`                                                       | `{}`                | Inline style object applied to the legend element.                                         |
| `zoom.enabled`        | `boolean`                                                      | `true`              | Enable/disable pan/zoom behavior.                                                          |
| `zoom.min`            | `number`                                                       | `1`                 | Minimum zoom scale.                                                                        |
| `zoom.max`            | `number`                                                       | `10`                | Maximum zoom scale.                                                                        |
| `renderTooltip`       | `(data, type, { windUnit }) => ReactNode`                      | `null`              | Custom tooltip renderer. `data` speeds are kts; convert with `toWindUnit`.                 |

Default `segments` are:

- 0-1 km (`red`)
- 1-3 km (`orange`)
- 3-6 km (`purple`)
- > 6 km (`blue`)

They are exported as `DEFAULT_HODOGRAPH_SEGMENTS`.

## Legend

By default the mean-wind legend is drawn over the top-left corner of the hodograph.

```jsx
// Hide it
<Hodograph soundingParam={soundingData} config={{ legend: false }} />

// Move it and restyle it
<Hodograph
    soundingParam={soundingData}
    config={{ legend: { position: 'bottom-right', title: 'Wind', sx: { fontSize: 14 } } }}
/>
```

### Standalone `HodographLegend`

To place the legend somewhere else (sidebar, below the chart, ...), hide the built-in one and render `HodographLegend` yourself. Pass the same `segments` you give the `Hodograph` so the colors match.

```jsx
import { Hodograph, HodographLegend, DEFAULT_HODOGRAPH_SEGMENTS } from '@noaa-gsl/wizard-soundings';

<Hodograph soundingParam={soundingData} config={{ legend: false }} />
<HodographLegend segments={DEFAULT_HODOGRAPH_SEGMENTS} />
```

| prop        | type                                 | required | default                      | description                                           |
| ----------- | ------------------------------------ | -------- | ---------------------------- | ----------------------------------------------------- |
| `segments`  | `Array<{ maxHeight, color, label }>` | no       | `DEFAULT_HODOGRAPH_SEGMENTS` | Segments to list (only `color` and `label` are used). |
| `title`     | `string`                             | no       | `'Mean Wind'`                | Legend heading. Empty string hides it.                |
| `className` | `string`                             | no       | `''`                         | Extra CSS class for the legend element.               |
| `sx`        | `object`                             | no       | `{}`                         | Inline style object for the legend element.           |

The standalone legend is not absolutely positioned; it flows like a normal block element.

## Styling overrides

`Hodograph` uses CSS Modules for internal selectors and exposes `.ws-hodograph` as the stable public styling hook. Override these CSS variables on `.ws-hodograph`, a parent element, or the `sx` prop:

| variable                         | default       | description                                           |
| -------------------------------- | ------------- | ----------------------------------------------------- |
| `--ws-hodograph-bg`              | `transparent` | Optional root background color.                       |
| `--ws-hodograph-text`            | `#333`        | Ring label text color.                                |
| `--ws-hodograph-ring-color`      | `lightgray`   | Background ring stroke color.                         |
| `--ws-hodograph-member-stroke`   | `gray`        | Ensemble member line stroke color.                    |
| `--ws-hodograph-hover-stroke`    | `yellow`      | Hover stroke/fill color for member lines and markers. |
| `--ws-hodograph-datapoint-color` | `black`       | Major datapoint marker stroke/fill color.             |
| `--ws-hodograph-bunkers-color`   | `red`         | Bunkers marker stroke/fill color.                     |
| `--ws-hodograph-legend-bg`       | `transparent` | Legend background color.                              |
| `--ws-hodograph-legend-text`     | `black`       | Legend text color.                                    |
| `--ws-hodograph-legend-border`   | `#000`        | Legend and legend swatch border color.                |

The legend also exposes `.ws-hodograph-legend` as a stable class for CSS overrides (for example `.ws-hodograph-legend { font-size: 14px; }`), in addition to `legend.className` / `legend.sx`. The legend CSS variables are read from any ancestor, so they also apply to a standalone `HodographLegend`.

## Wind units

Set `windUnit` to `'kts'`, `'m/s'`, or `'mph'`. Only the display changes; data and `maxWind` stay in kts.

- Rings are drawn every `rings.interval` of the display unit up to `maxWind`, so labels are round numbers (for example `10, 30` in m/s with `maxWind: 80`).
- The default tooltip converts speeds (`twnd`, Bunkers `mag`).
- Exported helpers: `toWindUnit(valueKts, unit)`, `fromWindUnit(value, unit)`, `WIND_UNITS` (`['kts', 'm/s', 'mph']`), and `WIND_STAT_KEYS` (scalar stats converted by `StatsTable`/`BoxPlot`). Unknown units fall back to kts.

## Tooltip override

If `config.renderTooltip` is provided, `Hodograph` calls it with:

- `data`: hovered object
- `type`: one of `datapoint`, `member`, `bunkers-right`, `bunkers-left`
- `{ windUnit }`: the configured display unit

```jsx
import { toWindUnit } from '@noaa-gsl/wizard-soundings';

const customHodoTooltip = (data, type, { windUnit }) => {
    if (!data) return null;

    if (type === 'datapoint') {
        return (
            <div>
                {toWindUnit(data.twnd, windUnit)?.toFixed(0)} {windUnit} @ {data.wdir?.toFixed(0)}{' '}
                deg
            </div>
        );
    }

    if (type === 'member') {
        const memberId = Array.isArray(data) ? data[0]?.mem : data.mem;
        return <div>Member: {memberId}</div>;
    }

    return <div>{type}</div>;
};

<Hodograph
    soundingParam={soundingData}
    statsDictParam={stats}
    config={{ renderTooltip: customHodoTooltip }}
/>;
```

## Demo reference

See practical usage in:

- `demo/examples/stats/main.jsx`
