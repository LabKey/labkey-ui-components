import React, { ComponentType, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AuditBehaviorTypes } from '@labkey/api';

import { capitalizeFirstChar } from '../../util/utils';
import { EntityDataType } from '../entities/models';
import { Section } from '../base/Section';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { SamplesTabbedGridPanel } from '../samples/SamplesTabbedGridPanel';
import { SAMPLE_DATA_EXPORT_CONFIG } from '../samples/constants';
import { User } from '../base/models/User';
import { SamplesEditableGridProps } from '../samples/SamplesEditableGrid';

import { SamplesEditButtonSections } from '../samples/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { Alert } from '../base/Alert';
import { SampleGridButtonProps } from '../samples/models';
import { invalidateQueryDetailsCache } from '../../query/api';

import { getAllEntityTypeOptions } from '../entities/actions';

import { formatDateTime } from '../../util/Date';

import { useAppContext } from '../../AppContext';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import {
    InjectedQueryModels,
    QueryConfigMap,
    RequiresModelAndActions,
    withQueryModels,
} from '../../../public/QueryModel/withQueryModels';

import { InjectedAssayModel, withAssayModels } from '../assay/withAssayModels';

import { getAssayDefinitionsWithResultSampleLookup } from '../assay/actions';

import { isLoading } from '../../../public/LoadingState';

import { AssayResultDataType } from '../entities/constants';

import { loadFinderSearch, removeFinderGridView, saveFinderGridView, saveFinderSearch } from './actions';
import { FilterCards } from './FilterCards';
import {
    getFinderStartText,
    getFinderViewColumnsConfig,
    getLocalStorageKey,
    getSampleFinderColumnNames,
    getSampleFinderQueryConfigs,
    getSearchFilterObjs,
    SAMPLE_FILTER_METRIC_AREA,
    SAMPLE_FINDER_VIEW_NAME,
    searchFiltersFromJson,
    searchFiltersToJson,
} from './utils';
import { EntityFieldFilterModal } from './EntityFieldFilterModal';

import { FieldFilter, FilterProps, FinderReport } from './models';
import { SampleFinderSavedViewsMenu } from './SampleFinderSavedViewsMenu';
import { SampleFinderSaveViewModal } from './SampleFinderSaveViewModal';
import { SampleFinderManageViewsModal } from './SampleFinderManageViewsModal';

interface SampleFinderSamplesGridProps {
    columnDisplayNames?: { [key: string]: string };
    getIsDirty?: () => boolean;
    getSampleAuditBehaviorType: () => AuditBehaviorTypes;
    gridButtonProps?: SampleGridButtonProps;
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    sampleTypeNames: string[];
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
    setIsDirty?: (isDirty: boolean) => void;
    user: User;
}

interface Props extends SampleFinderSamplesGridProps {
    clearSessionView?: boolean;
    parentEntityDataTypes: EntityDataType[];
}

