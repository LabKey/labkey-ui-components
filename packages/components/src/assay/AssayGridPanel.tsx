import { InjectedQueryModels, RequiresModelAndActions, withQueryModels } from '../public/QueryModel/withQueryModels';
import { hasAllPermissions, hasAnyPermissions } from '../internal/components/base/models/User';
import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { Filter, PermissionTypes, Utils } from '@labkey/api';
import { SCHEMAS } from '../internal/schemas';
import { DisableableButton } from '../internal/components/buttons/DisableableButton';
import { AssayImportDataButton, UpdateQCStatesButton } from './AssayButtons';
import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { SelectionMenuItem } from '../internal/components/menus/SelectionMenuItem';
import { MAX_EDITABLE_GRID_ROWS, NO_UPDATES_MESSAGE } from '../internal/constants';
import { MenuItem } from 'react-bootstrap';
import { SampleActionsButton } from '../entities';
import { isAssayQCEnabled, isWorkflowEnabled } from '../internal/app/utils';
import { AssayDefinitionModel, AssayDomainTypes } from '../internal/AssayDefinitionModel';
import { List, Map, OrderedMap } from 'immutable';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { useServerContext } from '../internal/components/base/ServerContext';
import { onAssayRunChange } from './actions';
import { SchemaQuery } from '../public/SchemaQuery';
import { getContainerFilterForLookups, updateRows } from '../internal/query/api';
import { AssayRunDeleteModal } from './AssayRunDeleteModal';
import { AssayResultDeleteModal } from './AssayResultDeleteModal';
import { BulkUpdateForm } from '../internal/components/forms/BulkUpdateForm';
import { EditableGridPanelForUpdate } from '../internal/components/editable/EditableGridPanelForUpdate';
import { EditableGridLoaderFromSelection } from '../internal/components/editable/EditableGridLoaderFromSelection';
import { GridPanel } from '../public/QueryModel/GridPanel';
import { useAssayAppContext } from './AssayAppContext';
import { AssayProtocolModel } from '../internal/components/domainproperties/assay/models';


const ASSAY_RESULT_DELETE_MAX_ROWS = 10000;

interface AssayGridButtonsComponentProps extends RequiresModelAndActions {
    assayDefinition: AssayDefinitionModel,
    canDelete: boolean;
    canUpdate: boolean;
    nounPlural: string;
    onDelete: () => void;
    protocol: AssayProtocolModel;
    queryName: string;
    showBulkUpdate: () => void;
    showImport: boolean;
    toggleEditWithGridUpdate: () => void;
}

