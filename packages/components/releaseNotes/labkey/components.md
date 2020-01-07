# @labkey/components
Components, models, actions, and utility functions for LabKey applications and pages.

### version TBD
*Released*: TBD
* Item 6506: User management components and related model / action updates
    - QueryGridModel support for containerPath (in getQueryDetails, selection state, getQuery, getReportInfos)
    - QueryGridModel support for containerFilter in getQuery call
    - QueryGridPanel support for onSelectionChange callback function prop
    - SecurityPolicy.addUserIdAssignment helper function
    - SiteUsersGridPanel with row selection to show UserDetailsPanel and manage buttons to allow selected user deactivate/reactive/delete
    - CreateUsersModal for creating new site users from SiteUsersGridPanel button
    - Add invalidateUsers to index.ts for use in Sample Manager app
    - Update to @labkey/api release version 0.0.29
    - Issue 39359: fix to prevent API call to study-reports-getReportInfos if we know study module isn't available

### version 0.8.3
*Released*: 3 January 2020
* Fixed bug that occurred with multiple FileAttachmentForms on one page

### version 0.8.2
*Released*: 2 January 2020
* added samplemanager-downloadAttachments.api to URLResolver

### version 0.8.1
*Released*: 2 January 2020
* Update styling for some navbar components

### version 0.8.0
*Released*: 30 December 2019
* Add helper methods and constants for documentation links

### version 0.7.0
*Released*: 27 December 2019
* Factor out FileAttachmentEntry from FileAttachmentContainer
* Rename FileListing to FileListingForm and factor out the file listing component from that into a separate FileListing component
* Allow FileListingForm to optionally include a read-only set of files (available for download only)
* Change check for reinitializing FileAttachmentContainer to look only for a change in the initial file set
* Update HeatMap to allow for choosing a displayName field and provide the full row for getCellUrl
* export replaceParameter and replaceParameters methods from URL
* add optional parameter to QueryGridPanel so some tabs can be pull right
* Add description property to QuerySelect to pass it through to SelectInput
* Increase label field size on SelectInput

### version 0.6.4
*Released*: 26 December 2019
* Item 6392: ConfirmModal fix to not show close icon in upper right if onCancel prop is undefined
* Item 6392: Misc fixes for error messaging on user logged out / session timeout

### version 0.6.3
*Released*: 23 December 2019
* Misc domain designer fixes for Sample Manager
  - Issue 39256: Fix margin between panel and buttons on sample type field designer
  - Issue 39225: Fix so profile form trims display name before submit
  - Issue 39093: Help link in core domain designer points to future Sample Manager docs
  - Issue 39079: Fix assay design properties, error messages, and buttons for page layout size changes
  - Issue 38853: Change floating subnav to use display:none instead of visibility: hidden

### version 0.6.2
*Released*: 20 December 2019
* Item 6261: Update Sample Set --> Sample Type where applicable for Sample ui components
* Fix Issue 38700: Parent alias field in sample type design is in error state too early

### version 0.6.1
*Released*: 20 December 2019
* QueryGrid fix to remove extra call to reloadQueryGridModel when it is being unmounted

### version 0.6.0
*Released*: 18 December 2019
* Item 5511: UserMenu support for Sign In and Sign Out menu items
* Item 5511: Add InsufficientPermissionsAlert component

### version 0.5.0
*Released*: 16 December 2019
* add handleUpdateRows to FieldEditTrigger
* add initialFiles to FileAttachmentForm
* add SplitButtonGroup
* add samplemanagerJob search result mapping in URLResolver

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

