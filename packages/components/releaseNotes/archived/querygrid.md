# @glass/querygrid

Query Grid for LabKey schema/query data views

## Release Notes ##

### version ???
*Released*: ???
* Move `domainproperties` and `base` packages into `querygrid`
    * Old README for `domainproperties` can be found [here](./domainproperties.md)
    * Old README for `base` can be found [here](./base.md)

### version 0.24.1
*Released*: 22 November 2019
* Package patch update for changes to @glass/base v0.23.0

### version 0.24.0
*Released*: 19 November 2019
* update EditorModel with methods for converting from queryGrid results to the data format expected by
the editable grid
* move EditableGridLoader, EditableGridLoaderForSelection, EditableGridPanelForUpdate, EditableGridModal, BulkUpdateForm
from sampleManagement
* allow selectRows results to be passed in to LookupSelectInput
* in EditableGrid, change single-row deletion from delicate right-click on row number to separate icon column
* add optional toolTip property to EditableColumnMetadata to allow display of overlay tip in column headers

### version 0.23.2
*Released*: 19 Nov 2019
* Issue 33849: change UserSelectInput to use getUsersWithPermissions instead of getUsers so we get all users
with a particular set of permissions, not just those in some project or global group.

### version 0.23.1
*Released*: 19 November 2019
* Package patch update for changes to @glass/domainproperties v0.0.53

### version 0.23.0
*Released*: 18 November 2019
* Add components for user profile management in app - ChangePasswordModal, UserDetailHeader, UserProfile
* QueryFormInputs - add disabledFields property
* QueryInfoForm - add disabledFields and showErrorsAtBottom properties
* FileInput - fix so that FieldLabel respects the showLabel boolean property
* TextAreaInput, TextInput - fix for initial state isDisabled to only be based off of initiallyDisabled prop
* NavigationBar, UserMenu - add showSwitchToLabKey boolean, default to true

### version 0.22.4
*Released*: 14 November 2019
* Fix Issue 38804

### version 0.22.3
*Released*: 13 November 2019
* Add headerURL to MenuSectionConfig

### version 0.22.2
*Released*: 12 November 2019
* Package patch update for changes to @glass/domainproperties v0.0.50

### version 0.22.1
*Released*: 8 November 2019
* Item 6493: fix for containerPath encoding issue with buildURL() helper
* Package patch update for changes to @glass/domainproperties v0.0.49
* Package patch update for changes to @glass/base 0.21.1

### version 0.22.0
*Released*: 5 November 2019
* Add getFilterListFromQuery
* Add optional parameters to getSelection and pass through from getSelected so filters in the query string are used
* Add optional properties for LookupSelectInput to allow filtering and sorting of options
* Port UserSelect (as UserSelectInput) from Biologics
* Add support for app metadata for QueryGridModel hideEmptyViewSelector and hideEmptyChartSelector
* Fix problem with selection state after applying filters (as manifesting in GridSelectionBanner)

### version 0.21.8
*Released*: 5 November 2019
* Package patch update for changes to @glass/base v0.20.2, @glass/domainproperties 0.0.47

### version 0.21.7
*Released*: 5 November 2019
* Issue 36835: Dataclass grids with attachment-type fields do not display images inline in grid
    * Fix logic in FileColumnRenderer to render any file column (instead of just fileLinks).

### version 0.21.6
*Released*: 5 November 2019
* Package patch update for changes to @glass/base v0.20.2, @glass/domainproperties 0.0.46

### version 0.21.5
*Released*: 4 November 2019
* Add onChangeTab to QueryGridPanel

### version 0.21.4
*Released*: 31 October 2019
* Package patch update for changes to @glass/domainproperties v0.0.45

### version 0.21.3
*Released*: 31 October 2019
* Issue 38807: get a full calendar of months, even at the end of the month

### version 0.21.2
*Released*: 25 October 2019
* Package patch update for changes to @glass/base 0.20.1
* Package patch update for changes to @glass/domainproperties 0.0.44

