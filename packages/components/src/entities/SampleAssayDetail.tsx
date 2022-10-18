import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, MenuItem, Panel, SplitButton } from 'react-bootstrap';

import { InjectedAssayModel, withAssayModels } from '../internal/components/assay/withAssayModels';
import { getImportItemsForAssayDefinitions } from '../internal/components/assay/actions';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../internal/APIWrapper';

import { QueryModel } from '../public/QueryModel/QueryModel';
import { User } from '../internal/components/base/models/User';
import { AssayStateModel } from '../internal/components/assay/models';
import { naturalSortByProperty } from '../public/sort';
import { Alert } from '../internal/components/base/Alert';
import { LoadingSpinner } from '../internal/components/base/LoadingSpinner';

import { TabbedGridPanel } from '../public/QueryModel/TabbedGridPanel';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';
import { isLoading } from '../public/LoadingState';

import {
    InjectedQueryModels,
    QueryConfigMap,
    RequiresModelAndActions,
    withQueryModels,
} from '../public/QueryModel/withQueryModels';

import { ALIQUOT_FILTER_MODE, SampleOperation } from '../internal/components/samples/constants';

import { getSampleStatusType, isSampleOperationPermitted } from '../internal/components/samples/utils';

import { ASSAY_RUNS_GRID_ID, getSamplesAssayGridQueryConfigs } from './utils';
import { SampleAliquotViewSelector } from './SampleAliquotViewSelector';

interface Props {
    api?: ComponentsAPIWrapper;
    emptyAliquotViewMsg?: string;
    emptyAssayDefDisplay?: ReactNode;
    emptyAssayResultDisplay?: ReactNode;
    emptySampleViewMsg?: string;
    exportPrefix?: string;
    sampleAliquotType?: ALIQUOT_FILTER_MODE;
    sampleId?: string;
    sampleModel?: QueryModel;
    showAliquotViewSelector?: boolean;
    sourceAliquotRows?: Array<Record<string, any>>;
    sourceId?: number | string;
    sourceSampleRows?: Array<Record<string, any>>;
    user: User;
}

// export for jest testing
export const AssayResultPanel: FC = ({ children }) => {
    return (
        <Panel>
            <Panel.Heading>Assay Results</Panel.Heading>
            <Panel.Body>{children}</Panel.Body>
        </Panel>
    );
};

const ASSAY_GRID_ID_PREFIX = 'assay-detail';
const UNFILTERED_PREFIX = 'unfiltered-';
const UNFILTERED_GRID_ID_PREFIX = UNFILTERED_PREFIX + ASSAY_GRID_ID_PREFIX;

interface SampleAssayDetailButtonsOwnProps {
    activeSampleAliquotType?: ALIQUOT_FILTER_MODE;
    assayModel: AssayStateModel;
    isSourceSampleAssayGrid?: boolean;
    onSampleAliquotTypeChange?: (mode: ALIQUOT_FILTER_MODE) => void;
    sampleModel: QueryModel;
    user: User;
}

type SampleAssayDetailButtonsProps = SampleAssayDetailButtonsOwnProps & RequiresModelAndActions;

