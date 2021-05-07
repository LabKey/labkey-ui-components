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
import { enableMapSet, enablePatches } from 'immer';

import { AppURL, buildURL, createProductUrl, createProductUrlFromParts, spliceURL } from './internal/url/AppURL';
import { hasParameter, imageURL, toggleParameter } from './internal/url/ActionURL';
import { Container } from './internal/components/base/models/Container';
import { hasAllPermissions, User } from './internal/components/base/models/User';
import { getSchemaQuery, resolveKey, resolveSchemaQuery, SchemaQuery } from './public/SchemaQuery';
import { insertColumnFilter, QueryColumn, QueryLookup } from './public/QueryColumn';
import { QuerySort } from './public/QuerySort';
import { LastActionStatus, MessageLevel } from './internal/LastActionStatus';
import { InferDomainResponse } from './public/InferDomainResponse';
import { getServerFilePreview, inferDomainFromFile } from './internal/components/assay/utils';
import { ViewInfo } from './internal/ViewInfo';
import { QueryInfo, QueryInfoStatus } from './public/QueryInfo';
import { SchemaDetails } from './internal/SchemaDetails';
import { SCHEMAS } from './internal/schemas';
import { isLoading, LoadingState } from './public/LoadingState';

import {
    ServerContextConsumer,
    ServerContextProvider,
    useServerContext,
    useServerContextDispatch,
    withAppUser,
} from './internal/components/base/ServerContext';
import { naturalSort, naturalSortByProperty } from './public/sort';
import { AssayDefinitionModel, AssayDomainTypes, AssayLink } from './internal/AssayDefinitionModel';
import { QueryGridModel } from './internal/QueryGridModel';
import {
    applyDevTools,
    blurActiveElement,
    capitalizeFirstChar,
    caseInsensitive,
    debounce,
    devToolsActive,
    downloadAttachment,
    generateId,
    getDisambiguatedSelectInputOptions,
    isImage,
    isIntegerInRange,
    isNonNegativeFloat,
    isNonNegativeInteger,
    toggleDevTools,
    valueIsEmpty,
} from './internal/util/utils';
import { AutoForm } from './internal/components/AutoForm';
import { HelpIcon } from './internal/components/HelpIcon';
import { getUserProperties, getUserRoleDisplay } from './internal/components/user/actions';
import { BeforeUnload } from './internal/util/BeforeUnload';
import { getActionErrorMessage, resolveErrorMessage } from './internal/util/messaging';
import { WHERE_FILTER_TYPE } from './internal/url/WhereFilterType';
import { AddEntityButton } from './internal/components/buttons/AddEntityButton';
import { RemoveEntityButton } from './internal/components/buttons/RemoveEntityButton';
import { Alert } from './internal/components/base/Alert';
import { DeleteIcon } from './internal/components/base/DeleteIcon';
import { LockIcon } from './internal/components/base/LockIcon';
import { ExpandableFilterToggle } from './internal/components/base/ExpandableFilterToggle';
import { OptionsSelectToggle } from './internal/components/base/OptionsSelectToggle';
import { DragDropHandle } from './internal/components/base/DragDropHandle';
import { FieldExpansionToggle } from './internal/components/base/FieldExpansionToggle';
import { MultiMenuButton } from './internal/components/menus/MultiMenuButton';
import { SubMenu } from './internal/components/menus/SubMenu';
import { SubMenuItem } from './internal/components/menus/SubMenuItem';
import { SelectionMenuItem } from './internal/components/menus/SelectionMenuItem';
import { DisabledMenuItem } from './internal/components/menus/DisabledMenuItem';
import { LoadingModal } from './internal/components/base/LoadingModal';
import { LoadingSpinner } from './internal/components/base/LoadingSpinner';
import { InsufficientPermissionsPage } from './internal/components/permissions/InsufficientPermissionsPage';
import { BasePermissionsCheckPage } from './internal/components/permissions/BasePermissionsCheckPage';
import { APPLICATION_SECURITY_ROLES } from './internal/components/permissions/constants';
import { NotFound } from './internal/components/base/NotFound';
import { Page } from './internal/components/base/Page';
import { LoadingPage } from './internal/components/base/LoadingPage';
import { PageHeader } from './internal/components/base/PageHeader';
import { Progress } from './internal/components/base/Progress';
import { LabelHelpTip } from './internal/components/base/LabelHelpTip';
import { Tip } from './internal/components/base/Tip';
import { Grid, GridColumn } from './internal/components/base/Grid';
import { FormSection } from './internal/components/base/FormSection';
import { Section } from './internal/components/base/Section';
import { FileAttachmentForm } from './public/files/FileAttachmentForm';
import { DEFAULT_FILE } from './internal/components/files/models';
import { FileSizeLimitProps } from './public/files/models';
import { FilesListing } from './internal/components/files/FilesListing';
import { FilesListingForm } from './internal/components/files/FilesListingForm';
import { FileAttachmentEntry } from './internal/components/files/FileAttachmentEntry';
import { getWebDavFiles, uploadWebDavFile, WebDavFile } from './public/files/WebDav';
import { FileTree } from './internal/components/files/FileTree';
import { Notification } from './internal/components/notifications/Notification';
import {
    createNotification,
    getPipelineActivityData,
    markAllNotificationsAsRead,
    withTimeout,
} from './internal/components/notifications/actions';
import {
    addNotification,
    dismissNotifications,
    initNotificationsState,
} from './internal/components/notifications/global';
import { ConfirmModal } from './internal/components/base/ConfirmModal';
import { formatDate, formatDateTime, getDateFormat } from './internal/util/Date';
import { SVGIcon, Theme } from './internal/components/base/SVGIcon';
import { CreatedModified } from './internal/components/base/CreatedModified';
import {
    NotificationItemModel,
    Persistence,
    ServerActivityData,
    ServerNotificationModel,
} from './internal/components/notifications/model';
import { RequiresPermission } from './internal/components/base/Permissions';
import { PaginationButtons } from './internal/components/buttons/PaginationButtons';
import { ManageDropdownButton } from './internal/components/buttons/ManageDropdownButton';
import { WizardNavButtons } from './internal/components/buttons/WizardNavButtons';
import { SplitButtonGroup } from './internal/components/buttons/SplitButtonGroup';
import { ToggleButtons } from './internal/components/buttons/ToggleButtons';
import { Cards } from './internal/components/base/Cards';
import { Footer } from './internal/components/base/Footer';

