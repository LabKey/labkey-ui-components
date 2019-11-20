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
import { GRID_CHECKBOX_OPTIONS, GRID_EDIT_INDEX, GRID_SELECTION_INDEX, PermissionTypes } from './components/base/models/constants'
import { fetchGetQueries, fetchSchemas, processSchemas, SCHEMAS } from './components/base/models/schemas'
import {
    fetchAllAssays,
    getServerFilePreview,
    importGeneralAssayRun,
    inferDomainFromFile,
    getUserProperties
} from './components/base/actions'
import {
    AssayDefinitionModel,
    AssayDomainTypes,
    AssayLink,
    AssayUploadTabs,
    Container,
    IGridLoader,
    IGridResponse,
    IGridSelectionResponse,
    InferDomainResponse,
    insertColumnFilter,
    IQueryGridModel,
    LastActionStatus,
    MessageLevel,
    QueryColumn,
    QueryGridModel,
    QueryInfo,
    QueryInfoStatus,
    QueryLookup,
    QuerySort,
    SchemaDetails,
    SchemaQuery,
    User,
    ViewInfo
} from './components/base/models/model'
import {
    applyDevTools,
    capitalizeFirstChar,
    caseInsensitive,
    debounce,
    decodePart,
    devToolsActive,
    encodePart,
    generateId,
    getCommonDataValues,
    getSchemaQuery,
    getUpdatedData,
    getUpdatedDataFromGrid,
    hasAllPermissions,
    intersect,
    naturalSort,
    not,
    resolveKey,
    resolveKeyFromJson,
    resolveSchemaQuery,
    similaritySortFactory,
    toggleDevTools,
    toLowerSafe,
    unorderedEqual,
    valueIsEmpty,
} from './util/utils'
import { getActionErrorMessage } from './util/messaging'
import { buildURL, getSortFromUrl, hasParameter, imageURL, setParameter, toggleParameter } from './url/ActionURL'
import { WHERE_FILTER_TYPE } from './url/WhereFilterType'
import { AddEntityButton } from "./components/base/buttons/AddEntityButton"
import { RemoveEntityButton } from "./components/base/buttons/RemoveEntityButton"
import { AppURL, spliceURL } from "./url/AppURL";
import { Alert } from './components/base/Alert'
import { DeleteIcon } from './components/base/DeleteIcon';
import { DragDropHandle } from './components/base/DragDropHandle';
import { FieldExpansionToggle } from './components/base/FieldExpansionToggle';
import { MultiMenuButton } from './components/base/menus/MultiMenuButton';
import { MenuOption, SubMenu } from "./components/base/menus/SubMenu";
import { ISubItem, SubMenuItem, SubMenuItemProps } from "./components/base/menus/SubMenuItem";
import { SelectionMenuItem } from "./components/base/menus/SelectionMenuItem";
import { CustomToggle } from './components/base/CustomToggle'
import { LoadingModal } from './components/base/LoadingModal'
import { LoadingSpinner } from './components/base/LoadingSpinner'
import { NotFound } from './components/base/NotFound'
import { Page, PageProps } from './components/base/Page'
import { LoadingPage, LoadingPageProps } from './components/base/LoadingPage'
import { PageHeader } from './components/base/PageHeader'
import { Progress } from './components/base/Progress'
import { LabelHelpTip } from './components/base/LabelHelpTip'
import { Tip } from './components/base/Tip'
import { Grid, GridColumn, GridData, GridProps } from './components/base/Grid'
import { FormSection } from './components/base/FormSection'
import { Section } from './components/base/Section'
import { FileAttachmentForm } from './components/base/files/FileAttachmentForm'
import { FileAttachmentFormModel } from './components/base/files/models'
import { Notification } from './components/base/notifications/Notification'
import { createNotification } from './components/base/notifications/actions'
import { dismissNotifications, initNotificationsState } from './components/base/notifications/global'
import { ConfirmModal } from './components/base/ConfirmModal'
import {
    datePlaceholder,
    generateNameWithTimestamp,
    getDateFormat,
    getUnFormattedNumber,
    formatDate,
    formatDateTime
} from './util/Date';
import { SVGIcon, Theme } from './components/base/SVGIcon';
import { CreatedModified } from './components/base/CreatedModified';
import {
    MessageFunction,
    NotificationItemModel,
    NotificationItemProps,
    Persistence,
} from './components/base/notifications/model'
import { PermissionAllowed, PermissionNotAllowed, } from "./components/base/Permissions"
import { PaginationButtons, PaginationButtonsProps } from './components/base/buttons/PaginationButtons';
import { ManageDropdownButton } from './components/base/buttons/ManageDropdownButton';
import { WizardNavButtons } from './components/base/buttons/WizardNavButtons';
import { ToggleButtons } from './components/base/buttons/ToggleButtons';
import { Cards } from './components/base/Cards';
import { Footer } from './components/base/Footer';

