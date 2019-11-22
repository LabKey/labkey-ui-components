# @glass/domainproperties

Domain property related components for LabKey domains

## Release Notes ##

### version 0.0.55
*Released*: 22 November 2019
* Package patch update for changes to @glass/base v0.23.0

### version 0.0.54
*Released*: 19 November 2919
Package patch update for changes to @glass/base v0.22.1

### version 0.0.53
*Released*: 19 November 2019
* Issues 39033-39035: Fix SM assay designer usages with extra app validation for sample lookup field

### version 0.0.52
*Released*: 18 November 2019
* Package patch update for changes to @glass/base v0.22.0 

### version 0.0.51
*Released*: 13 November 2019
* Package patch update for changes to @glass/base v0.21.2

### version 0.0.50
*Released*: 12 November 2019
* Item 6528: More assay and domain designer feedback changes, bug fixes, and polish

### version 0.0.49
*Released*: 8 November 2019
* Item 6493: Assay designer feedback changes, bug fixes, and polish
* Package patch update for changes to @glass/base 0.21.1

### version 0.0.48
*Released*: 5 November 2019
* Use some css classes factored out into base for DomainRow and DomainForm

### version 0.0.47
*Released*: 5 November 2019
* Package patch update to fix downstream package.lock files

### version 0.0.46
*Released*: 5 November 2019
* Package patch update for changes to @glass/base v0.20.2

### version 0.0.45
*Released*: 31 October 2019
* Item 6451: Domain designer feedback changes, bug fixes, and polish
* Issue 38685: UX Assay Designer: Default values for select fields
* Issue 38771: Assay designer: default value type not set/respected for assay properties

### version 0.0.44
*Released*: 25 October 2019
* Update AssayDesignerPanels & DomainForm to accept a header renderer
* Added Sample_Type for simplified lookup to SampleSets
* Added newDesignFields property to initialize the DomainForm with when creating
* Added RANGE_URIS constant to expose range uri values 

### version 0.0.43
*Released*: 24 October 2019
* Package patch update for changes to @glass/base v0.20.0

### version 0.0.42
*Released*: 23 October 2019
* Item 5917: Conditional Formatting and Property Validators
    * Add Conditional Formatting and Property Validators section to expanded Domain Row
    * Add Conditional Formatting options dialog
    * Add Regex Validator options dialog
    * Add Range Validator options dialog for appropriate data types
    * Add Default Values options to Advanced Settings

### version 0.0.41
*Released*: 17 October 2019
* Item 6199: support other assay provider types in AssayDesignerPanels and AssayPropertiesPanel
    * update fetchProtocol to work for getting template based on provider name and for copy assay scenario
    * remove default AssayProtocolModel creation from AssayDesignerPanels component and require a model be passed in as props
    * AssayPropertiesPanel support for additional top-level properties and conditional display of those props based on provider type
    * remove createGeneralAssayDesign helper in favor of saveAssayDesign (which takes an AssayProtocolModel)
    * better helpURL support for AssayDesignerPanels and AssayPropertiesPanel
    * support domain lookup field type support for locked fields (i.e. should show lookup option values, even if they are not in the virtual schema)
    * rename lookup fields QuerySelect to TargetTableSelect to avoid confusion with other QuerySelect component
    * for assays, set field lockType based on assay protocol mandatory fields list

### version 0.0.40
*Released*: 26 September 2019
* Package patch update for changes to @glass/base v0.19.0

### version 0.0.39
*Released*: 26 September 2019
* Add container attribute to IDomainDesign and DomainDesign
* Add container attribute to AssayProtocolModel

### version 0.0.38
*Released*: 20 September 2019
* Package patch update for changes to @glass/base v0.18.0

### version 0.0.37
*Released*: 19 September 2019
* Package patch update for changes to @glass/base v0.17.0

### version 0.0.36
*Released*: 17 September 2019
* Update @glass/base dependency to 0.16.0

### version 0.0.35
*Released*: 17 September 2019
* Package patch update for changes to @glass/base v0.15.3

### version 0.0.34
*Released*: 9 September 2019
* updated jest snaps