import { EditorModel, getStateModelId, getStateQueryGridModel } from './internal/models';
import {
    clearSelected,
    createQueryGridModelFilteredBySample,
    getSelected,
    getSelectedData,
    getSelection,
    gridExport,
    gridIdInvalidate,
    gridInit,
    gridInvalidate,
    gridShowError,
    incrementClientSideMetricCount,
    queryGridInvalidate,
    replaceSelected,
    schemaGridInvalidate,
    setSelected,
    setSnapshotSelections,
    unselectAll,
} from './internal/actions';
import { cancelEvent } from './internal/events';
import {
    getEditorModel,
    getQueryGridModel,
    getQueryGridModelsForGridId,
    initQueryGridState,
    invalidateUsers,
    lookupStoreInvalidate,
    removeQueryGridModel,
    updateEditorModel,
} from './internal/global';
import {
    deleteRows,
    getQueryDetails,
    importData,
    InsertFormats,
    InsertOptions,
    insertRows,
    InsertRowsResponse,
    invalidateQueryDetailsCacheKey,
    searchRows,
    selectRows,
    updateRows,
} from './internal/query/api';
import { flattenBrowseDataTreeResponse, loadReports } from './internal/query/reports';
import {
    DataViewInfoTypes,
    EXPORT_TYPES,
    GRID_CHECKBOX_OPTIONS,
    IMPORT_DATA_FORM_TYPES,
    MAX_EDITABLE_GRID_ROWS,
    NO_UPDATES_MESSAGE,
    SM_PIPELINE_JOB_NOTIFICATION_EVENT,
    SM_PIPELINE_JOB_NOTIFICATION_EVENT_ERROR,
    SM_PIPELINE_JOB_NOTIFICATION_EVENT_START,
    SM_PIPELINE_JOB_NOTIFICATION_EVENT_SUCCESS,
} from './internal/constants';
import { getLocation, replaceParameter, replaceParameters, resetParameters } from './internal/util/URL';
import { ActionMapper, URL_MAPPERS, URLResolver, URLService } from './internal/url/URLResolver';
import { getHelpLink, helpLinkNode, SAMPLE_ALIQUOT_TOPIC } from './internal/util/helpLinks';
import { AssayResolver, AssayRunResolver, ListResolver, SamplesResolver } from './internal/url/AppURLResolver';
import { QueryGridPanel } from './internal/components/QueryGridPanel';
import { EditableGridPanel } from './internal/components/editable/EditableGridPanel';
import { EditableGridPanelForUpdate } from './internal/components/editable/EditableGridPanelForUpdate';
import { EditableGridLoader } from './internal/components/editable/EditableGridLoader';
import { EditableGridLoaderFromSelection } from './internal/components/editable/EditableGridLoaderFromSelection';
import { EditableGridModal } from './internal/components/editable/EditableGridModal';

import { CollapsiblePanel } from './internal/components/CollapsiblePanel';
import { ErrorBoundary } from './internal/components/error/ErrorBoundary';
import { AliasRenderer } from './internal/renderers/AliasRenderer';
import { StorageStatusRenderer } from './internal/renderers/StorageStatusRenderer';
import { AppendUnits } from './internal/renderers/AppendUnits';
import { AttachmentCard } from './internal/renderers/AttachmentCard';
import { DefaultRenderer } from './internal/renderers/DefaultRenderer';
import { FileColumnRenderer } from './internal/renderers/FileColumnRenderer';
import { MultiValueRenderer } from './internal/renderers/MultiValueRenderer';
import { LabelColorRenderer } from './internal/renderers/LabelColorRenderer';
import { BulkUpdateForm } from './internal/components/forms/BulkUpdateForm';
import { LabelOverlay } from './internal/components/forms/LabelOverlay';
import { resolveDetailFieldValue, resolveRenderer } from './internal/components/forms/renderers';
import {
    getQueryFormLabelFieldName,
    isQueryFormLabelField,
    QueryFormInputs,
} from './internal/components/forms/QueryFormInputs';
import { LookupSelectInput } from './internal/components/forms/input/LookupSelectInput';
import { SelectInput } from './internal/components/forms/input/SelectInput';
import { DatePickerInput } from './internal/components/forms/input/DatePickerInput';
import { DateInput } from './internal/components/forms/input/DateInput';
import { FileInput } from './internal/components/forms/input/FileInput';
import { TextInput } from './internal/components/forms/input/TextInput';
import { TextAreaInput } from './internal/components/forms/input/TextAreaInput';
import { FieldEditForm, FieldEditProps } from './internal/components/forms/input/FieldEditInput';
import { ColorPickerInput } from './internal/components/forms/input/ColorPickerInput';
import { ColorIcon } from './internal/components/base/ColorIcon';
import { QuerySelect } from './internal/components/forms/QuerySelect';
import { PageDetailHeader } from './internal/components/forms/PageDetailHeader';
import { DetailPanelHeader } from './internal/components/forms/detail/DetailPanelHeader';
import { DetailEditing } from './internal/components/forms/detail/DetailEditing';

