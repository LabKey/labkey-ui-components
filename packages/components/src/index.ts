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

import {
    applyURL,
    AppURL,
    buildURL,
    createProductUrl,
    createProductUrlFromParts,
    spliceURL,
} from './internal/url/AppURL';
import { getHref } from './internal/url/utils';
import { hasParameter, imageURL, toggleParameter } from './internal/url/ActionURL';
import { Container } from './internal/components/base/models/Container';
import { hasAllPermissions, hasAnyPermissions, hasPermissions, User } from './internal/components/base/models/User';
import { GridColumn } from './internal/components/base/models/GridColumn';
import { decodePart, encodePart, getSchemaQuery, resolveKey, SchemaQuery } from './public/SchemaQuery';
import { insertColumnFilter, Operation, QueryColumn, QueryLookup } from './public/QueryColumn';
import { QuerySort } from './public/QuerySort';
import { LastActionStatus, MessageLevel } from './internal/LastActionStatus';
import { InferDomainResponse } from './public/InferDomainResponse';
import { inferDomainFromFile } from './internal/components/assay/utils';
import { ViewInfo } from './internal/ViewInfo';
import { QueryInfo, QueryInfoStatus } from './public/QueryInfo';
import { SchemaDetails } from './internal/SchemaDetails';
import { SCHEMAS } from './internal/schemas';
import { isLoading, LoadingState } from './public/LoadingState';
import { ExtendedMap } from './public/ExtendedMap';

import {
    ServerContextConsumer,
    ServerContextProvider,
    useServerContext,
    useServerContextDispatch,
    withAppUser,
} from './internal/components/base/ServerContext';
import { naturalSort, naturalSortByProperty } from './public/sort';
import { AssayDefinitionModel, AssayDomainTypes, AssayLink } from './internal/AssayDefinitionModel';
import {
    applyDevTools,
    arrayEquals,
    blurActiveElement,
    capitalizeFirstChar,
    caseInsensitive,
    debounce,
    devToolsActive,
    downloadAttachment,
    findMissingValues,
    generateId,
    getDisambiguatedSelectInputOptions,
    handleFileInputChange,
    handleRequestFailure,
    isImage,
    isInteger,
    isIntegerInRange,
    isNonNegativeFloat,
    isNonNegativeInteger,
    parseCsvString,
    quoteValueWithDelimiters,
    toggleDevTools,
    uncapitalizeFirstChar,
    valueIsEmpty,
    withTransformedKeys,
} from './internal/util/utils';
import { AutoForm } from './internal/components/AutoForm';
import { HelpIcon } from './internal/components/HelpIcon';
import { getUserProperties, getUserRoleDisplay } from './internal/components/user/actions';
import { BeforeUnload } from './internal/util/BeforeUnload';
import { useWindowFocusCheckExpiredSession } from './internal/util/WindowFocusCheckExpiredSession';
import {
    deleteErrorMessage,
    deleteSuccessMessage,
    getActionErrorMessage,
    getConfirmDeleteMessage,
    getPermissionRestrictionMessage,
    resolveErrorMessage,
} from './internal/util/messaging';
import { WHERE_FILTER_TYPE } from './internal/url/WhereFilterType';
import { AddEntityButton } from './internal/components/buttons/AddEntityButton';
import { RemoveEntityButton } from './internal/components/buttons/RemoveEntityButton';
import { Alert } from './internal/components/base/Alert';
import { DeleteIcon } from './internal/components/base/DeleteIcon';
import { LockIcon } from './internal/components/base/LockIcon';
import { ExpandableFilterToggle } from './internal/components/base/ExpandableFilterToggle';
import { DragDropHandle } from './internal/components/base/DragDropHandle';
import { FieldExpansionToggle } from './internal/components/base/FieldExpansionToggle';
import { MultiMenuButton } from './internal/components/menus/MultiMenuButton';
import { SubMenu } from './internal/components/menus/SubMenu';
import { SubMenuItem } from './internal/components/menus/SubMenuItem';
import { SelectionMenuItem } from './internal/components/menus/SelectionMenuItem';
import { LoadingModal } from './internal/components/base/LoadingModal';
import { LoadingSpinner } from './internal/components/base/LoadingSpinner';
import { InsufficientPermissionsAlert } from './internal/components/permissions/InsufficientPermissionsAlert';
import { InsufficientPermissionsPage } from './internal/components/permissions/InsufficientPermissionsPage';
import { BasePermissionsCheckPage } from './internal/components/permissions/BasePermissionsCheckPage';
import { NotFound } from './internal/components/base/NotFound';
import { Page } from './internal/components/base/Page';
import { LoadingPage } from './internal/components/base/LoadingPage';
import { PageHeader } from './internal/components/base/PageHeader';
import { Progress } from './internal/components/base/Progress';
import { LabelHelpTip } from './internal/components/base/LabelHelpTip';
import { Tip } from './internal/components/base/Tip';
import { Grid } from './internal/components/base/Grid';
import { FormSection } from './internal/components/base/FormSection';
import { Section } from './internal/components/base/Section';
import { ContentGroup, ContentGroupLabel } from './internal/components/base/ContentGroup';
import { FileAttachmentForm } from './public/files/FileAttachmentForm';
import { TemplateDownloadButton } from './public/files/TemplateDownloadButton';
import { DEFAULT_FILE } from './internal/components/files/models';
import { FilesListing } from './internal/components/files/FilesListing';
import { FilesListingForm } from './internal/components/files/FilesListingForm';
import { FileAttachmentEntry } from './internal/components/files/FileAttachmentEntry';
import {
    createWebDavDirectory,
    deleteWebDavResource,
    getWebDavFiles,
    uploadWebDavFile,
    WebDavFile,
} from './public/files/WebDav';
import { FileTree } from './internal/components/files/FileTree';
import { ReleaseNote } from './internal/components/notifications/ReleaseNote';
import { Notifications } from './internal/components/notifications/Notifications';
import { getPipelineActivityData, markAllNotificationsAsRead } from './internal/components/notifications/actions';
import {
    NotificationsContextProvider,
    useNotificationsContext,
    withNotificationsContext,
} from './internal/components/notifications/NotificationsContext';
import { ConfirmModal } from './internal/components/base/ConfirmModal';
import {
    filterDate,
    formatDate,
    formatDateTime,
    getDateFormat,
    getDateTimeFormat,
    getParsedRelativeDateStr,
    isDateTimeInPast,
    isRelativeDateFilterValue,
    parseDate,
} from './internal/util/Date';
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
import { ToggleButtons, ToggleIcon } from './internal/components/buttons/ToggleButtons';
import { DisableableButton } from './internal/components/buttons/DisableableButton';
import { ResponsiveMenuButton } from './internal/components/buttons/ResponsiveMenuButton';
import { ResponsiveMenuButtonGroup } from './internal/components/buttons/ResponsiveMenuButtonGroup';
import { getMenuItemForSectionKey, getMenuItemsForSection } from './internal/components/buttons/utils';
import { Cards } from './internal/components/base/Cards';
import { Setting } from './internal/components/base/Setting';
import { ValueList } from './internal/components/base/ValueList';
import { ChoicesListItem } from './internal/components/base/ChoicesListItem';

import { DataTypeSelector } from './internal/components/entities/DataTypeSelector';

