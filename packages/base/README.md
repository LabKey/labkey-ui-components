# @glass/base

Base components, models, and utility functions for LabKey applications and pages

## Release Notes ##

### version ???
*Released*: ???
* port FileAttachmentFormModel and Footer from Biologics
* add getDomainColumns() to AssayDefinitionModel
* export SubMenuItemProps and ISubItem for Biologics use cases

### version 0.9.0
*Released*: 17 July 2019
* Add LabelHelpTip as a general component for adding help tips and popovers next to a form label

### version 0.8.2
*Released*: 10 July 2019
* Modify ConfirmModal properties so most are optional

### version 0.8.1
*Released*: 10 July 2019
* Export misc assay models and date utility functions for Biologics usages (AssayDomainTypes, AssayLink, AssayUploadTabs, getDateFormat, isSampleLookup)
* Port recent changes to glass components from Biologics dev and bug fixes (SubMenuItem popover key, AssayDefinitionModel functions for getting sample columns, add WhereFilterType) 

### version 0.8.0
*Released*: 8 July 2019
* Add DesignSampleSetPermission to PermissionTypes

### version 0.7.0
*Released*: 3 July 2019
* Add unorderedEqual for checking of two arrays have the same elements in any order
* export dismissNotifications
* add optional parameters to SelectionMenuItem for maximum number of selected items and for specifying noun used in messages
* add method getCommonDataValues to create a map containing the data values shared across multiple rows of data (represented as a map)
* add getPkData method to QueryGridModel

### version 0.6.0
*Released*: 19 June 2019
* Include FilePreviewGrid functionality with FileAttachmentForm
* Add createGeneralAssayDesign, importGeneralAssayRun, and inferDomainFromFile actions and InferDomainResponse model
* port Cards (renamed from Dashboard) and WizardNavButtons from Biologics
* new ToggleButtons component
* add 'Download Template' button option to FileAttachmentForm component

### version 0.5.3
*Released*: 05 June 2019
* Use release version of @labkey/dependencies

### version 0.5.1
*Released*: 05 June 2019
* Update external package versions

### version 0.5.0
*Released*: 04 June 2019
* port SVGIcon and CreatedModified from Biologics
* port AssayDefinitionModel and fetchAllAssays from Biologics
* ManageDropdownButton and SelectionMenuItem

### version 0.4.0
*Released*: 03 June 2019
* port caseInsensitive, similaritySortFactory, spliceURL functions from Biologics
* port AssayProtocolModel and fetchProtocol model from Biologics
* export datePlaceholder function
* export capitalizeFirstChar utility method
* Add method inserting columns into QueryInfo

### version 0.3.0
*Released*: 03 June 2019
* Add ConfirmModal component

### version 0.2.0
*Released*: 22 May 2019
* PaginationButtons component and PaginationButtonsProps

### version 0.1.8
*Released*: 25 April 2019
* Add FileAttachmentForm and related components

### version 0.1.7
*Released*: 23 April 2019
* React bootstrap typings - augment @types/react-bootstrap and make shareable

### version 0.1.6
*Released*: 16 April 2019
* initial documented release


