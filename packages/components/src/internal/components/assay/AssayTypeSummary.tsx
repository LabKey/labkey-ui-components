import React, { FC, memo, useMemo, useState } from 'react';

import { Filter } from '@labkey/api';

import { GridPanelWithModel, SCHEMAS, AppURL, AssaysHeatMap, SelectViewInput, SelectView } from '../../..';

const ASSAY_VIEWS = [SelectView.Grid, SelectView.Heatmap];

const ASSAY_GRID_GRID_ID = 'assaytypes-grid-panel';

const SAMPLE_QUERY_CONFIG = {
    urlPrefix: 'assaysgrid',
    isPaged: true,
    id: ASSAY_GRID_GRID_ID,
    schemaQuery: SCHEMAS.ASSAY_TABLES.ASSAY_LIST,
    bindURL: true,
};

interface AssayTypeSummaryProps {
    assayTypes?: string[];
    excludedAssayProviders?: string[];
    navigate: (url: string | AppURL) => any;
}

export const AssayTypeSummary: FC<AssayTypeSummaryProps> = memo(props => {
    const { navigate, assayTypes, excludedAssayProviders } = props;
    const [selectedView, setSelectedView] = useState(SelectView.Grid);

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

    return (
        <>
            <SelectViewInput
                defaultView={SelectView.Grid}
                id="assay-type-view-select"
                onViewSelect={setSelectedView}
                views={ASSAY_VIEWS}
            />
            {selectedView === SelectView.Heatmap && (
                <AssaysHeatMap navigate={navigate} excludedAssayProviders={excludedAssayProviders} />
            )}
            {selectedView === SelectView.Grid && (
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
