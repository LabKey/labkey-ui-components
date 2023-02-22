import React, { ComponentType, FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { WithRouterProps } from 'react-router';
import { ActionURL, Ajax, AuditBehaviorTypes, Filter, Utils } from '@labkey/api';

import {
    FIND_BY_IDS_QUERY_PARAM,
    SAMPLE_DATA_EXPORT_CONFIG,
    SAMPLE_ID_FIND_FIELD,
    SAMPLE_STATUS_REQUIRED_COLUMNS,
    UNIQUE_ID_FIND_FIELD,
} from '../internal/components/samples/constants';

import { getLocation, pushParameter, replaceParameter, resetParameters } from '../internal/util/URL';
import { createGridModelId } from '../internal/models';
import { LoadingState } from '../public/LoadingState';
import { Page } from '../internal/components/base/Page';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { QuerySort } from '../public/QuerySort';
import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from '../internal/schemas';
import { SampleGridButtonProps } from '../internal/components/samples/models';

import { SamplesEditButtonSections } from '../internal/components/samples/utils';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';
import { arrayEquals, caseInsensitive, findMissingValues } from '../internal/util/utils';

import { resolveErrorMessage } from '../internal/util/messaging';
import { useServerContext } from '../internal/components/base/ServerContext';

import { InjectedQueryModels, RequiresModelAndActions, withQueryModels } from '../public/QueryModel/withQueryModels';

import { getSampleTypesFromFindByIdQuery } from '../internal/components/search/actions';
import { FIND_SAMPLE_BY_ID_METRIC_AREA } from '../internal/components/search/utils';
import { selectDistinctRows } from '../internal/query/api';
import { SamplesEditableGridProps } from '../internal/sampleModels';

import { SamplesTabbedGridPanel } from './SamplesTabbedGridPanel';
import { FindSamplesByIdHeaderPanel } from './FindSamplesByIdHeaderPanel';

const TYPE_GRID_PREFIX = 'find-by-id-';

interface FindSamplesByIdsTabProps extends InjectedQueryModels {
    allSamplesModel: QueryModel;
    gridButtonProps?: SampleGridButtonProps;
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    sampleGridIds?: string[];
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
}

const FindSamplesByIdsTabbedGridPanelImpl: FC<FindSamplesByIdsTabProps> = memo(props => {
    const {
        actions,
        allSamplesModel,
        sampleGridIds,
        queryModels,
        gridButtons,
        gridButtonProps,
        samplesEditableGridProps,
    } = props;
    const { user } = useServerContext();

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
    }, [allSamplesModel, sampleGridIds, queryModels]);

    const showViewMenu = useCallback(
        gridId => {
            return gridId != allSamplesModel.id;
        },
        [allSamplesModel]
    );

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
                    ...gridButtonProps,
                    excludedMenuKeys: [SamplesEditButtonSections.IMPORT].concat(
                        gridButtonProps?.excludedMenuKeys ?? []
                    ),
                    metricFeatureArea: FIND_SAMPLE_BY_ID_METRIC_AREA,
                    excludeAddButton: true,
                }}
                tabbedGridPanelProps={{
                    alwaysShowTabs: true,
                    getAdvancedExportOptions,
                    exportFilename: 'SamplesFoundById',
                    getShowViewMenu: showViewMenu,
                }}
                showLabelOption={true}
                user={user}
            />
        </>
    );
});

