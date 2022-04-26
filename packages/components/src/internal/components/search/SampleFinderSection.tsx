import React, { ComponentType, FC, memo, useCallback, useEffect, useState } from 'react';

import { ActionURL, AuditBehaviorTypes } from '@labkey/api';

import { List } from 'immutable';

import { capitalizeFirstChar } from '../../util/utils';
import { EntityDataType } from '../entities/models';
import { Section } from '../base/Section';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { SamplesTabbedGridPanel } from '../samples/SamplesTabbedGridPanel';
import { SAMPLE_DATA_EXPORT_CONFIG } from '../samples/constants';
import {
    InjectedQueryModels,
    RequiresModelAndActions,
    withQueryModels,
} from '../../../public/QueryModel/withQueryModels';
import { User } from '../base/models/User';
import { SamplesEditableGridProps } from '../samples/SamplesEditableGrid';

import { SamplesEditButtonSections } from '../samples/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { Alert } from '../base/Alert';
import { SampleGridButtonProps } from '../samples/models';
import { QueryConfig } from '../../../public/QueryModel/QueryModel';
import { invalidateQueryDetailsCache } from '../../query/api';
import { getPrimaryAppProperties } from '../../app/utils';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { getAllEntityTypeOptions } from '../entities/actions';

import { removeFinderGridView, saveFinderGridView } from './actions';
import { FilterCards } from './FilterCards';
import {
    getFinderStartText,
    getFinderViewColumnsConfig,
    getSampleFinderColumnNames,
    getSampleFinderQueryConfigs,
    SAMPLE_FILTER_METRIC_AREA,
    searchFiltersFromJson,
    searchFiltersToJson,
} from './utils';
import { EntityFieldFilterModal } from './EntityFieldFilterModal';

import { FieldFilter, FilterProps } from './models';

const SAMPLE_FINDER_TITLE = 'Sample Finder';
const SAMPLE_FINDER_CAPTION = 'Find all generations of samples that meet all the criteria defined below';

interface SampleFinderSamplesGridProps {
    columnDisplayNames?: { [key: string]: string };
    user: User;
    getSampleAuditBehaviorType: () => AuditBehaviorTypes;
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    gridButtonProps?: any;
    sampleTypeNames: string[];
}

interface Props extends SampleFinderSamplesGridProps {
    api?: ComponentsAPIWrapper;
    parentEntityDataTypes: EntityDataType[];
}

interface SampleFinderHeaderProps {
    parentEntityDataTypes: EntityDataType[];
    onAddEntity: (entityType: EntityDataType) => void;
    enabledEntityTypes: string[];
}

export const SampleFinderHeaderButtons: FC<SampleFinderHeaderProps> = memo(props => {
    const { parentEntityDataTypes, onAddEntity, enabledEntityTypes } = props;

    return (
        <div>
            Find by:
            {parentEntityDataTypes.map(parentEntityType => (
                <button
                    key={parentEntityType.nounSingular}
                    className="btn btn-default margin-left"
                    onClick={() => {
                        onAddEntity(parentEntityType);
                    }}
                    disabled={enabledEntityTypes.indexOf(parentEntityType.typeListingSchemaQuery.queryName) == -1}
                >
                    <i className="fa fa-plus-circle container--addition-icon" />{' '}
                    {capitalizeFirstChar(parentEntityType.nounAsParentSingular)} Properties
                </button>
            ))}
        </div>
    );
});

function getLocalStorageKey(): string {
    return getPrimaryAppProperties().productId + ActionURL.getContainer() + '-SampleFinder';
}