import { DataViewInfoTypes, EditorModel, getStateQueryGridModel, IDataViewInfo, SearchResultsModel } from './models';
import {
    addColumns,
    changeColumn,
    createQueryGridModelFilteredBySample,
    getFilterListFromQuery,
    getSelected,
    getSelectedData,
    getSelection,
    gridIdInvalidate,
    gridInit,
    gridInvalidate,
    gridRefresh,
    gridShowError,
    queryGridInvalidate,
    removeColumn,
    schemaGridInvalidate,
    searchUsingIndex,
    setSelected
} from './actions';
import {
    getEditorModel,
    getQueryGridModel,
    initQueryGridState,
    invalidateLineageResults,
    invalidateProjectUsers,
    removeQueryGridModel,
    setQueryColumnRenderers,
    setQueryMetadata
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
    updateRows
} from './query/api';
import { MAX_EDITABLE_GRID_ROWS, NO_UPDATES_MESSAGE } from './constants';
import { buildQueryString, getLocation, Location, pushParameter, pushParameters, replaceParameters } from './util/URL';
import { URLResolver } from './util/URLResolver';
import { URLService } from './util/URLService';
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
import { AliasRenderer } from './renderers/AliasRenderer';
import { AppendUnits } from './renderers/AppendUnits';
import { DefaultRenderer } from './renderers/DefaultRenderer';
import { FileColumnRenderer } from './renderers/FileColumnRenderer';
import { MultiValueRenderer } from './renderers/MultiValueRenderer';
import { BulkUpdateForm } from './components/forms/BulkUpdateForm';
import { QueryInfoForm } from './components/forms/QueryInfoForm';
import { LabelOverlay } from './components/forms/LabelOverlay';
import { LookupSelectInput } from './components/forms/input/LookupSelectInput';
import { SelectInput } from './components/forms/input/SelectInput';
import { QuerySelect } from './components/forms/QuerySelect';
import { PageDetailHeader } from './components/forms/PageDetailHeader';
import { DetailEditing } from './components/forms/detail/DetailEditing';
import { resolveDetailRenderer } from './components/forms/detail/DetailEditRenderer';
import { Detail } from './components/forms/detail/Detail';
import { handleInputTab, handleTabKeyOnTextArea, getUsersWithPermissions } from './components/forms/actions';
import { IUser } from './components/forms/model';
import { FormStep, FormTabs, withFormSteps, WithFormStepsProps } from './components/forms/FormStep';
import { PlacementType } from './components/editable/Controls';
import { SchemaListing } from './components/listing/SchemaListing';
import { QueriesListing } from './components/listing/QueriesListing';
import { HeatMap } from './components/heatmap/HeatMap';
import { addDateRangeFilter, last12Months, monthSort } from './components/heatmap/utils';
import { SampleInsertPanel } from './components/samples/SampleInsertPanel';
import { SampleDeleteConfirmModal } from './components/samples/SampleDeleteConfirmModal';
import { SearchResultCard } from './components/search/SearchResultCard';
import { SearchResultsPanel } from './components/search/SearchResultsPanel';
import {
    deleteSampleSet,
    getSampleDeleteConfirmationData,
    getSampleSet,
    loadSelectedSamples
} from './components/samples/actions';
import { SampleSetDeleteConfirmModal } from './components/samples/SampleSetDeleteConfirmModal';
import { SampleSetDetailsPanel } from './components/samples/SampleSetDetailsPanel';
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
    IAssayURLContext
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
    uploadAssayRunFiles
} from './components/assay/actions';
import { PreviewGrid } from './components/PreviewGrid';
import { flattenBrowseDataTreeResponse, ReportURLMapper, } from './components/report-list/model';
import { ReportItemModal, ReportList, ReportListItem, ReportListProps } from './components/report-list/ReportList';
import { LINEAGE_GROUPING_GENERATIONS } from './components/lineage/constants'
import { LineageFilter } from './components/lineage/models'
import { VisGraphNode } from './components/lineage/vis/VisGraphGenerator'
import { LineageGraph } from './components/lineage/LineageGraph';
import { LineageGrid } from './components/lineage/LineageGrid';
import { SampleTypeLineageCounts } from './components/lineage/SampleTypeLineageCounts';
import { OmniBox } from './components/omnibox/OmniBox';
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

