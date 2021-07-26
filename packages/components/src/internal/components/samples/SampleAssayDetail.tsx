import React, { FC, memo, useEffect, useMemo, useState, useCallback } from 'react';
import { Button, MenuItem, Panel, SplitButton } from 'react-bootstrap';
import { Filter } from '@labkey/api';

import {
    Alert,
    ALIQUOT_FILTER_MODE,
    AssayStateModel,
    createNotification,
    InjectedAssayModel,
    isLoading,
    LoadingSpinner,
    naturalSortByProperty,
    QueryModel,
    RequiresModelAndActions,
    SampleAliquotViewSelector,
    TabbedGridPanel,
    useServerContext,
} from '../../..';

import { withAssayModels } from '../assay/withAssayModels';
import { getImportItemsForAssayDefinitionsQM } from '../assay/actions';
import { createQueryConfigFilteredBySample } from '../../actions';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { getSampleAliquots } from "./actions";

interface Props {
    sampleId: string;
    sampleModel: QueryModel;
    showAliquotViewSelector?: boolean
    sampleAliquotType?: ALIQUOT_FILTER_MODE
}

const AssayResultPanel: FC = ({ children }) => {
    return (
        <Panel>
            <Panel.Heading>Assay Results</Panel.Heading>
            <Panel.Body>{children}</Panel.Body>
        </Panel>
    );
};

interface SampleAssayDetailButtonsOwnProps {
    assayModel: AssayStateModel;
    sampleModel: QueryModel;
    activeSampleAliquotType?: ALIQUOT_FILTER_MODE;
    onSampleAliquotTypeChange?: (mode: ALIQUOT_FILTER_MODE) => any;
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

