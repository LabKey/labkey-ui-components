import React, { PureComponent, ReactNode } from 'react';
import { Filter } from '@labkey/api';

import { DetailPanelWithModel, QueryConfigMap, SchemaQuery } from '../../..';

import { LineageBaseConfig } from '../models';

export interface LineageDetailProps {
    item: LineageBaseConfig;
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
