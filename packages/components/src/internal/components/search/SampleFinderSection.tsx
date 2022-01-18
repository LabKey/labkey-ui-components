import React, { ComponentType, FC, memo, useCallback, useEffect, useState } from 'react';

import { ActionURL, AuditBehaviorTypes, Filter } from '@labkey/api';

import { capitalizeFirstChar } from '../../util/utils';
import { EntityDataType } from '../entities/models';
import { Section } from '../base/Section';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { SamplesTabbedGridPanel } from '../samples/SamplesTabbedGridPanel';
import { SAMPLE_DATA_EXPORT_CONFIG } from '../samples/constants';
import {
    InjectedQueryModels,
    RequiresModelAndActions,
    withQueryModels
} from '../../../public/QueryModel/withQueryModels';
import { User } from '../base/models/User';
import { SamplesEditableGridProps } from '../samples/SamplesEditableGrid';

import { EntityFieldFilterModal } from './EntityFieldFilterModal';

import { FilterProps, FilterCards } from './FilterCards';
import { getFinderStartText, getFinderViewColumnsConfig, getNextSampleFinderId } from './utils';
import { SamplesManageButtonSections } from '../samples/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { getSampleFinderQueryConfigs, removeFinderGridView, saveFinderGridView } from './actions';
import { Alert } from '../base/Alert';
import { SampleGridButtonProps } from '../samples/models';
import { List } from 'immutable';
import { QueryConfig } from '../../../public/QueryModel/QueryModel';
import { invalidateQueryDetailsCache } from '../../query/api';
import { getPrimaryAppProperties } from '../../app/utils';

const SAMPLE_FINDER_TITLE = 'Find Samples';
const SAMPLE_FINDER_CAPTION = 'Find samples that meet all the criteria defined below';

interface SampleFinderSamplesGridProps {
    user: User;
    getSampleAuditBehaviorType: () => AuditBehaviorTypes;
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
    excludedCreateMenuKeys?: List<string>;
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    gridButtonProps?: any;
}

interface Props extends SampleFinderSamplesGridProps {
    parentEntityDataTypes: EntityDataType[];
}

interface SampleFinderHeaderProps {
    parentEntityDataTypes: EntityDataType[];
    onAddEntity: (entityType: EntityDataType) => void;
}

export const SampleFinderHeaderButtons: FC<SampleFinderHeaderProps> = memo(props => {
    const { parentEntityDataTypes, onAddEntity } = props;

    return (
        <div>
            Search by:
            {parentEntityDataTypes.map(parentEntityType => (
                <button
                    key={parentEntityType.nounSingular}
                    className="btn btn-default margin-left"
                    onClick={() => {
                        onAddEntity(parentEntityType);
                    }}
                >
                    <i className="fa fa-plus-circle container--addition-icon" />{' '}
                    {capitalizeFirstChar(parentEntityType.nounAsParentSingular)} Properties
                </button>
            ))}
        </div>
    );
});


function getLocalStorageKey(): string {
    return getPrimaryAppProperties().productId + ActionURL.getContainer() + "-SampleFinder";
}

export const SampleFinderSection: FC<Props> = memo(props => {
    const { parentEntityDataTypes, ...gridProps } = props;

    const [finderId, setFinderId] = useState<number>(undefined);
    const [filterChangeCounter, setFilterChangeCounter] = useState<number>(0);
    const [chosenEntityType, setChosenEntityType] = useState<EntityDataType>(undefined);
    const [filters, setFilters] = useState<FilterProps[]>([]);

    useEffect(() => {
        const finderSessionDataStr = sessionStorage.getItem(getLocalStorageKey());
        if (finderSessionDataStr) {
            const finderSessionData = JSON.parse(finderSessionDataStr);
            if (finderSessionData.filters) {
                setFilters(finderSessionData.filters);
            }
            if (finderSessionData.finderId !== undefined) {
                setFinderId(finderSessionData.finderId);
            }
            else {
                setFinderId(getNextSampleFinderId());
            }
            if (finderSessionData.filterChangeCounter !== undefined) {
                setFilterChangeCounter(finderSessionData.filterChangeCounter);
            }
        }
    }, []);

    const getSelectionKeyPrefix = (): string => {
        return 'sampleFinder-' + finderId + '-' + filterChangeCounter;
    };

    const updateSessionStorage = (filterChangeCounter: number, filters: FilterProps[], finderId: number) => {
        sessionStorage.setItem(getLocalStorageKey(), JSON.stringify({
            filterChangeCounter,
            finderId,
            filters
        }));
    };

    const onAddEntity = useCallback((entityType: EntityDataType) => {
        setChosenEntityType(entityType);
    }, []);

    const onFilterEdit = useCallback(
        (index: number) => {
            setFilterChangeCounter(filterChangeCounter+1);
            setChosenEntityType(parentEntityDataTypes[index]);
            // TODO update filters as well
            updateSessionStorage(filterChangeCounter+1, filters, finderId);
        },
        [parentEntityDataTypes, filterChangeCounter, finderId]
    );

    const onFilterDelete = useCallback(
        (index: number) => {
            const newFilterCards = [...filters];
            newFilterCards.splice(index, 1);
            setFilters(newFilterCards);
            setFilterChangeCounter(filterChangeCounter+1);
            updateSessionStorage(filterChangeCounter+1, newFilterCards, finderId);
        },
        [filters, filterChangeCounter, finderId]
    );

    const onFilterClose = () => {
        setChosenEntityType(undefined);
        setFilterChangeCounter(filterChangeCounter+1);
    };

    const onFind = useCallback(
        (schemaQuery: SchemaQuery, filterArray: Filter.IFilter[]) => {
            const newFilterCards = [...filters];
            newFilterCards.push({
                schemaQuery,
                filterArray,
                entityDataType: chosenEntityType,
            });
            onFilterClose();
            setFilterChangeCounter(filterChangeCounter+1);
            setFilters(newFilterCards);
            updateSessionStorage(filterChangeCounter+1, newFilterCards, finderId);
        },
        [filters, finderId, onFilterEdit, onFilterDelete, chosenEntityType]
    );

    return (
        <Section
            title={SAMPLE_FINDER_TITLE}
            caption={SAMPLE_FINDER_CAPTION}
            context={
                <SampleFinderHeaderButtons parentEntityDataTypes={parentEntityDataTypes} onAddEntity={onAddEntity} />
            }
        >
            {filters.length == 0 ? (
                <>
                    <FilterCards
                        className="empty"
                        cards={parentEntityDataTypes.map(entityDataType => ({
                            entityDataType,
                        }))}
                        onAddEntity={onAddEntity}
                    />
                    <div className="filter-hint">{getFinderStartText(parentEntityDataTypes)}</div>
                </>
            ) : (
                <>
                    <FilterCards cards={filters} onFilterDelete={onFilterDelete} onAddEntity={onAddEntity}/>
                    <SampleFinderSamples {...gridProps} cards={filters} selectionKeyPrefix={getSelectionKeyPrefix()} filterChangeCounter={filterChangeCounter} />
                </>
            )}
            {chosenEntityType !== undefined && (
                <EntityFieldFilterModal onCancel={onFilterClose} entityDataType={chosenEntityType} onFind={onFind} />
            )}
        </Section>
    );
});

