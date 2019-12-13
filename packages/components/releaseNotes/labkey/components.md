# @labkey/components

Components, models, actions, and utility functions for LabKey applications and pages.

### version TBD
*Released*: TBD
* UserMenu support for Sign In and Sign Out menu items
* Add InsufficientPermissionsAlert component

### version 0.4.0
*Released*: 12 December 2019
* Remove @labkey/dependencies and move all dependencies to components/package.json
* Remove our local version of react-bootsrap.d.ts

### version 0.3.1
*Released*: 12 December 2019
* Search job attachments

### version 0.3.0
*Released*: 6 December 2019
* Item 6508: Permissions management components, models, and actions
* port ExpandableContainer component from biologics RelatedData component

### version 0.2.0
*Released*: 5 December 2019
* Upgrade TypeScript to 3.7.3
* Upgrade Storybook to 5.2.8
* Add "@types/react-test-renderer" to devDependencies

### version 0.1.3
*Released*: 4 December 2019
* render workflow jobs in search results

### version 0.1.2
*Released*: 2 December 2019
* Optimized imports
* Changed react imports from `import * as React` to `import React`
* Re-add `lib` section to tsconfig.base.json

### version 0.1.1
*Released*: 2 December 2019
* Misc fixes and cleanup post package consolidation
    * add missing "Map" imports from immutable
    * fix a few usages of this.state() that weren't using callback version
    * remove source-map setting from webpack.config.js
    * remove unneeded package.json dependencies and devDependencies
    * replace hardcoded documentation links with LABKEY.helpLinkPrefix

### version 0.1.0
*Released*: 27 November 2019
* Consolidate all `@glass` packages into this single `@labkey/components` package. The release notes for the previous
packages ([@glass/base](../glass/base.md),
[@glass/domainproperties](../glass/domainproperties.md),  [@glass/navigation](../glass/navigation.md), [@glass/omnibox](../glass/omnibox.md), [@glass/querygrid](../glass/querygrid.md), and [@glass/report-list](../glass/report-list.md))
can be found in the [glass](../glass) directory.
* Convert build/bundle from rollupjs to webpack, output UMD format for module/app usages.
* Move files from shared-config repository into this repository.

