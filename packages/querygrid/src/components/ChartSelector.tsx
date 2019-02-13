/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'
import { List } from 'immutable'
import { QueryGridModel, resolveSchemaQuery } from '@glass/models'

import { fetchCharts } from '../actions'
import { DataViewInfo } from '../model'
import { getCharts, updateCharts } from '../global'
import { ChartMenu } from './ChartMenu'

interface Props {
    model: QueryGridModel
}

export class ChartSelector extends React.Component<Props, any> {

    componentWillMount() {
        this.requestCharts(this.props);
    }

    componentWillReceiveProps(nextProps: Props) {
        this.requestCharts(nextProps);
    }

    requestCharts(props: Props) {
        const { model } = props;

        if (model && model.queryInfo && model.queryInfo.schemaQuery) {
            const key = this.getSchemaQueryKey(props);

            // if the key does not yet exist in the global state, then fetch the chart infos
            if (key && getCharts(key) === undefined) {
                updateCharts(key, null);

                fetchCharts(model.queryInfo.schemaQuery).then(data => {
                    updateCharts(key, data);
                }).catch(error => {
                    updateCharts(key, List.of(new DataViewInfo({error: error})));
                });
            }
        }
    }

    getSchemaQueryKey(props: Props) {
        const { model } = props;

        return model.queryInfo && model.queryInfo.schemaQuery ? resolveSchemaQuery(model.queryInfo.schemaQuery) : null;
    }

    getChartsForQuery() {
        const key = this.getSchemaQueryKey(this.props);

        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid.charts.get(key);
    }

    render() {
        const { model } = this.props;

        return (
            <ChartMenu model={model} charts={this.getChartsForQuery()}/>
        )
    }
}