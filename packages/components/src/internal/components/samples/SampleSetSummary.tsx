import React, { FC, memo, useMemo, useState } from 'react';

import { Filter } from '@labkey/api';

import { GridPanelWithModel, SCHEMAS, AppURL, User, SelectViewInput, SelectView } from '../../..';

import { SampleSetCards } from './SampleSetCards';
import { SampleSetHeatMap } from './SampleSetHeatMap';

const SAMPLE_TYPE_VIEWS = [SelectView.Cards, SelectView.Grid, SelectView.Heatmap];

const SAMPLE_SET_GRID_GRID_ID = 'samplesets-grid-panel';

const SAMPLE_QUERY_CONFIG = {
    urlPrefix: 'samplesetgrid',
    isPaged: true,
    id: SAMPLE_SET_GRID_GRID_ID,
    schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
};

interface SampleSetSummaryProps {
    excludedSampleSets?: string[];
    navigate: (url: string | AppURL) => any;
    user: User;
}

export const SampleSetSummary: FC<SampleSetSummaryProps> = memo(props => {
    const { navigate, user, excludedSampleSets } = props;
    const [selectedView, setSelectedView] = useState(SelectView.Grid);

    const queryConfig = useMemo(() => {
        return {
            ...SAMPLE_QUERY_CONFIG,
            baseFilters: excludedSampleSets
                ? [Filter.create('Name', excludedSampleSets, Filter.Types.NOT_IN)]
                : undefined,
        };
    }, [excludedSampleSets]);

    return (
        <>
            <SelectViewInput
                defaultView={SelectView.Grid}
                id="sample-type-view-select"
                onViewSelect={setSelectedView}
                views={SAMPLE_TYPE_VIEWS}
            />
            {selectedView === SelectView.Heatmap && <SampleSetHeatMap navigate={navigate} user={user} />}
            {selectedView === SelectView.Cards && <SampleSetCards excludedSampleSets={excludedSampleSets} />}
            {selectedView === SelectView.Grid && (
                <GridPanelWithModel queryConfig={queryConfig} asPanel={false} showPagination showChartMenu={false} />
            )}
        </>
    );
});
