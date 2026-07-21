# ChartTooltip Readout

`ChartTooltip` is the common hover readout component used by Wizard Soundings to display interactive data near the cursor. It provides a standardized styling and positioning structure for tooltips across various sounding visualization components, such as `SkewT`, `Hodograph`, and `StatsTable`.

## Source Files

- `utilities/tooltip` (Core Component)
- `skewt/SkewT` (Integration Example)
- `hodograph/Hodograph` (Integration Example)
- `statstable/StatsTable` (Integration Example)

## Imports

From the local package structure:

```js
import ChartTooltip from '../utilities/tooltip';
```

## Component Props

`ChartTooltip` accepts these props:

| Prop | Type     | Required | Default | Notes                            |
| ---- | -------- | -------- | ------- | -------------------------------- |
| `x`  | `number` | Yes      | None    | Horizontal coordinate in pixels. |

|
| `y` | `number` | Yes | None | Vertical coordinate in pixels.

|
| `content` | `React.ReactNode` | Yes | None | The JSX content to display.

|
| `positionType` | `'fixed' | 'absolute'` | No | `'fixed'` | Use `'fixed'` for tables or `'absolute'` for SVG groups.

|

## Usage Contract & Patterns

Parent components typically manage tooltip visibility by storing hover event coordinates and relevant data in a local state variable (often named `hoverInfo`).

### Chart Implementations (`SkewT` & `Hodograph`)

Both `SkewT` and `Hodograph` check their `config` object for a custom `renderTooltip` function. If one is not provided, they fall back to their own default formatting components:

- **`SkewTTooltipContent`**: Formats pressure, temperature (T), dewpoint (Td), wind (speed and direction), relative humidity (RH), parcel temperature, and heights (MSL and AGL).

- **`HodographTooltipContent`**: Renders dynamic content based on a `type` string (`'datapoint'`, `'member'`, `'bunkers-right'`, or `'bunkers-left'`).

### Table Implementations (`StatsTable`)

In the `StatsTable` component, the tooltip content is constructed directly within a hover event handler. It relies on a `tooltip` configuration object defined in the internal `THERMO_GRID` that expects a `title` and `body` string.

## Example: Standard Integration

This is the standard integration pattern seen in components like `SkewT`:

```jsx
{
    hoverInfo && (
        <ChartTooltip
            x={hoverInfo.screenX}
            y={hoverInfo.screenY}
            content={
                settings.renderTooltip ? (
                    settings.renderTooltip(hoverInfo.data)
                ) : (
                    <SkewTTooltipContent data={hoverInfo.data} colors={settings.colors} />
                )
            }
        />
    );
}
```

## Notes and Runtime Behavior

- The component immediately returns `null` and renders nothing if no `content` is provided.

- It applies `pointerEvents: 'none'` to prevent the tooltip from capturing hover events and flickering under the mouse cursor.

- The tooltip box receives a base CSS transformation of `translate(10px, -15px)` to permanently offset it slightly from the direct cursor coordinates.

- It renders with a strict `zIndex` of `9999` to ensure it hovers above chart bounds.

- Styling includes an 85% opaque black background (`rgba(0, 0, 0, 0.85)`), white text (`#fff`), and a subtle white border (`rgba(255, 255, 255, 0.2)`).