import { EditorMode, EditorModel } from './internal/components/editable/models';
import {
    clearSelected,
    getGridIdsFromTransactionId,
    getSampleTypesFromTransactionIds,
    getSelected,
    getSelectedData,
    incrementClientSideMetricCount,
    replaceSelected,
    selectGridIdsFromTransactionId,
    setSelected,
    setSnapshotSelections,
} from './internal/actions';
import {
    addColumns,
    changeColumn,
    initEditableGridModel,
    initEditableGridModels,
    loadEditorModelData,
    removeColumn,
} from './internal/components/editable/actions';
import { cancelEvent } from './internal/events';
import { createGridModelId } from './internal/models';
import { initQueryGridState } from './internal/global';
import {
    deleteRows,
    getContainerFilter,
    getContainerFilterForFolder,
    getContainerFilterForLookups,
    getQueryDetails,
    getVerbForInsertOption,
    importData,
    InsertFormats,
    InsertOptions,
    insertRows,
    QueryCommandResponse,
    invalidateQueryDetailsCache,
    loadQueries,
    loadQueriesFromTable,
    selectDistinctRows,
    selectRowsDeprecated,
    updateRows,
} from './internal/query/api';
import {
    COLUMN_IN_FILTER_TYPE,
    COLUMN_NOT_IN_FILTER_TYPE,
    ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE,
    IN_EXP_DESCENDANTS_OF_FILTER_TYPE,
    NOT_IN_EXP_DESCENDANTS_OF_FILTER_TYPE,
    getFilterLabKeySql,
    isNegativeFilterType,
    getLegalIdentifier,
    registerFilterType,
} from './internal/query/filter';
import { selectRows } from './internal/query/selectRows';
import { flattenBrowseDataTreeResponse, loadReports } from './internal/query/reports';
import {
    AssayUploadTabs,
    DataViewInfoTypes,
    EXPORT_TYPES,
    GRID_CHECKBOX_OPTIONS,
    IMPORT_DATA_FORM_TYPES,
    MAX_EDITABLE_GRID_ROWS,
    NO_UPDATES_MESSAGE,
    PIPELINE_JOB_NOTIFICATION_EVENT,
    PIPELINE_JOB_NOTIFICATION_EVENT_ERROR,
    PIPELINE_JOB_NOTIFICATION_EVENT_START,
    PIPELINE_JOB_NOTIFICATION_EVENT_SUCCESS,
    SHARED_CONTAINER_PATH,
} from './internal/constants';
import { getQueryParams, pushParameters, removeParameters, replaceParameters } from './internal/util/URL';
import { ActionMapper, URL_MAPPERS, URLResolver, URLService } from './internal/url/URLResolver';
import { DATA_IMPORT_TOPIC, getHelpLink, HELP_LINK_REFERRER, HelpLink } from './internal/util/helpLinks';
import { ExperimentRunResolver, ListResolver } from './internal/url/AppURLResolver';
import { NOT_ANY_FILTER_TYPE } from './internal/url/NotAnyFilterType';
import { applyEditableGridChangesToModels, getUpdatedDataFromEditableGrid } from './internal/components/editable/utils';
import { EditableGridTabs } from './internal/components/editable/EditableGrid';
import { EditableGridPanel } from './internal/components/editable/EditableGridPanel';
import { EditableGridPanelForUpdate } from './internal/components/editable/EditableGridPanelForUpdate';

import { EditableGridLoaderFromSelection } from './internal/components/editable/EditableGridLoaderFromSelection';

import { ErrorBoundary } from './internal/components/error/ErrorBoundary';
import { AliasRenderer } from './internal/renderers/AliasRenderer';
import { ANCESTOR_LOOKUP_CONCEPT_URI, AncestorRenderer } from './internal/renderers/AncestorRenderer';
import { StorageStatusRenderer } from './internal/renderers/StorageStatusRenderer';
import { SampleStatusRenderer } from './internal/renderers/SampleStatusRenderer';
import { ExpirationDateColumnRenderer } from './internal/renderers/ExpirationDateColumnRenderer';
import { AppendUnits } from './internal/renderers/AppendUnits';
import { AttachmentCard } from './internal/renderers/AttachmentCard';
import { DefaultRenderer } from './internal/renderers/DefaultRenderer';
import { FileColumnRenderer } from './internal/renderers/FileColumnRenderer';
import { MultiValueRenderer } from './internal/renderers/MultiValueRenderer';
import { LabelColorRenderer } from './internal/renderers/LabelColorRenderer';
import { NoLinkRenderer } from './internal/renderers/NoLinkRenderer';
import { UserDetailsRenderer } from './internal/renderers/UserDetailsRenderer';
import {
    ImportAliasRenderer,
    SampleTypeImportAliasRenderer,
    SourceTypeImportAliasRenderer,
} from './internal/renderers/ImportAliasRenderer';
import { BulkUpdateForm } from './internal/components/forms/BulkUpdateForm';
import { LabelOverlay } from './internal/components/forms/LabelOverlay';
import {
    getQueryFormLabelFieldName,
    isQueryFormLabelField,
    resolveDetailFieldValue,
} from './internal/components/forms/utils';
import { QueryFormInputs } from './internal/components/forms/QueryFormInputs';
import { LookupSelectInput } from './internal/components/forms/input/LookupSelectInput';
import { SelectInput } from './internal/components/forms/input/SelectInput';
import { selectOptionByText } from './internal/components/forms/input/SelectInputTestUtils';
import { DatePickerInput } from './internal/components/forms/input/DatePickerInput';
import { FileInput } from './internal/components/forms/input/FileInput';
import { TextInput } from './internal/components/forms/input/TextInput';
import { TextAreaInput } from './internal/components/forms/input/TextAreaInput';
import { FieldEditForm, FieldEditProps } from './internal/components/forms/input/FieldEditInput';
import { ColorPickerInput } from './internal/components/forms/input/ColorPickerInput';
import { ColorIcon } from './internal/components/base/ColorIcon';
import { QuerySelect } from './internal/components/forms/QuerySelect';
import { PageDetailHeader } from './internal/components/forms/PageDetailHeader';
import { DetailPanelHeader } from './internal/components/forms/detail/DetailPanelHeader';
import { resolveDetailRenderer } from './internal/components/forms/detail/DetailDisplay';

import {
    getUsersWithPermissions,
    handleInputTab,
    handleTabKeyOnTextArea,
    updateRowFieldValue,
    useUsersWithPermissions,
} from './internal/components/forms/actions';
import { FormStep, FormTabs, withFormSteps } from './internal/components/forms/FormStep';
import {
    EntityIdCreationModel,
    EntityParentType,
    EntityTypeOption,
    OperationConfirmationData,
} from './internal/components/entities/models';
import { EntityMoveModal } from './internal/components/entities/EntityMoveModal';
import { EntityMoveConfirmationModal } from './internal/components/entities/EntityMoveConfirmationModal';
import {
    AssayResultsForSamplesButton,
    AssayResultsForSamplesMenuItem,
} from './internal/components/entities/AssayResultsForSamplesButton';
import { SampleAliquotViewSelector } from './internal/components/entities/SampleAliquotViewSelector';
import { GridAliquotViewSelector } from './internal/components/entities/GridAliquotViewSelector';
import {
    FindDerivativesButton,
    FindDerivativesMenuItem,
    getSampleFinderLocalStorageKey,
    getSearchFilterObjs,
    SAMPLE_FINDER_SESSION_PREFIX,
    searchFiltersToJson,
} from './internal/components/entities/FindDerivativesButton';
import {
    SAMPLE_PROPERTY_ALL_SAMPLE_TYPE,
    SEARCH_PAGE_DEFAULT_SIZE,
    SearchCategory,
    SearchField,
    SearchScope,
} from './internal/components/search/constants';
import { SearchPanel } from './internal/components/search/SearchPanel';
import {
    getFieldFiltersValidationResult,
    getFilterValuesAsArray,
    getSearchScopeFromContainerFilter,
    isValidFilterField,
    SAMPLE_FILTER_METRIC_AREA,
} from './internal/components/search/utils';
import { UserManagementPage } from './internal/components/administration/UserManagement';
import { CreateProjectPage } from './internal/components/project/CreateProjectPage';
import { ProjectManagementPage } from './internal/components/project/ProjectManagementPage';
import { GroupManagementPage } from './internal/components/administration/GroupManagementPage';
import { PermissionManagementPage } from './internal/components/administration/PermissionManagementPage';
import { AccountSettingsPage } from './internal/components/administration/AccountSettingsPage';
import { SearchResultsModel } from './internal/components/search/models';
import {
    deleteSampleSet,
    fetchSamples,
    getFieldLookupFromSelection,
    getGroupedSampleDisplayColumns,
    getGroupedSampleDomainFields,
    getSampleSet,
    getSampleTypeDetails,
    getSelectedSampleIdsFromSelectionKey,
    getSelectionLineageData,
    updateSampleStorageData,
} from './internal/components/samples/actions';
import { SampleTypeEmptyAlert } from './internal/components/samples/SampleTypeEmptyAlert';
import { SampleAmountEditModal } from './internal/components/samples/SampleAmountEditModal';
import { StorageAmountInput } from './internal/components/samples/StorageAmountInput';

import { AppContextProvider, useAppContext } from './internal/AppContext';
import { AppContexts } from './internal/AppContexts';
import { useContainerUser } from './internal/components/container/actions';

