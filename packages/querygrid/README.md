# @glass/querygrid

Query Grid for LabKey schema/query data views 

## Release Notes ##

### version ???
*Released*: ???
* Add createSampleSet and deleteSampleSet functions
* Add SampleSetCreatePanel and SampleSetDeleteConfirmModal components 

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
