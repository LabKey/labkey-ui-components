import React, { ComponentType, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { AuditBehaviorTypes } from '@labkey/api';

import { Location } from '../internal/util/URL';
import { capitalizeFirstChar } from '../internal/util/utils';
import { EntityDataType } from '../internal/components/entities/models';
import { Section } from '../internal/components/base/Section';
import { SchemaQuery } from '../public/SchemaQuery';

import { SAMPLE_DATA_EXPORT_CONFIG } from '../internal/components/samples/constants';
import { User } from '../internal/components/base/models/User';

import { SamplesEditButtonSections } from '../internal/components/samples/utils';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { Alert } from '../internal/components/base/Alert';
import { SampleGridButtonProps } from '../internal/components/samples/models';
import { invalidateQueryDetailsCache } from '../internal/query/api';

import { getAllEntityTypeOptions } from '../internal/components/entities/actions';

import { formatDateTime } from '../internal/util/Date';

import { useAppContext } from '../internal/AppContext';

import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';

import {
    InjectedQueryModels,
    QueryConfigMap,
    RequiresModelAndActions,
    withQueryModels,
} from '../public/QueryModel/withQueryModels';

import { InjectedAssayModel, withAssayModels } from '../internal/components/assay/withAssayModels';

import { isLoading } from '../public/LoadingState';

import { AssayResultDataType } from '../internal/components/entities/constants';

import {
    loadFinderSearch,
    removeFinderGridView,
    saveFinderGridView,
    saveFinderSearch,
} from '../internal/components/search/actions';
import { FilterCards } from '../internal/components/search/FilterCards';

import {
    getFinderStartText,
    getFinderViewColumnsConfig,
    getSampleFinderColumnNames,
    getSampleFinderQueryConfigs,
    getSearchFilterObjs,
    SAMPLE_FILTER_METRIC_AREA,
    SAMPLE_FINDER_VIEW_NAME,
    searchFiltersFromJson,
    searchFiltersToJson,
} from '../internal/components/search/utils';

import { FieldFilter, FilterProps, FinderReport } from '../internal/components/search/models';
import { SAMPLE_FINDER_SESSION_PREFIX } from '../internal/components/search/constants';
import { AssayStateModel } from '../internal/components/assay/models';
import { AssayDomainTypes } from '../internal/AssayDefinitionModel';
import { AssaySampleColumnProp, SamplesEditableGridProps } from '../internal/sampleModels';

import { COLUMN_NOT_IN_FILTER_TYPE } from '../internal/query/filter';

import { getSampleFinderLocalStorageKey } from './utils';
import { EntityFieldFilterModal } from './EntityFieldFilterModal';

import { SampleFinderSavedViewsMenu } from './SampleFinderSavedViewsMenu';
import { SampleFinderSaveViewModal } from './SampleFinderSaveViewModal';
import { SampleFinderManageViewsModal } from './SampleFinderManageViewsModal';

import { SamplesTabbedGridPanel } from './SamplesTabbedGridPanel';

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
    location: Location;
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

const SampleFinderSectionImpl: FC<Props & InjectedAssayModel> = memo(props => {
    const { assayModel, sampleTypeNames, parentEntityDataTypes, clearSessionView, location, ...gridProps } = props;

    const [filterChangeCounter, setFilterChangeCounter] = useState<number>(0);
    const [savedViewChangeCounter, setSavedViewChangeCounter] = useState<number>(0);
    const [currentView, setCurrentView] = useState<FinderReport>(undefined);
    const [chosenEntityType, setChosenEntityType] = useState<EntityDataType>(undefined);
    const [filters, setFilters] = useState<FilterProps[]>([]);
    const [chosenQueryName, setChosenQueryName] = useState<string>(undefined);
    const [chosenField, setChosenField] = useState<string>(undefined);
    const [enabledEntityTypes, setEnabledEntityTypes] = useState<string[]>(undefined);
    const [cardDirty, setCardDirty] = useState<boolean>(false); // EntityFieldModal dirty, but Find is not yet clicked
    const [viewDirty, setViewDirty] = useState<boolean>(false); // Find is clicked
    const [showSaveViewDialog, setShowSaveViewDialog] = useState<boolean>(false);
    const [showManageViewsDialog, setShowManageViewsDialog] = useState<boolean>(false);
    const [unsavedSessionViewName, setUnsavedSessionViewName] = useState<string>(undefined);
    const [assaySampleIdCols, setAssaySampleIdCols] = useState<{ [key: string]: AssaySampleColumnProp }>(undefined);

    const { api } = useAppContext();
    const { createNotification } = useNotificationsContext();

    useEffect(() => {
        const _enabledEntityTypes = [];
        if (isLoading(assayModel.definitionsLoadingState)) return;

        const assaySampleCols = getAssayDefinitionsWithResultSampleLookup(assayModel, 'general');
        setAssaySampleIdCols(assaySampleCols);
        getAllEntityTypeOptions(parentEntityDataTypes)
            .then(entityOptions => {
                Object.keys(entityOptions).forEach(key => {
                    if (entityOptions[key].length) {
                        if (key === AssayResultDataType.typeListingSchemaQuery.queryName) {
                            const hasSampleIdCol = entityOptions[key].some(assay => !!assaySampleCols[assay.value]);
                            if (!hasSampleIdCol) return;
                        }
                        _enabledEntityTypes.push(key);
                    }
                });
                setEnabledEntityTypes(_enabledEntityTypes);
            })
            .catch(error => {
                console.error(error);
                setEnabledEntityTypes(_enabledEntityTypes);
            });

        if (clearSessionView) {
            sessionStorage.removeItem(getSampleFinderLocalStorageKey());
            return;
        }

        const finderSessionDataStr = sessionStorage.getItem(getSampleFinderLocalStorageKey());
        if (finderSessionDataStr) {
            const finderSessionData = searchFiltersFromJson(finderSessionDataStr, assaySampleCols);
            if (finderSessionData?.filters?.length > 0 && finderSessionData?.filterTimestamp) {
                setUnsavedSessionViewName(finderSessionData.filterTimestamp);
            }
        }
    }, [assayModel.definitionsLoadingState, assayModel.definitions, parentEntityDataTypes, clearSessionView]);

    const updateFilters = useCallback(
        (changeCounter: number, filterProps: FilterProps[], updateSession: boolean, isViewDirty: boolean) => {
            setFilters(filterProps);
            setFilterChangeCounter(changeCounter);
            setViewDirty(isViewDirty);
            if (updateSession) {
                const currentTimestamp = new Date();
                sessionStorage.setItem(
                    getSampleFinderLocalStorageKey(),
                    searchFiltersToJson(filterProps, changeCounter, currentTimestamp)
                );
                setUnsavedSessionViewName(SAMPLE_FINDER_SESSION_PREFIX + formatDateTime(currentTimestamp));
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
                setCurrentView(null); // using null to not trigger the reload of a url report name
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
            let assayDesignCount = 0;
            let hasWithoutAssayResultFilter = false;
            const newFilterCards = [...filters].filter(filter => {
                return filter.entityDataType.instanceSchemaName !== chosenEntityType.instanceSchemaName;
            });
            Object.keys(dataTypeFilters).forEach(queryName => {
                if (isAssay) {
                    assayDesignCount++;

                    const filters = dataTypeFilters[queryName];
                    if (!filters || filters.length === 0) return false;

                    hasWithoutAssayResultFilter = filters.some(
                        fieldFilter =>
                            fieldFilter.filter.getFilterType().getURLSuffix() ===
                            COLUMN_NOT_IN_FILTER_TYPE.getURLSuffix()
                    );
                }

                newFilterCards.push({
                    schemaQuery: isAssay
                        ? entityDataType.getInstanceSchemaQuery(queryName)
                        : SchemaQuery.create(schemaName, queryLabels[queryName]),
                    filterArray: dataTypeFilters[queryName],
                    entityDataType: chosenEntityType,
                    dataTypeDisplayName: queryLabels[queryName],
                    selectColumnFieldKey: isAssay ? assaySampleIdCols[queryName]?.lookupFieldKey : undefined,
                    targetColumnFieldKey: isAssay ? assaySampleIdCols[queryName]?.fieldKey : undefined,
                });
            });

            onFilterClose();
            updateFilters(filterChangeCounter + 1, newFilterCards, !currentView?.entityId, true);

            if (isAssay) {
                api.query.incrementClientSideMetricCount(
                    SAMPLE_FILTER_METRIC_AREA,
                    'with ' + assayDesignCount + ' AssayDesgin' + (assayDesignCount > 1 ? 's' : '')
                );
                api.query.incrementClientSideMetricCount(SAMPLE_FILTER_METRIC_AREA, 'hasWithoutAssayResultChecked');
            }
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

            if (view.isSession) cardJson = sessionStorage.getItem(getSampleFinderLocalStorageKey());
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

            const finderSessionData = searchFiltersFromJson(cardJson, assaySampleIdCols);
            const newFilters = finderSessionData.filters;
            if (!newFilters) return;

            updateFilters(filterChangeCounter + 1, newFilters, false, view.isSession);
            setShowSaveViewDialog(false);
            setCurrentView(view);
        },
        [createNotification, filterChangeCounter, updateFilters, assaySampleIdCols]
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

    useEffect(() => {
        if (!assaySampleIdCols) return;

        (async () => {
            try {
                // if the page is first loading (i.e. no currentView) and the URL has a view name, try to load it
                const reportName = location?.query?.view;
                if (currentView === undefined && reportName) {
                    if (reportName.startsWith(SAMPLE_FINDER_SESSION_PREFIX)) {
                        loadSearch({ isSession: true, reportName });
                    } else {
                        const views = await api.samples.loadFinderSearches();
                        const view = views.find(v => v.reportName === reportName);
                        if (view) loadSearch(view);
                    }
                }
            } catch (error) {
                // do nothing
            }
        })();
    }, [api.samples, currentView, loadSearch, location?.query?.view, assaySampleIdCols]);

    if (!enabledEntityTypes) return <LoadingSpinner />;

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

const SampleFinderSamplesImpl: FC<SampleFinderSamplesGridProps & InjectedQueryModels> = memo(props => {
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
                    excludedMenuKeys: [SamplesEditButtonSections.IMPORT].concat(
                        gridButtonProps?.excludedMenuKeys ?? []
                    ),
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

function getAssayDefinitionsWithResultSampleLookup(
    assayStateModel: AssayStateModel,
    providerType?: string
): { [key: string]: AssaySampleColumnProp } {
    const assays = assayStateModel.definitions.filter(
        assay => providerType === undefined || assay.type?.toLowerCase() === providerType?.toLowerCase()
    );

    const results = {};
    assays.forEach(assay => {
        const sampleCol = assay.getSampleColumn(AssayDomainTypes.RESULT)?.column;
        if (sampleCol) {
            results[assay.name?.toLowerCase()] = {
                fieldKey: sampleCol.fieldKey,
                lookupFieldKey: sampleCol.lookup.keyColumn,
            };
        }
    });

    return results;
}
