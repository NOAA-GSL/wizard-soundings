# Wizard Soundings

A javascript sounding library

## Getting Started

This is a monorepo setup using NPM Workspaces. The `/library` directory contains the `@noaa-gsl/wizard-soundings` package and the `/demo` directory contains the examples, which can be run with [Vite](https://vitejs.dev/).

### To install dependencies:

_**Note:** Following commands are all from the root directory_

1. Install `npm` packages

    ```bash
    npm install
    ```

2. Build the `@noaa-gsl/wizard-soundings` package

    ```bash
    npm run build
    ```

    - This only needs to be done once after cloning the repo. But if any changes are made to files in `/library` that need to be reflected in the demo project, a new build must be created.
    - To auto build after any changes run

    ```bash
    npm run build:dev
    ```

### To run the Vite dev server with examples (after installing dependencies):

```bash
# root directory or /demo
npm run dev
```

### To run tests:

```bash
# from the root directory
npm test
```

To run tests in watch mode (re-runs on file changes):

```bash
npm run test:watch --workspace=library
```

### To run linter checks:

```bash
# from the root directory
npm run lint --workspace=library
```

This uses ESLint to check code quality and style. Fixes can be auto-corrected with:

```bash
npm run lint --workspace=library -- --fix
```

## Library
