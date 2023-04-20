import React, { FC, memo, useCallback, useMemo, useState, createContext } from 'react';
import { WithRouterProps } from 'react-router';

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
import { useServerContext } from '../internal/components/base/ServerContext';
import { invalidateLineageResults } from '../internal/components/lineage/actions';
import { getSampleStatus } from '../internal/components/samples/utils';
import { hasActivePipelineJob } from '../internal/components/pipeline/utils';
import { Notifications } from '../internal/components/notifications/Notifications';
import { SCHEMAS } from '../internal/schemas';
import { createGridModelId, CommonPageProps } from '../internal/models';

import { EntityDataType } from '../internal/components/entities/models';

import { isProjectContainer } from '../internal/app/utils';

import { SampleHeader } from './SampleHeader';
import { SampleOverviewPanel } from './SampleOverviewPanel';
import { useSampleTypeAppContext } from './useSampleTypeAppContext';

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
    onUpdate: (skipChangeCount?: boolean) => void;
    rootLsid: string;
    sampleAliquotType: ALIQUOT_FILTER_MODE;
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
    iconSrc?: string;
    noun?: string;
    requiredColumns?: string[];
    sampleType?: string;
    showOverview?: boolean;
    title?: string;
}

export interface SampleDetailPageProps extends OwnProps, CommonPageProps, WithRouterProps {}

interface BodyProps {
    modelId: string;
}

// exported for jest testing
export type SampleDetailPageBodyProps = SampleDetailPageProps & BodyProps & InjectedQueryModels;

// exported for jest testing
export const SampleDetailPageBody: FC<SampleDetailPageBodyProps> = memo(props => {
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
        iconSrc,
    } = props;
    const [actionChangeCount, setActionChangeCount] = useState<number>(0);
    const sampleModel = queryModels[modelId];
    const sampleType_ = sampleType ?? params?.sampleType;

    const containerUser = useContainerUser(sampleModel.getRowValue('Folder'), {
        includeStandardProperties: true, // need so we get the parentPath to use in EntityMoveConfirmationModal
    });
    const containerUserError = containerUser.error;
    const sampleContainer = containerUser.container;
    const user = containerUser.user;
    const containerUserLoading = !containerUser.isLoaded || (user === undefined && containerUserError === undefined);
    const { container } = useServerContext();
    const { SampleStorageMenuComponent, SampleStorageLocationComponent, assayProviderType } = useSampleTypeAppContext();

    const canDerive = useMemo(() => {
        return container?.id === sampleContainer?.id || isProjectContainer(sampleContainer?.path);
    }, [container, sampleContainer]);

    const onDetailUpdate = useCallback(
        (skipChangeCount?: boolean): void => {
            if (!skipChangeCount) {
                setActionChangeCount(activeChangeCount_ => activeChangeCount_ + 1);
            }

            actions.loadModel(sampleModel.id);
            invalidateLineageResults();
        },
        [actions, sampleModel.id]
    );

    const context = useMemo(
        (): SampleDetailContext => ({
            isAliquot: sampleModel.getRowValue(IS_ALIQUOT_COL),
            isMedia: sampleModel.queryInfo?.isMedia,
            onUpdate: onDetailUpdate,
            sampleAliquotType: location?.query?.sampleAliquotType,
            sampleContainer,
            sampleId: sampleModel.getRowValue('RowId'),
            sampleLsid: sampleModel.getRowValue('LSID'),
            sampleModel,
            sampleName: sampleModel.getRowValue('Name'),
            sampleStatus: getSampleStatus(sampleModel.getRow()),
            sampleType: sampleType_,
            rootLsid: sampleModel.getRowValue('RootMaterialLSID'),
            user,
        }),
        [sampleContainer, sampleModel, sampleType_, location, user, onDetailUpdate]
    );

    if (!sampleModel || sampleModel.isLoading || (sampleModel.getRow() && containerUserLoading)) {
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
                iconSrc={iconSrc}
                navigate={navigate}
                sampleModel={sampleModel}
                onUpdate={onDetailUpdate}
                showDescription={!showOverview}
                hasActiveJob={hasActivePipelineJob(menu, SAMPLES_KEY, sampleType_)}
                sampleContainer={sampleContainer}
                entityDataType={entityDataType}
                user={user}
                canDerive={canDerive}
                StorageMenu={context.isMedia ? undefined : SampleStorageMenuComponent}
            />
            <Notifications />
            <SampleDetailContextProvider value={context}>
                {showOverview && (
                    <SampleOverviewPanel
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

const SampleDetailPageWithModels = withQueryModels<SampleDetailPageProps & BodyProps>(SampleDetailPageBody);

export const SampleDetailPage: FC<SampleDetailPageProps> = props => {
    const { params, requiredColumns, sampleType } = props;
    const { id } = params;
    const sampleType_ = sampleType ?? params.sampleType;
    const schemaQuery = useMemo(() => new SchemaQuery(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType_), [sampleType_]);
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
        <SampleDetailPageWithModels {...props} autoLoad key={modelId} modelId={modelId} queryConfigs={queryConfigs} />
    );
};
