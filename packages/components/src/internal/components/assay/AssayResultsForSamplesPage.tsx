import React, { FC, memo, useMemo, useEffect, useState } from 'react';
import { WithRouterProps } from 'react-router';
import { Filter } from '@labkey/api';

import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { useServerContext } from '../base/ServerContext';
import { isAssayEnabled, userCanReadAssays } from '../../app/utils';
import { NotFound } from '../base/NotFound';
import { InsufficientPermissionsPage } from '../permissions/InsufficientPermissionsPage';
import { Page } from '../base/Page';
import { Section } from '../base/Section';
import { TabbedGridPanel } from '../../../public/QueryModel/TabbedGridPanel';
import { getSelectedSampleIdsFromSelectionKey } from '../samples/actions';
import { resolveErrorMessage } from '../../util/messaging';
import { SCHEMAS } from '../../schemas';
import { Alert } from '../base/Alert';
import { LoadingPage } from '../base/LoadingPage';

import { selectRows } from '../../query/selectRows';
import { getSamplesAssayGridQueryConfigs } from '../../../entities/utils';
import { useAppContext } from '../../AppContext';
import { isLoading } from '../../../public/LoadingState';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { naturalSortByProperty } from '../../../public/sort';

import { InjectedAssayModel, withAssayModels } from './withAssayModels';

const PAGE_TITLE = 'Assay Results for Samples';
const SUMMARY_GRID_ID = 'sampleresults-assay-run-count:samples';
const ASSAY_GRID_ID_PREFIX = 'sampleresults-per-assay';

type Props = WithRouterProps & InjectedAssayModel;

const AssayResultsForSamplesImpl: FC<Props & InjectedQueryModels> = memo(props => {
    const { queryModels, actions } = props;
    const { user } = useServerContext();
    const [tabOrder, setTabOrder] = useState<string[]>();
    const allModels = Object.values(queryModels);
    const allLoaded = allModels.every(model => !model.isLoading);

    useEffect(() => {
        actions.loadAllModels(true);
    }, [actions]);

    useEffect(() => {
        // only calculate the tabOrder after all models have loaded and before any
        // user defined filters are added to the grids (i.e. when tabOrder is undefined)
        if (!allLoaded || tabOrder !== undefined) return;

        const models: Record<string, QueryModel> = {};
        allModels.forEach(model => {
            if (model.hasRows) {
                models[model.id] = model;
            }
        });

        const tabOrder_ = Object.values(models)
            .sort(naturalSortByProperty('title'))
            .map(model => model.id);
        // make sure the summary tab is first
        tabOrder_.splice(tabOrder_.indexOf(SUMMARY_GRID_ID), 1);
        tabOrder_.unshift(SUMMARY_GRID_ID);
        setTabOrder(tabOrder_);
    }, [allLoaded, tabOrder, allModels]);

    if (!isAssayEnabled()) return <NotFound title={PAGE_TITLE} />;
    if (!userCanReadAssays(user)) return <InsufficientPermissionsPage title={PAGE_TITLE} />;
    if (tabOrder === undefined) return <LoadingPage title={PAGE_TITLE} />;

    return (
        <Page title={PAGE_TITLE}>
            <Section title={PAGE_TITLE}>
                <TabbedGridPanel
                    actions={actions}
                    alwaysShowTabs
                    asPanel={false}
                    loadOnMount={false}
                    queryModels={queryModels}
                    showRowCountOnTabs
                    tabOrder={tabOrder}
                    exportFilename={'AssayResultsForSamples'}
                />
            </Section>
        </Page>
    );
});

const AssayResultsForSamplesWithModels = withQueryModels<Props>(AssayResultsForSamplesImpl);

const AssayResultsForSamplesPageBody: FC<Props> = props => {
    const { location, assayModel } = props;
    const { api } = useAppContext();
    const [sampleIds, setSampleIds] = useState<number[]>();
    const [assayQueryConfigs, setAssayQueryConfigs] = useState<QueryConfigMap>();
    const [error, setError] = useState<string>();
    const loadingDefinitions = isLoading(assayModel.definitionsLoadingState);

    useEffect(() => {
        if (loadingDefinitions) {
            return;
        }

        (async () => {
            try {
                const sampleIds_ = await getSelectedSampleIdsFromSelectionKey(location);
                setSampleIds(sampleIds_);

                const samplesResults = await selectRows({
                    columns: 'RowId,Name',
                    filterArray: [Filter.create('RowId', sampleIds_, Filter.Types.IN)],
                    schemaQuery: SCHEMAS.EXP_TABLES.MATERIALS,
                });

                const assayQueryConfigs_ = await getSamplesAssayGridQueryConfigs(
                    api.samples,
                    assayModel,
                    undefined,
                    samplesResults.rows,
                    'samples',
                    ASSAY_GRID_ID_PREFIX
                );
                setAssayQueryConfigs(assayQueryConfigs_);
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            }
        })();
    }, [api.samples, assayModel, loadingDefinitions, location]);

    const queryConfigs: QueryConfigMap = useMemo(
        () => ({
            [SUMMARY_GRID_ID]: {
                title: 'Assay Runs',
                schemaQuery: SCHEMAS.EXP_TABLES.ASSAY_RUN_COUNT_PER_SAMPLE,
                baseFilters: [Filter.create('RowId', sampleIds, Filter.Types.IN)],
            },
            ...assayQueryConfigs,
        }),
        [sampleIds, assayQueryConfigs]
    );

    if (error) return <Alert>{error}</Alert>;
    if (!sampleIds || loadingDefinitions || assayQueryConfigs === undefined) return <LoadingPage title={PAGE_TITLE} />;

    return <AssayResultsForSamplesWithModels queryConfigs={queryConfigs} {...props} />;
};

export const AssayResultsForSamplesPage = withAssayModels(AssayResultsForSamplesPageBody);
