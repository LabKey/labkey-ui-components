import React, { FC, memo, useMemo } from 'react';

import { Filter, PermissionTypes } from '@labkey/api';

import { Status } from '../internal/components/domainproperties/assay/models';

import { SCHEMAS } from '../internal/schemas';

import { TabbedGridPanel } from '../public/QueryModel/TabbedGridPanel';

import { hasAnyPermissions } from '../internal/components/base/models/User';
import { useServerContext } from '../internal/components/base/ServerContext';

import { InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';

const ACTIVE_GRID_ID = 'active';
const ALL_GRID_ID = 'all';

const ASSAY_LIST_QUERY_CONFIG = {
    urlPrefix: 'assaysgrid',
    isPaged: true,
    schemaQuery: SCHEMAS.ASSAY_TABLES.ASSAY_LIST,
    bindURL: true,
};

interface OwnProps {
    assayTypes?: string[];
    excludedAssayProviders?: string[];
}

const AssayTypeStatusGridImpl: FC<InjectedQueryModels> = memo(props => {
    const { actions, queryModels } = props;

    return (
        <TabbedGridPanel
            allowViewCustomization={false}
            tabOrder={[ACTIVE_GRID_ID, ALL_GRID_ID]}
            actions={actions}
            queryModels={queryModels}
            asPanel={false}
            advancedExportOptions={{ excludeColumn: ['LSID'] }}
        />
    );
});

export const AssayTypeStatusGridWithModels = withQueryModels(AssayTypeStatusGridImpl);

export const AssayTypeStatusGrid: FC<OwnProps> = memo(props => {
    const { assayTypes, excludedAssayProviders } = props;
    const { user } = useServerContext();

    const queryConfigs = useMemo(() => {
        const allBaseFilter = assayTypes
            ? [Filter.create('Type', assayTypes, Filter.Types.IN)]
            : excludedAssayProviders
            ? [Filter.create('Type', excludedAssayProviders, Filter.Types.NOT_IN)]
            : [];

        const activeBaseFilter = allBaseFilter.concat([Filter.create('Status', Status.Active)]);
        const canUpdate = hasAnyPermissions(user, [PermissionTypes.Insert, PermissionTypes.Update]);
        let requiredColumns;
        const omittedColumns = [];
        if (canUpdate) {
            requiredColumns = ['lsid'];
        } else {
            omittedColumns.push('lsid');
        }
        return {
            [ACTIVE_GRID_ID]: {
                ...ASSAY_LIST_QUERY_CONFIG,
                baseFilters: activeBaseFilter,
                id: ACTIVE_GRID_ID,
                title: 'Active',
                schemaQuery: SCHEMAS.ASSAY_TABLES.ASSAY_LIST,
                omittedColumns: [...omittedColumns, 'Status'],
                requiredColumns,
            },
            [ALL_GRID_ID]: {
                ...ASSAY_LIST_QUERY_CONFIG,
                baseFilters: allBaseFilter,
                id: ALL_GRID_ID,
                title: 'All',
                schemaQuery: SCHEMAS.ASSAY_TABLES.ASSAY_LIST,
                omittedColumns,
                requiredColumns,
            },
        };
    }, [assayTypes, excludedAssayProviders]);

    return <AssayTypeStatusGridWithModels queryConfigs={queryConfigs} />;
});