### version 0.0.33
*Released*: 6 September 2019
* Sticky field headers
* Drag n drop handlers and updated drag n drop styling
* Expand row on type or name field click
* Updated header and empty domain state
* Search field and handler
* Remove attachment and file options where not applicable

### version 0.0.32
*Released*: 3 September 2019
* AssayPropertiesPanel for top level assay design properties for create/update (note: currently only supports the assay options relevant for the Sample Management app)
* move AssayProtocolModel (and related actions) from base to domainproperties
* add saveAssayDesign function which calls assay-saveProtocol.api
* DomainForm updates for allowing panel expand/collapse, mark as complete, and infer from file empty state
* AssayDesignerPanels component to wrap AssayPropertiesPanel with DomainForms for General assay domains (batch, run, data)

### version 0.0.31
*Released*: 21 August 2019
* Epic 6000: Domain designer Advanced Settings.
    - Advanced settings added to each domain property
    - PHI and various display settings
    
### version 0.0.30
*Released*: 18 August 2019
* Epic 5859: Error validation and display in domain designer
    - Add/highlight/clear client side warnings on invalid names
    - Add/highlight/clear server side errors
    - Banner messages for both client and server side warnings/errors

### version 0.0.29
*Released*: 16 August 2019
* Package patch update for changes to @glass/base v0.14.0

### version 0.0.28
*Released*: 16 August 2019
* Package patch update for changes to @glass/base v0.13.0

### version 0.0.27
*Released*: 15 August 2019
* Package patch update for changes to @glass/base v0.12.1

### version 0.0.26
*Released*: 13 August 2019
* Package patch update for changes to @glass/base v0.12.0

### version 0.0.25
*Released*: 8 Aug 2019
* Package patch update for changes to @glass/base v0.11.2

### version 0.0.24
*Released*: 31 July 2019
* Item 5718: Domain designer lookup field support

### version 0.0.23
*Released*: 24 July 2019
* Package patch update for changes to @glass/base v0.11.0

### version 0.0.22
*Released*: 17 July 2019
* Package patch update for changes to @glass/base v0.10.0

### version 0.0.21
*Released*: 17 July 2019
* Epic 5862: Domain designer type dependent fields.
    - Add data type dependent section to expanded row fields.
    - Numeric, boolean, text and date/time sections added.

### version 0.0.20
*Released*: 10 July 2019
* Package patch update for changes to @glass/base v0.8.2

### version 0.0.19
*Released*: 10 July 2019
* Package patch update for changes to @glass/base v0.8.1

### version 0.0.18
*Released*: 8 July 2019
* Package patch update for changes to @glass/base v0.8.0

### version 0.0.17
*Released*: 3 July 2019
* Package patch update for changes to @glass/base v0.7.0

### version 0.0.16
*Released*: 19 June 2019
* Add DomainForm boolean property for showHeader, default true

### version 0.0.15
*Released*: 05 June 2019
*  Update package for changes to @glass/base v0.5.2

### version 0.0.13
*Released*: 05 June 2019
* Update external package versions

### version 0.0.12
*Released*: 04 June 2019
* Update package for changes to @glass/base v0.5.0

### version 0.0.11
*Released*: 03 June 2019
* Update package for changes to @glass/base v0.4.0

### version 0.0.10
*Released*: 03 June 2019
* Epic 5420: Domain Designer, allow add/remove of field rows in domain
    - updated display for domain state with no fields
    - including drag-n-drop to reorder fields
* Epic 5716: Domain Designer, add expended field inputs for description, url, label, and import aliases

### version 0.0.9
*Released*: 22 May 2019
* Package patch update for changes to @glass/base v0.2.0

### version 0.0.8
*Released*: 26 April 2019
* Epic 5419: Domain Designer, Edit standard settings name/type/required
    - initial version of the DomainForm and DomainRow components
    - including hot reloading of scss changes for the glass domainproperties package
    - initial stories for DomainFieldsDisplay and DomainForm for storybook

### version 0.0.7
*Released*: 25 April 2019
* Add FileAttachmentForm and related components to @glass/base

### version 0.0.5
*Released*: 8 April 2019
* initial documented release


