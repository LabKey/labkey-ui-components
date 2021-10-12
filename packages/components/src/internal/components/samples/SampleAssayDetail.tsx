import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, MenuItem, Panel, SplitButton } from 'react-bootstrap';

import {
    Alert,
    ALIQUOT_FILTER_MODE,
    AssayStateModel,
    createNotification,
    InjectedAssayModel,
    isLoading,
    isSampleOperationPermitted,
    LoadingSpinner,
    QueryModel,
    RequiresModelAndActions,
    SampleAliquotViewSelector,
    SampleOperation,
    TabbedGridPanel,
    useServerContext,
} from '../../..';

import { withAssayModels } from '../assay/withAssayModels';
import { getImportItemsForAssayDefinitions } from '../assay/actions';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

import { getSampleAliquots, getSampleAssayQueryConfigs } from './actions';
import { getSampleStatusType } from './utils';

interface Props {
    sampleId?: string;
    sampleModel?: QueryModel;
    showAliquotViewSelector?: boolean;
    sampleAliquotType?: ALIQUOT_FILTER_MODE;
    sourceId?: number | string;
    sourceSampleIds?: number[];
    sourceAliquotIds?: number[];
    emptyAssayDefDisplay?: ReactNode;
    emptyAssayResultDisplay?: ReactNode;
    emptyAliquotViewMsg?: string;
    emptySampleViewMsg?: string;
}

const AssayResultPanel: FC = ({ children }) => {
    return (
        <Panel>
            <Panel.Heading>Assay Results</Panel.Heading>
            <Panel.Body>{children}</Panel.Body>
        </Panel>
    );
};

const ASSAY_GRID_ID_PREFIX = 'assay-detail';
const UNFILTERED_GRID_ID_PREFIX = 'unfiltered-assay-detail';

interface SampleAssayDetailButtonsOwnProps {
    assayModel: AssayStateModel;
    sampleModel: QueryModel;
    activeSampleAliquotType?: ALIQUOT_FILTER_MODE;
    onSampleAliquotTypeChange?: (mode: ALIQUOT_FILTER_MODE) => any;
    isSourceSampleAssayGrid?: boolean;
}

type SampleAssayDetailButtonsProps = SampleAssayDetailButtonsOwnProps & RequiresModelAndActions;

const SampleAssayDetailButtons: FC<SampleAssayDetailButtonsProps> = props => {
    const { assayModel, model, sampleModel } = props;
    const { user } = useServerContext();

    if (!user.hasInsertPermission()) {
        return null;
    }

    let currentAssayHref: string;
    const menuItems = [];

    getImportItemsForAssayDefinitions(assayModel, sampleModel).forEach((href, assay) => {
        if (model?.title === assay.name) {
            currentAssayHref = href;
        }

        menuItems.push(
            <MenuItem href={href} key={assay.id}>
                {assay.name}
            </MenuItem>
        );
    });

    if (menuItems.length === 0) {
        return null;
    } else if (menuItems.length === 1) {
        return (
            <Button bsStyle="success" href={currentAssayHref} id="importDataSingleButton">
                Import Data
            </Button>
        );
    } else {
        return (
            <SplitButton bsStyle="success" href={currentAssayHref} id="importDataDropDown" title="Import Data">
                {menuItems}
            </SplitButton>
        );
    }
};

const SampleAssayDetailButtonsRight: FC<SampleAssayDetailButtonsProps> = props => {
    const { activeSampleAliquotType, onSampleAliquotTypeChange, isSourceSampleAssayGrid } = props;

    return (
        <>
            <SampleAliquotViewSelector
                aliquotFilterMode={activeSampleAliquotType}
                updateAliquotFilter={onSampleAliquotTypeChange}
                headerLabel={
                    isSourceSampleAssayGrid ? 'Show Assay Data with Source Samples' : 'Show Assay Data with Samples'
                }
                samplesLabel={isSourceSampleAssayGrid ? 'Derived Samples Only' : 'Sample Only'}
                allLabel={isSourceSampleAssayGrid ? 'Derived Samples or Aliquots' : 'Sample or Aliquots'}
            />
        </>
    );
};

