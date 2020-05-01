import React, { PureComponent, ReactNode } from 'react';
import { Experiment, Filter } from '@labkey/api';

import { DetailPanelWithModel, QueryConfigMap, SchemaQuery } from '../../..';

export interface LineageDetailProps {
    item: Experiment.LineageItemBase;
}

export class LineageDetail extends PureComponent<LineageDetailProps> {
    render(): ReactNode {
        const { item } = this.props;
        const queryConfigs: QueryConfigMap = {
            [item.lsid]: {
                schemaQuery: SchemaQuery.create(item.schemaName, item.queryName),
                baseFilters: item.pkFilters.map(pkFilter => Filter.create(pkFilter.fieldKey, pkFilter.value)),
            },
        };

        // TODO: Without providing "key" the DetailPanelWithModel will stop updates
        return <DetailPanelWithModel key={item.lsid} queryConfigs={queryConfigs} />;
    }
}
