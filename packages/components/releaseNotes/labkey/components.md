# @labkey/components

Components, models, actions, and utility functions for LabKey applications and pages.

### version ???
*Released*: ???

* Factor out FileAttachmentEntry from FileAttachmentContainer
* Rename FileListing to FileListingForm and factor out the file listing component from that into a separate FileListing component
* Allow FileListingForm to optionally include a read-only set of files (available for download only)

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
  
