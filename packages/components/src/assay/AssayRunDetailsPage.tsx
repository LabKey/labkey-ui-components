import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { WithRouterProps } from 'react-router';

import { Filter } from '@labkey/api';

import { fromJS } from 'immutable';

import { InjectedAssayModel } from '../internal/components/assay/withAssayModels';
import { InjectedRouteLeaveProps, withRouteLeave } from '../internal/util/RouteLeave';
import { InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';
import {
    NotificationsContextProps,
    withNotificationsContext,
} from '../internal/components/notifications/NotificationsContext';

import { isAssayQCEnabled, isELNEnabled, isWorkflowEnabled } from '../internal/app/utils';

import { CommonPageProps } from '../internal/models';

import { allowReimportAssayRun } from '../internal/components/assay/actions';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { NotFound } from '../internal/components/base/NotFound';
import { Page } from '../internal/components/base/Page';
import { Alert } from '../internal/components/base/Alert';
import { AssayLink } from '../internal/AssayDefinitionModel';
import { EditableDetailPanel } from '../public/QueryModel/EditableDetailPanel';
import { getContainerFilterForLookups } from '../internal/query/api';
import { runDetailsColumnsForQueryModel } from '../public/QueryModel/utils';
import { RUN_PROPERTIES_REQUIRED_COLUMNS } from '../internal/components/assay/constants';
import { SchemaQuery } from '../public/SchemaQuery';

import { useContainerUser } from '../internal/components/container/actions';

import { useServerContext } from '../internal/components/base/ServerContext';

import { AssayOverrideBanner } from './AssayOverrideBanner';

import { assayPage } from './AssayPageHOC';
import { AssayGridPanel } from './AssayGridPanel';
import { useAssayAppContext } from './AssayAppContext';
import { AssayRunDetailHeaderButtons } from './AssayButtons';
import { AssayHeader } from './AssayHeader';

import { AssayRunQCHistory } from './AssayRunQCHistory';

type Props = CommonPageProps & InjectedAssayModel & WithRouterProps & InjectedRouteLeaveProps;

const AssayRunDetailsPageBodyImpl: FC<Props & InjectedQueryModels & NotificationsContextProps> = memo(props => {
    const {
        actions,
        assayDefinition,
        assayProtocol,
        params,
        queryModels,
        createNotification,
        setIsDirty,
        getIsDirty,
        menu,
        navigate,
    } = props;
    const { runId } = params;
    const model = useMemo(() => Object.values(queryModels)[0], [queryModels]);

    const serverContext = useServerContext();
    const { moduleContext } = serverContext;
    const runContext = useContainerUser(model.getRowValue('Folder'));

    const [editingRunDetails, setEditingRunDetails] = useState<boolean>(false);
    const [editingResults, setEditingResults] = useState<boolean>(false);
    const elnEnabled = isELNEnabled();
    const subTitle = 'Assay Run Details';
    const resultsFilter = [
        Filter.create('Run/rowId', runId),
        // allow for the possibility of viewing results for runs that have been replaced
        Filter.create('Run/Replaced', undefined, Filter.Types.NONBLANK),
    ];

    const { detailRenderer, qcEnabledForApp, ReferencingNotebooksComponent } = useAssayAppContext();

    const onQCStateUpdate = useCallback(() => {
        actions.loadModel(model.id);
    }, [actions]);

    const onRunDetailUpdate = useCallback(() => {
        actions.loadModel(model.id);
        createNotification('Run Details successfully updated.');
    }, [actions, createNotification, model.id]);

    const updateEditingResultsState = useCallback((editing: boolean) => {
        setEditingResults(editing);
    }, []);

    const updateEditingRunDetailsState = useCallback((editing: boolean) => {
        setEditingRunDetails(editing);
    }, []);

    if (model.isLoading || (model.hasRows && !runContext.isLoaded)) {
        return <LoadingPage title={subTitle} />;
    }

    if (!model.hasRows) {
        return <NotFound />;
    }

    const row = model.getRow();
    const runName = model.getRowValue('Name');
    const canReimport = allowReimportAssayRun(serverContext.user, runContext.container?.id, serverContext.container.id);
    const hasDeletePermission = runContext.user?.hasDeletePermission();

    return (
        <Page title={(runName ? runName + ' - ' : '') + subTitle} hasHeader>
            <AssayHeader
                menu={menu}
                title={runName}
                subTitle={subTitle}
                description={assayDefinition.name}
                leftColumns={8}
            >
                <AssayRunDetailHeaderButtons
                    allowReimport={canReimport}
                    allowDelete={hasDeletePermission}
                    model={model}
                    runId={runId}
                    navigate={navigate}
                />
            </AssayHeader>

            <Alert>{runContext.error}</Alert>

            <AssayOverrideBanner assay={assayDefinition} link={AssayLink.RUNS} />

            <div className="row">
                <div className={elnEnabled ? 'col-md-6' : 'col-md-12'}>
                    <EditableDetailPanel
                        actions={actions}
                        appEditable={assayProtocol.editableRuns}
                        asSubPanel
                        canUpdate={runContext.user.canUpdate && !editingResults} // if assay results are being edited, don't allow run edit
                        containerFilter={getContainerFilterForLookups()}
                        containerPath={runContext.container.path}
                        detailRenderer={detailRenderer}
                        onEditToggle={updateEditingRunDetailsState}
                        onUpdate={onRunDetailUpdate}
                        model={model}
                        queryColumns={runDetailsColumnsForQueryModel(model, assayDefinition.reRunSupport)}
                        submitText="Save Run Details"
                        title="Run Details"
                    />
                </div>

                {elnEnabled && (
                    <div className="col-md-6">
                        <ReferencingNotebooksComponent
                            label={runName}
                            queryName={model.queryName}
                            schemaName={model.schemaName}
                            value={model.keyValue}
                        />
                    </div>
                )}
            </div>

            <AssayGridPanel
                canDelete={assayProtocol.editableResults && !editingRunDetails}
                canUpdate={assayProtocol.editableResults && !editingRunDetails}
                assayDefinition={assayDefinition}
                filters={resultsFilter}
                queryName="Data"
                header="Results"
                nounSingular="Result"
                nounPlural="Results"
                showImport={false}
                onEditToggle={updateEditingResultsState}
                setIsDirty={setIsDirty}
                getIsDirty={getIsDirty}
            />

            {qcEnabledForApp && assayProtocol.qcEnabled && isAssayQCEnabled(moduleContext) && (
                <AssayRunQCHistory
                    assayContainer={assayProtocol.container}
                    run={fromJS(row)}
                    requireCommentOnQCStateChange={assayDefinition.requireCommentOnQCStateChange}
                    onQCStateUpdate={onQCStateUpdate}
                />
            )}
        </Page>
    );
});

const AssayRunDetailsPageBody = withRouteLeave(
    withQueryModels<Props>(withNotificationsContext(AssayRunDetailsPageBodyImpl))
);

const AssayRunDetailsPageImpl: FC<Props & InjectedQueryModels> = memo(props => {
    const { assayDefinition, params } = props;
    const { runId } = params;
    const id = useMemo(
        () => `${assayDefinition.protocolSchemaName}.Runs.${runId}`,
        [assayDefinition.protocolSchemaName, runId]
    );
    const { qcEnabledForApp } = useAssayAppContext();

    const queryConfigs = useMemo(
        () => ({
            [id]: {
                baseFilters: [Filter.create('Replaced', undefined, Filter.Types.NONBLANK)],
                keyValue: runId,
                requiredColumns:
                    qcEnabledForApp && isAssayQCEnabled()
                        ? RUN_PROPERTIES_REQUIRED_COLUMNS.concat(['LSID', 'QCFlags']).toArray()
                        : RUN_PROPERTIES_REQUIRED_COLUMNS.toArray(),
                schemaQuery: SchemaQuery.create(assayDefinition.protocolSchemaName, 'Runs'),
                omittedColumns: isWorkflowEnabled() ? undefined : ['WorkflowTask'],
            },
        }),
        [assayDefinition.protocolSchemaName, runId, id, qcEnabledForApp]
    );

    return <AssayRunDetailsPageBody {...props} autoLoad key={id} queryConfigs={queryConfigs} />;
});

export const AssayRunDetailsPage = assayPage(AssayRunDetailsPageImpl);