interface SampleFinderSamplesProps extends SampleFinderSamplesGridProps {
    cards: FilterProps[];
    filterChangeCounter: number;
    selectionKeyPrefix: string;
}

export const SampleFinderSamplesImpl: FC<SampleFinderSamplesGridProps & InjectedQueryModels> = memo(props => {
    const { actions, queryModels, gridButtons, excludedCreateMenuKeys } = props;
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const allModelsLoaded = Object.values(queryModels).filter(model => model.isLoading).length == 0;
        if (allModelsLoaded && isLoading) {
            const promises = [];
            Object.values(queryModels).forEach(queryModel => {
                const {hasUpdates, columns} = getFinderViewColumnsConfig(queryModel);
                if (hasUpdates) {
                    promises.push(saveFinderGridView(queryModel.schemaQuery, columns));
                }
            });
            Promise.all(promises).then((schemaQueries) => {
                // since we have updated views, we need to invalidate the details cache so we pick up the new views
                schemaQueries.forEach(schemaQuery => {
                    invalidateQueryDetailsCache(schemaQuery);
                });
                setIsLoading(false);
            }).catch(reason => {
                console.error("Error saving all finder views.", reason);
                setIsLoading(false);
            });
        }
    }, [queryModels]);


    useEffect(() => {
        return () => {
            if (queryModels) {
                for (const queryModel of Object.values(queryModels)) {
                    (async () => {
                        try {
                            await removeFinderGridView(queryModel);
                        }
                        catch (error) {
                            // ignore; already logged
                        }
                    })();
                }
            }
        }
    }, []);

    if (isLoading)
        return <LoadingSpinner />;

    return (
        <>
            <SamplesTabbedGridPanel
                {...props}
                withTitle={false}
                asPanel={false}
                actions={actions}
                queryModels={queryModels}
                excludedCreateMenuKeys={excludedCreateMenuKeys}
                gridButtons={gridButtons}
                gridButtonProps={{
                    excludedManageMenuKeys: [SamplesManageButtonSections.IMPORT],
                    excludeStartJob: true,
                }}
                tabbedGridPanelProps={{
                    alwaysShowTabs: true,
                    advancedExportOptions: SAMPLE_DATA_EXPORT_CONFIG,
                }}
            />
        </>
    );
});

const SampleFinderSamplesWithQueryModels = withQueryModels<SampleFinderSamplesGridProps>(SampleFinderSamplesImpl);

const SampleFinderSamples: FC<SampleFinderSamplesProps> = memo(props => {
    const { cards, selectionKeyPrefix, user, ...gridProps } = props;
    const [queryConfigs, setQueryConfigs] = useState<{ [key: string]: QueryConfig }>(undefined);
    const [errors, setErrors] = useState<string>(undefined);

    useEffect(() => {
        (async () => {
            try {
                setQueryConfigs(undefined);
                const configs = await getSampleFinderQueryConfigs(user, cards, selectionKeyPrefix);
                const promises = [];
                for (let config of Object.values(configs)) {
                    promises.push(saveFinderGridView(config.schemaQuery, [{fieldKey: "Name"}]));
                }
                Promise.all(promises).then((schemaQueries) => {
                    // schemaQueries.forEach(schemaQuery => {
                    //     invalidateQueryDetailsCache(schemaQuery);
                    // });
                    setQueryConfigs(configs);
                });
            }
            catch (error) {
                setErrors(error);
            }
        })();
    }, [cards, user, selectionKeyPrefix])

    if (errors)
        return <Alert>{errors}</Alert>;

    if (!queryConfigs)
        return <LoadingSpinner/>;

    return <SampleFinderSamplesWithQueryModels key={selectionKeyPrefix} user={user} {...gridProps} autoLoad queryConfigs={queryConfigs} />;
});
