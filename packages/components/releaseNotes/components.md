# @labkey/components
Components, models, actions, and utility functions for LabKey applications and pages.

### version TBD
*Released*: TBD November 2023
* Assay Transform Script UX update
  * AttachmentCard updates to support description and use getIconFontCls for default iconFontCls based on name

### version 2.393.2
*Released*: 15 November 2023
* Merge release23.11-SNAPSHOT to develop:
    * includes changes from 2.390.3 and 2.390.4

### version 2.393.1
*Released*: 10 November 2023
* Improve cross-project actions: Import job notifications
  * Use the Query.ContainerFilter.allInProject container filter in getUserNotifications API call and PipelineJobsPage queryConfig

### version 2.393.0
*Released*: 10 November 2023
- Replace all usages of `RootMaterialLSID` with `RootMaterialRowId`

### version 2.392.2
*Released*: 8 November 2023
* Issue 48999: Unable to "Select them in the grid" when created trigger script runs after samples are added
   * Add reselectRowCounts to InsertRowsResponse

### version 2.392.1
*Released*: 8 November 2023
* Merge release23.11-SNAPSHOT to develop:
    * includes changes from 2.390.1 and 2.390.2

### version 2.392.0
*Released*: 7 November 2023
* Remove utils/global.ts, which removes initBrowserHistoryState and getBrowserHistory
* URL.ts:
  * Add `router` and `location` arg to util methods and update usages
    * Remove getLocation, update usages to use react-router instead
* UsersGridPanel: use withRouter instead of directly listening to URL changes via history

### version 2.391.2
*Released*: 4 November 2023
* Issue 48751: LKSM/LKB: Respect sort order of sources or samples for lineage sample creation
  * Add saveOrderedSnapshotSelection util

### version 2.391.1
*Released*: 2 November 2023
* Issue 48804: Scroll error message at bottom of domain designer into view
* fix `FormButtons` handling of single child case

### version 2.391.0
*Released*: 1 November 2023
* Issue 48828: Don't show sample insights panel while editing in the grid
  -  add `onEditToggle` optional prop for `SampleTabbedGridPanel`

### version 2.390.4
*Released*: 10 November 2023
* Fix for reportId url param check in locationHasQueryParamSettings

### version 2.390.3
*Released*: 9 November 2023
* Issue 49074: We support move operations for assays as well as delete, but don't need to check references for move
* Issue 49077: Remove tool tip indicating assay designs cannot be renamed.

### version 2.390.2
*Released*: 6 November 2023
* Issue 49019: Grid session filters/sorts/etc. are not applied as expected when model loads queryInfo from API instead of cache
  * the additional render cycle from the query details API call causes the withQueryModels componentDidUpdate to detect a URL param change and then remove the filters/sorts/etc. that were just applied from the session state

### version 2.390.1
*Released*: 3 November 2023
- Issue 48836: Update `URLResolver.resolveLineageItem` to resolve the name of the data type from the query name

### version 2.390.0
*Released*: 31 October 2023
* Issue 41677: Include single field uniqueness constraint option in field editor
  * Add domain kind property for allowUniqueConstraintProperties
  * Add new checkbox option to the field Advanced Settings dialog
  * DomainField update to serialize and de-serialize the "uniqueConstraint" prop based on the DomainDesign "indices"

### version 2.389.0
*Released*: 31 October 2023
- getUsersWithPermissions: Add optional includeInactive flag

### version 2.388.2
*Released*: 31 October 2023
- Issue 48961: Make sure Name (id) fields are shown, but read-only, in editable grids for update

### version 2.388.1
*Released*: 30 October 2023
* ToggleButton updates
  * ImportDataFilePreview update to remove usage and replace with a checkbox
  * QueryInfoForm fix for ToggleIcon alignment with various form input types

### version 2.388.0
*Released*: 27 October 2023
- Remove dependency on `react-redux`
- Remove configuration of `Provider` and `Router` from `AppContexts`

### version 2.387.0
*Released*: 27 October 2023
- Issue 48969: add loadAllQueryInfos method to withQueryModels actions
- Update ExportModal to show all system views (prefixed by ~~) as 'Default'
- Update ExportModal to pre-select models with counts > 0 when using `tabRowCounts`

### version 2.386.0
*Released*: 26 October 2023
- Add ability to create, edit, and delete sample, source, and assay domains from subfolders
- export new `isSharedDefinition` method in `App` object
- Issue 48921: Use sort order from model for printing labels

### version 2.385.0
*Released*: 25 October 2023
- EditableGrid: Add more specific classNames to button bar buttons
- EditableDetailPanel: Use FormButtons
- DetailPanel/EditableDetailPanel: Remove actions prop
- DetailPanelHeader: convert to FC, simplify props, render panel-heading div

### version 2.384.0
*Released*: 25 October 2023
* remove react-bootstrap-toggle dependency from @labkey/components
* remove ToggleWithInputFields.tsx and replace usages with ToggleButtons or ToggleIcon components
* remove unused CustomToggle.tsx component

### version 2.383.2
*Released*: 23 October 2023
* AssayImportPanels.tsx fix for grid cell updates to use applyEditableGridChangesToModels()

### version 2.383.1
*Released*: 20 October 2023
- Assay Design Rename
  - enable rename on assaydesign update mode for gpat assays
  - Use new assayauditevent for assay audits

### version 2.383.0
*Released*: 19 October 2023
* Issue 48347: Update field editor "User" data type to allow lookup validator option

### version 2.382.2
*Released*: 18 October 2023
- Issue 48901: R Reports not filtering runs in assay

### version 2.382.1
*Released*: 18 October 2023
- Issue 48855: Update @labkey/api for better parsing of Content-Disposition header

