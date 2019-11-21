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
import { naturalSort, QueryGridModel } from '@glass/base'

import { fetchCharts } from '../../actions'
import { DataViewInfo, IDataViewInfo } from '../../models'
import { ChartMenu } from './ChartMenu'
import { loadReports } from '../../';
import { DataViewInfoTypes, VISUALIZATION_REPORTS } from '../../constants';

const CHART_COMPARATOR = (chart: DataViewInfo): string => chart.name;

interface Props {
    model: QueryGridModel,
    showSampleComparisonReports?: boolean,
    onChartClicked?: Function,
}

interface State {
    publicCharts: List<DataViewInfo>,
    privateCharts: List<DataViewInfo>,
    error: string,
}

export class ChartSelector extends React.Component<Props, State> {
    static defaultProps = {
        showSampleComparisonReports: false,
        reportUrlMapper: undefined,
    };

    constructor(props) {
        super(props);
        this.state = {
            publicCharts: null,
            privateCharts: null,
            error: null,
        }
    }

    componentDidMount() {
        this.requestCharts();
    }

    componentDidUpdate(prevProps: Props) {
        const prevSQ = prevProps.model.queryInfo ? prevProps.model.queryInfo.schemaQuery : null;
        const curSQ = this.props.model.queryInfo ? this.props.model.queryInfo.schemaQuery : null;

        if (prevSQ !== curSQ) {
            this.requestCharts();
        }
    }
    
    setErrorStatus = () => {
        this.setState({
            privateCharts: null,
            publicCharts: null,
            error: 'Error loading charts for grid',
        });
    };

    requestChartsWithSampleComparisonReports = () => {
        const queryInfo = this.props.model.queryInfo;
        const targetSchema = queryInfo.schemaName;
        const targetQuery = queryInfo.name;
        // reset charts to null so we trigger loading status.
        this.setState({publicCharts: null, privateCharts: null});
        loadReports().then((charts) => {
            let publicCharts = List<DataViewInfo>();
            let privateCharts = List<DataViewInfo>();

            charts.forEach((rawReport: IDataViewInfo) => {
                const report = new DataViewInfo(rawReport);
                const type = report.type;
                // We have to check the schema and query here because loadReports loads *all* reports.
                const matchingSq = report.schemaName === targetSchema && report.queryName === targetQuery;
                const isVisualization = matchingSq && VISUALIZATION_REPORTS.contains(type);

                if (isVisualization || type === DataViewInfoTypes.SampleComparison) {
                    if (report.shared) {
                        publicCharts = publicCharts.push(new DataViewInfo(report));
                    } else {
                        privateCharts = privateCharts.push(report);
                    }
                }
            });

            publicCharts = publicCharts.sortBy(CHART_COMPARATOR, naturalSort).toList();
            privateCharts = privateCharts.sortBy(CHART_COMPARATOR, naturalSort).toList();
            this.setState({
                publicCharts,
                privateCharts,
            });
        }).catch(this.setErrorStatus);
    };

    requestChartsWithoutSampleComparisonReports = () => {
        const { queryInfo } = this.props.model;

        this.setState({publicCharts: null, privateCharts: null});
        fetchCharts(queryInfo.schemaQuery).then(data => {
            let publicCharts = List<DataViewInfo>();
            let privateCharts = List<DataViewInfo>();

            data.forEach((report) => {
                if (VISUALIZATION_REPORTS.contains(report.type)) {
                    if (report.shared) {
                        publicCharts = publicCharts.push(report);
                    } else {
                        privateCharts = privateCharts.push(report);
                    }
                }
            });

            this.setState({
                privateCharts: privateCharts.sortBy(CHART_COMPARATOR, naturalSort).toList(),
                publicCharts: publicCharts.sortBy(CHART_COMPARATOR, naturalSort).toList(),
            });
        }).catch(this.setErrorStatus);
    };

    requestCharts() {
        const queryInfo = this.props.model.queryInfo;

        // TODO: Would it be safe to just use model.schema and model.query instead? As far as I can tell by the time
        //  we're rendering the ChartSelector we will always a model with a schema and query. We won't always have a
        //  QueryInfo because we have to wait for getQueryDetails.
        if (!queryInfo || !queryInfo.schemaQuery) {
            return;
        }

        if (this.props.showSampleComparisonReports) {
            this.requestChartsWithSampleComparisonReports();
        } else {
            this.requestChartsWithoutSampleComparisonReports();
        }
    }

    render() {
        const { model, onChartClicked } = this.props;
        const { publicCharts, privateCharts, error } = this.state;

        return (
            <ChartMenu
                model={model}
                charts={publicCharts}
                privateCharts={privateCharts}
                onChartClicked={onChartClicked}
                error={error}
            />
        );
    }
}
