# @labkey/components
Components, models, actions, and utility functions for LabKey applications and pages.

## version 0.56.0
*Released*: 1 May 2020
* Item 7180: Lineage: improved node details, withLineage
    - `LineageGraph` supports additional details from `experiment-lineage.api`.
    - `withLineage` HOC for managing lineage state.
    - See https://github.com/LabKey/labkey-ui-components/pull/237 for more details.

## version 0.55.0
*Released*: 30 April 2020
* Issue 39633: Choosing to cancel navigating away from a page when using react-router's setRouteLeaveHook will leave
you on the page but the URL will have been updated to the page where you had originally intended to go, which means
using that link again from the starting page will not work.
* Issue 38002: Set isSubmitting to false after updateRows in EditableGridPanelForUpdate in case you stay on the page after updating
* Update resolveErrorMessage to strip off java.lang.IllegalArgumentException prefixes and detect "Bad SQL grammar" exceptions.
* Partial fix for Issue 40008: Add optional property to LineageSummary to allow customization of the lineage group headings in the summary panel
* in SingleParentEntityPanel, use paged query model for better performance

### version 0.54.1
*Released*: 29 April 2020
* Issue 38052: When all fields in a QueryInfoForm are disabled, the submit button should also be disabled

### version 0.54.0
*Released*: 29 April 2020
* Item 7138: DatasetDesignerPanels and related components, models, actions
    - new dataset related components DatasetDesignerPanels.tsx and DatasetPropertiesPanel.tsx
    - DomainForm changes to support Column mapping option
* Issue 40285: Domain designer screen width expands as the file preview grid table width gets very large

### version 0.53.0
*Released*: 28 April 2020
* [Issue 34627: Lookup column is sorting by raw value and not display column](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=34627)
    * This fix changes the behavior of the sort action on the OmniBox, columns are now sorted by displayValue
* [Issue 36486: omnibox only shows options on drop-down for current page](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=36486)
    * This fix changes the behavior of the Filter dropdown on the Omnibox, we now show distinct values for a column.
* [Issue 40195: Omnibox filter value invalid if user enters multiple words](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=40195)
* [Issue 39543: Omnibox dropdown does not allow other open menus to close](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=39543)

### version 0.52.2
*Released*: 24 April 2020
* Misc 20.5 issue fixes for Sample Manager
    - Issue 40139: DetailEditing panel editing - updating time but not date does not recognize change
    - Issue 39328: Assay run should use renamed file name as its Assay Id when the same data file is being imported (for both re-import case and new import case)
    - Issue 40233: EntityInsertPanel columns for Sources should not include "Parents" in column name caption
    - DetailEditing panel (i.e. QueryForm usage) boolean field checked state doesn't initialize correctly when formattedValue exists

### version 0.52.1
*Released*: 20 April 2020
* `@labkey/api` dependency update.

## version 0.52.0
*Released*: 18 April 2020
* Item 7178: Prettier/ESLint bulk update
    - Initial Prettier/ESLint bulk update across packages/components/src directory.
    - yarn run lint-fix ./src/\*\*/\*

## version 0.51.0
*Released*: 17 April 2020
* Item 6961: DataClassDesigner updates for LKS
    - update fetchDataClass function to work for either a data class name or rowId
    - add support for PermissionTypes.DesignDataClass
    - DataClassPropertiesPanel and SampleTypePropertiesPanel default nameExpressionInfoUrl and nameExpressionPlaceholder properties
    - SampleTypeDesigner change to default to "Infer from File" in empty fields state
    - Issue 40232: Boolean fields show empty "Validation Options" section in expanded field design view

## version 0.50.0
*Released#: 16 April 2020
* Add optional property for specifying auditBehavior with some API actions

### version 0.49.1
*Released*: 16 April 2020
* Merge forward changes from release20.4-SNAPSHOT branch
    - includes hotfix changes from version 0.41.6

