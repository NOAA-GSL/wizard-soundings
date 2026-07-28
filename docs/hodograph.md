# Hodograph Component Usage

Documentation index:

- [Main README](../README.md)
- [createSounding input and usage](./create-sounding.md)
- [SkewT usage](./skewt.md)
- [StatsTable usage](./stats-table.md)
- [BoxPlot usage](./boxplot.md)

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
    rings: { interval: 10, labelInterval: 20, units: 'kts' },
  }}
/>;
```

## Props

| prop | type | required | default | description |
| --- | --- | --- | --- | --- |
| `soundingParam` | `Array<Array<Level>>` | yes | none | Member profile arrays, usually from `getLevelData()`. |
| `statsDictParam` | `object` | no | `undefined` | Stats dictionary used for storm-motion markers (`rstVector`, `lstVector`). |
| `config` | `object` | no | `{}` | Hodograph behavior and style options (see config table). |
| `className` | `string` | no | `'hodobox'` | CSS class for root container. |
| `sx` | `object` | no | `{}` | Inline style object applied to root container. |

## `config` options

| key | type | default | description |
| --- | --- | --- | --- |
| `margin` | `number` | `25` | Margin used to compute plotting radius. |
| `maxWind` | `number` | `80` | Maximum wind speed used for ring and radial scale. |
| `rings.interval` | `number` | `10` | Ring spacing. |
| `rings.labelInterval` | `number` | `20` | Label interval for ring text. |
| `rings.units` | `string` | `'kts'` | Unit label displayed on ring labels. |
| `segments` | `Array<{ maxHeight, color, label }>` | see source defaults | Mean-hodograph segment color bands by height. |
| `zoom.enabled` | `boolean` | `true` | Enable/disable pan/zoom behavior. |
| `zoom.min` | `number` | `1` | Minimum zoom scale. |
| `zoom.max` | `number` | `10` | Maximum zoom scale. |
| `renderTooltip` | `(data, type) => ReactNode` | `null` | Custom tooltip renderer. |

Default `segments` are:

- 0-1 km (`red`)
- 1-3 km (`orange`)
- 3-6 km (`purple`)
- >6 km (`blue`)

## Tooltip override

If `config.renderTooltip` is provided, `Hodograph` calls it with:

- `data`: hovered object
- `type`: one of `datapoint`, `member`, `bunkers-right`, `bunkers-left`

```jsx
const customHodoTooltip = (data, type) => {
  if (!data) return null;

  if (type === 'datapoint') {
    return <div>{data.twnd?.toFixed(0)} kts @ {data.wdir?.toFixed(0)} deg</div>;
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