interface OwnProps {
    tabOrder: string[];
    onSampleAliquotTypeChange?: (mode: ALIQUOT_FILTER_MODE) => any;
    activeSampleAliquotType?: ALIQUOT_FILTER_MODE;
    showImportBtn?: boolean;
    isSourceSampleAssayGrid?: boolean;
    onTabChange: (tabId: string) => any;
    activeTabId?: string;
}

type SampleAssayDetailBodyProps = Props & InjectedAssayModel & OwnProps;

const SampleAssayDetailBodyImpl: FC<SampleAssayDetailBodyProps & InjectedQueryModels> = memo(props => {
    const {
        actions,
        assayModel,
        queryModels,
        sampleModel,
        tabOrder,
        showImportBtn,
        isSourceSampleAssayGrid,
        showAliquotViewSelector,
        onSampleAliquotTypeChange,
        activeSampleAliquotType,
        emptyAssayDefDisplay,
        emptyAssayResultDisplay,
        emptyAliquotViewMsg,
        emptySampleViewMsg,
        onTabChange,
        activeTabId,
    } = props;
    const allModels = Object.values(queryModels);
    const allLoaded = allModels.every(model => !model.isLoading);

    useEffect(() => {
        actions.loadAllModels(true);
    }, []);

    const { queryModelsWithData, tabOrderWithData } = useMemo(() => {
        const models = {};
        const tabOrderWithData = tabOrder.slice();
        let targetQueryModels = Object.values(queryModels);
        const isFilteredView =
            showAliquotViewSelector &&
            activeSampleAliquotType != null &&
            activeSampleAliquotType != ALIQUOT_FILTER_MODE.all;
        if (isFilteredView) {
            targetQueryModels = [];
            Object.values(queryModels).forEach(model => {
                if (model.id?.indexOf(UNFILTERED_GRID_ID_PREFIX) === 0) targetQueryModels.push(model);
            });
        }

        targetQueryModels.forEach(model => {
            let targetModel = model;
            if (isFilteredView) {
                targetModel = Object.values(queryModels).find(m => m.id == model.id.substring('unfiltered-'.length));
            }
            if (model.hasRows) {
                models[targetModel.id] = targetModel;
            } else {
                const idx = tabOrderWithData.findIndex(id => id === targetModel.id);
                if (idx > -1) {
                    tabOrderWithData.splice(idx, 1);
                }
            }
        });
        return { queryModelsWithData: models, tabOrderWithData };
    }, [allLoaded, queryModels, showAliquotViewSelector, activeSampleAliquotType]);

    const getEmptyText = useCallback(
        activeModel => {
            if (!activeSampleAliquotType || activeSampleAliquotType == ALIQUOT_FILTER_MODE.all || activeModel.hasRows)
                return undefined;

            if (activeSampleAliquotType == ALIQUOT_FILTER_MODE.aliquots) {
                return emptyAliquotViewMsg ?? 'No assay results available for aliquots of this sample.';
            } else {
                return (
                    emptySampleViewMsg ??
                    "Assay results are available for this sample's aliquots, but not available for this sample."
                );
            }
        },
        [activeSampleAliquotType, emptyAliquotViewMsg, emptySampleViewMsg]
    );

    if (allModels.length === 0) {
        if (emptyAssayDefDisplay) return <>{emptyAssayDefDisplay}</>;

        return (
            <AssayResultPanel>
                <Alert bsStyle="warning">
                    There are no assay designs defined that reference this sample type as either a result field or run
                    property
                </Alert>
            </AssayResultPanel>
        );
    }

    if (!allLoaded) {
        return (
            <AssayResultPanel>
                <LoadingSpinner />
            </AssayResultPanel>
        );
    }

    if (Object.keys(queryModelsWithData).length === 0) {
        if (emptyAssayResultDisplay) return <>{emptyAssayResultDisplay}</>;

        return (
            <AssayResultPanel>
                <Alert bsStyle="warning">
                    No assay results available for this sample.
                    {isSampleOperationPermitted(
                        getSampleStatusType(sampleModel?.getRow()),
                        SampleOperation.AddAssayData
                    ) && (
                        <>
                            To upload assay data, use the <b>Upload Assay Data</b> option from the &nbsp;
                            <i className="fa fa-bars" />
                            &nbsp; menu above.
                        </>
                    )}
                </Alert>
            </AssayResultPanel>
        );
    }

    return (
        <TabbedGridPanel
            actions={actions}
            alwaysShowTabs
            ButtonsComponent={showImportBtn ? SampleAssayDetailButtons : undefined}
            buttonsComponentProps={{
                assayModel,
                sampleModel,
                onSampleAliquotTypeChange,
                activeSampleAliquotType,
                isSourceSampleAssayGrid,
            }}
            ButtonsComponentRight={showAliquotViewSelector ? SampleAssayDetailButtonsRight : undefined}
            getEmptyText={getEmptyText}
            loadOnMount={false}
            queryModels={queryModelsWithData}
            showRowCountOnTabs
            tabOrder={tabOrderWithData}
            onTabSelect={onTabChange}
            activeModelId={activeTabId}
            title="Assay Results"
        />
    );
});

