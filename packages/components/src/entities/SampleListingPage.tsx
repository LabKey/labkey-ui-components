/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode, FC, useCallback, useEffect, useMemo, useState } from 'react';
import { MenuItem } from 'react-bootstrap';
import { fromJS, List } from 'immutable';
import { WithRouterProps } from 'react-router';
import { Filter, PermissionTypes, Query } from '@labkey/api';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { Actions, InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';
import { SchemaQuery } from '../public/SchemaQuery';
import { isLoading } from '../public/LoadingState';
import { SHARED_CONTAINER_PATH } from '../internal/constants';
import { User } from '../internal/components/base/models/User';
import { AppURL } from '../internal/url/AppURL';
import { AUDIT_KEY, SAMPLES_KEY, SAMPLE_TYPE_KEY } from '../internal/app/constants';
import { SCHEMAS } from '../internal/schemas';
import { selectGridIdsFromTransactionId, setSnapshotSelections } from '../internal/actions';
import { createGridModelId, CommonPageProps } from '../internal/models';
import { InjectedRouteLeaveProps, withRouteLeave } from '../internal/util/RouteLeave';
import { useLabelPrintingContext } from '../internal/components/labels/LabelPrintingContextProvider';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { getContainerFilterForLookups } from '../internal/query/api';
import { useContainerUser } from '../internal/components/container/actions';
import { getUserSharedContainerPermissions } from '../internal/components/user/actions';
import { userCanEditStorageData } from '../internal/app/utils';
import { getLocation, replaceParameter } from '../internal/util/URL';
import { ColorIcon } from '../internal/components/base/ColorIcon';
import { NotFound } from '../internal/components/base/NotFound';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { ManageDropdownButton } from '../internal/components/buttons/ManageDropdownButton';
import { SAMPLE_TYPE_AUDIT_QUERY } from '../internal/components/auditlog/constants';
import { hasActivePipelineJob } from '../internal/components/pipeline/utils';
import { DesignerDetailPanel } from '../internal/components/domainproperties/DesignerDetailPanel';
import { SAMPLE_DATA_EXPORT_CONFIG, SAMPLE_STATUS_REQUIRED_COLUMNS } from '../internal/components/samples/constants';
import { PrintLabelsModal } from '../internal/components/labels/PrintLabelsModal';

import { SampleTypeInsightsPanel } from './SampleTypeInsightsPanel';
import { SamplesTabbedGridPanel } from './SamplesTabbedGridPanel';
import { SampleSetDeleteModal } from './SampleSetDeleteModal';
import { SampleTypeBasePage } from './SampleTypeBasePage';
import { downloadSampleTypeTemplate } from './SampleTypeTemplateDownloadRenderer';
import { useSampleTypeAppContext } from './useSampleTypeAppContext';
import { onSampleChange, onSampleTypeChange } from './actions';
import { getSampleAuditBehaviorType, getSampleTypeTemplateUrl } from './utils';

const DETAIL_GRID_ID = 'samples-details';
const SAMPLES_LISTING_GRID_ID = 'samples-listing';
const SUB_MENU_WIDTH = 1610;
let SAMPLE_ACTION_UPDATE_COUNTER = 0;

// exported for jest testing
export const getIsSharedModel = (model: QueryModel): boolean => {
    return SHARED_CONTAINER_PATH === model.getRowValue('Folder/Path');
};

// exported for jest testing
export const hasPermissions = (
    user: User,
    perms: string[],
    isSharedContainer?: boolean,
    sharedContainerPermissions?: List<string>
): boolean => {
    const allPerms = isSharedContainer ? sharedContainerPermissions : user.get('permissionsList');

    if (!allPerms) return false;

    return perms.every(p => allPerms.indexOf(p) > -1);
};

function selectSamplesAndAddToStorage(
    targetSampleTypeName: string,
    sampleCount: number,
    transactionAuditId: number,
    sampleListingGridId: string,
    navigate: (url: string | AppURL) => any,
    actions: Actions
): void {
    let sampleTypeURL = AppURL.create(SAMPLES_KEY, targetSampleTypeName);
    const schemaQuery = SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, targetSampleTypeName);
    selectGridIdsFromTransactionId(sampleListingGridId, schemaQuery, transactionAuditId, SAMPLES_KEY, actions).then(
        selected => {
            const modelId = createGridModelId(sampleListingGridId, schemaQuery);
            setSnapshotSelections(modelId, selected).then(() => {
                sampleTypeURL = sampleTypeURL.addParam('addToStorageCount', sampleCount); // show AddSamplesToStorageModal
                navigate(sampleTypeURL);
            });
        }
    );
}

