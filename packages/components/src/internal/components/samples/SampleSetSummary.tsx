import React, { FC, memo, ReactNode, useCallback, useEffect, useState } from 'react'
import { SampleSetCards } from "./SampleSetCards";
import { SampleSetHeatMap } from "./SampleSetHeatMap";
import { GridPanelWithModel, SCHEMAS, AppURL, SelectInput, User, Location } from "../../..";

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
}

interface SampleSetSummaryProps {
    location?: Location,
    navigate: (url: string | AppURL) => any,
    user: User
}

export const SampleSetSummary: FC<SampleSetSummaryProps> = memo( props => {
    const { location, navigate, user } = props;

    const [ selected, setSelected ] = useState<string>()

    useEffect(() => {
        setSelected(location.query && location.query.viewAs ? location.query.viewAs : 'grid')
    }, [])

    const showHeatMap = (): boolean => {
        return selected === SELECTION_HEATMAP;
    }

    const showCards = (): boolean => {
        return selected === SELECTION_CARDS;
    }

    const showGrid = (): boolean => {
        return selected === SELECTION_GRID || selected === undefined;
    }

    const onSelectionChange = useCallback((selected, value) => {
        setSelected(value);
    }, []);

    const renderSelect = (): ReactNode => {
        return (
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
        )
    }

    return (
        <>
            {renderSelect()}
            {showHeatMap() && <SampleSetHeatMap navigate={navigate} user={user}/>}
            {showCards() && <SampleSetCards/>}
            {showGrid() &&
                <GridPanelWithModel queryConfig={SAMPLE_QUERY_CONFIG} asPanel={false} showPagination={true}/>}
        </>
    )

});