import { resolveDetailRenderer } from './internal/components/forms/detail/DetailEditRenderer';
import { Detail } from './internal/components/forms/detail/Detail';
import { getUsersWithPermissions, handleInputTab, handleTabKeyOnTextArea } from './internal/components/forms/actions';
import { FormStep, FormTabs, withFormSteps } from './internal/components/forms/FormStep';
import { SchemaListing } from './internal/components/listing/SchemaListing';
import { QueriesListing } from './internal/components/listing/QueriesListing';
import { QueriesListingPage } from './internal/components/listing/pages/QueriesListingPage';
import { SchemaListingPage } from './internal/components/listing/pages/SchemaListingPage';
import { HeatMap } from './internal/components/heatmap/HeatMap';
import { addDateRangeFilter, last12Months, monthSort } from './internal/components/heatmap/utils';
import { EntityInsertPanel } from './internal/components/entities/EntityInsertPanel';
import { EntityDeleteModal } from './internal/components/entities/EntityDeleteModal';
import { ParentEntityEditPanel } from './internal/components/entities/ParentEntityEditPanel';
import {
    createDeleteErrorNotification,
    createDeleteSuccessNotification,
} from './internal/components/notifications/messaging';
import { GenerateEntityResponse } from './internal/components/entities/models';
import { SearchResultCard } from './internal/components/search/SearchResultCard';
import { SearchResultsPanel } from './internal/components/search/SearchResultsPanel';
import { searchUsingIndex } from './internal/components/search/actions';
import { SearchResultsModel } from './internal/components/search/models';
import {
    deleteSampleSet,
    fetchSamples,
    getSampleSet,
    getSampleTypeDetails,
    loadSelectedSamples,
} from './internal/components/samples/actions';
import { SampleEmptyAlert, SampleTypeEmptyAlert } from './internal/components/samples/SampleEmptyAlert';
import { SampleSetSummary } from './internal/components/samples/SampleSetSummary';
import { SampleSetDeleteModal } from './internal/components/samples/SampleSetDeleteModal';
import { SampleCreationTypeModal } from './internal/components/samples/SampleCreationTypeModal';
import {
    AssayContextConsumer,
    assayPage,
    withAssayModels,
    withAssayModelsFromLocation,
} from './internal/components/assay/withAssayModels';
import { AssayDesignDeleteConfirmModal } from './internal/components/assay/AssayDesignDeleteConfirmModal';
import { AssayDesignDeleteModal } from './internal/components/assay/AssayDesignDeleteModal';
import { AssayResultDeleteModal } from './internal/components/assay/AssayResultDeleteModal';
import { AssayRunDeleteModal } from './internal/components/assay/AssayRunDeleteModal';
import { AssayDesignEmptyAlert } from './internal/components/assay/AssayDesignEmptyAlert';
import { AssaysHeatMap } from './internal/components/assay/AssaysHeatMap';
import { AssaySubNavMenu } from './internal/components/assay/AssaySubNavMenu';
import { AssayTypeSummary } from './internal/components/assay/AssayTypeSummary';
import { RecentAssayPanel } from './internal/components/assay/RecentAssayPanel';
import { AssayPicker, AssayPickerTabs } from './internal/components/assay/AssayPicker';
import { AssayImportSubMenuItem } from './internal/components/assay/AssayImportSubMenuItem';
import { AssayReimportRunButton } from './internal/components/assay/AssayReimportRunButton';
import { AssayStateModel, AssayUploadResultModel } from './internal/components/assay/models';
import {
    clearAssayDefinitionCache,
    deleteAssayDesign,
    deleteAssayRuns,
    fetchAllAssays,
    GENERAL_ASSAY_PROVIDER_NAME,
    getBatchPropertiesModel,
    getBatchPropertiesRow,
    getImportItemsForAssayDefinitions,
    getRunDetailsQueryColumns,
    getRunPropertiesModel,
    getRunPropertiesRow,
    importAssayRun,
    RUN_PROPERTIES_GRID_ID,
    RUN_PROPERTIES_REQUIRED_COLUMNS,
} from './internal/components/assay/actions';
import { BaseBarChart } from './internal/components/chart/BaseBarChart';
import { processChartData } from './internal/components/chart/utils';
import { ReportItemModal, ReportList, ReportListItem } from './internal/components/report-list/ReportList';
import { getImmediateChildLineageFilterValue, invalidateLineageResults } from './internal/components/lineage/actions';
import {
    LINEAGE_DIRECTIONS,
    LINEAGE_GROUPING_GENERATIONS,
    LineageFilter,
    LineageURLResolvers,
} from './internal/components/lineage/types';
import { LineageGraph } from './internal/components/lineage/LineageGraph';
import { LineageGrid, LineageGridFromLocation } from './internal/components/lineage/grid/LineageGrid';
import { EntityDeleteConfirmModal } from './internal/components/entities/EntityDeleteConfirmModal';
import { EntityTypeDeleteConfirmModal } from './internal/components/entities/EntityTypeDeleteConfirmModal';
import { SampleTypeLineageCounts } from './internal/components/lineage/SampleTypeLineageCounts';
import { HeaderWrapper } from './internal/components/navigation/HeaderWrapper';
import { NavigationBar } from './internal/components/navigation/NavigationBar';
import { ProductNavigationMenu } from './internal/components/productnavigation/ProductNavigationMenu';
import { MenuSectionConfig } from './internal/components/navigation/ProductMenuSection';
import { SubNav } from './internal/components/navigation/SubNav';
import { Breadcrumb } from './internal/components/navigation/Breadcrumb';
import { BreadcrumbCreate } from './internal/components/navigation/BreadcrumbCreate';
import { MenuItemModel, MenuSectionModel, ProductMenuModel } from './internal/components/navigation/model';

