import React, { FC, memo, useCallback, useMemo, useState, createContext } from 'react';

import { User } from '../internal/components/base/models/User';
import { SchemaQuery } from '../public/SchemaQuery';
import { IS_ALIQUOT_COL, SAMPLE_STATUS_REQUIRED_COLUMNS } from '../internal/components/samples/constants';
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
import { useServerContext } from '../internal/components/base/ServerContext';
import { invalidateLineageResults } from '../internal/components/lineage/actions';
import { getSampleStatus } from '../internal/components/samples/utils';
import { hasActivePipelineJob } from '../internal/components/pipeline/utils';
import { Notifications } from '../internal/components/notifications/Notifications';
import { SCHEMAS } from '../internal/schemas';
import { createGridModelId } from '../internal/models';
import { ProductMenuModel } from '../internal/components/navigation/model';
import { AppURL } from '../internal/url/AppURL';

import { SampleHeader } from './SampleHeader';
import { SampleOverviewPanel } from './SampleOverviewPanel';
import { useSampleTypeAppContext } from './SampleTypeAppContext';
import { EntityDataType } from '../internal/components/entities/models';

// These are additional columns required for details
const REQUIRED_COLUMNS = ParentEntityRequiredColumns.concat(
    'AliquotVolume',
    'AliquotCount',
    'Folder',
    'SampleSet',
    'SampleSet/LabelColor',
    'StorageStatus',
    'Units',
    ...SAMPLE_STATUS_REQUIRED_COLUMNS
).toArray();

interface SampleDetailContext {
    isAliquot: boolean;
    isMedia: boolean;
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
    entityDataType?: EntityDataType;
    location?: any;
    menu: ProductMenuModel;
    navigate: (url: string | AppURL, replace?: boolean) => void;
    noun?: string;
    params?: any;
    requiredColumns?: string[];
    sampleType?: string;
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
        navigate,
        entityDataType,
        noun,
        sampleType,
    } = props;
    const [actionChangeCount, setActionChangeCount] = useState<number>(0);
    const sampleModel = queryModels[modelId];
    const sampleType_ = sampleType ?? params.sampleType;

    const containerUser = useContainerUser(sampleModel.getRowValue('Folder'));
    const containerUserError = containerUser.error;
    const sampleContainer = containerUser.container;
    const containerUserLoaded = containerUser.isLoaded;
    const user = containerUser.user;
    const { container } = useServerContext();
    const { SampleStorageMenuComponent, SampleStorageLocationComponent, assayProviderType } = useSampleTypeAppContext();

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
        const isMedia = sampleModel?.queryInfo?.isMedia;

        return {
            isAliquot,
            isMedia,
            location,
            onUpdate: onDetailUpdate,
            sampleContainer,
            sampleId,
            sampleLsid,
            sampleModel,
            sampleName,
            sampleType: sampleType_,
            sampleStatus,
            rootLsid,
            user,
        } as SampleDetailContext;
    }, [sampleContainer, sampleModel, sampleType_, location, user, onDetailUpdate]);

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
                assayProviderType={assayProviderType}
                navigate={navigate}
                sampleModel={sampleModel}
                onUpdate={onDetailUpdate}
                showDescription={!showOverview}
                hasActiveJob={hasActivePipelineJob(menu, SAMPLES_KEY, sampleType_)}
                sampleContainer={sampleContainer}
                entityDataType={entityDataType}
                user={user}
                isCrossFolder={sampleContainer.id !== container.id}
                StorageMenu={context.isMedia ? undefined : SampleStorageMenuComponent}
            />
            <Notifications />
            <SampleDetailContextProvider value={context}>
                {showOverview && (
                    <SampleOverviewPanel
                        title={title}
                        onDetailUpdate={onDetailUpdate}
                        actionChangeCount={actionChangeCount}
                        canUpdate={user.hasUpdatePermission()}
                        sampleModel={sampleModel}
                        actions={actions}
                        user={user}
                        noun={noun}
                        sampleContainer={sampleContainer}
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
    const { params, requiredColumns, sampleType } = props;
    const { id } = params;
    const sampleType_ = sampleType ?? params.sampleType;
    const schemaQuery = useMemo(() => SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType_), [sampleType_]);
    const modelId = useMemo(() => createGridModelId('sample-detail', schemaQuery, id), [id, schemaQuery]);

    const queryConfigs: QueryConfigMap = useMemo(
        () => ({
            [modelId]: {
                keyValue: id,
                requiredColumns: requiredColumns ?? REQUIRED_COLUMNS,
                schemaQuery,
            },
        }),
        [id, modelId, schemaQuery, requiredColumns]
    );

    return (
        <SampleDetailPageWithModels autoLoad key={modelId} modelId={modelId} queryConfigs={queryConfigs} {...props} />
    );
};