const FindSamplesByIdsTabbedGridPanel: FC<FindSamplesByIdsTabProps> = memo(props => {
    const { actions, allSamplesModel, samplesEditableGridProps } = props;

    const [sampleGridIds, setSampleGridIds] = useState<string[]>(undefined);

    useEffect(() => {
        const gridIds = [];

        getSampleTypesFromFindByIdQuery(allSamplesModel.schemaQuery)
            .then(sampleTypesRows => {
                if (sampleTypesRows) {
                    Object.keys(sampleTypesRows).forEach(sampleType => {
                        const sampleSchemaQuery = new SchemaQuery(SCHEMAS.SAMPLE_SETS.SCHEMA, sampleType);

                        const sampleGridId = createGridModelId(
                            TYPE_GRID_PREFIX + allSamplesModel.queryName,
                            sampleSchemaQuery
                        );

                        // note: changed to using Name IN clause instead of RowId IN clause so that the filter
                        // will pass through to the Sample Finder via the FindDerivativesButton to match
                        // expected behavior there
                        const rows = sampleTypesRows[sampleType];
                        const sampleIds = rows.map(row => caseInsensitive(row, 'SampleID')?.value);
                        const filter = Filter.create('Name', sampleIds, Filter.Types.IN);

                        if (!sampleGridIds || sampleGridIds.indexOf(sampleGridId) === -1) {
                            const queryConfig = {
                                id: sampleGridId,
                                schemaQuery: sampleSchemaQuery,
                                requiredColumns: SAMPLE_STATUS_REQUIRED_COLUMNS.concat(
                                    samplesEditableGridProps?.samplesGridRequiredColumns ?? []
                                ),
                                baseFilters: [filter],
                                bindURL: false,
                                title: sampleType,
                                includeTotalCount: true,
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
                console.error('There was a problem retrieving sample types.');
            });
    }, [sampleGridIds, allSamplesModel.id]);

    if (!sampleGridIds) return <LoadingSpinner />;

    return <FindSamplesByIdsTabbedGridPanelImpl {...props} sampleGridIds={sampleGridIds} />;
});

interface OwnProps {
    gridButtonProps?: SampleGridButtonProps;
    gridButtons: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
}

type Props = OwnProps & InjectedQueryModels & WithRouterProps;

const FindSamplesByIdsPageBaseImpl: FC<Props> = memo(props => {
    const { queryModels, actions, location } = props;
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
        setError(undefined);
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
                    listSchemaQuery = new SchemaQuery(SCHEMAS.EXP_TABLES.SCHEMA, queryName);
                    // add model twice, one used for header, one for tabbed grid, so that header doesn't reload when switching tabs

                    const listId = createGridModelId('find-samples-by-id', listSchemaQuery);
                    setSampleListModelId(listId);

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
                                includeTotalCount: true,
                            },
                            true
                        );
                    });
                }
            })
            .catch(error => {
                setError(resolveErrorMessage(error));
                setMissingIds(undefined);
                setIds(undefined);
                setFindByIdsKey(undefined);
                setLoadingState(LoadingState.LOADED);
            });
    };

    const onFindSamples = (updatedKey: string) => {
        if (updatedKey !== findByIdsKey) {
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

export const FindSamplesByIdsPageBase = withQueryModels<OwnProps & WithRouterProps>(FindSamplesByIdsPageBaseImpl);

async function getSamplesIdsNotFound(queryName: string, orderedIds: string[]): Promise<string[]> {
    // Not try/caught as caller is expected to handle errors
    const result = await selectDistinctRows({
        column: 'Ordinal',
        queryName,
        schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
        sort: 'Ordinal',
    });

    // find the gaps in the ordinals values as these correspond to ids we could not find
    return findMissingValues(result.values, orderedIds);
}

function getFindSamplesByIdData(
    sessionKey: string
): Promise<{ ids: string[]; missingIds?: { [key: string]: string[] }; queryName: string }> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('experiment', 'saveOrderedSamplesQuery.api'),
            method: 'POST',
            jsonData: {
                sessionKey,
            },
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    const { queryName, ids } = response.data;
                    getSamplesIdsNotFound(queryName, ids)
                        .then(notFound => {
                            const missingIds = {
                                [UNIQUE_ID_FIND_FIELD.label]: notFound
                                    .filter(id => id.startsWith(UNIQUE_ID_FIND_FIELD.storageKeyPrefix))
                                    .map(id => id.substring(UNIQUE_ID_FIND_FIELD.storageKeyPrefix.length)),
                                [SAMPLE_ID_FIND_FIELD.label]: notFound
                                    .filter(id => id.startsWith(SAMPLE_ID_FIND_FIELD.storageKeyPrefix))
                                    .map(id => id.substring(SAMPLE_ID_FIND_FIELD.storageKeyPrefix.length)),
                            };
                            resolve({
                                queryName,
                                ids,
                                missingIds,
                            });
                        })
                        .catch(reason => {
                            console.error('Problem retrieving data about samples not found', reason);
                            resolve({
                                queryName,
                                ids,
                            });
                        });
                } else {
                    console.error('Unable to create session query');
                    reject('There was a problem retrieving the samples. Your session may have expired.');
                }
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error('There was a problem creating the query for the samples.', error);
                reject(
                    "There was a problem retrieving the samples. Please try again using the 'Find Samples' option from the Search menu."
                );
            }),
        });
    });
}