import { UserSelectInput } from './internal/components/forms/input/UserSelectInput';
import { UserDetailHeader } from './internal/components/user/UserDetailHeader';
import { UserProfile } from './internal/components/user/UserProfile';
import { ChangePasswordModal } from './internal/components/user/ChangePasswordModal';
import { SiteUsersGridPanel } from './internal/components/user/SiteUsersGridPanel';
import { UserProvider } from './internal/components/user/UserProvider';
import { FieldEditorOverlay } from './internal/components/forms/FieldEditorOverlay';
import {
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    RANGE_URIS,
    SAMPLE_TYPE_CONCEPT_URI,
} from './internal/components/domainproperties/constants';
import { ExpandableContainer } from './internal/components/ExpandableContainer';
import { PermissionAssignments } from './internal/components/permissions/PermissionAssignments';
import { PermissionsPageContextProvider } from './internal/components/permissions/PermissionsContextProvider';
import { Principal, SecurityPolicy, SecurityRole } from './internal/components/permissions/models';
import { fetchContainerSecurityPolicy } from './internal/components/permissions/actions';
import {
    extractEntityTypeOptionFromRow,
    getDataDeleteConfirmationData,
    getSampleDeleteConfirmationData,
} from './internal/components/entities/actions';
import { DataClassDataType, SampleTypeDataType } from './internal/components/entities/constants';
import { createEntityParentKey, getUniqueIdColumnMetadata } from './internal/components/entities/utils';
import { SampleTypeModel } from './internal/components/domainproperties/samples/models';

import { EditableDetailPanel } from './public/QueryModel/EditableDetailPanel';
import { Pagination } from './internal/components/pagination/Pagination';
import {
    flattenValuesFromRow,
    getQueryModelExportParams,
    runDetailsColumnsForQueryModel,
} from './public/QueryModel/utils';
import { useRouteLeave, withRouteLeave } from './internal/util/RouteLeave';
import { BarChartViewer } from './internal/components/chart/BarChartViewer';
import { CHART_GROUPS } from './internal/components/chart/configs';
import { AuditDetailsModel, TimelineEventModel } from './internal/components/auditlog/models';
import { AuditQueriesListingPage } from './internal/components/auditlog/AuditQueriesListingPage';
import { AuditDetails } from './internal/components/auditlog/AuditDetails';
import { TimelineView } from './internal/components/auditlog/TimelineView';
import { getEventDataValueDisplay, getTimelineEntityUrl } from './internal/components/auditlog/utils';
import {
    createFormInputId,
    fetchDomain,
    saveDomain,
    setDomainFields,
} from './internal/components/domainproperties/actions';
import { DomainDesign, DomainDetails, DomainField } from './internal/components/domainproperties/models';
import { SAMPLE_TYPE } from './internal/components/domainproperties/PropDescType';
import DomainForm from './internal/components/domainproperties/DomainForm';
import { BasePropertiesPanel } from './internal/components/domainproperties/BasePropertiesPanel';
import { DomainFieldsDisplay } from './internal/components/domainproperties/DomainFieldsDisplay';
import { fetchProtocol, saveAssayDesign } from './internal/components/domainproperties/assay/actions';
import { AssayProtocolModel } from './internal/components/domainproperties/assay/models';
import { AssayPropertiesPanel } from './internal/components/domainproperties/assay/AssayPropertiesPanel';
import { AssayDesignerPanels } from './internal/components/domainproperties/assay/AssayDesignerPanels';
import { ListModel } from './internal/components/domainproperties/list/models';
import { IssuesListDefModel } from './internal/components/domainproperties/issues/models';
import { IssuesListDefDesignerPanels } from './internal/components/domainproperties/issues/IssuesListDefDesignerPanels';
import { DatasetDesignerPanels } from './internal/components/domainproperties/dataset/DatasetDesignerPanels';
import { DatasetModel } from './internal/components/domainproperties/dataset/models';
import { fetchListDesign, getListProperties } from './internal/components/domainproperties/list/actions';
import { fetchIssuesListDefDesign } from './internal/components/domainproperties/issues/actions';
import { fetchDatasetDesign } from './internal/components/domainproperties/dataset/actions';
import {
    DEFAULT_SAMPLE_FIELD_CONFIG,
    SampleTypeDesigner,
} from './internal/components/domainproperties/samples/SampleTypeDesigner';
import { ListDesignerPanels } from './internal/components/domainproperties/list/ListDesignerPanels';
import { DataClassDesigner } from './internal/components/domainproperties/dataclasses/DataClassDesigner';
import { DataClassModel } from './internal/components/domainproperties/dataclasses/models';
import { deleteDataClass, fetchDataClass } from './internal/components/domainproperties/dataclasses/actions';
import { DomainFieldLabel } from './internal/components/domainproperties/DomainFieldLabel';
import { AssayImportPanels } from './internal/components/assay/AssayImportPanels';
import { makeQueryInfo, mountWithServerContext, sleep, waitForLifecycle } from './internal/testHelpers';
import { QueryModel } from './public/QueryModel/QueryModel';
import { withQueryModels } from './public/QueryModel/withQueryModels';
import { GridPanel, GridPanelWithModel } from './public/QueryModel/GridPanel';
import { TabbedGridPanel } from './public/QueryModel/TabbedGridPanel';
import { DetailPanel, DetailPanelWithModel } from './public/QueryModel/DetailPanel';
import { makeTestActions, makeTestQueryModel } from './public/QueryModel/testUtils';
import { QueryDetailPage } from './internal/components/listing/pages/QueryDetailPage';
import { QueryListingPage } from './internal/components/listing/pages/QueryListingPage';
import { PipelineJobsPage } from './internal/components/pipeline/PipelineJobsPage';
import { PipelineStatusDetailPage } from './internal/components/pipeline/PipelineStatusDetailPage';
import {
    ALIQUOT_CREATION,
    CHILD_SAMPLE_CREATION,
    DERIVATIVE_CREATION,
    POOLED_SAMPLE_CREATION,
    SampleCreationType,
} from './internal/components/samples/models';
import { createMockWithRouterProps } from './test/mockUtils';
import { OntologyBrowserPanel } from './internal/components/ontology/OntologyBrowserPanel';
import { OntologyConceptOverviewPanel } from './internal/components/ontology/ConceptOverviewPanel';
import { OntologyBrowserFilterPanel } from './internal/components/ontology/OntologyBrowserFilterPanel';
import { AppModel, LogoutReason } from './internal/app/models';
import {
    PRIVATE_PICKLIST_CATEGORY,
    PUBLIC_PICKLIST_CATEGORY
} from './internal/components/domainproperties/list/constants';
import { PicklistEditModal } from './internal/components/picklist/PicklistEditModal';
import { PicklistDeleteConfirm } from './internal/components/picklist/PicklistDeleteConfirm';
import { PicklistCreationMenuItem } from './internal/components/picklist/PicklistCreationMenuItem';
import { PicklistModel } from './internal/components/picklist/models';
import { deletePicklists, updatePicklist } from './internal/components/picklist/actions';
import {
    AppReducers,
    ProductMenuReducers,
    RoutingTableReducers,
    ServerNotificationReducers,
} from './internal/app/reducers';
import {
    CloseEventCode,
    getDateFormat as getAppDateFormat,
    getMenuSectionConfigs,
    hasPremiumModule,
    initWebSocketListeners,
    isFreezerManagementEnabled,
    isSampleAliquotEnabled,
    isSampleManagerEnabled,
    isSamplePicklistEnabled,
    userCanDeletePublicPicklists,
    userCanDesignLocations,
    userCanDesignSourceTypes,
    userCanManagePicklists,
} from './internal/app/utils';
import {
    doResetQueryGridState,
    getUserPermissions,
    menuInit,
    menuInvalidate,
    menuReload,
    serverNotificationInit,
    serverNotificationInvalidate,
    setReloadRequired,
    updateUserDisplayName,
} from './internal/app/actions';
import {
    TEST_USER_APP_ADMIN,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_GUEST,
    TEST_USER_READER,
} from './test/data/users';
import {
    ASSAY_DESIGN_KEY,
    ASSAYS_KEY,
    BIOLOGICS_PRODUCT_ID,
    BOXES_KEY,
    FREEZER_MANAGER_PRODUCT_ID,
    FREEZERS_KEY,
    HOME_KEY,
    MANAGE_STORAGE_UNITS_HREF,
    NEW_ASSAY_DESIGN_HREF,
    NEW_FREEZER_DESIGN_HREF,
    NEW_SAMPLE_TYPE_HREF,
    NEW_SAMPLES_HREF,
    NEW_SOURCE_TYPE_HREF,
    NOTIFICATION_TIMEOUT,
    PICKLIST_HOME_HREF,
    PICKLIST_KEY,
    SAMPLE_MANAGER_PRODUCT_ID,
    SAMPLE_TYPE_KEY,
    SAMPLES_KEY,
    SECURITY_LOGOUT,
    SECURITY_SERVER_UNAVAILABLE,
    SECURITY_SESSION_TIMEOUT,
    SERVER_NOTIFICATION_MAX_ROWS,
    SET_RELOAD_REQUIRED,
    SOURCE_TYPE_KEY,
    SOURCES_KEY,
    STICKY_HEADER_HEIGHT,
    UPDATE_USER_DISPLAY_NAME,
    USER_KEY,
    USER_PERMISSIONS_REQUEST,
    USER_PERMISSIONS_SUCCESS,
    WORKFLOW_HOME_HREF,
    WORKFLOW_KEY,
} from './internal/app/constants';

