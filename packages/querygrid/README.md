# @glass/querygrid

Query Grid for LabKey schema/query data views 

## Release Notes ##

### version ???
*Released*: ???
* Port HeatMap components from Biologics
* PageDetailHeader, DetailEditing, updateRows and related actions/models from Biologics
* Select (now called LookupSelectInput) input from Biologics

### version ???
*Released*: ???
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
