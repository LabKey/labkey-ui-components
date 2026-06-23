# @labkey/components
Components, models, actions, and utility functions for LabKey applications and pages

### version TBD
*Released*: TBD
- GitHub Issue #1023: Add redirect() helper that uses core-safeRedirect

### version 7.42.2
*Released*: 22 June 2026
- Styling update for user comment on large storage modal

### version 7.42.1
*Released*: 17 June 2026
- Package updates

### version 7.42.0
*Released*: 11 June 2026
- App support for terminal storage barcodes
  - add `StorageUnitBarcode` as an allowed field for import
  - Updated resolveDuplicatesAsName() to check for the "barcode" identifier

### version 7.41.2
*Released*: 10 June 2026
- Merge from release26.6-SNAPSHOT to develop
    - includes changes from 7.40.2 #2014

### version 7.41.1
*Released*: 3 June 2026
- Merge from release26.6-SNAPSHOT to develop
    - includes changes from 7.40.1 #2011

### version 7.41.0
*Released*: 1 June 2026
- GitHub Issue 903: Remove Cross-Container Sample and Data Class Import Feature

### version 7.40.2
*Released*: 8 June 2026
-AppURL.fromMenuUrl: keep query params on URL

### version 7.40.1
*Released*: 2 June 2026
- More misc. accessibility improvements
  - Fix empty buttons for `ExpandableContainer` and `RemoveEntityButton`
  - Fix color contrast for `.name-id-setting__prefix-example`, `.container-nav` and `.lk-version-nav`
  - Fix color contrast for `.sr-only` to avoid false positives from WAVE

### version 7.40.0
*Released*: 28 May 2026
- Calculated Column Assistant
  - Keep the modal open after clicking apply expression
  - Send the current field to server to distinguish from a field set
  - Display column type for validated expressions
  - Refill prompt when request interrupted

### version 7.39.0
*Released*: 27 May 2026
- Misc. accessibility improvements
  - Auto-link to study input field labels
  - Remove tabIndex value from `DomainRow`
  - Add labels for text choice input fields
  - Use button instead of i for expandable container chevrons
  - Update LabelOverlay and DetailEditor with ids for labeling elements
  - Add `labelId` getter method in `QueryColumn`
  - Add `data-fieldkey` to some labels to help with locators

### version 7.38.2
*Released*: 27 May 2026
- Update `getDefaultVisibleColumns` to remove columns that metadata eliminates from views

### version 7.38.1
*Released*: 26 May 2026
- GitHub Issue 1021: Sample Finder: Long names truncated in Search cards

### version 7.38.0
*Released*: 21 May 2026
- Accessibility improvements for app pages: Keyboard Interactions
  - Make ActionButton a button so it can be tabbed to
  - Allow tab to app main menu folder items
  - Modals to have focus on open, allow tab only within modal elements, and ESCAPE to close
  - Use buttons with clickable-text styling instead of spans and divs with onClick properties
  - Update `useEnterEscape` to allow optional event argument to callbacks and to allow for multi-select behavior
  - EditableGrid Cell to allow tab focus with tabIndex 0
  - Update styling for file inputs on `AttachmentCard` so input field is not hidden
  - Add `tabIndex` and `onKeyDown` callback for thread components

### version 7.37.1
*Released*: 20 May 2026
- Molecule and PS bulk import by file
    - `getGridIdsFromTransactionId` return type changed from `string[]` to `DataTypeRowIdsFromTransactionIds` (includes `rowIds`, `dataTypeRowCounts`)
    - `selectGridIdsFromTransactionId` updated to match new return type
    - `getSampleTypesFromTransactionIds` refactored to delegate to shared `getDataTypesFromTransactionId` helper; return type uses generic `dataTypes` field instead of `sampleTypes`
    - New `getDataClassesFromTransactionIds` function — resolves DataClass names and builds per-type row counts from transaction audit IDs

### version 7.37.0
*Released*: 15 May 2026
- Calculated Column Assistant
- Add `ChatModal` component for prompt/conversation interaction
- Add `ExpressionAssistantModal` for specific implementation of expression assistant modal
- Add `query-expressionAssistantAgent.api` endpoint to `APIWrapper`
- Move `query-parseCalculatedColumn.api` endpoint wrapper to `APIWrapper`

### version 7.36.0
*Released*: 13 May 2026
- Update heading tags in various page elements for better accessibility
- Add sr-only text for Selection checkbox table header
- Update a few more colors for better contrast

### version 7.35.2
*Released*: 12 May 2026
- Package updates

### version 7.35.1
*Released*: 7 May 2026
- Package updates

### version 7.35.0
*Released*: 7 May 2026
- Fix accessibility issues for empty links and buttons
- Add `Icon` component for use on buttons and links that are only icons
- Add some alt text to a few images

### version 7.34.0
*Released*: 5 May 2026
- Accessibility improvements for app pages: Colors

### version 7.33.4
*Released*: 3 May 2026
- Consolidate Dataclass data update methods - use DIB for update only
  - Remove `altUpdateKeys` from `QueryInfo`

### version 7.33.3
*Released*: 1 May 2026
- Accessibility improvements: add labels or aria-labels to input elements

### version 7.33.2
*Released*: 29 April 2026
- GitHub Issue #598: Wrap text for long file names in various app locations

### version 7.33.1
*Released*: 28 April 2026
- Merge from release26.3-SNAPSHOT to develop
    - includes changes from 7.21.5 #1987

### version 7.33.0
*Released*: 24 April 2026
- Workflow UI updates
  - Add css for .lk-popover-behind-modal to adjust z-index
  - EditInlineField prop for pullRight for pencil icon
  - UserDetailsPanel support for userId that is a group id

### version 7.32.0
*Released*: 23 April 2026
- Add EMPTY_COMPOUND_WARNING
- Add COMPOUND to SCHEMAS.DATA_CLASSES
- hasIdentifiedCol: check for Compound schema
- UnidentifiedPill: handle schemas that don't have defined messages, add support for Compound schema

### version 7.31.1
*Released*: 23 April 2026
- GitHub Issue 911: Fix overflow for field filtering modal

### version 7.31.0
*Released*: 20 April 2026
- Add optional `jobActionId` parameter to `updateSampleStorageData`
- Add `dividedOptionsRenderer` and `filterDividedOptions` for rendering selectInputs with dividers between groups of options

### version 7.30.0
*Released*: 17 April 2026
- GitHub Issue 848: Add the ability to reset TOTP settings in the apps

### version 7.29.4
*Released*: 9 April 2026
- GitHub Issue 954: Add error for duplicate values for parent inputs

### version 7.29.3
*Released*: 8 April 2026
- GitHub Issue 928: Spaces not shown between text choices in identifying fields in editable grid
- GitHub Issue 951: Multi-line values converted to text choices lose multi-line editability
- GitHub Issue 970: Warn about more than 10 items for multi choice fields in editable grid.
- GitHub Issue 987: Multi value filter dialog lets you edit and save without any selected values

### version 7.29.2
*Released*: 8 April 2026
- Merge from release26.4-SNAPSHOT to develop
    - includes changes from 7.26.5 #1970
    - includes changes from 7.26.6 #1976

### version 7.29.1
*Released*: 7 April 2026
- GitHub Issue 868: Add more nouns for count units

### version 7.28.2
*Released*: 7 April 2026
- Update `FREEZER_ITEM_SAMPLE_MAPPER` to return undefined if not matched, for consistency with other mappers

### version 7.28.1
*Released*: 3 April 2026
- GitHub Issue 613: Use "Status" instead of "SampleState" in error messaging.

### version 7.28.0
*Released*: 2 April 2026
- GitHub Issue 916: Editable grid copy/paste issue with special characters
    - replaces the custom parseCsvString function with the PapaParse library based  splitMultiValueForImport/joinMultiValueForExport util for CSV/TSV parsing
    - add some basic multi-line paste support
    - remove quoteValueColumnWithDelimiters as it's no longer needed

### version 7.27.0
*Released*: 1 April 2026
- GitHub Issue 985: Update styling of `SelectInput` for identifying fields

### version 7.26.6
*Released*: 7 April 2026
- Merge from release26.3-SNAPSHOT to release26.4-SNAPSHOT
    - includes changes from 7.21.4 #1971

### version 7.26.5
*Released*: 2 April 2026
- GitHub Issue 847: App User Management page to allow users with manageUsersPermission to select / view all site users

### version 7.26.4
*Released*: 31 March 2026
- Update `@labkey/api` dependency

### version 7.26.3
*Released*: 31 March 2026
- GitHub Issue 811: App permissions page shows deactivated users in group members list
  - Don't show inactive users in members list for group details on permissions page
  - include "Inactive User: " prefix in member button on group management page to match what we do for permissions page

### version 7.26.2
*Released*: 31 March 2026
- GitHub Issue 919: App grid column header menu renders behind modal when grid shown in modal (more related to GitHub Issue 710)

### version 7.26.1
*Released*: 30 March 2026
- Replace `encodeFormDataQuote` with `Utils.encodeFormName`

### version 7.26.0
*Released*: 30 March 2026
- Update dependencies

### version 7.25.0
*Released*: 25 March 2026
- Update `isAllSamplesSchema` to account for move of `JobInputSamples` to `workflow` schema
- Add placement prop for `DisableableButton`
- add `fitlerArrayToString` method in QueryModel utils
- add `pronoun` utility method for the it/they or it/them text choices

### version 7.24.2
*Released*: 25 March 2026
- GitHub Issue 955: limit text choice option length to 200 characters

### version 7.24.1
*Released*: 25 March 2026
- Factor `EditingForm` out of `EditableDetailPanel` and load model with update columns
- Update `extractChanges()` to account for `column.jsonType === 'array'`
- Refactor `arrayEquals` to fix edge cases of array mutation and delimiter collisions

### version 7.24.0
*Released*: 24 March 2026
- SchemaQuery.isEqual: add optional includeViewName argument, defaults to true
- UnidentifiedPill: add schemaQuery prop
- EMPTY_SEQUENCE_WARNING renamed to EMPTY_NS_SEQUENCE_WARNING

### version 7.23.5
*Released*: 18 March 2026
- Bump @labkye/api dependency

### version 7.23.4
*Released*: 22 March 2026
- Set query and registry audit events to `hasTransactionId=true`

### version 7.23.3
*Released*: 19 March 2026
- GitHub Issue 942: Add error for duplicate values for MVTC fields
- GitHub Issue 961: Clicking the "Allow multiple selections" label doesn't toggle the checkbox
- GitHub Issue 932: No help text for disabled Multi-Value checkbox in designer

### version 7.23.2
*Released*: 18 March 2026
- Merge from release26.3-SNAPSHOT to develop
    - includes changes from 7.21.2 #1949
    - includes changes from 7.21.3 #1947

### version 7.23.1
*Released*: 11 March 2026
- Merge from release26.3-SNAPSHOT to develop
    - includes changes from 7.21.1 #1946

### version 7.23.0
*Released*: 10 March 2026
- Update `tsconfig.json` to specify `delcarationMap`
- Add missing `declare` statements that are now required with `ES2023`

### version 7.22.1
*Released*: 6 March 2026
- GitHub Issue 897: Study dataset should not allow multivalue text choice as a third key

### version 7.22.0
*Released*: 4 March 2026
- Remove styles for `.app-page`
    - Component was moved to ui-premium a while ago
- Add `ta-right`, `ta-left` util styles
- Add UnidentifiedPill
- Add EMPTY_SEQUENCE_WARNING constant

### version 7.21.5
*Released*: 23 April 2026
- GitHub Issue #1012: Update resolveDuplicatesAsName() regex to handle nested parentheses in key/value

### version 7.21.4
*Released*: 6 April 2026
- GitHub Issue #974: Lookup Data Type shown in Assay Designer for app, even when premium module is not present
  - AssayDesignerPanels to pass appPropertiesOnly to AssayDomainForm
  - add new domainFormDisplayOptions.showAdvancedSettingsForApp for assay designer case

### version 7.21.3
*Released*: 12 March 2026
- GitHub Issue #790: Sample check-in and discard should not allow amount/unit input for differing units
  - Update areUnitsCompatible to account for different "Count" unit labels
  - getMetricUnitOptions() to allow optional filterFn parameter for the "Count" unit case

### version 7.21.2
*Released*: 11 March 2026
- GitHub Issue 710: Include columns set as Identifying Fields within the 'Search for Samples' grid when adding samples to a storage location
  - update saveGridView() to take hidden prop (default false)
  - saveSettingsToLocalStorage() fix for checking model.useSavedSettings === SavedSettings.none

### version 7.21.1
*Released*: 4 March 2026
- GitHub Issue 829: Sample type with lookup to list with text primary key where the value contains a comma doesn't map to lookup
  - Only do `quoteValueWithDelimiters` on values if the lookup column support multiple values

### version 7.21.0
*Released*: 26 February 2026
- Package updates

### version 7.20.5
*Released*: 25 February 2026
- GitHub Issue #418: Remove flag field type & migrate to text

### version 7.20.4
*Released*: 25 February 2026
- GitHub Issue #734: App narrow screen display can cut off error message for field editor pages
  - inline-comment footer can take up to 125px on small screens so increase bottom padding for .app-page

### version 7.20.3
*Released*: 24 February 2026
- GitHub Issue 465: Add auditing capabilities for grid views
- GitHub Issue 840: Increase text choice options from 200 to 500

### version 7.20.2
*Released*: 24 February 2026
- Bump @labkey/api dependency

### version 7.20.1
*Released*: 20 February 2026
- GitHub Issue 830: Assay design add transform script webdav path doesn't resolve from subfolder
  - AssayProtocolModel.container to compare domain id to the container.parentId to get parentPath when applicable
  - TransformScriptsInput to resolve the domain containerId to the containerPath to use for webdav operations

### version 7.20.0
*Released*: 18 February 2026
- Multi value text choices: field type conversion
    - Updates the Text Choice options UI to add an “Allow multiple selections” toggle, multi-choice-specific edit restrictions, and improved confirmation messaging/tests for data-type changes involving text/multi-choice.
    - Make multi-choice behaves as an internal variant of Text Choice rather than a separate visible type in data type dropdown
    - Modified updateDataType and text choice usage counting to correctly handle conversions between string, Text Choice, and Multi Choice fields, clearing validators/flags and tracking multi-value usage where appropriate.

### version 7.19.0
*Released*: 18 February 2026
- GitHub Issue 846: Remove display of user role in profile and settings pages

### version 7.18.1
*Released*: 17 February 2026
- Allow users to use quotation marks for exact search within the apps

### version 7.18.0
*Released*: 17 February 2026
- Update `FilterStatus` to optionally include an "Add Filter" button
- add `getIntegerSearchParam` utility in `internal/url/utils.ts`

### version 7.17.0
*Released*: 16 February 2026
- Remove GridAliquotViewSelector
- Remove SampleAliquotViewSelector
- Remove isSampleAliquotSelectorEnabled

### version 7.16.2
*Released*: 11 February 2026
- GitHub Issue 779: Cannot Edit Relative Dates in Sample Finder
    - Allow intermediate editing state for relative date values in DatePickerInput

### version 7.16.1
*Released*: 11 February 2026
- Query: sort columns where name starts with '+'

### version 7.16.0
*Released*: 5 February 2026
- File import warnings for cross type sample import case
  - InferDomain API call and response to include distinctValues for specified column keys
  - EntityIdCreationModel.getSchemaQuery to include optional targetQueryName param

### version 7.15.0
*Released*: 4 February 2026
- Package updates