### version 0.21.1
*Released*: 24 October 2019
* Add getUrlString to MenuItemModel

### version 0.21.0
*Released*: 18 October 2019
* Fix image scaling problem in image modal (Issue 36957)
* Add story for QueryGridPanel with images
* Refactor mock.tsx

### version 0.20.1
*Released*: 17 October 2019
* Package patch update for changes to @glass/domainproperties v0.0.41

### version 0.20.0
*Released*: 8 October 2019
* Move `omnibox` package into `querygrid`
    * Old README for `omnibox` can be found [here](./omnibox.md)
* Move `navigation` package into `querygrid`
    * Old README for `navigation` can be found [here](./navigation.md)

### version 0.19.2
*Released*: 7 October 2019
* Export LookupSelectInput

### version 0.19.1
*Released*: 27 September 2019
* Issue 38373: remove inline style from assay results data text area input for white-space nowrap

### version 0.19.0
*Released*: 26 September 2019
* Update QueryGrid actions to account for filtering
* Always show the GridSelectionBanner

### version 0.18.0
*Released*: 26 September 2019
* Add containerPath to QuerySelect
* Remove ReactSelectOption interface

### version 0.17.1
*Released*: 25 September 2019
* Fix editable grid Cell selected blur handling

### version 0.17.0
*Released*: 25 September 2019
* Issue 38527: move "Import Samples from File" link for SampleInsertPanel next to Sample Type input

### version 0.16.4
*Released*: 24 September 2019
* Remove "DataOutputs/DataFileUrl" from re-import post data as it doesn't map to anything on the server side (automated test fix)

### version 0.16.3
*Released*: 23 September 2019
* Update validation of sample set import aliases

### version 0.16.2
*Released*: 23 September 2019
* Package patch update for changes to @glass/omnibox v0.2.0

### version 0.16.1
*Released*: 20 September 2019
* Package patch update for changes to @glass/base v0.18.0

### version 0.16.0
*Released*: 20 September 2019
* initialize parents for SampleInsertPanel bulk insert

### version 0.15.0
*Released*: 19 September 2019
* Port of Lineage components, models, actions from Biologics

### version 0.14.1
*Released*: 19 September 2019
* Pick up assay run and definition hits from search results

### version 0.14.0
*Released*: 18 September 2019
* Move `report-list` package into `querygrid`
    * Old README for `report-list` can be found [here](./report-list.md)
* Update ReportList to improve rendering for Grids, Charts, and unsupported report types
* Rename flattenApiResponse to flattenBrowseDataTreeResponse
    * Also added a new argument called urlMapper `(report: IDataViewInfo) => AppURL`
* Add `PreviewGrid` component
* Make QueryGridPanel components render charts based on URL parameter
    * Part of this change means we always render the omnibox below the other QueryGridPanel buttons
* Update @glass/base dependency to 0.16.0
* Update @glass/domainproperties dependency to 0.0.36
* Update @glass/omnibox dependency to 0.1.38

### version 0.13.8
*Released*: 17 September 2019
* Add property to QueryGrid to allow for setting the active tab for multi-grid displays

### version 0.13.7
*Released*: 12 September 2019
* SampleSetDetailsPanel fields touch up

### version 0.13.6
*Released*: 12 September 2019
* add emptyGridMsg to EditableGrid
* SampleInsertPanel: add import link, update text, remove "bypass grid option", start with 0 rows
* RunDataPanel: start with 0 rows

### version 0.13.5
*Released*: 9 September 2019
* Changes to support Epic #5692: parent alias component in Sample Management
  * Updated SampleSetDetailsPanel to enable adding import aliases
  * Added SampleSetAliasRow: UI component for rendering import parent aliases
  * Added action initSampleSetSelects to get set of Options to use in selecting sample sets
  * Added action to getSampleSet directly from MaterialSource because of alias mapping column
  * Added ParentAlias model
* Updated LabelOverlay to optionally use LabelHelpTip based on optional prop
* Added some styles
* updated test data