    getImportItemsForAssayDefinitionsQM(assayModel, sampleModel).forEach((href, assay) => {
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
    const { activeSampleAliquotType, onSampleAliquotTypeChange } = props;

    return (
        <>
            <SampleAliquotViewSelector
                aliquotFilterMode={activeSampleAliquotType}
                updateAliquotFilter={onSampleAliquotTypeChange}
                headerLabel={'Show Assay Data with Samples'}
                samplesLabel={'Sample Only'}
                allLabel={'Sample or Aliquots'}
            />
        </>
    );
};

interface OwnProps {
    tabOrder: string[];
    onSampleAliquotTypeChange?: (mode: ALIQUOT_FILTER_MODE) => any;
    activeSampleAliquotType?: ALIQUOT_FILTER_MODE
}

type SampleAssayDetailBodyProps = Props & InjectedAssayModel & OwnProps;

const SampleAssayDetailBodyImpl: FC<SampleAssayDetailBodyProps & InjectedQueryModels> = memo(props => {
    const { actions, assayModel, queryModels, sampleModel, tabOrder, showAliquotViewSelector, onSampleAliquotTypeChange, activeSampleAliquotType } = props;
    const allModels = Object.values(queryModels);
    const allLoaded = allModels.every(model => !model.isLoading);

    useEffect(() => {
        actions.loadAllModels(true);
    }, []);

    // if (showAliquotViewSelector && activeSampleAliquotType != ALIQUOT_FILTER_MODE.all)
    const { queryModelsWithData, tabOrderWithData } = useMemo(() => {
        const models = {};
        const tabOrderWithData = tabOrder.slice();
        let targetQueryModels = Object.values(queryModels);
        const isFilteredView = showAliquotViewSelector && activeSampleAliquotType != null && activeSampleAliquotType != ALIQUOT_FILTER_MODE.all;
        if (isFilteredView) {
            targetQueryModels = [];
            Object.values(queryModels).forEach(model => {
                if (model.id?.indexOf('unfiltered-assay-detail') === 0)
                    targetQueryModels.push(model);
            })
        }
        targetQueryModels.forEach(model => {
            let targetModel = model;
            if (isFilteredView) {
                targetModel = Object.values(queryModels).find((m => m.id == model.id.substring('unfiltered-'.length)))
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

    const getEmptyText = useCallback((activeModel) => {
        if (!activeSampleAliquotType || activeSampleAliquotType == ALIQUOT_FILTER_MODE.all || activeModel.hasRows)
            return undefined;

        return activeSampleAliquotType == ALIQUOT_FILTER_MODE.aliquots ?
            'No assay results available for aliquots of this sample.'
            : "Assay results are available for this sample's aliquots, but not available for this sample."

    }, [activeSampleAliquotType]);

    if (allModels.length === 0) {
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
        return (
            <AssayResultPanel>
                <Alert bsStyle="warning">
                    No assay results available for this sample. To upload assay data, use the <b>Upload Assay Data</b>{' '}
                    option from the &nbsp;
                    <i className="fa fa-bars" />
                    &nbsp; menu above.
                </Alert>
            </AssayResultPanel>
        );
    }

    return (
        <TabbedGridPanel
            actions={actions}
            alwaysShowTabs
            ButtonsComponent={SampleAssayDetailButtons}
            buttonsComponentProps={{ assayModel, sampleModel, onSampleAliquotTypeChange, activeSampleAliquotType }}
            ButtonsComponentRight={showAliquotViewSelector ? SampleAssayDetailButtonsRight : undefined}
            getEmptyText={getEmptyText}
            loadOnMount={false}
            queryModels={queryModelsWithData}
            showRowCountOnTabs
            tabOrder={tabOrderWithData}
            title="Assay Results"
        />
    );
});

const SampleAssayDetailBody = withQueryModels<SampleAssayDetailBodyProps>(SampleAssayDetailBodyImpl);

const SampleAssayDetailImpl: FC<Props & InjectedAssayModel> = props => {
    const { assayModel, sampleId, sampleModel, sampleAliquotType, showAliquotViewSelector } = props;
    const loadingDefinitions = isLoading(assayModel.definitionsLoadingState);

    const [ aliquotIds, setAliquotIds ] = useState(undefined);
    const [ activeSampleAliquotType, setActiveSampleAliquotType ] = useState(sampleAliquotType);

    useEffect(() => {
        if (!showAliquotViewSelector)
            return;

        getSampleAliquots(sampleId)
            .then((aliquots) => {
                setAliquotIds(aliquots);
            })
            .catch(reason => {
                createNotification({
                    alertClass: 'danger',
                    message: 'Unable to load sample aliquots',
                });
            });
    }, [sampleId, showAliquotViewSelector]);

    const onSampleAliquotTypeChange = useCallback((type) => {
        setActiveSampleAliquotType(type);
    }, []);

    const sampleIds = useMemo(() => {
        if (!showAliquotViewSelector)
            return [sampleId];

        if (activeSampleAliquotType == ALIQUOT_FILTER_MODE.all)
            return [sampleId, ...aliquotIds];
        return activeSampleAliquotType == ALIQUOT_FILTER_MODE.aliquots ? aliquotIds : [sampleId];
    }, [sampleId, aliquotIds, activeSampleAliquotType, showAliquotViewSelector]);

    const allSampleIds = useMemo(() => {
        if (!showAliquotViewSelector || !aliquotIds)
            return [sampleId];

        return [sampleId, ...aliquotIds];
    }, [sampleId, aliquotIds, showAliquotViewSelector]);

    const key = useMemo(() => {
        return sampleId + '-' + activeSampleAliquotType;
    }, [sampleId, activeSampleAliquotType]);

    const { queryConfigs, tabOrder } = useMemo(() => {
        if (loadingDefinitions) {
            return { queryConfigs: {}, tabOrder: [] };
        }

        let _tabOrder = [];
        let configs = assayModel.definitions
            .slice() // need to make a copy of the array before sorting
            .filter(assay => assay.hasLookup(sampleModel.queryInfo.schemaQuery))
            .sort(naturalSortByProperty('name'))
            .reduce((_configs, assay) => {
                const _queryConfig = createQueryConfigFilteredBySample(
                    assay,
                    sampleIds && sampleIds.length > 0 ? sampleIds : [-1],
                    Filter.Types.IN,
                    (fieldKey, sampleIds) => `${fieldKey} IN (${sampleIds.join(',')})`,
                    false,
                    true
                );

                if (_queryConfig) {
                    const modelId = `assay-detail:${assay.id}:${sampleId}`;
                    _configs[modelId] = _queryConfig;
                    _tabOrder.push(modelId);
                }

                return _configs;
            }, {});

        // keep tab when "all" view has data, but filtered view is blank
        if (showAliquotViewSelector && activeSampleAliquotType != ALIQUOT_FILTER_MODE.all) {
            const unfilteredConfigs = assayModel.definitions
                .slice() // need to make a copy of the array before sorting
                .filter(assay => assay.hasLookup(sampleModel.queryInfo.schemaQuery))
                .sort(naturalSortByProperty('name'))
                .reduce((_configs, assay) => {
                    const _queryConfig = createQueryConfigFilteredBySample(
                        assay,
                        allSampleIds,
                        Filter.Types.IN,
                        (fieldKey, sampleIds) => `${fieldKey} IN (${sampleIds.join(',')})`,
                        false,
                        true
                    );

                    if (_queryConfig) {
                        const modelId = `unfiltered-assay-detail:${assay.id}:${sampleId}`;
                        _configs[modelId] = _queryConfig;
                    }

                    return _configs;
                }, {});

            configs = {...configs, ...unfilteredConfigs};
        }

        return { queryConfigs: configs, tabOrder: _tabOrder };
    }, [assayModel.definitions, loadingDefinitions, sampleModel, sampleId, sampleIds, showAliquotViewSelector]);

    if (loadingDefinitions || (showAliquotViewSelector && !aliquotIds)) {
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
        />
    );
};

export const SampleAssayDetail = withAssayModels(SampleAssayDetailImpl);