### version 7.14.0
*Released*: 30 January 2026
- Update `withQueryModels` to track and cancel requests for `loadRows`, `loadSelections` and `loadTotalCount`
- Add `RequestHandler` handling for `selectRows` and `selectRowsDeprecated`
- Skip error logging when request is aborted
- Update a few endpoint wrappers to use `request()`

### version 7.13.1
*Released*: 26 January 2026
- Merge from release26.1-SNAPSHOT to develop
    - includes changes from 7.7.5 #1926

### version 7.13.0
*Released*: 20 January 2026
- Multi value text choices
    - Added new MULTI_CHOICE_RANGE_URI for defining MVTC fields and updated utils to check against data type
    - renamed joinValues prop for SelectInput to skipJoinValues to align with its actual usage
    - Modified FilterFacetedSelector and QueryFilterPanel to handle array value selecting for MVTC

### version 7.12.2
*Released*: 19 January 2026
- GitHub Issue 764: Editable grid border display issue on very small screens
  - override default bootstrap table-responsive style for xs scren table border

### version 7.12.1
*Released*: 14 January 2026
- Merge from release26.1-SNAPSHOT to develop
    - includes changes from 7.7.4 #1921

### version 7.12.0
*Released*: 7 January 2026
- Lineage: add "restricted" property

### version 7.11.0
*Released*: 6 January 2026
- GitHub Issue 73: Field editor Advanced Settings to allow for non-unique constraint / index
    - update UI to allow for single field non-unique index and unique constraint via select dropdown
    - update DomainField model to support nonUniqueConstraint in addition to uniqueConstraint

### version 7.10.0
*Released*: 6 January 2026
- GridColumn: remove width, fixedWidth properties
  - Add css class for text align and getTextAlignClassName helper
- Grid: improve styling for columns

### version 7.9.0
*Released*: 6 January 2026
- GitHub Issue 503: Field editor URL option to set target window (i.e. _blank)

### version 7.8.1
*Released*: 5 January 2026
- GitHub 562: Combine warning messages for file preview unknown/system fields with the warning for duplicate columns
  - FilePreviewGrid to combine warningMsg with previewData.warningMsg in a single Alert

### version 7.8.0
*Released*: 5 January 2026
- Add a “Mixed” state in Bulk Edit when values differ across selected samples
  - Modified getCommonDataValues utility to return both common field values and a list of fields with conflicting values
  - Added hasMixedValue prop support across all input components (TextInput, SelectInput, CheckboxInput, DatePickerInput, FileInput, TextAreaInput, AmountUnitInput)
  - Updated BulkUpdateForm and BulkAddUpdateForm to pass conflicting fields information to form inputs

