import React, { ComponentType, FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { WithRouterProps } from 'react-router';

import { AuditBehaviorTypes, Filter } from '@labkey/api';

import {
    FIND_BY_IDS_QUERY_PARAM,
    SAMPLE_DATA_EXPORT_CONFIG,
    SAMPLE_STATUS_REQUIRED_COLUMNS,
} from '../samples/constants';
import { FindSamplesByIdHeaderPanel } from '../samples/FindSamplesByIdHeaderPanel';
import { getFindSamplesByIdData } from '../samples/actions';
import { getLocation, pushParameter, replaceParameter, resetParameters } from '../../util/URL';
import { createGridModelId } from '../../models';
import {
    InjectedQueryModels,
    RequiresModelAndActions,
    withQueryModels,
} from '../../../public/QueryModel/withQueryModels';
import { LoadingState } from '../../../public/LoadingState';
import { Page } from '../base/Page';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { QuerySort } from '../../../public/QuerySort';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SCHEMAS } from '../../schemas';
import { SampleGridButtonProps } from '../samples/models';
import { SamplesEditableGridProps } from '../samples/SamplesEditableGrid';
import { User } from '../base/models/User';
import { SamplesTabbedGridPanel } from '../samples/SamplesTabbedGridPanel';
import { SamplesEditButtonSections } from '../samples/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { arrayEquals } from '../../util/utils';

import { FIND_SAMPLE_BY_ID_METRIC_AREA } from './utils';
import { getSampleTypesFromFindByIdQuery } from './actions';

const TYPE_GRID_PREFIX = 'find-by-id-';

interface FindSamplesByIdsTabProps extends InjectedQueryModels {
    allSamplesModel: QueryModel;
    getGridPanelDisplay?: (activeGridId: string) => React.ReactNode;
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    sampleGridIds?: string[];
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
    user: User;
}

export const FindSamplesByIdsTabbedGridPanelImpl: FC<FindSamplesByIdsTabProps> = memo(props => {
    const {
        actions,
        allSamplesModel,
        sampleGridIds,
        queryModels,
        getGridPanelDisplay,
        gridButtons,
        user,
        samplesEditableGridProps,
    } = props;

    const afterSampleActionComplete = useCallback((): void => {
        actions.loadAllModels(true);
    }, [actions]);

    const getSampleAuditBehaviorType = useCallback(() => AuditBehaviorTypes.DETAILED, []);

    const getAdvancedExportOptions = useCallback((tabId: string): { [key: string]: any } => {
        return SAMPLE_DATA_EXPORT_CONFIG;
    }, []);

    const allQueryModels = useMemo(() => {
        const models = {};
        models[allSamplesModel.id] = allSamplesModel;
        sampleGridIds.forEach(sampleGridId => {
            models[sampleGridId] = queryModels[sampleGridId];
        });
        return models;
    }, [allSamplesModel.id, sampleGridIds, queryModels]);

    return (
        <>
            <SamplesTabbedGridPanel
                {...props}
                queryModels={allQueryModels}
                asPanel={true}
                withTitle={false}
                afterSampleActionComplete={afterSampleActionComplete}
                actions={actions}
                getSampleAuditBehaviorType={getSampleAuditBehaviorType}
                samplesEditableGridProps={samplesEditableGridProps}
                gridButtons={gridButtons}
                gridButtonProps={{
                    excludedMenuKeys: [SamplesEditButtonSections.IMPORT],
                    metricFeatureArea: FIND_SAMPLE_BY_ID_METRIC_AREA,
                    excludeAddButton: true,
                }}
                tabbedGridPanelProps={{
                    alwaysShowTabs: true,
                    getAdvancedExportOptions,
                    exportFilename: 'SamplesFoundById',
                    getGridPanelDisplay,
                }}
                user={user}
            />
        </>
    );
});

export const FindSamplesByIdsTabbedGridPanel: FC<FindSamplesByIdsTabProps> = memo(props => {
    const { actions, allSamplesModel } = props;

    const [sampleGridIds, setSampleGridIds] = useState<string[]>(undefined);

    useEffect(() => {
        const gridIds = [];

        getSampleTypesFromFindByIdQuery(allSamplesModel.schemaQuery)
            .then(sampleTypesRows => {
                if (sampleTypesRows) {
                    Object.keys(sampleTypesRows).forEach(sampleType => {
                        const sampleSchemaQuery = SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType);

                        const sampleGridId = createGridModelId(TYPE_GRID_PREFIX, sampleSchemaQuery);

                        const filter = Filter.create('RowId', sampleTypesRows[sampleType], Filter.Types.IN);

                        if (!sampleGridIds || sampleGridIds.indexOf(sampleGridId) === -1) {
                            const queryConfig = {
                                id: sampleGridId,
                                schemaQuery: sampleSchemaQuery,
                                baseFilters: [filter],
                                bindURL: false,
                                title: sampleType,
                            };

                            actions.addModel(queryConfig, true, false);
                        }

                        gridIds.push(sampleGridId);
                    });
                }
                if (!arrayEquals(gridIds, sampleGridIds)) {
                    setSampleGridIds(gridIds);
                }
            })
            .catch(error => {
                console.error('There was a problem retrieving sample types');
            });
    }, [sampleGridIds, allSamplesModel.id]);

    if (!sampleGridIds) return <LoadingSpinner />;

    return <FindSamplesByIdsTabbedGridPanelImpl {...props} sampleGridIds={sampleGridIds} />;
});