### version 0.13.4
*Released*: 6 September 2019
* Package patch update for changes to @glass/base v0.15.1
* Package patch update for changes to @glass/domainproperties v0.0.33
* Package patch update for changes to @glass/omnibox v0.1.35

### version 0.13.3
*Released*: 3 September 2019
* Package patch update for changes to @glass/base v0.15.0

### version 0.13.2
*Released*: 21 August 2019
* Package patch update for changes to @glass/base v0.14.1

### version 0.13.1
*Released*: 19 August 2019
* Allow showing * in required field's label when checkRequiredFields is false for QueryInfoForm or QueryFormInput

### version 0.13.0
*Released*: 16 August 2019
* add deleteAssayDesign method, AssayDesignDeleteConfirmModal

### version 0.12.0
*Released*: 16 August 2019
* add ImportWithRenameConfirmModal and checkForDuplicateAssayFiles method
* add AssayReimportHeader component
* add actions for getRunDataModel, getRunRow, getBatchDataModel, getBatchRow
* update AssayImportPanels to accept an optional runId for pre-populating
* add optional queryColumns parameter for Detail component to be able to modify the columns in the detail view
* in RunDataPanel, support display of previous run's data when reimporting.
* add param to support cascade delete of replaced runs in deleteAssayRuns API call

### version 0.11.7
*Released*: 15 August 2019
* Issue 37827: update Detail and DetailEditing display columns

### version 0.11.6
*Released*: 13 August 2019
* Package patch update for changes to @glass/base v0.12.0

### version 0.11.5
*Released*: 8 Aug 2019
* Add "appEditable", "asSubPanel", "title", "cancelText", "onEditToggle", and "submitText" to DetailEditing
* fix "Invalid prop 'value' of type 'number' supplied to 'Input'" error on bulk form

### version 0.11.4
*Released*: 5 Aug 2019
* Issue 38097: improve lookup search perf using ~q filter

### version 0.11.3
*Released*: 31 July 2019
* Package patch update for changes to @glass/base v0.11.1

### version 0.11.2
*Released*: 30 Jul 2019
*  Update SearchResultCard to show Sample Sets

### version 0.11.1
*Released*: 25 July 2019
* Issue 37993: add missing "isUpdate" parameter for call to updateSampleSet

### version 0.11.0
*Released*: 24 July 2019
* port FormStep and related helpers from Biologics
* port handleInputTab and handleTabKeyOnTextArea from Biologics
* add AssayWizardModel, BatchPropertiesPanel, RunPropertiesPanel, and RunDataPanel from Biologics
* port AssayUploadGridLoader, AssayUploadResultModel, uploadAssayRunFiles and importAssayRun from Biologics
* add deleteAssayRuns method, AssayRunDeleteConfirmModal, and AssayResultDeleteConfirmModal
* factor out AssayImportSubMenuItem and getImportItemsForAssayDefinitions and port from Biologics
* port loadSelectedSamples from Biologics and export getSelection

### version 0.10.3
*Released*: 23 July 2019
* Add columnFilter to QueryInfoForm

### version 0.10.2
*Released*: 23 July 2019
* For QueryInfoForm, add ability to disable Submit until change is made
* For QueryInfoForm, add onFormChange handler

### version 0.10.1
*Released*: 17 July 2019
* Fix @glass/base dependencies for omnibox package

### version 0.10.0
*Released*: 17 July 2019
* add support for messages to QueryGrid
* enables hot reloading of CSS in Storybook for all packages

### version 0.9.1
*Released*: 17 June 2019
*  Update package for changes to @glass/base v0.9.0

### version 0.9.0
*Released*: 10 July 2019
* Update SampleDeleteConfirmModal to account for restrictions on deleting samples
* Add getSampleDeleteConfirmationData method for use in delete confirmations

### version 0.8.1
*Released*: 10 July 2019
* Issue 37915: add asterisk to required Name field in sample set details panel
* Port createQueryGridModelFilteredBySample from Biologics

