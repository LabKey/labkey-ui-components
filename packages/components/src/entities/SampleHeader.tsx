import React, { ComponentType, FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { MenuItem } from 'react-bootstrap';
import { Container, PermissionTypes, User } from '@labkey/api';
import { EntityDataType } from '../internal/components/entities/models';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { getSampleOperationConfirmationData } from '../internal/components/entities/actions';
import { SampleOperation } from '../internal/components/samples/constants';
import { AppURL } from '../internal/url/AppURL';
import { AUDIT_KEY, MEDIA_KEY, SAMPLES_KEY } from '../internal/app/constants';
import { onSampleChange } from './actions';
import { getSampleStatus, isSampleOperationPermitted } from '../internal/components/samples/utils';
import { caseInsensitive } from '../internal/util/utils';
import { SampleStatusTag } from '../internal/components/samples/SampleStatusTag';
import { SCHEMAS } from '../internal/schemas';
import { createEntityParentKey, getSampleAuditBehaviorType, getSampleDeleteMessage } from './utils';
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
import { EntityDeleteModal } from './EntityDeleteModal';
import { SampleTypeDataType } from '../internal/components/entities/constants';
import {
    LabelPrintingProviderProps,
    withLabelPrintingContext
} from '../internal/components/labels/LabelPrintingContextProvider';
import { useServerContext } from '../internal/components/base/ServerContext';
import { PrintLabelsModal } from '../internal/components/labels/PrintLabelsModal';
import { CreateSamplesSubMenu } from './CreateSamplesSubMenu';
import { AssayImportSubMenuItem } from './AssayImportSubMenuItem';

interface StorageMenuProps {
    sampleModel: QueryModel;
    onUpdate?: (skipChangeCount?: boolean) => any;
}

interface HeaderProps {
    assayProviderType?: string;
    entityDataType?: EntityDataType;
    onUpdate: () => void;
    sampleModel: QueryModel;
    showDescription?: boolean;
    lastUpdatedCount?: number; // TODO Is this still needed? Probably added so the header would rerender after updates in the page
    hasActiveJob?: boolean;
    iconSrc?: string;
    jobCreationHref?: string;
    navigate: (url: string | AppURL) => void;
    sampleContainer?: Container;
    user?: User;
    title?: string;
    subtitle?: ReactNode;
    isCrossFolder?: boolean;
    StorageMenu?: ComponentType<StorageMenuProps>
}

export type Props = HeaderProps & LabelPrintingProviderProps;

// exported for jest testing purposes only
export const SampleHeaderImpl: FC<Props> = memo(props => {
    const {
        assayProviderType,
        canPrintLabels,
        entityDataType,
        iconSrc = 'samples',
        hasActiveJob,
        labelTemplate,
        navigate,
        onUpdate,
        printServiceUrl,
        sampleContainer,
        sampleModel,
        showDescription,
        isCrossFolder,
        jobCreationHref,
        title,
        subtitle,
        StorageMenu,
    } = props;
    const { queryInfo } = sampleModel;
    const { createNotification } = useNotificationsContext();
    const [canDelete, setCanDelete] = useState<boolean>(false);
    const [error, setError] = useState<boolean>(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
    const [showPrintDialog, setShowPrintDialog] = useState<boolean>(false);
    const sampleId = useMemo(() => sampleModel.getRowValue('RowId'), [sampleModel]);
    const sampleIds = useMemo(() => [sampleId], [sampleId]);
    const { user } = useServerContext();

    useEffect((): void => {
        (async () => {
            try {
                const confirmationData = await getSampleOperationConfirmationData(SampleOperation.Delete, undefined, sampleIds);
                setCanDelete(confirmationData.allowed.length === 1);
            } catch (e) {
                console.error('There was a problem retrieving the delete confirmation data.', e);
                setCanDelete(false);
                setError(true);
            }
        })();
    }, [sampleIds]);

    const onAfterDelete = useCallback((): void => {
        navigate(AppURL.create(SAMPLES_KEY, sampleModel.queryName));
    }, [navigate, sampleModel]);

    const onAfterPrint = useCallback((numSamples: number, numLabels: number): void => {
        setShowPrintDialog(false);
        createNotification(`Successfully printed ${numLabels} ${numLabels > 1 ? 'labels' : 'label'} for this sample.`);
    }, [createNotification]);

    const onBeforeDelete = useCallback((): void => {
        onSampleChange();
    }, []);

    const onDeleteSample = useCallback((): void => {
        setShowConfirmDelete(true);
    }, []);

    const onHideModals = useCallback((hasError?: boolean): void => {
        setShowConfirmDelete(false);
        setShowPrintDialog(false);

        // If the dialog had an error when canceling, then use
        // the onUpdate so that the page updates/refreshes accordingly.
        if (hasError) {
            onUpdate();
        }
    }, [onUpdate]);

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

    const isMedia  = queryInfo?.isMedia;

    const headerTitle = useMemo(() => {
        if (title) return title;

        return (
            <>
                {sampleName}
                <SampleStatusTag status={sampleStatus} className="sample-status-header-tag" />
            </>
        );
    }, [title, sampleName, sampleStatus]);

    let insertURL: string;
    let parent: string;
    if (isMedia) {
        // preset the insert wizard to target Raw Materials with a parent of DataClass/Ingredients
        parent = createEntityParentKey(SCHEMAS.DATA_CLASSES.INGREDIENTS);
        insertURL = AppURL.create(MEDIA_KEY, queryInfo.name, 'new')
            .addParam('target', SCHEMAS.SAMPLE_SETS.RAW_MATERIALS.queryName)
            .addParam('parent', parent)
            .toHref();
    } else {
        parent = createEntityParentKey(sampleModel.schemaQuery, sampleId);
    }

    const subTitle = useMemo(() => {
        if (subtitle) return subtitle;

        const sampleType = caseInsensitive(row, 'SampleSet')?.displayValue || undefined;
        const color = caseInsensitive(row, 'SampleSet/LabelColor')?.value;
        const labelDisplay = getTitleDisplay(sampleType, hasActiveJob);
        return color ? <ColorIcon label={labelDisplay} useSmall value={color} /> : sampleType;
    }, [row, subtitle]);

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
                <RequiresPermission user={user} permissionCheck="any" perms={[
                    PermissionTypes.Insert,
                    PermissionTypes.Update,
                    PermissionTypes.Delete,
                    PermissionTypes.ManagePicklists,
                    PermissionTypes.CanSeeAuditLog,
                    PermissionTypes.EditStorageData
                ]}>
                        <span className="sample-status-header-button">
                            <ManageDropdownButton id="sampledetail" pullRight collapsed>
                                {!isCrossFolder && (
                                    <RequiresPermission user={user} perms={PermissionTypes.Insert}>
                                        {isMedia && <MenuItem href={insertURL}>Create {entityDataType?.nounPlural ?? queryInfo.name}</MenuItem>}
                                        {!isMedia && (
                                            <CreateSamplesSubMenu
                                                disabled={!canCreateSamples}
                                                selectedQueryInfo={sampleModel.queryInfo}
                                                parentType={SAMPLES_KEY}
                                                parentKey={parent}
                                                navigate={navigate}
                                            />
                                        )}
                                    </RequiresPermission>
                                )}

                                {!isMedia && (
                                    <RequiresPermission user={user} perms={PermissionTypes.Insert}>
                                        <AssayImportSubMenuItem
                                            queryModel={sampleModel}
                                            providerType={assayProviderType}
                                            requireSelection={false}
                                            disabled={!canUploadAssayData}
                                        />
                                    </RequiresPermission>
                                )}

                                {!isMedia && (
                                    <RequiresPermission user={user} perms={PermissionTypes.ManagePicklists}>
                                        <AddToPicklistMenuItem
                                            queryModel={sampleModel}
                                            sampleIds={[sampleId]}
                                            user={user}
                                        />
                                        <PicklistCreationMenuItem
                                            sampleIds={[sampleId]}
                                            key="picklist"
                                            user={user}
                                        />
                                    </RequiresPermission>
                                )}
                                <RequiresPermission user={user} perms={PermissionTypes.ManageSampleWorkflows}>
                                    <DisableableMenuItem href={jobCreationHref} operationPermitted={canAddToWorkflow}>
                                        Create Workflow Job
                                    </DisableableMenuItem>
                                </RequiresPermission>

                                {!isMedia && !!StorageMenu && <StorageMenu onUpdate={onUpdate} sampleModel={sampleModel} />}

                                {canPrintLabels && <MenuItem onClick={onPrintLabel}>Print Labels</MenuItem>}

                                {!isMedia && (
                                    <RequiresPermission user={user} perms={PermissionTypes.Delete}>
                                        <DisableableMenuItem
                                            disabledMessage={getSampleDeleteMessage(canDelete, error)}
                                            onClick={onDeleteSample}
                                            operationPermitted={canDelete}
                                        >
                                            Delete {entityDataType?.nounSingular ?? 'Sample'}
                                        </DisableableMenuItem>
                                    </RequiresPermission>
                                )}
                                {!isMedia && (
                                    <RequiresPermission perms={PermissionTypes.CanSeeAuditLog}>
                                        <MenuItem href={AppURL.create(AUDIT_KEY)
                                            .addParams({
                                                eventType: SAMPLE_TIMELINE_AUDIT_QUERY.value,
                                                'query.sampleid~eq': sampleId
                                            }).toHref()}>
                                            View Audit History
                                        </MenuItem>
                                    </RequiresPermission>
                                )}
                            </ManageDropdownButton>
                        </span>
                </RequiresPermission>
            </PageDetailHeader>
            {showConfirmDelete && (
                <EntityDeleteModal
                    queryModel={sampleModel}
                    useSelected={false}
                    beforeDelete={onBeforeDelete}
                    afterDelete={onAfterDelete}
                    onCancel={onHideModals}
                    entityDataType={SampleTypeDataType}
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
                    schemaName={sampleModel.schemaName}
                    queryName={sampleModel.queryName}
                    sampleIds={sampleIds}
                    labelTemplate={labelTemplate}
                    printServiceUrl={printServiceUrl}
                />
            )}
        </>
    );
});

export const SampleHeader = withLabelPrintingContext(SampleHeaderImpl);
