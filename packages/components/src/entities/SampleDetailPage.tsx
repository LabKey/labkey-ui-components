import React, { FC, memo, useCallback, useMemo, useState, createContext } from 'react';
import { Filter } from '@labkey/api';

import { User } from '../internal/components/base/models/User';
import { SchemaQuery } from '../public/SchemaQuery';
import {
    ALIQUOT_FILTER_MODE,
    IS_ALIQUOT_COL,
    SAMPLE_STATUS_REQUIRED_COLUMNS,
} from '../internal/components/samples/constants';
import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../public/QueryModel/withQueryModels';
import { SampleStatus } from '../internal/components/samples/models';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { Container } from '../internal/components/base/models/Container';
import { ParentEntityRequiredColumns } from '../internal/components/entities/constants';
import { SAMPLES_KEY } from '../internal/app/constants';
import { useContainerUser } from '../internal/components/container/actions';
import { NotFound } from '../internal/components/base/NotFound';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { Page } from '../internal/components/base/Page';
import { GENERAL_ASSAY_PROVIDER_NAME } from '../internal/components/assay/actions';
import { useServerContext } from '../internal/components/base/ServerContext';
import { invalidateLineageResults } from '../internal/components/lineage/actions';
import { getSampleStatus } from '../internal/components/samples/utils';
import { hasActivePipelineJob } from '../internal/components/pipeline/utils';
import { Notifications } from '../internal/components/notifications/Notifications';
import { SCHEMAS } from '../internal/schemas';
import { createGridModelId } from '../internal/models';
import { ProductMenuModel } from '../internal/components/navigation/model';
import { AppURL } from '../internal/url/AppURL';

import { ReferencingNotebooks, SampleStorageLocation, SampleStorageMenu } from './models';
import { SampleHeader } from './SampleHeader';
import { SampleOverviewPanel } from './SampleOverviewPanel';

// These are additional columns required for details
const requiredColumns = ParentEntityRequiredColumns.concat(
    'SampleSet',
    'SampleSet/LabelColor',
    'AliquotVolume',
    'Units',
    'StorageStatus',
    ...SAMPLE_STATUS_REQUIRED_COLUMNS
).toList();

interface SampleDetailContext {
    isAliquot: boolean;
    location: any;
    onUpdate: (skipChangeCount?: boolean) => void;
    rootLsid: string;
    sampleContainer: Container;
    sampleId: number;
    sampleLsid: string;
    sampleModel: QueryModel;
    sampleName: string;
    sampleStatus: SampleStatus;
    sampleType: string;
    user: User;
}

const Context = createContext<SampleDetailContext>(undefined);
const SampleDetailContextProvider = Context.Provider;
export const SampleDetailContextConsumer = Context.Consumer;

interface OwnProps {
    ReferencingNotebooksComponent?: ReferencingNotebooks;
    SampleStorageLocationComponent?: SampleStorageLocation;
    SampleStorageMenuComponent?: SampleStorageMenu;
    getWorkflowGridQueryConfigs?: (
        visibleTabs: string[],
        gridPrefix: string,
        user: User,
        schemaQuery?: SchemaQuery,
        initialFilters?: Filter.IFilter[],
        sampleLSID?: string,
        sourceLSID?: string,
        activeSampleAliquotType?: ALIQUOT_FILTER_MODE,
        containerPath?: string
    ) => QueryConfigMap;
    location?: any;
    menu: ProductMenuModel;
    navigate: (url: string | AppURL, replace?: boolean) => void;
    params?: any;
    showOverview?: boolean;
    title: string;
}

interface BodyProps {
    modelId: string;
}

type Props = OwnProps & BodyProps & InjectedQueryModels;

