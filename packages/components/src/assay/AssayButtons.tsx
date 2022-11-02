import { RequiresPermission } from '../internal/components/base/Permissions';
import { PermissionTypes } from '@labkey/api';
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { MenuItem } from 'react-bootstrap';
import classNames from 'classnames';
import { AppURL, buildURL } from '../internal/url/AppURL';
import { AssayContextConsumer } from '../internal/components/assay/withAssayModels';
import { isAssayDesignExportEnabled, isELNEnabled } from '../internal/app/utils';
import { getOperationConfirmationData } from '../internal/components/entities/actions';
import { AssayRunDataType } from '../internal/components/entities/constants';
import { onAssayDesignChange, onAssayRunChange } from './actions';
import { ASSAY_DESIGN_KEY, ASSAYS_KEY, AUDIT_KEY } from '../internal/app/constants';
import { CreatedModified } from '../internal/components/base/CreatedModified';
import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';
import { AssayReimportRunButton } from './AssayReimportRunButton';
import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';
import { getAssayRunDeleteMessage } from './utils';
import { AssayRunDeleteModal } from './AssayRunDeleteModal';
import { AssayDefinitionModel } from '../internal/AssayDefinitionModel';
import { AssayProtocolModel } from '../internal/components/domainproperties/assay/models';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { clearAssayDefinitionCache } from '../internal/components/assay/actions';
import { ASSAY_AUDIT_QUERY } from '../internal/components/auditlog/constants';
import { AssayDesignDeleteModal } from './AssayDesignDeleteModal';

interface InMenuProps {
    asMenuItem?: boolean;
}

interface AssayMenuButtonProps extends InMenuProps {
    bsStyle?: string;
    url: string;
}

const AssayMenuButton: FC<AssayMenuButtonProps> = props => {
    if (props.asMenuItem) {
        return <MenuItem href={props.url}>{props.children}</MenuItem>;
    }

    return (
        <a
            href={props.url}
            className={classNames('btn', {
                'btn-default': !props.bsStyle,
                [`btn-${props.bsStyle}`]: props.bsStyle,
            })}
        >
            <span>{props.children}</span>
        </a>
    );
};

export const AssayExportDesignButton: FC<InMenuProps> = props => (
    <RequiresPermission perms={PermissionTypes.Read}>
        <AssayContextConsumer>
            {({ assayDefinition }) => (
                <AssayMenuButton
                    asMenuItem={props.asMenuItem}
                    url={buildURL(
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
                </AssayMenuButton>
            )}
        </AssayContextConsumer>
    </RequiresPermission>
);

export interface AssayHeaderButtonProps {
    allowReimport?: boolean;
    allowDelete?: boolean;
    assayDefinition?: AssayDefinitionModel;
    assayProtocol?: AssayProtocolModel;
    navigate: (url: string | AppURL, replace?: boolean) => void;
    menuInit: (invalidate?: boolean) => void;
    runId?: string;
    model?: QueryModel;
}

export const AssayRunDetailHeaderButtons: FC<AssayHeaderButtonProps> = memo(props => {
    const {assayDefinition, assayProtocol, navigate, model, runId, allowReimport, allowDelete} = props;
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
    const [canDelete, setCanDelete] = useState<boolean>(false);
    const [confirmationDataError, setConfirmationDataError] = useState<boolean>(false);

    const runData = useMemo(() => {
        return model.getRow();
    }, [model]);

    useEffect((): void => {
        if (isELNEnabled()) {
            (async () => {
                try {
                    const confirmationData = await getOperationConfirmationData(undefined, AssayRunDataType, [runId]);
                    setCanDelete(confirmationData.allowed.length === 1);
                }
                catch (e) {
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
            <CreatedModified row={runData}/>
            {(allowReimport || allowDelete) && (
                <ManageDropdownButton id="assay-run-details" pullRight={true} collapsed={true}>
                    {allowReimport &&
                        <AssayReimportRunButton runId={runId} replacedByRunId={runData?.ReplacedByRun?.value}/>
                    }
                    {allowDelete &&
                        <DisableableMenuItem
                            operationPermitted={canDelete}
                            onClick={onDeleteRun}
                            disabledMessage={getAssayRunDeleteMessage(canDelete, confirmationDataError)}
                        >
                            Delete Run
                        </DisableableMenuItem>
                    }
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

export const AssayDesignHeaderButtons: FC<AssayHeaderButtonProps> = props => {
    const {assayDefinition, assayProtocol, navigate, menuInit} = props;
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

    const afterAssayDesignDelete = useCallback((success: boolean) => {
        if (success) {
            menuInit();
            clearAssayDefinitionCache();
            navigate(AppURL.create(ASSAYS_KEY));
        } else {
            // delay to make sure grid invalidate form beforeAssayDesignDelete is finished
            window.setTimeout(resetState, 100);
        }
    }, [menuInit, navigate]);

    return (
        <>
            <RequiresPermission permissionCheck="any"
                                perms={[PermissionTypes.Read, PermissionTypes.DesignAssay, PermissionTypes.CanSeeAuditLog]}>
                <ManageDropdownButton id={'assayheader'} pullRight collapsed>
                    <RequiresPermission perms={PermissionTypes.DesignAssay}>
                        <MenuItem
                            href={AppURL.create(
                                ASSAY_DESIGN_KEY,
                                assayDefinition.type,
                                assayDefinition.name
                            ).toHref()}
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
                    {isAssayDesignExportEnabled() && <AssayExportDesignButton asMenuItem/>}
                    <RequiresPermission perms={PermissionTypes.DesignAssay}>
                        <MenuItem onClick={onDeleteAssayDesign}>Delete Assay Design</MenuItem>
                    </RequiresPermission>
                    <RequiresPermission perms={PermissionTypes.CanSeeAuditLog}>
                        <MenuItem href={AppURL.create(AUDIT_KEY).addParams({
                            eventType: ASSAY_AUDIT_QUERY.value,
                            'query.q': assayDefinition.name
                        }).toHref()}>
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
