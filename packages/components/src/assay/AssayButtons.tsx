import { PermissionTypes } from '@labkey/api';
import React, { FC, memo, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Button, MenuItem } from 'react-bootstrap';

import { List, Map } from 'immutable';

import { RequiresPermission } from '../internal/components/base/Permissions';
import { AppURL, buildURL } from '../internal/url/AppURL';
import { AssayContext, AssayContextConsumer } from '../internal/components/assay/withAssayModels';
import { isAssayDesignExportEnabled, isELNEnabled } from '../internal/app/utils';
import { getOperationConfirmationData } from '../internal/components/entities/actions';
import { AssayRunDataType } from '../internal/components/entities/constants';

import { ASSAY_DESIGN_KEY, ASSAYS_KEY, AUDIT_KEY } from '../internal/app/constants';
import { CreatedModified } from '../internal/components/base/CreatedModified';
import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';

import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { clearAssayDefinitionCache } from '../internal/components/assay/actions';
import { ASSAY_AUDIT_QUERY } from '../internal/components/auditlog/constants';

import { RequiresModelAndActions } from '../public/QueryModel/withQueryModels';

import { AssayRunDeleteModal } from './AssayRunDeleteModal';
import { getAssayRunDeleteMessage } from './utils';
import { AssayReimportRunButton } from './AssayReimportRunButton';
import { onAssayDesignChange, onAssayRunChange, updateQCState } from './actions';
import { AssayDesignDeleteModal } from './AssayDesignDeleteModal';
import { AssayQCModal, AssayQCState } from './AssayQCModal';

export const AssayExportDesignButton: FC<any> = () => (
    <RequiresPermission perms={PermissionTypes.ReadAssay}>
        <AssayContextConsumer>
            {({ assayDefinition }) => (
                <MenuItem
                    href={buildURL(
                        'experiment',
                        'exportProtocols',
                        {
                            protocolId: assayDefinition.id,
                            xarFileName: assayDefinition.name + '.xar',
                        },
                        { container: assayDefinition.containerPath }
                    )}
                >
                    Export Assay Design
                </MenuItem>
            )}
        </AssayContextConsumer>
    </RequiresPermission>
);

interface AssayDeleteBatchButtonProps {
    batchId: string;
}

export const AssayDeleteBatchButton: FC<AssayDeleteBatchButtonProps> = props => (
    <RequiresPermission perms={[PermissionTypes.Delete]}>
        <AssayContextConsumer>
            {({ assayDefinition, assayProtocol }) => {
                const { batchId } = props;

                if (batchId !== undefined) {
                    const provider = assayDefinition.type;
                    const protocol = assayProtocol.name;

                    const url = buildURL(
                        'experiment',
                        'deleteSelectedExperiments',
                        {
                            singleObjectRowId: batchId,
                        },
                        {
                            cancelUrl: AppURL.create('assays', provider, protocol, 'batches', batchId),
                            returnUrl: false,
                            successUrl: AppURL.create('assays', provider, protocol, 'batches'),
                        }
                    );

                    return <MenuItem href={url}>Delete Batch</MenuItem>;
                }

                return null;
            }}
        </AssayContextConsumer>
    </RequiresPermission>
);

interface AssayRunDetailHeaderButtonProps {
    allowDelete?: boolean;
    allowReimport?: boolean;
    model: QueryModel;
    navigate: (url: string | AppURL, replace?: boolean) => void;
    runId: string;
}

export const AssayRunDetailHeaderButtons: FC<AssayRunDetailHeaderButtonProps> = memo(props => {
    const { navigate, model, runId, allowReimport, allowDelete } = props;
    const { assayDefinition, assayProtocol } = useContext(AssayContext);
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
    const [canDelete, setCanDelete] = useState<boolean>(false);
    const [confirmationDataError, setConfirmationDataError] = useState<boolean>(false);

    const runData = useMemo(() => {
        return model.getRow();
    }, [model]);

    useEffect((): void => {
        if (isELNEnabled()) {
            // we prevent deletion of assay runs that are referenced in ELNs.
            (async () => {
                try {
                    const confirmationData = await getOperationConfirmationData(undefined, AssayRunDataType, [runId]);
                    setCanDelete(confirmationData.allowed.length === 1);
                } catch (e) {
                    console.error('There was a problem retrieving the delete confirmation data.', e);
                    setCanDelete(false);
                    setConfirmationDataError(true);
                }
            })();
        } else {
            setCanDelete(true);
        }
    }, [runId]);

    const onDeleteRun = useCallback(() => {
        setShowConfirmDelete(true);
    }, []);

    const afterDelete = useCallback(() => {
        onAssayRunChange(assayDefinition?.protocolSchemaName);
        navigate(AppURL.create(ASSAYS_KEY, assayProtocol.providerName, assayProtocol.name));
    }, [assayDefinition?.protocolSchemaName, assayProtocol.name, assayProtocol.providerName, navigate]);

    const hideConfirm = useCallback(() => {
        setShowConfirmDelete(false);
    }, []);

    return (
        <>
            <CreatedModified row={runData} />
            {(allowReimport || allowDelete) && (
                <ManageDropdownButton id="assay-run-details" pullRight collapsed>
                    {allowReimport && (
                        <AssayReimportRunButton runId={runId} replacedByRunId={runData?.ReplacedByRun?.value} />
                    )}
                    {allowDelete && (
                        <DisableableMenuItem
                            operationPermitted={canDelete}
                            onClick={onDeleteRun}
                            disabledMessage={getAssayRunDeleteMessage(canDelete, confirmationDataError)}
                        >
                            Delete Run
                        </DisableableMenuItem>
                    )}
                </ManageDropdownButton>
            )}
            {showConfirmDelete && (
                <AssayRunDeleteModal
                    afterDelete={afterDelete}
                    afterDeleteFailure={hideConfirm}
                    onCancel={hideConfirm}
                    selectedRowId={runId}
                />
            )}
        </>
    );
});