// See Immer docs for why we do this: https://immerjs.github.io/immer/docs/installation#pick-your-immer-version
enableMapSet();
enablePatches();

const App = {
    AppReducers,
    ProductMenuReducers,
    RoutingTableReducers,
    ServerNotificationReducers,
    CloseEventCode,
    initWebSocketListeners,
    isFreezerManagementEnabled,
    isSampleManagerEnabled,
    isSampleAliquotEnabled,
    isSamplePicklistEnabled,
    hasPremiumModule,
    getDateFormat: getAppDateFormat,
    getMenuSectionConfigs,
    getUserPermissions,
    doResetQueryGridState,
    menuInit,
    menuInvalidate,
    menuReload,
    serverNotificationInit,
    serverNotificationInvalidate,
    setReloadRequired,
    updateUserDisplayName,
    userCanDesignLocations,
    userCanDesignSourceTypes,
    userCanManagePicklists,
    userCanDeletePublicPicklists,
    SECURITY_LOGOUT,
    SECURITY_SERVER_UNAVAILABLE,
    SECURITY_SESSION_TIMEOUT,
    SET_RELOAD_REQUIRED,
    USER_PERMISSIONS_SUCCESS,
    USER_PERMISSIONS_REQUEST,
    UPDATE_USER_DISPLAY_NAME,
    BIOLOGICS_PRODUCT_ID,
    SAMPLE_MANAGER_PRODUCT_ID,
    FREEZER_MANAGER_PRODUCT_ID,
    ASSAYS_KEY,
    ASSAY_DESIGN_KEY,
    PICKLIST_KEY,
    SAMPLES_KEY,
    SAMPLE_TYPE_KEY,
    SOURCES_KEY,
    SOURCE_TYPE_KEY,
    WORKFLOW_KEY,
    FREEZERS_KEY,
    BOXES_KEY,
    HOME_KEY,
    USER_KEY,
    NEW_SAMPLES_HREF,
    NEW_SOURCE_TYPE_HREF,
    NEW_SAMPLE_TYPE_HREF,
    NEW_ASSAY_DESIGN_HREF,
    PICKLIST_HOME_HREF,
    WORKFLOW_HOME_HREF,
    NEW_FREEZER_DESIGN_HREF,
    MANAGE_STORAGE_UNITS_HREF,
    NOTIFICATION_TIMEOUT,
    STICKY_HEADER_HEIGHT,
    SERVER_NOTIFICATION_MAX_ROWS,
    TEST_USER_GUEST,
    TEST_USER_READER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_APP_ADMIN,
};

