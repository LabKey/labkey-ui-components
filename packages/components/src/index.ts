/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { GRID_CHECKBOX_OPTIONS, PermissionTypes } from './components/base/models/constants';
import { SCHEMAS } from './components/base/models/schemas';
import {
    fetchAllAssays,
    getUserProperties,
    importGeneralAssayRun,
    inferDomainFromFile,
} from './components/base/actions';
import {
    AssayDefinitionModel,
    AssayDomainTypes,
    AssayLink,
    AssayUploadTabs,
    Container,
    IGridLoader,
    IGridResponse,
    InferDomainResponse,
    insertColumnFilter,
    LastActionStatus,
    MessageLevel,
    QueryColumn,
    QueryGridModel,
    QueryInfo,
    QueryInfoStatus,
    QueryLookup,
    SchemaDetails,
    SchemaQuery,
    User,
    ViewInfo,
} from './components/base/models/model';
import {
    applyDevTools,
    capitalizeFirstChar,
    caseInsensitive,
    debounce,
    devToolsActive,
    generateId,
    getSchemaQuery,
    hasAllPermissions,
    naturalSort,
    resolveKey,
    resolveKeyFromJson,
    resolveSchemaQuery,
    toggleDevTools,
    valueIsEmpty,
} from './util/utils';
import { getActionErrorMessage, resolveErrorMessage } from './util/messaging';
import { buildURL, hasParameter, imageURL, toggleParameter } from './url/ActionURL';
import { WHERE_FILTER_TYPE } from './url/WhereFilterType';
import { AddEntityButton } from './components/buttons/AddEntityButton';
import { RemoveEntityButton } from './components/buttons/RemoveEntityButton';
import { AppURL, spliceURL } from './url/AppURL';
import { Alert } from './components/base/Alert';
import { DeleteIcon } from './components/base/DeleteIcon';
import { DragDropHandle } from './components/base/DragDropHandle';
import { FieldExpansionToggle } from './components/base/FieldExpansionToggle';
import { MultiMenuButton } from './components/menus/MultiMenuButton';
import { MenuOption, SubMenu } from './components/menus/SubMenu';
import { ISubItem, SubMenuItem, SubMenuItemProps } from './components/menus/SubMenuItem';
import { SelectionMenuItem } from './components/menus/SelectionMenuItem';
import { LoadingModal } from './components/base/LoadingModal';
import { LoadingSpinner } from './components/base/LoadingSpinner';
import { InsufficientPermissionsAlert } from './components/base/InsufficientPermissionsAlert';
import { NotFound } from './components/base/NotFound';
import { Page, PageProps } from './components/base/Page';
import { LoadingPage, LoadingPageProps } from './components/base/LoadingPage';
import { PageHeader } from './components/base/PageHeader';
import { Progress } from './components/base/Progress';
import { LabelHelpTip } from './components/base/LabelHelpTip';
import { Tip } from './components/base/Tip';
import { Grid, GridColumn, GridProps } from './components/base/Grid';
import { FormSection } from './components/base/FormSection';
import { Section } from './components/base/Section';
import { FileAttachmentForm } from './components/files/FileAttachmentForm';
import { DEFAULT_FILE, FileAttachmentFormModel, IFile } from './components/files/models';
import { FilesListing } from './components/files/FilesListing';
import { FilesListingForm } from './components/files/FilesListingForm'
import { FileAttachmentEntry } from './components/files/FileAttachmentEntry'
import { WebDavFile, getWebDavFiles, uploadWebDavFile } from './components/files/WebDav';
import { FileTree } from './components/files/FileTree';
import { Notification } from './components/notifications/Notification';
import { createNotification } from './components/notifications/actions';
import { dismissNotifications, initNotificationsState } from './components/notifications/global';
import { ConfirmModal } from './components/base/ConfirmModal';
import { datePlaceholder, formatDate, formatDateTime, getDateFormat, getUnFormattedNumber } from './util/Date';
import { SVGIcon, Theme } from './components/base/SVGIcon';
import { CreatedModified } from './components/base/CreatedModified';
import { MessageFunction, NotificationItemProps, Persistence } from './components/notifications/model';
import { PermissionAllowed, PermissionNotAllowed } from './components/base/Permissions';
import { PaginationButtons, PaginationButtonsProps } from './components/buttons/PaginationButtons';
import { ManageDropdownButton } from './components/buttons/ManageDropdownButton';
import { WizardNavButtons } from './components/buttons/WizardNavButtons';
import { SplitButtonGroup } from './components/buttons/SplitButtonGroup';
import { ToggleButtons } from './components/buttons/ToggleButtons';
import { Cards } from './components/base/Cards';
import { Footer } from './components/base/Footer';