export const AssayImportDataButton: FC = () => (
    <RequiresPermission perms={PermissionTypes.Insert}>
        <AssayContextConsumer>
            {({ assayDefinition }) => {
                if (!assayDefinition) {
                    return null;
                }

                let importUrl = assayDefinition.getImportUrl();

                if (assayDefinition.importAction !== 'uploadWizard') {
                    importUrl += '&returnUrl=' + (window.location.pathname + assayDefinition.getRunsUrl().toHref());
                }

                return (
                    <Button bsStyle="success" href={importUrl}>
                        Import Data
                    </Button>
                );
            }}
        </AssayContextConsumer>
    </RequiresPermission>
);

interface AssayBatchHeaderButtonsProps {
    batchId: string;
    model: QueryModel;
}

export const AssayBatchHeaderButtons: FC<AssayBatchHeaderButtonsProps> = props => {
    const { batchId, model } = props;

    return (
        <>
            <CreatedModified row={model.getRow()} />
            <RequiresPermission perms={PermissionTypes.Delete}>
                <ManageDropdownButton id="assaybatchdetails" pullRight collapsed>
                    <AssayDeleteBatchButton batchId={batchId} />
                </ManageDropdownButton>
            </RequiresPermission>
        </>
    );
};

interface AssayDesignHeaderButtonProps {
    menuInit: (invalidate?: boolean) => void;
    navigate: (url: string | AppURL, replace?: boolean) => void;
}

export const AssayDesignHeaderButtons: FC<AssayDesignHeaderButtonProps> = props => {
    const { assayDefinition, assayProtocol } = useContext(AssayContext);
    const { navigate, menuInit } = props;
    const [showConfirmDeleteAssayDesign, setShowConfirmDeleteAssayDesign] = useState<boolean>(false);

    const resetState = useCallback(() => {
        setShowConfirmDeleteAssayDesign(false);
    }, []);

    const onDeleteAssayDesign = useCallback(() => {
        setShowConfirmDeleteAssayDesign(true);
    }, []);

    const beforeAssayDesignDelete = useCallback(() => {
        onAssayDesignChange(assayDefinition.protocolSchemaName);
    }, [assayDefinition?.protocolSchemaName]);

    const afterAssayDesignDelete = useCallback(
        (success: boolean) => {
            if (success) {
                menuInit();
                clearAssayDefinitionCache();
                navigate(AppURL.create(ASSAYS_KEY));
            } else {
                // delay to make sure grid invalidate form beforeAssayDesignDelete is finished
                window.setTimeout(resetState, 100);
            }
        },
        [menuInit, navigate]
    );

    if (!assayDefinition || !assayProtocol) return null;

    return (
        <>
            <RequiresPermission
                permissionCheck="any"
                perms={[PermissionTypes.ReadAssay, PermissionTypes.DesignAssay, PermissionTypes.CanSeeAuditLog]}
            >
                <ManageDropdownButton id="assayheader" pullRight collapsed>
                    <RequiresPermission perms={PermissionTypes.DesignAssay}>
                        <MenuItem
                            href={AppURL.create(ASSAY_DESIGN_KEY, assayDefinition.type, assayDefinition.name).toHref()}
                        >
                            Edit Assay Design
                        </MenuItem>
                    </RequiresPermission>
                    <RequiresPermission perms={PermissionTypes.DesignAssay}>
                        <MenuItem
                            href={AppURL.create(
                                ASSAY_DESIGN_KEY,
                                assayProtocol.providerName,
                                assayProtocol.name,
                                'copy'
                            ).toHref()}
                        >
                            Copy Assay Design
                        </MenuItem>
                    </RequiresPermission>
                    {isAssayDesignExportEnabled() && <AssayExportDesignButton />}
                    <RequiresPermission perms={PermissionTypes.DesignAssay}>
                        <MenuItem onClick={onDeleteAssayDesign}>Delete Assay Design</MenuItem>
                    </RequiresPermission>
                    <RequiresPermission perms={PermissionTypes.CanSeeAuditLog}>
                        <MenuItem
                            href={AppURL.create(AUDIT_KEY)
                                .addParams({
                                    eventType: ASSAY_AUDIT_QUERY.value,
                                    'query.q': assayDefinition.name,
                                })
                                .toHref()}
                        >
                            View Audit History
                        </MenuItem>
                    </RequiresPermission>
                </ManageDropdownButton>
            </RequiresPermission>
            {showConfirmDeleteAssayDesign && (
                <AssayDesignDeleteModal
                    assay={assayDefinition}
                    beforeDelete={beforeAssayDesignDelete}
                    afterDelete={afterAssayDesignDelete}
                    onCancel={resetState}
                />
            )}
        </>
    );
};

