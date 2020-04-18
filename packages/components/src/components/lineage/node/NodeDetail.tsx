import React, { PureComponent } from 'react';
import { Filter } from '@labkey/api';
import { DetailPanelWithModel, QueryConfigMap, SchemaQuery } from '../../..';

import { LineageNode } from '../models';

export interface NodeDetailProps {
    node: LineageNode
}

export class NodeDetail extends PureComponent<NodeDetailProps> {
    render() {
        const { node } = this.props;
        const queryConfigs: QueryConfigMap = {
            'nodedetail': {
                schemaQuery: SchemaQuery.create(node.schemaName, node.queryName),
                baseFilters: node.pkFilters.map(pkFilter => Filter.create(pkFilter.fieldKey, pkFilter.value)).toArray()
            }
        };

        return <DetailPanelWithModel queryConfigs={queryConfigs} />
    }
}