import { BaseDomainDesigner } from './internal/components/domainproperties/BaseDomainDesigner';
import {
    getFilterForSampleOperation,
    getOmittedSampleTypeColumns,
    getOperationNotPermittedMessage,
    getOperationNotPermittedMessageFromCounts,
    getSampleDomainDefaultSystemFields,
    getSampleStatus,
    getSampleStatusContainerFilter,
    getSampleStatusType,
    getURLParamsForSampleSelectionKey,
    isAllSamplesSchema,
    isSampleOperationPermitted,
    isSamplesSchema,
    SamplesEditButtonSections,
} from './internal/components/samples/utils';
import {
    AssayContext,
    AssayContextConsumer,
    AssayContextProvider,
    withAssayModels,
    withAssayModelsFromLocation,
} from './internal/components/assay/withAssayModels';
import { AssayPicker, AssayPickerTabs } from './internal/components/assay/AssayPicker';
import { AssayStateModel, AssayUploadResultModel } from './internal/components/assay/models';
import {
    allowReimportAssayRun,
    clearAssayDefinitionCache,
    getAssayDefinitions,
    getProtocol,
} from './internal/components/assay/actions';
import { BaseBarChart } from './internal/components/chart/BaseBarChart';
import {
    createHorizontalBarLegendData,
    createPercentageBarData,
    processChartData,
} from './internal/components/chart/utils';
import { ReportItemModal, ReportList, ReportListItem } from './internal/components/report-list/ReportList';
import {
    getImmediateChildLineageFilterValue,
    getLineageFilterValue,
    invalidateLineageResults,
} from './internal/components/lineage/actions';
import { withLineage } from './internal/components/lineage/withLineage';
import { DEFAULT_LINEAGE_DISTANCE } from './internal/components/lineage/constants';
import {
    LINEAGE_DIRECTIONS,
    LINEAGE_GROUPING_GENERATIONS,
    LineageFilter,
    LineageURLResolvers,
} from './internal/components/lineage/types';
import { LineageDepthLimitMessage, LineageGraph } from './internal/components/lineage/LineageGraph';
import { LineageGrid, LineageGridFromLocation, LineagePage } from './internal/components/lineage/grid/LineageGrid';
import { SampleTypeLineageCounts } from './internal/components/lineage/SampleTypeLineageCounts';
import { NavigationBar } from './internal/components/navigation/NavigationBar';
import { SEARCH_PLACEHOLDER } from './internal/components/navigation/constants';
import { FindByIdsModal } from './internal/components/search/FindByIdsModal';
import { QueryFilterPanel } from './internal/components/search/QueryFilterPanel';
import { ProductNavigationMenu } from './internal/components/productnavigation/ProductNavigationMenu';
import { useSubNavTabsContext } from './internal/components/navigation/hooks';
import { Breadcrumb } from './internal/components/navigation/Breadcrumb';
import { BreadcrumbCreate } from './internal/components/navigation/BreadcrumbCreate';
import { MenuItemModel, MenuSectionModel, ProductMenuModel } from './internal/components/navigation/model';

import { UserSelectInput } from './internal/components/forms/input/UserSelectInput';
import {
    FormsyCheckbox,
    FormsyInput,
    FormsySelect,
    FormsyTextArea,
} from './internal/components/forms/input/FormsyReactComponents';
import { UserDetailHeader } from './internal/components/user/UserDetailHeader';
import { UserProfile } from './internal/components/user/UserProfile';
import { ChangePasswordModal } from './internal/components/user/ChangePasswordModal';
import { useUserProperties } from './internal/components/user/hooks';
import { UserLink, UserLinkList } from './internal/components/user/UserLink';
import { ProfilePage, APIKeysPanel } from './internal/components/user/ProfilePage';
import {
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    DERIVATION_DATA_SCOPES,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    DOMAIN_RANGE_VALIDATOR,
    RANGE_URIS,
    SAMPLE_TYPE_CONCEPT_URI,
    STORAGE_UNIQUE_ID_CONCEPT_URI,
} from './internal/components/domainproperties/constants';
import { ExpandableContainer } from './internal/components/ExpandableContainer';
import { withPermissionsPage } from './internal/components/permissions/withPermissionsPage';
import { Principal, SecurityPolicy, SecurityRole } from './internal/components/permissions/models';
import { fetchContainerSecurityPolicy, getUserLimitSettings } from './internal/components/permissions/actions';
import {
    getCrossFolderSelectionResult,
    getDataDeleteConfirmationData,
    getDataOperationConfirmationData,
    getDeleteConfirmationData,
    getEntityTypeOptions,
    getExcludedDataTypeNames,
    getOperationConfirmationData,
    getOrderedSelectedMappedKeysFromQueryModel,
    getParentTypeDataForLineage,
    getSampleOperationConfirmationData,
    saveOrderedSnapshotSelection,
} from './internal/components/entities/actions';
import {
    AssayResultDataType,
    AssayRunDataType,
    AssayRunOperation,
    DATA_CLASS_IMPORT_PREFIX,
    DataClassDataType,
    DataOperation,
    ParentEntityLineageColumns,
    ParentEntityRequiredColumns,
    SAMPLE_SET_IMPORT_PREFIX,
    SamplePropertyDataType,
    SampleTypeDataType,
} from './internal/components/entities/constants';
import {
    getEntityDescription,
    getEntityNoun,
    getInitialParentChoices,
    getJobCreationHref,
    getUniqueIdColumnMetadata,
    isSampleEntity,
    isDataClassEntity,
    sampleDeleteDependencyText,
} from './internal/components/entities/utils';
import {
    ALIQUOT_CREATION,
    CHILD_SAMPLE_CREATION,
    DERIVATIVE_CREATION,
    POOLED_SAMPLE_CREATION,
    SampleCreationType,
} from './internal/components/samples/models';
import { DEFAULT_ALIQUOT_NAMING_PATTERN, SampleTypeModel } from './internal/components/domainproperties/samples/models';

import { EditableDetailPanel } from './public/QueryModel/EditableDetailPanel';
import { Pagination } from './internal/components/pagination/Pagination';
import { getQueryModelExportParams, runDetailsColumnsForQueryModel } from './public/QueryModel/utils';
import { useRouteLeave } from './internal/util/RouteLeave';
import { BarChartViewer } from './internal/components/chart/BarChartViewer';
import { HorizontalBarSection } from './internal/components/chart/HorizontalBarSection';
import { ItemsLegend } from './internal/components/chart/ItemsLegend';
import { CHART_GROUPS } from './internal/components/chart/configs';
import { AuditDetailsModel, TimelineEventModel } from './internal/components/auditlog/models';
import {
    ASSAY_AUDIT_QUERY,
    DATACLASS_DATA_UPDATE_AUDIT_QUERY,
    GROUP_AUDIT_QUERY,
    INVENTORY_AUDIT_QUERY,
    QUERY_UPDATE_AUDIT_QUERY,
    SAMPLE_TIMELINE_AUDIT_QUERY,
    SAMPLE_TYPE_AUDIT_QUERY,
    SOURCE_AUDIT_QUERY,
    WORKFLOW_AUDIT_QUERY,
} from './internal/components/auditlog/constants';
import { AuditQueriesListingPage } from './internal/components/auditlog/AuditQueriesListingPage';
import { AuditDetails } from './internal/components/auditlog/AuditDetails';
import { TimelineView } from './internal/components/auditlog/TimelineView';
import { getEventDataValueDisplay, getTimelineEntityUrl } from './internal/components/auditlog/utils';
import {
    fetchDomain,
    fetchDomainDetails,
    saveDomain,
    setDomainFields,
} from './internal/components/domainproperties/actions';
import { createFormInputId } from './internal/components/domainproperties/utils';
import {
    DomainDesign,
    DomainDetails,
    DomainField,
    PropertyValidator,
    DomainException,
} from './internal/components/domainproperties/models';
import { SAMPLE_TYPE } from './internal/components/domainproperties/PropDescType';
import DomainForm from './internal/components/domainproperties/DomainForm';
import { BasePropertiesPanel } from './internal/components/domainproperties/BasePropertiesPanel';
import { DomainFieldsDisplay } from './internal/components/domainproperties/DomainFieldsDisplay';
import { AssayProtocolModel } from './internal/components/domainproperties/assay/models';
import { AssayDesignerPanels } from './internal/components/domainproperties/assay/AssayDesignerPanels';
import { ListModel } from './internal/components/domainproperties/list/models';
import { IssuesListDefModel } from './internal/components/domainproperties/issues/models';
import { IssuesListDefDesignerPanels } from './internal/components/domainproperties/issues/IssuesListDefDesignerPanels';
import { DatasetDesignerPanels } from './internal/components/domainproperties/dataset/DatasetDesignerPanels';
import { DatasetModel } from './internal/components/domainproperties/dataset/models';
import {
    fetchListDesign,
    getListIdFromDomainId,
    getListProperties,
} from './internal/components/domainproperties/list/actions';
import { fetchIssuesListDefDesign } from './internal/components/domainproperties/issues/actions';
import { fetchDatasetDesign } from './internal/components/domainproperties/dataset/actions';
import { SampleTypeDesigner } from './internal/components/domainproperties/samples/SampleTypeDesigner';
import { ListDesignerPanels } from './internal/components/domainproperties/list/ListDesignerPanels';
import { DataClassDesigner } from './internal/components/domainproperties/dataclasses/DataClassDesigner';
import { DataClassModel } from './internal/components/domainproperties/dataclasses/models';
import { deleteDataClass, fetchDataClass } from './internal/components/domainproperties/dataclasses/actions';
import { DesignerDetailTooltip } from './internal/components/domainproperties/DesignerDetailPanel';
import { DomainFieldLabel } from './internal/components/domainproperties/DomainFieldLabel';
import { RangeValidationOptionsModal } from './internal/components/domainproperties/validation/RangeValidationOptions';
import { DataTypeProjectsPanel } from './internal/components/domainproperties/DataTypeProjectsPanel';