interface UpdateQCStatesButtonProps extends RequiresModelAndActions {
    asMenuItem?: boolean;
    assayContainer: string;
    disabled?: boolean;
    onQCStateUpdate?: () => void;
    requireCommentOnQCStateChange?: boolean;
    run?: Map<string, any>;
}

export const UpdateQCStatesButton: FC<UpdateQCStatesButtonProps> = props => {
    const {
        assayContainer,
        requireCommentOnQCStateChange,
        onQCStateUpdate,
        run,
        asMenuItem,
        disabled,
        model,
        actions,
    } = props;

    const [showQCModal, setShowQCModal] = useState<boolean>(false);
    const [runs, setRuns] = useState<string[]>(null);
    const [visibleRuns, setVisibleRuns] = useState<List<Map<string, any>>>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>(null);
    const modelId = model.id;

    useEffect(() => {
        if (run) {
            setRuns([run.getIn(['RowId', 'value'])]);
            setVisibleRuns(List<Map<string, any>>([run]));
        } else {
            if (model.isLoading) return;

            if (model?.selections?.size > 0) {
                const _visibleRuns = [...model.selections].reduce((result, value) => {
                    const row = model.gridData.find(el => el.RowId.value == value);

                    // Conversion to record for handling in Grid in AssayQCForm
                    const rowRecord = {};
                    for (const [rowKey, rowValue] of Object.entries(row)) {
                        if (rowValue) {
                            rowRecord[rowKey] = rowValue.displayValue ?? rowValue.value;
                        }
                    }

                    // runsDataModel.data only has the rows currently visible on the grid, so not all of the selectedIds
                    // will be in it.
                    if (row) {
                        return result.push(Map<string, any>(rowRecord));
                    }

                    return result;
                }, List<Map<string, any>>());

                setRuns([...model.selections]);
                setVisibleRuns(_visibleRuns);
            }
        }
    }, [model.isLoading, model.selections, model.orderedRows, run]); // gridData relies on orderedRow

    const openQCModal = useCallback(() => {
        setShowQCModal(true);
    }, []);

    // Here we check if we should actually hook onClick because Bootstrap MenuItems are anchor tags so they
    // do not prevent click handlers from being executed even if we set them to disabled.
    const onClickHandler = useMemo(() => (disabled ? undefined : openQCModal), [disabled]);

    const closeQCModal = useCallback(() => {
        setShowQCModal(false);
        setRuns(null);
        setVisibleRuns(null);
        setLoading(false);
        setError(null);
    }, []);

    const updateQCStateValues = useCallback(
        async (formValues: AssayQCState) => {
            setLoading(true);

            try {
                await updateQCState({ ...formValues, runs });
                setLoading(false);
                closeQCModal();
                actions.clearSelections(modelId);
                actions.loadModel(modelId);
                onQCStateUpdate?.();
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        },
        [actions, runs]
    );

    let button: ReactNode;
    const buttonText = useMemo(() => (runs?.length == 1 ? 'Update QC State' : 'Update QC States'), [runs]);

    if (asMenuItem) {
        button = (
            <DisableableMenuItem
                className="assay-qc-btn"
                onClick={onClickHandler}
                operationPermitted={!disabled}
                disabledMessage="Select one or more assay runs."
                placement="right"
            >
                {buttonText}
            </DisableableMenuItem>
        );
    } else {
        button = (
            <Button className="assay-qc-btn" bsStyle="primary" onClick={onClickHandler} disabled={disabled}>
                {buttonText}
            </Button>
        );
    }

    return (
        <>
            <RequiresPermission perms={PermissionTypes.QCAnalyst}>{button}</RequiresPermission>
            {showQCModal && (
                <AssayQCModal
                    assayContainer={assayContainer}
                    cancel={closeQCModal}
                    error={error}
                    loading={loading}
                    runs={runs}
                    save={updateQCStateValues}
                    visibleRuns={visibleRuns}
                    requireComment={requireCommentOnQCStateChange}
                />
            )}
        </>
    );
};