import { EditorModel, getStateQueryGridModel, getStateModelId, IDataViewInfo } from './models';
import {
    createQueryGridModelFilteredBySample,
    getSelected,
    getSelection,
    gridIdInvalidate,
    gridInit,
    gridInvalidate,
    gridShowError,
    queryGridInvalidate,
    schemaGridInvalidate,
    setSelected,
    unselectAll,
} from './actions';
import {
    getEditorModel,
    getQueryGridModel,
    getQueryGridModelsForGridId,
    initQueryGridState,
    invalidateLineageResults,
    invalidateUsers,
    removeQueryGridModel
} from './global';
import {
    deleteRows,
    getQueryDetails,
    IImportData,
    importData,
    InsertFormats,
    InsertOptions,
    insertRows,
    InsertRowsResponse,
    invalidateQueryDetailsCacheKey,
    ISelectRowsResult,
    searchRows,
    selectRows,
    updateRows,
} from './query/api';
import { loadReports, flattenBrowseDataTreeResponse } from './query/reports';
import { IMPORT_DATA_FORM_TYPES, MAX_EDITABLE_GRID_ROWS, NO_UPDATES_MESSAGE, DataViewInfoTypes } from './constants';
import { getLocation, Location, replaceParameter, replaceParameters, resetParameters } from './util/URL';
import { URLResolver } from './util/URLResolver';
import { URLService } from './util/URLService';
import { DATA_IMPORT_TOPIC, DELETE_SAMPLES_TOPIC, getHelpLink, helpLinkNode } from './util/helpLinks';
import {
    AppRouteResolver,
    AssayResolver,
    AssayRunResolver,
    ListResolver,
    SampleSetResolver,
    SamplesResolver
} from './util/AppURLResolver';
import { QueryGridPanel } from './components/QueryGridPanel';
import { EditableGridPanel } from './components/editable/EditableGridPanel';
import { EditableGridPanelForUpdate } from './components/editable/EditableGridPanelForUpdate';
import { EditableGridLoader } from './components/editable/EditableGridLoader';
import { EditableGridLoaderFromSelection } from './components/editable/EditableGridLoaderFromSelection';
import { EditableGridModal } from './components/editable/EditableGridModal';
import { EditableColumnMetadata } from './components/editable/EditableGrid';
import { CollapsiblePanel } from './components/CollapsiblePanel';
import { AliasRenderer } from './renderers/AliasRenderer';
import { AppendUnits } from './renderers/AppendUnits';
import { DefaultRenderer } from './renderers/DefaultRenderer';
import { FileColumnRenderer } from './renderers/FileColumnRenderer';
import { MultiValueRenderer } from './renderers/MultiValueRenderer';
import { BulkAddUpdateForm } from './components/forms/BulkAddUpdateForm';
import { BulkUpdateForm } from './components/forms/BulkUpdateForm';
import { LabelOverlay } from './components/forms/LabelOverlay';
import { LookupSelectInput } from './components/forms/input/LookupSelectInput';
import { SelectInput } from './components/forms/input/SelectInput';
import { DatePickerInput } from './components/forms/input/DatePickerInput';
import { QuerySelect, QuerySelectOwnProps } from './components/forms/QuerySelect';
import { PageDetailHeader } from './components/forms/PageDetailHeader';
import { DetailEditing } from './components/forms/detail/DetailEditing';
import { resolveDetailRenderer } from './components/forms/detail/DetailEditRenderer';
import { Detail } from './components/forms/detail/Detail';
import { getUsersWithPermissions, handleInputTab, handleTabKeyOnTextArea } from './components/forms/actions';
import { ISelectInitData, IUser } from './components/forms/model';
import { FormStep, FormTabs, withFormSteps, WithFormStepsProps } from './components/forms/FormStep';
import { SchemaListing } from './components/listing/SchemaListing';
import { QueriesListing } from './components/listing/QueriesListing';
import { HeatMap } from './components/heatmap/HeatMap';
import { addDateRangeFilter, last12Months, monthSort } from './components/heatmap/utils';
import { EntityInsertPanel } from './components/entities/EntityInsertPanel';
import { SearchResultCard } from './components/search/SearchResultCard';
import { SearchResultsPanel } from './components/search/SearchResultsPanel';
import { searchUsingIndex } from './components/search/actions';
import { SearchResultsModel } from './components/search/models';
import { deleteSampleSet, getSampleSet, loadSelectedSamples, } from './components/samples/actions';
import { SampleSetDeleteConfirmModal } from './components/samples/SampleSetDeleteConfirmModal';
import { SampleSetDetailsPanel } from './components/samples/SampleSetDetailsPanel';
import { DataClassDesigner } from './components/domainproperties/dataclasses/DataClassDesigner';
import { DataClassModel } from './components/domainproperties/dataclasses/models';
import { fetchDataClass } from './components/domainproperties/dataclasses/actions';
import { AssayImportPanels } from './components/assay/AssayImportPanels';
import { BatchPropertiesPanel } from './components/assay/BatchPropertiesPanel';
import { RunPropertiesPanel } from './components/assay/RunPropertiesPanel';
import { RunDataPanel } from './components/assay/RunDataPanel';
import { AssayUploadGridLoader } from './components/assay/AssayUploadGridLoader';
import { AssayDesignDeleteConfirmModal } from './components/assay/AssayDesignDeleteConfirmModal';
import { AssayResultDeleteConfirmModal } from './components/assay/AssayResultDeleteConfirmModal';
import { AssayRunDeleteConfirmModal } from './components/assay/AssayRunDeleteConfirmModal';
import { AssayImportSubMenuItem } from './components/assay/AssayImportSubMenuItem';
import {
    AssayUploadResultModel,
    AssayWizardModel,
    IAssayUploadOptions,
    IAssayURLContext,
} from './components/assay/models';
import {
    deleteAssayDesign,
    deleteAssayRuns,
    getBatchPropertiesModel,
    getBatchPropertiesRow,
    getImportItemsForAssayDefinitions,
    getRunPropertiesModel,
    getRunPropertiesRow,
    importAssayRun,
    uploadAssayRunFiles,
} from './components/assay/actions';
import { ReportItemModal, ReportList, ReportListItem } from './components/report-list/ReportList';
import { LINEAGE_GROUPING_GENERATIONS } from './components/lineage/constants';
import { LineageFilter } from './components/lineage/models';
import { VisGraphNode } from './components/lineage/vis/VisGraphGenerator';
import { LineageGraph } from './components/lineage/LineageGraph';
import { LineageGrid } from './components/lineage/LineageGrid';
import { EntityDeleteConfirmModal } from './components/entities/EntityDeleteConfirmModal';
import { SampleTypeLineageCounts } from './components/lineage/SampleTypeLineageCounts';
import { HeaderWrapper } from './components/navigation/HeaderWrapper';
import { NavigationBar } from './components/navigation/NavigationBar';
import { NavItem } from './components/navigation/NavItem';
import { MenuSectionConfig } from './components/navigation/ProductMenuSection';
import { ITab, SubNav } from './components/navigation/SubNav';
import { Breadcrumb } from './components/navigation/Breadcrumb';
import { BreadcrumbCreate } from './components/navigation/BreadcrumbCreate';
import { MenuItemModel, MenuSectionModel, ProductMenuModel } from './components/navigation/model';
import { UserSelectInput } from './components/forms/input/UserSelectInput';
import { UserDetailHeader } from './components/user/UserDetailHeader';
import { UserProfile } from './components/user/UserProfile';
import { ChangePasswordModal } from './components/user/ChangePasswordModal';
import { SiteUsersGridPanel } from './components/user/SiteUsersGridPanel';