## version 0.49.0
*Released*: 15 April 2020
* `@labkey/api` dependency update.
* Incorporate changes needed due to stricter typings.

## version 0.48.3
*Released*: 14 April 2020
* Bug fixes for ParentEntityEditPanel to better support editing of parent samples
* Issue 40148: Don't reinitialize EntityInsertPanel if location or entityModelType are not changing

### version 0.48.2
*Released*: 13 April 2020
* Item 7124: Add helpTopic property with default value to DataClassDesigner

### version 0.48.1
*Released*: 12 April 2020
* Issue 40106: Correcting booleans for properties' states in Advanced Settings dialog of Domain designer

### version 0.48.0
*Released*: 8 April 2020
* Export DateInput, FileInput, TextInput and TextAreaInput
* Export QueryFormInputs and associated helper functions
* Export detail renderer helper functions
* Export FieldEditInput form and props

### version 0.47.0
*Released*: 7 April 2020
* `@labkey/api` dependency update.

### version 0.46.0
*Released*: 7 April 2020
* Add QueryModel model to replace QueryGridModel
    - Also added IQueryModel interface
* Add QueryModelLoader interface and DefaultQueryModelLoader
* Add withQueryModels HOC for managing model state
* Add GridPanel to replace QueryGridPanel
    - GridPanel takes a QueryModel as a prop
    - Also provided GridPanelWithModel which takes a QueryConfig and manages a model like QueryGridPanel does
* Move QueryInfo to its own file
* Remove Column class, replaced with GridColumn
    - GridColumn originally just extended Column but added no functionality
    - Has no affect on exports since we only ever exported GridColumn
* Added a delay to mocks when running in Storybook
* Emulate LabKey Server error messages for invalid schema/query names in getQueryDetails

### version 0.45.0
*Released*: 6 April 2020
* Item 6642: Initial dataset designer properties panel
    - Top level dataset properties without the domain

### version 0.44.0
*Released*: 3 April 2020
* Item 6937: Lineage components updates
    - See https://github.com/LabKey/labkey-ui-components/pull/205

### version 0.43.0
*Released*: 3 April 2020
* Modify SearchPages for display of data classes and to allow more customization of how search result cards are displayed

## version 0.42.1
*Released*: 31 March 2020
* Item 7031: Source aliasing
    - Allow Source (Data Class) Alias to be defined separate from a SampleSet type Parent Alias
    - Allow filtering of parent options (for example, only 'sources' type data classes will be included)

### version 0.41.6
*Released*: 8 April 2020
* Issue 39803: signOut action support for a redirectUrl in the response, for the CAS identity provider logout case

### version 0.41.5
*Released*: 1 April 2020
* SiteUsersGridPanel and UserDetails panel prop to hide/show 'Reset Password' button (i.e. allowResetPassword)
* NavigationBar optional property for an alternate url to go to after sign out

### version 0.41.3
*Released*: 30 March 2020
* Issue 40084: Add property to exclude unique field key from bulk update modal
* Update QueryInfoForm so the submit button is disabled while submitting
* Issue 40088: DataClassDesigner - add optional validation check for a reserved name field (i.e. "SourceId" in SM app)

### version 0.41.2
*Released*: 30 March 2020
* Update canSubmit check for ParentEntityEditPanel to check for actual differences and allow submission when all parents have been removed

### version 0.41.1
*Released*: 29 March 2020
* Item 6862: Switch LineageNode to bind "id" instead of "rowId"

## version 0.41.0
*Released*: 27 March 2020
* Item 7002: Refactor domain designer components to share more with base components
    - BasePropertiesPanel, SectionHeading, withDomainPropertiesPanelCollapse (instead of DomainPropertiesPanelContext)
    - BaseDomainDesigner component and withBaseDomainDesigner HOC
    - DomainFieldLabel component for domain designer field input consistency
    - Domain designers updates for consistent handling of isValid state and error display
    - Issue 39938: Domain field fix to revert back to max Integer length if user input is larger then 4000