export const getSamplesImportSuccessMessage = (
    sampleType: string,
    transactionAuditId: number,
    sampleListingGridId: string,
    filename: string,
    actions: Actions,
    nounPlural = 'samples'
): ReactNode => {
    const fromFile = filename ? ' from ' + filename : '';

    return (
        <>
            Background import of {nounPlural}
            {fromFile} completed. To work with the imported samples,&nbsp;
            <a
                onClick={() =>
                    selectGridIdsFromTransactionId(
                        sampleListingGridId,
                        SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType),
                        transactionAuditId,
                        SAMPLES_KEY,
                        actions
                    )
                }
            >
                select them in the grid.
            </a>
        </>
    );
};

export const getSamplesCreatedSuccessMessage = (
    sampleType: string,
    transactionAuditId: number,
    createdSampleCount: number,
    importedSampleCount: number,
    showAddToStorage: boolean,
    sampleListingGridId: string,
    navigate: (url: string | AppURL) => void,
    actions: Actions,
    nounSingular = 'item',
    nounPlural = 'items'
): ReactNode => {
    const count = createdSampleCount > 0 ? createdSampleCount : importedSampleCount;
    const noun = count == 1 ? ' ' + nounSingular : ' ' + nounPlural;
    const itThem = count == 1 ? 'it' : 'them';
    const action = createdSampleCount > 0 ? 'created' : 'imported';

    return (
        <>
            Successfully {action} {count} {noun}.&nbsp;
            {showAddToStorage && (
                <>
                    <a
                        onClick={() =>
                            selectSamplesAndAddToStorage(
                                sampleType,
                                count,
                                transactionAuditId,
                                sampleListingGridId,
                                navigate,
                                actions
                            )
                        }
                    >
                        Add {itThem} to storage
                    </a>
                    &nbsp;now or
                </>
            )}
            {transactionAuditId && (
                <>
                    <a
                        onClick={() =>
                            selectGridIdsFromTransactionId(
                                sampleListingGridId,
                                SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType),
                                transactionAuditId,
                                SAMPLES_KEY,
                                actions
                            )
                        }
                    >
                        &nbsp;{showAddToStorage ? 'select' : 'Select'} {itThem} in the grid&nbsp;
                    </a>
                </>
            )}
            to work with {itThem}.
        </>
    );
};

interface BodyProps {
    sampleListModelId: string;
}

export type SampleListingPageBodyProps = CommonPageProps &
    BodyProps &
    InjectedQueryModels &
    WithRouterProps &
    InjectedRouteLeaveProps;

