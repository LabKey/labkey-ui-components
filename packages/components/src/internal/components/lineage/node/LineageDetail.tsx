import React, { PureComponent, ReactNode } from 'react';
import { Experiment, Filter } from '@labkey/api';

import { DetailPanelWithModel, SchemaQuery } from '../../../..';

export interface LineageDetailProps {
    item: Experiment.LineageItemBase;
}

export class LineageDetail extends PureComponent<LineageDetailProps> {
    render(): ReactNode {
        const { item } = this.props;
        // Without providing "key" the DetailPanelWithModel will stop updates
        return (
            <DetailPanelWithModel
                baseFilters={item.pkFilters.map(pkFilter => Filter.create(pkFilter.fieldKey, pkFilter.value))}
                key={item.lsid}
                schemaQuery={SchemaQuery.create(item.schemaName, item.queryName)}
            />
        );
    }
}