// exported for jest testing
export const AssayGridButtons: FC<AssayGridButtonsComponentProps> = memo(props => {
    const {
        actions,
        assayDefinition,
        canDelete,
        canUpdate,
        model,
        nounPlural,
        onDelete,
        protocol,
        queryName,
        showBulkUpdate,
        showImport,
        toggleEditWithGridUpdate,
    } = props;
    const noun = nounPlural || queryName;
    const { moduleContext, user } = useServerContext();

    const showImportBtn = showImport && user.hasInsertPermission();
    const showDeleteBtn = canDelete && user.hasDeletePermission();
    const showEditBtn = canUpdate && user.hasUpdatePermission();
    const showManageBtn = showDeleteBtn && showEditBtn;

    const { qcEnabledForApp, JobsMenuOptionsComponent } = useAssayAppContext();

    const hasSamplePerms = hasAnyPermissions(user, [PermissionTypes.ManageSampleWorkflows, PermissionTypes.ManagePicklists]);
    const showSampleBtn = hasSamplePerms
        && queryName?.localeCompare(SCHEMAS.ASSAY_TABLES.RESULTS_QUERYNAME, 'en-US', {sensitivity:'base'}) === 0
        && model?.displayColumns?.some(c => c.isSampleLookup());
    const showQCButton = (
        qcEnabledForApp
        && protocol?.qcEnabled
        && isAssayQCEnabled(moduleContext)
        && hasAllPermissions(user, [PermissionTypes.QCAnalyst])
    );

    if (!showImportBtn && !showDeleteBtn && !showEditBtn && !showSampleBtn) {
        return null;
    }

    return (
        <div className="responsive-btn-group">
            <div className="btn-group">
                {showImportBtn && <AssayImportDataButton />}
                {!showManageBtn && showDeleteBtn && (
                    <DisableableButton
                        bsStyle="default"
                        onClick={onDelete}
                        disabledMsg={!model.hasSelections ? 'Select one or more ' + nounPlural.toLowerCase() + '.' : undefined}
                    >
                        <span className="fa fa-trash" />
                        <span>&nbsp;Delete</span>
                    </DisableableButton>
                )}
            </div>
            {showManageBtn && (
                <ManageDropdownButton id="assay-rows-grid" title="Edit" className="responsive-menu">
                    {showQCButton && (
                        <RequiresPermission perms={PermissionTypes.QCAnalyst}>
                            <UpdateQCStatesButton
                                model={model}
                                actions={actions}
                                assayContainer={protocol.container}
                                disabled={!model.hasSelections}
                                asMenuItem
                                requireCommentOnQCStateChange={assayDefinition.requireCommentOnQCStateChange}
                            />
                            {(showEditBtn || showDeleteBtn) && <MenuItem divider />}
                        </RequiresPermission>
                    )}
                    <RequiresPermission perms={PermissionTypes.Update}>
                        <SelectionMenuItem
                            id={'assay-item-update-menu-item'}
                            text={'Edit in Grid'}
                            onClick={toggleEditWithGridUpdate}
                            maxSelection={MAX_EDITABLE_GRID_ROWS}
                            queryModel={model}
                            nounPlural={noun.toLowerCase()}
                        />
                        <SelectionMenuItem
                            id={'assay-item-bulk-update-menu-item'}
                            text={'Edit in Bulk'}
                            onClick={showBulkUpdate}
                            queryModel={model}
                            nounPlural={noun.toLowerCase()}
                        />
                    </RequiresPermission>
                    <RequiresPermission perms={PermissionTypes.Delete}>
                        <MenuItem divider />
                        <SelectionMenuItem
                            id={'assay-item-delete-menu-item'}
                            text={'Delete'}
                            onClick={onDelete}
                            queryModel={model}
                            nounPlural={noun.toLowerCase()}
                        />
                    </RequiresPermission>
                </ManageDropdownButton>
            )}
            {showSampleBtn && (
                <SampleActionsButton model={model} user={user} metricFeatureArea="assayResultsSampleButton">
                    {isWorkflowEnabled() && (
                        <>
                            <MenuItem header>Jobs</MenuItem>
                            <JobsMenuOptionsComponent user={user} model={model} isAssay />
                        </>
                    )}
                </SampleActionsButton>
            )}
        </div>
    )
});

interface AssayGridPanelProps  {
    assayDefinition: AssayDefinitionModel
    protocol?: AssayProtocolModel
    queryName: string
    showImport?: boolean
    canDelete?: boolean
    canUpdate?: boolean
    header?: string
    nounSingular?: string
    nounPlural?: string
    filters?: Filter.IFilter[],
    onEditToggle?: (isEditing: boolean) => any
    getIsDirty?: () => boolean
    setIsDirty?: (isDirty: boolean) => void
    requiredColumns?: string[]
}

