import React, { FC, memo, useEffect, useMemo } from 'react';
import { Button, MenuItem, Panel, SplitButton } from 'react-bootstrap';
import { Filter } from '@labkey/api';

import {
    Alert,
    AssayStateModel,
    InjectedAssayModel,
    isLoading,
    LoadingSpinner,
    naturalSortByProperty,
    QueryModel,
    RequiresModelAndActions,
    TabbedGridPanel,
    useServerContext,
} from '../../..';

import { withAssayModels } from '../assay/withAssayModels';
import { getImportItemsForAssayDefinitionsQM } from '../assay/actions';
import { createQueryConfigFilteredBySample } from '../../actions';

// These need to be direct imports from files to avoid circular dependencies in index.ts
import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';

interface Props {
    sampleId: string;
    sampleModel: QueryModel;
}

const AssayResultPanel: FC = ({ children }) => {
    return (
        <Panel>
            <Panel.Heading>Assay Results</Panel.Heading>
            <Panel.Body>{children}</Panel.Body>
        </Panel>
    );
};

type SampleAssayDetailButtonsProps = { assayModel: AssayStateModel; sampleModel: QueryModel } & RequiresModelAndActions;

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

interface OwnProps {
    tabOrder: string[];
}

type SampleAssayDetailBodyProps = Props & InjectedAssayModel & OwnProps;

const SampleAssayDetailBodyImpl: FC<SampleAssayDetailBodyProps & InjectedQueryModels> = memo(props => {
    const { actions, assayModel, queryModels, sampleModel, tabOrder } = props;
    const allModels = Object.values(queryModels);
    const allLoaded = allModels.every(model => !model.isLoading);

    useEffect(() => {
        actions.loadAllModels(true);
    }, []);

    const { queryModelsWithData, tabOrderWithData } = useMemo(() => {
        const models = {};
        const tabOrderWithData = tabOrder.slice();
        Object.values(queryModels).forEach(model => {
            if (model.hasRows) {
                models[model.id] = model;
            } else {
                const idx = tabOrderWithData.findIndex(id => id === model.id);
                if (idx > -1) {
                    tabOrderWithData.splice(idx, 1);
                }
            }
        });
        return { queryModelsWithData: models, tabOrderWithData };
    }, [allLoaded, queryModels]);

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
            buttonsComponentProps={{ assayModel, sampleModel }}
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
    const { assayModel, sampleId, sampleModel } = props;
    const loadingDefinitions = isLoading(assayModel.definitionsLoadingState);

    const { queryConfigs, tabOrder } = useMemo(() => {
        if (loadingDefinitions) {
            return { queryConfigs: {}, tabOrder: [] };
        }

        const _tabOrder = [];
        const configs = assayModel.definitions
            .slice() // need to make a copy of the array before sorting
            .filter(assay => assay.hasLookup(sampleModel.queryInfo.schemaQuery))
            .sort(naturalSortByProperty('name'))
            .reduce((_configs, assay) => {
                const _queryConfig = createQueryConfigFilteredBySample(
                    assay,
                    sampleId,
                    Filter.Types.EQUAL,
                    (fieldKey, sampleId) => `${fieldKey} = ${sampleId}`,
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

        return { queryConfigs: configs, tabOrder: _tabOrder };
    }, [assayModel.definitions, loadingDefinitions, sampleModel]);

    if (loadingDefinitions) {
        return (
            <AssayResultPanel>
                <LoadingSpinner />
            </AssayResultPanel>
        );
    }

    return <SampleAssayDetailBody {...props} queryConfigs={queryConfigs} tabOrder={tabOrder} />;
};

export const SampleAssayDetail = withAssayModels(SampleAssayDetailImpl);
