import React, { FC, memo, useMemo } from 'react';

import { Filter } from '@labkey/api';

import { InjectedQueryModels, withQueryModels } from '../../../public/QueryModel/withQueryModels';
import { SCHEMAS, TabbedGridPanel } from '../../../index';

const ACTIVE_GRID_ID = 'active';
const ALL_GRID_ID = 'all';

const SAMPLE_QUERY_CONFIG = {
    urlPrefix: 'assaysgrid',
    isPaged: true,
    schemaQuery: SCHEMAS.ASSAY_TABLES.ASSAY_LIST,
    bindURL: true,
};

interface OwnProps {
    assayTypes?: string[];
    excludedAssayProviders?: string[];
}

const StatusGridImpl: FC<InjectedQueryModels> = memo(props => {
    const { actions, queryModels } = props;

    return (
        <div>
            <TabbedGridPanel tabOrder={['active', 'all']} actions={actions} queryModels={queryModels} asPanel={false} />
        </div>
    );
});

const StatusGridWithModels = withQueryModels(StatusGridImpl);

export const StatusGrid: FC<OwnProps> = memo(props => {
    const { assayTypes, excludedAssayProviders } = props;

    const queryConfigs = useMemo(() => {
        const allBaseFilter = assayTypes
            ? [Filter.create('Type', assayTypes, Filter.Types.IN)]
            : excludedAssayProviders
            ? [Filter.create('Type', excludedAssayProviders, Filter.Types.NOT_IN)]
            : undefined;

        const activeBaseFilter = allBaseFilter.concat([Filter.create('Status', 'Active')]);

        return {
            [ACTIVE_GRID_ID]: {
                ...SAMPLE_QUERY_CONFIG,
                baseFilters: activeBaseFilter,
                id: ACTIVE_GRID_ID,
                title: 'Active',
                schemaQuery: SCHEMAS.ASSAY_TABLES.ASSAY_LIST,
            },
            [ALL_GRID_ID]: {
                ...SAMPLE_QUERY_CONFIG,
                baseFilters: allBaseFilter,
                id: ALL_GRID_ID,
                title: 'All',
                schemaQuery: SCHEMAS.ASSAY_TABLES.ASSAY_LIST,
            },
        };
    }, [assayTypes, excludedAssayProviders]);

    return <StatusGridWithModels queryConfigs={queryConfigs} />;
});
