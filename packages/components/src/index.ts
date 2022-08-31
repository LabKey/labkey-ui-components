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
import { hasAllPermissions, hasAnyPermissions, hasPermissions, User } from './internal/components/base/models/User';
import { GridColumn } from './internal/components/base/models/GridColumn';
import {
    decodePart,
    encodePart,
    getSchemaQuery,
    resolveKey,
    resolveSchemaQuery,
    SchemaQuery,
} from './public/SchemaQuery';
import { insertColumnFilter, QueryColumn, QueryLookup } from './public/QueryColumn';
import { QuerySort } from './public/QuerySort';
import { LastActionStatus, MessageLevel } from './internal/LastActionStatus';
import { InferDomainResponse } from './public/InferDomainResponse';
import {
    getAssayImportNotificationMsg,
    getAssayRunDeleteMessage,
    getServerFilePreview,
    inferDomainFromFile,
} from './internal/components/assay/utils';
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
import {
    getUserProperties,
    getUserRoleDisplay,
    getUserSharedContainerPermissions,
} from './internal/components/user/actions';
import { BeforeUnload } from './internal/util/BeforeUnload';
import {
    deleteErrorMessage,
    deleteSuccessMessage,
    getActionErrorMessage,
    getConfirmDeleteMessage,
    resolveErrorMessage,
} from './internal/util/messaging';
import { WHERE_FILTER_TYPE } from './internal/url/WhereFilterType';
import { AddEntityButton } from './internal/components/buttons/AddEntityButton';
import { RemoveEntityButton } from './internal/components/buttons/RemoveEntityButton';
import { Alert } from './internal/components/base/Alert';
import { DeleteIcon } from './internal/components/base/DeleteIcon';
import { LockIcon } from './internal/components/base/LockIcon';
import { ExpandableFilterToggle } from './internal/components/base/ExpandableFilterToggle';
import { SelectView, SelectViewInput } from './internal/components/base/SelectViewInput';
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
import { APPLICATION_SECURITY_ROLES, SITE_SECURITY_ROLES } from './internal/components/permissions/constants';
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
import { getWebDavFiles, uploadWebDavFile, WebDavFile } from './public/files/WebDav';
import { FileTree } from './internal/components/files/FileTree';
import { Notifications } from './internal/components/notifications/Notifications';
import { getPipelineActivityData, markAllNotificationsAsRead } from './internal/components/notifications/actions';
import {
    NotificationsContextProvider,
    useNotificationsContext,
    withNotificationsContext,
} from './internal/components/notifications/NotificationsContext';
import { ConfirmModal } from './internal/components/base/ConfirmModal';
import { formatDate, formatDateTime, getDateFormat, parseDate, filterDate } from './internal/util/Date';
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
import { DisableableButton } from './internal/components/buttons/DisableableButton';
import { ResponsiveMenuButton } from './internal/components/buttons/ResponsiveMenuButton';
import { ResponsiveMenuButtonGroup } from './internal/components/buttons/ResponsiveMenuButtonGroup';
import { getMenuItemForSectionKey, getMenuItemsForSection } from './internal/components/buttons/utils';
import { Cards } from './internal/components/base/Cards';
import { Footer } from './internal/components/base/Footer';
import { Setting } from './internal/components/base/Setting';
import { ValueList } from './internal/components/base/ValueList';