import { AssayImportPanels } from './internal/components/assay/AssayImportPanels';
import { AssayDesignEmptyAlert } from './internal/components/assay/AssayDesignEmptyAlert';
import { makeQueryInfo, sleep, wrapDraggable } from './internal/test/testHelpers';
import {
    mountWithAppServerContext,
    mountWithAppServerContextOptions,
    mountWithServerContext,
    mountWithServerContextOptions,
    waitForLifecycle,
} from './internal/test/enzymeTestHelpers';
import { renderWithAppContext } from './internal/test/reactTestLibraryHelpers';
import { flattenValuesFromRow, QueryModel } from './public/QueryModel/QueryModel';
import { withQueryModels } from './public/QueryModel/withQueryModels';
import { GridPanel, GridPanelWithModel } from './public/QueryModel/GridPanel';
import { TabbedGridPanel } from './public/QueryModel/TabbedGridPanel';
import { DetailPanel, DetailPanelWithModel } from './public/QueryModel/DetailPanel';
import { makeTestActions, makeTestQueryModel } from './public/QueryModel/testUtils';
import { SchemaBrowserRoutes } from './internal/components/SchemaBrowser/SchemaBrowserRoutes';
import {
    ACTIVE_JOB_INDICATOR_CLS,
    BACKGROUND_IMPORT_MIN_FILE_SIZE,
    BACKGROUND_IMPORT_MIN_ROW_SIZE,
    DATA_IMPORT_FILE_SIZE_LIMITS,
    PIPELINE_PROVIDER_FILTER_LKB,
    PIPELINE_PROVIDER_FILTER_LKSM,
} from './internal/components/pipeline/constants';
import { PipelineRoutes } from './internal/components/pipeline/PipelineRoutes';
import { getTitleDisplay, hasActivePipelineJob } from './internal/components/pipeline/utils';
import { DisableableMenuItem } from './internal/components/samples/DisableableMenuItem';
import { SampleStatusTag } from './internal/components/samples/SampleStatusTag';
import { ManageSampleStatusesPanel } from './internal/components/samples/ManageSampleStatusesPanel';
import { SampleStatusLegend } from './internal/components/samples/SampleStatusLegend';
import {
    ALIQUOT_FILTER_MODE,
    ALIQUOTED_FROM_COL,
    DEFAULT_SAMPLE_FIELD_CONFIG,
    FIND_BY_IDS_QUERY_PARAM,
    IS_ALIQUOT_COL,
    SAMPLE_DATA_EXPORT_CONFIG,
    SAMPLE_EXPORT_CONFIG,
    SAMPLE_ID_FIND_FIELD,
    SAMPLE_INSERT_EXTRA_COLUMNS,
    SAMPLE_STATE_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SAMPLE_STATUS_REQUIRED_COLUMNS,
    SAMPLE_STORAGE_COLUMNS,
    SampleOperation,
    SAMPLES_WITH_TYPES_FILTER,
    SampleStateType,
    SELECTION_KEY_TYPE,
    UNIQUE_ID_FIND_FIELD,
} from './internal/components/samples/constants';
import { createMockWithRouteLeave } from './internal/mockUtils';
import { ConceptModel } from './internal/components/ontology/models';
import { OntologyConceptPicker } from './internal/components/ontology/OntologyConceptPicker';
import { OntologyBrowserPage } from './internal/components/ontology/OntologyBrowserPanel';
import { OntologyConceptOverviewPanel } from './internal/components/ontology/ConceptOverviewPanel';
import { OntologyBrowserFilterPanel } from './internal/components/ontology/OntologyBrowserFilterPanel';
import { OntologySearchInput } from './internal/components/ontology/OntologyTreeSearchContainer';
import { AppModel } from './internal/app/models';
import { Picklist, PICKLIST_SAMPLES_FILTER } from './internal/components/picklist/models';
import { PicklistCreationMenuItem } from './internal/components/picklist/PicklistCreationMenuItem';
import { PicklistButton } from './internal/components/picklist/PicklistButton';
import { PicklistEditModal } from './internal/components/picklist/PicklistEditModal';

import { AddToPicklistMenuItem } from './internal/components/picklist/AddToPicklistMenuItem';
import {
    deletePicklists,
    getOrderedSelectedPicklistSamples,
    getPicklistFromId,
    getPicklistListingContainerFilter,
    getSelectedPicklistSamples,
    updatePicklist,
} from './internal/components/picklist/actions';
import { PrintLabelsModal } from './internal/components/labels/PrintLabelsModal';
import { BarTenderConfiguration } from './internal/components/labels/models';
import { useLabelPrintingContext } from './internal/components/labels/LabelPrintingContextProvider';
import { ColumnSelectionModal } from './internal/components/ColumnSelectionModal';

import { AppReducers, ProductMenuReducers, ServerNotificationReducers } from './internal/app/reducers';

