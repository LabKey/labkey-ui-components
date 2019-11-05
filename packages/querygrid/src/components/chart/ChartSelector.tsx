/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'reactn'
import { List } from 'immutable'
import { QueryGridModel, resolveSchemaQuery } from '@glass/base'

import { fetchCharts } from '../../actions'
import { DataViewInfo } from '../../models'
import { getCharts, updateCharts } from '../../global'
import { ChartMenu } from './ChartMenu'

interface Props {
    model: QueryGridModel
    style?: Object
}

export class ChartSelector extends React.Component<Props, any> {

    componentDidMount() {
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
        return this.global.QueryGrid_charts.get(key);
    }

    render() {
        const { model, style } = this.props;

        return (
            <ChartMenu model={model} charts={this.getChartsForQuery()} style={style}/>
        )
    }
}