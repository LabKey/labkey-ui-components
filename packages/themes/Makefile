# Path to where this package's distribution is located in your file system
source = /Users/nickkerr/code/labkey/labkey-ui-components/packages/themes/dist/

# Path to where your LabKey Server's core module copies @labkey/themes assets
core = /Users/nickkerr/code/labkey/develop/server/modules/platform/core/node_modules/@labkey/themes/dist

.DEFAULT_GOAL := bc

.PHONY: build
build:
	yarn run build

.PHONY: copy
copy:
	rsync -rav ${source} ${core}

.PHONY: bc
bc: build copy