import {
    CloseEventCode,
    freezerManagerIsCurrentApp,
    getAppHomeFolderPath,
    getCurrentAppProperties,
    getCurrentProductName,
    getPrimaryAppProperties,
    getProjectAssayDesignExclusion,
    getProjectDataClassExclusion,
    getProjectDataExclusion,
    getProjectPath,
    getProjectSampleTypeExclusion,
    hasModule,
    hasPremiumModule,
    hasProductProjects,
    isAllProductFoldersFilteringEnabled,
    isAppHomeFolder,
    isAssayDesignExportEnabled,
    isAssayEnabled,
    isAssayQCEnabled,
    isAssayRequestsEnabled,
    isBiologicsEnabled,
    isELNEnabled,
    isFreezerManagementEnabled,
    isMediaEnabled,
    isPlatesEnabled,
    isPremiumProductEnabled,
    isProductProjectsEnabled,
    isCrossProjectImportEnabled,
    isProjectContainer,
    isProtectedDataEnabled,
    isSampleAliquotSelectorEnabled,
    isSampleManagerEnabled,
    isSampleStatusEnabled,
    isSharedDefinition,
    isWorkflowEnabled,
    registerWebSocketListeners,
    sampleManagerIsPrimaryApp,
    useMenuSectionConfigs,
    userCanDeletePublicPicklists,
    userCanDesignLocations,
    userCanDesignSourceTypes,
    userCanEditSharedViews,
    userCanEditStorageData,
    userCanManagePicklists,
    userCanManageSampleWorkflow,
    userCanReadAssays,
    userCanReadDataClasses,
    userCanReadMedia,
    userCanReadNotebooks,
    userCanReadRegistry,
    userCanReadSources,
} from './internal/app/utils';
import {
    menuInit,
    menuInvalidate,
    menuReload,
    serverNotificationInit,
    serverNotificationInvalidate,
    updateUser,
    updateUserDisplayName,
} from './internal/app/actions';
import {
    TEST_USER_APP_ADMIN,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_EDITOR_WITHOUT_DELETE,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_GUEST,
    TEST_USER_PROJECT_ADMIN,
    TEST_USER_QC_ANALYST,
    TEST_USER_READER,
    TEST_USER_STORAGE_DESIGNER,
    TEST_USER_STORAGE_EDITOR,
    TEST_USER_WORKFLOW_EDITOR,
} from './internal/userFixtures';
import {
    createTestProjectAppContextAdmin,
    createTestProjectAppContextNonAdmin,
    TEST_FOLDER_CONTAINER,
    TEST_PROJECT_CONTAINER,
} from './internal/containerFixtures';
import {
    ASSAY_DESIGN_KEY,
    ASSAYS_KEY,
    AUDIT_KEY,
    BIOLOGICS_APP_PROPERTIES,
    BOXES_KEY,
    CROSS_TYPE_KEY,
    DATA_CLASS_KEY,
    ELN_KEY,
    EntityCreationMode,
    EXPERIMENTAL_REQUESTS_MENU,
    FILE_IMPORT_SAMPLES_HREF,
    FILE_UPDATE_SAMPLES_HREF,
    FIND_SAMPLES_BY_FILTER_HREF,
    FIND_SAMPLES_BY_FILTER_KEY,
    FIND_SAMPLES_BY_ID_HREF,
    FIND_SAMPLES_BY_ID_KEY,
    FREEZER_MANAGER_APP_PROPERTIES,
    FREEZERS_KEY,
    GRID_INSERT_SAMPLES_HREF,
    HOME_KEY,
    MEDIA_KEY,
    MINE_KEY,
    MY_PICKLISTS_HREF,
    NEW_ASSAY_DESIGN_HREF,
    NEW_SAMPLE_TYPE_HREF,
    NEW_SOURCE_TYPE_HREF,
    NEW_STANDARD_ASSAY_DESIGN_HREF,
    NOTIFICATION_TIMEOUT,
    PICKLIST_HOME_HREF,
    PICKLIST_KEY,
    PLATES_KEY,
    REGISTRY_KEY,
    SAMPLE_MANAGER_APP_PROPERTIES,
    SAMPLE_TYPE_KEY,
    SAMPLES_KEY,
    SEARCH_KEY,
    SERVER_NOTIFICATION_MAX_ROWS,
    SOURCE_TYPE_KEY,
    SOURCES_KEY,
    TEAM_KEY,
    TEAM_PICKLISTS_HREF,
    UPDATE_USER,
    UPDATE_USER_DISPLAY_NAME,
    USER_KEY,
    WORKFLOW_HOME_HREF,
    WORKFLOW_KEY,
} from './internal/app/constants';
import { Key, useEnterEscape } from './public/useEnterEscape';
import { DateInput } from './internal/components/DateInput';
import { EditInlineField } from './internal/components/EditInlineField';
import { FileAttachmentArea } from './internal/components/files/FileAttachmentArea';
import { AnnouncementRenderType } from './internal/announcements/model';
import { Discussions } from './internal/announcements/Discussions';
import { Thread } from './internal/announcements/Thread';
import { ThreadBlock } from './internal/announcements/ThreadBlock';
import { ThreadEditor } from './internal/announcements/ThreadEditor';
import { useNotAuthorized, useNotFound, usePortalRef } from './internal/hooks';
import {
    TEST_LKS_STARTER_MODULE_CONTEXT,
    TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
    TEST_LKSM_STARTER_AND_WORKFLOW_MODULE_CONTEXT,
    TEST_LKSM_STARTER_MODULE_CONTEXT,
} from './internal/productFixtures';
import {
    GENERAL_ASSAY_PROVIDER_NAME,
    RUN_PROPERTIES_REQUIRED_COLUMNS,
    WORKFLOW_TASK_PROPERTIES_REQUIRED_COLUMNS,
} from './internal/components/assay/constants';
import { AdminSettingsPage } from './internal/components/administration/AdminSettingsPage';
import { GlobalStateContextProvider } from './internal/GlobalStateContext';
import {
    areUnitsCompatible,
    convertUnitDisplay,
    getAltMetricUnitOptions,
    getAltUnitKeys,
    getMetricUnitOptions,
    getMultiAltUnitKeys,
    getStoredAmountDisplay,
    isValuePrecisionValid,
    MEASUREMENT_UNITS,
    UnitModel,
} from './internal/util/measurement';
import { DELIMITER, DETAIL_TABLE_CLASSES } from './internal/components/forms/constants';
import {
    DISCARD_CONSUMED_CHECKBOX_FIELD,
    DISCARD_CONSUMED_COMMENT_FIELD,
    DiscardConsumedSamplesPanel,
} from './internal/components/samples/DiscardConsumedSamplesPanel';
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from './internal/components/picklist/constants';
import { getDefaultAPIWrapper, getTestAPIWrapper } from './internal/APIWrapper';
import { FormButtons } from './internal/FormButtons';
import { ModalButtons } from './internal/ModalButtons';
import { getSecurityTestAPIWrapper } from './internal/components/security/APIWrapper';

// See Immer docs for why we do this: https://immerjs.github.io/immer/docs/installation#pick-your-immer-version
enableMapSet();
enablePatches();

const App = {
    AppReducers,
    ProductMenuReducers,
    ServerNotificationReducers,
    CloseEventCode,
    EntityCreationMode,
    createTestProjectAppContextAdmin,
    createTestProjectAppContextNonAdmin,
    getCurrentAppProperties,
    registerWebSocketListeners,
    getAppHomeFolderPath,
    isAppHomeFolder,
    isAssayDesignExportEnabled,
    isAssayEnabled,
    isAssayQCEnabled,
    isAssayRequestsEnabled,
    isMediaEnabled,
    isWorkflowEnabled,
    isELNEnabled,
    isFreezerManagementEnabled,
    isPlatesEnabled,
    isSampleManagerEnabled,
    isBiologicsEnabled,
    isPremiumProductEnabled,
    isSampleAliquotSelectorEnabled,
    isProjectContainer,
    isProtectedDataEnabled,
    isSharedDefinition,
    sampleManagerIsPrimaryApp,
    freezerManagerIsCurrentApp,
    isSampleStatusEnabled,
    isProductProjectsEnabled,
    isCrossProjectImportEnabled,
    isAllProductFoldersFilteringEnabled,
    isSampleEntity,
    isDataClassEntity,
    getPrimaryAppProperties,
    getProjectDataExclusion,
    getProjectAssayDesignExclusion,
    getProjectDataClassExclusion,
    getProjectSampleTypeExclusion,
    getProjectPath,
    getSecurityTestAPIWrapper,
    hasPremiumModule,
    hasProductProjects,
    hasModule,
    getDateFormat,
    getDateTimeFormat,
    useMenuSectionConfigs,
    menuInit,
    menuInvalidate,
    menuReload,
    serverNotificationInit,
    serverNotificationInvalidate,
    updateUser,
    updateUserDisplayName,
    userCanDesignLocations,
    userCanEditStorageData,
    userCanDesignSourceTypes,
    userCanManagePicklists,
    userCanManageSampleWorkflow,
    userCanReadAssays,
    userCanReadNotebooks,
    userCanReadMedia,
    userCanReadDataClasses,
    userCanReadRegistry,
    userCanReadSources,
    userCanEditSharedViews,
    userCanDeletePublicPicklists,
    getCurrentProductName,
    UPDATE_USER,
    UPDATE_USER_DISPLAY_NAME,
    BIOLOGICS: BIOLOGICS_APP_PROPERTIES,
    SAMPLE_MANAGER: SAMPLE_MANAGER_APP_PROPERTIES,
    FREEZER_MANAGER: FREEZER_MANAGER_APP_PROPERTIES,
    ASSAYS_KEY,
    ASSAY_DESIGN_KEY,
    AUDIT_KEY,
    EXPERIMENTAL_REQUESTS_MENU,
    FIND_SAMPLES_BY_ID_KEY,
    FIND_SAMPLES_BY_FILTER_KEY,
    PICKLIST_KEY,
    MINE_KEY,
    TEAM_KEY,
    SAMPLES_KEY,
    SAMPLE_TYPE_KEY,
    SEARCH_KEY,
    DATA_CLASS_KEY,
    SOURCES_KEY,
    SOURCE_TYPE_KEY,
    WORKFLOW_KEY,
    FREEZERS_KEY,
    BOXES_KEY,
    HOME_KEY,
    USER_KEY,
    GRID_INSERT_SAMPLES_HREF,
    FILE_IMPORT_SAMPLES_HREF,
    FILE_UPDATE_SAMPLES_HREF,
    NEW_SOURCE_TYPE_HREF,
    NEW_SAMPLE_TYPE_HREF,
    NEW_ASSAY_DESIGN_HREF,
    NEW_STANDARD_ASSAY_DESIGN_HREF,
    FIND_SAMPLES_BY_FILTER_HREF,
    FIND_SAMPLES_BY_ID_HREF,
    PICKLIST_HOME_HREF,
    MY_PICKLISTS_HREF,
    TEAM_PICKLISTS_HREF,
    WORKFLOW_HOME_HREF,
    NOTIFICATION_TIMEOUT,
    SERVER_NOTIFICATION_MAX_ROWS,
    TEST_USER_GUEST,
    TEST_USER_READER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_EDITOR_WITHOUT_DELETE,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_PROJECT_ADMIN,
    TEST_USER_APP_ADMIN,
    TEST_USER_STORAGE_DESIGNER,
    TEST_USER_STORAGE_EDITOR,
    TEST_USER_QC_ANALYST,
    TEST_USER_WORKFLOW_EDITOR,
    TEST_LKS_STARTER_MODULE_CONTEXT,
    TEST_LKSM_STARTER_MODULE_CONTEXT,
    TEST_LKSM_STARTER_AND_WORKFLOW_MODULE_CONTEXT,
    TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
    TEST_PROJECT_CONTAINER,
    TEST_FOLDER_CONTAINER,
    MEDIA_KEY,
    REGISTRY_KEY,
    CROSS_TYPE_KEY,
    ELN_KEY,
    DATA_CLASS_IMPORT_PREFIX,
    SAMPLE_SET_IMPORT_PREFIX,
    SAMPLE_PROPERTY_ALL_SAMPLE_TYPE,
    SEARCH_PAGE_DEFAULT_SIZE,
    DELIMITER,
    DETAIL_TABLE_CLASSES,
    DISCARD_CONSUMED_CHECKBOX_FIELD,
    DISCARD_CONSUMED_COMMENT_FIELD,
    SAMPLE_FILTER_METRIC_AREA,
    ALIQUOTED_FROM_COL,
    PRIVATE_PICKLIST_CATEGORY,
    PUBLIC_PICKLIST_CATEGORY,
    DATA_IMPORT_TOPIC,
    PLATES_KEY,
};

