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
import { Ajax, Filter, Query, Utils } from '@labkey/api';
import { List, Record } from 'immutable';
import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { DataViewInfoTypes, LABKEY_VIS } from '../../constants';

import { DataViewInfo } from '../../DataViewInfo';
import { buildURL } from '../../url/AppURL';
import { debounce, generateId } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';

class ChartConfigModel extends Record({
    geomOptions: undefined,
    height: undefined,
    labels: undefined,
    measures: undefined,
    pointType: undefined,
    renderType: undefined,
    scales: undefined,
    width: undefined,
}) {
    declare geomOptions: any;
    declare height: number;
    declare labels: any;
    declare measures: any;
    declare pointType: string;
    declare renderType: string;
    declare scales: any;
    declare width: number;
}

class QueryConfigModel extends Record({
    columns: undefined,
    containerPath: undefined,
    // dataRegionName: undefined,
    filterArray: undefined,
    maxRows: undefined,
    method: undefined,
    parameters: undefined,
    // queryLabel: undefined,
    queryName: undefined,
    requiredVersion: undefined,
    schemaName: undefined,
    // sort: undefined,
    viewName: undefined,
}) {
    declare columns: List<string>;
    declare containerPath: string;
    // declare dataRegionName: string;
    declare filterArray: List<any>;
    declare maxRows: number;
    declare method: string;
    declare parameters: any;
    // declare queryLabel: string;
    declare queryName: string;
    declare requiredVersion: string;
    declare schemaName: string;
    // declare sort: string;
    declare viewName: string;
}

class VisualizationConfigModel extends Record({
    queryConfig: undefined,
    chartConfig: undefined,
}) {
    declare queryConfig: QueryConfigModel;
    declare chartConfig: ChartConfigModel;

    static create(raw: any): VisualizationConfigModel {
        return new VisualizationConfigModel(
            Object.assign({}, raw, {
                chartConfig: new ChartConfigModel(raw.chartConfig),
                queryConfig: new QueryConfigModel(raw.queryConfig),
            })
        );
    }
}

function getVisualizationConfig(reportId: string): Promise<VisualizationConfigModel> {
    return new Promise((resolve, reject) => {
        Query.Visualization.get({
            reportId,
            name: undefined,
            schemaName: undefined,
            queryName: undefined,
            success: response => {
                resolve(VisualizationConfigModel.create(response.visualizationConfig));
            },
            failure: reject,
        });
    });
}

interface Props {
    chart: DataViewInfo;
    filters?: Filter.IFilter[];
}

interface State {
    config: VisualizationConfigModel;
    divId: string;
}

class SVGChart extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            divId: generateId('chart-'),
            config: undefined,
        };

        this.handleResize = debounce(this.handleResize.bind(this), 250);
    }

    componentDidMount(): void {
        window.addEventListener('resize', this.handleResize);
        this.getChartConfig();
    }

    componentWillUnmount(): void {
        window.removeEventListener('resize', this.handleResize);
    }

    shouldComponentUpdate(): boolean {
        return false;
    }

    handleResize(): void {
        this.renderChart();
    }

    getPlotElement(): HTMLDivElement {
        return document.querySelector('#' + this.state.divId);
    }

    getChartConfig(): void {
        const { chart } = this.props;

        if (chart) {
            if (chart.error) {
                this.getPlotElement().innerHTML = chart.error;
            } else {
                getVisualizationConfig(chart.reportId)
                    .then(config => {
                        this.setState({ config });
                        this.renderChart();
                    })
                    .catch(response => {
                        this.renderError(response.exception);
                    });
            }
        } else {
            this.getPlotElement().innerHTML = 'No chart selected.';
        }
    }

    renderError(msg): void {
        this.getPlotElement().innerHTML = '<span class="text-danger">' + msg + '</span>';
    }

    renderChart(): void {
        const { filters } = this.props;
        const { config } = this.state;
        const processedConfig = config.toJS();

        if (config) {
            // set the size of the SVG based on the plot el width (i.e. the model width)
            processedConfig.chartConfig.width = this.getPlotElement().offsetWidth;
            processedConfig.chartConfig.height = (processedConfig.chartConfig.width * 9) / 16; // 16:9 aspect ratio

            if (filters && filters.length > 0) {
                processedConfig.queryConfig.filterArray = [...processedConfig.queryConfig.filterArray, ...filters];
            }

            this.getPlotElement().innerHTML = '';
            LABKEY_VIS.GenericChartHelper.renderChartSVG(
                this.state.divId,
                processedConfig.queryConfig,
                processedConfig.chartConfig
            );
        }
    }

    render(): ReactNode {
        return (
            <div id={this.state.divId}>
                <LoadingSpinner />
            </div>
        );
    }
}