## version 0.40.0
*Released*: 27 March 2020
* Remove SampleSetResolver for app URLs
    - URL mappers updated use /samples/<sampleSetName> or /rd/samples/<rowId>

## version 0.39.4
*Released*: 24 March 2020
* Issue 39968: Cannot update assay result field to "All Samples"

### version 0.39.3
*Released*: 24 March 2020
* Issue 39911: EditableGrid issue with pasting values into a cell that has a lookup that is not public

### version 0.39.2
*Released*: 23 March 2020
* Dependency version updates

### version 0.39.1
*Released*: 23 March 2020
* Run Builder related fixes
    - Bug fix in file tree to make loading and empty placeholders not selectable when cascading a selection.
    - File tree style update for checkboxes.
    - Opt out of export button on QueryGridBar.

### version 0.39.0
*Released*: 20 March 2020
* Item 6835: Data Class designer updates for use in Sample Manager
    - add fetchDataClass function for call to Domain.getDomainDetails and resolve as DataClassModel
    - use saveDomain function in DataClassDesigner for create and update
    - add Category select input for DataClassPropertiesPanel (for appPropertiesOnly)
    - refactor SampleSetDeleteConfirmModal as EntityTypeDeleteConfirm model for use with sample type and source type
    - refactor deleteSampleSet as deleteEntityType for use with sample type and source type
    - add BeforeUnload.tsx HOC

### version 0.38.1
*Released*: 20 March 2020
* Issue 39913: Switch from dismissCoreWarnings.api to dismissWarnings.api

## version 0.38.0
*Released*: 19 March 2020
* Add ParentEntityEditPanel for CRUD operations on parents. Initially not supporting delete
(because there is no back end support for completely removing lineage).
* Fix problem with QuerySelect and SelectInput not playing nicely together when you want to
select a schema for the QuerySelect to use.
* Refine and simplify styling for buttons on DetailEditing to work with sibling panels that sit below it
* When invalidating the grid, don't call clearSelected if model does not allow selections
* Issue 39307: Call onChange and loadOptions after model has been updated so changed selection is taken into account.
* Issue 39863: Use POST instead of GET when getting delete confirmation data

### version 0.37.0
*Released*: 19 March 2020
* Item 6848: Merge Sample Type creation/update UI into single designer component.

### version 0.36.0
*Released*: 19 March 2020
* 39867: ErrorBoundary HoC, ErrorPage to display uncaught React exceptions

### version 0.35.3
*Released*: 18 March 2020
* add highlightLastSelectedRow to QueryGridPanel

### version 0.35.2
*Released*: 17 March 2020
* QueriesListing fix for display error message when schema does not exist

### version 0.35.1
*Released*: 16 March 2020
* Enhance createQueryGridModelFilteredBySample
    - Allow using lsid instead of rowid for createQueryGridModelFilteredBySample
    - Allow omit sample columns in generated model
    - Get all sample columns instead of one sample column per domain type

### version 0.35.0
*Released*: 16 March 2020
* Item 6803: Added support for Query Metadata Editor and added DomainFormProp - domainFormDisplayOptions to show/hide DomainForm components

### version 0.34.1
*Released*: 16 March 2020
* Merge forward changes from release20.3-SNAPSHOT branch
    - includes hotfix changes from version 0.31.4

### version 0.34.0
*Released*: 11 March 2020
* Use Query.ContainerFilter enum as provided by @labkey/api

### version 0.33.3
*Released*: 10 March 2020
* Issue 39817: Don't show RegEx validator options for non-string fields

### version 0.33.2
*Released*: 10 March 2020
* Issue 39818: List designer PK fields should be shown as Required upon load