const Hooks = {
    useAppContext,
    useContainerUser,
    useEnterEscape,
    useLabelPrintingContext,
    useNotificationsContext,
    useRouteLeave,
    useServerContext,
    useUserProperties,
    useUsersWithPermissions,
};

export {
    // internal application
    App,
    AppModel,
    Hooks,
    getDefaultAPIWrapper,
    // global state functions
    initQueryGridState,
    getContainerFilter,
    getContainerFilterForFolder,
    getContainerFilterForLookups,
    createGridModelId,
    clearSelected,
    // grid functions
    getOrderedSelectedMappedKeysFromQueryModel,
    saveOrderedSnapshotSelection,
    getSelected,
    getSelectedData,
    getQueryModelExportParams,
    replaceSelected,
    setSelected,
    setSnapshotSelections,
    getSampleTypesFromTransactionIds,
    selectGridIdsFromTransactionId,
    getGridIdsFromTransactionId,
    addColumns,
    changeColumn,
    removeColumn,
    // query related items
    QueryCommandResponse,
    InsertFormats,
    InsertOptions,
    getVerbForInsertOption,
    insertRows,
    selectDistinctRows,
    selectRows,
    selectRowsDeprecated,
    updateRows,
    deleteRows,
    importData,
    getQueryDetails,
    invalidateQueryDetailsCache,
    registerFilterType,
    COLUMN_IN_FILTER_TYPE,
    COLUMN_NOT_IN_FILTER_TYPE,
    ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE,
    IN_EXP_DESCENDANTS_OF_FILTER_TYPE,
    NOT_IN_EXP_DESCENDANTS_OF_FILTER_TYPE,
    getFilterLabKeySql,
    isNegativeFilterType,
    getLegalIdentifier,
    loadQueries,
    loadQueriesFromTable,
    // editable grid related items
    loadEditorModelData,
    applyEditableGridChangesToModels,
    getUpdatedDataFromEditableGrid,
    initEditableGridModel,
    initEditableGridModels,
    MAX_EDITABLE_GRID_ROWS,
    EditableGridLoaderFromSelection,
    EditableGridPanel,
    EditableGridPanelForUpdate,
    EditableGridTabs,
    EditorModel,
    EditorMode,
    cancelEvent,
    // url and location related items
    AppURL,
    ActionMapper,
    URL_MAPPERS,
    URLResolver,
    URLService,
    ListResolver,
    ExperimentRunResolver,
    getQueryParams,
    pushParameters,
    removeParameters,
    replaceParameters,
    getHref,
    hasParameter,
    toggleParameter,
    applyURL,
    buildURL,
    imageURL,
    spliceURL,
    WHERE_FILTER_TYPE,
    NOT_ANY_FILTER_TYPE,
    createProductUrl,
    createProductUrlFromParts,
    // renderers
    AttachmentCard,
    AliasRenderer,
    ANCESTOR_LOOKUP_CONCEPT_URI,
    AncestorRenderer,
    AppendUnits,
    DefaultRenderer,
    FileColumnRenderer,
    LabelColorRenderer,
    MultiValueRenderer,
    NoLinkRenderer,
    ExpirationDateColumnRenderer,
    StorageStatusRenderer,
    SampleStatusRenderer,
    ImportAliasRenderer,
    SampleTypeImportAliasRenderer,
    SourceTypeImportAliasRenderer,
    UserDetailsRenderer,
    resolveDetailRenderer,
    // form related items
    BulkUpdateForm,
    QueryFormInputs,
    LookupSelectInput,
    SelectInput,
    DatePickerInput,
    FileInput,
    TextAreaInput,
    TextInput,
    ColorPickerInput,
    ColorIcon,
    FieldEditForm,
    FieldEditProps,
    QuerySelect,
    UserSelectInput,
    FormsyCheckbox,
    FormsyInput,
    FormsySelect,
    FormsyTextArea,
    DetailPanelHeader,
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
    AutoForm,
    DateInput,
    EditInlineField,
    updateRowFieldValue,
    // user/permissions related items
    APIKeysPanel,
    getUsersWithPermissions,
    useUsersWithPermissions,
    getUserProperties,
    getUserRoleDisplay,
    UserDetailHeader,
    UserProfile,
    UserLink,
    UserLinkList,
    ProfilePage,
    ChangePasswordModal,
    InsufficientPermissionsAlert,
    InsufficientPermissionsPage,
    BasePermissionsCheckPage,
    RequiresPermission,
    hasAllPermissions,
    hasAnyPermissions,
    hasPermissions,
    fetchContainerSecurityPolicy,
    getUserLimitSettings,
    withPermissionsPage,
    SecurityPolicy,
    SecurityRole,
    Principal,
    useUserProperties,
    // sample picklist items
    AddToPicklistMenuItem,
    PicklistButton,
    PicklistCreationMenuItem,
    Picklist,
    getOrderedSelectedPicklistSamples,
    getSelectedPicklistSamples,
    getPicklistFromId,
    getPicklistListingContainerFilter,
    PicklistEditModal,
    PICKLIST_SAMPLES_FILTER,
    deletePicklists,
    updatePicklist,
    // data class and sample type related items
    ALIQUOT_FILTER_MODE,
    DataClassModel,
    deleteDataClass,
    fetchDataClass,
    isSampleOperationPermitted,
    isSamplesSchema,
    isAllSamplesSchema,
    getFilterForSampleOperation,
    getSampleDomainDefaultSystemFields,
    getSampleStatus,
    getSampleStatusContainerFilter,
    getSampleStatusType,
    getURLParamsForSampleSelectionKey,
    DisableableMenuItem,
    SampleOperation,
    SampleStateType,
    SampleStatusTag,
    SAMPLE_STATE_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SAMPLE_STATUS_REQUIRED_COLUMNS,
    SAMPLE_STORAGE_COLUMNS,
    FIND_BY_IDS_QUERY_PARAM,
    SAMPLES_WITH_TYPES_FILTER,
    SAMPLE_DATA_EXPORT_CONFIG,
    SAMPLE_EXPORT_CONFIG,
    SAMPLE_INSERT_EXTRA_COLUMNS,
    IS_ALIQUOT_COL,
    SampleCreationType,
    ALIQUOT_CREATION,
    CHILD_SAMPLE_CREATION,
    DERIVATIVE_CREATION,
    POOLED_SAMPLE_CREATION,
    SampleTypeModel,
    DEFAULT_ALIQUOT_NAMING_PATTERN,
    deleteSampleSet,
    fetchSamples,
    getSampleSet,
    getSampleTypeDetails,
    getFieldLookupFromSelection,
    getSelectionLineageData,
    updateSampleStorageData,
    getGroupedSampleDomainFields,
    getGroupedSampleDisplayColumns,
    getParentTypeDataForLineage,
    getSelectedSampleIdsFromSelectionKey,
    ParentEntityLineageColumns,
    SampleTypeDataType,
    SamplePropertyDataType,
    DataClassDataType,
    AssayResultDataType,
    AssayRunDataType,
    AssayRunOperation,
    DataOperation,
    ParentEntityRequiredColumns,
    SampleAmountEditModal,
    SampleTypeEmptyAlert,
    SamplesEditButtonSections,
    StorageAmountInput,
    getOmittedSampleTypeColumns,
    getOperationNotPermittedMessageFromCounts,
    getOperationNotPermittedMessage,
    ManageSampleStatusesPanel,
    SampleStatusLegend,
    EntityIdCreationModel,
    EntityTypeOption,
    EntityMoveConfirmationModal,
    EntityMoveModal,
    EntityParentType,
    OperationConfirmationData,
    AddEntityButton,
    RemoveEntityButton,
    AssayResultsForSamplesMenuItem,
    AssayResultsForSamplesButton,
    SampleAliquotViewSelector,
    GridAliquotViewSelector,
    FindDerivativesMenuItem,
    FindDerivativesButton,
    SAMPLE_FINDER_SESSION_PREFIX,
    getSearchFilterObjs,
    searchFiltersToJson,
    getSampleFinderLocalStorageKey,
    getSampleOperationConfirmationData,
    getDeleteConfirmationData,
    getEntityTypeOptions,
    getCrossFolderSelectionResult,
    getExcludedDataTypeNames,
    getOperationConfirmationData,
    getDataOperationConfirmationData,
    getDataDeleteConfirmationData,
    getUniqueIdColumnMetadata,
    sampleDeleteDependencyText,
    getEntityNoun,
    getEntityDescription,
    getInitialParentChoices,
    getJobCreationHref,
    getPermissionRestrictionMessage,
    DiscardConsumedSamplesPanel,
    // metric related items
    UnitModel,
    MEASUREMENT_UNITS,
    areUnitsCompatible,
    convertUnitDisplay,
    getAltMetricUnitOptions,
    getAltUnitKeys,
    getMultiAltUnitKeys,
    getMetricUnitOptions,
    getStoredAmountDisplay,
    isValuePrecisionValid,
    // search related items
    SearchPanel,
    SearchCategory,
    SearchField,
    SearchScope,
    getSearchScopeFromContainerFilter,
    isValidFilterField,
    getFilterValuesAsArray,
    getFieldFiltersValidationResult,
    // administration
    AccountSettingsPage,
    UserManagementPage,
    CreateProjectPage,
    ProjectManagementPage,
    GroupManagementPage,
    PermissionManagementPage,
    AdminSettingsPage,
    // assay
    AssayUploadResultModel,
    AssayStateModel,
    AssayImportPanels,
    AssayPicker,
    AssayPickerTabs,
    withAssayModels,
    withAssayModelsFromLocation,
    AssayContext,
    AssayContextConsumer,
    AssayContextProvider,
    AssayDefinitionModel,
    AssayDomainTypes,
    AssayLink,
    AssayDesignEmptyAlert,
    allowReimportAssayRun,
    clearAssayDefinitionCache,
    getAssayDefinitions,
    WORKFLOW_TASK_PROPERTIES_REQUIRED_COLUMNS,
    RUN_PROPERTIES_REQUIRED_COLUMNS,
    GENERAL_ASSAY_PROVIDER_NAME,
    // report / chart related items
    BaseBarChart,
    BarChartViewer,
    CHART_GROUPS,
    HorizontalBarSection,
    ItemsLegend,
    createPercentageBarData,
    createHorizontalBarLegendData,
    processChartData,
    DataViewInfoTypes,
    loadReports,
    flattenBrowseDataTreeResponse,
    ReportListItem,
    ReportItemModal,
    ReportList,
    // lineage
    DEFAULT_LINEAGE_DISTANCE,
    LINEAGE_GROUPING_GENERATIONS,
    LINEAGE_DIRECTIONS,
    LineageDepthLimitMessage,
    LineageFilter,
    LineageGraph,
    LineageGrid,
    LineageGridFromLocation,
    LineagePage,
    LineageURLResolvers,
    SampleTypeLineageCounts,
    invalidateLineageResults,
    getImmediateChildLineageFilterValue,
    getLineageFilterValue,
    withLineage,
    // Navigation
    ProductMenuModel,
    MenuSectionModel,
    MenuItemModel,
    NavigationBar,
    SEARCH_PLACEHOLDER,
    ProductNavigationMenu,
    FindByIdsModal,
    QueryFilterPanel,
    Breadcrumb,
    BreadcrumbCreate,
    // notification related items
    NotificationsContextProvider,
    NO_UPDATES_MESSAGE,
    PIPELINE_JOB_NOTIFICATION_EVENT,
    PIPELINE_JOB_NOTIFICATION_EVENT_START,
    PIPELINE_JOB_NOTIFICATION_EVENT_SUCCESS,
    PIPELINE_JOB_NOTIFICATION_EVENT_ERROR,
    SHARED_CONTAINER_PATH,
    NotificationItemModel,
    ReleaseNote,
    Notifications,
    ServerNotificationModel,
    ServerActivityData,
    Persistence,
    getPipelineActivityData,
    markAllNotificationsAsRead,
    deleteSuccessMessage,
    deleteErrorMessage,
    useNotificationsContext,
    withNotificationsContext,
    // domain designer related items
    DomainForm,
    BaseDomainDesigner,
    DomainFieldsDisplay,
    fetchDomain,
    fetchDomainDetails,
    saveDomain,
    createFormInputId,
    setDomainFields,
    DomainDesign,
    DomainField,
    DesignerDetailTooltip,
    DomainFieldLabel,
    RangeValidationOptionsModal,
    PropertyValidator,
    DomainException,
    DOMAIN_RANGE_VALIDATOR,
    DomainDetails,
    inferDomainFromFile,
    InferDomainResponse,
    BasePropertiesPanel,
    AssayDesignerPanels,
    getProtocol,
    AssayProtocolModel,
    SAMPLE_TYPE,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    RANGE_URIS,
    SAMPLE_TYPE_CONCEPT_URI,
    DERIVATION_DATA_SCOPES,
    STORAGE_UNIQUE_ID_CONCEPT_URI,
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    ListDesignerPanels,
    ListModel,
    fetchListDesign,
    getListIdFromDomainId,
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
    DataTypeProjectsPanel,
    // file / webdav related items
    DEFAULT_FILE,
    FilesListing,
    FilesListingForm,
    FileAttachmentArea,
    FileAttachmentEntry,
    FileAttachmentForm,
    FileTree,
    TemplateDownloadButton,
    WebDavFile,
    getWebDavFiles,
    uploadWebDavFile,
    createWebDavDirectory,
    deleteWebDavResource,
    // util functions
    getDisambiguatedSelectInputOptions,
    filterDate,
    formatDate,
    formatDateTime,
    parseDate,
    isRelativeDateFilterValue,
    getParsedRelativeDateStr,
    isDateTimeInPast,
    blurActiveElement,
    caseInsensitive,
    capitalizeFirstChar,
    uncapitalizeFirstChar,
    withTransformedKeys,
    arrayEquals,
    findMissingValues,
    downloadAttachment,
    handleFileInputChange,
    handleRequestFailure,
    resolveKey,
    isInteger,
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
    getConfirmDeleteMessage,
    resolveErrorMessage,
    getHelpLink,
    HelpLink,
    HELP_LINK_REFERRER,
    HelpIcon,
    incrementClientSideMetricCount,
    Key,
    useEnterEscape,
    encodePart,
    decodePart,
    // devTools functions
    applyDevTools,
    devToolsActive,
    toggleDevTools,
    parseCsvString,
    quoteValueWithDelimiters,
    // buttons and menus
    MultiMenuButton,
    SubMenu,
    SubMenuItem,
    SelectionMenuItem,
    ManageDropdownButton,
    SplitButtonGroup,
    PaginationButtons,
    ToggleButtons,
    ToggleIcon,
    DisableableButton,
    ResponsiveMenuButton,
    ResponsiveMenuButtonGroup,
    getMenuItemsForSection,
    getMenuItemForSectionKey,
    // application page related items
    LoadingPage,
    NotFound,
    Page,
    PageHeader,
    PageDetailHeader,
    ErrorBoundary,
    BeforeUnload,
    useRouteLeave,
    SchemaBrowserRoutes,
    Theme,
    SVGIcon,
    useWindowFocusCheckExpiredSession,
    // general components
    Alert,
    ColumnSelectionModal,
    ExpandableContainer,
    Progress,
    LabelHelpTip,
    Tip,
    Grid,
    GridColumn,
    ContentGroup,
    ContentGroupLabel,
    Section,
    ConfirmModal,
    Cards,
    DragDropHandle,
    FieldExpansionToggle,
    LoadingModal,
    LoadingSpinner,
    CreatedModified,
    DeleteIcon,
    LockIcon,
    ExpandableFilterToggle,
    Setting,
    ValueList,
    DataTypeSelector,
    ChoicesListItem,
    // base models, enums, constants
    Container,
    User,
    AppContextProvider,
    useAppContext,
    AppContexts,
    GlobalStateContextProvider,
    ServerContextProvider,
    ServerContextConsumer,
    useServerContext,
    useServerContextDispatch,
    withAppUser,
    QueryColumn,
    QueryInfo,
    QueryLookup,
    Operation,
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
    insertColumnFilter,
    EXPORT_TYPES,
    SELECTION_KEY_TYPE,
    SAMPLE_ID_FIND_FIELD,
    UNIQUE_ID_FIND_FIELD,
    AssayUploadTabs,
    // QueryModel
    GRID_CHECKBOX_OPTIONS,
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
    QUERY_UPDATE_AUDIT_QUERY,
    DATACLASS_DATA_UPDATE_AUDIT_QUERY,
    GROUP_AUDIT_QUERY,
    ASSAY_AUDIT_QUERY,
    SAMPLE_TIMELINE_AUDIT_QUERY,
    SAMPLE_TYPE_AUDIT_QUERY,
    SOURCE_AUDIT_QUERY,
    INVENTORY_AUDIT_QUERY,
    WORKFLOW_AUDIT_QUERY,
    AuditDetailsModel,
    AuditQueriesListingPage,
    AuditDetails,
    getEventDataValueDisplay,
    getTimelineEntityUrl,
    TimelineEventModel,
    TimelineView,
    // pipeline
    hasActivePipelineJob,
    getTitleDisplay,
    PipelineRoutes,
    BACKGROUND_IMPORT_MIN_FILE_SIZE,
    BACKGROUND_IMPORT_MIN_ROW_SIZE,
    DATA_IMPORT_FILE_SIZE_LIMITS,
    ACTIVE_JOB_INDICATOR_CLS,
    PIPELINE_PROVIDER_FILTER_LKSM,
    PIPELINE_PROVIDER_FILTER_LKB,
    // Test Helpers
    sleep,
    createMockWithRouteLeave,
    makeQueryInfo,
    mountWithAppServerContextOptions,
    mountWithServerContextOptions,
    mountWithAppServerContext,
    mountWithServerContext,
    renderWithAppContext,
    waitForLifecycle,
    wrapDraggable,
    selectOptionByText,
    getTestAPIWrapper,
    // Ontology
    OntologyBrowserPage,
    OntologyConceptOverviewPanel,
    OntologyBrowserFilterPanel,
    OntologyConceptPicker,
    OntologySearchInput,
    ConceptModel,
    // Announcements
    AnnouncementRenderType,
    Discussions,
    Thread,
    ThreadBlock,
    ThreadEditor,
    // hooks
    useNotAuthorized,
    useNotFound,
    // SubNavTabsWithContext
    useSubNavTabsContext,
    // BarTender
    BarTenderConfiguration,
    PrintLabelsModal,
    useLabelPrintingContext,
    usePortalRef,
    ExtendedMap,
    FormButtons,
    ModalButtons,
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
export type { ServerContext, ModuleContext } from './internal/components/base/ServerContext';
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
    SystemField,
} from './internal/components/domainproperties/models';
export type { NotificationItemProps } from './internal/components/notifications/model';
export type { NotificationsContextProps } from './internal/components/notifications/NotificationsContext';
export type { VisGraphNode } from './internal/components/lineage/models';
export type { ITab } from './internal/components/navigation/types';
export type {
    EditableColumnMetadata,
    EditableGridLoader,
    EditableGridModels,
    EditorModelProps,
    EditorModelUpdates,
    GridLoader,
    GridResponse,
} from './internal/components/editable/models';
export type { IDataViewInfo } from './internal/DataViewInfo';
export type { InjectedAssayModel, WithAssayModelProps } from './internal/components/assay/withAssayModels';
export type { SearchResultCardData, FieldFilter } from './internal/components/search/models';
export type { SearchHitWithCardData, SearchResultWithCardData } from './internal/components/search/actions';
export type { AssayPickerSelectionModel } from './internal/components/assay/AssayPicker';
export type {
    CrossFolderSelectionResult,
    EntityDataType,
    EntityInputProps,
    IDerivePayload,
    IEntityTypeOption,
    IParentOption,
    EntityChoice,
    DataTypeEntity,
    DisplayObject,
    FilterProps,
} from './internal/components/entities/models';
export type {
    SelectInputChange,
    SelectInputOption,
    SelectInputProps,
} from './internal/components/forms/input/SelectInput';
export type { InjectedPermissionsPage } from './internal/components/permissions/withPermissionsPage';
export type { ISelectInitData } from './internal/components/forms/model';
export type { QuerySelectChange, QuerySelectOwnProps } from './internal/components/forms/QuerySelect';
export type {
    SampleCreationTypeModel,
    SampleStatus,
    SampleGridButtonProps,
    GroupedSampleFields,
    FindField,
    StorageActionStatusCounts,
} from './internal/components/samples/models';
export type { MetricUnitProps } from './internal/components/domainproperties/samples/models';
export type { AppRouteResolver } from './internal/url/models';
export type { WithFormStepsProps } from './internal/components/forms/FormStep';
export type { BulkAddData, SharedEditableGridPanelProps } from './internal/components/editable/EditableGrid';
export type { IImportData, ISelectRowsResult } from './internal/query/api';
export type { Row, RowValue, SelectRowsOptions, SelectRowsResponse } from './internal/query/selectRows';
export type { ServerNotificationState, ProductMenuState, AppReducerState } from './internal/app/reducers';
export type { IAttachment } from './internal/renderers/AttachmentCard';
export type { Field, FormSchema, Option } from './internal/components/AutoForm';
export type { FileSizeLimitProps } from './public/files/models';
export type { UsersLoader } from './internal/components/forms/actions';
export type { LineageGroupingOptions } from './internal/components/lineage/types';
export type {
    AdminAppContext,
    AppContext,
    AssayAppContext,
    ExtendableAppContext,
    SampleTypeAppContext,
} from './internal/AppContext';
export type { WithAdminAppContext } from './internal/components/administration/useAdminAppContext';
export type { ThreadBlockProps } from './internal/announcements/ThreadBlock';
export type { ThreadEditorProps } from './internal/announcements/ThreadEditor';
export type { ContainerUser, UseContainerUser } from './internal/components/container/actions';
export type { PageDetailHeaderProps } from './internal/components/forms/PageDetailHeader';
export type { HorizontalBarData } from './internal/components/chart/HorizontalBarSection';
export type { HorizontalBarLegendData } from './internal/components/chart/utils';
export type { InjectedLineage } from './internal/components/lineage/withLineage';
export type {
    LabelPrintingContext,
    LabelPrintingContextProps,
} from './internal/components/labels/LabelPrintingContextProvider';
export type { SamplesEditableGridProps } from './internal/sampleModels';
export type { MeasurementUnit } from './internal/util/measurement';
export type {
    SampleStorageLocationComponentProps,
    SampleStorageMenuComponentProps,
    SamplesTabbedGridPanelComponentProps,
} from './internal/sampleModels';
export type { SearchHit, SearchMetadata, SearchResult, SearchOptions } from './internal/components/search/actions';
export type { TabbedGridPanelProps } from './public/QueryModel/TabbedGridPanel';
export type { GroupedSampleDisplayColumns } from './internal/components/samples/actions';
export type { PicklistDeletionData } from './internal/components/picklist/actions';
export type { ConfirmModalProps } from './internal/components/base/ConfirmModal';
export type { EditableDetailPanelProps } from './public/QueryModel/EditableDetailPanel';
export type { ComponentsAPIWrapper } from './internal/APIWrapper';
export type { GetParentTypeDataForLineage } from './internal/components/entities/actions';
export type { URLMapper } from './internal/url/URLResolver';
export type { EditableGridEvent } from './internal/components/editable/constants';
export type { EditableGridChange } from './internal/components/editable/EditableGrid';
export type { GetAssayDefinitionsOptions, GetProtocolOptions } from './internal/components/assay/actions';
export type {
    FormsySelectOption,
    FormsyInputProps,
    FormsySelectProps,
    FormsyTextAreaProps,
} from './internal/components/forms/input/FormsyReactComponents';
export type { QueryParams } from './internal/util/URL';