### version 0.8.0
*Released*: 8 July 2019
* Add createSampleSet, updateSampleSet, and deleteSampleSet functions
* Add SampleSetDetailsPanel and SampleSetDeleteConfirmModal components

### version 0.7.0
*Released*: 3 July 2019
* For QueryInfoForm, add placeholders using queryColumn captions
* Add optional footer for QueryInfoForm
* Add optional second type of submit button (either submit to grid or submit to save) for QueryInfoForm
* Expose more formatting properties for EditableGrid (bordered, condensed, striped)
* Add readOnlyColumns property to EditableGrid so you can display a set of columns that are not editable
* Add option to EditableGrid to show update columns instead of insert columns
* Add styling properties to EditableGridPanel (bsStyle, className)
* Add FieldLabel component for showing labels particularly in the QueryInfoForm
* Add option to QueryInfoForm to show enable/disable toggle
* Update styling of DetailEditing to be more consistent with other forms
* Re-implement CheckboxInput to not use Checkbox from formsy-react-components
* Add getSelectedData method for retrieving all data for the selectedIds in a QueryGridModel


### version 0.6.2
*Released*: 3 July 2019
* EditableGrid updates to only use LookupCell and initLookups for lookup queries that are public

### version 0.6.1
*Released*: 24 June 2019
* Issue 37773: QueryGridPanel has inconsistent padding on button groups with and without paging

### version 0.6.0
*Released*: 19 June 2019
* Port importData function and related interfaces from Biologics
* Add content prop to LabelOverlay
* Add onTargetSampleSetChange prop to SampleInsertPanel

### version 0.5.3
*Released*: 05 June 2019
*  Update package for changes to @glass/base v0.5.2

### version 0.5.1
*Released*: 05 June 2019
* Update external package versions

### version 0.5.0
*Released*: 04 June 2019
* Port HeatMap components from Biologics
* PageDetailHeader, DetailEditing, updateRows, deleteRows, and related actions/models from Biologics
* Select (now called LookupSelectInput) input from Biologics
* SearchResultsPanel, SearchResultCard, SearchResultsModel, and searchUsingIndex from Biologics
* SampleDeleteConfirmModal

### version 0.4.0
*Released*: 03 June 2019
* Port QueryFormInputs and the various input fields from Biologics
* Port QuerySelect, SelectInput and related actions/models from Biologics
* Add optional remove parameter to the gridInvalidate methods
* Port URLService, AssayResolver, AssayRunResolver, ListResolver, and SamplesResolver from Biologics
* Port insertRows function from Biologics
* Update package for changes to @glass/base
* Add option for AddRowsControl to have a "quick add" menu option as well
* When removing queryGridModel, also remove the corresponding editGridModel
* Add DATA_CLASSES schema
* convert InsertRowsResponse to class and export it
* add addColumns, changeColumn, and removeColumn for modifying an EditableGrid model (and the corresponding QueryGriModel)
* change AddRowsControl to allow deletion of value in the input field (setting to undefined instead of min value)
* add validateData method to EditorModel for validating required fields and uniqueness
* Add SampleInsertPanel (with EditableGrid component)

### version 0.3.2
*Released*: 03 June 2019
* Package patch update for changes to @glass/base v0.3.0

### version 0.3.1
*Released*: 27 May 2019
* Package patch update for fix in omnibox package (issue 37379)

### version 0.3.0
*Released*: 22 May 2019
* Package minor update for changes to @glass/base v0.2.0

### version 0.2.0
*Released*: 29 April 2019
* Update EditableGrid to allow for bulk removal of rows in the grid
* Update EditableGrid to allow for read-only columns and placeholder text

### version 0.1.8
*Released*: 25 April 2019
* Add FileAttachmentForm and related components to @glass/base

### version 0.1.7
*Released*: 23 April 2019
* React bootstrap typings - augment @types/react-bootstrap and make shareable

### version 0.1.6
*Released*: 16 April 2019
* initial documented release