import {
    createFormInputId,
    fetchDomain,
    saveDomain,
    setDomainFields,
} from './components/domainproperties/actions';
import {
    DomainDesign,
    DomainField,
    IAppDomainHeader,
    IBannerMessage,
    IDomainField,
    IFieldChange,
    SAMPLE_TYPE,
} from './components/domainproperties/models';
import DomainForm from './components/domainproperties/DomainForm';
import { DomainFieldsDisplay } from './components/domainproperties/DomainFieldsDisplay';
import { fetchProtocol, saveAssayDesign } from './components/domainproperties/assay/actions';
import { AssayProtocolModel } from './components/domainproperties/assay/models';
import { AssayPropertiesPanel } from './components/domainproperties/assay/AssayPropertiesPanel';
import { AssayDesignerPanels } from './components/domainproperties/assay/AssayDesignerPanels';
import { ListDesignerPanels } from "./components/domainproperties/list/ListDesignerPanels";
import { ListModel } from "./components/domainproperties/list/models";
import { fetchListDesign, getListProperties } from "./components/domainproperties/list/actions";
import {
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    RANGE_URIS,
    SAMPLE_TYPE_CONCEPT_URI,
} from './components/domainproperties/constants';
import { ExpandableContainer } from './components/ExpandableContainer';
import { PermissionAssignments } from './components/permissions/PermissionAssignments';
import { PermissionsPageContextProvider } from './components/permissions/PermissionsContextProvider';
import { PermissionsProviderProps, Principal, SecurityPolicy, SecurityRole } from './components/permissions/models';
import { fetchContainerSecurityPolicy } from './components/permissions/actions';
import { getDataDeleteConfirmationData, getSampleDeleteConfirmationData } from './components/entities/actions';
import { EntityDataType } from './components/entities/models';
import { SampleTypeDataType, DataClassDataType } from './components/entities/constants';