export const SampleFinderSection: FC<Props> = memo(props => {
    const { api, sampleTypeNames, parentEntityDataTypes, ...gridProps } = props;

    const [filterChangeCounter, setFilterChangeCounter] = useState<number>(0);
    const [chosenEntityType, setChosenEntityType] = useState<EntityDataType>(undefined);
    const [filters, setFilters] = useState<FilterProps[]>([]);
    const [chosenQueryName, setChosenQueryName] = useState<string>(undefined);
    const [chosenField, setChosenField] = useState<string>(undefined);
    const [enabledEntityTypes, setEnabledEntityTypes] = useState<string[]>([]);

    useEffect(() => {
        const finderSessionDataStr = sessionStorage.getItem(getLocalStorageKey());
        if (finderSessionDataStr) {
            const finderSessionData = searchFiltersFromJson(finderSessionDataStr);
            if (finderSessionData.filters) {
                setFilters(finderSessionData.filters);
            }
            if (finderSessionData.filterChangeCounter !== undefined) {
                setFilterChangeCounter(finderSessionData.filterChangeCounter);
            }
        }
    }, []);

    useEffect(() => {
        const _enabledEntityTypes = [];
        (async () => {
            try {
                const entityOptions = await getAllEntityTypeOptions(parentEntityDataTypes);
                Object.keys(entityOptions).forEach(key => {
                    if (entityOptions[key].length) {
                        _enabledEntityTypes.push(key);
                    }
                });
                setEnabledEntityTypes(_enabledEntityTypes);
            } catch {
                setEnabledEntityTypes(_enabledEntityTypes);
            }
        })();
    }, []);

    const getSelectionKeyPrefix = (): string => {
        return 'sampleFinder-' + filterChangeCounter;
    };

    const updateFilters = (filterChangeCounter: number, filters: FilterProps[]) => {
        setFilters(filters);
        setFilterChangeCounter(filterChangeCounter);
        sessionStorage.setItem(getLocalStorageKey(), searchFiltersToJson(filters, filterChangeCounter));
    };

    const onAddEntity = useCallback((entityType: EntityDataType) => {
        setChosenQueryName(undefined);
        setChosenField(undefined);
        setChosenEntityType(entityType);
    }, []);

    const onFilterEdit = useCallback(
        (index: number) => {
            const selectedCard = filters[index];
            setChosenEntityType(selectedCard.entityDataType);
            setChosenQueryName(selectedCard.schemaQuery.queryName);
        },
        [filters]
    );

    const onFilterValueExpand = useCallback(
        (index: number, fieldFilter: FieldFilter) => {
            onFilterEdit(index);
            setChosenField(fieldFilter.fieldKey);
        },
        [filters]
    );

    const onFilterDelete = useCallback(
        (index: number) => {
            const newFilterCards = [...filters];
            newFilterCards.splice(index, 1);
            updateFilters(filterChangeCounter + 1, newFilterCards);
        },
        [filters, filterChangeCounter]
    );

    const onFilterClose = () => {
        setChosenEntityType(undefined);
        setChosenQueryName(undefined);
        setChosenField(undefined);
    };

    const onFind = useCallback(
        (
            schemaName: string,
            dataTypeFilters: { [key: string]: FieldFilter[] },
            queryLabels: { [key: string]: string }
        ) => {
            const newFilterCards = [...filters].filter(filter => {
                return filter.entityDataType.instanceSchemaName !== chosenEntityType.instanceSchemaName;
            });
            Object.keys(dataTypeFilters).forEach(queryName => {
                newFilterCards.push({
                    schemaQuery: SchemaQuery.create(schemaName, queryLabels[queryName]),
                    filterArray: dataTypeFilters[queryName],
                    entityDataType: chosenEntityType,
                    dataTypeDisplayName: queryLabels[queryName],
                });
            });

            onFilterClose();
            updateFilters(filterChangeCounter + 1, newFilterCards);

            api.query.incrementClientSideMetricCount(SAMPLE_FILTER_METRIC_AREA, 'filterModalApply');
        },
        [filters, filterChangeCounter, onFilterEdit, onFilterDelete, chosenEntityType]
    );

    return (
        <Section
            title={SAMPLE_FINDER_TITLE}
            caption={SAMPLE_FINDER_CAPTION}
            context={
                <SampleFinderHeaderButtons
                    parentEntityDataTypes={parentEntityDataTypes}
                    onAddEntity={onAddEntity}
                    enabledEntityTypes={enabledEntityTypes}
                />
            }
        >
            {filters.length == 0 ? (
                <>
                    <FilterCards
                        className="empty"
                        cards={parentEntityDataTypes.map(entityDataType => ({
                            entityDataType,
                            disabled:
                                enabledEntityTypes.indexOf(entityDataType.typeListingSchemaQuery.queryName) === -1,
                        }))}
                        onAddEntity={onAddEntity}
                    />
                    <div className="filter-hint">{getFinderStartText(parentEntityDataTypes, enabledEntityTypes)}</div>
                </>
            ) : (
                <>
                    <FilterCards
                        cards={filters}
                        onFilterDelete={onFilterDelete}
                        onFilterEdit={onFilterEdit}
                        onFilterValueExpand={onFilterValueExpand}
                        onAddEntity={onAddEntity}
                    />
                    <SampleFinderSamples
                        {...gridProps}
                        cards={filters}
                        sampleTypeNames={sampleTypeNames}
                        selectionKeyPrefix={getSelectionKeyPrefix()}
                        filterChangeCounter={filterChangeCounter}
                    />
                </>
            )}
            {chosenEntityType !== undefined && (
                <EntityFieldFilterModal
                    onCancel={onFilterClose}
                    cards={filters}
                    entityDataType={chosenEntityType}
                    onFind={onFind}
                    queryName={chosenQueryName}
                    fieldKey={chosenField}
                    metricFeatureArea={SAMPLE_FILTER_METRIC_AREA}
                />
            )}
        </Section>
    );
});