### version 7.7.5
*Released*: 22 January 2026
- [GitHub Issue #798](https://github.com/LabKey/internal-issues/issues/798) - add product feature flag for advanced workflow

### version 7.7.4
*Released*: 8 January 2026
- [GitHub Issue #723](https://github.com/LabKey/internal-issues/issues/723)
  - EditableDetailPanel: use `useRouteLeave`

### version 7.7.3
*Released*: 31 December 2025
- [GitHub Issue #495](https://github.com/LabKey/internal-issues/issues/495)
 - Remove some gratuitous capitalization of field names in audit event details
 - When generating a column label for an added parent column in the editable grid, don't capitalize the query name

### version 7.7.2
*Released*: 30 December 2025
- Remove unused `getVolumeMinStep` method
- Improve typings, test checks

### version 7.7.1
*Released*: 29 December 2025
- [GitHub Issue 734](https://github.com/LabKey/internal-issues/issues/734) Update sizing of comment input box for better display in narrow screens
- [GitHub Issue 457](https://github.com/LabKey/internal-issues/issues/457) Update messaging for deleting samples linked to studies
- Remove support for discussions in lists

### version 7.7.0
*Released*: 29 December 2025
- Workflow Automation: Task action to filter samples for selected task
  - Added `lockReadOnlyForDelete` prop for workflow filter components to prevent modification of read-only filters used for deletion.
  - Introduced `EntityFieldFilter` type (renamed from `FieldFilter`) for improved clarity and consistency across workflow task filters.
  - Added new filter action helper functions: `getActionValuesForFilterProps` and `removeFilterValueForFilterProps` to simplify reading and updating filter values.
  - Added support for `supportAllValueInQuery` in entity data types so workflow filters can include an "All" option when querying entities.

### version 7.6.0
*Released*: 29 December 2025
- Copy folder access settings when copying freezers and assay designs
  - GitHub Issue #284: Freezer copy
  - GitHub Issue #305: Assay design copy

### version 7.5.1
*Released*: 24 December 2025
- Add `displaySelectedOptions` prop and respect setting when passing `selectedOptions` to the underlying `SelectInput`

### version 7.5.0
*Released*: 22 December 2025
- Chart builder updates for per-series line type option
- Chart builder option for show/hide data points for line chart type

### version 7.4.0
*Released*: 22 December 2025
- Add support for moving jobs
  - Update `EntityMoveConfirmationModal` and `EntityMoveModal` to add an optional `permissionType`, overriding the default `Insert` permission check
  - Add `JobOperation` enum and `isJobEntity` utility
  - in `userContainerUser` check that we have data for the `containerUsers` when reporting `isLoaded` state
  - export `JOB_TYPES_SCHEMA` constant
- Update punctuation for messaging in operation restrictions.

### version 7.3.2
*Released*: 15 December 2025
- ConditionalFormatOptions refactor to use ColorPickerInput

### version 7.3.1
*Released*: 13 December 2025
- Remove LSID column from provisioned sample tables
- Update `getUpdatedData()` utility method to only check for primary keys actually used in data iteration.
- Fix for LKS sample type designer issue with isValid check when metricUnit is not required

### version 7.3.0
*Released*: 10 December 2025
- CharBuilderModal: add UI for legend position

###  version 7.2.0
*Released*: 9 December 2025
- Chart builder updates for series color scale options
  - ChartColorInputs for single color geomOptions and series specific color and shape value map
  - ChartConfig measuresOptions to store per series mapping object
  - Hide and show color options based on selected chart type and measures
  - ColorPickerInput update to use fixed position by default and new DEFAULT_COLORS constant
  - Add LetterIcon for use with "Auto" set series values

###  version 7.1.1
*Released*: 8 December 2025
- Sample Amount/Units polish: part 2
  - Introduced a two-tier unit selection system (Amount Type, Display Units) in sample designer
  - Added new measurement units (ug, ng) with updated display precision for existing units
  - Added a new formsy rule `sampleAmount` for validating sample amount/units input on forms
  - Disallow large amount (>1.79769E308) for amounts input on form, editable grid, and sample storage editor

### version 7.1.0
*Released*: 3 December 2025
- ChartBuilderModal
  - Update to two-column layout
  - Add options for axis labels
  - Add options for title / subtitle
  - Add options for height / width

### version 7.0.0
*Released*: 1 December 2025
- Updates for new Workflow implementation
  - Update URLResolver to reference new controller for workflow-related actions
  - add `WORKFLOW` schema and queries and remove legacy job schema/query references
  - remove ExperimentRunResolver

###  version 6.72.1
*Released*: 25 November 2025
- QueryColumn to only apply displayWidth for multiLine columns

###  version 6.72.0
*Released*: 20 November 2025
- Default to detailed audit behavior

###  version 6.71.1
*Released*: 20 November 2025
- Sample Amount/Units polish
  - Disallow negative sample amounts: Update `getValidatedEditableGridValue` to check for negative amount values
  - Added `AmountUnitInput` to show amount/units input side-by-side on bulk add/edit

###  version 6.71.0
*Released*: 20 November 2025
- Line chart trendline options for provided parameters to CalculateCurveFit API
  - ChartBuilderModal update to include trendline option for provided parameters
  - Include new 5 Parameter nonlinear curve fit option in trendline select
  - Use column metadata displayWidth in app grid column render calcWidths

###  version 6.70.8
*Released*: 19 November 2025
- Merge from release25.11-SNAPSHOT to develop
    - includes changes from 6.68.4 #1892

###  version 6.70.7
*Released*: 18 November 2025
- Exclude plate well column lookup for identifying fields determination

###  version 6.70.6
*Released*: 18 November 2025
- Issue 52560: Need sample-type specific error for incorrect units during multi-sample-type creation
    - Build the correct lookupFilters for units validation for `insertPastedData`

###  version 6.70.5
*Released*: 13 November 2025
- Issue 54186: App actions for picklists and assay run delete don't get TransactionAuditEvent
    - Add 'auditBehavior' to insertRows, updateRows, deleteRows usages so app actions get TransactionAuditEvent

###  version 6.70.4
*Released*: 13 November 2025
- Ability to show identifying fields during assay import of a single sample type
  - Modified AssayDefinitionModel.getResultsSampleTypeQueryInfo and getSingleSampleTypeQueryInfo to allow retrieving QueryInfo from a list of sample IDs
  - Added updateColumnLookup function to mutate column lookup schema/query for EditorModel

### version 6.70.3
*Released*: 7 November 2025
- GridPanel
  - Convert tests to RTL
  - Always use userServerContext instead of optionally using getServerContext
- SelectionStatus: use useServerContext instead of getServerContext

###  version 6.70.2
*Released*: 7 November 2025
- Issue 53567: Improve "Alias" column performance
  - Update "Alias" column usages to refer to "value" instead of "displayValue" on select rows responses.

###  version 6.70.1
*Released*: 6 November 2025
- use export-tools to remove unused package exports

###  version 6.70.0
*Released*: 5 November 2025
- Package updates

###  version 6.69.0
*Released*: 5 November 2025
- Merge from release25.11-SNAPSHOT to develop
  - includes changes from 6.68.2 #1878
  - includes changes from 6.68.3 #1884

###  version 6.68.4
*Released*: 18 November 2025
- GitHub Issue 111: Query metadata editor indicates all fields as "New Field"
  - use the field.lockExistingField property to determine if field is new or existing

###  version 6.68.3
*Released*: 4 November 2025
- Issue 53983: Sort fields by caption
- Issue 53927: Adjust column view layout to wrap

###  version 6.68.2
*Released*: 3 November 2025
- SVGChart: render curve fit statistics when available

### version 6.68.1
*Released* 2 November 2025
- Issue 52063: Domain designer to handle lookup to a query with a pipe character
  - don't just split on '|', as the queryName could contain '|' characters

### version 6.68.0
*Released* 2 November 2025
- Add auditing of what method was used for CRUD
  - Modified api.query.insertRows/updateRows/deleteRows/saveRows and moveEntities to accept and process editMethod parameter and record request hash in 'requestSource`

### version 6.67.3
*Released*: 1 November 2025
- Issue 54160: Non US date parsing in the app
  - Added `getAltNonUSParseFormats` date utility function to provide alternative parse formats for common non-US date/datetime formats
  - Update DatePickerInput to use alternative parse formats when server date format is non-US
  - Update parseDate utility function to use alternative non-US parse formats

### version 6.67.2
*Released* 31 October 2025
- Issue 53449: resolve lineage items from container path
  - Refer to `item.containerPath` instead of `item.container` in lineage details

### version 6.67.1
*Released* 29 October 2025
- Issue 53563: Domain designer lookups don't show newly added entity types after initial load/view
  - Remove fetchQueries from client cache

### version 6.67.0
*Released* 29 October 2025
- Issue 52310: Change application single-value dropdowns to include the current value in the listed options

### version 6.66.0
*Released*: 23 October 2025
- ChartBuilderModal support for bar/line chart aggregate method and error bar options
  - useOverlayTriggerState update to not close popover on document click that is a select option target
  - Factor ChartFieldRangeScaleOptions.tsx out of ChartFieldOption.tsx
  - Create ChartFieldAggregateOptions.tsx and move y-axis bar chart aggregate method dropdown into tooltip
    - support for error bar radio options as separate overlay or to be included in axis options overlay
  - Update ChartBuilderModal to pass down aggregate and error bar options to ChartConfig

### version 6.65.2
*Released*: 22 October 2025
- Various minor fixes for exception reports

### version 6.65.1
*Released*: 20 October 2025
- SelectionStatus null check for rowCount

### version 6.65.0
*Released*: 20 October 2025
- QueryModel: remove selectedReportId, add selectedReportIds
- withQueryModels: update selectReport, add clearSelectedReports
- ChartMenu: support multiple report selections
- Add ChartList

### version 6.64.3
*Released*: 13 October 2025
- Search: escape all quotes in search terms

### version 6.64.2
*Released*: 10 October 2025
- Issue 52878: Attachment thumbnails from ancestor columns not rendered in Sample Type grid
  - Modify `AncestorRenderer` and `MultiValueRenderer` to handle file/attachment columns

### version 6.64.1
*Released*: 9 October 2025
- Issue 53997: Establish a maximum size for query selections

### version 6.64.0
*Released*: 9 October 2025
- AssayDefinitionModel: add plateEnabled flag
- Fix circular dependency caused by IQueryColumn interface

### version 6.63.2
*Released*: 8 October 2025
- Issue 53324: LKSM: Custom Grid View Column Limit
  - Don't serialize ViewInfoJson.fields

### version 6.63.1
*Released*: 8 October 2025
- Filter.actionValueFromFilter fix to move decode columnName out of getDisplayValue()

### version 6.63.0
*Released*: 7 October 2025
- Issue 53934: Remove stored amount "too precise" validation check on setting amount modal
  - remove isValuePrecisionValid() and the related isPrecisionValid()
  - use amount value instead of displayValue for EditableGrid and SampleAmountEditModal

### version 6.62.8
*Released*: 3 October 2025
- Issue 53328: AssayDefinitionModel.hasLookup to only consider the first sample lookup column for assay import cases

### version 6.62.7
*Released*: 29 September 2025
- Enumerate plate, plate set auditing events
- Introduce `isQueryUpdateEvent` to flag which events are backed by query audit events

### version 6.62.6
*Released*: 29 September 2025
- Issue 53979: TextInput to handle non-finite numeric values
  - don't set input type = "number" since it will drop non-finite values

### version 6.62.5
*Released*: 26 September 2025
- Issue 53957: Update error messaging to be more precise

### version 6.62.4
*Released*: 26 September 2025
- Issue 53036: LKSM: Aliquot registration event in timeline polish
  - Display "inherited" instead of NA for aliquot's parent fields in timeline view

### version 6.62.3
*Released*: 18 September 2025
- Workflow: Change Required Template Fields to be Required at the start of a Job
  - Update required field label display to show overlay before asterisk
  - Fix CheckBoxInput required field display on Formsy forms
  - Add optional `colFieldKeyMap` param to `flattenValuesFromRow` to convert field names to field keys

### version 6.62.2
*Released*: 16 September 2025
- Issue 53926: Move custom assay queries to assay schema

### version 6.62.1
*Released*: 16 September 2025
- EditableColumnMetadata cleanup of unused getFilteredLookupKeys and linkedColInd props

### version 6.62.0
*Released*: 15 September 2025
- Sample Type Amounts and Units updates for Quantity
  - remove unused amount and unit conversion code from measurement.ts and remove the `UnitsModel.add` method
  - Update language in `AuditDetails`
  - `BASE_UNITS` -> `UNITS_KIND` and add `baseUnit` field to match server-side concept
  - Update `StorageAmountInput` usages to allow clearing of the unit select input value
  - Update `AuditDetails` to be able to display provided delta amounts
  - Remove StoredAmountRenderer
  - Allow for "Units" column to be filterable in the various samples grids
  - BulkUpdateForm getUpdatedData() to include both amount and units values when either has been changed
  - `SampleAmountInput` update preferred unit message
  - `SampleAmountEditModal` updated so all users go through `updateSampleStorageData`
  - Mark `RawAmount` and `RawUnits` as ignored system fields

### version 6.61.1
*Released*: 12 September 2025
- DatePickerInput: don't add milliseconds when entering current time (Issue 53577)

### version 6.61.0
*Released*: 8 September 2025
- QueryModel.getSelectedIds: optimize when filterIds are not passed
- EntityMoveModal: Don't use selectionKey, simplify props, improve error messaging
- Refactor PicklistEditModal, ChoosePicklistModal
  - Don't rely on selectionKey
  - Don't rely on QueryModel
- Add usePicklistSelections to get rid of duplicate selection loading logic
- Update AddToPicklistMenuItem, PicklistCreationMenuItem
- BulkUpdateForm
  - Remove props: header, onSubmitForEdit, sortString
  - Rename props: pluralNoun, singularNoun -> nounPlural, nounSingular
  - Add props: aliquots, sampleOperation, editStatusData
  - Render errors
- QueryAPIWrapper: remove getSelection
- EntityServerAPIWrapper.getCrossFolderSelectionResult: remove useSnapshotSelection argument

### version 6.60.1
*Released*: 3 September 2025
- Issue 53742: Sample Manager: Unable to perform actions from various pages on sample type with a '/'
  - Update `createQueryModelId` to use encode schema/query

### version 6.60.0
*Released*: 3 September 2025
- Issue 53801: Filter out columns for validation where `isAncestorInput()` is true

### version 6.59.0
*Released*: 29 August 2025
- Support string values for `FileInput` so that values can be round-tripped.
- Removed unused `QueryInfo.getColumnFieldKeys()`
- Remove unused `QueryModel.getRow()` property `flattenValues`

### version 6.58.8
*Released*: 29 August 2025
- Issue 53773: Updating a field whose name contains a space via file will silently be ignored if the space is not included in the file
  - Stop aggressively infer column based on removed internal spaces

### version 6.58.7
*Released*: 29 August 2025
- Update default audit level
  - Add `Assay Result Events` audit event type

### version 6.58.6
*Released*: 26 August 2025
- Merge from release25.7-SNAPSHOT to develop
    - includes changes from 6.53.4 #1843

### version 6.58.5
*Released*: 14 August 2025
- Issue 52026 and 51862: Reduce the logging for calculated expression column SQL errors
  - add comment tag to executeSql query to indicate it is from a calculated column validation
  - use string value compatible with CAST to NUMERIC for parseCalculatedColumn() temp data

### version 6.58.4
*Released*: 12 August 2025
- Adding new parent alias on designer doesn't always add to the bottom of the list

### version 6.58.3
*Released*: 7 August 2025
- Add `StoragePositionNumber` as a sample storage column

### version 6.58.2
*Released*: 6 August 2025
- GitHub Issue 788: LKSM Default sample lookup for assay design should default to lookupIsValid

### version 6.58.1
*Released*: 5 August 2025
- File handling - File path related issue bundle
  - Invalid file (that exist but isn't accessible) should show red triangle icon

### version 6.58.0
*Released*: 4 August 2025
- GitHub Issue 783: Hide domain designer field Advanced Settings that are not currently implemented in app
- GitHub Issue 788: Domain Designer better handling of invalid lookup query value for Sample data type

### version 6.57.0
*Released*: 30 July 2025
- Add file system audit events for apps
- Add `TransactionAuditIdRenderer` for displaying link to page of audit records associated with a transaction id

### version 6.56.3
*Released*: 24 July 2025
- Address Issue 53366 by not putting `undefined` into `List<ValueDescriptor>`
- Address Issue 53443 by fixing where we check for optional prop
- Export `ValueDescriptor` for external usage
- Update `NameIdSettings`, `BarTenderSettingsForm` and `ManageSampleStatusesPanel` to use app context for api

### version 6.56.2
*Released*: 21 July 2025
- Issue 53451: JS error when deleting numeric filter values with Between operator
- Fixes for filter modal Between operator handling of empty inputs and leading/trailing spaces
- Fixes for trimming values for any non-CONTAINS filter operators

### version 6.56.1
*Released*: 18 July 2025
- null checks for exceptions reported to Mothership

### version 6.56.0
*Released*: 11 July 2025
- Package updates

### version 6.55.0
*Released*: 10 July 2025
- makeCommaSeparatedString: Add lastSeparator and postfix args, export

### version 6.54.3
*Released*: 10 July 2025
- Issue 52657: LKSM: We shouldn't allow creating sample names that differ only in case
  - Use original case in duplicate name error message

### version 6.54.2
*Released*: 9 July 2025
- Merge from release25.7-SNAPSHOT to develop
    - includes changes from 6.53.1 #1824
    - includes changes from 6.53.2 #1823
    - includes changes from 6.53.3 #1825

### version 6.54.1
*Released*: 8 July 2025
- Issue 53134: Set dirty bit after adding uniqueId field

### version 6.54.0
*Released*: 3 July 2025
- ProductMenu shows 'Dashboard' instead of 'Storage' as subtitle in FM /home route
- Issue 53371: Find Samples by ID JS error when clicking "Find Samples" button without entering anything into the text area

### version 6.53.4
*Released*: 21 August 2025
- SamplesAPIWrapper: add sort arg to getSelectionLineageData
  - Issue 53702: Selection order is not retained when editing multiple samples in grid

### version 6.53.3
*Released*: 7 July 2025
- Issue 53394: FileInput revert removal of the "-fileUpload" suffix from inputId

### version 6.53.2
*Released*: 3 July 2025
* Issue 53141: Should set a dirty bit when setting or updating the hit selection criteria for an assay

### version 6.53.1
*Released*: 3 July 2025
- Issue 53153: Disable value validation for expInput, aliquotParent columns

### version 6.53.0
*Released*: 1 July 2025
- Remove AssayResultsForSamplesButton, AssayResultsForSamplesMenuItem
  - moved to ui-premium
- Add createSnapshotSelectionKeyStr
- Remove getJobCreationHref
- Remove getSelectedSampleIdsFromSelectionKey
- Remove getURLParamsForSampleSelectionKey
- getLookupRowIdsFromSelection: Add optional keyColumn arg
- Export getSamplesTestAPIWrapper

### version 6.52.5
*Released*: 30 June 2025
- Issue 53360: Pass user comment through after naming pattern warning

### version 6.52.4
*Released*: 30 June 2025
- Issue 53118: Filter modal change to multiValue type to account for numeric value when parsing

### version 6.52.3
*Released*: 27 June 2025
- GitHub Issue 787: DomainField JSON file import should respect required boolean for SampleId field
- Issue 53325: withQueryModels to use col fieldKey instead of name when setting omittedColumns for errant calculated fields

### version 6.52.2
*Released*: 27 June 2025
- Issue 53326: Don't filter `QuerySelect` in `PrintLabelsModal`
- Issue 53213: Defensive check for view `sorts` array

### version 6.52.1
*Released*: 25 June 2025
- Issue 53120: remove processRequest, use getCallbackWrapper

### version 6.52.0
*Released*: 24 June 2025
- Improve ExecuteSql endpoint wrapper. See #1813.

### version 6.51.0
*Released*: 23 June 2025
- SampleAliquotViewSelector, GridAliquotViewSelector: Fix props types
- SampleTypeAppContext:
  - Remove SampleGridButtonComponent, SamplesTabbedGridPanel, getSamplesEditableGridProps, getWorkflowGridQueryConfigs,
    SampleStorageButtonComponent, WorkflowGridComponent
  - Add omitParentAliases
- useLoadableState: call load function if loader changes
- Remove SampleGridButtonProps
- Remove SamplesTabbedGridPanelComponentProps
- Remove EditableGridLoaderFromSelection
- withQueryModels: resave settings when loading without filters
  - This prevents unexpected grid state in our apps when navigating after creating and editing rows

### Version 6.50.1
*Released*: 23 June 2025
- Issue 53267: Display 0 values for identifying fields

### version 6.50.0
*Released*: 18 June 2025
- Update ESLint configuration and depend on `@labkey/eslint-config`

### version 6.49.2
*Released*: 17 June 2025
- GitHub Issue 748: "View Assay Results for Selected" gives error when no rows have sample IDs

### version 6.49.1
*Released*: 16 June 2025
- GH Issue 796: App assay Samples > Find Derivatives in Sample Finder not working for field with special characters
  - update getLegalIdentifier to include separator param
  - FindDerivativesMenuItem update to allow titleCol prop to be passed in
- GH Issue 740: Disable "Find Derivatives in Sample Finder" if grid has no rows

### version 6.49.0
*Released*: 11 June 2025
- Remove SOURCE_TYPE_KEY constant

### version 6.48.1
*Released*: 10 June 2025
- Update `AppLink` to extend all props of `AnchorHTMLAttributes`
- Update `MenuItem` to use `AppLink`
- Update all usages of `MenuItem` to pass `AppURL` where possible

### version 6.48.0
*Released*: 9 June 2025
- Issue 52556: Add data-fieldkey attribute to grid header elements and input elements (part 2)
  - FileInput: drop the "-fileUpload" suffix from inputId
  - EntityParentType model not to use capitalizeFirstChar() in generateFieldKey()
  - EntityParentType model to set fieldKeyPath in generateColumn()

### version 6.47.0
*Released*: 6 June 2025
- Issue 52595: Storage editor check in fails if user doesn't have perm to update sample amount/units
  - export updateSampleStorageData() and SampleStorageData
  - add isDiscard param to updateSampleStorageData()

### version 6.46.1
*Released*: 6 June 2025
- Issue 53071: Entering more than three digits for milliseconds in a time field causes the value to disappear
- Issue 52820: Sample Manager: editing datetime/time fields in app with display format could result in time precision loss
  - Updated `parseTime` util to be more flexible
  - Added `getPickerFormatWithPrecision` util that respects both field's format and selected date/time precision

### version 6.46.0
*Released*: 4 June 2025
- Issue 52527: Implement new method for determining primary app id

### version 6.45.1
*Released*: 3 June 2025
- Issue 52959: LKSM/LKB: Existing file not shown in Bulk Edit
  - Update `getCommonDataValues` to retain full data map for file fields
  - Update `FileInput` to set init value so diff can be generated correctly

### version 6.45.0
*Released*: 2 June 2025
- Export Loader type
- DataTypeSelector: Fix react key error

### version 6.44.4
*Released*: 2 June 2025
- QueryModel: add isQueryInfoLoaded
- withQueryModels: be more defensive when loading rows and total count

### version 6.44.3
*Released*: 28 May 2025
- Issue 52925: App export to csv/tsv ignores filter with column containing double quote
  - Add `encodeFormDataQuote` util to encode `"` and its encoded form `%22`
  - Encode form params for exportRows actions

### version 6.44.2
*Released*: 28 May 2025
- Issue 53164: AssayPicker.tsx gives JS error if no specialty assay providers available for server

### version 6.44.1
*Released*: 28 May 2025
- Introduce `getTransferItemDirectoryEntry` to centralize handling/wrapping of calling `webkitGetAsEntry()` on a `DataTransferItemList` item.
- Address Issue 53149 by updating endpoint wrapper to be tolerant of invalid payload upon success.

### version 6.44.0
*Released*: 27 May 2025
- QueryModel/QueryConfig change useSavedSettings from boolean to enum SavedSettings
  - Consumers can now opt into 'none', 'all', or 'noFilters'

### version 6.43.3
*Released*: 26 May 2025
- Migrate `isSetEqual` to `@labkey/components`. Extend with additional support for deep comparison.

### version 6.43.2
*Released*: 23 May 2025
- Add detailed auditing of domain changes & comment ability
    - include `CommentTextArea` in `BaseDomainDesigner` for supplying user provided comment for domain updates
    - wire up `auditUserComment` for `SampleTypeDesigner`, `DataClassDesigner` and `AssayDesignerPanels`

### version 6.43.1
*Released*: 23 May 2025
- Issue 53055: Check for multiple values in single value column

### version 6.43.0
*Released*: 22 May 2025
- AppURL
  - make container and product aware
  - add fromMenuUrl static method
- Add AppLink
  - Use AppLink any time you need
- Add useAppNavigate
  - Use this when you need to navigate, instead of ReactRouter navigate
  - Can handle navigating to locations outside of our apps
- DefaultRenderer: Use AppLink
  - Issue 53021: Grid Column Renderers can break the back button on pages using useRouteLeave
- NavItem: Use AppLink
- Remove createProductUrl
- Remove createProductUrlFromParts
- Remove createProductUrlFromPartsWithContainer
- Remove getHref
- Rename ProductClickableItem to ProductNavigationItem
- ServerNotificationsConfig: remove unnecessary attributes
- ServerActivityList: convert to FC, use AppLink

### version 6.42.0
*Released*: 14 May 2025
- Issue 52934: Filter unit options when updating a type that has samples with units

### version 6.41.0
*Released*: 12 May 2025
- Issue 52773: Update `QuerySelect` to manufacture selectable items for not found results.
- Dynamically recompute warning and continue to display until unresolved values are no longer "selected".
- Revise`quoteValueColumnWithDelimiters` to only modify `value` and `displayValue` when necessary. Stop mutating/removing other properties.
- `SelectInput`: Support "notFound" styling for multi-value selected options

### version 6.40.2
*Released*: 6 May 2025
- Issue 52773: display warning for unresolved form lookup values

### version 6.40.1
*Released*: 6 May 2025
- Issue 52556: Add data-fieldkey attribute to grid header elements and input elements

### version 6.40.0
*Released*: 5 May 2025
- Issue 52504: Expose validate lookup setting for sample lookup and turn on by default

### version 6.39.1
*Released*: 2 May 2025
- Issue 52979: App grid customize view doesn't expand lookup field with special char
- Issue 52472: Re-clicking the Source Types, Sample Types or Assay links in the mega menu removes the sort=Name parameter from the url
- Customize view available field data-fieldkey attribute to use encoded fieldKey values

### version 6.39.0
*Released*: 2 May 2025
- Export `getSourceDomainDefaultSystemFields`

### version 6.38.2
*Released*: 30 April 2025
- Remove remnants of Edit with Grid from Bulk Edit modal
  - Remove unneeded parameters for `EditableGridLoaderFromSelection` and `convertQueryDataToEditorData`

### version 6.38.1
*Released*: 24 April 2025
- Issue 52929: App hit selection summary grid doesn't render hit selection check icon if assay name ends with colon

### version 6.38.0
*Released*: 23 April 2025
- Issue 52326: Copy/paste of date values across cells changes date formats
- Add deprecation comment to getSnapshotSelections
- Add createSnapshotSelectionKey and createOrderedSnapshotSelectionKey to Query APIWrapper

### version 6.37.0
*Released*: 21 April 2025
- Package Updates

### version 6.36.6
*Released*: 21 April 2025
- Fix `SchemaQuery.parseSelectionKey` to account for view name in selection key

### version 6.36.5
*Released*: 18 April 2025
- Issue 52156: Editable grid cell with dropdown loses first input character
  - SelectInput: load async `defaultInputValue` when provided.
  - QuerySelect: start with model, support deferred searches. No more `null` render cycles.
  - Defer clearing cell `recordedKeys` so that they are utilized for the `defaultInputValue` of select input cells.

### version 6.36.4
*Released*: 17 April 2025
- Issue 52536: Sample Manager: time format HH:mm:ss.SSS issues
  - update `getJsonTimeFormatString` to use `ISO_LONG_TIME_FORMAT_STRING`
  - initializing datepicker selection of time to have 0 millisecond
  - fix detail editing ignoring seconds and milliseconds
  - fix bulk add to editable grid with wrong time format

### version 6.36.3
*Released*: 15 April 2025
- Use `fromZonedTime` from `date-fns` package to compare dates against server dates in `isDateTimeInPast` utility function.
- Check legend data exists in `HorizontalBarSection`
- Convert `ItemsLegend` to a functional component

### version 6.36.2
*Released*: 11 April 2025
- Issue 52321: LKSM/LKB: Edit Lineage grid should show Parent or Source columns with aliases by default
  - add `additionalParentTypes` param to `getOriginalParentsFromLineage`
  - add `omitParentAliases` to `LineageEditableGridProps`

### version 6.36.1
*Released*: 11 April 2025
- Issue 52780: URLResolver assay fix for handling splitting of assay URL to account for protocol name with consecutive periods or ending in period

### version 6.36.0
*Released*: 10 April 2025
- FolderAPIWrapper.getMultipleDataTypeExcludedContainers: return cache friendly result
- createSnapshotSelectionKey: use a separator between the original key and the uuid
- Add createOrderedSnapshotSelectionKey
- SchemaQuery.parseSelectionKey: Support snapshot selections
- Remove saveOrderedSnapshotSelection

### version 6.35.2
*Released*: 10 April 2025
- Merge from release25.4-SNAPSHOT to develop
  - includes changes from 6.34.5 #1770

### version 6.35.1
*Released*: 9 April 2025
- Issue 52667: null value for amount should remain undefined
- Add spacing between file icon and name in `FileAttachmentEntry` and `FileInput` components
- Issue 52275: Limit length of custom label on fields to 200

### version 6.35.0
*Released*: 4 April 2025
- Issue 47595: Manage Sample Statuses page in LKS should not allow adding new status in child folder
- Add null check for ConfirmImportTypes

### version 6.34.5
*Released*: 7 April 2025
-  Issue 52737: Drag/Fill modifying cells outside of the drag/fill range of cells

### version 6.34.4
*Released*: 2 April 2025
- Issue 52050: App chart builder modal to handle field names with special characters in input selection

### version 6.34.3
*Released*: 1 April 2025
- Issue 52532: better messaging for ignored fields from files

### version 6.34.2
*Released*: 1 April 2025
- Merge from release25.3-SNAPSHOT to develop
    - includes changes from 6.26.8 #1761
    - includes changes from 6.26.9 #1760

### version 6.34.1
*Released*: 28 March 2025
- Issue 52311: Mark unresolved lookup values in editable grid with a warning

### version 6.34.0
*Released*: 28 March 2025
- Add `createSnapshotSelectionKey`
  - Used to snapshot selections for a given QueryModel without needing to use the server side snapshot API or
  useSnapshotSelections flag

### version 6.33.0
*Released*: 28 March 2025
- Issue 52068: Filtering on a value with a semicolon is incorrectly displayed in the filter modal facet filter listing
  - getFilterValuesAsArray to account for multivalued filter types before splitting string value
  - FilterExpressionView to handle value array for showing multivalued filter type textarea

### version 6.32.2
*Released*: 25 March 2025
- Issue 52608: Field names for calculated column validation need to escape quotes in executeSql query

### version 6.32.1
*Released*: 25 March 2025
- Merge from release25.3-SNAPSHOT to develop
    - includes changes from 6.26.7 #1749

### version 6.32.0
*Released*: 24 March 2025
- Add `test-to-file` script
- `Cell`: ignore readOnly state when handling certain events
- Update `dragFillEvent` to detect and apply padding during drag fill
  - Issue 52253: Editable grid drag and fill removes internal zeros
  - Issue 51584: Editable grid does not delete values in fields if drag-select started in a read-only field
- Update `dragFillEvent` to generate a TSV then use our underlying paste handling code to insert the drag filled data
  - Issue 52347: EditableGrid: Drag filling Sample IDs doesn't resolve samples
  - Issue 52412: EditableGrid: Drag Filling Lookups with special characters doesn't work
- `EditableGrid`: pass queryFilters when rendering bulk add
  - Issue 52371: Bulk Add Units list isn't filtered to match Sample Type when inserting samples

### version 6.31.12
*Released*: 21 March 2025
- Issue 52477: Sample workflow custom fields: edit field inline with special characters
- Issue 52511: Sample Manager: Workflow custom time only field fails to clear value
- Issue 52282: Job/Task dates get shifted when client is in a different time zone
- Issue 52543: Sample Manager: lookup field that looks up to a list with auto key and field containing special character fails to resolve lookup values

### version 6.31.11
*Release*: 19 March 2025
- Issue 51982: QueryModel useSavedSettings requires containerPath to be set
  - to prevent inadvertent cross-folder saved settings from being applied
  - applySavedSettings in withQueryModels for both the initModels case and the addModel case
- Issue 52509: TemplateDownloadButton fix to pass openInTab = true
- Issue 52147: Customize View modal fix to get out of column title edit mode to allow for column reorder

### version 6.31.10
*Release*: 19 March 2025
- Merge from release25.3-SNAPSHOT to develop
    - includes changes from 6.26.6 #1750

### version 6.31.9
*Release*: 18 March 2025
- Expose `enabled` as a public property on `LabelPrintingContextProps`. Default test environment context to `false`.
- Support initialization of `enabled` in `LabelPrintingContextProvider`.
- Default `canPrintLabels` to `false`

### version 6.31.8
*Release*: 18 March 2025
- Issue 52264: Include `viewName` when building query parameters for QueryController selectX actions
- Issue 52189: don't show option to validate user lookups

### version 6.31.7
*Released*: 17 March 2025
- Issue 52533: LKSM: Error creating samples from details pages with Sources with a colon in the name
  - Move createEntityParentKey from premium and switch to use '|' for schema|query|keyValue delimiter
  - Add parseEntityParentKey util

### version 6.31.6
*Released*: 13 March 2025
- Issue 52430: Sample Manager: sample names with newline characters

### version 6.31.5
*Released*: 13 March 2025
- Issue 52367: Don't show name generation message when editing a name

### version 6.31.4
*Released*: 12 March 2025
- Merge from release25.3-SNAPSHOT to develop
    - includes changes from 6.26.4 #1735
    - includes changes from 6.26.5 #1741

### version 6.31.3
*Released*: 10 March 2025
- Add `isTestEnv()` and `setIsTestEnv()` methods which allow for external packages to configure `@labkey/components`
  as running in a test environment.

### version 6.31.2
*Released*: 10 March 2025
- Fix breadcrumb separator scss to apply to .app-body and .li-modal

### version 6.31.1
*Released*: 9 March 2025
- Clean up smart quotes usages

### version 6.31.0
*Released*: 7 March 2025
- Bump api-js
- QueryFormInputs
    - Fix React Keys error
    - Allow file changes for cross-folder selections

### version 6.30.0
*Released*: 6 March 2025
- Template download button updates

### version 6.29.0
*Released*: 6 March 2025
- APIKeysPanel: refactor component
  - Underlying grid can always expect a grid model

### version 6.28.0
*Released*: 4 March 2025
- withQueryModels: add onModelChange to Actions
  - onModelChange is an action to call after a user has done something to alter the underlying data for a QueryModel
    e.g. delete or update rows
- `getGridIdsFromTransactionId`: actually return strings

### version 6.27.0
*Released*: 4 March 2025
- Issue 52072: Text choice field values to handle | character within values
  - PropertyValidator.joinValidValues() and PropertyValidator.splitValidValues()

### version 6.26.9
*Released*: 31 March 2025
- Issue 52616: LKSM: When two lineage alias columns are in a file we silently ignore one
  - Add warning about duplicate columns in file preview panel
  - Show duplicate columns in preview grid

### version 6.26.8
*Released*: 28 March 2025
- Issue 52658:
  - Use raw values for units and stored amounts in `BulkUpdateForm`
  - Don't show text about "Edit with Grid" if that button won't be shown

### version 6.26.7
*Released*: 20 March 2025
- Update `ISO_DATE_TIME_FORMAT_STRING` constant to match server.
- Export JSON date format utility functions from the package.

### version 6.26.6
*Released*: 18 March 2025
- Issue 52535: Don't match lineage columns to raw column captions

### version 6.26.5
*Released*: 7 March 2025
- Issue 52477: Sample workflow custom fields: edit field inline from Job Overview page doesn't save lookup fields with special characters

### version 6.26.4
*Released*: 5 March 2025
- Issue 51091: Product menu endpoints return objects
- define `SuccessDataResponse<T>` to ease adding typing for endpoint response payloads

### version 6.26.3
*Released*: 25 February 2025
- Issue 52341: App chart render queryConfig to support parameterized queries

### version 6.26.2
*Released*: 25 February 2025
- Issue 52304: Sample Manager: Edit Lineage in grid not saving updates if names contains comma

### version 6.26.1
*Released*: 24 February 2025
- Issue 52337: ensure that items being excluded from view customization are fields, not ancestor nodes

### version 6.26.0
*Released*: 21 February 2025
- Issue 51877: Allow calculated fields for list title column

### version 6.25.0
*Released*: 19 February 2025
- Add new `InternalSpacesWarning` component to warn when values contain multiple spaces between words
- Use component in `EntityDetailsForm`, `QueryFormInputs`, `AssayPropertiesInput`, and `TextInput`
- Do some more error message resolution

### version 6.24.2
*Released*: 18 February 2025
- Issue 52167: Update isCalculatedFieldsEnabled() check for LKS distributions

### version 6.24.1
*Released*: 18 February 2025
- Issue 52092: Introduce useContainerPath

### version 6.24.0
*Released*: 17 February 2025
- Bump `@labkey/api` and `@labkey/build`.
- Distribution now includes source maps.

### version 6.23.1
*Released*: 14 February 2025
- Misc 25.3 fixes
  - Issue 52228: App using an Identifying field that's required errors during sample import
  - Issue 52230: App broken link under Calculated Columns data field hover tooltip

### version 6.23.0
*Released*: 13 February 2025
- Remove usages of encodePart when dealing with data rows for update cases
  - EditableGridLoaderFromSelection not to encodePart() in the data rows, leave keyed by column name as it comes from server
  - BulkUpdateForm not to encodePart() when comparing with original data, use QueryInfo to lookup column instead
  - Fix up sample aliquot-only vs sample-only fields to use fieldKey instead of name
  - getSampleIdentifyingFieldGridData() to use column.index instead of column.name for the key

### version 6.22.4
*Released*: 12 February 2025
- Issue 51973: LIMS: Only one person's updates to templates are saved if two admins are working concurrently

### version 6.22.3
*Released*: 12 February 2025
- Merge from release25.2-SNAPSHOT to develop
    - includes changes from 6.20.3 #1714

### version 6.22.2
*Released*: 11 February 2025
- LKSM: Add numbered cells for terminal storage
  - fix style for Storage properties panel radio button position
  - add StoragePositionNumber field to SampleFinder filter cards

### version 6.22.1
*Released*: 11 February 2025
- Issue 52193: Update `QueryColumn.isImportColumn` to match on caption fully stripped of spaces

### version 6.22.0
*Released*: 7 February 2025
- Only show 'Discussion Threads' Advanced Setting in Lists if relevant Deprecated Feature is turned on

### version 6.21.3
*Released*: 6 February 2025
- Add displayName to various components
- LockIcon: remove unused prop, add displayName, format code
- Remove ValueList
- AutoLinkToStudyDropdown: improve formatting, use memo

### version 6.21.2
*Released*: 6 February 2025
- AppContext cleanup of components that can now be directly imported from ui-premium (previously cross subpackage)
  - includes AddSamplesToStorageModalComponent, JobsButtonComponent, ReferencingNotebooksComponent, SampleStorageLocationComponent, SampleStorageMenuComponent

### version 6.21.1
*Released*: 5 February 2025
- Issue 52143: Grid paging parameter in URL is not always respected
  - Fix how we parse the URL to calculate page offset

### version 6.21.0
*Released*: 4 February 2025
- Issue 52151: resolve assay batches/runs from search results
- Resolve an icon for assay batch and assay run search results

### version 6.20.3
*Released*: 11 February 2025
- Issue 52197: use current container when querying for groups with permissions for job and task assignments

### version 6.20.2
*Released*: 31 January 2025
- Merge from release24.11-SNAPSHOT to develop
    - includes changes from 5.20.7 #1705

### version 6.20.1
*Released*: 30 January 2025
- Issue 52007: Filtering blank with more than 250 options won't show check mark

### version 6.20.0
*Released*: 30 January 2025
- Fix Issue 51909: Hit Selection Dialog should show field-modal__field_dot next to fields that have criteria
- Fix Issue 51421: Inconsistent behavior when hitting `Shift` + `Home/End` in the editable grid
- Fix Issue 51897: Grid loses paging control and shows "No data" when samples in a filtered view are updated
  - We now render pagination buttons when the user is out of bounds, and the previous button goes to the last page
- EditInlineField: Add optional validation props for date fields
- Convert Pagination to FC
- Convert Pagination, PageMenu, PageinationInfo tests to RTL

### version 6.18.2
*Released*: 29 January 2025
- Merge from release25.1-SNAPSHOT to develop
    - includes changes from 6.10.3 #1700

### version 6.18.1
*Released*: 29 January 2025
- Issue 39517: Assay importRun to include display value in the row data for sample lookup columns

### version 6.18.0
*Released*: 29 January 2025
- QueryModel: rename getSelectedIdsAsInts to intSelections, convert to `get` method
- Fix types for "sampleIds" variable
    - Despite being typed as string[] it is actually always number[]
- Rename getFieldLookupFromSelection to getLookupRowIdsFromSelection

### version 6.17.3
*Released*: 28 January 2025
- Issue 52082: default `SearchPanel` to `encodeQuotes: true`

### version 6.17.2
*Released*: 27 January 2025
- Ability to Edit Sample IDs in the Grid
  - Add `canEditName` to `OperationConfirmationData`

### version 6.17.1
*Released*: 26 January 2025
- Issue 52066: LKSM: Editing aliquots in UI is treated as parent samples if the default grid view as a saved filter on IsAliquot field

### version 6.17.0
*Released*: 23 January 2025
- Add support for conditional formatting in LIMS and SDMS products
  - Update `DefaultRenderer`, `UserDetialsRenderer` and `AttachmentCard` to use provided conditional formatting
  - Add utility method `getDataStyling` for use in other components

### version 6.16.0
*Released*: 20 January 2025
- Update Assay Design Transform Script config to include 'Run on Import/Edit' boolean options

### version 6.15.0
*Released*: 20 January 2025
- Export useLoadableState
- Add useModalState

### version 6.14.1
*Released*: 17 January 2025
- Workflow, Group Assignment & Notifications
  - Add `groups` to User model
  - Fix `SelectInput.initOptions` when options have subgroups
  - Modify `FetchGroups` to check permissions
  - Modify `UserSelectInput` to include groups

### version 6.14.0
*Released*: 16 January 2025
- Remove getDisambiguatedSelectInputOptions

### version 6.13.0
*Released*: 16 January 2025
- Add `OptionComponent` prop to `QuerySelect` in replacement of the `optionRenderer` prop which furnishes more useful props to the option rendering component.
- Update `request` options to exclude `scope` and extend `Ajax.RequestOptions`. Package export `request`.
- Introduce `useTimeout` hook that wraps timeout functionality for React components.
- Add `abortOnDismount` optional parameter to the `useRequestHandler` hook so that requests can be aborted automatically when the hook is dismounted.
- Remove unused utilities `intersect` and `toLowerReducer`.

### version 6.12.0
*Released*: 15 January 2025
- Issue 51908: increase precision for stored amounts to nanoliters and nanograms

### version 6.11.6
*Released*: 15 January 2025
- Merge from release25.1-SNAPSHOT to develop
    - includes changes from 6.10.2 #1689

### version 6.11.5
*Released*: 10 January 2025
- Issue 51824: TSV/CSV file import ignore lines that start with #
- Issue 51918: : Sample Manager: default import template downloaded from samples types listing grids doesn't include import alias column

### version 6.11.4
*Released*: 9 January 2025
- Issue 51679: App grid header click to find parent TH element if hovering over child element

### version 6.11.3
*Released*: 9 January 2025
- Support 'isActive' prop for NavItem and ITab

### version 6.11.2
*Released*: 8 January 2025
- Merge from release25.1-SNAPSHOT to develop
    - includes changes from 6.10.1 #1678

### version 6.11.1
*Released*: 3 January 2025
- Issue 49044: Add mega-menu back to Admin pages

### version 6.11.0
*Released*: 3 January 2025
- Issue 51879: App grid column header click area above column title should open the menu

### version 6.10.3
*Released*: 28 January 2025
- Merge from release24.11-SNAPSHOT to release25.1-SNAPSHOT
  - includes changes from 5.20.6

### version 6.10.2
*Released*: 14 January 2025
- Merge from release24.11-SNAPSHOT to release25.1-SNAPSHOT
  - includes changes from 5.20.5 #1686

### version 6.10.1
*Released*: 3 January 2025
- Fix cross folder import templates

### version 6.10.0
*Released*: 30 December 2024
- Customizable File Templates for Sources, Sample Types & Assay Designs
  - Add `ProductFeature.CustomImportTemplates`
  - Modify `FileInput` to support file size validation
  - Update TemplateDownloadButton and TemplateDownloadRenderer to query for saved custom templates

### version 6.9.0
*Released*: 30 December 2024
- Update AddEntityButton with new parameter
- Add `getMultipleDataTypeExcludedContainers` to `FolderAPI`.
- Add optional `className` prop to `DeleteIcon`
- export ensureAllFieldsInAllRows for usage in saveRowsByContainer

### version 6.8.2
*Released*: 27 December 2024
- Issue 51816: pasted values from spreadsheet retain new lines and look invalid

### version 6.8.1
*Released*: 23 December 2024
- MultiValueRenderer update for string values wit \n characters, to use white-space CSS to preserve them

### version 6.8.0
*Released*: 19 December 2024
- Add FilterCriteriaRenderer
- Add FilterCriteriaModal
- Add useLoadableState
    - Helper hook that takes a loader method and returns loadingState, value, and error
- DomainField: Add filterCriteria
- Render Filter Criteria components in AssayDesignerPanels
- Add `request` method
  - `request` is an async wrapper for `Ajax.request` which takes the same config as `Ajax.request` except `success` and
  `failure` callbacks. Instead of using `success` and `failure` you `await request(config)` and `catch` errors.

### version 6.7.0
*Released*: 18 December 2024
- Parent type selector updates for adding and removing from EditableGrid
  - AddEntityButton asButton property to allow for icon only version
  - QueryColumn isParentInput() helper to check for either MaterialInput or DataInput
  - EditableColumnMetadata onRemoveColumn optional prop to allow for callback for EditableGrid column removal menu item
  - EditableGrid additionalButtons optional prop to allow custom items to be added to grid button bar
  - DropdownAnchor
    - renamed to DropdownMenu
    - add asAnchor property to allow for version without `<a>` tag and href

### version 6.6.1
- merge forward v6.1.1 changes

### version 6.6.0
*Released*: 17 December 2024
- Delete FileListing
- Delete FileListingForm
- FileAttachmentEntry: convert to FC, simplify props
- Update file related styles
  - Change class names to match BEM style
- Remove duplicate CSS imports
- Remove snapshot tests

### version 6.5.4
*Released*: 17 December 2024
- Update `DateInput` to determine the default date/time from container configuration
- Lineage: be defensive against seed not being set when focusing graph
- Refactor `ColorPickerInput` to a functional component

### version 6.5.3
*Released*: 16 December 2024
- Add restrictions on names of domains
    - Update resolveErrorMessage util to handle more scenarios

### version 6.5.2
*Released*: 12 December 2024
- Update `EntityIdCreationModel` with `selectionContainerId`
- Fix `resolveSampleParentTypes` when `orderedRowIds` is undefined
- Fix some error message verbiage

### version 6.5.1
*Released*: 11 December 2024
- RadioGroupInput fix for formsy input usage
  - need to call setValue on each change of radio selection

### version 6.5.0
*Released*: 10 December 2024
- Chart builder support for axis layout options
  - OverlayTrigger to only close on "click outside" for triggerType="click"
  - RadioGroupInput to support click on input label to setValue
  - Factor out ChartFieldOption.tsx from ChartBuilderModal.tsx
  - ChartFieldOption.tsx support for axis layout options (scale and range) to be set in OverlayTrigger on click
  - ChartBuilderModal to support axis layout options from saved config and to update when saving config
  - TrendlineOption.tsx update to asymptote min/max inputs to match axis layout options (via OverlayTrigger)

### version 6.4.1
*Released*: 9 December 2024
- Issue 51432: LKSM: special character not working well on various pages
  - Warn user about missing quotes when pasting data into editable grid that contains a comma
  - Replace `&` with a similar unicode character for lineage graph labels display as vis-network doesn't work well with `&`

### version 6.4.0
*Released*: 4 December 2024
- Remove assays.scss
  - Styles moved to utils.scss or ui-premium
- Add utils.scss
  - Move util styles from various scss files to utils.scss
- Rename getSelectedData to getSelectedDataDeprecated
- Add getSelectedRows
  - This uses the components version of selectRows to fetch the selected data for a QueryModel
- "-spacing" classes renamed
  - renamed to "-margin" or "-padding"

### version 6.3.1
*Released*: 4 December 2024
- Reinstate prior removed fn

### version 6.3.0
*Released*: 4 December 2024
- Chart builder support for Trendline option in line chart
  - add Trendline option to ChartBuilderModal and support trendlineType in chartConfig
  - trendline asymptote min and max inputs for specific curve fit types
  - available trendline options (i.e. linear vs non-linear) based on schema prefix

### version 6.2.1
*Released*: 3 December 2024
- Issue 51105: Workflow job links to navigate user to app project home or subfolder accordingly
  - export createProductUrlFromPartsWithContainer for use in WORKFLOW_MAPPER

### version 6.2.0
*Released*: 3 December 2024
- Issue 51707: Change "Registry Source Type" to "Source Type" and "Registry" to "Registry Sources"
- Issue 51775: Don't produce link for non-standard assay import if not supported

### version 6.1.1
*Released*: 17 December 2024
- Issue 51864: Unexpected error when trying to add samples to an assay

### version 6.1.0
*Released*: 29 November 2024
- Issue 49016: App admin Groups and Users pages to show in subfolders when applicable

### version 6.0.2
*Released*: 29 November 2024
- Issue 51680: Use proper container path for importing assay data for jobs

### version 6.0.1
*Released*: 27 November 2024
- Incorporate Recent Storage Dashboard Widget
  - Modify `HorizontalBarSection` to support `showSummaryTooltip`
  - Add `createHorizontalBarCountLegendData` util
  - Modify `ItemLegend` to render data with `DefaultRenderer`

### version 6.0.0
*Released*: 26 November 2024
- Move `BarChartViewer` and relatives to `ui-premium` package
- Update `ResponsiveMenuButton` to have `children` property instead of `items`
- Add constants and properties to allow use of a single `SampleGridButtons` component in `ui-premium`
- `SampleCreationType` -> `EntityCreationType`
- Export `parseScientificInt` utility

### version 5.24.1
*Released*: 26 November 2024
- Support Plate Set ELN References

### version 5.24.0
*Released*: 19 November 2024
- Issue 51645: Escape advanced search characters
- Migrate `sanitizeSearchQuery()` implementation to this package and rename to `escapeSearchQuery()`.
- Add `escapeQuery = false` and `escapeQuotes = false` as optional properties on the search API wrapper.

### version 5.23.0
*Released*: 18 November 2024
- Include identifying fields in editable entity grids - sample create/derive/aliquot
  - Modify editable grid addRows, addRowsPerPivotValue and addBulkRowsToEditorModel to take custom insertColumns
  - Support removeColumns for editable grid
  - Add previousEditorModel to EditableGridChange param
  - Add readOnlyGridFields to bulkAddProps

### version 5.22.10
*Released*: 15 November 2024
- withAssayModels: filter by "assayName" prop when provided

### version 5.22.9
*Released*: 14 November 2024
- Editable Grid: apply lookupValueFilters when pasting

### version 5.22.8
*Released*: 13 November 2024
- Merge from release24.11-SNAPSHOT to develop
  - includes changes from 5.20.3 #1635
  - includes changes from 5.20.4 #1637

### version 5.22.7
*Released*: 12 November 2024
- DataClassDataType: Update noun to match apps

### version 5.22.6
*Released*: 11 November 2024
- Revert recent change to genCellKey and move the sample field key prefix to the usage in updateCellValuesForSampleIds()

### version 5.22.5
*Released*: 7 November 2024
- Issue 51574: Limit selection for View Assay Results
- Issue 51482: Add metric to track Help link clicks
- Issue 51575: Limit number of samples to print labels for to 1000

### version 5.22.4
*Released*: 6 November 2024
- QueryInfo.hasIdentifyingFieldsView() to check for identifying fields view existence and if it has more than just the default "Name" column

### version 5.22.3
*Released*: 6 November 2024
- Issue 51495: LKSM: Grid Showing Incorrect Number Selected
  - Fixed buildQueryParams util to allow >1 filter values per filter parameter

### version 5.22.2
*Released*: 6 November 2024
- Merge from release24.11-SNAPSHOT to develop
    - includes changes from 5.20.2 #1629

### version 5.22.1
*Released*: 5 November 2024
- Remove combineParentTypes

### version 5.22.0
*Released*: 5 November 2024
- Package updates

### version 5.21.0
*Released*: 4 November 2024
- Add identifying fields to grids when editing via grid for Samples and Sources
    - include identifying fields in getSelectionLineageData()
    - EditorModel.getUpdatedData() to skip non-userEditable fields when comparing values
    - getIdentifyingFieldsEditableGridColumns() to take param for hasProductFolders to determine if Folder should be excluded

### version 5.20.7
*Released*: 31 January 2025
- Issue 52132: EditorModel.getUpdatedData fix to account for lookup columns with column.name key
  - For editable grid with sample type identifying fields showing as read-only

### version 5.20.6
*Released*: 27 January 2025
- Issue 52038: Fix problems fields whose names and fieldKeys are different
 - Editable grid needs to find columns using names not field key
 - detail editing needs to use name instead of fieldKey for changed values
 - Fixes for identifying field retrieval and population in the grid
 - Update CheckboxInput.tsx and DatePickerInput.tsx to use column.fieldKey for input name prop (to match other input types)

### version 5.20.5
*Released*: 13 January 2025
- Issue 51967: Submit formatted date value from editable grid

### version 5.20.4
*Released*: 9 November 2024
- Use userId instead of email for password related APIs

### version 5.20.3
*Released*: 7 November 2024
- Replace some curly quotes with normal quotes

### version 5.20.2
*Released*: 4 November 2024
- Issue 51563: LKSM: Add additional date and date/time formats

### version 5.20.1
*Released*: 31 October 2024
- Issue 51491: DateTime field should tolerate Date and DateTime pseudo format patterns

### version 5.20.0
*Released*: 31 October 2024
- Bump build
- Convert LoadingSpinner to FC

### version 5.19.1
*Released*: 31 October 2024
- Issue 51557: fix counts for folder deletion summary
- Support optional `containerPath` on `api.security.getDeletionSummaries()` endpoint wrapper

### version 5.19.0
*Released*: 31 October 2024
- Add identifying fields to grids when insert assay data via EditableGrid
  - migrate some sample identifying fields utils from `@labkey/premium`
  - factor out updateCellKeySampleIdMap() as utility function
  - add QueryColumn.isSingleSampleTypeLookup()
  - EditorModel.getValuesForColumn() to get cellValues for a single column
  - update sample identifying fields utils/actions to take in optional sampleFieldKey prefix
  - EditorModel.getUpdatedData() to skip readOnly fields when comparing values

### version 5.18.0
*Released*: 29 October 2024
- Folders: Archive V1 (Hide from view/show hidden)
  - Add isArchived to Container class
  - Add App.getArchivedFolders util
  - Add folder.archiveFolder.api to support archive and restore a folder
  - Added FolderColumnRenderer to show archived tag for Folder fields
  - Modified ProductMenu to add archived indicator
  - Modified FolderMenu to section active vs archived folders
  - Modified SearchResultCard and FilterFacetedSelector to show archived tag for folders
  - Modified DataTypeFolderPanel to section active vs archived folders and uncheck archived folders by default
  - Modified move and create data UIs to exclude archived folder from target options

### version 5.17.9
*Released*: 29 October 2024
- Export isCtrlOrMetaKey

### version 5.17.8
*Released*: 29 October 2024
- Bump `@labkey/build` package dependency

### version 5.17.7
*Released*: 28 October 2024
- Bump `@labkey/api` package dependency

### version 5.17.6
*Released*: 28 October 2024
- Update to `vis-network@9.1.9`
- Add necessary peer dependency `vis-data@7.1.9` to our dependencies
- Simplify typings and adjust API usages to match latest version

### version 5.17.5
*Released*: 26 October 2024
- Remove reference to the experimental flag for plates.

### version 5.17.4
*Released*: 25 October 2024
- Add `SchemaQuery` properties on `AssayDefinitionModel`.
- Refactor `AssayDefinitionModel` to use `ExtendedMap`.

### version 5.17.3
*Released*: 23 October 2024
- Issue 39332: Make sure export started messages shows before export starts in TabbedGridPanel exportTabs case

### version 5.17.2
*Released*: 23 October 2024
- Fix Issue 51359
  - Paste starting from first cell in selection

### version 5.17.1
*Released*: 22 October 2024
- Date/Time formatting simplifications - Settings UI Changes
  - Add utils for handling standard date/time formats
  - Move getFolderDateTimeHelpBody from ContainerLookAndFeelForm to shared util
  - Check blank initial value for SelectInput
  - Modified DateTimeFieldOptions to use standard formats and new UI

### version 5.17.0
*Released*: 21 October 2024
- Migrate out all components related to `AssayImportPanels` (i.e. assay run import page) and corresponding functionality.
- Add `checkForDuplicateAssayFiles()` to assay API wrapper.
- Add `getSelection()` to query API wrapper.

### version 5.16.0
*Released*: 21 October 2024
- EditableGridPanel: Remove support for tabs
- SampleTypeAppContext: change parentDataTypes to an array
- SamplesTabbedGridPanelComponentProps: remove withTitle, title props
- Remove getUpdatedDataFromEditableGrid
- Remove applyEditorModelChanges
- EditorModel:
  - add getUpdatedData
  - add applyChanges
- Remove initEditorModels
- Remove queryModel arg from initEditorModel
- Remove queryModel arg from EditableGridLoader.fetch
- Export EditableGrid
- Remove EditableGridPanel
- Remove EditableGridPanelForUpdate
- Don't export updateSampleStorageData

### version 5.15.1
*Released*: 21 October 2024
- Issue 51422: When not using filters, `clearSelections` can be more efficient

### version 5.15.0
*Released*: 17 October 2024
- Remove properties from `EditableGrid` that support bulk updates when adding to storage

### version 5.14.1
*Released*: 17 October 2024
- Fix verb usage in `resolveErrorMessage`, deriving the present participle of the verb when not provided

### version 5.14.0
*Released*: 16 October 2024
- Calculated fields error handling
  - calculated field expression input width change, show examples inline next to textarea, add "click to validate"
  - parseCalculatedColumn to first try making an executeSQL call with fake data to catch SQL errors
  - parseCalculatedColumn to include PHI check in validation (Issue 51235)
  - withQueryModel to retry failed query without calculated fields, set viewError on QueryModel for grid display
  - remove experimental feature flag for calculated fields

### version 5.13.2
*Released*: 14 October 2024
- Issue 51056 Samples with single double quotes in the name will not resolve if added as parent samples.
- Issue 51433 Unhandled client side exception when using a parent field in editable grid after clearing the field.

### version 5.13.1
*Released*: 14 October 2024
- Issue 51425: reprocess lineage node "level" on subsequent traversals
- Lineage styling:
    - Set `scaleFactor=0.6` (default is 1) for arrows so they render a bit smaller.
    - Set `levelSeparation=125` (default is 150) to reduce the space between levels in the graph.
    - Set `edgeMinimization=false` (default is true) so that all edges are represented in the graph.

### version 5.13.0
*Released*: 7 October 2024
- Issue 47087: Find Derivatives in Sample Finder to include a selection in filters

### version 5.12.1
*Released*: 7 October 2024
- withAssayModels fix to allow passthrough of ComponentsAPIWrapper

### version 5.12.0
*Released*: 7 October 2024
- Issue 50569: Add description for API keys

### version 5.11.1
*Released*: 7 October 2024
- Issue 51291: Assure product menu closes after click on "empty" link

### version 5.11.0
*Released*: 4 October 2024
- Chart builder in app (part 3)
  - updates to chart margins and sizes for chart builder and dashboard
  - only show 'x' grid lines for bar and box plots
  - Issue 48860: Show "inheritable" checkbox in chart builder for users with proper perm (and if in app home)
  - use getContainerFilterForFolder() for chart getQuery request (related to issue 48860)
  - remove Chart Builder experimental feature flag

### version 5.10.0
*Released*: 1 October 2024
- Editable Grid: improve validation messages

### version 5.9.0
*Released*: 1 October 2024
- Issue 51254: Limit number of values for multi-valued filter types

### version 5.8.2
*Released*: 30 September 2024
- Issue 51173: LKSM/LKB: Improve naming pattern warning when it contains a field name

### version 5.8.1
*Released*: 30 September 2024
- Issue 51253: Require saving before testing of BarTender connection

### version 5.8.0
*Released*: 30 September 2024
- Lineage Relationships: Optionally Require during Sample Registration
  - add 'required' prop to various alias and parent input related models
  - add api.domain.getRequiredParentTypes and api.entity.getDataTypesWithRequiredLineage
  - updated DomainParentAliases and ParentAliasRow to use new UI and allow setting required parent
  - updated ImportAliasRenderer to incorporate required info
  - updated SampleTypeDesigner and DataClassDesigner to show new Lineage section for alias
  - remove folder level data exclusion for alias data type selection since designers are edited at Home folder

### version 5.7.0
*Released*: 27 September 2024
- Change "Project" to "Folder" throughout the application
- Remove warning banner about shared domains except for domains coming from /Shared

### version 5.6.1
*Released*: 27 September 2024
- Issue 51227: Add metric for number of rows used in editable grid

### version 5.6.0
*Released*: 25 September 2024
- Wire up onBlur for LookupCell
- Export Help component
- Export CellMessages type

### version 5.5.11
*Released*: 25 September 2024
- Issue 51337: LKSM: Can't edit samples where source ID has a comma
  - Check quoted parent value with comma before calling JSON.parse, which would remove the quotes

### version 5.5.10
*Released*: 24 September 2024
- Update `fileMatchesAcceptedFormat` utility to check file extension casing in a case-insensitive manner. Refactor away from using `Immutable`.
  - Fixes Issue 51331
- Update `FileAttachmentContainer` to use native `Set` rather than `Immutable.Set`.

### version 5.5.9
*Released*: 24 September 2024
- EditableGrid: Fix issue with pasteEvent not working if user pasted more rows than the grid has
  - Fixes issue 51327

### version 5.5.8
*Released*: 24 September 2024
- Fix Issue 51265
    - We now more consistently trim values and use getValidatedEditableGridValue
- Stop using overflow: scroll

### version 5.5.7
*Released*: 20 September 2024
- Issue 50389: Casing of aliased (parent) sample or source type name can be changed in the editable grid

### version 5.5.6
*Released*: 18 September 2024
- Issue 50998: Add container filter when getting samples from a particular transaction id

### version 5.5.5
*Released*: 17 September 2024
- Issue 50818: add RESOLVE_LSID_MAPPERS to resolve data/material by lsid

### version 5.5.4
*Released*: 17 September 2024
- Add `SchemaQuery` constant for `plate.ReformatTargetPlateSets` query.

### version 5.5.3
*Released*: 17 September 2024
- Add back calculated fields experimental feature flag

### version 5.5.2
*Released*: 16 September 2024
- Calculated fields issue fixes for 24.10
  - DomainForm to handle batching updates for state related to calculated field validation
  - Update error messaging for bad SQL related exceptions (Issues 51232 and 51204)
  - Study dataset designer to include systemFields based on timepoint type (Issue 51249)

### version 5.5.1
*Released*: 12 September 2024
- Issue 50628: Bump @labkey/api. See https://github.com/LabKey/labkey-api-js/pull/182

### version 5.5.0
*Released*: 12 September 2024
- Follow-up release fix for v5.4.0.

### version 5.4.0
*Released*: 12 September 2024
- Issue 50331: Cross-folder import of assay data from subfolder plate set should import data into subfolder

### version 5.3.1
*Released*: 11 September 2024
- Merge from release24.9-SNAPSHOT to develop
    - includes changes from 4.15.1 #1571

### version 5.3.0
*Released*: 10 September 2024
- Update `react-datepicker` dependency to align with our `date-fns@3.x` dependency.
- Remove `@types/react-datepicker` dependency as `react-datepicker` now supplies its own typings.

### version 5.2.0
*Released*: 9 September 2024
- Add `@hello-pangea/dnd` as a dependency
- Remove `react-beautiful-dnd` as a dependency

### version 5.1.1
*Released*: 9 September 2024
- Issue 51085: Grid button spacing issue for hover border

### version 5.1.0
*Released*: 6 September 2024
- Issue 51158: Update the text for discarding samples from storage to use "removed" instead

### version 5.0.0
*Released*: 5 September 2024
- withQueryModels: Add reloadModel flag to setOffset
- ***BREAKING CHANGE***: React dependency upgraded to React 18
- Use PropsWithChildren for all components using children
- Fix issues with document click handlers for menus
- Don't use defaultProps with function components

### version 4.16.0
*Released*: 3 September 2024
- Calculated fields remove experimental feature flag
  - DomainRow for calculated fields to set isDragDisabled true
  - Add tooltip for DragDropHandle for calculated fields

### version 4.15.1
*Released*: 9 September 2024
- Issue 50700: EditableGrid to account for hidden/readonly rows during cell actions

### version 4.15.0
*Released*: 2 September 2024
- Issue 39332: Provide status when exporting data from a grid in the app
  - QueryModel action for addMessage with optional duration (for removing message after N ms)
  - Add message to grid after clicking export menu option

### version 4.14.1
*Released*: 30 August 2024
- Consolidate handling of date/time changes in `DatePickerInput`.
- Coerce local timezone for ISO_DATE_FORMAT matching strings in `parseDate`.

### version 4.14.0
*Released*: 30 August 2024
- Update `QuerySelect` to support parameterized queries

### version 4.13.1
*Released*: 30 August 2024
- ELN and storage view tooltip update
  - Support isFlexPlacement Popover placement based on available screen space
  - check isBiologicsEnabled for isMediaEnabled
  - support noLink prop for DefaultRenderer

### version 4.13.0
*Released*: 30 August 2024
- Misc 24.9 issue fixes
  - Issue 51123: Assay run import sample lookup fails when coming from a workflow job task
  - Issue 51025: Don't allow saving of data in editable grid if there are known errors

### version 4.12.0
*Released*: 29 August 2024
- Add `date-fns` and `date-fns-tz` dependencies
- Remove `moment` and `moment-timezone` dependencies
- Refactor usages of time differences and time math to use date-fns
- Export new `fromDate` and `fromNow` date utility methods
- Remove internal implementation of `jDateFormatParser`

### version 4.11.0
*Released*: 27 August 2024
- Use new `~~identifyingfield~~` view when available for `QuerySelect`'s `PreviewOption`

### version 4.10.3
*Released*: 27 August 2024
- Consolidate EditableGrid read-only cell methods
  - remove EditorColumnMetadata.readOnly prop and replace with isReadOnlyCell prop
  - remove unused readOnlyColumns prop from BulkUpdateForm
  - update QueryInfo getInsertColumns() and getUpdateColumns() to rename param as requiredColumns
- Remove unused useWindowFocusCheckExpiredSession

### version 4.10.2
*Released*: 22 August 2024
- fix `QueryModel.selectedState` so it works on a partially filled last page

### version 4.10.1
*Released*: 22 August 2024
- Issue 50822: Query to get study properties instead of relying on study moduleContext

### version 4.10.0
*Released*: 20 August 2024
- Calculated fields validation of value expression
  - update tooltip text and examples for Expression textarea label
  - validate expression on component mount and on text area blur
  - display validation message or error in textarea footer and set domain row warning state
  - SampleTypeDesigner uniqueId field addition warning modal button change

### version 4.9.0
*Released*: 20 August 2024
- Add view customizer for identifying fields for samples and sources
  - Update `ColumnSelectionModal` with optional `disabledMsg` property to be shown in popover
  - Export `includedColumnsForCustomizationFilter` for use in ui-premium component
  - Add new reserved view name

### version 4.8.0
*Released*: 19 August 2024
- Do not export loadEditorModelData
- Remove initEditableGridModel, initEditableGridModels, applyEditableGridChangesToModels, EditableGridModels
  - Use initEditorModel, initEditorModels, applyEditorModelChanges instead
- EditableGrid: remove unused and unnecessary props
  - allowFieldDisable
  - allowRemove
  - bordered
  - condensed
  - lockedRows
  - notDeletable
  - onSelectionChange
  - removeColumnTitle
  - showBulkTabOnLoad
  - striped
  - tabAdditionalBtn
  - tabBtnProps
- EditableGrid: remove dependence on QueryModel
  - Including utils and action methods used by EditableGrid and those for manipulating EditorModel
- ExportMenu: Remove extraExportMenuOptions
  - This feature is no longer used

### version 4.7.3
*Released*: 16 August 2024
- Fix DomainField.fromJS accessing undefined object issue

### version 4.7.2
*Released*: 14 August 2024
- Issue 50924: Sample timeline event details throws error if the parent sample name starts with double quote

### version 4.7.1
*Released*: 13 August 2024
- Issue 50657: Use default view when printing labels from a sample's details page

### version 4.7.0
*Released*: 12 August 2024
- Issue 49966: Add new `StorageUnitLabel` column as a known column to allow attaching a label to a box created during import

### version 4.6.0
*Released*: 8 August 2024
- Issue 50833: Renaming a project doesn't get fully reloaded until page refresh
  - ProjectSettings to use getIsDirty and setIsDirty from parent component and to pass renamedProject to onSuccess
  - Move several admin setting project related components to @labkey/premium

### version 4.5.1
*Released*: 7 August 2024
- Merge from release24.8-SNAPSHOT to develop
    - includes changes from 4.4.3 #1545

### version 4.5.0
*Released*: 6 August 2024
- Remove `formsy-react` dependency.
- Inline `formsy-react` implementation. This is a port of v2.3.2.

### version 4.4.3
*Released*: 6 August 2024
- Mark new `Visit Label` field as a study field

### version 4.4.2
*Released*: 31 July 2024
- Fix `isTransformScriptsEnabled` check

### version 4.4.1
*Released*: 30 July 2024
- BarTender: supply file export needed for BarTender integration
  - Update label and icon for bartender label printing option
  - Support new "Download template" option for bartender with FieldKey instead of column title

### version 4.4.0
*Released*: 30 July 2024
- Add LIMS product and product feature checks for transform scripts and charts
  - Add utility methods for checking other features (nonstandard assays, study linking, registry, general LKS support)
  - Refactors for sharing renderer definitions
  - add utility method for registering pipeline listeners

### version 4.3.1
*Released*: 30 July 2024
- Issue 50224: link-to-study does not accept visit labels instead of sequencenums

### version 4.3.0
*Released*: 25 July 2024
- Issue 50449: App grid filter to expand icon click area to remove filter value
- Issue 50537: LineageDetail to only show the "Properties" column in the detail view for the exp schema
- Issue 49754: App charts to expand width and scroll horizontally to match LKS
- Issue 49753: App charts to use formattedValue in response row objects for bar/box plot tick labels

### version 4.2.0
*Released*: 24 July 2024
- Package updates

### version 4.1.0
*Released*: 24 July 2024
- Calculated Columns support in the Field Editor
  - add valueExpression to DomainField model
  - add calculatedFields to the DomainDesign
  - add CalculatedFieldOptions to DomainRow and Calculation to PropDescType
  - hide some AdvancedSettings for calculated fields
  - use rangeURI for calculated fields to determine type specific expanded row options to show
  - add ProductFeature.CalculatedFields and isCalculatedFieldsEnabled() helper
  - add experimental feature flag for calculated fields in the Field Editor

### version 4.0.7
*Released*: 23 July 2024
- Add `footerContent` prop on `Modal` which is passed through as the `children` of `ModalButtons`.
Useful for rendering content to the left of the modal confirmation buttons.

### version 4.0.6
*Released*: 20 July 2024
- Issue 50742: Reset/Update genId result in error if samples exists only in child folders
- Issue 50709: LKSM: Pasting in editable grid when an aliquot field is between two sample fields doesn't work
- Issue 50650: LKSM: SampleFinder doesn't show ancestor column data if default view also contains the same ancestors
- Issue 42183: SM: Need better indication that comment in a workflow task has not been saved.
- Issue 50607: Updated field labels are not shown in the grid

### version 4.0.5
*Released*: 17 July 2024
- EditableGrid: bulk data resolve public lookups

### version 4.0.4
*Released*: 12 July 2024
- Issue 50661: Update `FilterFacetedSelector` to cancel requests as needed while typing
  - move `useRequestHandler` hook from ui-premium to here
- Issue 50447-adjacent: Impose limit on number of items to add to picklist for different button/menu item rendering

### version 4.0.3
*Released*: 12 July 2024
- getSelectedData: use async implementation, accept columns as `string[]`
- EditableGrid: action `getLookupDisplayValue()` should support resolving string values
- BulkUpdateForm: remove `requiredDisplayColumns` prop

### version 4.0.2
*Released*: 12 July 2024
- Editable Grid Improvements: Validation of fields
  - Update invalid cell style
  - Add util to validate cell values based on column type and properties
  - Wire up cell validation on cell modify/blur/paste/fill
  - Handle missing required cell value check on Submit

### version 4.0.1
*Released*: 12 July 2024
- SelectRows: support optionally requesting metadata

### version 4.0.0
*Released*: 10 July 2024
- Remove usages of react-bootstrap
- Remove FieldEditForm
- Popover/Tooltip: support fixed positioning
- Remove react-boostrap and @types/react-boostrap dependencies

### version 3.57.1
*Released*: 8 July 2024
- Issue 50640: Update `MenuSectionModel` URL construction to link to `runs` page for assay names
- Issue 50753: Fix link resolution for sample type names that are numbers

### version 3.57.0
*Released*: 3 July 2024
- Add styling for button.clickable-text

### version 3.56.2
*Released*: 28 June 2024
- Update MenuSectionItem to accept ReactNode for label attribute

### version 3.56.1
*Released*: 28 June 2024
- Remove reference to `MaterialLookupColumnRenderer`

### version 3.56.0
*Released*: 27 June 2024
- Use `LabelOverlay` in headers for grids
    - Update display of Description in `LabelOverlay` to preserve white space
    - Update `EditableGrid.renderColumnHeader` to use `LabelOverlay` if custom tool top is not configured
    - Add `DomainFieldMetadata` component to be used as new `HelpTipRenderer` when appropriate

### version 3.55.2
*Released*: 26 June 2024
- Add support in BulkUpdateForm for staging changes to EditorModel without transacting changes

### version 3.55.1
*Released*: 26 June 2024
- Issue 49025: Assay run import fails if time format is kk:mm
- Issue 50715: Barcode field set as required prevents sample creation because of validateData() check
- Issue 50605: Field editor drag-n-drop to reorder prevents dragging of a field after it is moved the first time

### version 3.55.0
*Released*: 25 June 2024
- Grid: improve styling for sticky headers
  - No longer compute height via JS
  - Use max-height, set via CSS

### version 3.54.0
*Released*: 24 June 2024
- Issue 48439: EditableGrid drops invalid date values when calling insertRows/saveRows
  - add getValidatedEditableGridValue() to centralize handling of grid data parsing for insert and update case
  - return original date string value when unable to parseDate()
- Remove some deprecated code after issue 50589 changes (remove export editable grid option)

### version 3.53.6
*Released*: 20 June 2024
- Issue 50483: Creating a required sample-only field after an aliquot field errors on add
- Issue 50023: Import button on Assay Run page is not enable after creating a new aliquot and adding them to a run result.
- Issue 50608: View Assay Results from Storage Grid View errors
- Issue 50684: LKSM: Update descriptions for Source & Sample Type designer

### version 3.53.5
*Released*: 18 June 2024
- Separate storage styling from editable grid

### version 3.53.4
*Released*: 18 June 2024
- Issue 50533: Support passing through a `timezone` prop on `EditInlineField`

### version 3.53.3
*Released*: 18 June 2024
- Add support for Ancestor nodes on All Samples grids
  - Update `CustomizeGridViewModal` to not allow multiple levels of ancestors to be added

### version 3.53.2
*Released*: 14 June 2024
- Feature Request 50121: Support multi-line cells in editable grid

### version 3.53.1
*Released*: 13 June 2024
- Convert usages of OverlayTrigger off of react-bootstrap

### version 3.53.0
*Released*: 12 June 2024
- Issue 50589: Remove option to export editable grid data

### version 3.52.0
*Released*: 10 June 2024
- Sample Type & Source Type Designer Roles
  - Add entityApi.isDataTypeEmpty to check if a design has data
  - Allow hiding of Projects section in designer

###  version 3.51.0
*Released*: 10 June 2024
- Assay import support for results domain file fields
  - FileAttachmentForm to send back updatedFiles map onFileRemoval
  - FileAttachmentContainer to support includeDirectoryFiles to recursively include files in a dropped directory
  - FileAttachmentContainer to support error check for total file size
  - RunDataPanel update to show FileAttachmentForm for results domain file fields
  - AssayWizardModel.prepareFormData to include resultsFiles for import run API post and update progress bar estimate and message
  - uploadAssayRunFiles fix for maxFileSize to not include batchFiles or runFiles as they are unrelated
  - only shown in assay import UI for LKB at this time

###  version 3.50.0
*Released*: 10 June 2024
- Issue 49882: App editable grid support for locking column header and left columns on scroll

###  version 3.49.0
*Released*: 6 June 2024
- getSelectionLineageData: make selection `Set<string>` instead of `List<any>`
  - It's always sourced from QueryModel.selections
- SamplesEditableGridProps: remove displayQueryModel

### version 3.48.1
*Released*: 4 June 2024
- Issue 41718: Domain Designer Field Imports should observe auto-increment fields
    - Fix displayed Data Type of auto int field on existing List

### version 3.48.0
*Released*: 4 June 2024
- Fix Issue 48377: LKSM/LKB: Editable grid allows pasting into cells that are marked as read-only
- Fix Issue 48242: LKSM/LKB: Editable Grid - Right clicking a multi-cell selection doesn't work as expected
- EditableGrid: Fix issue where cut (cmd/ctrl + x) would delete read only cell values
- EditableGrid: Add hideReadonlyRows prop
- QueryFormInputs: Remove unused prop componentKey

### version 3.47.0
*Released*: 30 May 2024
- Expose `registerInputRenderer` as a way for external package usages of `@labkey/components` to register custom form/grid input renderers.
- Introduce `QuerySelect.groupByColumn` which allows for results within query select to be grouped by another column. This in turn is backed by `SelectInput.formatGroupLabel` when rendering options.
- Add a new `includeEmptyParams` parameter to `AppURL.addParams()`. By default `addParams()` will now not include parameters where the parameter value is `undefined` or `null`.
- Issue 49953: fix shift-select on edge cells

### version 3.46.5
*Released*: 29 May 2024
- Issues 50507 and 50453: Fields named 'Color' should not interfere with status colors
- Issue 50498: Use proper container for status deletion

### version 3.46.4
*Released*: 28 May 2024
- Issue 50354: LKSM: Include indicator of unavailable file in apps

### version 3.46.3
*Released*: 21 May 2024
- Fix Issue 50455

### version 3.46.2
*Released*: 21 May 2024
- Issue 50347 LKSM: Data Field Name in Naming Pattern Causing Error

### version 3.46.1
*Released*: 21 May 2024
- Merge from release24.3-SNAPSHOT to develop
    - includes changes from 3.24.12 #1496

### version 3.46.0
*Released*: 16 May 2024
- Add `CheckboxLK`
  - This is a replacement for react-boostrap's Checkbox
  - It will be renamed to `Checkbox` when we stop using the react-bootstrap version
- Reduce usages of various react-bootstrap components (e.g. FormGroup, FormControl)
- OverlayTrigger: Don't require an `id`
- Add `withServerContext`

### version 3.45.1
*Released*: 16 May 2024
- Introduce `EditorModel.convertQueryModelDataToGridResponse()` to streamline initializing data from a `QueryModel` for an `EditorModel`.

### version 3.45.0
*Released*: 16 May 2024
- Issue 50363: Cross Folder lookup editable grid copy/paste and fill down don't account for containerPath / containerFilter
  - findLookupValues() to use getContainerFilterForLookups() and accept containerPath optional param
  - fillColumnCells() and insertPastedData() to use containerPath for the given row when validating cell lookup values forUpdate true case
  - fillColumnCells() and insertPastedData() to use targetContainerPath forUpdate false case
  - EditableGrid "Bulk Insert" and "Bulk Update" to use target containerPath prop for lookup field options and validation

### version 3.44.1
*Released*: 10 May 2024
- Issue 50360: Cross folder bulk edit doesn't work for grid custom view

### version 3.44.0
*Released*: 10 May 2024
- Chart builder in app (part 2)
  - Allow exports of charts within the apps to PDF/PNG via export dropdown menu
  - Allow bar-chart y-axis aggregation method (sum, min, max, mean, median) selection
  - Change chart builder modal preview limit from 100k rows to 10k rows

### version 3.43.0
*Released*: 9 May 2024
- ELN: Customize signing checkbox and export to PDF
  - Add LabelsAPIWrapper for getting and updating custom labels

### version 3.42.3
*Released*: 8 May 2024
- Add back class for `DisableableMenuItem` and do some RTL test conversion

### version 3.42.2
*Released*: 8 May 2024
- Merge from release24.5-SNAPSHOT to develop
    - includes changes from 3.41.1 #1484 #1485

### version 3.42.1
*Released*: 6 May 2024
- Issue 50319: Sample status tag display issues on lineage sample detail panel

### version 3.42.0
*Released*: 6 May 2024
- Issue 50084: Add onError handler for FileAttachmentForm to allow appropriate behavior by wrapping components when errors are detected

### version 3.41.1
*Released*: 3 May 2024
- Issue 48675: Improve UI text for 'ID/Name Settings'

### version 3.41.0
*Released*: 30 April 2024
- Support prop `ExtraExportMenuOptions` on ExportMenu component

### version 3.40.3
*Released*: 30 April 2024
- Remove "Cross project file import" experimental feature flag

### version 3.40.2
*Released*: 29 April 2024
- Issue 50236: Sample Manager: customize grid to add "Inputs/All" fields results in error page

### version 3.40.1
*Released*: 29 April 2024
- No longer include `tif` files in the `isImage` check
  - Most browsers cannot render `tif` files
  - Fixes Issue 49852

### version 3.40.0
*Released*: 29 April 2024
- Support cross-folder "Edit in Bulk"
  - Update getOperationNotPermittedMessage to work for both Edit in Grid and Edit in Bulk scenarios
  - BulkUpdateForm getUpdatedData() to include Folder in updated rows, if it exists in originalData
  - Add getSelectedIds(filterIds) to QueryModel
  - saveRowsByContainer prop for containerField to be optional since it has a default
  - AppendUnitsInput fixes for grid cell rendering and enable/disable in bulk form
  - Edit in Grid and Bulk lookup fields to use containerPath based on selected row(s) (for BulkUpdateForm, disable lookup fields and file files toggle when more than one containerPath in selection)
  - Add getOperationConfirmationData and getParentTypeDataForLineage to ApiWrapper

### version 3.39.6
*Released*: 25 April 2024
- Add support for exporting a storage map from terminal storage grids

### version 3.39.5
*Released*: 23 April 2024
- Include sample property fields for Sample Finder properties card

### version 3.39.4
*Released*: 19 April 2024
- Fix `ProductMenu` layout for static menu sections

### version 3.39.3
*Released*: 19 April 2024
- Issue 49792: Details tooltip sometimes cut off
- Issue 50054: Stacked bar chart hover on total count displays incorrect info
- DomainForm fix to use the propertyId in the DomainRow key for saved fields (helps with issues 49481 and 50076)
- BaseModal to set document.body no-scroll on show

### version 3.39.2
*Released*: 19 April 2024
- Add clearSelected and replaceSelected to query API wrapper
- Add allowSelection and onSelectionChange props to <EditableGrid/>

### version 3.39.1
*Released*: 18 April 2024
- Update CSS for notebook review status pills

### version 3.39.0
*Released*: 17 April 2024
- Support cross-folder "Edit in Grid"
  - rename getOperationNotPermittedMessage() to getOperationNotAllowedMessage()
  - EditableGridLoaderFromSelection to account for idsNotPermitted when using selections for getSelectedData()
  - Show Project column in EditableGrid for "Edit in Grid"
  - Add saveRowsByContainer util to QueryAPIWrapper
  - EditableGrid column actions for add,remove,update should use editorModel.columns to determine column indices
  - EditableGridPanelForUpdate props for readOnlyColumns and updateColumns, include originalRows as param to updateRows, show warning about notPermitted rows
  - add getOperationConfirmationDataForModel helper
  - fix in getUpdatedDataFromGrid for multi-value columns
  - EditableGrid replace react-bootstrap OverlayTrigger/Popover with LabelHelpTip
  - Issue 50140: App data class designer cursor jumps in parent alias field

### version 3.38.3
*Released*: 17 April 2024
- Issue 50031: Update permission check and container path for saving updates to storage labels

### version 3.38.2
*Released*: 12 April 2024
- Issue 50069: Editing amounts of sample results in weird value
- Issue 50010 Time picker enters the wrong time if a time field has a format set or if there is an additional parsing.
- Issue 50102: When bulk updating a time-only field and entering a value with PM results in the AM time being selected.
- Issue 48328: Starting to make Biologics use the same Sample Manager help links.

### version 3.38.1
*Released*: 11 April 2024
- Update product menu DOM structure to better support flex layout container/item paradigm.
- Use flex layout both horizontally (row-wise) across the product and vertically (column-wise) within each section column.
- Scroll within dynamic menu sections leaving the section headers position constant.
- Apply a "no-scroll" CSS class to the document body when product navigation is open. This prevents page scrolling.

### version 3.38.0
*Released*: 10 April 2024
- Add ability for users to choose colors associated with sample statuses
  - Update `ColorPickerInput` to accept optional list of default colors
  - Update `ColorPickerInput` to not close automatically when a color is chosen
  - Update `ManageSampleStatusesPanel` to include a `ColorPickerInput`
  - Update `SampleState` model with color field

### version 3.37.7
*Released*: 9 April 2024
- Add setSelected() to QueryAPIWrapper

### version 3.37.6
*Released*: 9 April 2024
- Improve-cross project actions - Derivations, Aliquots, and Pooling
  - modify getAppHomeFolderPath to not require container, export getAppHomeFolderId
  - modify getSelectedParents to respect container insert permission
  - distinguish SampleCreationType.Independent from SampleCreationType.FromSources

### version 3.37.5
*Released*: 4 April 2024
- ChartBuilder fix for tests (createNotification not defined) and JS error (onHide to handle evt parameter

### version 3.37.4
*Released*: 3 April 2024
- Merge from release24.4-SNAPSHOT to develop
    - includes changes from 3.36.1 #1463

### version 3.37.3
*Released*: 2 April 2024
- Introduce `autoInit` prop on `QuerySelect` that allows for users to skip initialization.
- Default `autoInit` to `process.env.NODE_ENV !== 'test'`.

### version 3.37.2
*Released*: 1 April 2024
- Issue 49956: Update styling of `PreviewOption` to not truncate text

### version 3.37.1
*Released*: 1 April 2024
- Issue 49394: Fix storage permission check for folders further down the hierarchy
- Issue 49908: use project folder for checking storage designer permissions

### version 3.37.0
*Released*: 1 April 2024
- Reload EntityInsertPanel LookupCell on targetContainer change

### version 3.36.1
*Released*: 2 April 2024
- Cache assay protocol requests on the client. Uncache when assay definitions are uncached.
- Hack usage of `menuShouldScrollIntoView` in `SelectInput` to recalculate menu positioning after initial load.

### version 3.36.0
*Released*: 30 March 2024
- Introduce `pivotColumn` query metadata section for applying metadata to pivot-generated query columns
- Add hit selection summary queries to schema constants

### version 3.35.0
*Released*: 29 March 2024
- Chart builder in app: App initial create chart modal
  - add experimental flag and update Chart menu for when to show Create Chart item
  - ChartBuilderMenuItem with modal for defining a new chart, selecting type, measures, and chart preview
  - save chart from chart builder modal and reload model charts after save

### version 3.34.1
*Released*: 27 March 2024
- Sample Finder: Show all fields in Properties modals
  - add QueryAPIWrapper.getDefaultVisibleColumns util
  - fix multi value indicator for inexpdescendantsof operators

### version 3.34.0
*Released*: 26 March 2024
- Package updates

### version 3.33.1
*Released*: 26 March 2024
- AssayImportPanels: Pass Plate Set ID to onComplete

### version 3.33.0
*Released*: 26 March 2024
- Add EditorModel.getColumns() function

### version 3.32.1
*Released*: 22 March 2024
- EditableGrid updates for add/move to multiple targets updates
  - support full editable grid bulk update without checkbox selection
  - add saveBtnClickedCount prop to allow buttons defined outside the grid notify grid of appropriate actions
  - add gridTabHeaderComponent and bulkTabHeaderComponent to allow additional header items, such as BoxFillOptions

### version 3.32.0
*Released*: 21 March 2024
- Update `OperationConfirmationData` model and `getOperationConfirmationData` to account for permission checks as well

### version 3.31.0
*Released*: 21 March 2024
- Issue 49870: Add password strength gauge to Change Password modal

### version 3.30.0
*Released*: 19 March 2024
- Don't use Row, Col, or Panel from react-bootstrap
  - There are two minor exceptions for Panel usages in the domain editor, these will be resolved in a later PR

### version 3.29.0
*Released*: 19 March 2024
- Updates to allow moving from multiple folders into one

### version 3.28.0
*Released*: 13 March 2024
- Consolidate logic for generating filters for editable grid cell lookups into `getLookupFilters()` utility
- Refactor `LookupCell` to a functional component
- Export `QueryLookupFilterGroup` and `QueryLookupFilterGroupFilter` types

### version 3.27.2
*Released*: 12 March 2024
- Issue 48535: Filter columns shown when expanding lookup columns for customization
- Issue 49868: Impose limit of 1000 on number of ids to find with Find Samples feature

### version 3.27.1
*Released*: 12 March 2024
- Merge from release24.3-SNAPSHOT to develop
    - includes changes from 3.24.7 #1435
    - includes changes from 3.15.8 #1437
    - includes changes from 3.15.9 #1439
    - includes changes from 3.24.10 #1443
    - includes changes from 3.24.11 #1444

### version 3.27.0
*Released*: 11 March 2024
- Add support for comments during edit actions
  - Remove title from timeline comment tooltip
  - Update `CommentTextArea` with additional props and callback interface
  - Update `EditableDetailPanel` and `DiscardConsumedSamplesPanel` to move commenting into the sticky button footer
  - Update `Modal` and `ModalButtons` components to support including the `CommentTextArea`

### version 3.26.1
*Released*: 7 March 2024
- Support column sizing for editable grid

### version 3.26.0
*Released*: 6 March 2024
- Add Tabs and Tab components
- Replace usages of react-bootstrap Tabs/Tab

### version 3.25.2
*Released*: 5 March 2024
- Merge release24.3-SNAPSHOT to develop:
    - includes changes from 3.24.7

### version 3.25.1
*Released*: 5 March 2024
- Issue 49801: Lineage: Display hierarchy of nodes by "level"

### version 3.25.0
*Released*: 4 March 2024
- Issue 45315: Allow inferDomainFromFile to take file path string in addition to File prop
- Issue 49795: App grid column header title to show for all columns instead of just lookups

### version 3.24.7
*Released*: 1 March 2024
- Lineage Settings: fix input change handling

### version 3.24.12
*Released*: 16 May 2024
- Issue 49956: Backport of styling update for PreviewOption for QuerySelect

### version 3.24.11
*Released*: 8 March 2024
- Issue 49858: LKSM: Saving grid filter on Storage Status takes 5+ minutes to load grid
  - Don't include view filters for getRows call

### version 3.24.10
*Released*: 7 March 2024
- Issue 49835: App Workflow task value not saving when starting from assay "Import Data" page

### version 3.24.9
*Released*: 5 March 2024
- EditableGrid: Support barcode scanners "streaming" input keys

### version 3.24.8
*Released*: 5 March 2024
- Issue 49274: App to use chevron arrows instead of plus/minus for expand/collapse (part 2)

### version 3.24.7
*Released*: 1 March 2024
- Lineage Settings: fix input change handling

### version 3.24.6
*Released*: 29 February 2024
- Mark project settings as dirty after title change

### version 3.24.5
*Released*: 29 February 2024
- Issue 49804: Fix grid style

### version 3.24.4
*Released*: 29 February 2024
- Fix form input layout
- Remove `col-md-` and align on `col-sm-9 col-xs-12`
- Consolidate default input classNames into constants

### version 3.24.3
*Released*: 29 February 2024
- Issue 49763: App to suppress "Plate Metadata" setting on assay designs when not applicable
- Issue 49274: App to use chevron arrows instead of plus/minus for expand/collapse

### version 3.24.2
*Released*: 28 February 2024
- Update EditableGrid to use alternative row background style
- Fix start-link

### version 3.24.1
*Released*: 27 February 2024
- Issue 49639: Update more info link in admin page
- Remove extraneous horizontal line in User menu when not logged in
- Issue 49428: Add dirty page warning for createProject page
- Issue 49679: change AppURL.create to not throw an exception in production mode when there are empty parts

### version 3.24.0
*Released*: 26 February 2024
- Add Modal
- Delete LoadingModal
- Delete ConfirmModal

### version 3.23.0
*Released*: 23 February 2024
- Google Analytics Improvements
    - Move files from ui-components to ui-premium
    - Use <Page/> component that passes new analytics titles

### version 3.22.2
*Released*: 19 February 2024
- Issue 49352: Breadcrumb fix to remove CSS content and replace with new `<li>` separator
- Issue 48834: Lineage detail panel to use table-layout auto instead of fixed

### version 3.22.1
*Released*: 15 February 2024
- Support date/time fields for all domain kinds
  - Enable date and time field type for all domain kinds
  - Update DatePickerInput to support inline edit mode
  - Update EditInlineField to use DatePickerInput for date/time type query column

### version 3.22.0
*Released*: 15 February 2024
- Issue 49418: When exporting, include any query parameters from model
- Issue 49602: Update wording in audit settings help tip
- Issues 49634 and 49629: Update behavior for saved views that include query filters
- Issue 49402: Implement new default Sample Status when discarding samples from storage
- Issue 49639: Remove reference to the product name in API Keys panel.

### version 3.21.0
*Released*: 14 February 2024
- Refactor ProductMenu, ServerNotifications, ProductNavigation, FilterExpressionView to no longer use DropdownButton
- Update styling for ServerNotifications, ProductNavigation

### version 3.20.3
*Released*: 14 February 2024
- Merge release24.2-SNAPSHOT to develop:
    - includes changes from 3.15.3

### version 3.20.2
*Released*: 13 February 2024
- Date and Time fields polish
  - Fix app editable grid with 'aa' time format
  - Fix date picker time picker with 'MMMM dd yyyy HH:mm:ss'
  - Fix editable grid date/datetime field level format

### version 3.20.1
*Released*: 13 February 2024
- Issue 49612: Handle ending drag action "mouse up" outside the editable grid

### version 3.20.0
*Released*: 13 February 2024
- Plate Set assay import
  - AssayImportPanels to use plateSet id in URL and to show Plate Set select instead of Plate select in input form
  - App editable grid assay import to filter plate by selected plate set
  - Hide PlateTemplate field from assay designer Run Domain fields in app

### version 3.19.0
*Released*: 12 February 2024
- DisableableMenuItem: change operationPermitted prop to disabled
  - not just a rename, this inverts the expected value
- Add DropdownSection
  - Replaces SubMenuItem, but outputs DOM structure expected by Bootstrap
- Add DropdownWithSections
  - Replaces SubMenu, but outputs DOM structure expected by Bootstrap
- ResponsiveMenuButton:
  - use DropdownSection
  - remove id prop
  - add className prop
- Remove SubMenu
- Remove SubMenuItem
- Remove getMenuItemsForSection (unused)
- Remove getMenuItemForSectionKey (unused)

### version 3.18.1
*Released*: 9 February 2024
- Issue 48776: Suppress import parent aliasing for media Mixture Batches
- Resolve sample type `category` in `SampleTypePropertiesPanel` and display add parent alias button accordingly.
- Use API wrappers in `SampleTypePropertiesPanelImpl`.
- Add `getValidPublishTargets` to `DomainPropertiesAPIWrapper`. Update to return a `Container[]` instead of `List<Container>`.

### version 3.17.2
*Released*: 8 February 2024
- Issue 49560: User permissionsList to default to undefined instead of empty array

### version 3.17.1
*Released*: 6 February 2024
- Merge release24.2-SNAPSHOT to develop:
  - includes changes from 3.15.1 and 3.15.2

### version 3.17.0
*Released*: 6 February 2024
- Issue 45256: Support "formattedValue" for display
- Switch arguments to `resolveDetailFieldValue` to optionally resolve `formattedValue` and `displayValue`.
- Introduce `resolveDetailFieldLabel` to make it more clear what is being resolved when reading a usage.

### version 3.16.0
*Released*: 2 February 2024
- Issue 49440: User may not be in the core.Users table (if permission was removed), so check the core.SiteUsers table as well

### version 3.15.3
*Released*: 12 February 2024
- Issue 49569: Remove direct use of `LabelOverlay` for `TextChoiceInput` `SelectInput` usage

### version 3.15.2
*Released*: 6 February 2024
- Merge release23.11-SNAPSHOT to release24.2-SNAPSHOT:
  - includes changes from 2.390.6

### version 3.15.1
*Released*: 2 February 2024
- Issue 49502: StoredAmount and Units for samples editable grid to use display values instead of raw values

### version 3.15.0
*Released*: 31 January 2024
- Support Date-only or Time-only fields
  - add container.format.timeFormat
  - add date and time fields as allowed domain field types
  - update ConfirmDataTypeChangeModal to allow date/time type convert
  - modify DatePickerInput/DateInputCell to support time-only fields
  - wire up time-only fields for QueryFormInputs, DetailDisplay, FilterExpressionView and editable grid
  - add util for parsing/formatting time only fields

### version 3.14.0
*Released*: 31 January 2024
- RReport: Render errors encountered when running the R Report

### version 3.13.0
*Released*: 31 January 2024
- Issue 49481: Domain designer issue if the field index changes (reordering fields), we need to update the validValues state
- Issue 49439: filter out inactive users from insert and update form query selects
- Issue 49502: If the Editable Grid lookup cell is a measurement unit, then we need to use the unit's display value
- Issue 49383: App error when a folder admin access profile page from a child folder
- Issue 49417: App user details modal to show above the app header details popover

### version 3.12.0
*Released*: 30 January 2024
- Issue 49507: add `convertUnitsForInput` to avoid commas in editable grid

### version 3.11.1
*Released*: 29 January 2024
- Issue 49378: use the default view if a view doesn't exist

### version 3.11.0
*Released*: 29 January 2024
- Remove MultiMenuButton
  - it was unused
- Add DropdownButton
- Add DropdownAnchor
- Add SplitButton
- Add MenuItem
- Add MenuHeader
- Add MenuDivider
- Update usages of react-bootstrap DropdownButton, SplitButton, MenuItem to internal versions
- ManageDropdownMenu: remove all props

### version 3.10.0
*Released*: 26 January 2024
- Add `AuditSettings` panel for configuring whether user comments are required for data changes
- Add `CommentTextArea` as a general component for entering reasons for data changes
- Add `useDataChangeCommentsRequired` hook to retrieve the setting for whether comments/reasons are required

### version 3.9.1
*Released*: 26 January 2024
- Add metric for shift-select usage.
- Update the `SampleStatusTag` component to use app/server context.

### version 3.9.0
*Released*: 23 January 2024
- Add `api.security.getUsersWithPermissions` to `SecurityAPIWrapper`
- Display internal component request errors via placeholder in `UserSelectInput`. Disable on error.
- Use `async` pattern for requests from `UserDetailsPanel`

### version 3.8.1
*Released*: 23 January 2024
- Add optional `onBeforeUpdate` to `EditableDetailPanel`
- Add `plate.PlateType` to schema constants

### version 3.8.0
*Released*: 18 January 2024
- Sample Type exclusions from Dashboard Insights charts
  - support for DashboardSampleType as a data type exclusion for projects
  - support for DashboardSampleType as a data type exclusion for sample type designer
  - ProjectDataTypeSelections panelTitle, panelDescription, and showUncheckedWarning
  - DataTypeSelector to load via useFolderDataTypeExclusions hook
  - AdminSettingsPage to show Dashboard data type exclusions panel when no projects configured
  - CreateProjectPage and ProjectSettings to show Dashboard data type exclusions panel
  - Dashboard chart config update to getProjectExclusionFilter to account for an array of exclusion types
  - changes sample chart configs to exclude based on both 'SampleType' and 'DashboardSampleType' exclusions
  - add sampleTypeDataType to AppAdminContext

### version 3.7.2
*Released*: 17 January 2024
- Remove experimental feature flag for R report capabilities

### version 3.7.1
*Released*: 17 January 2024
* Update `EntityIdCreationModel.postEntityGrid` to accept optional `containerPath`
* Issue 49414: Add prop in EntityDataType to indicate if cross-type import is supported

### version 3.7.0
*Released*: 16 January 2024
- RReport: use dataRegionName
  - Fixes Issue 49348
- Add OverlayTrigger and useOverlayTriggerState
  - internal version to be used in place of the react-bootstrap version
- Add Tooltip
  - internal version to be used in place of the react-bootstrap version
- Add Popover
  - internal version to be used in place of the react-bootstrap version
- Update Tip to use internal implementations of OverlayTrigger and Tooltip
- Update LabelOverlay to use internal implementations of OverlayTrigger and Popover
- Change LabelHelpTip to use internal implementations of OverlayTrigger and Popover
- Update DisableableButton to use internal version of Popover and useOverlayTriggerState
- LabelOverlay: remove canMouseOverTooltip prop

### version 3.6.0
*Released*: 15 January 2024
- Publicly export `PlacementType`
- Add `allowExport` prop on `EditableGridPanel`
- Add `plate.PlateSet` to schema constants
- `entity.getDeleteConfirmationData`: support containerPath

### version 3.5.5
*Released*: 15 January 2024
- Multi-Parent Matching in Sample Finder
    - add support for NOT_IN_EXP_DESCENDANTS_OF_FILTER_TYPE and IN_EXP_ANCESTORS_OF_FILTER_TYPE
    - show equals all for parent card id columns

### version 3.5.4
*Released*: 11 January 2024
- Refactor all UNSAFE_ usages

### version 3.5.3
*Released*: 11 January 2024
- Language Consistency: 'My' vs. 'Your' and 'Shared' vs. 'Public'

### version 3.5.2
*Released*: 11 January 2024
* Make menuReload action actually reload the menu
* Use menuReload action in registerWebsocketListeners

### version 3.5.1
*Released*: 10 January 2024
* Merge release24.1-SNAPSHOT to develop:
    * includes changes from 3.2.5

### version 3.5.0
*Released*: 9 January 2024
- Add API Keys panel to profile page
- Update QueryInfoForm to optionally not have the buttons stick to the bottom.
- Update SecurityApi with `createApiKey` and `deleteApiKeys` actions

### version 3.4.0
*Released*: 8 January 2024
- Support cross-folder delete
  - Refactor InsertRowsResponse, UpdateRowsResponse and DeleteRowsResponse into QueryCommandResponse
  - add deleteRowsByContainer util

### version 3.3.0
*Released*: 3 January 2024
- Update `Alert` to accept additional props and match behavior of `react-bootstrap`.
- Introduce `DisableableAnchor` which is an `a` tag that supports `disabled`.
- Replace all other usages of `Button` with `button` or `a` in the case where `href` is supplied.

### version 3.2.5
*Released*: 9 January 2024
- Issue 49357: Fix error in editable grid when checking for values on undefined set