export {
    // global state functions
    initQueryGridState,
    getStateQueryGridModel,
    getStateModelId,
    getQueryGridModel,
    getQueryGridModelsForGridId,
    getEditorModel,
    removeQueryGridModel,

    // grid functions
    getSelected,
    getSelection,
    gridInit,
    gridInvalidate,
    gridIdInvalidate,
    queryGridInvalidate,
    schemaGridInvalidate,
    gridShowError,

    // query related items
    ISelectRowsResult,
    InsertRowsResponse,
    IImportData,
    InsertFormats,
    InsertOptions,
    insertRows,
    selectRows,
    searchRows,
    updateRows,
    deleteRows,
    importData,
    getQueryDetails,
    invalidateQueryDetailsCacheKey,
    setSelected,
    unselectAll,

    // editable grid related items
    MAX_EDITABLE_GRID_ROWS,
    NO_UPDATES_MESSAGE,
    EditableGridLoaderFromSelection,
    EditableGridLoader,

    // location related items
    Location,
    URLResolver,
    URLService,
    AppRouteResolver,
    AssayResolver,
    AssayRunResolver,
    ListResolver,
    SamplesResolver,
    SampleSetResolver,
    getLocation,
    replaceParameter,
    replaceParameters,
    resetParameters,

    // renderers
    AliasRenderer,
    AppendUnits,
    DefaultRenderer,
    FileColumnRenderer,
    MultiValueRenderer,
    resolveDetailRenderer,

    // components
    LabelOverlay,
    EditableGridPanel,
    EditableGridPanelForUpdate,
    EditableGridModal,
    QueryGridPanel,
    CollapsiblePanel,
    BulkAddUpdateForm,
    BulkUpdateForm,
    LookupSelectInput,
    SelectInput,
    DatePickerInput,
    QuerySelect,
    QuerySelectOwnProps,
    UserSelectInput,
    PageDetailHeader,
    DetailEditing,
    Detail,
    SchemaListing,
    QueriesListing,
    HeatMap,
    EditableColumnMetadata,
    EditorModel,
    ExpandableContainer,

    // user-related
    getUsersWithPermissions,
    invalidateUsers,
    IUser,
    UserDetailHeader,
    UserProfile,
    ChangePasswordModal,
    SiteUsersGridPanel,

    // data class
    DataClassDesigner,
    DataClassModel,
    fetchDataClass,

    // samples-related
    SampleSetDetailsPanel,
    SampleSetDeleteConfirmModal,
    deleteSampleSet,
    getSampleSet,
    createQueryGridModelFilteredBySample,
    loadSelectedSamples,

    // search-related
    SearchResultsModel,
    SearchResultCard,
    SearchResultsPanel,
    searchUsingIndex,

    // assay
    AssayUploadResultModel,
    AssayDesignDeleteConfirmModal,
    AssayResultDeleteConfirmModal,
    AssayRunDeleteConfirmModal,
    AssayWizardModel,
    IAssayURLContext,
    IAssayUploadOptions,
    AssayUploadGridLoader,
    AssayImportPanels,
    BatchPropertiesPanel,
    RunPropertiesPanel,
    RunDataPanel,
    AssayImportSubMenuItem,
    importAssayRun,
    uploadAssayRunFiles,
    deleteAssayDesign,
    deleteAssayRuns,
    getImportItemsForAssayDefinitions,
    getRunPropertiesModel,
    getRunPropertiesRow,
    getBatchPropertiesModel,
    getBatchPropertiesRow,

    // lists
    ListDesignerPanels,
    ListModel,
    fetchListDesign,
    getListProperties,

    // forms
    handleInputTab,
    handleTabKeyOnTextArea,
    withFormSteps,
    WithFormStepsProps,
    FormStep,
    FormTabs,
    ISelectInitData,
    IMPORT_DATA_FORM_TYPES,

    // heatmap
    addDateRangeFilter,
    last12Months,
    monthSort,

    // DataViewInfo
    DataViewInfoTypes,
    IDataViewInfo,

    // report-list
    loadReports,
    flattenBrowseDataTreeResponse,
    ReportListItem,
    ReportItemModal,
    ReportList,

    // lineage
    LINEAGE_GROUPING_GENERATIONS,
    LineageFilter,
    LineageGraph,
    LineageGrid,
    SampleTypeLineageCounts,
    VisGraphNode,
    invalidateLineageResults,
    getSampleDeleteConfirmationData,
    getDataDeleteConfirmationData,

    // entities
    EntityDeleteConfirmModal,
    EntityDataType,
    EntityInsertPanel,
    SampleTypeDataType,
    DataClassDataType,

    // Navigation
    MenuSectionConfig,
    ProductMenuModel,
    MenuSectionModel,
    MenuItemModel,
    HeaderWrapper,
    ITab,
    NavItem,
    NavigationBar,
    SubNav,
    Breadcrumb,
    BreadcrumbCreate,

    // DomainProperties
    DomainForm,
    DomainFieldsDisplay,
    AssayPropertiesPanel,
    AssayDesignerPanels,
    fetchDomain,
    saveDomain,
    fetchProtocol,
    createFormInputId,
    saveAssayDesign,
    setDomainFields,
    AssayProtocolModel,
    DomainDesign,
    DomainField,
    IDomainField,
    IFieldChange,
    IBannerMessage,
    IAppDomainHeader,
    SAMPLE_TYPE,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    RANGE_URIS,
    SAMPLE_TYPE_CONCEPT_URI,

    // Base
    GRID_CHECKBOX_OPTIONS,
    PermissionTypes,
    Persistence,
    SCHEMAS,
    IGridLoader,
    IGridResponse,
    GridProps,
    LoadingPageProps,
    PageProps,
    SubMenuItemProps,
    ISubItem,
    AppURL,
    AssayDefinitionModel,
    AssayDomainTypes,
    AssayLink,
    AssayUploadTabs,
    Container,
    User,
    QueryColumn,
    QueryGridModel,
    QueryInfo,
    QueryLookup,
    QueryInfoStatus,
    SchemaDetails,
    SchemaQuery,
    ViewInfo,
    MessageLevel,
    MessageFunction,
    NotificationItemProps,
    LastActionStatus,
    GridColumn,
    InferDomainResponse,
    FileAttachmentFormModel,
    DEFAULT_FILE,
    IFile,
    FilesListing,
    FilesListingForm,
    FileAttachmentEntry,
    FileTree,
    WebDavFile,
    getWebDavFiles,
    uploadWebDavFile,
    AddEntityButton,
    RemoveEntityButton,
    Alert,
    DeleteIcon,
    DragDropHandle,
    FieldExpansionToggle,
    LoadingModal,
    LoadingSpinner,
    LoadingPage,
    InsufficientPermissionsAlert,
    NotFound,
    Page,
    PageHeader,
    Progress,
    LabelHelpTip,
    MenuOption,
    MultiMenuButton,
    Notification,
    SubMenu,
    SubMenuItem,
    Tip,
    Grid,
    PermissionAllowed,
    PermissionNotAllowed,
    PaginationButtons,
    PaginationButtonsProps,
    FormSection,
    Section,
    FileAttachmentForm,
    ConfirmModal,
    CreatedModified,
    SelectionMenuItem,
    ManageDropdownButton,
    WizardNavButtons,
    SplitButtonGroup,
    ToggleButtons,
    Cards,
    Footer,
    fetchAllAssays,
    importGeneralAssayRun,
    inferDomainFromFile,
    getUserProperties,
    createNotification,
    dismissNotifications,
    initNotificationsState,
    datePlaceholder,
    getDateFormat,
    getUnFormattedNumber,
    formatDate,
    formatDateTime,

    // images
    Theme,
    SVGIcon,

    // util functions
    caseInsensitive,
    capitalizeFirstChar,
    getSchemaQuery,
    resolveKey,
    resolveKeyFromJson,
    resolveSchemaQuery,
    insertColumnFilter,
    hasAllPermissions,
    naturalSort,
    generateId,
    debounce,
    valueIsEmpty,
    getActionErrorMessage,
    resolveErrorMessage,
    getHelpLink,
    helpLinkNode,
    DATA_IMPORT_TOPIC,
    DELETE_SAMPLES_TOPIC,

    // url functions
    buildURL,
    hasParameter,
    imageURL,
    toggleParameter,
    spliceURL,
    WHERE_FILTER_TYPE,

    // devTools functions
    applyDevTools,
    devToolsActive,
    toggleDevTools,

    // Permissions
    fetchContainerSecurityPolicy,
    PermissionAssignments,
    PermissionsPageContextProvider,
    PermissionsProviderProps,
    SecurityPolicy,
    SecurityRole,
    Principal
}
