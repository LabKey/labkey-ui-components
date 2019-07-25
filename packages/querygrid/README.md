# @glass/querygrid

Query Grid for LabKey schema/query data views 

## Release Notes ##

### version XXX
*Released*: XXX
* Add "appEditable", "asSubPanel", "title", "cancelText" and "submitText" to DetailEditing

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