export const AssayGridBodyImpl: FC<AssayGridPanelProps & InjectedQueryModels> = memo(props => {
    const {
        actions,
        assayDefinition,
        canDelete,
        canUpdate,
        header,
        onEditToggle,
        requiredColumns,
        getIsDirty,
        setIsDirty,
        showImport = true,
        queryModels,
        nounSingular,
        nounPlural,
        protocol,
        queryName,
    } = props;

    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [showBulkUpdate, setShowBulkUpdate] = useState<boolean>(false);
    const [bulkFormUpdates, setBulkFormUpdates] = useState<OrderedMap<string, any>>(undefined);
    const [selectionData, setSelectionData] = useState<Map<string, any>>(undefined);

    const assayModel = useMemo<QueryModel>(() => Object.values(queryModels)[0], [queryModels]);
    const modelId = useMemo(() => assayModel.id, [assayModel]);
    const { createNotification, dismissNotifications} = useNotificationsContext();

    const hideConfirm = useCallback(() => {
        setShowConfirmDelete(false);
    }, []);

    const afterDelete = useCallback(() => {
        hideConfirm();
        onAssayRunChange(assayDefinition.protocolSchemaName);
        actions.loadModel(modelId);
    }, [hideConfirm, assayDefinition, actions, modelId]);

    const onDelete = useCallback(() => {
        if (assayModel.hasSelections) {
            setShowConfirmDelete( true);
        }
    }, [assayModel.hasSelections]);

    const hasValidMaxSelection = useMemo(() => {
        return assayModel.hasSelections && assayModel.selections?.size <= MAX_EDITABLE_GRID_ROWS;
    }, [assayModel.hasSelections, assayModel.selections])

    const onShowBulkUpdate = useCallback(() => {
        if (assayModel.hasSelections) {
            setShowBulkUpdate(true);
            dismissNotifications();
        }
    }, [assayModel.hasSelections, dismissNotifications]);

    const resetState = useCallback(() => {
        setShowConfirmDelete(false);
        setIsEditing(false);
        setShowBulkUpdate(false);
        setBulkFormUpdates(undefined);
        setSelectionData(undefined);
        setIsDirty?.(false);
    }, [setIsDirty]);

    const editSelectionInGrid = useCallback((
        bulkFormUpdates: OrderedMap<string, any>,
        dataForSelection: Map<string, any>,
        dataIdsForSelection: List<any>
    ): Promise<any> => {
        setBulkFormUpdates(bulkFormUpdates);
        return Promise.resolve(dataForSelection);
    }, []);

    const toggleEditWithGridUpdate = useCallback(() => {
        let editingStateChanged = false;

        if (isEditing) {
            resetState();
            editingStateChanged = true;
        } else if (hasValidMaxSelection) {
            dismissNotifications();
            setIsEditing(!isEditing);
            editingStateChanged = true;
        }

        if (editingStateChanged && Utils.isFunction(onEditToggle))
            onEditToggle(!isEditing);
    }, [isEditing, hasValidMaxSelection, onEditToggle]);

    const onBulkUpdateError = useCallback((message: string) => {
        createNotification(message);
    }, [createNotification]);

    const onBulkUpdateComplete = useCallback((data: any, submitForEdit = false) => {
        if (!submitForEdit) {
            actions.loadModel(modelId, true);
        }
        setShowBulkUpdate(false);
        setIsEditing(submitForEdit);
        setSelectionData(submitForEdit ? data : undefined)

        if (Utils.isFunction(onEditToggle))
            onEditToggle(submitForEdit);
    }, [actions, modelId, onEditToggle]);

    const onGridEditComplete = useCallback(() => {
        resetState();
        actions.loadModel(modelId, true);

        if (Utils.isFunction(onEditToggle)) {
            onEditToggle(false);
        }
    }, [actions, modelId, onEditToggle]);

    const onUpdateRows = useCallback((schemaQuery: SchemaQuery, rows: Array<any>) : Promise<void> => {
        if (rows.length === 0) {
            return new Promise((resolve) => {
                createNotification(NO_UPDATES_MESSAGE);
                resolve();
            });
        }
        else {
            const noun = rows.length === 1 ? (nounSingular || queryName) : (nounPlural || queryName);

            return updateRows({
                schemaQuery,
                rows
            }).then((result) => {
                createNotification("Successfully updated " + result.rows.length + " " + noun + ".");
            });
            // note: don't catch here as we want the EditableGridPanelForUpdate to display errors
        }
    }, [nounSingular, queryName, nounPlural]);

    const buttonsComponentProps: AssayGridButtonsComponentProps = {
        actions,
        assayDefinition,
        canDelete,
        canUpdate,
        nounPlural,
        model: assayModel,
        onDelete,
        queryName,
        showBulkUpdate: onShowBulkUpdate,
        showImport,
        toggleEditWithGridUpdate,
        protocol,
    };

    return (
        <>
            {isEditing
                ? <EditableGridPanelForUpdate
                    containerFilter={getContainerFilterForLookups()}
                    queryModel={assayModel}
                    loader={new EditableGridLoaderFromSelection('assay-update-grid', assayModel.queryInfo, bulkFormUpdates, requiredColumns)}
                    selectionData={selectionData}
                    updateRows={onUpdateRows}
                    onCancel={toggleEditWithGridUpdate}
                    onComplete={onGridEditComplete}
                    idField={'RowId'}
                    setIsDirty={setIsDirty}
                    getIsDirty={getIsDirty}
                    singularNoun={(nounSingular || queryName).toLowerCase()}
                    pluralNoun={(nounPlural || queryName).toLowerCase()}
                />
                : <GridPanel
                    actions={actions}
                    ButtonsComponent={AssayGridButtons}
                    buttonsComponentProps={buttonsComponentProps}
                    model={assayModel}
                    title={header}
                />
            }
            {showConfirmDelete && queryName.toLowerCase() === "runs" && (
                <AssayRunDeleteModal
                    selectionKey={modelId}
                    afterDelete={afterDelete}
                    afterDeleteFailure={hideConfirm}
                    onCancel={hideConfirm}
                />
            )}
            {showConfirmDelete && queryName.toLowerCase() === "data" && (
                <AssayResultDeleteModal
                    afterDelete={afterDelete}
                    afterDeleteFailure={hideConfirm}
                    maxToDelete={ASSAY_RESULT_DELETE_MAX_ROWS}
                    onCancel={hideConfirm}
                    schemaQuery={assayModel.queryInfo.schemaQuery}
                    selectedIds={Array.from(assayModel.selections)}
                />
            )}
            {showBulkUpdate && (
                <BulkUpdateForm
                    canSubmitForEdit={hasValidMaxSelection}
                    containerFilter={getContainerFilterForLookups()}
                    itemLabel={assayDefinition.name}
                    onCancel={resetState}
                    onComplete={onBulkUpdateComplete}
                    onError={onBulkUpdateError}
                    onSubmitForEdit={editSelectionInGrid}
                    pluralNoun={(nounPlural || queryName).toLowerCase()}
                    queryInfo={assayModel.queryInfo}
                    requiredColumns={requiredColumns}
                    selectedIds={assayModel.selections}
                    viewName={assayModel.viewName}
                    singularNoun={(nounSingular || queryName).toLowerCase()}
                    sortString={assayModel.sortString}
                    updateRows={onUpdateRows}
                />
            )}
        </>
    )
});

const AssayGridBody = withQueryModels<AssayGridPanelProps>(AssayGridBodyImpl);


export const AssayGridPanel: FC<AssayGridPanelProps> = memo(props => {
    const { assayDefinition, filters, queryName, requiredColumns } = props;
    const { protocolSchemaName } = assayDefinition;
    const id = `${protocolSchemaName}.${queryName}`;
    const hasBatchDomain = assayDefinition.getDomainByType(AssayDomainTypes.BATCH).size > 0; // Issue 39412
    let omittedColumns = [];
    if (!hasBatchDomain) {
        omittedColumns.push('Batch');
    }
    if (!isWorkflowEnabled()) {
        omittedColumns.push('WorkflowTask');
    }
    const queryConfigs = {
        [id]: {
            baseFilters: filters,
            bindURL: true,
            id,
            omittedColumns: omittedColumns.length ? omittedColumns : undefined,
            schemaQuery: SchemaQuery.create(protocolSchemaName, queryName),
            requiredColumns,
            urlPrefix: queryName, // Match LKS data regions
        },
    };
    return <AssayGridBody {...props} autoLoad key={id} queryConfigs={queryConfigs} />;
});