interface SampleFinderHeaderProps {
    enabledEntityTypes: string[];
    onAddEntity: (entityType: EntityDataType) => void;
    parentEntityDataTypes: EntityDataType[];
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

export const SampleFinderSectionImpl: FC<Props & InjectedAssayModel> = memo(props => {
    const { assayModel, sampleTypeNames, parentEntityDataTypes, clearSessionView, ...gridProps } = props;

    const [filterChangeCounter, setFilterChangeCounter] = useState<number>(0);
    const [savedViewChangeCounter, setSavedViewChangeCounter] = useState<number>(0);
    const [currentView, setCurrentView] = useState<FinderReport>(undefined);
    const [chosenEntityType, setChosenEntityType] = useState<EntityDataType>(undefined);
    const [filters, setFilters] = useState<FilterProps[]>([]);
    const [chosenQueryName, setChosenQueryName] = useState<string>(undefined);
    const [chosenField, setChosenField] = useState<string>(undefined);
    const [enabledEntityTypes, setEnabledEntityTypes] = useState<string[]>([]);
    const [cardDirty, setCardDirty] = useState<boolean>(false); // EntityFieldModal dirty, but Find is not yet clicked
    const [viewDirty, setViewDirty] = useState<boolean>(false); // Find is clicked
    const [showSaveViewDialog, setShowSaveViewDialog] = useState<boolean>(false);
    const [showManageViewsDialog, setShowManageViewsDialog] = useState<boolean>(false);
    const [unsavedSessionViewName, setUnsavedSessionViewName] = useState<string>(undefined);
    const [assaySampleIdCols, setAssaySampleIdCols] = useState<{ [key: string]: string }>();

    const { api } = useAppContext();
    const { createNotification } = useNotificationsContext();

    useEffect(() => {
        const _enabledEntityTypes = [];
        if (isLoading(assayModel.definitionsLoadingState)) return;

        const assaySampleCols = getAssayDefinitionsWithResultSampleLookup(assayModel, 'general');
        getAllEntityTypeOptions(parentEntityDataTypes)
            .then(entityOptions => {
                Object.keys(entityOptions).forEach(key => {
                    if (entityOptions[key].length)
                    {
                        if (key === AssayResultDataType.typeListingSchemaQuery.queryName)
                        {
                            let hasSampleIdCol = false;
                            entityOptions[key].forEach(assay => {
                                if (!hasSampleIdCol && assaySampleCols[assay.value])
                                {
                                    hasSampleIdCol = true;
                                }
                            });

                            if (!hasSampleIdCol) return;
                        }
                        _enabledEntityTypes.push(key);
                    }
                });
                setAssaySampleIdCols(assaySampleCols);
                setEnabledEntityTypes(_enabledEntityTypes);
            })
            .catch(error => {
                console.error(error);
                setEnabledEntityTypes(_enabledEntityTypes);
            });

        if (clearSessionView) {
            sessionStorage.removeItem(getLocalStorageKey());
            return;
        }

        const finderSessionDataStr = sessionStorage.getItem(getLocalStorageKey());
        if (finderSessionDataStr) {
            const finderSessionData = searchFiltersFromJson(finderSessionDataStr);
            if (finderSessionData?.filters?.length > 0 && finderSessionData?.filterTimestamp) {
                setUnsavedSessionViewName(finderSessionData.filterTimestamp);
            }
        }
    }, [assayModel.definitions]);

    const updateFilters = useCallback(
        (changeCounter: number, filterProps: FilterProps[], updateSession: boolean, isViewDirty: boolean) => {
            setFilters(filterProps);
            setFilterChangeCounter(changeCounter);
            setViewDirty(isViewDirty);
            if (updateSession) {
                const currentTimestamp = new Date();
                sessionStorage.setItem(
                    getLocalStorageKey(),
                    searchFiltersToJson(filterProps, changeCounter, currentTimestamp)
                );
                setUnsavedSessionViewName('Searched ' + formatDateTime(currentTimestamp));
            }
        },
        []
    );

    const onAddEntity = useCallback((entityType: EntityDataType) => {
        setChosenQueryName(undefined);
        setChosenField(undefined);
        setChosenEntityType(entityType);
    }, []);

    const onFilterEdit = useCallback(
        (index: number) => {
            const selectedCard = filters[index];
            setChosenEntityType(selectedCard.entityDataType);

            let queryName = selectedCard.schemaQuery.queryName;
            if (selectedCard.entityDataType.getInstanceDataType)
                queryName = selectedCard.entityDataType.getInstanceDataType(selectedCard.schemaQuery);

            setChosenQueryName(queryName);
        },
        [filters]
    );

    const onFilterValueExpand = useCallback(
        (index: number, fieldFilter: FieldFilter) => {
            onFilterEdit(index);
            setChosenField(fieldFilter.fieldKey);
        },
        [onFilterEdit]
    );

    const onFilterDelete = useCallback(
        (index: number) => {
            const newFilterCards = [...filters];
            newFilterCards.splice(index, 1);
            if (currentView && newFilterCards?.length === 0) {
                updateFilters(filterChangeCounter + 1, newFilterCards, !currentView?.entityId, false);
                setCurrentView(undefined);
            } else {
                updateFilters(filterChangeCounter + 1, newFilterCards, !currentView?.entityId, true);
            }
        },
        [filters, filterChangeCounter, currentView, updateFilters]
    );

    const onFilterClose = useCallback(() => {
        setChosenEntityType(undefined);
        setChosenQueryName(undefined);
        setChosenField(undefined);
        setCardDirty(false);
    }, []);

    const onFind = useCallback(
        (
            entityDataType: EntityDataType,
            dataTypeFilters: { [key: string]: FieldFilter[] },
            queryLabels: { [key: string]: string }
        ) => {
            if (!cardDirty) {
                onFilterClose();
                return;
            }

            const schemaName = entityDataType.instanceSchemaName;
            const isAssay = schemaName === AssayResultDataType.instanceSchemaName;
            const newFilterCards = [...filters].filter(filter => {
                return filter.entityDataType.instanceSchemaName !== chosenEntityType.instanceSchemaName;
            });
            Object.keys(dataTypeFilters).forEach(queryName => {
                newFilterCards.push({
                    schemaQuery: isAssay
                        ? entityDataType.getInstanceSchemaQuery(queryName)
                        : SchemaQuery.create(schemaName, queryLabels[queryName]),
                    filterArray: dataTypeFilters[queryName],
                    entityDataType: chosenEntityType,
                    dataTypeDisplayName: queryLabels[queryName],
                    targetColumnFieldKey: isAssay ? assaySampleIdCols[queryName] : undefined,
                });
            });

            onFilterClose();
            updateFilters(filterChangeCounter + 1, newFilterCards, !currentView?.entityId, true);

            api.query.incrementClientSideMetricCount(SAMPLE_FILTER_METRIC_AREA, 'filterModalApply');
        },
        [
            cardDirty,
            filters,
            onFilterClose,
            updateFilters,
            filterChangeCounter,
            currentView?.entityId,
            api.query,
            chosenEntityType,
        ]
    );

    const loadSearch = useCallback(
        async (view: FinderReport) => {
            let cardJson = null;

            if (view.isSession) cardJson = sessionStorage.getItem(getLocalStorageKey());
            else if (view.reportId) {
                try {
                    cardJson = await loadFinderSearch(view);
                } catch (error) {
                    console.error(error);
                    createNotification({
                        alertClass: 'danger',
                        message:
                            "Unable to load saved view '" +
                            view.reportName +
                            "'. " +
                            (error.exception ? error.exception : ''),
                    });
                    return;
                }
            }
            if (!cardJson) return;

            const finderSessionData = searchFiltersFromJson(cardJson);
            const newFilters = finderSessionData.filters;
            if (!newFilters) return;

            updateFilters(filterChangeCounter + 1, newFilters, false, view.isSession);
            setShowSaveViewDialog(false);
            setCurrentView(view);
        },
        [createNotification, filterChangeCounter, updateFilters]
    );

    const onSaveComplete = useCallback((view: FinderReport) => {
        setShowSaveViewDialog(false);
        setViewDirty(false);
        setCurrentView(view);
        setSavedViewChangeCounter(counter => counter + 1);
    }, []);

    const searchViewJson = useMemo(() => {
        return JSON.stringify({
            filters: getSearchFilterObjs(filters),
        });
    }, [filters]);

    const saveSearch = useCallback(
        async (saveCurrentName?: boolean) => {
            try {
                if (saveCurrentName) {
                    await saveFinderSearch(currentView, searchViewJson, saveCurrentName);
                    setViewDirty(false);
                } else {
                    setShowSaveViewDialog(true);
                }
            } catch (error) {
                console.error(error);
                createNotification({
                    alertClass: 'danger',
                    message: 'Unable to save view. ' + (error.exception ? error.exception : ''),
                });
            }
        },
        [createNotification, currentView, searchViewJson]
    );

    const manageSearches = useCallback(() => {
        setShowManageViewsDialog(true);
    }, []);

    const onManageSearchesDone = useCallback((hasChange: boolean) => {
        setShowManageViewsDialog(false);
        if (hasChange) {
            setSavedViewChangeCounter(counter => counter + 1);
        }
    }, []);

    return (
        <Section
            title={
                <SampleFinderSavedViewsMenu
                    loadSearch={loadSearch}
                    saveSearch={saveSearch}
                    manageSearches={manageSearches}
                    currentView={currentView}
                    hasUnsavedChanges={viewDirty}
                    sessionViewName={unsavedSessionViewName}
                    key={filterChangeCounter + '-' + savedViewChangeCounter}
                />
            }
            titleSize="small"
            context={
                <SampleFinderHeaderButtons
                    parentEntityDataTypes={parentEntityDataTypes}
                    onAddEntity={onAddEntity}
                    enabledEntityTypes={enabledEntityTypes}
                />
            }
        >
            {filters.length === 0 ? (
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
                        selectionKeyPrefix={`sampleFinder-${filterChangeCounter}`}
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
                    setCardDirty={setCardDirty}
                    assaySampleIdCols={assaySampleIdCols}
                />
            )}
            {showSaveViewDialog && (
                <SampleFinderSaveViewModal
                    cardsJson={searchViewJson}
                    onCancel={() => setShowSaveViewDialog(false)}
                    onSuccess={onSaveComplete}
                    currentView={currentView}
                />
            )}
            {showManageViewsDialog && (
                <SampleFinderManageViewsModal onDone={onManageSearchesDone} currentView={currentView} />
            )}
        </Section>
    );
});

export const SampleFinderSection = withAssayModels(SampleFinderSectionImpl);

interface SampleFinderSamplesProps extends SampleFinderSamplesGridProps {
    cards: FilterProps[];
    filterChangeCounter: number;
    selectionKeyPrefix: string;
}

export const SampleFinderSamplesImpl: FC<SampleFinderSamplesGridProps & InjectedQueryModels> = memo(props => {
    const { actions, columnDisplayNames, queryModels, gridButtons, gridButtonProps } = props;
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

    const getAdvancedExportOptions = useCallback(
        (tabId: string): { [key: string]: any } => {
            const columnLabels = queryModels[tabId]?.queryInfo?.getView(SAMPLE_FINDER_VIEW_NAME.toLowerCase())?.columns;
            const advancedExportOptions = { ...SAMPLE_DATA_EXPORT_CONFIG, 'exportAlias.SampleSet': 'Sample Type' };
            if (columnLabels)
                columnLabels.forEach(columnLabel => {
                    if (columnLabel.title)
                        advancedExportOptions['exportAlias.' + columnLabel.fieldKey] = columnLabel.title;
                });
            return advancedExportOptions;
        },
        [queryModels]
    );

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
                    ...gridButtonProps,
                    excludedMenuKeys: [SamplesEditButtonSections.IMPORT],
                    metricFeatureArea: SAMPLE_FILTER_METRIC_AREA,
                }}
                tabbedGridPanelProps={{
                    alwaysShowTabs: true,
                    getAdvancedExportOptions,
                    exportFilename: 'Samples',
                    allowViewCustomization: false,
                    showViewMenu: false,
                }}
                showLabelOption
            />
        </>
    );
});

const SampleFinderSamplesWithQueryModels = withQueryModels<SampleFinderSamplesGridProps>(SampleFinderSamplesImpl);

const SampleFinderSamples: FC<SampleFinderSamplesProps> = memo(props => {
    const { cards, sampleTypeNames, selectionKeyPrefix, user, ...gridProps } = props;
    const [queryConfigs, setQueryConfigs] = useState<QueryConfigMap>(undefined);
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
