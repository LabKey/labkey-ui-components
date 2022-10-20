import React, { FC, memo, useEffect, useState } from 'react';
import { WithRouterProps } from 'react-router';
import { List } from 'immutable';
import { Filter, Utils } from '@labkey/api';

import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../public/QueryModel/withQueryModels';
import { useServerContext } from '../internal/components/base/ServerContext';
import { isAssayEnabled, userCanReadAssays } from '../internal/app/utils';
import { NotFound } from '../internal/components/base/NotFound';
import { InsufficientPermissionsPage } from '../internal/components/permissions/InsufficientPermissionsPage';
import { Page } from '../internal/components/base/Page';
import { Section } from '../internal/components/base/Section';
import { TabbedGridPanel } from '../public/QueryModel/TabbedGridPanel';
import { getSelectedSampleIdsFromSelectionKey } from '../internal/components/samples/actions';
import { resolveErrorMessage } from '../internal/util/messaging';
import { SCHEMAS } from '../internal/schemas';
import { Alert } from '../internal/components/base/Alert';
import { LoadingPage } from '../internal/components/base/LoadingPage';

import { selectRows } from '../internal/query/selectRows';
import { ASSAY_RUNS_GRID_ID, getSamplesAssayGridQueryConfigs } from './utils';
import { useAppContext } from '../internal/AppContext';
import { isLoading } from '../public/LoadingState';
import { QueryModel } from '../public/QueryModel/QueryModel';
import { naturalSortByProperty } from '../public/sort';

import { AppURL } from '../internal/url/AppURL';
import { ASSAYS_KEY } from '../internal/app/constants';
import { SubNav } from '../internal/components/navigation/SubNav';
import { ITab } from '../internal/components/navigation/types';

import { InjectedAssayModel, withAssayModels } from '../internal/components/assay/withAssayModels';

const PAGE_TITLE = 'Assay Results for Samples';
const ASSAY_GRID_ID_PREFIX = 'sampleresults-per-assay';
const ASSAY_GRID_ID_SUFFIX = 'samples';

interface OwnProps {
    sampleIds: number[];
}

type Props = OwnProps & WithRouterProps & InjectedAssayModel;

const AssayResultsForSamplesImpl: FC<Props & InjectedQueryModels> = memo(props => {
    const { queryModels, actions, sampleIds } = props;
    const { user } = useServerContext();
    const [tabOrder, setTabOrder] = useState<string[]>();
    const allModels = Object.values(queryModels);
    const allLoaded = allModels.every(model => !model.isLoading);

    useEffect(() => {
        if (isAssayEnabled() && userCanReadAssays(user)) {
            actions.loadAllModels(true);
        }
    }, [actions, user]);

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
        // make sure the ASSAY_RUNS_GRID_ID tab is first
        const summaryGridId = `${ASSAY_GRID_ID_PREFIX}:${ASSAY_RUNS_GRID_ID}:${ASSAY_GRID_ID_SUFFIX}`;
        if (tabOrder_.indexOf(summaryGridId) > -1) {
            tabOrder_.splice(tabOrder_.indexOf(summaryGridId), 1);
            tabOrder_.unshift(summaryGridId);
        }
        setTabOrder(tabOrder_);
    }, [allLoaded, tabOrder, allModels]);

    if (!isAssayEnabled()) return <NotFound title={PAGE_TITLE} />;
    if (!userCanReadAssays(user)) return <InsufficientPermissionsPage title={PAGE_TITLE} />;
    if (tabOrder === undefined) return <LoadingPage title={PAGE_TITLE} />;

    return (
        <Page title={PAGE_TITLE}>
            <Section title={`Assay Results for ${Utils.pluralBasic(sampleIds?.length, 'Sample')}`}>
                <TabbedGridPanel
                    actions={actions}
                    alwaysShowTabs
                    asPanel={false}
                    loadOnMount={false}
                    queryModels={queryModels}
                    showRowCountOnTabs
                    tabOrder={tabOrder}
                    exportFilename="AssayResultsForSamples"
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

        setAssayQueryConfigs(undefined);
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
                    ASSAY_GRID_ID_SUFFIX,
                    ASSAY_GRID_ID_PREFIX
                );
                setAssayQueryConfigs(assayQueryConfigs_);
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            }
        })();
    }, [api.samples, assayModel, loadingDefinitions, location]);

    if (error) return <Alert>{error}</Alert>;
    if (!sampleIds || loadingDefinitions || assayQueryConfigs === undefined) return <LoadingPage title={PAGE_TITLE} />;

    return <AssayResultsForSamplesWithModels sampleIds={sampleIds} queryConfigs={assayQueryConfigs} {...props} />;
};

export const AssayResultsForSamplesPage = withAssayModels(AssayResultsForSamplesPageBody);

export const AssayResultsForSamplesSubNav: FC = () => {
    const parentTab: ITab = {
        text: 'Assays',
        url: AppURL.create(ASSAYS_KEY),
    };

    const tabs = List.of({
        text: PAGE_TITLE,
        url: AppURL.create(ASSAYS_KEY, 'sampleresults'),
    } as ITab);

    return <SubNav tabs={tabs} noun={parentTab} />;
};