import { createGridModelId, EditorModel } from './internal/models';
import {
    clearSelected,
    createQueryConfigFilteredBySample,
    getSelected,
    getSelectedData,
    getSelection,
    getSnapshotSelections,
    incrementClientSideMetricCount,
    replaceSelected,
    setSelected,
    setSnapshotSelections,
} from './internal/actions';
import { cancelEvent } from './internal/events';
import { initQueryGridState } from './internal/global';
import {
    deleteRows,
    getContainerFilter,
    getContainerFilterForLookups,
    getQueryDetails,
    importData,
    InsertFormats,
    InsertOptions,
    insertRows,
    InsertRowsResponse,
    invalidateQueryDetailsCache,
    invalidateQueryDetailsCacheKey,
    selectDistinctRows,
    selectRowsDeprecated,
    updateRows,
} from './internal/query/api';
import { registerFilterType } from './internal/query/filter';
import { selectRows } from './internal/query/selectRows';
import { flattenBrowseDataTreeResponse, loadReports } from './internal/query/reports';
import {
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
import { getLocation, pushParameter, replaceParameter, replaceParameters, resetParameters } from './internal/util/URL';
import { ActionMapper, URL_MAPPERS, URLResolver, URLService } from './internal/url/URLResolver';
import { getHelpLink, HELP_LINK_REFERRER, HelpLink, SAMPLE_ALIQUOT_TOPIC } from './internal/util/helpLinks';
import {
    AssayResolver,
    AssayRunResolver,
    ExperimentRunResolver,
    ListResolver,
    SamplesResolver,
} from './internal/url/AppURLResolver';
import { loadEditorModelData } from './internal/components/editable/utils';
import { EditableGridPanel } from './internal/components/editable/EditableGridPanel';
import { EditableGridPanelForUpdate } from './internal/components/editable/EditableGridPanelForUpdate';
import {
    EditableGridPanelForUpdateWithLineage,
    UpdateGridTab,
} from './internal/components/editable/EditableGridPanelForUpdateWithLineage';
import { LineageEditableGridLoaderFromSelection } from './internal/components/editable/LineageEditableGridLoaderFromSelection';

import { EditableGridLoaderFromSelection } from './internal/components/editable/EditableGridLoaderFromSelection';

import { CollapsiblePanel } from './internal/components/CollapsiblePanel';
import { ErrorBoundary } from './internal/components/error/ErrorBoundary';
import { AliasRenderer } from './internal/renderers/AliasRenderer';
import { ANCESTOR_LOOKUP_CONCEPT_URI, AncestorRenderer } from './internal/renderers/AncestorRenderer';
import { StorageStatusRenderer } from './internal/renderers/StorageStatusRenderer';
import { SampleStatusRenderer } from './internal/renderers/SampleStatusRenderer';
import {
    AssayResultTemplateDownloadRenderer,
    SampleTypeTemplateDownloadRenderer,
} from './internal/renderers/TemplateDownloadRenderer';
import { AppendUnits } from './internal/renderers/AppendUnits';
import { AttachmentCard } from './internal/renderers/AttachmentCard';
import { DefaultRenderer } from './internal/renderers/DefaultRenderer';
import { FileColumnRenderer } from './internal/renderers/FileColumnRenderer';
import { MultiValueRenderer } from './internal/renderers/MultiValueRenderer';
import { LabelColorRenderer } from './internal/renderers/LabelColorRenderer';
import {
    ImportAliasRenderer,
    SampleTypeImportAliasRenderer,
    SourceTypeImportAliasRenderer,
} from './internal/renderers/ImportAliasRenderer';
import { BulkUpdateForm } from './internal/components/forms/BulkUpdateForm';
import { LabelOverlay } from './internal/components/forms/LabelOverlay';
import { resolveRenderer } from './internal/components/forms/renderers';
import {
    getQueryFormLabelFieldName,
    isQueryFormLabelField,
    resolveDetailFieldValue,
} from './internal/components/forms/utils';
import { QueryFormInputs } from './internal/components/forms/QueryFormInputs';
import { LookupSelectInput } from './internal/components/forms/input/LookupSelectInput';
import { SelectInput } from './internal/components/forms/input/SelectInput';
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
import { GridAliquotViewSelector } from './internal/components/gridbar/GridAliquotViewSelector';
import { SchemaListing } from './internal/components/listing/SchemaListing';
import { QueriesListing } from './internal/components/listing/QueriesListing';
import { QueriesListingPage } from './internal/components/listing/pages/QueriesListingPage';
import { SchemaListingPage } from './internal/components/listing/pages/SchemaListingPage';
import { HeatMap } from './internal/components/heatmap/HeatMap';
import { addDateRangeFilter, last12Months, monthSort } from './internal/components/heatmap/utils';
import { EntityInsertPanel } from './internal/components/entities/EntityInsertPanel';
import { EntityLineageEditMenuItem } from './internal/components/entities/EntityLineageEditMenuItem';
import { EntityDeleteModal } from './internal/components/entities/EntityDeleteModal';
import { ParentEntityEditPanel } from './internal/components/entities/ParentEntityEditPanel';
import {
    GenerateEntityResponse,
    OperationConfirmationData,
    EntityIdCreationModel,
    EntityParentType,
} from './internal/components/entities/models';
import { FindSamplesByIdsPageBase } from './internal/components/search/FindSamplesByIdsPageBase';
import { SearchScope } from './internal/components/search/constants';
import { SearchResultCard } from './internal/components/search/SearchResultCard';
import { SearchResultsPanel } from './internal/components/search/SearchResultsPanel';
import { SampleFinderSection } from './internal/components/search/SampleFinderSection';
import { FIND_SAMPLE_BY_ID_METRIC_AREA, getSearchScopeFromContainerFilter } from './internal/components/search/utils';
import { ActiveUserLimit } from './internal/components/settings/ActiveUserLimit';
import { NameIdSettings } from './internal/components/settings/NameIdSettings';
import { loadNameExpressionOptions } from './internal/components/settings/actions';
import { AdministrationSubNav } from './internal/components/administration/AdministrationSubNav';
import { UserManagementPage } from './internal/components/administration/UserManagement';
import { BasePermissions } from './internal/components/administration/BasePermissions';
import { showPremiumFeatures } from './internal/components/administration/utils';
import {
    HOSTED_APPLICATION_SECURITY_ROLES,
    SECURITY_ROLE_DESCRIPTIONS,
} from './internal/components/administration/constants';
import { searchUsingIndex } from './internal/components/search/actions';
import { SearchResultsModel } from './internal/components/search/models';
import {
    deleteSampleSet,
    downloadSampleTypeTemplate,
    fetchSamples,
    getDeleteSharedSampleTypeUrl,
    getEditSharedSampleTypeUrl,
    getFieldLookupFromSelection,
    getFindSamplesByIdData,
    getLineageEditorUpdateColumns,
    getOriginalParentsFromLineage,
    getSampleSet,
    getSampleTypeDetails,
    getSampleTypes,
    getSelectionLineageData,
    getUpdatedLineageRows,
} from './internal/components/samples/actions';
import { SampleEmptyAlert, SampleTypeEmptyAlert } from './internal/components/samples/SampleEmptyAlert';
import { SamplesTabbedGridPanel } from './internal/components/samples/SamplesTabbedGridPanel';
import { SampleLineageGraph } from './internal/components/samples/SampleLineageGraph';
import { SamplesAddButton } from './internal/components/samples/SamplesAddButton';
import { SamplesAssayButton } from './internal/components/samples/SamplesAssayButton';
import { SamplesEditButton } from './internal/components/samples/SamplesEditButton';
import { SampleDetailEditing } from './internal/components/samples/SampleDetailEditing';
import { SampleSetSummary } from './internal/components/samples/SampleSetSummary';
import { SampleSetDeleteModal } from './internal/components/samples/SampleSetDeleteModal';
import { CreateSamplesSubMenu } from './internal/components/samples/CreateSamplesSubMenu';
import { SamplesDeriveButtonBase } from './internal/components/samples/SamplesDeriveButtonBase';
import { CreateSamplesSubMenuBase } from './internal/components/samples/CreateSamplesSubMenuBase';
import { SampleCreationTypeModal } from './internal/components/samples/SampleCreationTypeModal';
import { SampleAliquotDetailHeader } from './internal/components/samples/SampleAliquotDetailHeader';
import { SampleAliquotsSummary } from './internal/components/samples/SampleAliquotsSummary';
import { SampleAliquotsGridPanel } from './internal/components/samples/SampleAliquotsGridPanel';
import { SampleActionsButton } from './internal/components/samples/SampleActionsButton';

import { SampleTimelinePageBase } from './internal/components/timeline/SampleTimelinePageBase';

import { AppContextProvider, useAppContext } from './internal/AppContext';
import { AppContexts } from './internal/AppContexts';
import { useContainerUser } from './internal/components/container/actions';

import {
    filterSampleRowsForOperation,
    getFilterForSampleOperation,
    getOmittedSampleTypeColumns,
    getOperationNotPermittedMessage,
    getSampleDeleteMessage,
    getSampleSetMenuItem,
    getSampleStatus,
    getSampleStatusType,
    getSampleTypeTemplateUrl,
    getSampleWizardURL,
    isAllSamplesSchema,
    isSampleOperationPermitted,
    isSamplesSchema,
    SamplesEditButtonSections,
} from './internal/components/samples/utils';
import {
    ALIQUOT_FILTER_MODE,
    SampleAliquotViewSelector,
} from './internal/components/samples/SampleAliquotViewSelector';
import { SampleAssayDetail } from './internal/components/samples/SampleAssayDetail';
import { FindSamplesByIdHeaderPanel } from './internal/components/samples/FindSamplesByIdHeaderPanel';
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
import { AssayPicker, AssayPickerTabs } from './internal/components/assay/AssayPicker';
import { AssayImportSubMenuItem } from './internal/components/assay/AssayImportSubMenuItem';
import { AssayReimportRunButton } from './internal/components/assay/AssayReimportRunButton';
import { AssayStateModel, AssayUploadResultModel } from './internal/components/assay/models';
import {
    allowReimportAssayRun,
    clearAssayDefinitionCache,
    deleteAssayDesign,
    fetchAllAssays,
    GENERAL_ASSAY_PROVIDER_NAME,
    importAssayRun,
    RUN_PROPERTIES_REQUIRED_COLUMNS,
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
import { LineageGrid, LineageGridFromLocation } from './internal/components/lineage/grid/LineageGrid';
import { EntityDeleteConfirmModal } from './internal/components/entities/EntityDeleteConfirmModal';
import { EntityTypeDeleteConfirmModal } from './internal/components/entities/EntityTypeDeleteConfirmModal';
import { SampleTypeLineageCounts } from './internal/components/lineage/SampleTypeLineageCounts';
import { NavigationBar } from './internal/components/navigation/NavigationBar';
import { SEARCH_PLACEHOLDER } from './internal/components/navigation/constants';
import { FindByIdsModal } from './internal/components/search/FindByIdsModal';
import { ProductNavigationMenu } from './internal/components/productnavigation/ProductNavigationMenu';
import { MenuSectionConfig } from './internal/components/navigation/ProductMenuSection';
import { SubNav } from './internal/components/navigation/SubNav';
import { SubNavWithContext, useSubNavContext } from './internal/components/navigation/SubNavWithContext';
import { Breadcrumb } from './internal/components/navigation/Breadcrumb';
import { BreadcrumbCreate } from './internal/components/navigation/BreadcrumbCreate';
import { MenuItemModel, MenuSectionModel, ProductMenuModel } from './internal/components/navigation/model';

import { UserSelectInput } from './internal/components/forms/input/UserSelectInput';
import { UserDetailHeader } from './internal/components/user/UserDetailHeader';
import { UserProfile } from './internal/components/user/UserProfile';
import { ChangePasswordModal } from './internal/components/user/ChangePasswordModal';
import { UsersGridPanel } from './internal/components/user/UsersGridPanel';
import { UserProvider, useUserProperties } from './internal/components/user/UserProvider';
import { UserLink } from './internal/components/user/UserLink';
import { AccountSubNav } from './internal/components/user/AccountSubNav';
import { ProfilePage } from './internal/components/user/ProfilePage';
import {
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    DOMAIN_RANGE_VALIDATOR,
    RANGE_URIS,
    SAMPLE_TYPE_CONCEPT_URI,
} from './internal/components/domainproperties/constants';
import { ExpandableContainer } from './internal/components/ExpandableContainer';
import { PermissionAssignments } from './internal/components/permissions/PermissionAssignments';
import { withPermissionsPage } from './internal/components/permissions/withPermissionsPage';
import { Principal, SecurityPolicy, SecurityRole } from './internal/components/permissions/models';
import { fetchContainerSecurityPolicy, getUserLimitSettings } from './internal/components/permissions/actions';
import {
    extractEntityTypeOptionFromRow,
    getDataDeleteConfirmationData,
    getDataOperationConfirmationData,
    getOperationConfirmationData,
    getSampleOperationConfirmationData,
    getSelectedItemSamples,
} from './internal/components/entities/actions';
import {
    AssayRunDataType,
    DataClassDataType,
    ParentEntityRequiredColumns,
    SampleTypeDataType,
} from './internal/components/entities/constants';
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
import { HorizontalBarSection } from './internal/components/chart/HorizontalBarSection';
import { ItemsLegend } from './internal/components/chart/ItemsLegend';
import { CHART_GROUPS } from './internal/components/chart/configs';
import { AuditDetailsModel, TimelineEventModel } from './internal/components/auditlog/models';
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
} from './internal/components/domainproperties/models';
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
import { DesignerDetailPanel } from './internal/components/domainproperties/DesignerDetailPanel';
import { DomainFieldLabel } from './internal/components/domainproperties/DomainFieldLabel';
import { ValidatorModal } from './internal/components/domainproperties/validation/ValidatorModal';
import { RangeValidationOptions } from './internal/components/domainproperties/validation/RangeValidationOptions';

import { AssayImportPanels } from './internal/components/assay/AssayImportPanels';
import {
    makeQueryInfo,
    mountWithAppServerContext,
    mountWithAppServerContextOptions,
    mountWithServerContext,
    mountWithServerContextOptions,
    sleep,
    waitForLifecycle,
    wrapDraggable,
} from './internal/testHelpers';
import { QueryModel } from './public/QueryModel/QueryModel';
import { withQueryModels } from './public/QueryModel/withQueryModels';
import { GridPanel, GridPanelWithModel } from './public/QueryModel/GridPanel';
import { TabbedGridPanel } from './public/QueryModel/TabbedGridPanel';
import { DetailPanel, DetailPanelWithModel } from './public/QueryModel/DetailPanel';
import { makeTestActions, makeTestQueryModel } from './public/QueryModel/testUtils';
import { QueryDetailPage } from './internal/components/listing/pages/QueryDetailPage';
import { QueryListingPage } from './internal/components/listing/pages/QueryListingPage';
import {
    ACTIVE_JOB_INDICATOR_CLS,
    BACKGROUND_IMPORT_MIN_FILE_SIZE,
    BACKGROUND_IMPORT_MIN_ROW_SIZE,
    DATA_IMPORT_FILE_SIZE_LIMITS,
} from './internal/components/pipeline/constants';
import { PipelineJobDetailPage } from './internal/components/pipeline/PipelineJobDetailPage';
import { PipelineJobsListingPage } from './internal/components/pipeline/PipelineJobsListingPage';
import { PipelineJobsPage } from './internal/components/pipeline/PipelineJobsPage';
import { PipelineSubNav } from './internal/components/pipeline/PipelineSubNav';
import { PipelineStatusDetailPage } from './internal/components/pipeline/PipelineStatusDetailPage';
import { getTitleDisplay, hasActivePipelineJob } from './internal/components/pipeline/utils';
import {
    ALIQUOT_CREATION,
    CHILD_SAMPLE_CREATION,
    DERIVATIVE_CREATION,
    POOLED_SAMPLE_CREATION,
    SampleCreationType,
} from './internal/components/samples/models';
import { DisableableMenuItem } from './internal/components/samples/DisableableMenuItem';
import { SampleStatusTag } from './internal/components/samples/SampleStatusTag';
import { ManageSampleStatusesPanel } from './internal/components/samples/ManageSampleStatusesPanel';
import { SampleTypeInsightsPanel } from './internal/components/samples/SampleTypeInsightsPanel';
import {
    DEFAULT_SAMPLE_FIELD_CONFIG,
    FIND_BY_IDS_QUERY_PARAM,
    IS_ALIQUOT_COL,
    SAMPLE_DATA_EXPORT_CONFIG,
    SAMPLE_EXPORT_CONFIG,
    SAMPLE_ID_FIND_FIELD,
    SAMPLE_INSERT_EXTRA_COLUMNS,
    SAMPLE_INVENTORY_ITEM_SELECTION_KEY,
    SAMPLE_STATE_COLUMN_NAME,
    SAMPLE_STATE_DESCRIPTION_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SAMPLE_STATUS_REQUIRED_COLUMNS,
    SAMPLE_STORAGE_COLUMNS,
    SampleOperation,
    SampleStateType,
    UNIQUE_ID_FIND_FIELD,
} from './internal/components/samples/constants';
import { createMockWithRouteLeave, createMockWithRouterProps } from './internal/mockUtils';
import { ConceptModel } from './internal/components/ontology/models';
import { OntologyConceptPicker } from './internal/components/ontology/OntologyConceptPicker';
import { OntologyBrowserPage } from './internal/components/ontology/OntologyBrowserPanel';
import { OntologyConceptOverviewPanel } from './internal/components/ontology/ConceptOverviewPanel';
import { OntologyBrowserFilterPanel } from './internal/components/ontology/OntologyBrowserFilterPanel';
import { OntologySearchInput } from './internal/components/ontology/OntologyTreeSearchContainer';
import { AppModel, LogoutReason } from './internal/app/models';
import { Picklist, PICKLIST_SAMPLES_FILTER } from './internal/components/picklist/models';
import { PicklistCreationMenuItem } from './internal/components/picklist/PicklistCreationMenuItem';
import { PicklistButton } from './internal/components/picklist/PicklistButton';
import { PicklistListing } from './internal/components/picklist/PicklistListing';
import { PicklistOverview } from './internal/components/picklist/PicklistOverview';
import { PicklistSubNav } from './internal/components/picklist/PicklistSubnav';

import { AddToPicklistMenuItem } from './internal/components/picklist/AddToPicklistMenuItem';
import { RemoveFromPicklistButton } from './internal/components/picklist/RemoveFromPicklistButton';
import { getSelectedPicklistSamples } from './internal/components/picklist/actions';
import { BarTenderSettingsForm } from './internal/components/labels/BarTenderSettingsForm';
import { PrintLabelsModal } from './internal/components/labels/PrintLabelsModal';
import {
    LabelPrintingProviderProps,
    withLabelPrintingContext,
    useLabelPrintingContext,
} from './internal/components/labels/LabelPrintingContextProvider';

import {
    AppReducers,
    ProductMenuReducers,
    RoutingTableReducers,
    ServerNotificationReducers,
} from './internal/app/reducers';

import {
    CloseEventCode,
    getCurrentAppProperties,
    getDateFormat as getAppDateFormat,
    getDateTimeFormat as getAppDateTimeFormat,
    getPrimaryAppProperties,
    getProjectPath,
    hasModule,
    hasPremiumModule,
    isAssayEnabled,
    isBiologicsEnabled,
    isELNEnabled,
    isFreezerManagementEnabled,
    isPremiumProductEnabled,
    isProductProjectsEnabled,
    isProjectContainer,
    isRequestsEnabled,
    isSampleAliquotSelectorEnabled,
    isSampleManagerEnabled,
    isSampleStatusEnabled,
    isWorkflowEnabled,
    registerWebSocketListeners,
    sampleManagerIsPrimaryApp,
    useMenuSectionConfigs,
    userCanDeletePublicPicklists,
    userCanDesignLocations,
    userCanDesignSourceTypes,
    userCanEditStorageData,
    userCanManagePicklists,
    userCanManageSampleWorkflow,
    userCanReadAssays,
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
    setReloadRequired,
    updateUser,
    updateUserDisplayName,
} from './internal/app/actions';
import {
    TEST_USER_APP_ADMIN,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_GUEST,
    TEST_USER_PROJECT_ADMIN,
    TEST_USER_READER,
    TEST_USER_STORAGE_DESIGNER,
    TEST_USER_STORAGE_EDITOR,
} from './internal/userFixtures';
import {
    ASSAY_DESIGN_KEY,
    ASSAYS_KEY,
    BIOLOGICS_APP_PROPERTIES,
    BOXES_KEY,
    ELN_KEY,
    EXPERIMENTAL_REQUESTS_MENU,
    FIND_SAMPLES_BY_FILTER_HREF,
    FIND_SAMPLES_BY_FILTER_KEY,
    FIND_SAMPLES_BY_ID_HREF,
    FIND_SAMPLES_BY_ID_KEY,
    FREEZER_MANAGER_APP_PROPERTIES,
    FREEZERS_KEY,
    HOME_KEY,
    MEDIA_KEY,
    MINE_KEY,
    NEW_ASSAY_DESIGN_HREF,
    NEW_SAMPLE_TYPE_HREF,
    NEW_SAMPLES_HREF,
    NEW_SOURCE_TYPE_HREF,
    NOTIFICATION_TIMEOUT,
    PICKLIST_HOME_HREF,
    PICKLIST_KEY,
    REGISTRY_KEY,
    SAMPLE_MANAGER_APP_PROPERTIES,
    SAMPLE_TYPE_KEY,
    SAMPLES_KEY,
    SEARCH_KEY,
    SECURITY_LOGOUT,
    SECURITY_SERVER_UNAVAILABLE,
    SECURITY_SESSION_TIMEOUT,
    SERVER_NOTIFICATION_MAX_ROWS,
    SET_RELOAD_REQUIRED,
    SOURCE_TYPE_KEY,
    SOURCES_KEY,
    STICKY_HEADER_HEIGHT,
    TEAM_KEY,
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
import { UserAvatar, UserAvatars } from './internal/components/UserAvatars';
import { AnnouncementRenderType } from './internal/announcements/model';
import { Discussions } from './internal/announcements/Discussions';
import { Thread } from './internal/announcements/Thread';
import { ThreadBlock } from './internal/announcements/ThreadBlock';
import { ThreadEditor } from './internal/announcements/ThreadEditor';
import { useNotAuthorized, useNotFound } from './internal/hooks';
import {
    TEST_LKS_STARTER_MODULE_CONTEXT,
    TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
    TEST_LKSM_STARTER_MODULE_CONTEXT,
} from './test/data/constants';

// See Immer docs for why we do this: https://immerjs.github.io/immer/docs/installation#pick-your-immer-version
enableMapSet();
enablePatches();

const App = {
    AppReducers,
    ProductMenuReducers,
    RoutingTableReducers,
    ServerNotificationReducers,
    CloseEventCode,
    getCurrentAppProperties,
    registerWebSocketListeners,
    isAssayEnabled,
    isWorkflowEnabled,
    isELNEnabled,
    isFreezerManagementEnabled,
    isRequestsEnabled,
    isSampleManagerEnabled,
    isBiologicsEnabled,
    isPremiumProductEnabled,
    isSampleAliquotSelectorEnabled,
    isProjectContainer,
    sampleManagerIsPrimaryApp,
    isSampleStatusEnabled,
    isProductProjectsEnabled,
    getPrimaryAppProperties,
    getProjectPath,
    hasPremiumModule,
    hasModule,
    getDateFormat: getAppDateFormat,
    getDateTimeFormat: getAppDateTimeFormat,
    useMenuSectionConfigs,
    menuInit,
    menuInvalidate,
    menuReload,
    serverNotificationInit,
    serverNotificationInvalidate,
    setReloadRequired,
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
    userCanReadRegistry,
    userCanReadSources,
    userCanDeletePublicPicklists,
    SECURITY_LOGOUT,
    SECURITY_SERVER_UNAVAILABLE,
    SECURITY_SESSION_TIMEOUT,
    SET_RELOAD_REQUIRED,
    UPDATE_USER,
    UPDATE_USER_DISPLAY_NAME,
    BIOLOGICS: BIOLOGICS_APP_PROPERTIES,
    SAMPLE_MANAGER: SAMPLE_MANAGER_APP_PROPERTIES,
    FREEZER_MANAGER: FREEZER_MANAGER_APP_PROPERTIES,
    ASSAYS_KEY,
    ASSAY_DESIGN_KEY,
    EXPERIMENTAL_REQUESTS_MENU,
    FIND_SAMPLES_BY_ID_KEY,
    FIND_SAMPLES_BY_FILTER_KEY,
    PICKLIST_KEY,
    MINE_KEY,
    TEAM_KEY,
    SAMPLES_KEY,
    SAMPLE_TYPE_KEY,
    SEARCH_KEY,
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
    FIND_SAMPLES_BY_FILTER_HREF,
    FIND_SAMPLES_BY_ID_HREF,
    PICKLIST_HOME_HREF,
    WORKFLOW_HOME_HREF,
    NOTIFICATION_TIMEOUT,
    STICKY_HEADER_HEIGHT,
    SERVER_NOTIFICATION_MAX_ROWS,
    TEST_USER_GUEST,
    TEST_USER_READER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_PROJECT_ADMIN,
    TEST_USER_APP_ADMIN,
    TEST_USER_STORAGE_DESIGNER,
    TEST_USER_STORAGE_EDITOR,
    TEST_LKS_STARTER_MODULE_CONTEXT,
    TEST_LKSM_STARTER_MODULE_CONTEXT,
    TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
    MEDIA_KEY,
    REGISTRY_KEY,
    ELN_KEY,
};

const Hooks = {
    useAppContext,
    useContainerUser,
    useEnterEscape,
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
    LogoutReason,
    // global state functions
    initQueryGridState,
    getContainerFilter,
    getContainerFilterForLookups,
    createGridModelId,
    clearSelected,
    // grid functions
    getSnapshotSelections,
    getSelected,
    getSelectedData,
    getSelection,
    getQueryModelExportParams,
    replaceSelected,
    setSelected,
    setSnapshotSelections,
    // query related items
    InsertRowsResponse,
    InsertFormats,
    InsertOptions,
    insertRows,
    selectDistinctRows,
    selectRows,
    selectRowsDeprecated,
    updateRows,
    deleteRows,
    importData,
    getQueryDetails,
    invalidateQueryDetailsCache,
    invalidateQueryDetailsCacheKey,
    registerFilterType,
    // editable grid related items
    loadEditorModelData,
    MAX_EDITABLE_GRID_ROWS,
    EditableGridLoaderFromSelection,
    EditableGridPanel,
    EditableGridPanelForUpdate,
    EditableGridPanelForUpdateWithLineage,
    LineageEditableGridLoaderFromSelection,
    UpdateGridTab,
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
    ExperimentRunResolver,
    getLocation,
    pushParameter,
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
    ANCESTOR_LOOKUP_CONCEPT_URI,
    AncestorRenderer,
    AppendUnits,
    AssayResultTemplateDownloadRenderer,
    DefaultRenderer,
    FileColumnRenderer,
    LabelColorRenderer,
    MultiValueRenderer,
    StorageStatusRenderer,
    SampleStatusRenderer,
    SampleTypeTemplateDownloadRenderer,
    ImportAliasRenderer,
    SampleTypeImportAliasRenderer,
    SourceTypeImportAliasRenderer,
    resolveDetailRenderer,
    resolveRenderer,
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
    getUsersWithPermissions,
    useUsersWithPermissions,
    getUserProperties,
    getUserRoleDisplay,
    getUserSharedContainerPermissions,
    UserDetailHeader,
    UserProfile,
    UserLink,
    AccountSubNav,
    ProfilePage,
    ChangePasswordModal,
    UsersGridPanel,
    InsufficientPermissionsAlert,
    InsufficientPermissionsPage,
    APPLICATION_SECURITY_ROLES,
    SITE_SECURITY_ROLES,
    BasePermissionsCheckPage,
    RequiresPermission,
    hasAllPermissions,
    hasAnyPermissions,
    hasPermissions,
    fetchContainerSecurityPolicy,
    getUserLimitSettings,
    PermissionAssignments,
    withPermissionsPage,
    SecurityPolicy,
    SecurityRole,
    Principal,
    UserProvider,
    useUserProperties,
    // sample picklist items
    AddToPicklistMenuItem,
    RemoveFromPicklistButton,
    PicklistButton,
    PicklistCreationMenuItem,
    Picklist,
    PicklistListing,
    PicklistOverview,
    PicklistSubNav,
    getSelectedPicklistSamples,
    PICKLIST_SAMPLES_FILTER,
    // data class and sample type related items
    DataClassModel,
    deleteDataClass,
    fetchDataClass,
    filterSampleRowsForOperation,
    isSampleOperationPermitted,
    isSamplesSchema,
    isAllSamplesSchema,
    getSampleSetMenuItem,
    getFilterForSampleOperation,
    getSampleDeleteMessage,
    getSampleStatus,
    getSampleStatusType,
    getSampleTypeTemplateUrl,
    getSampleWizardURL,
    downloadSampleTypeTemplate,
    DisableableMenuItem,
    SampleOperation,
    SampleStateType,
    SampleStatusTag,
    SAMPLE_STATE_COLUMN_NAME,
    SAMPLE_STATE_TYPE_COLUMN_NAME,
    SAMPLE_STATE_DESCRIPTION_COLUMN_NAME,
    SAMPLE_STATUS_REQUIRED_COLUMNS,
    SAMPLE_STORAGE_COLUMNS,
    FIND_BY_IDS_QUERY_PARAM,
    UNIQUE_ID_FIND_FIELD,
    SAMPLE_DATA_EXPORT_CONFIG,
    SAMPLE_EXPORT_CONFIG,
    SAMPLE_ID_FIND_FIELD,
    SAMPLE_INSERT_EXTRA_COLUMNS,
    IS_ALIQUOT_COL,
    SampleTypeModel,
    deleteSampleSet,
    fetchSamples,
    getSampleSet,
    getSampleTypeDetails,
    createQueryConfigFilteredBySample,
    getFieldLookupFromSelection,
    getSelectedItemSamples,
    getSelectionLineageData,
    getUpdatedLineageRows,
    getOriginalParentsFromLineage,
    getLineageEditorUpdateColumns,
    getSampleTypes,
    FindSamplesByIdHeaderPanel,
    getEditSharedSampleTypeUrl,
    getDeleteSharedSampleTypeUrl,
    SampleTypeDataType,
    DataClassDataType,
    AssayRunDataType,
    ParentEntityRequiredColumns,
    SampleEmptyAlert,
    SampleTypeEmptyAlert,
    SampleSetSummary,
    SampleCreationType,
    SampleSetDeleteModal,
    SampleActionsButton,
    SamplesAddButton,
    SamplesAssayButton,
    SamplesEditButton,
    SamplesEditButtonSections,
    SamplesTabbedGridPanel,
    SampleLineageGraph,
    SampleDetailEditing,
    SampleCreationTypeModal,
    CreateSamplesSubMenuBase,
    CreateSamplesSubMenu,
    SamplesDeriveButtonBase,
    SampleAliquotDetailHeader,
    SampleAliquotViewSelector,
    GridAliquotViewSelector,
    SampleAliquotsSummary,
    ALIQUOT_FILTER_MODE,
    SampleAssayDetail,
    SampleAliquotsGridPanel,
    CHILD_SAMPLE_CREATION,
    DERIVATIVE_CREATION,
    POOLED_SAMPLE_CREATION,
    ALIQUOT_CREATION,
    SAMPLE_INVENTORY_ITEM_SELECTION_KEY,
    getFindSamplesByIdData,
    getOmittedSampleTypeColumns,
    getOperationNotPermittedMessage,
    ManageSampleStatusesPanel,
    SampleTypeInsightsPanel,
    // timeline
    SampleTimelinePageBase,
    // entities
    EntityTypeDeleteConfirmModal,
    EntityDeleteConfirmModal,
    EntityDeleteModal,
    EntityInsertPanel,
    EntityLineageEditMenuItem,
    ParentEntityEditPanel,
    extractEntityTypeOptionFromRow,
    GenerateEntityResponse,
    EntityIdCreationModel,
    EntityParentType,
    OperationConfirmationData,
    AddEntityButton,
    RemoveEntityButton,
    getSampleOperationConfirmationData,
    getDataOperationConfirmationData,
    getDataDeleteConfirmationData,
    getOperationConfirmationData,
    createEntityParentKey,
    getUniqueIdColumnMetadata,
    // search related items
    FIND_SAMPLE_BY_ID_METRIC_AREA,
    FindSamplesByIdsPageBase,
    SearchResultsModel,
    SearchResultCard,
    SearchResultsPanel,
    searchUsingIndex,
    SampleFinderSection,
    SearchScope,
    getSearchScopeFromContainerFilter,
    // settings
    ActiveUserLimit,
    NameIdSettings,
    loadNameExpressionOptions,
    // administration
    AdministrationSubNav,
    UserManagementPage,
    BasePermissions,
    SECURITY_ROLE_DESCRIPTIONS,
    HOSTED_APPLICATION_SECURITY_ROLES,
    showPremiumFeatures,
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
    withAssayModels,
    withAssayModelsFromLocation,
    AssayContextConsumer,
    AssayImportSubMenuItem,
    AssayReimportRunButton,
    importAssayRun,
    deleteAssayDesign,
    AssayDefinitionModel,
    AssayDomainTypes,
    AssayLink,
    allowReimportAssayRun,
    clearAssayDefinitionCache,
    fetchAllAssays,
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
    LineageURLResolvers,
    SampleTypeLineageCounts,
    invalidateLineageResults,
    getImmediateChildLineageFilterValue,
    getLineageFilterValue,
    withLineage,
    // Navigation
    MenuSectionConfig,
    ProductMenuModel,
    MenuSectionModel,
    MenuItemModel,
    NavigationBar,
    SEARCH_PLACEHOLDER,
    ProductNavigationMenu,
    FindByIdsModal,
    SubNav,
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
    DomainFieldsDisplay,
    fetchDomain,
    fetchDomainDetails,
    saveDomain,
    createFormInputId,
    setDomainFields,
    DomainDesign,
    DomainField,
    DesignerDetailPanel,
    DomainFieldLabel,
    ValidatorModal,
    RangeValidationOptions,
    PropertyValidator,
    DOMAIN_RANGE_VALIDATOR,
    DomainDetails,
    inferDomainFromFile,
    getAssayRunDeleteMessage,
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
    // util functions
    getDateFormat,
    getDisambiguatedSelectInputOptions,
    filterDate,
    formatDate,
    formatDateTime,
    parseDate,
    blurActiveElement,
    caseInsensitive,
    capitalizeFirstChar,
    uncapitalizeFirstChar,
    withTransformedKeys,
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
    SAMPLE_ALIQUOT_TOPIC,
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
    ContentGroup,
    ContentGroupLabel,
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
    SelectView,
    SelectViewInput,
    Setting,
    ValueList,
    // base models, enums, constants
    Container,
    User,
    AppContextProvider,
    useAppContext,
    AppContexts,
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
    hasActivePipelineJob,
    getTitleDisplay,
    PipelineJobDetailPage,
    PipelineJobsListingPage,
    PipelineSubNav,
    BACKGROUND_IMPORT_MIN_FILE_SIZE,
    BACKGROUND_IMPORT_MIN_ROW_SIZE,
    DATA_IMPORT_FILE_SIZE_LIMITS,
    ACTIVE_JOB_INDICATOR_CLS,
    getAssayImportNotificationMsg,
    // Test Helpers
    sleep,
    createMockWithRouteLeave,
    createMockWithRouterProps,
    makeQueryInfo,
    mountWithAppServerContextOptions,
    mountWithServerContextOptions,
    mountWithAppServerContext,
    mountWithServerContext,
    waitForLifecycle,
    wrapDraggable,
    // Ontology
    OntologyBrowserPage,
    OntologyConceptOverviewPanel,
    OntologyBrowserFilterPanel,
    OntologyConceptPicker,
    OntologySearchInput,
    ConceptModel,
    // UserAvatars
    UserAvatar,
    UserAvatars,
    // Announcements
    AnnouncementRenderType,
    Discussions,
    Thread,
    ThreadBlock,
    ThreadEditor,
    // hooks
    useNotAuthorized,
    useNotFound,
    // SubNavWithContext
    useSubNavContext,
    SubNavWithContext,
    // BarTender
    BarTenderSettingsForm,
    PrintLabelsModal,
    withLabelPrintingContext,
    useLabelPrintingContext,
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
export type { NotificationItemProps } from './internal/components/notifications/model';
export type { NotificationsContextProps } from './internal/components/notifications/NotificationsContext';
export type { VisGraphNode } from './internal/components/lineage/vis/VisGraphGenerator';
export type { ITab } from './internal/components/navigation/SubNav';
export type { IDataViewInfo, EditorModelProps, IGridLoader, IGridResponse } from './internal/models';
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
    EntityChoice,
} from './internal/components/entities/models';
export type { SelectInputOption, SelectInputProps } from './internal/components/forms/input/SelectInput';
export type { InjectedPermissionsPage } from './internal/components/permissions/withPermissionsPage';
export type { ISelectInitData } from './internal/components/forms/model';
export type { QuerySelectOwnProps } from './internal/components/forms/QuerySelect';
export type {
    SampleCreationTypeModel,
    GroupedSampleFields,
    SamplesSelectionProviderProps,
    SamplesSelectionResultProps,
    SampleStatus,
    SampleGridButtonProps,
} from './internal/components/samples/models';
export type { MetricUnitProps } from './internal/components/domainproperties/samples/models';
export type { AppRouteResolver } from './internal/url/models';
export type { WithFormStepsProps } from './internal/components/forms/FormStep';
export type { BulkAddData, EditableColumnMetadata } from './internal/components/editable/EditableGrid';
export type { IImportData, ISelectRowsResult } from './internal/query/api';
export type { Row, RowValue, SelectRowsOptions, SelectRowsResponse } from './internal/query/selectRows';
export type { Location } from './internal/util/URL';
export type {
    RoutingTableState,
    ServerNotificationState,
    ProductMenuState,
    AppReducerState,
} from './internal/app/reducers';
export type { IAttachment } from './internal/renderers/AttachmentCard';
export type { Field, FormSchema, Option } from './internal/components/AutoForm';
export type { FileSizeLimitProps } from './public/files/models';
export type { FindField } from './internal/components/samples/models';
export type { UsersLoader } from './internal/components/forms/actions';
export type { LineageGroupingOptions } from './internal/components/lineage/types';
export type { AnnouncementModel, ThreadActions } from './internal/announcements/model';
export type { AnnouncementsAPIWrapper } from './internal/announcements/APIWrapper';
export type { AppContext, ExtendableAppContext } from './internal/AppContext';
export type { ThreadBlockProps } from './internal/announcements/ThreadBlock';
export type { ThreadEditorProps } from './internal/announcements/ThreadEditor';
export type { SamplesEditableGridProps } from './internal/components/samples/SamplesEditableGrid';
export type { ContainerUser, UseContainerUser } from './internal/components/container/actions';
export type { PageDetailHeaderProps } from './internal/components/forms/PageDetailHeader';
export type { HorizontalBarData } from './internal/components/chart/HorizontalBarSection';
export type { HorizontalBarLegendData } from './internal/components/chart/utils';
export type { InjectedLineage } from './internal/components/lineage/withLineage';
export type { EditableGridPanelForUpdateWithLineageProps } from './internal/components/editable/EditableGridPanelForUpdateWithLineage';
export type { LabelPrintingProviderProps } from './internal/components/labels/LabelPrintingContextProvider';