// exported for jest testing
export const SampleAssayDetailButtons: FC<SampleAssayDetailButtonsProps> = props => {
    const { assayModel, model, sampleModel, user } = props;

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

    if (menuItems.length === 0 || currentAssayHref === undefined) {
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

// export for jest testing
export const SampleAssayDetailButtonsRight: FC<SampleAssayDetailButtonsProps> = props => {
    const { activeSampleAliquotType, onSampleAliquotTypeChange, isSourceSampleAssayGrid } = props;

    // NOTE: not checking isSampleAliquotSelectorEnabled() here since we always want to show the selector for this
    // use case because it doesn't have a grid column to apply the filter directly

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

// export for jest testing
export const getSampleAssayDetailEmptyText = (
    hasRows: boolean,
    activeSampleAliquotType?: ALIQUOT_FILTER_MODE,
    emptySampleViewMsg?: string,
    emptyAliquotViewMsg?: string
): string => {
    if (!activeSampleAliquotType || activeSampleAliquotType === ALIQUOT_FILTER_MODE.all || hasRows) {
        return undefined;
    }

    if (activeSampleAliquotType === ALIQUOT_FILTER_MODE.aliquots) {
        return emptyAliquotViewMsg ?? 'No assay results available for aliquots of this sample.';
    }

    return (
        emptySampleViewMsg ??
        "Assay results are available for this sample's aliquots, but not available for this sample."
    );
};

interface OwnProps {
    activeSampleAliquotType?: ALIQUOT_FILTER_MODE;
    activeTabId?: string;
    isSourceSampleAssayGrid?: boolean;
    onSampleAliquotTypeChange?: (mode: ALIQUOT_FILTER_MODE) => void;
    onTabChange: (tabId: string) => void;
    showImportBtn?: boolean;
    user: User;
}

type SampleAssayDetailBodyProps = Props & InjectedAssayModel & OwnProps;

// export for jest testing
export const SampleAssayDetailBodyImpl: FC<SampleAssayDetailBodyProps & InjectedQueryModels> = memo(props => {
    const {
        actions,
        assayModel,
        queryModels,
        sampleModel,
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
        user,
        exportPrefix,
        sampleId,
        sourceId,
    } = props;
    const [queryModelsWithData, setQueryModelsWithData] = useState<Record<string, QueryModel>>();
    const [tabOrder, setTabOrder] = useState<string[]>();
    const allModels = Object.values(queryModels);
    const allLoaded = allModels.every(model => !model.isLoading);

    useEffect(() => {
        actions.loadAllModels(true);
    }, [actions]);

    useEffect(() => {
        // only calculate the queryModelsWithData and tabOrder after all models have loaded and before any
        // user defined filters are added to the grids (i.e. when queryModelsWithData is undefined)
        if (!allLoaded || queryModelsWithData !== undefined) return;

        const models: Record<string, QueryModel> = {};
        let targetQueryModels = Object.values(queryModels);
        const isFilteredView =
            showAliquotViewSelector &&
            activeSampleAliquotType !== null &&
            activeSampleAliquotType !== ALIQUOT_FILTER_MODE.all;
        if (isFilteredView) {
            targetQueryModels = [];
            Object.values(queryModels).forEach(model => {
                if (model.id?.indexOf(UNFILTERED_GRID_ID_PREFIX) === 0) targetQueryModels.push(model);
            });
        }

        targetQueryModels.forEach(model => {
            let targetModel = model;
            if (isFilteredView) {
                targetModel = Object.values(queryModels).find(
                    m => m.id === model.id.substring(UNFILTERED_PREFIX.length)
                );
            }
            if (model.hasRows) {
                models[targetModel.id] = targetModel;
            }
        });

        setQueryModelsWithData(models);

        const tabOrder_ = Object.values(models)
            .sort(naturalSortByProperty('title'))
            .map(model => model.id);
        // make sure the ASSAY_RUNS_GRID_ID tab is first
        const summaryGridId = `${ASSAY_GRID_ID_PREFIX}:${ASSAY_RUNS_GRID_ID}:${sampleId ?? sourceId + '-source'}`;
        if (tabOrder_.indexOf(summaryGridId) > -1) {
            tabOrder_.splice(tabOrder_.indexOf(summaryGridId), 1);
            tabOrder_.unshift(summaryGridId);
        }
        setTabOrder(tabOrder_);
    }, [
        allLoaded,
        queryModelsWithData,
        activeSampleAliquotType,
        queryModels,
        showAliquotViewSelector,
        sampleId,
        sourceId,
    ]);

    const getEmptyText = useCallback(
        activeModel => {
            return getSampleAssayDetailEmptyText(
                activeModel?.hasRows,
                activeSampleAliquotType,
                emptySampleViewMsg,
                emptyAliquotViewMsg
            );
        },
        [activeSampleAliquotType, emptyAliquotViewMsg, emptySampleViewMsg]
    );

    // always contains the summary grid model, so consider empty if we only have 1
    if (allModels.length === 1) {
        if (emptyAssayDefDisplay) return <>{emptyAssayDefDisplay}</>;

        return (
            <AssayResultPanel>
                <Alert bsStyle="warning">
                    There are no assay designs defined that reference this sample type as either a result field or run
                    property.
                </Alert>
            </AssayResultPanel>
        );
    }

    if (!allLoaded || queryModelsWithData === undefined) {
        return (
            <AssayResultPanel>
                <LoadingSpinner />
            </AssayResultPanel>
        );
    }

    // always contains the summary grid model, so consider empty if we only have 1
    if (Object.keys(queryModelsWithData).length === 1) {
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
                            To import assay data, use the <b>Import Assay Data</b> option from the &nbsp;
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
                user,
            }}
            ButtonsComponentRight={showAliquotViewSelector ? SampleAssayDetailButtonsRight : undefined}
            getEmptyText={getEmptyText}
            loadOnMount={false}
            queryModels={queryModels}
            showRowCountOnTabs
            tabOrder={tabOrder}
            onTabSelect={onTabChange}
            activeModelId={activeTabId}
            exportFilename={exportPrefix && exportPrefix + '_assay_results'}
        />
    );
});

// exported for jest testing
export const SampleAssayDetailBody = withQueryModels<SampleAssayDetailBodyProps>(SampleAssayDetailBodyImpl);

// exported for jest testing
export const SampleAssayDetailImpl: FC<Props & InjectedAssayModel> = props => {
    const {
        api,
        assayModel,
        sampleId,
        sampleModel,
        sampleAliquotType,
        showAliquotViewSelector,
        sourceSampleRows,
        sourceAliquotRows,
        sourceId,
    } = props;
    const { createNotification } = useNotificationsContext();

    const [activeSampleAliquotType, setActiveSampleAliquotType] = useState<ALIQUOT_FILTER_MODE>(
        sampleAliquotType ?? ALIQUOT_FILTER_MODE.all
    );

    const isSourceSampleAssayGrid = useMemo(() => {
        // using type conversion comparison (i.e. == and !=) to check for both null and undefined
        return sampleId == null && sourceSampleRows != null;
    }, [sampleId, sourceSampleRows]);

    const [aliquotRows, setAliquotRows] = useState<Array<Record<string, any>>>(undefined);
    useEffect(() => {
        if (!showAliquotViewSelector || !sampleId) return;

        api.samples
            .getSampleAliquotRows(sampleId)
            .then(aliquots => {
                setAliquotRows(aliquots);
            })
            .catch(() => {
                createNotification({
                    alertClass: 'danger',
                    message: 'Unable to load sample aliquots. Your session may have expired.',
                });
            });
    }, [api, createNotification, sampleId, showAliquotViewSelector]);

    const [queryConfigs, setQueryConfigs] = useState<QueryConfigMap>();

    const loadingDefinitions = isLoading(assayModel.definitionsLoadingState);

    const onSampleAliquotTypeChange = useCallback(type => {
        setActiveSampleAliquotType(type);
    }, []);

    const sampleRows = useMemo(() => {
        if (!showAliquotViewSelector || (!isSourceSampleAssayGrid && !aliquotRows)) return [sampleModel.getRow()];

        if (isSourceSampleAssayGrid) {
            if (activeSampleAliquotType === ALIQUOT_FILTER_MODE.all) return [...sourceSampleRows, ...sourceAliquotRows];
            return activeSampleAliquotType === ALIQUOT_FILTER_MODE.aliquots ? sourceAliquotRows : sourceSampleRows;
        }

        if (activeSampleAliquotType === ALIQUOT_FILTER_MODE.all) return [sampleModel.getRow(), ...aliquotRows];
        return activeSampleAliquotType === ALIQUOT_FILTER_MODE.aliquots ? aliquotRows : [sampleModel.getRow()];
    }, [
        sampleModel,
        aliquotRows,
        activeSampleAliquotType,
        showAliquotViewSelector,
        sourceSampleRows,
        sourceAliquotRows,
        sourceId,
        isSourceSampleAssayGrid,
    ]);

    const allSampleRows = useMemo(() => {
        if (!showAliquotViewSelector || (!isSourceSampleAssayGrid && !aliquotRows)) return [sampleModel.getRow()];

        return isSourceSampleAssayGrid
            ? [...sourceSampleRows, ...sourceAliquotRows]
            : [sampleModel.getRow(), ...aliquotRows];
    }, [
        sampleModel,
        aliquotRows,
        showAliquotViewSelector,
        sourceSampleRows,
        sourceAliquotRows,
        sourceId,
        isSourceSampleAssayGrid,
    ]);

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

    useEffect(() => {
        if (loadingDefinitions) {
            return;
        }

        // clear queryConfigs so that the full set of queryModels will get loaded in SampleAssayDetailBodyImpl
        setQueryConfigs(undefined);

        (async () => {
            const queryGridSuffix = sampleId ?? sourceId + '-source';
            const sampleSchemaQuery = isSourceSampleAssayGrid ? undefined : sampleModel.queryInfo.schemaQuery;

            // handling try/catch within getSamplesAssayGridQueryConfigs
            const queryConfigs_ = await getSamplesAssayGridQueryConfigs(
                api.samples,
                assayModel,
                sampleId,
                sampleRows,
                queryGridSuffix,
                ASSAY_GRID_ID_PREFIX,
                sampleSchemaQuery,
                showAliquotViewSelector,
                activeSampleAliquotType,
                allSampleRows,
                UNFILTERED_GRID_ID_PREFIX
            );
            setQueryConfigs(queryConfigs_);
        })();
    }, [
        assayModel,
        loadingDefinitions,
        sampleModel,
        sampleId,
        sampleRows,
        activeSampleAliquotType,
        showAliquotViewSelector,
        sourceId,
        allSampleRows,
        isSourceSampleAssayGrid,
        api.samples,
        createNotification,
    ]);

    if (
        loadingDefinitions ||
        queryConfigs === undefined ||
        (showAliquotViewSelector && !isSourceSampleAssayGrid && !aliquotRows)
    ) {
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
            onSampleAliquotTypeChange={onSampleAliquotTypeChange}
            activeSampleAliquotType={activeSampleAliquotType}
            showImportBtn={!isSourceSampleAssayGrid && canImportData}
            isSourceSampleAssayGrid={isSourceSampleAssayGrid}
            onTabChange={onTabChange}
            activeTabId={activeTabId}
        />
    );
};

SampleAssayDetailImpl.defaultProps = {
    api: getDefaultAPIWrapper(),
};

export const SampleAssayDetail = withAssayModels(SampleAssayDetailImpl);
