# @glass/base

Base components, models, and utility functions for LabKey applications and pages

## Release Notes ##

### version 0.23.0
*Released*: 22 November 2019
* port FilesListing from Biologics

### version 0.22.1
*Released*: 19 November 2019
* Change styling of DeleteIcon

### version 0.22.0
*Released*: 18 November 2019
* Section component - make title prop optional
* schemas.ts - add core.Users table to default set of SchemaQuerys

### version 0.21.2
*Released*: 13 November 2019
* export WHERE_FILTER_TYPE

### version 0.21.1
*Released*: 8 November 2019
* Item 6493: LabelHelpTip updates for size, customStyle, required, and iconComponent props
* Fix for buildURL helper to pass LABKEY.container.path as default instead of undefined

### version 0.21.0
*Released*: 5 November 2019
* Modify getImportURL for AssayDefinitionModel to use the sample model's filters if present
* Add QueryGridModel properties for hideEmptyViewSelector and hideEmptyChartSelector
* Add DragDropHandle, DeleteIcon and FieldExpansionToggle components for use when rearranging 
fields with properties (factoring out of domainproperties)

### version 0.20.2
*Released*: 5 November 2019
* Fix Issue 38186
    - QueryGridModel.getAllColumns() now uses column metadata from the current view when possible.

### version 0.20.1
*Released*: 25 October 2019
* Added optional styling property for WizardNavButtons.tsx


### version 0.20.0
*Released*: 24 October 2019
* Add formatDate, formatDateTime

### version 0.19.0
*Released*: 26 September 2019
* Add isFiltered method to QueryGridModel for better support of selection on filtered grids

### version 0.18.0
*Released*: 20 September 2019
* Fix issue 38127: All number fields are treated as double fields when imported from an xls for preview grid

### version 0.17.0
*Released*: 19 September 2019
* Add getIconURL helper for QueryInfo

### version 0.16.0
*Released*: 18 September 2019
* Add TESTS_ONLY_RESET_DOM_COUNT
    * This is a tests only method that allows us to reset the counter used to generate unique ids, this way snapshot
    tests have the same results when run in a suite or individually.
* QueryGridModel: Add `reportId` as a default URL param.
* Remove incorrect ImageProps and Image definitions from react-bootstrap.d.ts
* Remove unused imports in various stories.

### version 0.15.3
*Released*: 17 September 2019
* Add constants for sampleManagement schema

### version 0.15.2
*Released*: 9 September 2019
* Updated LabelHelpTip to make id attribute a property
* Updated AddEntityButton to include LabelHelpTip and associated optional properties
* added AddEntityButton story

### version 0.15.1
*Released*: 6 September 2019
* Add standard button classes to AddEntityButton

### version 0.15.0
*Released*: 3 September 2019
* move AssayProtocolModel (and related actions) from base to domainproperties
* add FileAttachmentForm option to skipPreviewGrid display

### version 0.14.1
*Released*: 21 August 2019
* Small style update to labelHelpTip

### version 0.14.0
*Released*: 16 August 2019
* add LoadingModal

### version 0.13.0 
*Released*: 16 August 2019
* update @labkey/dependencies version to 0.0.8
* export getActionErrorMessage method for consistent error message display after an action has failed.
* update QueryGridMode.getFilters to add in baseFilters even if a key value is provided (to support overriding
a default filter that limits the set of values such that it may not include the key given, e.g., for assay runs
that have been replaced)
* change signature of fileMatchesAcceptedFormat to take a file name instead of a File (since that's all we use)
* Refactor FileAttachmentForm to accept a list of initial file names to show and initial preview data
* add getServerFilePreview method for retrieving preview data of file already on the server
* add optional parameter to getActionErrorMessage to indicate if the refresh suggestion should be shown or not.

### version 0.12.1
*Released*: 15 August 2019
* add shownInDetailsView, getDetailsDisplayColumns and getUpdateDisplayColumns to QueryGridModel

### version 0.12.0
*Released*: 13 August 2019
* add getUserProperties function (which calls user-getUserProperties API)
* change the DesignAssayPermission package path for move to assay module (from study)

### version 0.11.2
*Released*: 8 Aug 2019
* add css class for DetailEditing panel divider

### version 0.11.1
*Released*: 31 July 2019
* Update to @labkey/dependencies version 0.0.7
* export processSchemas for usage in domainproperties package

### version 0.11.0
*Released*: 24 July 2019
* port FileAttachmentFormModel and Footer from Biologics
* add getDomainColumns() to AssayDefinitionModel
* export SubMenuItemProps and ISubItem for Biologics use cases
* Fix [issue 38011](https://www.labkey.org/home/Developer/issues/issues-details.view?issueId=38011) - properly detect 
when a lookup field has not changed when editing values in the grid.

### version 0.10.0
*Released*: 17 July 2019
* add GridMessages to Grid component
* add QCAnalyst permission and add qcEnabled flag to AssayProtocolModel
* enables hot reloading of CSS in Storybook for all packages

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


