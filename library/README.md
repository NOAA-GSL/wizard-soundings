# Wizard Soundings

A javascript sounding library

## Getting Started

### To install:

The soundings library is built on top of `d3` and will also require the installation of that dependency.

```bash
npm install @noaa-gsl/wizard-soundings d3
```

## Library

### Mean profile behavior

Skew-T and hodograph mean traces are always computed from ensemble member profiles.

### Skew-T trace visibility

Skew-T traces can be toggled per variable in `globalConfig.skewt`:

- `showTemperature` (default: `true`)
- `showDewPoint` (default: `true`)
- `showWetBulb` (default: `false`)

These toggles apply consistently across `plumes`, `boxwhisker`, and `mean` display modes.