### version 0.33.1
*Released*: 10 March 2020
* Issue 39819: List designer
    - Changed spacing between
    - Phrasing update, "Create Range Validator" => "Create Range Expression Validator"
    - Updated caret and checkbox expand + collapse behavior for Advanced Settings' Search Indexing Options
    - Phrasing update, "Field used for display title" => "Default display field"
    - Phrasing update, "Discussion links" => "Discussion Threads"
    - Change color for string field options' "Unlimited" and "No longer than X characters" options so that they don't look disabled.
    - Use title-case for Advanced List Settings' titles instead of sentence-case
* Issue 39877: List designer: max text length options should not be visible for text key field of list

### version 0.33.0
*Released*: 5 March 2020
* Issue 38221: Sample Manager: encoding issues at various places
* Issue 38907: ui-components applications cannot handle assay names with periods
* Issue 39461: Editing a date field in a sample does not show a date picker

### version 0.32.0
*Released*: 3 March 2020
* Fix issue 39085
    - factored out "fetchSamples" from "loadSelectedSamples" to allow for fetching and and transformation independent of getting selection

### version 0.31.4
*Released*: 6 March 2020
* Fixes for List Designer issues targeting LabKey release 20.3
    - Issue 39846: List designer - "Name" doesn't validate immediately
    - Issue 39879: Domain designer - lookup queries which only have container PK are filtered out of the select input

### version 0.31.3
*Released*: 28 February 2020
* Fix for Sample Manager QueryGridModel use case that passes in undefined as baseFilters
    - make sure baseFilters is defined before doing a concat with the rest of the filters

### version 0.31.2
*Released* 28 February 2020
* Fix issue 38668
    * We now pass the display column value of lookups to QuerySelect in QueryFormInputs

### version 0.31.1
*Released*: 27 February 2020
* Issue 39813: Metadata settings in new Designer don't align with old Designer
    - Resolved bug in List Designer's indexing settings.

### version 0.31.0
*Released*: 27 February 2020
* Item 6798: ListDesignerPanels and related components, models, actions
    - new list related components ListDesignerPanels.tsx and ListPropertiesPanel.tsx
    - DomainForm changes to support an "Import Data" option when using a file to infer fields for the domain (see ImportDataFilePreview.tsx)
    - DomainRow changs to support locking the "primary key" field data type and required inputs
    - move assay related actions to domainproperties/assay/actions.ts file

### version 0.30.0
*Released*: 27 February 2020
* Bump @labkey/api to 0.0.35

### version 0.29.0
*Released*: 26 February 2020
* Issue 37776: updateUrl in custom assay does not get used in Biologics UI
* Added two new attributes to QueryGridModel
    * includeDetailsColumn
    * includeUpdateColumn
    * simplify getStateQueryGridModel
    * remove IStateModelProps interface used by getStateQueryGridModel

### version 0.28.3
*Released*: 26 February 2020
* Bump @labkey/api dependency to 0.0.34

### version 0.28.2
*Released*: 25 February 2020
* Issue 39788: Responses that have exceptions but not errors not showing messages in the UI

### version 0.28.1
*Released*: 25 February 2020
* Use dataclass category field for choosing the icon to display for search results
* Remove iconURL workaround and rely on server side QueryIconURLProvider instead

### version 0.28.0
*Released*: 24 February 2020
* Add support to the assay designer for integrating plate metadata.

### version 0.27.0
*Released*: 24 February 2020
* Re-parameterize and rename SampleInsertPanel to EntityInsertPanel for use with Data classes as well
* Add disabled and title optional properties for AddEntityButton
* Issue 39765: for viewing replaced assay runs, we need to use the baseFilter on the "Replaced" column

### version 0.26.0
*Released*: 21 February 2020
* Add lint configurations
* Add File tree component and webdav helpers that can be used to view and select files on the server

### version 0.25.2
*Released*: 19 February 2020
* Add addToDisplayView to QueryColumn to allow defining additional display columns

