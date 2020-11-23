import React, { FC, memo, ReactNode, useCallback, useEffect, useState, useMemo } from 'react';

import { Filter } from '@labkey/api';

import { GridPanelWithModel, SCHEMAS, AppURL, SelectInput, User, Location } from '../../..';

import { SampleSetCards } from './SampleSetCards';
import { SampleSetHeatMap } from './SampleSetHeatMap';

const SELECTION_HEATMAP = 'heatmap';
const SELECTION_CARDS = 'cards';
const SELECTION_GRID = 'grid';

const SAMPLESET_VIEW_OPTIONS = [
    { value: SELECTION_CARDS, label: 'Cards' },
    { value: SELECTION_GRID, label: 'Grid' },
    { value: SELECTION_HEATMAP, label: 'Heatmap' },
];

const SAMPLE_SET_GRID_GRID_ID = 'samplesets-grid-panel';

const SAMPLE_QUERY_CONFIG = {
    urlPrefix: 'samplesetgrid',
    isPaged: true,
    id: SAMPLE_SET_GRID_GRID_ID,
    schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
};

interface SampleSetSummaryProps {
    location?: Location;
    navigate: (url: string | AppURL) => any;
    user: User;
    excludedSampleSets?: string[];
}

export const SampleSetSummary: FC<SampleSetSummaryProps> = memo(props => {
    const { location, navigate, user, excludedSampleSets } = props;

    const [selected, setSelected] = useState<string>();

    const queryConfig = useMemo(() => {
        return {
            ...SAMPLE_QUERY_CONFIG,
            baseFilters: excludedSampleSets
                ? [Filter.create('Name', excludedSampleSets, Filter.Types.NOT_IN)]
                : undefined,
        };
    }, [excludedSampleSets]);

    useEffect(() => {
        setSelected(location?.query?.viewAs ?? 'grid');
    }, [location]);

    const onSelectionChange = useCallback((selected, value) => {
        setSelected(value);
    }, []);

    return (
        <>
            <SelectInput
                key="sample-sets-view-select"
                name="sample-sets-view-select"
                placeholder="Select a view..."
                inputClass="col-xs-4 col-md-2"
                formsy={false}
                showLabel={false}
                multiple={false}
                required={false}
                value={selected}
                valueKey="value"
                labelKey="label"
                onChange={onSelectionChange}
                options={SAMPLESET_VIEW_OPTIONS}
            />
            {selected === SELECTION_HEATMAP && <SampleSetHeatMap navigate={navigate} user={user} />}
            {selected === SELECTION_CARDS && <SampleSetCards excludedSampleSets={excludedSampleSets} />}
            {selected === SELECTION_GRID || selected === undefined && (
                <GridPanelWithModel
                    queryConfig={queryConfig}
                    asPanel={false}
                    showPagination={true}
                    showChartMenu={false}
                />
            )}
        </>
    );
});
