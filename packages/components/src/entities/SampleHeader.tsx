import React, { ComponentType, FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { MenuItem } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { EntityDataType } from '../internal/components/entities/models';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { getSampleOperationConfirmationData } from '../internal/components/entities/actions';
import { SampleOperation } from '../internal/components/samples/constants';
import { AppURL } from '../internal/url/AppURL';
import { AUDIT_KEY, MEDIA_KEY, SAMPLES_KEY } from '../internal/app/constants';

import { getSampleStatus, getSampleStatusType, isSampleOperationPermitted } from '../internal/components/samples/utils';
import { caseInsensitive } from '../internal/util/utils';
import { SampleStatusTag } from '../internal/components/samples/SampleStatusTag';

import { PageDetailHeader } from '../internal/components/forms/PageDetailHeader';
import { ColorIcon } from '../internal/components/base/ColorIcon';
import { getTitleDisplay } from '../internal/components/pipeline/utils';
import { CreatedModified } from '../internal/components/base/CreatedModified';
import { RequiresPermission } from '../internal/components/base/Permissions';
import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';
import { AddToPicklistMenuItem } from '../internal/components/picklist/AddToPicklistMenuItem';
import { PicklistCreationMenuItem } from '../internal/components/picklist/PicklistCreationMenuItem';
import { DisableableMenuItem } from '../internal/components/samples/DisableableMenuItem';
import { SAMPLE_TIMELINE_AUDIT_QUERY } from '../internal/components/auditlog/constants';

import { SampleTypeDataType } from '../internal/components/entities/constants';
import {
    LabelPrintingProviderProps,
    withLabelPrintingContext,
} from '../internal/components/labels/LabelPrintingContextProvider';
import { useServerContext } from '../internal/components/base/ServerContext';
import { PrintLabelsModal } from '../internal/components/labels/PrintLabelsModal';

import { invalidateLineageResults } from '../internal/components/lineage/actions';

import {isAllProductFoldersFilteringEnabled, isAssayEnabled, isWorkflowEnabled} from '../internal/app/utils';

import { User } from '../internal/components/base/models/User';
import { Container } from '../internal/components/base/models/Container';

import { SampleStorageMenuComponentProps } from '../internal/sampleModels';

import { EntityMoveModal } from '../internal/components/entities/EntityMoveModal';

import { useAppContext } from '../internal/AppContext';

import { CreateSamplesSubMenu } from './CreateSamplesSubMenu';
import { AssayImportSubMenuItem } from './AssayImportSubMenuItem';
import { EntityDeleteModal } from './EntityDeleteModal';
import { createEntityParentKey, getJobCreationHref, getSampleAuditBehaviorType, getSampleDeleteMessage } from './utils';
import { onSampleChange } from './actions';

interface HeaderProps {
    StorageMenu?: ComponentType<SampleStorageMenuComponentProps>;
    assayProviderType?: string;
    canDerive?: boolean;
    entityDataType?: EntityDataType;
    hasActiveJob?: boolean;
    iconSrc?: string;
    navigate: (url: string | AppURL) => void;
    onUpdate: () => void;
    sampleContainer?: Container;
    sampleModel: QueryModel;
    showDescription?: boolean;
    showMoveItem?: boolean;
    subtitle?: ReactNode;
    title?: string;
    user?: User;
}

export type Props = HeaderProps & LabelPrintingProviderProps;

// exported for jest testing purposes only
export const SampleHeaderImpl: FC<Props> = memo(props => {
    const {
        assayProviderType,
        canPrintLabels,
        defaultLabel,
        entityDataType = SampleTypeDataType,
        iconSrc = 'samples',
        hasActiveJob,
        navigate,
        onUpdate,
        printServiceUrl,
        sampleContainer,
        sampleModel,
        showDescription,
        canDerive,
        title,
        subtitle,
        StorageMenu,
        user,
        showMoveItem = true,
    } = props;
    const { queryInfo } = sampleModel;
    const { createNotification } = useNotificationsContext();
    const [canDelete, setCanDelete] = useState<boolean>(false);
    const [canMove, setCanMove] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);
    const [showConfirmMove, setShowConfirmMove] = useState<boolean>(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
    const [showPrintDialog, setShowPrintDialog] = useState<boolean>(false);
    const sampleId = useMemo(() => sampleModel.getRowValue('RowId'), [sampleModel]);
    const sampleIds = useMemo(() => [sampleId], [sampleId]);
    const { moduleContext } = useServerContext();
    const { api } = useAppContext();

    const isMedia = queryInfo?.isMedia;

    useEffect((): void => {
        (async () => {
            try {
                const sampleStatusType = getSampleStatusType(sampleModel.getRow());

                if (
                    user.hasDeletePermission() &&
                    isSampleOperationPermitted(sampleStatusType, SampleOperation.Delete)
                ) {
                    const confirmationData = await getSampleOperationConfirmationData(
                        SampleOperation.Delete,
                        sampleIds
                    );
                    setCanDelete(confirmationData.allowed.length === 1);
                }

                if (user.hasUpdatePermission() && isSampleOperationPermitted(sampleStatusType, SampleOperation.Move)) {
                    const confirmationData = await getSampleOperationConfirmationData(SampleOperation.Move, sampleIds);
                    setCanMove(confirmationData.allowed.length === 1);
                }
            } catch (e) {
                console.error('There was a problem retrieving the sample confirmation data.', e);
                setError(true);
            }
        })();
    }, [sampleIds, sampleModel, user]);

    const onAfterDelete = useCallback((): void => {
        invalidateLineageResults();
        navigate(AppURL.create(isMedia ? MEDIA_KEY : SAMPLES_KEY, sampleModel.queryName));
    }, [navigate, isMedia, sampleModel]);

    const onAfterMove = useCallback((): void => {
        if (isAllProductFoldersFilteringEnabled()) {
            onUpdate(); // this will reload the sample model
            setShowConfirmMove(false);
        } else {
            // we will no longer be able to resolve the sample in the current container now that it has moved,
            // so we'll navigate to the sample type grid in the current container
            navigate(AppURL.create(isMedia ? MEDIA_KEY : SAMPLES_KEY, sampleModel.queryName));
        }
    }, [isMedia, navigate, onUpdate, sampleModel.queryName]);

    const onAfterPrint = useCallback(
        (numSamples: number, numLabels: number): void => {
            setShowPrintDialog(false);
            createNotification(
                `Successfully printed ${numLabels} ${numLabels > 1 ? 'labels' : 'label'} for this sample.`
            );
        },
        [createNotification]
    );

    const onBeforeDelete = useCallback((): void => {
        onSampleChange();
    }, []);

    const onDeleteSample = useCallback((): void => {
        setShowConfirmDelete(true);
    }, []);

    const onMoveSample = useCallback((): void => {
        setShowConfirmMove(true);
    }, []);

    const onHideModals = useCallback(
        (hasError?: boolean): void => {
            setShowConfirmMove(false);
            setShowConfirmDelete(false);
            setShowPrintDialog(false);

            // If the dialog had an error when canceling, then use
            // the onUpdate so that the page updates/refreshes accordingly.
            if (hasError) {
                onUpdate();
            }
        },
        [onUpdate]
    );

    const onPrintLabel = useCallback((): void => {
        setShowPrintDialog(true);
    }, []);

    const row = sampleModel.getRow();
    const description = sampleModel.getRowValue('Description');
    const sampleName = sampleModel.getRowValue('Name');
    const sampleStatus = getSampleStatus(row);
    const canCreateSamples = useMemo(
        () => isSampleOperationPermitted(sampleStatus?.statusType, SampleOperation.EditLineage),
        [sampleStatus]
    );
    const canUploadAssayData = useMemo(
        () => isSampleOperationPermitted(sampleStatus?.statusType, SampleOperation.AddAssayData),
        [sampleStatus]
    );
    const canAddToWorkflow = useMemo(
        () => isSampleOperationPermitted(sampleStatus.statusType, SampleOperation.AddToWorkflow),
        [sampleStatus]
    );

    const headerTitle = useMemo(() => {
        if (title) return title;

        return (
            <>
                {sampleName}
                <SampleStatusTag status={sampleStatus} className="sample-status-header-tag" />
            </>
        );
    }, [title, sampleName, sampleStatus]);

    const parent = createEntityParentKey(sampleModel.schemaQuery, sampleId);

    const subTitle = useMemo(() => {
        if (subtitle) return subtitle;

        const sampleType = caseInsensitive(row, 'SampleSet')?.displayValue || undefined;
        const color = caseInsensitive(row, 'SampleSet/LabelColor')?.value;
        const labelDisplay = getTitleDisplay(sampleType, hasActiveJob);
        return color ? <ColorIcon label={labelDisplay} useSmall value={color} /> : sampleType;
    }, [hasActiveJob, row, subtitle]);

    return (
        <>
            <PageDetailHeader
                title={headerTitle}
                subTitle={subTitle}
                description={showDescription ? description : undefined}
                iconSrc={iconSrc}
                leftColumns={9}
            >
                <CreatedModified row={row} />
                <RequiresPermission
                    user={user}
                    permissionCheck="any"
                    perms={[
                        PermissionTypes.Insert,
                        PermissionTypes.Update,
                        PermissionTypes.Delete,
                        PermissionTypes.ManagePicklists,
                        PermissionTypes.CanSeeAuditLog,
                        PermissionTypes.EditStorageData,
                    ]}
                >
                    <span className="sample-status-header-button">
                        <ManageDropdownButton id="sampledetail" pullRight collapsed>
                            {canDerive && (
                                <RequiresPermission user={user} perms={PermissionTypes.Insert}>
                                    <CreateSamplesSubMenu
                                        mediaOptions={isMedia && [queryInfo.name]}
                                        disabled={!canCreateSamples}
                                        selectedQueryInfo={sampleModel.queryInfo}
                                        parentType={SAMPLES_KEY}
                                        parentKey={parent}
                                    />
                                </RequiresPermission>
                            )}

                            {!isMedia && isAssayEnabled(moduleContext) && canDerive && (
                                <RequiresPermission user={user} perms={PermissionTypes.Insert}>
                                    <AssayImportSubMenuItem
                                        queryModel={sampleModel}
                                        providerType={assayProviderType}
                                        requireSelection={false}
                                        disabled={!canUploadAssayData}
                                    />
                                </RequiresPermission>
                            )}

                            <RequiresPermission user={user} perms={PermissionTypes.ManagePicklists}>
                                <AddToPicklistMenuItem user={user} queryModel={sampleModel} sampleIds={sampleIds} />
                                <PicklistCreationMenuItem user={user} sampleIds={sampleIds} key="picklist" asMenuItem />
                            </RequiresPermission>

                            {isWorkflowEnabled(moduleContext) && (
                                <RequiresPermission user={user} perms={PermissionTypes.ManageSampleWorkflows}>
                                    <DisableableMenuItem
                                        href={getJobCreationHref(sampleModel, undefined, true)}
                                        operationPermitted={canAddToWorkflow}
                                    >
                                        Create Workflow Job
                                    </DisableableMenuItem>
                                </RequiresPermission>
                            )}

                            {!isMedia && !!StorageMenu && (
                                <StorageMenu onUpdate={onUpdate} sampleModel={sampleModel} sampleUser={user} />
                            )}

                            {canPrintLabels && <MenuItem onClick={onPrintLabel}>Print Labels</MenuItem>}

                            {showMoveItem && (
                                <RequiresPermission user={user} perms={PermissionTypes.Update}>
                                    <DisableableMenuItem onClick={onMoveSample} operationPermitted={canMove}>
                                        Move to Project
                                    </DisableableMenuItem>
                                </RequiresPermission>
                            )}

                            <RequiresPermission user={user} perms={PermissionTypes.Delete}>
                                <DisableableMenuItem
                                    disabledMessage={getSampleDeleteMessage(canDelete, error)}
                                    onClick={onDeleteSample}
                                    operationPermitted={canDelete}
                                >
                                    Delete Sample
                                </DisableableMenuItem>
                            </RequiresPermission>

                            <RequiresPermission perms={PermissionTypes.CanSeeAuditLog}>
                                <MenuItem
                                    href={AppURL.create(AUDIT_KEY)
                                        .addParams({
                                            eventType: SAMPLE_TIMELINE_AUDIT_QUERY.value,
                                            'query.sampleid~eq': sampleId,
                                        })
                                        .toHref()}
                                >
                                    View Audit History
                                </MenuItem>
                            </RequiresPermission>
                        </ManageDropdownButton>
                    </span>
                </RequiresPermission>
            </PageDetailHeader>
            {showConfirmMove && (
                <EntityMoveModal
                    queryModel={sampleModel}
                    useSelected={false}
                    onAfterMove={onAfterMove}
                    onCancel={onHideModals}
                    maxSelected={1}
                    entityDataType={entityDataType}
                    moveFn={api.entity.moveSamples}
                    sourceContainer={sampleContainer}
                    targetAppURL={AppURL.create(isMedia ? MEDIA_KEY : SAMPLES_KEY, sampleModel.queryName)}
                />
            )}
            {showConfirmDelete && (
                <EntityDeleteModal
                    queryModel={sampleModel}
                    useSelected={false}
                    beforeDelete={onBeforeDelete}
                    afterDelete={onAfterDelete}
                    onCancel={onHideModals}
                    entityDataType={entityDataType}
                    auditBehavior={getSampleAuditBehaviorType()}
                    verb="deleted and removed from storage"
                    containerPath={sampleContainer?.path}
                />
            )}
            {showPrintDialog && (
                <PrintLabelsModal
                    show={showPrintDialog}
                    showSelection={false}
                    onCancel={onHideModals}
                    afterPrint={onAfterPrint}
                    model={sampleModel}
                    sampleIds={sampleIds}
                    printServiceUrl={printServiceUrl}
                    defaultLabel={defaultLabel}
                />
            )}
        </>
    );
});

export const SampleHeader = withLabelPrintingContext(SampleHeaderImpl);
