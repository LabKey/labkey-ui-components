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

const PAGE_TITLE = 'Assay Results for Samples';
const SUMMARY_GRID_ID = 'sample-run-count';

const AssayResultsForSamplesImpl: FC<WithRouterProps & InjectedQueryModels> = memo(props => {
    const { queryModels, actions } = props;
    const { user } = useServerContext();

    if (!isAssayEnabled()) return <NotFound title={PAGE_TITLE} />;
    if (!userCanReadAssays(user)) return <InsufficientPermissionsPage title={PAGE_TITLE} />;

    return (
        <Page title={PAGE_TITLE}>
            <Section title={PAGE_TITLE}>
                <TabbedGridPanel
                    actions={actions}
                    alwaysShowTabs
                    asPanel={false}
                    queryModels={queryModels}
                    showRowCountOnTabs
                    tabOrder={[SUMMARY_GRID_ID]}
                />
            </Section>
        </Page>
    );
});

const AssayResultsForSamplesWithModels = withQueryModels<WithRouterProps>(AssayResultsForSamplesImpl);

export const AssayResultsForSamples: FC<WithRouterProps> = props => {
    const { location } = props;
    const [sampleIds, setSampleIds] = useState<number[]>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        (async () => {
            try {
                const sampleIds_ = await getSelectedSampleIdsFromSelectionKey(location);
                setSampleIds(sampleIds_);
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            }
        })();
    }, [location]);

    // TODO move this to ui-components
    // TODO are we going the route of SampleAssayDetails and want to include assay data for aliquots of selected sampels?

    const queryConfigs: QueryConfigMap = useMemo(
        () => ({
            [SUMMARY_GRID_ID]: {
                id: SUMMARY_GRID_ID,
                title: 'Assay Runs',
                schemaQuery: SCHEMAS.EXP_TABLES.ASSAY_RUN_COUNT_PER_SAMPLE,
                baseFilters: [Filter.create('RowId', sampleIds, Filter.Types.IN)],
            },
        }),
        [sampleIds]
    );

    if (error) return <Alert>{error}</Alert>;
    if (!sampleIds) return <LoadingPage title={PAGE_TITLE} />;

    return <AssayResultsForSamplesWithModels autoLoad key="TODO" queryConfigs={queryConfigs} {...props} />;
};
