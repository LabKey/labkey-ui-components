import React, { FC, memo, useCallback, useEffect, useState, useMemo } from 'react';

import { Filter } from '@labkey/api';

import { GridPanelWithModel, SCHEMAS, AppURL, SelectInput, User, Location, AssaysHeatMap } from '../../..';
import { ASSAY_TABLES } from '../../schemas';

const SELECTION_HEATMAP = 'heatmap';
const SELECTION_GRID = 'grid';

const ASSAY_VIEW_OPTIONS = [
    { value: SELECTION_GRID, label: 'Grid' },
    { value: SELECTION_HEATMAP, label: 'Heatmap' },
];

const ASSAY_GRID_GRID_ID = 'assaytypes-grid-panel';

const SAMPLE_QUERY_CONFIG = {
    urlPrefix: 'assaysgrid',
    isPaged: true,
    id: ASSAY_GRID_GRID_ID,
    schemaQuery: SCHEMAS.ASSAY_TABLES.ASSAY_LIST,
    bindURL: true,
};

interface AssayTypeSummaryProps {
    navigate: (url: string | AppURL) => any;
    user: User;
    location?: Location;
    assayTypes?: string[];
    excludedAssayProviders?: string[];
}

export const AssayTypeSummary: FC<AssayTypeSummaryProps> = memo(props => {
    const { location, navigate, assayTypes, excludedAssayProviders } = props;

    const [selected, setSelected] = useState<string>();

    const queryConfig = useMemo(() => {
        return {
            ...SAMPLE_QUERY_CONFIG,
            baseFilters: assayTypes
                ? [Filter.create('Type', assayTypes, Filter.Types.IN)]
                : excludedAssayProviders
                ? [Filter.create('Type', excludedAssayProviders, Filter.Types.NOT_IN)]
                : undefined,
        };
    }, [assayTypes, excludedAssayProviders]);

    useEffect(() => {
        setSelected(location?.query?.viewAs ?? 'grid');
    }, [location]);

    const onSelectionChange = useCallback((selected, value) => {
        setSelected(value);
    }, []);

    return (
        <>
            <SelectInput
                key="assay-types-view-select"
                name="assay-types-view-select"
                id="assay-types-view-select"
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
                options={ASSAY_VIEW_OPTIONS}
            />
            {selected === SELECTION_HEATMAP && (
                <AssaysHeatMap navigate={navigate} excludedAssayProviders={excludedAssayProviders} />
            )}
            {(selected === SELECTION_GRID || selected === undefined) && (
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