### version 0.25.1
*Released*: 19 February 2020
* Fix Issue 39719
    * No longer apply any base filters if a QueryGridModel has a keyValue and the view name is \~\~DETAILS\~\~

### version 0.25.0
*Released*: 18 February 2020
* Item 6835: Changes to support Data Class Designer in Sample Manager and LKS
    - Factor out EntityDetailsForm.tsx from SampleSetDetailsPanel.tsx
    - Factor out DomainPropertiesPanelContext.tsx and CollapsiblePanelHeader.tsx for reuse and put back into AssayPropertiesPanel.tsx and DomainForm.tsx
    - DataClassDesigner.tsx and DataClassPropertiesPanel.tsx
    - Move AssayProtocolModel to domainproperties/assay/models.ts

### version 0.24.0
*Released*: 13 February 2020
* Issue 39529: Make reset view in lineage graph operational
* Use URLResolver for resolving links returned from lineage query
* Rename and re-parameterize SampleDeleteConfirmModal to EntityDeleteConfirmModal (and move to entities instead of samples) for reuse with data class objects
* Issue 39252: Show initial seed node details on lineage panel while lineage is loading.

### version 0.23.3
*Released*: 11 February 2020
* Issue 39524: User management: Creating new user grid filter from notification is incorrect if user already exists and is disabled
* Issue 39501: Permissions management: Handle case where the security policy for a container is inheriting from the parent container
* Issue 39616: Update domain field warning message regarding special characters

### version 0.23.2
*Released*: 8 February 2020
* Use DatePickerInput for DetailEdit
* Add advancedExportOption to QueryGridPanel

### version 0.23.1
*Released*: 6 February 2020
* Issue 39341: Fix for specimen designer usage of data types that aren't supported for new domain field creation

### version 0.23.0
*Released*: 3 February 2020
* Issue 39193: Fix for conditional format dialog to respect filter types allowed for date field type
* Issue 21401: Fix for conditional formatting filter string URL encoding issue
* Issue 39528: Change Assay designer results text should for option to define fields manually
* Move “remove field” to field top display (so it will show in collapsed and expanded view)
* Only show "Confirm Remove Field" dialog for previously saved fields
* Field row icons, drag handle and expand icon, only highlight on hover of icon instead of row hover
* Fix for Domain Designer duplicate field input ids for assay designer case (results in warnings in browser for LKS pages)
* Issue 39603: Domain warning message with a field name containing invalid characters goes out of the "normal" range

### version 0.22.1
*Released*: 3 February 2020
* Issue 38012: For the Batch Update Dialog a field should be cleared if it is changed to disabled

### version 0.22.0
*Released*: 30 January 2020
* Issue 39558: Adjust styling of import tabs to better indicate they are actionable.
* Issue 39551: Use tooltip on sampleId column to provide text about the use of generated ids or not
* Issue 39559: Reorder add row controls for better left-to-right flow and remove tool tip
* Better error messaging when only 1 additional row is allowed for bulk insert
* Issue 39554: Parameterized name expression placeholder text

### version 0.21.2
*Released*: 29 January 2020
* Add backspaceRemoves and deleteRemoves props to SelectInput

### version 0.21.1
*Released*: 29 January 2020
* Added support for smaller version of FileAttachmentForm

### version 0.21.0
*Released*: 24 January 2020
* Item 6654: Changes to include server side warnings while saving domain

### version 0.20.0
*Released*: 23 January 2020
* Add utility method resolveErrorMessage that can be used to extract a string error message from API responses and convert some
messages that are not very friendly for users into better text.

### version 0.19.0
*Released*: 22 January 2020
* Assay import editable grid button changes to match sample create (for bulk insert, update, remove, add)
* Issue 39182: Disabled "Assay Data" create menu item tool-top doesn't go away
* Fix for Domain designer field focus jumps after moving a field row

### version 0.18.2
*Released*: 22 January 2020
* Make EditableGrid.validateData case insensitive and trim key values prior to comparison

