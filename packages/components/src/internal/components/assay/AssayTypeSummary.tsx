import React, { FC, memo, useState } from 'react';

import { AppURL, AssaysHeatMap, SelectViewInput, SelectView } from '../../..';

import { StatusGrid } from './StatusGrid';

const ASSAY_VIEWS = [SelectView.Grid, SelectView.Heatmap];

interface AssayTypeSummaryProps {
    assayTypes?: string[];
    excludedAssayProviders?: string[];
    navigate: (url: string | AppURL) => any;
}

export const AssayTypeSummary: FC<AssayTypeSummaryProps> = memo(props => {
    const { navigate, assayTypes, excludedAssayProviders } = props;
    const [selectedView, setSelectedView] = useState(SelectView.Grid);

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
                <StatusGrid assayTypes={assayTypes} excludedAssayProviders={excludedAssayProviders} />
            )}
        </>
    );
});