function fetchRReport(reportId: string, filters?: Filter.IFilter[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const params = { reportId, 'webpart.name': 'report' };
        if (filters) {
            filters.forEach(filter => {
                params[filter.getURLParameterName()] = filter.getURLParameterValue();
            });
        }
        const url = buildURL('project', 'getWebPart.view', params);
        Ajax.request({
            url,
            success: Utils.getCallbackWrapper(response => {
                resolve(response.html);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

const RReport: FC<Props> = memo(({ chart, filters }) => {
    const { error, reportId } = chart;
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [reportHtml, setReportHtml] = useState<string>(undefined);
    const [loadError, setLoadError] = useState<string>(undefined);
    const filterKey = useMemo(() => {
        // Note the incoming filters object comes from QueryModel.filters, which is not cached/memoized thus is a new
        // array every render cycle. To get around this we create a "filterKey" that is a string representation of the
        // incoming filter array, and we only trigger a reload if the key changes.
        return (
            filters
                ?.map(f => f.getURLParameterName() + '=' + f.getURLParameterValue)
                .sort()
                .join('_') ?? ''
        );
    }, [filters]);
    const loadReport = useCallback(async () => {
        setLoadingState(LoadingState.LOADING);
        setLoadError(undefined);

        try {
            const html = await fetchRReport(reportId, filters);
            setReportHtml(html);
        } catch (e) {
            setLoadError(e.exception);
        } finally {
            setLoadingState(LoadingState.LOADED);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reportId, filterKey]);
    const imageUrls = useMemo(() => {
        if (reportHtml !== undefined) {
            // The HTML returned by our server includes a bunch of stuff we don't want. So instead of inserting it
            // directly we'll just grab the URLs for all the images named "resultImage", which are the outputs from an
            // R Report.
            const el = document.createElement('div');
            el.innerHTML = reportHtml;
            const resultImages = el.querySelectorAll('img[name="resultImage"]');
            return Array.from(resultImages).map((img: HTMLImageElement) => img.src);
        }

        return undefined;
    }, [reportHtml]);

    useEffect(() => {
        if (error) {
            // We won't bother loading anything if the chart object has an error
            setLoadingState(LoadingState.LOADED);
        } else {
            loadReport();
        }
    }, [error, loadReport]);

    return (
        <div className="r-report">
            {isLoading(loadingState) && <LoadingSpinner />}
            {error !== undefined && <span className="text-danger">{error}</span>}
            {loadError !== undefined && <span className="text-danger">{loadError}</span>}
            {imageUrls !== undefined && (
                <div className="r-report__images">
                    {imageUrls?.map(url => (
                        <img alt="R Report Image Output" key={url} src={url} />
                    ))}
                </div>
            )}
        </div>
    );
});
RReport.displayName = 'RReport';

export const Chart: FC<Props> = memo(({ chart, filters }) => {
    if (chart.type === DataViewInfoTypes.RReport) {
        return <RReport chart={chart} filters={filters} />;
    }

    return <SVGChart chart={chart} filters={filters} />;
});

Chart.displayName = 'Chart';