const SampleAssayDetailBody = withQueryModels<SampleAssayDetailBodyProps>(SampleAssayDetailBodyImpl);

const SampleAssayDetailImpl: FC<Props & InjectedAssayModel> = props => {
    const {
        assayModel,
        sampleId,
        sampleModel,
        sampleAliquotType,
        showAliquotViewSelector,
        sourceSampleIds,
        sourceAliquotIds,
        sourceId,
    } = props;
    const loadingDefinitions = isLoading(assayModel.definitionsLoadingState);

    const [aliquotIds, setAliquotIds] = useState<number[]>(undefined);
    const [activeSampleAliquotType, setActiveSampleAliquotType] = useState<ALIQUOT_FILTER_MODE>(
        sampleAliquotType ?? ALIQUOT_FILTER_MODE.all
    );

    const isSourceSampleAssayGrid = useMemo(() => {
        return sampleId == null && sourceSampleIds != null;
    }, [sampleId, sourceSampleIds]);

    useEffect(() => {
        if (!showAliquotViewSelector || !sampleId) return;

        getSampleAliquots(sampleId)
            .then(aliquots => {
                setAliquotIds(aliquots);
            })
            .catch(reason => {
                createNotification({
                    alertClass: 'danger',
                    message: 'Unable to load sample aliquots. Your session may have expired.',
                });
            });
    }, [sampleId, showAliquotViewSelector]);

    const onSampleAliquotTypeChange = useCallback(type => {
        setActiveSampleAliquotType(type);
    }, []);

    const sampleIds = useMemo(() => {
        if (!showAliquotViewSelector || (!isSourceSampleAssayGrid && !aliquotIds)) return [sampleId];

        if (isSourceSampleAssayGrid) {
            if (activeSampleAliquotType == ALIQUOT_FILTER_MODE.all) return [...sourceSampleIds, ...sourceAliquotIds];
            return activeSampleAliquotType == ALIQUOT_FILTER_MODE.aliquots ? sourceAliquotIds : sourceSampleIds;
        }

        if (activeSampleAliquotType == ALIQUOT_FILTER_MODE.all) return [sampleId, ...aliquotIds];
        return activeSampleAliquotType == ALIQUOT_FILTER_MODE.aliquots ? aliquotIds : [sampleId];
    }, [
        sampleId,
        aliquotIds,
        activeSampleAliquotType,
        showAliquotViewSelector,
        sourceAliquotIds,
        sourceId,
        isSourceSampleAssayGrid,
    ]);

    const allSampleIds = useMemo(() => {
        if (!showAliquotViewSelector || (!isSourceSampleAssayGrid && !aliquotIds)) return [sampleId];

        return isSourceSampleAssayGrid ? [...sourceSampleIds, ...sourceAliquotIds] : [sampleId, ...aliquotIds];
    }, [sampleId, aliquotIds, showAliquotViewSelector, sourceAliquotIds, sourceId, isSourceSampleAssayGrid]);

    const key = useMemo(() => {
        return (sampleId ?? sourceId) + '-' + activeSampleAliquotType;
    }, [sampleId, sourceId, activeSampleAliquotType]);

    const [activeTabId, setActiveTabId] = useState<string>(undefined);
    const onTabChange = useCallback((tab: string) => {
        setActiveTabId(tab);
    }, []);

    const canImportData = useMemo(() => {
        return isSampleOperationPermitted(getSampleStatusType(sampleModel?.getRow()), SampleOperation.AddAssayData);
    }, [sampleModel]);

    const { queryConfigs, tabOrder } = useMemo(() => {
        if (loadingDefinitions) {
            return { queryConfigs: {}, tabOrder: [] };
        }

        const _tabOrder = [];
        const queryGridSuffix = sampleId ?? sourceId + '-source';
        const sampleSchemaQuery = isSourceSampleAssayGrid ? undefined : sampleModel.queryInfo.schemaQuery;
        const _configs = getSampleAssayQueryConfigs(
            assayModel,
            sampleIds,
            queryGridSuffix,
            ASSAY_GRID_ID_PREFIX,
            false,
            sampleSchemaQuery
        );

        let configs = _configs.reduce((_configs, config) => {
            const modelId = config.id;
            _configs[modelId] = config;
            _tabOrder.push(modelId);
            return _configs;
        }, {});

        // keep tab when "all" view has data, but filtered view is blank
        if (showAliquotViewSelector && activeSampleAliquotType && activeSampleAliquotType != ALIQUOT_FILTER_MODE.all) {
            const _unfilteredConfigs = getSampleAssayQueryConfigs(
                assayModel,
                allSampleIds,
                queryGridSuffix,
                UNFILTERED_GRID_ID_PREFIX,
                false,
                sampleSchemaQuery
            );

            const unfilteredConfigs = _unfilteredConfigs.reduce((_configs, config) => {
                const modelId = config.id;
                _configs[modelId] = config;
                return _configs;
            }, {});

            configs = { ...configs, ...unfilteredConfigs };
        }

        return { queryConfigs: configs, tabOrder: _tabOrder };
    }, [
        assayModel.definitions,
        loadingDefinitions,
        sampleModel,
        sampleId,
        sampleIds,
        activeSampleAliquotType,
        showAliquotViewSelector,
        sourceId,
        allSampleIds,
        isSourceSampleAssayGrid,
    ]);

    if (loadingDefinitions || (showAliquotViewSelector && !isSourceSampleAssayGrid && !aliquotIds)) {
        return (
            <AssayResultPanel>
                <LoadingSpinner />
            </AssayResultPanel>
        );
    }

    return (
        <SampleAssayDetailBody
            {...props}
            key={key}
            queryConfigs={queryConfigs}
            tabOrder={tabOrder}
            onSampleAliquotTypeChange={onSampleAliquotTypeChange}
            activeSampleAliquotType={activeSampleAliquotType}
            showImportBtn={!isSourceSampleAssayGrid && canImportData}
            isSourceSampleAssayGrid={isSourceSampleAssayGrid}
            onTabChange={onTabChange}
            activeTabId={activeTabId}
        />
    );
};

export const SampleAssayDetail = withAssayModels(SampleAssayDetailImpl);