interface OwnProps {
    getGridPanelDisplay?: (activeGridId: string) => React.ReactNode;
    gridButtons: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    onListModelAdd?: (listModelId: string) => void;
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
    user: User;
}

type Props = OwnProps & InjectedQueryModels & WithRouterProps;

const FindSamplesByIdsPageBaseImpl: FC<Props> = memo(props => {
    const { queryModels, actions, location, onListModelAdd } = props;
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [error, setError] = useState<ReactNode>(undefined);
    const [missingIds, setMissingIds] = useState<{ [key: string]: string[] }>(undefined);
    const [headerModelId, setHeaderModelId] = useState<string>(undefined);
    const [sampleListModelId, setSampleListModelId] = useState<string>(undefined);
    const [findByIdsKey, setFindByIdsKey] = useState<string>(location.query?.findByIdsKey);
    const [ids, setIds] = useState<string[]>(undefined);

    useEffect(() => {
        init(location.query?.findByIdsKey);
    }, [location.query?.findByIdsKey]);

    useEffect(() => {
        if (!sampleListModelId) return;

        const model = queryModels[sampleListModelId];
        if (model && !model.isLoading && model.rowCount > 0) actions.selectAllRows(sampleListModelId);
    }, [sampleListModelId, queryModels[sampleListModelId]?.isLoading]);

    const listModel = useMemo(() => {
        if (sampleListModelId) {
            return queryModels[sampleListModelId];
        }

        return undefined;
    }, [sampleListModelId, queryModels]);

    const headerModel = useMemo(() => {
        if (headerModelId) {
            return queryModels[headerModelId];
        }

        return undefined;
    }, [headerModelId, queryModels]);

    const init = (findByIdsKey: string) => {
        setFindByIdsKey(findByIdsKey);
        if (!findByIdsKey) {
            setLoadingState(LoadingState.LOADED);
            return;
        }

        let listSchemaQuery;
        getFindSamplesByIdData(findByIdsKey)
            .then(data => {
                const { queryName, missingIds, ids } = data;
                setLoadingState(LoadingState.LOADED);
                setMissingIds(missingIds);
                setIds(ids);
                if (queryName) {
                    listSchemaQuery = SchemaQuery.create(SCHEMAS.EXP_TABLES.SCHEMA, queryName);
                    // add model twice, one used for header, one for tabbed grid, so that header doesn't reload when switching tabs

                    const listId = createGridModelId('find-samples-by-id', listSchemaQuery);
                    setSampleListModelId(listId);
                    onListModelAdd?.(listId);

                    const headerId = createGridModelId('find-samples-by-id-header', listSchemaQuery);
                    setHeaderModelId(headerId);

                    [listId, headerId].forEach(id => {
                        actions.addModel(
                            {
                                id,
                                schemaQuery: listSchemaQuery,
                                requiredColumns: SAMPLE_STATUS_REQUIRED_COLUMNS,
                                sorts: [new QuerySort({ fieldKey: 'Ordinal' })],
                                title: id === listId ? 'All Samples' : undefined,
                            },
                            true
                        );
                    });
                }
            })
            .catch(error => {
                setError(error);
                setMissingIds(undefined);
                setIds(undefined);
                setFindByIdsKey(undefined);
                setLoadingState(LoadingState.LOADED);
            });
    };

    const onFindSamples = (updatedKey: string) => {
        if (updatedKey != findByIdsKey) {
            if (findByIdsKey) {
                replaceParameter(getLocation(), FIND_BY_IDS_QUERY_PARAM, updatedKey);
            } else {
                pushParameter(getLocation(), FIND_BY_IDS_QUERY_PARAM, updatedKey);
            }
        }
        init(updatedKey);
    };

    const onClearSamples = () => {
        actions.replaceSelections(sampleListModelId, []);
        setSampleListModelId(undefined);
        setHeaderModelId(undefined);
        setMissingIds(undefined);
        setFindByIdsKey(undefined);
        setIds(undefined);
        resetParameters();
    };

    return (
        <Page title="Find Samples in Bulk">
            <FindSamplesByIdHeaderPanel
                listModel={headerModel}
                loadingState={loadingState}
                onFindSamples={onFindSamples}
                onClearSamples={onClearSamples}
                missingIds={missingIds}
                ids={ids}
                error={error}
                sessionKey={findByIdsKey}
                workWithSamplesMsg="Work with the selected samples in the grid now or save them to a picklist for later use."
            />
            {listModel && !error && <FindSamplesByIdsTabbedGridPanel {...props} allSamplesModel={listModel} />}
        </Page>
    );
});

export const FindSamplesByIdsPageBase = withQueryModels<Props>(FindSamplesByIdsPageBaseImpl);
