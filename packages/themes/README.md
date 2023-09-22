# @labkey/themes

This package contains the core UI themes for LabKey Server.

## Installation

```sh
# Using npm
npm install @labkey/themes --save-dev
```

## Development

If you're working with this package to develop themes you will need to have a local development
instance of LabKey Server available.

The LabKey `core` module is dependent on this package. It "deploys" the assets from `@labkey/themes`
by copying them to the module's resources directory. This means that anything included in this package's
public distribution will be available to any LKS page.

To iterate on the themes in your development environment you will need to copy this package's built
distribution to the node_modules path in the `core` module. This copying operation can be scripted to
fit your environment. A general `Makefile` would look like:

```Makefile
# Path to where this package's distribution is located in your file system
source = <YOUR_PATH>/labkey-ui-components/packages/themes/dist/

# Path to where your LabKey Server's core module copies @labkey/themes assets
core = <LABKEY_SERVER_ROOT>/server/modules/platform/core/node_modules/@labkey/themes/dist

.DEFAULT_GOAL := bc

.PHONY: build
build:
	npm run build

.PHONY: copy
copy:
	rsync -rav ${source} ${core}

.PHONY: bc
bc: build copy
```

## Release Notes
Release notes for this package are available [here](./releaseNotes/themes.md).