const SampleDetailPageBody: FC<Props> = memo(props => {
    const {
        location,
        modelId,
        queryModels,
        actions,
        menu,
        params,
        title,
        showOverview,
        children,
        ReferencingNotebooksComponent,
        SampleStorageLocationComponent,
        SampleStorageMenuComponent,
        getWorkflowGridQueryConfigs,
        navigate,
    } = props;
    const [actionChangeCount, setActionChangeCount] = useState<number>(0);
    const { sampleType } = params;
    const sampleModel = queryModels[modelId];

    const containerUser = useContainerUser(sampleModel.getRowValue('Folder'));
    const containerUserError = containerUser.error;
    const sampleContainer = containerUser.container;
    const containerUserLoaded = containerUser.isLoaded;
    const user = containerUser.user;
    const { container } = useServerContext();

    const onDetailUpdate = useCallback(
        (skipChangeCount?: boolean): void => {
            if (!skipChangeCount) setActionChangeCount(actionChangeCount + 1);

            actions.loadModel(sampleModel.id);
            invalidateLineageResults();
        },
        [actionChangeCount, actions, sampleModel.id]
    );

    const context = useMemo(() => {
        const row = sampleModel.getRow();
        const sampleId = sampleModel.getRowValue('RowId');
        const sampleName = sampleModel.getRowValue('Name');
        const sampleLsid = sampleModel.getRowValue('LSID');
        const isAliquot = sampleModel.getRowValue(IS_ALIQUOT_COL);
        const rootLsid = sampleModel.getRowValue('RootMaterialLSID');
        const sampleStatus = getSampleStatus(row);

        return {
            isAliquot,
            location,
            onUpdate: onDetailUpdate,
            sampleContainer,
            sampleId,
            sampleLsid,
            sampleModel,
            sampleName,
            sampleType,
            sampleStatus,
            rootLsid,
            user,
        } as SampleDetailContext;
    }, [sampleContainer, sampleModel, sampleType, location, user, onDetailUpdate]);

    if (!sampleModel || sampleModel.isLoading || !containerUserLoaded) {
        if (sampleModel?.queryInfoError || sampleModel?.rowsError || containerUserError) {
            return <NotFound />;
        }
        return <LoadingPage title={title} />;
    }

    if (!sampleModel.getRow()) return <NotFound />;

    return (
        <Page title={context.sampleName + ' - ' + title} hasHeader>
            <SampleHeader
                assayProviderType={GENERAL_ASSAY_PROVIDER_NAME}
                navigate={navigate}
                sampleModel={sampleModel}
                onUpdate={onDetailUpdate}
                showDescription={!showOverview}
                hasActiveJob={hasActivePipelineJob(menu, SAMPLES_KEY, sampleType)}
                sampleContainer={sampleContainer}
                user={user}
                isCrossFolder={sampleContainer.id !== container.id}
                StorageMenu={SampleStorageMenuComponent}
            />
            <Notifications />
            <SampleDetailContextProvider value={context}>
                {showOverview && (
                    <SampleOverviewPanel
                        sampleSet={sampleType}
                        title={title}
                        onDetailUpdate={onDetailUpdate}
                        actionChangeCount={actionChangeCount}
                        canUpdate={user.hasUpdatePermission()}
                        sampleModel={sampleModel}
                        actions={actions}
                        user={user}
                        sampleContainer={sampleContainer}
                        getWorkflowGridQueryConfigs={getWorkflowGridQueryConfigs}
                        ReferencingNotebooksComponent={ReferencingNotebooksComponent}
                        SampleStorageLocationComponent={SampleStorageLocationComponent}
                    />
                )}
                {children}
            </SampleDetailContextProvider>
        </Page>
    );
});

const SampleDetailPageWithModels = withQueryModels<OwnProps & BodyProps>(SampleDetailPageBody);

export const SampleDetailPage: FC<OwnProps> = props => {
    const { sampleType, id } = props.params;
    const schemaQuery = useMemo(() => SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType), [sampleType]);
    const modelId = useMemo(() => createGridModelId('sample-detail', schemaQuery, id), [id, schemaQuery]);

    const queryConfigs: QueryConfigMap = useMemo(
        () => ({
            [modelId]: {
                keyValue: id,
                requiredColumns: requiredColumns.toArray(),
                schemaQuery,
            },
        }),
        [id, modelId, schemaQuery]
    );

    return (
        <SampleDetailPageWithModels autoLoad key={modelId} modelId={modelId} queryConfigs={queryConfigs} {...props} />
    );
};