### version 0.18.1
*Released*: 22 January 2020
* Hide the ViewAction on the omnibox when there are no non-default views
* Hide the ViewAction on the omnibox when QueryModel.showViewSelector is false

### version 0.18.0
*Released*: 22 January 2020
* Add optional callback for SampleInsertPanel when data changes to help in detecting dirty state.
* Add optional callback for AssayImportPanels when data changes to help in detecting dirty state.

### version 0.17.0
*Released*: 21 January 2020
* EditableGrid cell render optimization
    - prevent unnecessary re-render of all cells when one is edited/selected/etc.
    - move reactn global state connection to EditableGrid and make Cell components PureComponents
    - update to reactn version 2.2.4

### version 0.16.2
*Released*: 21 January 2020
* Item 6759: Use Query.getServerDate() for CreatedModified.tsx component (fixes timezone issue)
    * Includes update of @labkey/api to version 0.0.31

### version 0.16.1
*Released*: 21 January 2020
* Misc button text updates for Sample Manager (prefer 'Save' and 'Import' over 'Finish')

### version 0.16.0
*Released*: 20 January 2020
* Add property to QueryGridModel to pass through parameters for parameterized queries

### version 0.15.0
*Released*: 17 January 2020
* Move add, bulk, edit, and delete controls to be together for SampleInsertPanel
* Add DatePickerInput
* Update QueryInfoForms to use date picker for date fields
* Add BulkAddUpdateForm
* Add support for bulk update selected grid rows for SampleInsertPanel and AssayImportPanels
* Update SampleInsertPanel to support tabbed grid and file based insert

### version 0.14.0
*Released*: 17 January 2020
* QueryGrid paging improvements / fixes
    * Issue 38823: Allow users to select the number of rows they want to display in a grid on a single page
    * Issue 38824: Allow users to go to the first and last page in a grid and see current page number and total page count
    * Issue 39367: Disabled button tool tip on grid doesn't hide for disabled button
    * Issue 39405: Paging too far can result in no data
    * Issue 39420: Setting url pageSize to negative number results in all data being shown

### version 0.13.0
*Released*: 14 January 2020
* Item 6571: User Details panel updates to allow single user delete / deactivate / reactivate / reset password
    - add resetPassword() action and UserResetPasswordConfirmModal
    - also include optional message input for CreateUsersModal
    - Issue 39374: Better handling of selection state for SiteUsersGridPanel on page reload and navigation

### version 0.12.0
*Released*: 13 January 2020
* Update FileAttachmentForm and relatives
  - Add sizeLimits property for checking against maximum size
  - Change styling of error block to Alert instead of simple div
  - If multiple files are allowed, attach the files that pass validation even if some do not
* Update Controls and EditableGrid to add optional property for total number of rows allowed
and add a tooltip for the AddControls with info on the data size limits.
* Update placeholder text for cut-and-paste area for assay data
* Add optional parameters for AssayImportPanels and RunDataPanel and SampleInsertPanel
* Add clear button on cut-and-paste tab for assay import
* Issue 38567: use POST instead of GET to help deal with long filters (particularly IN filters) when dealing with selections
* Issue 39381: fix column layout for select inputs in QueryInfoForm

### version 0.11.0
*Released*: 13 January 2020
* Item 6633: Omit some property types from the field designer for SM
  * Changed basePropertiesOnly option to appPropertiesOnly
  * Expanded application of appPropertiesOnly to additional controls
  * DomainForm hide field types and DomainRow options based on appPropertiesOnly

### version 0.10.0
*Released*: 9 January 2020
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

### version 0.9.0
*Released*: 8 January 2020
* Add selectionKey getter to QueryGridModel
* Add `showSampleComparisonReports`, `onReportClicked`, and `onCreateReportClicked` props to QueryGridPanel.
* Add isSampleLookup to QueryColumn

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

