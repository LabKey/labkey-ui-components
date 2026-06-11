# @labkey/build

This package contains LabKey client-side build assets.

## Installation

To install using npm
```sh
npm install @labkey/build
```

## Build configs

The `webpack` directory has [Rspack](https://rspack.rs) configs that can be used to build LabKey client-side React
pages. (The directory retains the `webpack/` name so consuming modules' `--config` paths did not have to change when
we migrated from webpack to Rspack.) See the [README](./webpack/README.md) in that directory for further information,
including the one required change consuming modules must make to their `package.json` build scripts.

## Release Notes
Release notes for this package are available [here](./releaseNotes/build.md).