import {
    createFormInputId,
    fetchDomain,
    fetchProtocol,
    getBannerMessages,
    saveAssayDesign,
    saveDomain,
    setDomainFields
} from "./components/domainproperties/actions";
import {
    AssayProtocolModel,
    DomainDesign,
    DomainField,
    IAppDomainHeader,
    IBannerMessage,
    SAMPLE_TYPE
} from "./components/domainproperties/models";
import DomainForm from "./components/domainproperties/DomainForm";
import { DomainFieldsDisplay } from "./components/domainproperties/DomainFieldsDisplay";
import { AssayPropertiesPanel } from "./components/domainproperties/assay/AssayPropertiesPanel";
import { AssayDesignerPanels } from "./components/domainproperties/assay/AssayDesignerPanels";
import {
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    RANGE_URIS,
    SAMPLE_TYPE_CONCEPT_URI,
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN
} from "./components/domainproperties/constants";


export {
    // global state functions
    initQueryGridState,
    getStateQueryGridModel,
    getQueryGridModel,
    getEditorModel,
    removeQueryGridModel,
    setQueryMetadata,
    setQueryColumnRenderers,

    // grid functions
    getSelected,
    getSelectedData,
    getSelection,
    getFilterListFromQuery,
    gridInit,
    gridInvalidate,
    gridIdInvalidate,
    queryGridInvalidate,
    schemaGridInvalidate,
    gridRefresh,
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
    getSampleDeleteConfirmationData,
    setSelected,

    // editable grid related items
    addColumns,
    changeColumn,
    removeColumn,
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
    pushParameter,
    pushParameters,
    replaceParameters,
    buildQueryString,

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
    PreviewGrid,
    BulkUpdateForm,
    QueryInfoForm,
    LookupSelectInput,
    SelectInput,
    QuerySelect,
    UserSelectInput,
    PageDetailHeader,
    DetailEditing,
    Detail,
    SchemaListing,
    QueriesListing,
    HeatMap,

    // interfaces
    EditableColumnMetadata,

    // types
    PlacementType,
    EditorModel,

    // user-related
    getUsersWithPermissions,
    invalidateProjectUsers,
    IUser,
    UserDetailHeader,
    UserProfile,
    ChangePasswordModal,

    // samples-related
    SampleInsertPanel,
    SampleDeleteConfirmModal,
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

    // forms
    handleInputTab,
    handleTabKeyOnTextArea,
    withFormSteps,
    WithFormStepsProps,
    FormStep,
    FormTabs,

    // heatmap
    addDateRangeFilter,
    last12Months,
    monthSort,

    // DataViewInfo
    DataViewInfoTypes,
    IDataViewInfo,

    // report-list
    flattenBrowseDataTreeResponse,
    ReportURLMapper,
    ReportListItem,
    ReportItemModal,
    ReportListProps,
    ReportList,

    // lineage
    LINEAGE_GROUPING_GENERATIONS,
    LineageFilter,
    LineageGraph,
    LineageGrid,
    SampleTypeLineageCounts,
    VisGraphNode,
    invalidateLineageResults,

    // OmniBox components
    OmniBox,

    // Navigation types
    MenuSectionConfig,
    ProductMenuModel,
    MenuSectionModel,
    MenuItemModel,

    // Navigation components
    HeaderWrapper,
    ITab,
    NavItem,
    NavigationBar,
    SubNav,
    Breadcrumb,
    BreadcrumbCreate,

    // DomainProperties components
    DomainForm,
    DomainFieldsDisplay,
    AssayPropertiesPanel,
    AssayDesignerPanels,

    // Domain properties functions
    fetchDomain,
    saveDomain,
    getBannerMessages,
    fetchProtocol,
    createFormInputId,
    saveAssayDesign,
    setDomainFields,

    // Domain properties models
    AssayProtocolModel,
    DomainDesign,
    DomainField,
    IBannerMessage,
    IAppDomainHeader,

    // Domain properties constants
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
    SAMPLE_TYPE,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    RANGE_URIS,
    SAMPLE_TYPE_CONCEPT_URI,

    // Base constants
    GRID_EDIT_INDEX,
    GRID_SELECTION_INDEX,
    GRID_CHECKBOX_OPTIONS,
    PermissionTypes,
    Persistence,
    SCHEMAS,

    // Base interfaces
    IQueryGridModel,
    IGridLoader,
    IGridResponse,
    IGridSelectionResponse,
    GridProps,
    LoadingPageProps,
    PageProps,
    SubMenuItemProps,
    ISubItem,

    // Base models
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
    QuerySort,
    QueryLookup,
    QueryInfoStatus,
    SchemaDetails,
    SchemaQuery,
    ViewInfo,
    MessageLevel,
    MessageFunction,
    NotificationItemProps,
    NotificationItemModel,
    LastActionStatus,
    GridColumn,
    GridData,
    InferDomainResponse,
    FileAttachmentFormModel,

    // Base components
    AddEntityButton,
    RemoveEntityButton,
    Alert,
    CustomToggle,
    DeleteIcon,
    DragDropHandle,
    FieldExpansionToggle,
    LoadingModal,
    LoadingSpinner,
    LoadingPage,
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
    ToggleButtons,
    Cards,
    Footer,

    // Base actions
    fetchAllAssays,
    fetchSchemas,
    fetchGetQueries,
    importGeneralAssayRun,
    inferDomainFromFile,
    getUserProperties,
    getServerFilePreview,

    // notification functions
    createNotification,
    dismissNotifications,
    initNotificationsState,

    // date and format functions
    datePlaceholder,
    getDateFormat,
    getUnFormattedNumber,
    formatDate,
    formatDateTime,
    generateNameWithTimestamp,

    // images
    Theme,
    SVGIcon,

    // util functions
    caseInsensitive,
    capitalizeFirstChar,
    decodePart,
    encodePart,
    getCommonDataValues,
    getUpdatedData,
    getUpdatedDataFromGrid,
    getSchemaQuery,
    resolveKey,
    resolveKeyFromJson,
    resolveSchemaQuery,
    insertColumnFilter,
    intersect,
    hasAllPermissions,
    naturalSort,
    not,
    toLowerSafe,
    generateId,
    debounce,
    processSchemas,
    similaritySortFactory,
    unorderedEqual,
    valueIsEmpty,
    getActionErrorMessage,

    // url functions
    buildURL,
    getSortFromUrl,
    hasParameter,
    imageURL,
    setParameter,
    toggleParameter,
    spliceURL,
    WHERE_FILTER_TYPE,

    // devTools functions
    applyDevTools,
    devToolsActive,
    toggleDevTools
}