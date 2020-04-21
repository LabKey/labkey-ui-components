import React from 'react';
import { Filter } from '@labkey/api';
import { DetailPanelWithModel, QueryConfigMap, SchemaQuery } from '../../..';

import { LineageNode } from '../models';

export interface NodeDetailProps {
    node: LineageNode
}

export const NodeDetail: React.FC<NodeDetailProps> = (props) => {
    const { node } = props;
    const queryConfigs: QueryConfigMap = {
        'nodedetail': {
            schemaQuery: SchemaQuery.create(node.schemaName, node.queryName),
            baseFilters: node.pkFilters.map(pkFilter => Filter.create(pkFilter.fieldKey, pkFilter.value)).toArray()
        }
    };

    return <DetailPanelWithModel queryConfigs={queryConfigs} />
};
