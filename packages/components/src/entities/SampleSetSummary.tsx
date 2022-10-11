import React, { FC, memo, useMemo, useState } from 'react';

import { Filter, PermissionTypes, Query } from '@labkey/api';

import { SelectView, SelectViewInput } from '../internal/components/base/SelectViewInput';
import { SCHEMAS } from '../internal/schemas';
import { AppURL } from '../internal/url/AppURL';
import { hasAnyPermissions, User } from '../internal/components/base/models/User';
import { GridPanelWithModel } from '../public/QueryModel/GridPanel';

import { SampleSetHeatMap } from './SampleSetHeatMap';
import { SampleSetCards } from './SampleSetCards';

const SAMPLE_TYPE_VIEWS = [SelectView.Cards, SelectView.Grid, SelectView.Heatmap];

const SAMPLE_SET_GRID_GRID_ID = 'samplesets-grid-panel';

const SAMPLE_QUERY_CONFIG = {
    urlPrefix: 'samplesetgrid',
    isPaged: true,
    id: SAMPLE_SET_GRID_GRID_ID,
    schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
    omittedColumns: ['ImportAliases', 'MaterialInputImportAliases', 'DataInputImportAliases', 'Folder'],
    containerFilter: Query.containerFilter.currentPlusProjectAndShared,
};

interface SampleSetSummaryProps {
    excludedSampleSets?: string[];
    navigate: (url: string | AppURL) => any;
    user: User;
}

export const SampleSetSummary: FC<SampleSetSummaryProps> = memo(props => {
    const { navigate, user, excludedSampleSets } = props;
    const [selectedView, setSelectedView] = useState(SelectView.Grid);

    const canUpdate = hasAnyPermissions(user, [PermissionTypes.Insert, PermissionTypes.Update]);
    const queryConfig = useMemo(() => {
        let requiredColumns;
        const omittedColumns = [...SAMPLE_QUERY_CONFIG.omittedColumns];
        if (canUpdate) {
            requiredColumns = ['lsid'];
        } else {
            omittedColumns.push('lsid');
        }

        return {
            ...SAMPLE_QUERY_CONFIG,
            baseFilters: excludedSampleSets
                ? [Filter.create('Name', excludedSampleSets, Filter.Types.NOT_IN)]
                : undefined,
            requiredColumns,
            omittedColumns,
        };
    }, [excludedSampleSets, canUpdate]);

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
                <GridPanelWithModel
                    allowViewCustomization={false}
                    advancedExportOptions={{ excludeColumn: ['lsid'] }}
                    queryConfig={queryConfig}
                    asPanel={false}
                    showPagination
                    showChartMenu={false}
                />
            )}
        </>
    );
});