// exported for jest testing
export const SampleListingPageBody: FC<SampleListingPageBodyProps> = props => {
    const { menuInit, navigate, queryModels, actions, sampleListModelId, menu, setIsDirty, getIsDirty } = props;
    const { sampleType } = props.params;
    const { canPrintLabels, labelTemplate, printServiceUrl } = useLabelPrintingContext();
    const { createNotification, dismissNotifications } = useNotificationsContext();
    const {
        detailRenderer,
        downloadTemplateExcludeColumns,
        getSamplesEditableGridProps,
        AddSamplesToStorageModalComponent,
        SampleGridButtonComponent,
    } = useSampleTypeAppContext();
    const [showPrintDialog, setShowPrintDialog] = useState(false);
    const [showAddToStorage, setShowAddToStorage] = useState(false);
    const [showConfirmDeleteSampleType, setShowConfirmDeleteSampleType] = useState(false);
    const [sharedContainerPermissions, setSharedContainerPermissions] = useState<List<string>>();
    const containerFilter = useMemo(() => getContainerFilterForLookups(), []);

    const detailsModel = queryModels[DETAIL_GRID_ID];
    const listModel = queryModels[sampleListModelId];
    const { error, isLoaded, user } = useContainerUser(detailsModel?.getRowValue('Folder/Path'));

    useEffect(() => {
        getUserSharedContainerPermissions()
            .then(permissions => {
                setSharedContainerPermissions(fromJS(permissions));
            })
            .catch(reason => {
                console.error(reason);
            });
    }, []);

    useEffect(() => {
        if (!isLoaded) return;

        const { transactionAuditId, createdSampleCount, importedSampleCount } = props.location?.query;
        const sampleType = listModel.schemaQuery.getQuery();

        if (transactionAuditId) {
            if (createdSampleCount || importedSampleCount) {
                const canAddToStorage = userCanEditStorageData(user);
                createNotification(
                    {
                        message: getSamplesCreatedSuccessMessage(
                            sampleType,
                            transactionAuditId,
                            createdSampleCount,
                            importedSampleCount,
                            canAddToStorage,
                            SAMPLES_LISTING_GRID_ID,
                            navigate,
                            actions,
                            'sample',
                            'samples'
                        ),
                    },
                    true
                );
            } else {
                const filename = props.location?.query?.importFile;
                createNotification(
                    {
                        message: getSamplesImportSuccessMessage(
                            sampleType,
                            transactionAuditId,
                            SAMPLES_LISTING_GRID_ID,
                            filename,
                            actions
                        ),
                    },
                    true
                );
            }
        }

        // Issue 44278: Remove these parameters after using them so a cancel action from the next page doesn't regenerate the notification
        replaceParameter(getLocation(), 'createdSampleCount', undefined);
        replaceParameter(getLocation(), 'importedSampleCount', undefined);
        replaceParameter(getLocation(), 'transactionAuditId', undefined);
    }, [isLoaded]);

    useEffect(() => {
        if (props.location?.query?.addToStorageCount > 0) {
            setShowAddToStorage(true);
            replaceParameter(getLocation(), 'addToStorageCount', undefined);
        }
    }, [props.location?.query?.addToStorageCount]);

    useEffect(() => {
        if (!detailsModel && !isLoading(listModel.queryInfoLoadingState)) {
            actions.addModel(
                {
                    id: DETAIL_GRID_ID,
                    schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS_DETAILS,
                    baseFilters: [Filter.create('name', listModel.queryInfo?.name || sampleType)],
                    requiredColumns: ['Folder/Path'],
                    omittedColumns: ['Name', 'LSID', 'MaterialLSIDPrefix'],
                    containerFilter: Query.containerFilter.currentPlusProjectAndShared,
                },
                true
            );
        }
    }, [listModel.queryInfoLoadingState]);

    const isSharedSampleType = useMemo(() => {
        if (detailsModel && !detailsModel.isLoading) return getIsSharedModel(detailsModel);
        else return false;
    }, [detailsModel]);

    const onDeleteSampleType = useCallback((): void => {
        setShowConfirmDeleteSampleType(true);
    }, []);

    const onClearDeleteSampleType = useCallback((): void => {
        setShowConfirmDeleteSampleType(false);
    }, []);

    const afterSampleActionComplete = useCallback((): void => {
        if (showAddToStorage) {
            dismissNotifications();
            setShowAddToStorage(false);
        }

        onSampleChange();
        actions.loadModel(sampleListModelId);
        SAMPLE_ACTION_UPDATE_COUNTER++;
    }, [actions, dismissNotifications, sampleListModelId, showAddToStorage]);

    const beforeDeleteSampleType = useCallback(() => {
        // call onSampleTypeChange so that the QueryDetails get invalidated
        onSampleTypeChange(listModel.schemaQuery, listModel.queryInfo?.domainContainerPath);
    }, [listModel.queryInfo?.domainContainerPath, listModel.schemaQuery]);

    const onDeleteSampleTypeComplete = useCallback(
        (success: boolean) => {
            if (success) {
                menuInit();
                navigate(AppURL.create(SAMPLES_KEY), true);
            } else {
                // delay to make sure grid invalidate form beforeDeleteSampleType is finished
                window.setTimeout(() => onClearDeleteSampleType(), 100);
            }
        },
        [menuInit, navigate, onClearDeleteSampleType]
    );

    const canDesignDomain = useMemo(() => {
        return (
            isLoaded &&
            hasPermissions(user, [PermissionTypes.DesignSampleSet], isSharedSampleType, sharedContainerPermissions)
        );
    }, [isLoaded, isSharedSampleType, sharedContainerPermissions, user]);

    const canSeeAudit = useMemo(() => {
        return isLoaded && hasPermissions(user, [PermissionTypes.CanSeeAuditLog]);
    }, [isLoaded, user]);

    const color = useMemo(() => {
        if (detailsModel && !detailsModel.isLoading) {
            return detailsModel.getRowValue('LabelColor');
        }

        return null;
    }, [detailsModel]);

    const colorIcon = useMemo(() => {
        return (
            <div className="top-spacing-less">
                {color ? <ColorIcon value={color} label="Label Color" useSmall /> : 'No Label Color'}
            </div>
        );
    }, [color]);

    const onDownloadTemplate = useCallback(() => {
        downloadSampleTypeTemplate(listModel.schemaQuery, getSampleTypeTemplateUrl, downloadTemplateExcludeColumns);
    }, [downloadTemplateExcludeColumns, listModel.schemaQuery]);

    const onCancelShowAddToStorage = useCallback(() => {
        setShowAddToStorage(false);
        dismissNotifications();
    }, [dismissNotifications]);

    const onPrintLabel = useCallback(() => {
        setShowPrintDialog(true);
    }, []);

    const onCancelPrint = useCallback(() => {
        setShowPrintDialog(false);
    }, []);

    const afterPrint = useCallback(
        (numSamples: number, numLabels: number) => {
            setShowPrintDialog(false);
            createNotification(
                'Successfully printed ' +
                    numLabels +
                    (numSamples === 0 ? ' blank ' : '') +
                    (numLabels > 1 ? ' labels.' : ' label.')
            );
        },
        [createNotification]
    );

    const title = listModel.queryInfo?.title ?? listModel.queryInfo?.name ?? 'Sample Type - Overview';

    if (listModel.hasLoadErrors || detailsModel?.hasLoadErrors || error) {
        return <NotFound title={title} />;
    }
    if (!detailsModel || detailsModel.isLoading || !isLoaded) {
        return <LoadingPage title={title} />;
    }
    if (!detailsModel.getRow()) {
        return <NotFound title={title} />;
    }

    let headerButtons;
    if (canDesignDomain || canSeeAudit) {
        headerButtons = (
            <ManageDropdownButton collapsed id="samplelistingheader" pullRight>
                {canDesignDomain && (
                    <>
                        <MenuItem href={AppURL.create(SAMPLE_TYPE_KEY, sampleType).toHref()}>
                            Edit Sample Type Design
                        </MenuItem>
                        <MenuItem onClick={onDeleteSampleType}>Delete Sample Type</MenuItem>
                    </>
                )}
                {canPrintLabels && <MenuItem onClick={onPrintLabel}>Print Labels</MenuItem>}
                {canSeeAudit && (
                    <MenuItem
                        href={AppURL.create(AUDIT_KEY)
                            .addParams({
                                eventType: SAMPLE_TYPE_AUDIT_QUERY.value,
                                'query.samplesetname~eq': sampleType,
                            })
                            .toHref()}
                    >
                        View Audit History
                    </MenuItem>
                )}
            </ManageDropdownButton>
        );
    }

    return (
        <SampleTypeBasePage
            title={title}
            hasActiveJob={hasActivePipelineJob(menu, SAMPLES_KEY, listModel.queryInfo?.name)}
            description={colorIcon}
            buttons={headerButtons}
            onTemplateDownload={onDownloadTemplate}
        >
            <div className="row">
                <div className="col-xs-12 col-md-6">
                    <DesignerDetailPanel
                        actions={actions}
                        asPanel
                        detailRenderer={detailRenderer}
                        model={detailsModel}
                        schemaQuery={listModel?.schemaQuery}
                    />
                </div>
                <div className="col-xs-12 col-md-6">
                    <SampleTypeInsightsPanel sampleSet={title} key={SAMPLE_ACTION_UPDATE_COUNTER} />
                </div>
            </div>
            <div className="sample-list-page-samples">
                <SamplesTabbedGridPanel
                    actions={actions}
                    afterSampleActionComplete={afterSampleActionComplete}
                    containerFilter={containerFilter}
                    getIsDirty={getIsDirty}
                    getSampleAuditBehaviorType={getSampleAuditBehaviorType}
                    gridButtonProps={{
                        metricFeatureArea: 'sampleListingGrid',
                        subMenuWidth: SUB_MENU_WIDTH,
                    }}
                    gridButtons={SampleGridButtonComponent}
                    modelId={sampleListModelId}
                    queryModels={queryModels}
                    samplesEditableGridProps={getSamplesEditableGridProps(user)}
                    showLabelOption
                    setIsDirty={setIsDirty}
                    tabbedGridPanelProps={{
                        advancedExportOptions: SAMPLE_DATA_EXPORT_CONFIG,
                        exportFilename: title,
                        hideEmptyViewMenu: false,
                    }}
                    user={user}
                    withTitle={false}
                />
                {showConfirmDeleteSampleType && (
                    <SampleSetDeleteModal
                        afterDelete={onDeleteSampleTypeComplete}
                        beforeDelete={beforeDeleteSampleType}
                        containerPath={listModel.queryInfo?.domainContainerPath}
                        numSamples={listModel.rowCount}
                        onCancel={onClearDeleteSampleType}
                        rowId={detailsModel.getRowValue('RowId')}
                    />
                )}
                {showPrintDialog && (
                    <PrintLabelsModal
                        afterPrint={afterPrint}
                        onCancel={onCancelPrint}
                        labelTemplate={labelTemplate}
                        model={listModel}
                        printServiceUrl={printServiceUrl}
                        sampleIds={[...listModel.selections]}
                        show={showPrintDialog}
                        showSelection
                    />
                )}
                {showAddToStorage && (
                    <AddSamplesToStorageModalComponent
                        onCancel={onCancelShowAddToStorage}
                        onSuccess={afterSampleActionComplete}
                        totalCount={props.location?.query?.addToStorageCount}
                        inStorageSamplesCount={0}
                        samplesSelectionKey={listModel.id}
                        user={user}
                    />
                )}
            </div>
        </SampleTypeBasePage>
    );
};

const SampleListingPageWithQueryModels = withRouteLeave(withQueryModels(SampleListingPageBody));

export const SampleListingPage: FC<CommonPageProps & WithRouterProps> = props => {
    const { params, location } = props;
    const { sampleType } = params;
    const listSchemaQuery = SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType);
    const sampleListModelId = createGridModelId(SAMPLES_LISTING_GRID_ID, listSchemaQuery);
    const key = sampleType + (location.query?.importInProgress ? '-importing' : ''); // Issue 43154
    const { samplesGridRequiredColumns } = useSampleTypeAppContext();

    const queryConfigs = {
        [sampleListModelId]: {
            id: sampleListModelId,
            isPaged: true,
            requiredColumns: [...samplesGridRequiredColumns, ...SAMPLE_STATUS_REQUIRED_COLUMNS],
            schemaQuery: listSchemaQuery,
            bindURL: true,
        },
    };

    return (
        <SampleListingPageWithQueryModels
            {...props}
            sampleListModelId={sampleListModelId}
            queryConfigs={queryConfigs}
            key={key}
            autoLoad
        />
    );
};