### version 2.382.0
Released*: 18 October 2023
- Introduce `AssayAPIWrapper` to better support calls to assay endpoints from within components.
- Rename `fetchAllAssays` and `fetchProtocol` to `getAssayDefinitions and `getProtocol` respectively.
- Update `getAssayDefinitions` (formerly `fetchAllAssays`) to utilize the newly exposed `Assay.getAssays` endpoint wrapper.
- Update `withAssayModels` component to use `api.assay` in place of the `AssayLoader` pattern.
- Add `SchemaQuery.hasSchemaQuery` for more succinct comparison of `SchemaQuery` objects where it only matters if the `schemaName` and `queryName` match.
- Recognize the `plateLsid` URL parameter in `AssayImportPanels` to support selection of a plate.

### version 2.381.3
*Released*: 18 October 2023
- Issue 48854: Trim leading spaces for field values in domain forms

### version 2.381.2
*Released*: 18 October 2023
* Merge release23.10-SNAPSHOT to develop:
    * includes changes from 2.373.5

### version 2.381.1
*Released*: 16 October 2023
- Issue 48312: Update messaging for race condition when adding to storage

### version 2.381.0
*Released*: 16 October 2023
- Add helper for App.freezerManagerIsCurrentApp()
- Add containerFilter to EditableColumnMetadata
- Refactor from getOrderedSelectedMappedKeys to getOrderedSelectedMappedKeysFromQueryModel

### version 2.380.1
*Released*: 13 October 2023
- Add UI for making non-default views sharable

### version 2.379.0
*Released*: 11 October 2023
- Issue 48082: Improve verbs used when updating or merging data
- Don't pre-select False for an undefined Boolean filter field

### version 2.378.0
*Released*: 10 October 2023
- Add ModalButtons
    - Update all Modals using WizardNavButtons to use ModalButtons
- Use FormButtons
    - WizardNavButtons
    - CreateProjectPage
    - GroupAssignments
    - QueryInfoForm
    - PermissionAssignments
    - AssayImportPanels
- Simplify props for WizardNavButtons
    - Many props weren't used, or weren't needed
- Fix scrollbar issues on Projects and Permissions Pages
- Fix scrollbar issues with menu-section

### version 2.377.0
*Released*: 10 October 2023
- Issue 48814: Counts in tabs don't always have commas
- Issue 48818: Update BarTender Label configuration to not use toggle selector

### version 2.376.0
*Released*: 9 October 2023
* Issue 48287: Improve behavior for Picklist buttons
  * Don't check sample status before adding to picklists since there is no restriction for picklists
  * Limit the number of samples that can be added at one time

### version 2.375.3
*Released*: 6 October 2023
- Issue 48240: Assay Result field creation using JSON file results in lookup failure

### version 2.375.2
*Released*: 5 October 2023
- Choose a default filter for field types that don't offer text choices

### version 2.375.1
*Released*: 4 October 2023
* Show SourceID on SourceEvents Audit Table
  * Added DATACLASS_DATA_UPDATE_AUDIT_QUERY for Biologic audit logs

### version 2.375.0
*Released*: 4 October 2023
- Rename `LabelPrintingProviderProps` to `LabelPrintingContext`. Rename `LabelPrintingProvider` to `LabelPrintingContextProvider`.
- Add `createLabelTemplateList` to APIWrapper
- Streamline request creation and error handling in APIWrapper
- Add error handling to `LabelPrintingContextProvider`
- Update `BarTenderSettingsForm` to no longer use `withLabelPrintingContext` as this component does not rely on label context. Improve loading/error rendering.
- Remove `withLabelPrintingContext`

### version 2.374.2
*Released*: 4 October 2023
* Merge release23.10-SNAPSHOT to develop:
    * includes changes from 2.373.4

### version 2.374.1
*Released*: 2 October 2023
* Issue 48709: Choose date on month change instead of just highlighting it

### version 2.374.0
*Released*: 2 October 2023
* Add FormButtons component
* BaseDomainDesigner: use FormButtons
* Domain Designer components: remove useTheme and successBsStyle props
* Add isApp and getSubmitButtonClass util methods

### version 2.373.4
*Released*: 2 October 2023
* Issue 48781: LKSM/LKB: Groups using wrong icon

### version 2.373.5
*Released*: 12 October 2023
* Issue 48377: Account for read only cells when pasting in EditableGrid

### version 2.373.4
*Released*: 2 October 2023
* Issue 48781: LKSM/LKB: Groups using wrong icon

### version 2.373.3
*Released*: 2 October 2023
* add some keys to Fragments to get rid of warnings about missing keys

### version 2.373.2
*Released*: 29 September 2023
* AuditQueriesListingPage: load via withQueryModels

### version 2.373.1
*Released*: 29 September 2023
* Update help text for alias fields in support of defaulting to using the aliases as parents when inserting entities

### version 2.373.0
*Released*: 27 September 2023
- Projects Administration Improvements
   - Changed UserMenu to UserMenuGroup: split user items to into help, admin and user sections.
   - Admin page header and navbar updates
     - updated style, removed notification and search, removed folder menu, updated subnav
   - Added WithDirtyCheckLink and VerticalScrollPanel component to support side by side panels
   - AdminSettingsPage updates
     - Removed project level settings: name/label, data type exclusion, freezer exclusion
     - Add support for viewing/updating Home level application setting from child project
   - ProjectManagementPage updates
     - Added ProjectListing component and related utils to support project selection
     - Allow cross folder project setting view/update
     - Support project settings as well as certain application setting folder override
   - PermissionManagementPage updates
     - Removed BasePermission
     - Updated ProjectManagementPage from grid to side to side project/setting layout and support cross folder view/update
     - Support ApplicationAdminPermission update on the same panel with project level permissions.
   - Moved ProtectedDataSettingsPanel and RequestsSettingsPanel from Biologics to components
- Issue 48623: LKSM: revert to initial sampleCount or rootSampleCount when updating fails

### version 2.372.0
*Released*: 27 September 2023
- Add container filter to `PROJECT_AUDIT_QUERY` configuration and filter by `projectId` to get desired results.
- Support displaying `children` in `AuditDetails` component for displaying error/loading state.
- Display dropdown indicator on date cells in `EditableGrid`.
- Update `DatePickerInput` to expose `onCalendarClose` and use to handle selecting a date cell after the calendar has closed.
- Update `UserLink` to not attempt to fetch details for negative `userId` values (as you might find in the audit log)

### version 2.371.0
*Released*: 25 September 2023
* Render file output in R Reports
* Improve Chart Styling

### version 2.370.0
*Released*: 21 September 2023
- Package updates
- Remove `yarn.lock` and introduce `package-lock.json`
- Update scripts to refer to use `npm`
- Update documentation to refer to `npm` instead of `yarn`. Rewrite portions that describe versioning process steps.
- Update lint process to use `npm`

### version 2.369.2
*Released*: 21 September 2023
- Sample type RootMaterialLSID refactoring

### version 2.369.1
*Released*: 21 September 2023
- Remove “Plate Metadata” field in Assay Import Wizard

### version 2.369.0
*Released*: 21 September 2023
* `QueryModel`: add `useSavedSettings` flag
* `QueryModel`: serialize `maxRows` to URl when using `bindURL`
  * Serialized as `pageSize` to match the page offset param
* `withQueryModels`: honor `useSavedSettings` flag

### version 2.368.2
*Released*: 14 September 2023
- Issue 48458: remove duplicate processing of combined nodes.
- Issue 48459: sort items in `DetailsListLineageItems` by name

### version 2.368.1
*Released*: 14 September 2023
- Add missing toLocaleString() calls

### version 2.368.0
*Released*: 14 September 2023
- Issue 48610: app grid column header <th> element to trigger click on child <div>
- Issue 48283: app megamenu does not close after choosing a project icon (i.e. dashboard or settings)
- Issue 48196: if the domain column has been setup with a "url" prop, use it in the EditInlineField value display

### version 2.367.1
*Released*: 13 September 2023
* Merge release23.9-SNAPSHOT to develop:
    * includes changes from 2.364.1 and 2.364.2

### version 2.367.0
*Released*: 11 September 2023
**Customize View**
- Factor `ColumnSelectionModal` out of `CustomizeGridViewModal` to share implementation of column set selection modal with plate customization.

**EditableGrid**
- Introduce `EditableGridEvent` to allow for easier identification of change event/actions that are occuring
- Update `EditableGridChange` to specify the `EditableGridEvent`
- Add utility methods `isDataChangeEvent` and `isSelectionEvent` to `EditorModel`

**QueryInfo**
- Update `getQueryDetails` to accept either `schemaName/queryName` or `schemaQuery` and have it be enforced by the typings.
- Update `getQueryDetails` to always use `method: 'POST'` as certain arguments are supported as Arrays (e.g. `fields`).
- Update `getQueryDetails` to extend `Query.GetQueryDetailsOptions` to support the `fields` parameter. This parameter allows for explicitly requesting columns to be on the `QueryInfo` that may otherwise not be included in any of the associated views.
- Update `getQueryDetailsCacheKey` and `invalidateQueryDetailsCache` to include specified `fields` in the cache key.
- Change `invalidateQueryDetailsCache` to, by default, invalidate all cache keys associated with the specified `schemaQuery`. Previously, only explicit matches plus container insensitive matches were invalidated. An `exactKeyMatch` argument has been added for removal of only exact matches (defaults to false).

**QueryModel**
- Introduce new `requiredColumnsAsQueryInfoFields` setting that will request `requiredColumns` on the model as `fields` on the associated `queryInfo`. Defaults to false.

**Domain**
- Update `fetchDomainDetails` endpoint wrapper to extend `Domain.GetDomainDetailsOptions`
- Update `saveDomain` endpoint wrapper to take options

### version 2.366.1
*Released*: 11 September 2023
- Issue 48542: Update layout and message when discarding after changing status

### version 2.366.0
*Released*: 11 September 2023
- App listing page - move details panel to hover tooltip in header
  - misc styling updates for LabelHelpTip and DetailDisplay
  - add new DesignerDetailTooltip component

### version 2.365.3
*Released*: 8 September 2023
- Issue 48329: LKSM: Sample Finder query performance issues
  - Only query for a single column during loadTotalCount

### version 2.365.2
*Released*: 7 September 2023
- Issue 48252: LKSM/LKB: Editable Grid - Sparse multi-select doesn't work well with copy/paste
  - We now don't cut or copy sparse selections
-  Issue 48435: LKSM/LKB: Editable Grid - Many keyboard shortcuts delete cell contents
- Issue 48251: LKSM/LKB: Editable Grid - Shift-arrows don't select cells
- EditableGrid: Make modified arrow key shortcuts work with macOS

### version 2.365.1
*Released*: 4 September 2023
- Add SamplesTabbedGridPanelComponent to SampleTypeAppContext

### version 2.365.0
*Released*: 1 September 2023
- Add `saveDomain` to `DomainPropertiesAPIWrapper`
- Add `updateUserDetails` to `SecurityAPIWrapper`
- Export internal `BaseDomainDesigner`
- Update `EditableGrid` to account for optional `addControlProps`
- Removes `UserProvider` in favor of `useUserProperties` hook

### version 2.364.2
*Released*: 11 September 2023
- Issue 48608: Replace `/Z+/gi` characters with `xxx` when translating moment format to date-fns format
- Support partial reverse translation of `xxx` from date-fns to moment

### version 2.364.1
*Released*: 6 September 2023
- Issue 48596: ResponsiveMenuButtonGroup fix for empty button group
- Issue 48594: Show project look and feel form for starter edition too
- Issue 48607: Don't use spread operator for array construction to avoid javascript error

### version 2.364.0
*Released*: 31 August 2023
- Issue 47376: User Detail Modal - add className to be able to distinguish modal from others
- Issue 47197: Add 'Cancel' button on the group management and permissions pages

### version 2.363.0
*Released*: 30 August 2023
- protect against missing displayColumns
- Issue 48362: Add `toLocaleString` calls when rendering numbers to get thousands separators.

### version 2.362.4
*Released*: 30 August 2023
- Update interfaces for `AppContext` to include `containerFilter`

### version 2.362.3
*Released*: 30 August 2023
- Support sampleCounter naming pattern
    - Added "Naming Pattern Elements/Tokens" section to NameIdSettings
    - Updated getGenId/setGenId util to use new API
    - Added hasExistingSamples, getSampleCounter and saveSampleCounter util

### version 2.362.2
*Released*: 30 August 2023
- SVGChart: Inject containerFilter into query config returned from server
- RReport: use containerFilterName query arg

### version 2.362.1
*Released*: 29 August 2023
- Issue 47763: Remove unnecessary DataFileUrl column from requiredColumns in Assay Runs grid

### version 2.362.0
*Released*: 28 August 2023
- Render Charts above grid

### version 2.361.3
*Released*: 28 August 2023
- Issue 48364: Sample assay report SQL syntax error in WHERE clause for sample field with space in name

### version 2.361.2
*Released*: 24 August 2023
- Rename `parseTimeFormat` to `parseDateFNSTimeFormat`
- Return constant time formats for 12-hour and 24-hour time formats.

### version 2.361.1
*Released*: 24 August 2023
- EditableGrid change to allow for tabAdditionalBtn prop instead of cancelBtnProps

### version 2.361.0
*Released*: 23 August 2023
- withRouteLeave: Fix issue with not passing all withRouter props forward
- QueryInfoForm: Remove onCancel (it was unused)
- ProfilePage: Remove need for onBack/setReloadRequired, remove cancel button

### version 2.360.3
*Released*: 23 August 2023
- When loading all models, load selections if there is a way to do so.

### version 2.360.2
*Released*: 22 August 2023
- Added a `parseTimeFormat` method to determine the time format portion of a date format.
- Supply `timeFormat` parsed from the `dateFormat` for usages of `DatePicker`.

### version 2.360.1
*Released*: 21 August 2023
- Remove updateDomainPanelClassList
  - Manually toggle the necessary classname in the component instead of manually manipulationg the DOM
- Update tests to no longer attempt to make network requests

### version 2.360.0
*Released*: 21 August 2023
- Add isRReportEnabled helper
- Add RReport component
- Move SVG rendering to SVGChart component
- Make Chart render RReports and SVGCharts
- Refactor Chart to re-render when filter array changes
- Add APIWrapper for Chart
  - not exposed via context

### version 2.359.4
*Released*: 18 August 2023
- Migrated components are `DeleteConfirmationModal`, `EntityDeleteConfirmModal` and `EntityDeleteConfirmModalDisplay`.
- Add `getSnapshotSelections` and `setSnapshotSelections` to `QueryAPIWrapper`.
- Add `getDeleteConfirmationData` to `EntityAPIWrapper`.

### version 2.359.3
*Released*: 18 August 2023
- ISSUE 48479: DOM update (i.e. removeChild) errors when components update with Google Translate enabled
  - fix is to wrap conditional text elements in `<span>` tags
  - see https://github.com/facebook/react/issues/11538

### version 2.359.2
*Released*: 17 August 2023
- Update getEntityTypeOptions to allow skip project level data exception check
- Fix CF for querying data during project creation

### version 2.359.1
*Released*: 15 August 2023
- EditableGrid prop for tabContainerCls

### version 2.359.0
*Released*: 14 August 2023
- Remove xhr-mock
- Remove all xhr-mock utilities
- Convert various components to use APIWrappers or dependency injection for methods that fetch data
- Convert some tests to use shallow, preventing them from making network requests
- Delete unused test data
- incrementClientSideMetricCount: Don't make API call in test env

### version 2.358.2
*Released*: 8 August 2023
- Update parsing of duplicate key errors to account for single-field keys

### version 2.358.1
*Released*: 8 August 2023
- Issue 48367: Remove no-data styling from Sample Finder tabs

### version 2.358.0
*Released*: 8 August 2023
- GridPanel ButtonBar
  - Slightly change DOM layout to make size calculations easier
  - Do not render buttons until we've first loaded data
- Update ResponsiveMenuButtonGroup to calculate available space and render as many buttons as possible
  - Buttons that cannot fit will be rendered under a more menu
- QueryInfo: appEditableTable is no longer private
  - We need to be able to set this property for tests

### version 2.357.0
*Released*: 1 August 2023
- EditableGrid prop to hideTopControls
- EditableGrid null checks for tabBtnProps and cancelBtnProps

### version 2.356.2
*Released*: 31 July 2023
* Issue 48291: Sample Manager: bulk update form gives (Amount) must be a number error

### version 2.356.1
*Released*: 28 July 2023
- Issue 48333: When creating samples from sources, don't check sample status of parents (that aren't samples)

### version 2.356.0
*Released*: 27 July 2023
- Upon using a multi-value filter that is not BETWEEN, make value input a textarea

### version 2.355.1
*Released*: 27 July 2023
- Updates to allow sources to have parent sources

### version 2.355.0
Released*: 26 July 2023
- Introduce `SearchCategory.Plate`.
- Update various search interfaces to use `SearchCategory`

### version 2.354.1
Released*: 25 July 2023
* Merge release23.7-SNAPSHOT to develop:
    * includes changes from 2.349.6

### version 2.354.0
*Released*: 24 July 2023
* Add Project level date/time to App Settings page
  * Add ProjectLookAndFeelForm

### version 2.353.0
Released*: 21 July 2023
- Add to Storage From Grid - add preview to select location modal
  - ItemsLegend support for borderColor on HorizontalBarLegendData

### version 2.352.0
Released*: 20 July 2023
- Convert `EditorModel.selectionCells` to a `string[]`.
- Precompute new property `EditorModel.isSparseSelection`.
- Add `dragDelay` to reduce redundant render cycles when clicking on cells.
- Split out `BorderMask` properties on the `Cell` interface.
- Add and export interface for `EditableGridChange`.

### version 2.351.1
Released*: 20 July 2023
* Merge release23.7-SNAPSHOT to develop:
    * includes changes from 2.349.5

### version 2.351.0
*Released*: 14 July 2023
- Expose `inputId` prop from `react-select` on `SelectInput`
- Delete `parseDataTextToRunRows` as it is no longer utilized
- Rename `IAssayUploadOptions` to `AssayUploadOptions`
- Add devDependency on `blob-polyfill` to support `Blob` and `File` interactions within tests. Only exposed in RTL tests.

### version 2.350.5
*Released*: 13 July 2023
* Issue 48050 and 48209: Update parsing of duplicate key error messages for Postgres

### version 2.350.4
*Released*: 12 July 2023
* Merge release23.7-SNAPSHOT to develop:
    * includes changes from 2.349.4

### version 2.350.3
*Released*: 12 July 2023
- Issue 48209 and 48050: Add parsing of duplicate-key error message to try to extract the duplicate name
- Issue 48214: Update messaging on Save Grid View modal
- Issue 48224: Add 'noun' prop for empty state message

### version 2.350.2
*Released*: 7 July 2023
* Split out aliquot calculated columns by sample status
  * Show filter action values on grid for lookup columns that's not included in the current view

### version 2.350.1
*Released*: 6 July 2023
- Issue 47501: App specialty assay creation should not remove locked fields from Batch domain
  - add isDeletable() to DomainField

### version 2.350.0
*Released*: 4 July 2023
- Add `onKeyDown` event handling for `TAB` and `ESCAPE` for dropdown cells.
- Expose `onKeyDown` event handling prop on `SelectInput`.
- Introduce `showDropdownIndicator`, `showIndicatorSeparator` and `showDropdownMenu` render bits on `SelectInput`.
- Default dropdown cells to `showIndicatorSeparator=false` to better match editable grid styling.
- Fix round-tripping values within the "Alias" column on an editable grid via an `AliasGridInput` processing component.
- Introduce types of `CellCoordinates` and `GridColumnCellRenderer`.
- Update `SampleStatusInput` handling of `containerFilter` to use prop override pattern instead of `delete`.

### version 2.349.6
*Released*: 21 July 2023
* Fix Issue #48014: BarTender Test connection health check

### version 2.349.5
*Released*: 10 July 2023
* Remove BaseSearchPage and SearchForm
* Export SEARCH_PAGE_DEFAULT_SIZE, SearchPanel

### version 2.349.4
*Released*: 7 July 2023
* Add ability to customize message for useNotAuthorized hook.

### version 2.349.3
*Released*: 1 July 2023
* Issue 48188: Selecting 'All non-PHI' or 'Custom template' under 'Index each item as a separate document' doesn't persist

### version 2.349.2
*Released*: 30 June 2023
* Consolidates `internal/utils` into `editable/utils` and removes `internal/utils`.
* Move some utilities into `editable/actions` to prevent circular dependencies.
* Fix a usage of `useCallback` in `DateInputCell`.

### version 2.349.1
*Released*: 30 June 2023
* Import Samples Across Sample Types UI
  * update handleEntityFileImport() to add null check for queryInfo param

### version 2.349.0
*Released*: 29 June 2023
- Add new route key for cross-type listing pages
- export method for getting sample types and rowIds from a transactionAuditId
- Issue 48178: Fix URL resolution for sample types that start with numbers

### version 2.348.1
*Released*: 28 June 2023
- Issue 48165: LKSM: Cannot read properties of undefined (reading 'selected')
- Fix tableAlias for getFilterLabKeySql

### version 2.348.0
*Released*: 28 June 2023
- Move editable grid actions to internal/components/editable/actions.ts
- Remove the `I` prefix on various interfaces
    - `IGridLoader`, `IEditableGridLoader`, `IGridData`, `IGridResponse`, `IGetSelectedResponse`, `ISelectResponse`

### version 2.347.2
*Released*: 27 June 2023
- Project setting updates for Data in Project and Project Storage needs a manual refresh to take effect

### version 2.347.1
*Released*: 27 June 2023
* Create Storage on Sample Import
  * add StorageUnit column to SAMPLE_STORAGE_COLUMNS const

### version 2.347.0
*Released*: 27 June 2023
- Update entity creation for sample and source creation
  - Use URL to determine whether to show file upload or grid
  - export HREF constants for different creation modes

### version 2.346.1
*Released*: 26 June 2023
* Add scope to ontology search queries
  * add scope that includes Shared folder (where ontologies reside)
  * switch from deprecated searchUsingIndex

### version 2.346.0
*Released*: 26 June 2023
- EditableGrid Improvements
  - Improve drag fill behavior to support multiple columns, prefixed numbers, and dates
  - Improve paste behavior to expand pasted content into selections that are a multiple of the pasted content
  - Improve selection rendering
  - Convert readOnlyRows, lockedRows, insertColumns, updateColumns, readOnlyColumns to non-immutable data types
  - Move EditableGrid actions to editable folder
  - Handle lookups when using drag fill
  - Implement cut & paste
  - Fix issue with paste overriding read only columns

### version 2.345.3
*Released*: 21 June 2023
* Moving entities between projects - Assay Data
  * Modified EntityMoveModal to work with assay runs

### version 2.345.2
*Released*: 21 June 2023
- Export `EntityMoveConfirmationModal` for use with notebooks.

### version 2.345.1
*Released*: 19 June 2023
- Issue 48067: Add metrics for action buttons on editable grid

### version 2.345.0
*Released*: 8 June 2023
- Revise `QueryAPIWrapper` to support a number of additional API endpoints including query view APIs.
- Refactor a number of components to utilize the `APIWrapper` pattern and update associated tests.
- Remove `getDataClassDetails` from top-level export as it has been added to the `DomainPropertiesAPIWrapper`.

### version 2.344.0
*Released*: 6 June 2023
- Introduce React Testing Library
- Add `test-enzyme` and `test-react` scripts. Call both via `yarn test`.
- Declare alternative `jest.setup.react.ts` to support RTL-specific imports.
- Declare `enzymeTestHelpers` and `reactTestLibraryHelpers` to house utilities specific to each library.
- Add initial example tests for using RTL.

### version 2.343.1
*Released*: 2 June 2023
- Field editor fix for community usage to check for SM module during getFolderExcludedDataTypes() call

### version 2.343.0
*Released*: 2 June 2023
- Introduce enums for `SearchCategory` and new `SearchField`
- Add `SearchAPIWrapper` to allow for component usage of the search endpoint
- Search endpoint wrapper for applications now defaults to `experimentalCustomJson=true` and `normalizeUrls=true`.
- Add optional `requestHandler` to allow for cancellation of promised requests
- Refactor and deprecate `searchUsingIndex` method for resolving search results
- SelectInput: expose `openMenuOnClick` prop

### version 2.342.1
*Released*: 1 June 2023
* Migrate SCSS for /entities subpackage components that moved to @labkey/premium

### version 2.342.0
*Released*: 31 May 2023
* Data type domain exclude projects
  * Add DataTypeProjectsPanel to show panel in field editor for selecting excluded projects for a given data type domain
    * implement for Sample Type designer, Data Class designer (sources and non-built in registry), Assay Designer
  * Misc updates to admin panel titles for consistency

### version 2.341.3
*Released*: 31 May 2023
* Project level data type - handle lookups and remove experimental flag
  * remove isProductProjectDataTypeSelectionEnabled experimental flag and enable function
  * filter schema and query names for Look Up fields in designer based on selected target container's data type exclusion config
  * support user supplied lookupValueFilters for LookupCell

### version 2.341.2
*Released*: 30 May 2023
* Issue 47556: Update color for placeholder text in grids
* Issue 47964: Adjust `AncestorRenderer` to display field values that are negative
* Issue 47960: Update messaging about limit on sample creation
* Issue 47546: Update style for tabs so they don't appear disabled; update font for subnav

### version 2.341.1
*Released*: 26 May 2023
* Fix await without try/catch

### version 2.341.0
*Released*: 25 May 2023
* Project level data type - exclude on UI
  * Added App.getProjectDataExclusion utils to get the exclusion for the current folder context
  * Exclude assay designs from withAssayModel
  * Exclude data types from BarChartViewer
  * Added FolderAPIWrapper.getDataTypeExcludedProjects util to get the list of excluded projects for a specific data type
  * Modified EntityMoveConfirmationModal to exclude target data types from dropdowns
  * Modified initParentOptionsSelects util to exclude data types

### version 2.340.0
*Released* : 24 May 2023
* Issue 47548: App menu folder sections to include icon links to dashboard and admin pages directly

### version 2.339.0
*Released* : 23 May 2023
*  move /entities subpackage to @labkey/premium package and remove from this repo
  * add some missing components to index.ts needed by @labkey/premium

### version 2.338.0
*Released* : 17 May 2023
* Project level data type configuration schema and UI
  * Added DataTypeSelector and ProjectDataTypeSelections components
  * Modified CreateProjectPage and AdminSettingsPage to include project data selection panels
  * Added ProjectFreezerSelectionComponent and projectDataTypes to AdminAppContext
  * Added utils to get, update and add project data exclusion settings

### version 2.337.0
*Released*: 15 May 2023
* Issue 47784: When there is ony one sample type in a tabbed grid, default to that type's tab instead of "All Samples"

### version 2.336.2
*Released* : 15 May 2023
* Update shouldShowProductNavigation() to include check for LKB app instead of just hasPremiumModule

### version 2.336.1
*Released* : 12 May 2023
* Issue 47794: App sample type assay button to show assay submenu items in disabled state

### version 2.336.0
*Released* : 12 May 2023
* Issue 47024: WindowFocusCheckExpiredSession to add tab focus window listener to check for expired session in apps

### version 2.335.0
*Released* : 11 May 2023
- Add support for moving sources (data classes)
  - Refactor components for samples
  - Add properties to EntityDataType

### version 2.334.0
*Released*: 8 May 2023
* Add ExtendedMap
* Convert QueryInfo to plain JS  class
    * Convert all Immutable properties to JS based types or ExtendedMap
    * Convert all usages of QueryInfo to expect updated types
    * Remove insertColumns in favor of ExtendedMap.mergeAt
* ViewInfo: Remove logic from constructor
    - All transformation logic moved to fromJsonForTests

### version 2.333.3
*Released*: 7 May 2023
* Bulk edit improvement
  * limit the number of items that can be edited in Bulk to 1000
  * only select key columns and columns that are editable for bulk edit and edit in grid

### Version 2.333.2
#Released*: 3 May 2023
- Issue 46747: Update lookup resolver to go to LKS when lookup is defined outside the app

### version 2.333.1
*Released*: 3 May 2023
* Adjust usages of auditBehavior to always use AuditBehaviorTypes.DETAILED
  * remove auditBehavior optional props since they were always passed in as DETAILED
  * remove getSampleAuditBehavior() since it was always using DETAILED

### version 2.333.0
*Released*: 2 May 2023
* Add expired sample indicator in UI
  * add new ExpirationDateColumnRenderer and wire up to grid cell and DetailDisplay
  * modify SampleAiquotDetailHeader to show expired icon for aliquot parent expiration date field
  * modify ItemsLegends to be able to display expired icon

### version 2.332.4
*Released*: 2 May 2023
* Update @labkey/api package version

### version 2.332.3
*Released*: 1 May 2023
* Move samples between project updates and containerFilter changes
  * Picklist All Samples grid update to filter out unresolved samples
  * SampleMoveMenuItem update to provide an onSuccess callback, to allow the LKFM grid to reload models accordingly

### version 2.332.2
*Released*: 1 May 2023
* Issue 47822: export getSampleStatusContainerFilter

### version 2.332.1
*Released*: 28 April 2023
* Issue 47749: Assay re-import run from tmp file to use TSV loader for file preview
* Issue 47576: AssayImportPanels change so that if there are wrapped columns that are marked as userEditable and shownInInsertView, include them in the form / UI

### version 2.332.0
*Released*: 27 April 2023
- Issue 47756: Use categories to filter search results server-side instead of client-side

### version 2.331.0
*Released*: 26 April 2023
* Performance Evaluation for Data at Scale - Improve Insert/UpdateRows calls
  * add skipReselectRows param to insertRows/updateRows calls when detailed rows in response is not needed

### version 2.330.0
*Released*: 26 April 2023
* Move samples between projects UI updates
  * add new SampleMoveMenuItem and EntityMoveModal to be used by the SamplesEditButton
  * add getMoveConfirmationData and moveSamples API action calls
  * handle selectionKey for useSnapshotSelection case
  * add move menu item to sample overview page and usage of EntityMoveModal

### version 2.329.1
*Released*: 20 April 2023
- Support for restricted issue lists
    - Adds configuration to the issue list admin page to enable/disable restricted issue lists.
    - Optional site and project group selection to allow group members to access restricted issues.
    - This feature is controlled via a module property.

### version 2.329.0
*Released*: 20 April 2023
* Issue 47656: Add metrics for pagination usage and page sizing
* Issue 47657: Remove adding BarTender templates from within subfolder Projects

### version 2.328.1
*Released*: 20 April 2023
* Issue 47743: Sample Finder mis-renders data cards in queries with both "All Sample Types" and Assay cards

### version 2.328.0
*Released*: 19 April 2023
- Issue 47509: Better handling of samples with numeric names on assay import
  - the editable grid will always use key values (i.e. RowIds) for lookups, so set allowLookupByAlternateKey to false
  - on re-import run if the original run was imported via editable grid, the sample Ids will be rowIds so set allowLookupByAlternateKey to false

### version 2.327.0
*Released*: 18 April 2023
* Media consistency improvements

### version 2.326.0
*Released*: 15 April 2023
- Entities subpackage migration
    - Moved `AssayResultsForSamplesButton`, `EntityCrossProjectSelectionConfirmModal`, `EntityDeleteConfirmModal`, `EntityInsertPanel` and `FindDerivativesButton` to subpackage.
    - Moved `getOriginalParentsFromLineage` to `@labkey/components` to align endpoint wrappers for use in `EntityAPIWrapper`.
- `EntityInsertPanel`:
    - Refactor initialization to separate concerns for initializing import aliases, name expression previews, `insertModel` and editable grid models.
    - Defer construction of column metadata until after load. Previously results were just thrown away.
    - Update all direct calls to endpoints to utilize `ComponentAPIWrapper` provided implementations.
    - `getInferredFieldWarnings` and `getNoUpdateFieldWarnings` are no longer static methods as this served no purpose
    - Refactored `getWarningFieldList` into `WarningFieldList` component
    - Remove superfluous render wrapping
- `ComponentAPIWrapper`:
    - Add `getEntityTypeData`, `getOriginalParentsFromLineage` and `handleEntityFileImport` to `EntityAPIWrapper`. Update associated usages where possible to use API wrapper.
    - Add `fetchDomainDetails` to `DomainPropertiesAPIWrapper`
    - Update `getDefaultAPIWrapper()` for `ComponentAPIWrapper` to instantiate wrappers once. Makes `api` easier for reuse in components to prevent redundant render cycles.
- Streamline some sample action implementations to use `async/await` and remove redundant error handling wrapping.

### version 2.325.1
*Released*: 12 April 2023
- Sample Derivation: limit selected data requests

### version 2.325.0
*Released*: 10 April 2023
* Follow up consolidation of search pages to a shared component

### version 2.324.0
*Released*: 10 April 2023
* Issue 47648: Make "Contains" the default filter

### version 2.323.7
*Released*: 10 April 2023
* Issue 47647: App permissions page needs to check for project container perm when loading group memberships

### version 2.323.6
*Released*: 10 April 2023
* Issue 47660: QueryModel with bindURL isn't reloading totalCount on URL filter change

### version 2.323.5
*Released*: 7 April 2023
* Issue 47633: display project data in home folder when "queryProductProjectDataListingScoped" experimental flag is enabled.

### version 2.323.4
*Released*: 5 April 2023
* Add loading state to domain designer initialization.

### version 2.323.3
*Released*: 5 April 2023
* Issue 47571: Make sure project settings panel shows up even when the premium module is not available.
* Issue 47544: Don't show [blank] filter option if all distinct values are returned and none is blank.
* Issue 47532: For the UserProfile form, exclude lastActivity column explicitly
* Issue 47100: Update documentation link for sample ID lookup fields.
* Issue 47464: Update documentation link for ontology integration from LKSM.

### version 2.323.2
*Released*: 4 April 2023
* UserDetailsPanel fix for currentProductId vs targetProductId in URL generation
* SampleAssayDetails fix to check for both hasSampleTypeAssayDesigns and hasAssayResults when displaying empty msg

### version 2.323.1
*Released*: 4 April 2023
* Merge release23.3-SNAPSHOT to develop:
    * includes changes from 2.302.4

### version 2.323.0
*Released*: 1 April 2023
* Enable lineage relationship between custom data classes in apps
  * Extract parent alias handling code from SampleTypeDesigner and SampleTypePropertiesPanel to DomainParentAliases and utils
  * Support parent alias for DataClassDesigner

### version 2.322.0
*Released*: 31 March 2023
* Search behavior improvements
  * Added a SearchPanel component to be shared between Apps
  * Cleaned up some styling and layout items
  * Added paging to search results
  * Removed advanced filtering options

### version 2.321.0
*Released*: 31 March 2023
- Allow for specifying other options on requests made by `useContainerUser`.
- Consolidate usage of `SampleStorageLocationComponentProps` and `SampleStorageMenuComponentProps` types by exporting for external reference.

### version 2.320.1
*Released*: 31 March 2023
- Aliquot panel perf improvements by removing the unnecessary call to get the total row count and extra storage related columns

### version 2.320.0
*Released*: 30 March 2023
* Issue 47570: Remove admin pages for Users and Groups in subfolders

### version 2.319.0
*Released*: 30 March 2023
- Graph Options
    - Add `LineageSettings` component that allows for manipulation of settings for the graph.
    - Expose graph options "gear" icon via `LineageGraph` component.
- Combine Nodes
    - Create a `LineageNode` instance that replaces all combined nodes in processing.
    - Factor out `applyCombineSize` method to encapsulate `combineSize` logic.
    - Factor our `processCombinedNode` method to encapsulate construction of edges from a combined node.

### version 2.318.1
*Released*: 30 March 2023
* Issue 47575: Populating editable grid from bulk update doesn't account for aliquot- or sample-only fields

### version 2.318.0
*Released*: 30 March 2023
* Issue 47346: App Sample details Assay data tab loading slowly
  * AssayDefinitionModel.createSampleFilter change to generate a where clause that uses a "RowId IN (<UNION Query>)" instead of "OR clause"

### version 2.317.0
*Released*: 29 March 2023
* Convert Immutable classes to plain JS classes
    - ViewInfo
    - DataViewInfo
    - LastActionStatus

### version 2.316.0
*Released*: 29 March 2023
* Issue 47520: LKB: Sample Finder shows no samples when Assay does not have sample ID populated
  * modify filtering on AssayNotInFilter to exclude null result
* Sample Finder: Sample Properties & Built in reports
  * new SamplePropertyDataType EntityDataType
  * add built-in report section to SampleFinderSavedViewsMenu
  * support relative date filter value in DatePickerInput
  * add parsing, display and labkey sql util for relative date filter
  * modify QueryFilterPanel to allow provided list of fields
  * update card/json util to no longer persist full entityDataType object

### version 2.315.1
*Released*: 28 March 2023
* Merge release23.3-SNAPSHOT to develop:
    * includes changes from 2.302.3

### version 2.315.0
*Released*: 27 March 2023
* Update sample statuses to inherit from the parent and no longer support creation in subfolders
* Update `ManageSampleStatusesPanel`
  * Display statuses from higher up the hierarchy as locked statuses
  * Don't allow adding new statuses when in sub-folders

### version 2.314.1
*Released*: 24 March 2023
* Sample aliquots panel should not show "Assay Data with Aliquots" when isAssayEnabled false

### version 2.314.0
*Released*: 23 March 2023
* Issue 47408: Filter units in bulk update to match sample type display units
* Issue 47408: Coalesce and check for updates using the display values for amounts and units
* Issue 47517: Update Label for Name field for SM Source typ in Default System Fields

### version 2.313.1
*Released*: 23 March 2023
* Issue 47229: Support all characters within aliases

### version 2.313.0
*Released*: 23 March 2023
* Issue 47503: Sample Manager: Sample Finder not working for sample type with double quotes in name
* Issue 47077: Sample Finder taking a really long time to load results
  * skip autoload for sample finder result grids
  * improve sample finder hidden custom view handling
  * use a single query to get row counts for all sample finder result grids
  * add tabRowCounts as a prop for TabbedGridPanel

### version 2.312.0
*Released*: 21 March 2023
* Sample assay grid and aliquot summary to only query for data from assays that have data for that sample/aliquot ID set
  * previously was just querying for all assay designs with a sample lookup
  * getDistinctAssaysPerSample() to query for the distinct set of assay design names with data for given sample rowIDs

### version 2.311.0
*Released*: 21 March 2023
* Issue 43559: Domain designer throws error on invalid lookup

### version 2.310.0
*Released*: 17 March 2023
* withQueryModels to separate query to get the totalCount from the query to get the model data rows
  * loadRows query to always use includeTotalCount false and then conditionally make a second query with includeTotalCount true
  * update Pagination and SelectionStatus to wait for new totalCountLoadingState
  * PaginationInfo update to include loading check for max/rowCount text display
  * reset totalCountLoadingState when filters change on a QueryModel since we need to reload totalRowCount
  * add option to reloadTotalCount via loadModel() and loadAllModels()
  * QueryModel action to resetTotalCountState for all models

### version 2.309.0
*Released*: 16 March 2023
* Fix sample field partitioning to account for media not in storage

### version 2.308.0
*Released*: 14 March 2023
* Issue #47326: Allow setting a default BarTender label

### version 2.307.2
*Released*: 10 March 2023
* Issue 47422: LKSM: Renaming Sample Type results in Not Found error
* Issue 47407: Sample Manager: Update from file for Storage Editor without Edit Perm shoulnd't be available
* Issue 47406: Sample Manager: "Sample Id" column should be readonly on Edit Samples Grid / Storage Details tab
* Issue 47474: LKSM: Setting a field as required when editable on Samples & Aliquots errors

### version 2.307.1
*Released*: 8 March 2023
* Merge release23.3-SNAPSHOT to develop:
  * includes changes from 2.302.1 and 2.302.2

### version 2.307.0
*Released*: 7 March 2023
* selectRows and selectRowsDeprecated update to default to includeTotalCount false when not provided by usage config
  * switch usages of totalRows to rowCount were applicable
  * SelectionMenuItem shouldn't actually care about rowCount when deciding if it is disabled

### version 2.306.0
*Released*: 7 March 2023
* Issue 47127: Update wording for delete reply menu item and use title casing
* Issue 47333: When editing items individually is not possible, remove that tab
* Remove extraneous columns from inventory columns
* add `smaller-font` utility class

### version 2.305.0
*Released*: 6 March 2023
* Issue 47391: LKFM user menu items should match primary application
* Issue 47352: Product/Mega-menu has extra white space when sections are not displayed for permissions or product configuration reasons
* Issue 47390: Primary application should take into account the current URL controller for LKB and LKSM case

### version 2.304.2
*Released*: 3 March 2023
* Issue 47224: Refactor `SamplesDeriveButton` to reduce redundant calls and not make unnecessary, expensive calls

### version 2.304.1
*Released*: 3 March 2023
* Issue 47084: App Sample type grids issue the query for the grid twice

### version 2.304.0
*Released*: 1 March 2023
* Refactor all reducers declared by this package to no longer utilize `handleActions`.
* Remove `redux-actions` as a dependency.

### version 2.303.0
*Released*: 1 March 2023
* Migrate inventory.item.volume to exp.materials.storedAmount and inventory.item.volumeUnits to exp.materials.Units
  * Update `SamplesEditableGrid` for move of amount and units from inventory.item to exp.materials
  * Move measurement- and sample amount-related methods and models from ui-premium to here
  * Relabel "Stored Amount" to "Amount"
  * Separate editing of Stored Amount and Freeze/Thaw count on
  * Account for storedAmount and Units fields now on samples grids
  * Don't display amount and units in details display

### version 2.302.5
*Released*: 2 June 2023
- Backport Issue designer UI to support restricted issue lists to 23.3
    - see changes for v2.329.1

### version 2.302.4
*Released*: 30 March 2023
- Issue 47502: ProductMenu should use isAppHomeFolder to determine containerPath for fetchContainers call

### version 2.302.3
*Released*: 27 March 2023
- Issue 47569: Remove setting for inheriting permissions for the Site Roles and Assignments

### version 2.302.2
*Released*: 03 March 2023
- Issue 47306: Resolve Permissions page error by skipping no-resolvable users.
- Resolve bug in redirection location upon project deletion

### version 2.302.1
*Released*: 02 March 2023
- Issue 47202: Options to reduce payload of getContainers.api response
  - Field editor only needs the base set of container info for lookups so use new props to reduce response object size (includeWorkbookChildren and includeStandardProperties)

### version 2.302.0
*Released*: 28 February 2023
- SampleStatusTag to query for status type if not provided
- getSampleStatuses() boolean property for whether API should include inUse information or not
- Issue 47411: Include viewName in selectDistinct query for FilterFacetedSelector

### version 2.301.0
*Released*: 28 February 2023
- Add ability to delete projects while in-app

### version 2.300.1
*Released*: 28 February 2023
- Add a `focusSeed` method to the `VisGraph` component which fits the graph to the seed node and then zooms in to an appropriate level.
- Revise `fitGraph` to take determine whether the graph should be focused on the seed.

### version 2.300.0
*Released*: 28 February 2023
- FilterFacetedSelector fix to better handle selection filters when we don't have all distinct values (i.e. > 250 facet filter values)
  - don't compare current selection to allValues if we don't have allValues
  - don't default to selected/checked if we don't have allValues
  - handle case with search/filter input but not max distinct options
  - Issue 47266: For a grid the filter dialog does not enable the 'Apply' button if I type in a value unless I uncheck the [All] option first
  - Issue 47247: LKSM: Filtering values >250 doesn't save selection
- Issue 46870: Don't allow selection/inclusion of multi-valued lookup fields from Ancestors

### version 2.299.0
*Released*: 27 February 2023
- QueryColumn: convert to plain class
- AppURL: convert to plain class
- Container: convert to plain class
- User: convert to plain class
- QuerySort: convert to plain class
- WebDavFile: convert to plain class

### version 2.298.0
*Released*: 25 February 2023
- Support Enable/Disable “System Default Fields”
  - add disabledSystemFields property to DomainDesign and QueryInfo
  - allow updating Enabled property for SystemFields

### version 2.297.1
*Released*: 24 February 2023
- Issue 47392: Parent link to registry data types not resolving

### version 2.297.0
*Released*: 24 February 2023
- Introduce `getContainerFilterForFolder` to specify container filter specific to listing data in the current folder context.
- Use `getContainerFilterForFolder` for listing data on `SampleListingPage` and `QueryListingPage`.
- Explicitly support container filters on grid selection endpoint wrappers (e.g. `getSelected`, `selectAll`, etc).
- Add wrappers for new experimental flags for product projects.
- Update `SampleAliquotsSummary` to consolidate loading logic to present consistent loading behavior.
- Update `SampleTimelinePageBase` to consolidate loading logic to present consistent loading behavior.
- BarChartViewer: respect container filter settings
- Addresses Issue 47371: Harden MultiValueRenderer

### version 2.296.1
*Released*: 23 February 2023
- Add perm check helper hasSampleWorkflowDeletePermission()
- update @labkey/api package version

### version 2.296.0
*Released*: 22 February 2023
- QueryLookup: convert to regular class, add filterGroups attribute, use filterGroups in getQueryFilters
- QueryFormInputs: Add optional "operation" prop
  - Add equivalent prop to QueryInfoForm, AssayImportPanels (and child components), BulkAddUpdateForm, LookupCell
- DetailDisplay: use QueryColumn.getQueryFilters when rendering QuerySelect

### version 2.295.0
*Released*: 22 February 2023
- QueryModel switch to default to includeTotalCount false
  - add QueryModel prop for includeTotalCount, default to false
  - update all grid panel QueryConfig usages to includeTotalCount true

### version 2.294.0
*Released*: 21 February 2023
- Add LK version to app admin settings page header - fix for non-premium app case

### version 2.293.6
*Released*: 20 February 2023
- Add “ExpirationDate” field to exp.material
    - Add Expiration Date to the set of aliquot fields

### version 2.293.5
*Released*: 17 February 2023
- Issue 46465: Grid actions that use a selectionKey doesn't get expected selections when filters applied to grid
  - make sure setSnapshotSelections() is called before selectionKey based call to getSampleOperationConfirmationData()

### version 2.293.4
*Released*: 16 February 2023
- Issue 46767: DatePicker valid dates start at year 1000 (i.e. new Date('1000-01-01'))
  - set the DatePicker as disabled in an invalid date is used, still allows it to be removed

### version 2.293.3
*Released*: 15 February 2023
* Issue 47322: Ensure node requests are grouped by schema/query

### version 2.293.2
*Released*: 15 February 2023
* Fix EntityInsertPanel UI issues
    * fix alignment of parent type inputs on sample creation grid
    * fix extra caret on entity insert panel when alias cells are present

### version 2.293.1
*Released*: 15 February 2023
* Merge release23.2-SNAPSHOT to develop:
    * includes changes from 2.288.2 and 2.288.3

### version 2.293.0
*Released*: 15 February 2023
- Add LK version to app admin settings page header

### version 2.292.1
*Released*: 13 February 2023
- Issue 47190: Don't warn about required fields added to default grid from lookups

### version 2.292.0
*Released*: 10 February 2023
- Add Default System Fields to Domain Designer for Sample Types and Data Classes

### version 2.291.0
*Released*: 8 February 2023
* UserLinkList: Fix issue with keys
* AttachmentCard: Add optional onCopyLink prop

### version 2.290.3
*Released*: 8 February 2023
* Merge release23.2-SNAPSHOT to develop:
  * includes changes from 2.288.1

### version 2.290.2
*Released*: 6 February 2023
* Issue 47035: Sample Aliquot grid should allow for edit
  * Use SamplesTabbedGridPanel for SampleAliquotsGridPanel

### version 2.290.1
*Released*: 3 February 2023
- Move getReportInfos.api to reports controller since it does not rely on study module

### version 2.290.0
*Released*: 2 February 2023
* SchemaQuery: Convert to vanilla class, remove getQuery, getSchema, getView, create
  * Use new SchemaQuery(schemaName, queryName, viewName) instead of SchemaQuery.create
* Remove unused resolveSchemaQuery

### version 2.289.0
*Released*: 2 February 2023
* Update links from users to display user detail data via modal for those who have permission
  * add modal version of UserDetailsPanel, via UserDetailsRenderer and UserLink
  * update list display of GroupsList, EffectiveRolesList, and MembersList
  * shows user permissions on the User Management page
  * use UserDetailsRenderer as default renderer for columns with user lookup
  * use UserLink and UserLinkList in various components that render user displayName
  * update UserDetailsPanel so that permissions and group listing items are links to admin groups/permissions page
  * add dirty state check for user Profile page navigation

### version 2.288.3
*Released*: 14 February 2023
- Issue 47257: Cannot delete samples from a grid that has a filter applied
    - make sure setSnapshotSelections() is called before selectionKey based call to getCrossFolderSelectionResult()

### version 2.288.2
*Released*: 14 February 2023
- Issue 47303: fix bad URL redirection from SamplesCreatedSuccessMessage

### version 2.288.1
*Released*: 6 February 2023
- Issue 46618: Retain result row ordering in `formatSavedResults` and `formatResults` when processing results of `QuerySelect` queries.
- Add the `hasSortKey` property to the `QueryColumn` model. Now supported by `query-getQueryDetails.api`.

### version 2.288.0
*Released*: 1 February 2023
- Create components for `SamplesCreatedSuccessMessage` and `SamplesImportSuccessMessage`. Utilize `withRouter`.
- Add URL utility to `removeParameters()`.
- Default implementation of `sampleWizardURL` is now `getSampleWizardURL()`. Update typings to be more easily exported.

### version 2.287.0
*Released*: 30 January 2023
- Get product menu sections separately from user menu since they are no longer displayed together

### version 2.286.2
*Released*: 28 January 2023
* Issue 46949: Sample timeline detail links to sources instead of registry for LKB

### version 2.286.1
*Released*: 28 January 2023
* Projects: disallow project-specific data type creation
  * Hide create data type urls from ProductMenuSection
  * Show 'Not Found' page for SampleTypeDesignPage
  * Hide 'Create Sample Type' button from SampleTypeListingPage
  * Hide create url link from Sample/Assay EmptyAlert

### version 2.286.0
*Released*: 27 January 2023
* Handle update and clarify merge - use DIB for updateRows
    * use LSID as keys for updateRows and saveRows for samples and dataclasses
* Issue 47152: Having a field that can be edited by both aliquots and samples after an "aliquot only" will not get populated on sample create.
* Issue 47162: Using file import to create aliquots does not behave as expected if the column header is "Aliquoted From" and not "AliquotedFrom"

### version 2.285.1
*Released*: 27 January 2023
- `waitForLifeCycle` now supports `ShallowWrapper` components (and can be used with `shallow()`)
- `EntityFieldFilterModal` update unit tests to match expected behavior and remove test-specific workarounds from component.
- Wrap `CreateSamplesSubMenuBaseImpl` with `withRouterProps` to support in-app navigation.
- Rename `SamplesDeriveButtonBase` to `SamplesDeriveButton`.
- Remove redundant prop declarations for `CreateSamplesSubMenuBaseProps` and `CreateSamplesSubMenuProps` and `SamplesDeriveButtonProps`

### version 2.285.0
*Released*: 27 January 2023
* Add `help` prop to `SelectInput` and render without colliding with error message rendering.
* Add `REGISTRY_AUDIT_QUERY` events to be displayed in only in LKB.
* Update `getAuditQueries()` to require a `ModuleContext` parameter.
* Issue 45729: Inform user that commas are not supported for values in the alias field

### version 2.284.0
*Released*: 25 January 2023
* Enable adding user audit comments when deleting Samples, Sources, and Assays & the associated entity types

### version 2.283.2
*Released*: 23 January 2023
* Fix issue with react keys in Navigation

### version 2.283.1
*Released*: 20 January 2023
* Issue 46344: Display group membership on profile page

### version 2.283.0
*Released*: 17 January 2023
* Issue 47066: Adjust timeline to show created date and created by user in timeline's current status, even if detailed audit logging was not on.
* Issue 47059: Show grid customization on sample-type-specific grids on Find By Ids page.

### version 2.282.0
*Released*: 17 January 2023
* Handle update and clarify merge - enable update action for apps
  * Remove isImportWithUpdateEnabled experimental flag

### version 2.281.0
*Released*: 16 January 2023
* Updates for notebook consistency
  * ProductMenu fix so that column section header `<hr>` don't look clickable
  * Consolidate status-tag with notebook tags, rename as status-pill / pill.scss
  * FileAttachmentArea.tsx compact mode

### version 2.280.1
*Released*: 13 January 2023
* Show "View All Activity" link in `ServerActivityList` when there are any items in the list
* Use `PIPELINE_MAPPER` in `ServerActivityList` to resolve `ActionLinkUrl` when possible
* Make sure `ServerNofifications` button closes after clicking a link in it.

### version 2.280.0
*Released*: 12 January 2023
* QueryColumn: Add shownInLookupView
* QueryInfo: Add getLookupViewColumns
* QuerySelect
  * remove previewOptions, we now render additional columns based on the shownInLookupView attribute of QueryColumn
  * update default option renderer to only render column captions when multiple columns are set to show in lookup views
* AssayImportPanels: remove showQuerySelectPreviewOptions

### version 2.279.1
*Released*: 9 January 2023
* Issue 47020: Use unique grid id so selections are not shared between FindByIds queries
* Issue 47003: don't try to load rows if queryInfo is not yet loaded.
* Issue 46876: Remove links from audit log entries that lead to LKS

### version 2.279.0
*Released*: 8 January 2023
* pull forward v2.275.1 changes

### version 2.278.0
*Released*: 6 January 2023
* Update `react-select` to `5.7.0`.
* Remove `@types/react-select` as types are now provided by `react-select`.
* Update `@labkey/build`.

### version 2.277.2
*Released*: 6 January 2023
* Issue 46733: Editable for aliquots only/Required Field: Adding Samples gives error

### version 2.277.1
*Released*: 6 January 2023
* Issue 46574: Filter Panel boolean labels are not clickable
* Issue 46765: Grid cell sample status input requires multiple clicks to open select options menu
* Issue 46837: Checkbox inputs with label render incorrectly on col-sm size
* Issue 46581: Editable Grid doesn't de-focus cells if you click outside the table

### version 2.277.0
*Released*: 4 January 2023
* Remove UserAvatars
  * It is no longer used by our apps
* Remove AssayButtons.tsx

### version 2.276.1
*Released*: 3 January 2023
* Issue 46767: DatePicker valid dates start at year 1000 (i.e. new Date('1000-01-01'))
  * update `parseDate` to add an optional minDate param for valid dates for DatePicker selected date
* Issue 46839: Allow click on search input icon for grid panel to apply search value

### version 2.276.0
*Released*: 3 January 2023
* App header Projects and Menu misc fixes
  * don't show projects column when user only has perm to a single subfolder
  * add new app icons with lighter background color for use in menu Dashboard link
  * adjust hover styling of menu items and menu widths for various screen sizes
  * show 'Home Project' for title when in /home container
* Issue 46299: Lineage Graph: Make Font Larger
* Issue 46593:App template download button ignores custom XML metadata <importTemplates> override for sample types

### version 2.275.1
*Released*: 6 January 2023
* Fix race condition that causes LabelTemplates table creation to fail