SampleFinderSection.defaultProps = {
    api: getDefaultAPIWrapper(),
};

interface SampleFinderSamplesProps extends SampleFinderSamplesGridProps {
    cards: FilterProps[];
    filterChangeCounter: number;
    selectionKeyPrefix: string;
}

export const SampleFinderSamplesImpl: FC<SampleFinderSamplesGridProps & InjectedQueryModels> = memo(props => {
    const { actions, columnDisplayNames, queryModels, gridButtons } = props;
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const allModelsLoaded = Object.values(queryModels).filter(model => model.isLoading).length == 0;
        if (allModelsLoaded && isLoading) {
            const promises = [];
            Object.values(queryModels).forEach(queryModel => {
                const { hasUpdates, columns } = getFinderViewColumnsConfig(queryModel, columnDisplayNames);
                if (hasUpdates) {
                    promises.push(saveFinderGridView(queryModel.schemaQuery, columns));
                }
            });
            try {
                Promise.all(promises)
                    .then(schemaQueries => {
                        // since we have updated views, we need to invalidate the details cache so we pick up the new views
                        schemaQueries.forEach(schemaQuery => {
                            invalidateQueryDetailsCache(schemaQuery);
                        });
                        setIsLoading(false);
                    })
                    .catch(reason => {
                        console.error('Error saving all finder views.', reason);
                        setIsLoading(false);
                    });
            } catch (error) {
                // ignore: already logged
            }
        }
    }, [queryModels]);

    useEffect(() => {
        return () => {
            if (queryModels) {
                for (const queryModel of Object.values(queryModels)) {
                    (async () => {
                        try {
                            await removeFinderGridView(queryModel);
                        } catch (error) {
                            // ignore; already logged
                        }
                    })();
                }
            }
        };
    }, []);

    const afterSampleActionComplete = useCallback((): void => {
        actions.loadAllModels();
    }, [actions]);

    if (isLoading) return <LoadingSpinner />;

    return (
        <>
            <SamplesTabbedGridPanel
                {...props}
                withTitle={false}
                afterSampleActionComplete={afterSampleActionComplete}
                asPanel={false}
                actions={actions}
                queryModels={queryModels}
                gridButtons={gridButtons}
                gridButtonProps={{
                    excludedMenuKeys: [SamplesEditButtonSections.IMPORT],
                    metricFeatureArea: SAMPLE_FILTER_METRIC_AREA,
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
    const { cards, sampleTypeNames, selectionKeyPrefix, user, ...gridProps } = props;
    const [queryConfigs, setQueryConfigs] = useState<{ [key: string]: QueryConfig }>(undefined);
    const [errors, setErrors] = useState<string>(undefined);

    useEffect(() => {
        setQueryConfigs(undefined);
        const configs = getSampleFinderQueryConfigs(user, sampleTypeNames, cards, selectionKeyPrefix);
        const promises = [];
        for (const config of Object.values(configs)) {
            promises.push(saveFinderGridView(config.schemaQuery, [{ fieldKey: 'Name' }]));
        }
        Promise.all(promises)
            .then(() => {
                setQueryConfigs(configs);
            })
            .catch(reason => {
                setErrors(reason);
            });
    }, [cards, user, sampleTypeNames, selectionKeyPrefix]);

    if (errors) return <Alert>{errors}</Alert>;

    if (!queryConfigs || !sampleTypeNames) return <LoadingSpinner />;

    return (
        <SampleFinderSamplesWithQueryModels
            columnDisplayNames={getSampleFinderColumnNames(cards)}
            sampleTypeNames={sampleTypeNames}
            key={selectionKeyPrefix}
            user={user}
            {...gridProps}
            autoLoad
            queryConfigs={queryConfigs}
        />
    );
});
