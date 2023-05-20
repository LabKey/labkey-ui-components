import React, { FC, memo, useMemo } from 'react';

import {Filter, PermissionTypes, Query} from '@labkey/api';

import { SCHEMAS } from '../internal/schemas';
import { AppURL } from '../internal/url/AppURL';
import { hasAnyPermissions, User } from '../internal/components/base/models/User';
import { GridPanelWithModel } from '../public/QueryModel/GridPanel';
import { QuerySort } from '../public/QuerySort';

import { NON_MEDIA_SAMPLE_TYPES_FILTER } from '../internal/components/samples/constants';
import {useServerContext} from "../internal/components/base/ServerContext";
import {getProjectDataExclusion} from "../internal/app/utils";

const SAMPLE_SET_GRID_GRID_ID = 'samplesets-grid-panel';

const SAMPLE_QUERY_CONFIG = {
    urlPrefix: 'samplesetgrid',
    isPaged: true,
    id: SAMPLE_SET_GRID_GRID_ID,
    schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
    omittedColumns: ['ImportAliases', 'MaterialInputImportAliases', 'DataInputImportAliases'],
    containerFilter: Query.containerFilter.currentPlusProjectAndShared,
};

interface Props {
    navigate: (url: string | AppURL) => any;
    user: User;
}

export const SampleTypeSummary: FC<Props> = memo(props => {
    const { moduleContext } = useServerContext();
    const dataTypeExclusions = getProjectDataExclusion(moduleContext);
    const { user } = props;

    const canUpdate = hasAnyPermissions(user, [PermissionTypes.Insert, PermissionTypes.Update]);
    const queryConfig = useMemo(() => {
        let requiredColumns;
        const omittedColumns = [...SAMPLE_QUERY_CONFIG.omittedColumns];
        if (canUpdate) {
            requiredColumns = ['lsid'];
        } else {
            omittedColumns.push('lsid');
        }

        const excludedSampleTypes = dataTypeExclusions?.['SampleType'];
        const filters = [NON_MEDIA_SAMPLE_TYPES_FILTER];
        if (excludedSampleTypes && excludedSampleTypes.length > 0)
            filters.push(Filter.create('RowId', excludedSampleTypes, Filter.Types.NOT_IN));

        return {
            ...SAMPLE_QUERY_CONFIG,
            baseFilters: filters,
            requiredColumns,
            omittedColumns,
            sorts: [new QuerySort({ fieldKey: 'Name' })],
            includeTotalCount: true,
        };
    }, [canUpdate, dataTypeExclusions]);

    return (
        <GridPanelWithModel
            allowViewCustomization={false}
            advancedExportOptions={{ excludeColumn: ['lsid'] }}
            queryConfig={queryConfig}
            asPanel={false}
            showChartMenu={false}
        />
    );
});
