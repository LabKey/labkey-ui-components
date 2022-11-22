import React, { FC, memo, useMemo, useState } from 'react';

import { PermissionTypes, Query } from '@labkey/api';

import { SelectView, SelectViewInput } from '../internal/components/base/SelectViewInput';
import { SCHEMAS } from '../internal/schemas';
import { AppURL } from '../internal/url/AppURL';
import { hasAnyPermissions, User } from '../internal/components/base/models/User';
import { GridPanelWithModel } from '../public/QueryModel/GridPanel';
import { QuerySort } from '../public/QuerySort';

import { NON_MEDIA_SAMPLE_TYPES_FILTER } from '../internal/components/samples/constants';

import { SampleTypeHeatMap } from './SampleTypeHeatMap';
import { SampleTypeCards } from './SampleTypeCards';

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

interface Props {
    navigate: (url: string | AppURL) => any;
    user: User;
}

export const SampleTypeSummary: FC<Props> = memo(props => {
    const { navigate, user } = props;
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
            baseFilters: [NON_MEDIA_SAMPLE_TYPES_FILTER],
            requiredColumns,
            omittedColumns,
            sorts: [new QuerySort({ fieldKey: 'Name' })],
        };
    }, [canUpdate]);

    return (
        <>
            <SelectViewInput
                defaultView={SelectView.Grid}
                id="sample-type-view-select"
                onViewSelect={setSelectedView}
                views={SAMPLE_TYPE_VIEWS}
            />
            {selectedView === SelectView.Heatmap && <SampleTypeHeatMap navigate={navigate} user={user} />}
            {selectedView === SelectView.Cards && <SampleTypeCards />}
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