export {
    // internal application
    App,
    AppModel,
    LogoutReason,
    // global state functions
    initQueryGridState,
    initNotificationsState,
    getStateQueryGridModel,
    getStateModelId,
    getQueryGridModel,
    getQueryGridModelsForGridId,
    getEditorModel,
    lookupStoreInvalidate,
    removeQueryGridModel,
    invalidateUsers,
    clearSelected,
    gridInvalidate,
    gridIdInvalidate,
    queryGridInvalidate,
    schemaGridInvalidate,
    updateEditorModel,
    // grid functions
    getSelected,
    getSelectedData,
    getSelection,
    getQueryModelExportParams,
    gridExport,
    gridInit,
    gridShowError,
    replaceSelected,
    setSelected,
    setSnapshotSelections,
    unselectAll,
    // query related items
    InsertRowsResponse,
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
    // editable grid related items
    MAX_EDITABLE_GRID_ROWS,
    EditableGridLoaderFromSelection,
    EditableGridLoader,
    EditableGridPanel,
    EditableGridPanelForUpdate,
    EditableGridModal,
    EditorModel,
    cancelEvent,
    // url and location related items
    AppURL,
    ActionMapper,
    URL_MAPPERS,
    URLResolver,
    URLService,
    AssayResolver,
    AssayRunResolver,
    ListResolver,
    SamplesResolver,
    getLocation,
    replaceParameter,
    replaceParameters,
    resetParameters,
    hasParameter,
    toggleParameter,
    buildURL,
    imageURL,
    spliceURL,
    WHERE_FILTER_TYPE,
    createProductUrl,
    createProductUrlFromParts,
    // renderers
    AttachmentCard,
    AliasRenderer,
    AppendUnits,
    DefaultRenderer,
    FileColumnRenderer,
    LabelColorRenderer,
    MultiValueRenderer,
    StorageStatusRenderer,
    resolveDetailRenderer,
    resolveRenderer,
    // form related items
    BulkUpdateForm,
    QueryFormInputs,
    LookupSelectInput,
    SelectInput,
    DatePickerInput,
    DateInput,
    FieldEditorOverlay,
    FileInput,
    TextAreaInput,
    TextInput,
    ColorPickerInput,
    ColorIcon,
    FieldEditForm,
    FieldEditProps,
    QuerySelect,
    UserSelectInput,
    DetailPanelHeader,
    DetailEditing,
    handleInputTab,
    handleTabKeyOnTextArea,
    withFormSteps,
    FormStep,
    getQueryFormLabelFieldName,
    isQueryFormLabelField,
    resolveDetailFieldValue,
    FormTabs,
    IMPORT_DATA_FORM_TYPES,
    LabelOverlay,
    WizardNavButtons,
    FormSection,
    // user/permissions related items
    getUsersWithPermissions,
    getUserProperties,
    getUserRoleDisplay,
    UserDetailHeader,
    UserProfile,
    ChangePasswordModal,
    SiteUsersGridPanel,
    InsufficientPermissionsPage,
    APPLICATION_SECURITY_ROLES,
    BasePermissionsCheckPage,
    RequiresPermission,
    hasAllPermissions,
    fetchContainerSecurityPolicy,
    PermissionAssignments,
    PermissionsPageContextProvider,
    SecurityPolicy,
    SecurityRole,
    Principal,
    UserProvider,
    // sample picklist items
    PicklistCreationMenuItem,
    PicklistEditModal,
    PicklistDeleteConfirm,
    PUBLIC_PICKLIST_CATEGORY,
    PRIVATE_PICKLIST_CATEGORY,
    PicklistModel,
    deletePicklists,
    updatePicklist,
    // data class and sample type related items
    DataClassModel,
    deleteDataClass,
    fetchDataClass,
    SampleTypeModel,
    deleteSampleSet,
    fetchSamples,
    getSampleSet,
    getSampleTypeDetails,
    createQueryGridModelFilteredBySample,
    loadSelectedSamples,
    SampleTypeDataType,
    DataClassDataType,
    SampleEmptyAlert,
    SampleTypeEmptyAlert,
    SampleSetSummary,
    SampleCreationType,
    SampleSetDeleteModal,
    SampleCreationTypeModal,
    CHILD_SAMPLE_CREATION,
    DERIVATIVE_CREATION,
    POOLED_SAMPLE_CREATION,
    ALIQUOT_CREATION,
    // entities
    EntityTypeDeleteConfirmModal,
    EntityDeleteConfirmModal,
    EntityDeleteModal,
    EntityInsertPanel,
    ParentEntityEditPanel,
    extractEntityTypeOptionFromRow,
    GenerateEntityResponse,
    AddEntityButton,
    RemoveEntityButton,
    getSampleDeleteConfirmationData,
    getDataDeleteConfirmationData,
    createEntityParentKey,
    getUniqueIdColumnMetadata,
    // search related items
    SearchResultsModel,
    SearchResultCard,
    SearchResultsPanel,
    searchUsingIndex,
    // assay
    AssayUploadResultModel,
    AssayDesignDeleteModal,
    AssayDesignDeleteConfirmModal,
    AssayDesignEmptyAlert,
    AssayResultDeleteModal,
    AssayRunDeleteModal,
    AssaysHeatMap,
    AssaySubNavMenu,
    AssayTypeSummary,
    AssayStateModel,
    AssayImportPanels,
    AssayPicker,
    AssayPickerTabs,
    assayPage,
    RecentAssayPanel,
    withAssayModels,
    withAssayModelsFromLocation,
    AssayContextConsumer,
    AssayImportSubMenuItem,
    AssayReimportRunButton,
    importAssayRun,
    deleteAssayDesign,
    deleteAssayRuns,
    getImportItemsForAssayDefinitions,
    getRunDetailsQueryColumns,
    getRunPropertiesModel,
    getRunPropertiesRow,
    getBatchPropertiesModel,
    getBatchPropertiesRow,
    AssayDefinitionModel,
    AssayDomainTypes,
    AssayLink,
    clearAssayDefinitionCache,
    fetchAllAssays,
    RUN_PROPERTIES_GRID_ID,
    RUN_PROPERTIES_REQUIRED_COLUMNS,
    GENERAL_ASSAY_PROVIDER_NAME,
    // heatmap
    HeatMap,
    addDateRangeFilter,
    last12Months,
    monthSort,
    // report / chart related items
    BaseBarChart,
    BarChartViewer,
    CHART_GROUPS,
    processChartData,
    DataViewInfoTypes,
    loadReports,
    flattenBrowseDataTreeResponse,
    ReportListItem,
    ReportItemModal,
    ReportList,
    // lineage
    LINEAGE_GROUPING_GENERATIONS,
    LINEAGE_DIRECTIONS,
    LineageFilter,
    LineageGraph,
    LineageGrid,
    LineageGridFromLocation,
    LineageURLResolvers,
    SampleTypeLineageCounts,
    invalidateLineageResults,
    getImmediateChildLineageFilterValue,
    // Navigation
    MenuSectionConfig,
    ProductMenuModel,
    MenuSectionModel,
    MenuItemModel,
    HeaderWrapper,
    NavigationBar,
    ProductNavigationMenu,
    SubNav,
    Breadcrumb,
    BreadcrumbCreate,
    // notification related items
    NO_UPDATES_MESSAGE,
    SM_PIPELINE_JOB_NOTIFICATION_EVENT,
    SM_PIPELINE_JOB_NOTIFICATION_EVENT_START,
    SM_PIPELINE_JOB_NOTIFICATION_EVENT_SUCCESS,
    SM_PIPELINE_JOB_NOTIFICATION_EVENT_ERROR,
    NotificationItemModel,
    Notification,
    ServerNotificationModel,
    ServerActivityData,
    Persistence,
    createNotification,
    dismissNotifications,
    getPipelineActivityData,
    markAllNotificationsAsRead,
    addNotification,
    createDeleteSuccessNotification,
    createDeleteErrorNotification,
    withTimeout,
    // domain designer related items
    DomainForm,
    DomainFieldsDisplay,
    fetchDomain,
    saveDomain,
    createFormInputId,
    setDomainFields,
    DomainDesign,
    DomainField,
    DomainFieldLabel,
    DomainDetails,
    inferDomainFromFile,
    getServerFilePreview,
    InferDomainResponse,
    BasePropertiesPanel,
    AssayPropertiesPanel,
    AssayDesignerPanels,
    saveAssayDesign,
    fetchProtocol,
    AssayProtocolModel,
    SAMPLE_TYPE,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    RANGE_URIS,
    SAMPLE_TYPE_CONCEPT_URI,
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    ListDesignerPanels,
    ListModel,
    fetchListDesign,
    getListProperties,
    DatasetDesignerPanels,
    DatasetModel,
    fetchDatasetDesign,
    DataClassDesigner,
    SampleTypeDesigner,
    DEFAULT_SAMPLE_FIELD_CONFIG,
    IssuesListDefModel,
    IssuesListDefDesignerPanels,
    fetchIssuesListDefDesign,
    // file / webdav related items
    DEFAULT_FILE,
    FileSizeLimitProps,
    FilesListing,
    FilesListingForm,
    FileAttachmentEntry,
    FileAttachmentForm,
    FileTree,
    WebDavFile,
    getWebDavFiles,
    uploadWebDavFile,
    // util functions
    getDateFormat,
    getDisambiguatedSelectInputOptions,
    formatDate,
    formatDateTime,
    blurActiveElement,
    caseInsensitive,
    capitalizeFirstChar,
    downloadAttachment,
    resolveKey,
    isIntegerInRange,
    isImage,
    isNonNegativeFloat,
    isNonNegativeInteger,
    isLoading,
    naturalSort,
    naturalSortByProperty,
    generateId,
    debounce,
    valueIsEmpty,
    getActionErrorMessage,
    resolveErrorMessage,
    getHelpLink,
    helpLinkNode,
    incrementClientSideMetricCount,
    SAMPLE_ALIQUOT_TOPIC,
    // devTools functions
    applyDevTools,
    devToolsActive,
    toggleDevTools,
    // buttons and menus
    MultiMenuButton,
    SubMenu,
    SubMenuItem,
    SelectionMenuItem,
    DisabledMenuItem,
    ManageDropdownButton,
    SplitButtonGroup,
    PaginationButtons,
    ToggleButtons,
    // application page related items
    LoadingPage,
    NotFound,
    Page,
    PageHeader,
    PageDetailHeader,
    ErrorBoundary,
    BeforeUnload,
    useRouteLeave,
    withRouteLeave,
    SchemaListing,
    SchemaListingPage,
    QueriesListing,
    QueriesListingPage,
    QueryListingPage,
    QueryDetailPage,
    Theme,
    SVGIcon,
    // general components
    Alert,
    CollapsiblePanel,
    ExpandableContainer,
    Progress,
    LabelHelpTip,
    Tip,
    Grid,
    GridColumn,
    Section,
    ConfirmModal,
    Cards,
    Footer,
    DragDropHandle,
    FieldExpansionToggle,
    LoadingModal,
    LoadingSpinner,
    CreatedModified,
    DeleteIcon,
    LockIcon,
    ExpandableFilterToggle,
    OptionsSelectToggle,
    // base models, enums, constants
    Container,
    User,
    ServerContextProvider,
    ServerContextConsumer,
    useServerContext,
    useServerContextDispatch,
    withAppUser,
    QueryColumn,
    QueryInfo,
    QueryLookup,
    QueryInfoStatus,
    QuerySort,
    SchemaDetails,
    SchemaQuery,
    ViewInfo,
    MessageLevel,
    LastActionStatus,
    LoadingState,
    SCHEMAS,
    getSchemaQuery,
    resolveSchemaQuery,
    insertColumnFilter,
    EXPORT_TYPES,
    // QueryGridModel
    QueryGridModel,
    QueryGridPanel,
    Detail,
    GRID_CHECKBOX_OPTIONS,
    // QueryModel
    QueryModel,
    withQueryModels,
    GridPanel,
    GridPanelWithModel,
    DetailPanel,
    DetailPanelWithModel,
    EditableDetailPanel,
    TabbedGridPanel,
    runDetailsColumnsForQueryModel,
    flattenValuesFromRow,
    Pagination,
    makeTestActions,
    makeTestQueryModel,
    // AuditLog and Timeline
    AuditDetailsModel,
    AuditQueriesListingPage,
    AuditDetails,
    getEventDataValueDisplay,
    getTimelineEntityUrl,
    TimelineEventModel,
    TimelineView,
    // pipeline
    PipelineJobsPage,
    PipelineStatusDetailPage,
    // Test Helpers
    mountWithServerContext,
    sleep,
    waitForLifecycle,
    createMockWithRouterProps,
    makeQueryInfo,
    // Ontology
    OntologyBrowserPanel,
    OntologyConceptOverviewPanel,
    OntologyBrowserFilterPanel,
    AutoForm,
    HelpIcon,
};

