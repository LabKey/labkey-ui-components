import React, { FC, memo, useMemo } from 'react';
import { Experiment, Filter } from '@labkey/api';

import { DetailPanelWithModel, SchemaQuery } from '../../../..';

export interface LineageDetailProps {
    item: Experiment.LineageItemBase;
}

export const LineageDetail: FC<LineageDetailProps> = memo(({ item }) => {
    const queryConfig = useMemo(
        () => ({
            baseFilters: item.pkFilters.map(pkFilter => Filter.create(pkFilter.fieldKey, pkFilter.value)),
            schemaQuery: SchemaQuery.create(item.schemaName, item.queryName),
        }),
        [item],
    );

    // Without providing "key" the DetailPanelWithModel will stop updates
    return (
        <DetailPanelWithModel
            key={item.lsid}
            queryConfig={queryConfig}
        />
    );
});