//  Due to babel-loader & typescript babel plugins we need to export/import types separately. The babel plugins require
//  the typescript compiler option "isolatedModules", which do not export types from modules, so types must be exported
//  separately.
//  https://github.com/babel/babel-loader/issues/603
export type {
    RequiresModelAndActions,
    InjectedQueryModels,
    Actions,
    MakeQueryModels,
    QueryConfigMap,
    QueryModelMap,
} from './public/QueryModel/withQueryModels';
export type { TimelineGroupedEventInfo } from './internal/components/auditlog/models';
export type { PaginationData } from './internal/components/pagination/Pagination';
export type { QueryModelLoader } from './public/QueryModel/QueryModelLoader';
export type { QueryConfig } from './public/QueryModel/QueryModel';
export type { IGridLoader, IGridResponse } from './internal/QueryGridModel';
export type { ServerContext } from './internal/components/base/ServerContext';
export type { GridProps } from './internal/components/base/Grid';
export type { InjectedRouteLeaveProps, WrappedRouteLeaveProps } from './internal/util/RouteLeave';
export type { PageHeaderProps } from './internal/components/base/PageHeader';
export type { PageProps } from './internal/components/base/Page';
export type { LoadingPageProps } from './internal/components/base/LoadingPage';
export type { ISubItem, SubMenuItemProps } from './internal/components/menus/SubMenuItem';
export type { PaginationButtonsProps } from './internal/components/buttons/PaginationButtons';
export type { MenuOption } from './internal/components/menus/SubMenu';
export type { FileAttachmentFormModel, IFile } from './internal/components/files/models';
export type {
    IAppDomainHeader,
    IBannerMessage,
    IDomainField,
    IFieldChange,
} from './internal/components/domainproperties/models';
export type { MessageFunction, NotificationItemProps } from './internal/components/notifications/model';
export type { VisGraphNode } from './internal/components/lineage/vis/VisGraphGenerator';
export type { ITab } from './internal/components/navigation/SubNav';
export type { NotificationCreatable } from './internal/components/notifications/actions';
export type { IDataViewInfo } from './internal/models';
export type { HeatMapCell } from './internal/components/heatmap/HeatMap';
export type { InjectedAssayModel, WithAssayModelProps } from './internal/components/assay/withAssayModels';
export type { SearchResultCardData } from './internal/components/search/models';
export type { AssayPickerSelectionModel } from './internal/components/assay/AssayPicker';
export type {
    EntityDataType,
    EntityInputProps,
    IDerivePayload,
    IEntityTypeOption,
    IParentOption,
    MaterialOutput,
} from './internal/components/entities/models';
export type { SelectInputProps } from './internal/components/forms/input/SelectInput';
export type { PermissionsProviderProps } from './internal/components/permissions/models';
export type { ISelectInitData } from './internal/components/forms/model';
export type { QuerySelectOwnProps } from './internal/components/forms/QuerySelect';
export type { UserProviderProps } from './internal/components/user/UserProvider';
export type { SampleCreationTypeModel } from './internal/components/samples/models';
export type { MetricUnitProps } from './internal/components/domainproperties/samples/models';
export type { AppRouteResolver } from './internal/url/AppURLResolver';
export type { WithFormStepsProps } from './internal/components/forms/FormStep';
export type { BulkAddData, EditableColumnMetadata } from './internal/components/editable/EditableGrid';
export type { IImportData, ISelectRowsResult } from './internal/query/api';
export type { Location } from './internal/util/URL';
export type {
    RoutingTableState,
    ServerNotificationState,
    ProductMenuState,
    AppReducerState,
} from './internal/app/reducers';
export type { IAttachment } from './internal/renderers/AttachmentCard';
export type { Field, FormSchema, Option } from './internal/components/AutoForm';
