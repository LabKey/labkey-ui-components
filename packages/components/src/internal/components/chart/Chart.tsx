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
import { Filter } from '@labkey/api';
import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { DataViewInfoTypes, GENERIC_CHART_REPORTS, LABKEY_VIS } from '../../constants';

import { DataViewInfo } from '../../DataViewInfo';
import { getContainerFilterForFolder } from '../../query/api';
import { generateId } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { ChartAPIWrapper, DEFAULT_API_WRAPPER } from './api';
import { ChartConfig, ChartQueryConfig } from './models';
import { getChartRenderMsg } from './ChartBuilderModal';
import { CurveFitStatsGrid } from './CurveFitStatsGrid';
import { VegaLiteChart } from './VegaLiteChart';

interface ChartLoadingMaskProps {
    msg?: string;
}

const ChartLoadingMask: FC<ChartLoadingMaskProps> = memo(({ msg = 'Loading Chart...' }) => (
    <div className="chart-loading-mask">
        <div className="chart-loading-mask__background" />
        <LoadingSpinner msg={msg} wrapperClassName="loading-spinner" />
    </div>
));
ChartLoadingMask.displayName = 'ChartLoadingMask';

/**
 * Returns a string representation of a given filter array. Needed to properly memoize variables in functional
 * components that rely on a filter array from QueryModel, because QueryModel always returns a new filter array.
 * @param filters
 */
function computeFilterKey(filters: Filter.IFilter[]): string {
    if (!filters) return '';
    return filters
        .map(f => f.getURLParameterName() + '=' + f.getURLParameterValue())
        .sort()
        .join('_');
}

interface Dimensions {
    height: number;
    width: number;
}

const MAX_DEFAULT_HEIGHT = 500;

function computeDimensions(chartConfig: ChartConfig, measureStore, defaultWidth: number): Dimensions {
    let width = chartConfig.width;
    let height = chartConfig.height;

    if (width === undefined) {
        // Issue 49754: use getChartTypeBasedWidth() to determine width
        width = LABKEY_VIS.GenericChartHelper.getChartTypeBasedWidth(
            chartConfig.renderType,
            chartConfig.measures,
            measureStore,
            defaultWidth
        );
    }

    if (height === undefined) {
        height = (width * 9) / 16; // 16:9 aspect ratio
        if (height > MAX_DEFAULT_HEIGHT) height = MAX_DEFAULT_HEIGHT;
    }

    return { height, width };
}

interface Props {
    api?: ChartAPIWrapper;
    chart: DataViewInfo;
    container?: string;
    filters?: Filter.IFilter[];
    queryParameters?: Record<string, any>;
}

export const SVGChart: FC<Props> = memo(({ api, chart, container, filters, queryParameters }) => {
    const { error, reportId } = chart;
    const divId = useMemo(() => generateId('chart-'), []);
    const containerFilter = useMemo(() => getContainerFilterForFolder(container), [container]);
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [queryConfig, setQueryConfig] = useState<ChartQueryConfig>(undefined);
    const [chartConfig, setChartConfig] = useState<ChartConfig>(undefined);
    const [loadingData, setLoadingData] = useState<boolean>(false);
    const [measureStore, setMeasureStore] = useState<any>(undefined);
    const [trendlineData, setTrendlineData] = useState<any>(undefined);
    const [plot, setPlot] = useState(undefined);
    const [renderMsg, setRenderMsg] = useState<string>(undefined);
    const [loadError, setLoadError] = useState<string>(undefined);
    const filterKey = useMemo(() => computeFilterKey(filters), [filters]);
    const ref = useRef<HTMLDivElement>(undefined);
    const loadChartConfig = useCallback(async () => {
        setLoadingState(LoadingState.LOADING);
        setRenderMsg(undefined);
        setMeasureStore(undefined);
        setTrendlineData(undefined);
        try {
            const savedChartModel = await api.fetchGenericChart(reportId);

            const chartConfig_ = { ...savedChartModel.visualizationConfig.chartConfig };
            setChartConfig(chartConfig_);

            const queryConfig_ = savedChartModel.visualizationConfig.queryConfig;
            queryConfig_.containerFilter = containerFilter;
            queryConfig_.requiredVersion = '17.1'; // Issue 47898: include formattedValue in response row objects
            if (filters) {
                queryConfig_.filterArray = [...queryConfig_.filterArray, ...filters];
            }
            queryConfig_.parameters = queryParameters;
            setQueryConfig(queryConfig_);
        } catch (e) {
            setLoadError(e.exception);
        } finally {
            setLoadingState(LoadingState.LOADED);
        }
        // We purposely don't use filters as a dep, see note in computeFilterKey
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, containerFilter, reportId, filterKey]);

    const updateChartSize = useCallback(() => {
        // call to setChartConfig to force re-render
        setChartConfig(currentChartConfig => ({ ...currentChartConfig }));
    }, []);

    useEffect(() => {
        if (!error) {
            loadChartConfig();
        }
    }, [error, loadChartConfig]);

    useEffect(() => {
        window.addEventListener('resize', updateChartSize);
        return () => window.removeEventListener('resize', updateChartSize);
    }, [updateChartSize]);

    useEffect(() => {
        const render = (): void => {
            if (queryConfig !== undefined && chartConfig !== undefined) {
                ref.current.innerHTML = '';
                if (!measureStore) {
                    setLoadingData(true);
                    LABKEY_VIS.GenericChartHelper.queryChartData(
                        divId,
                        queryConfig,
                        chartConfig,
                        (_measureStore, _trendlineData) => {
                            const rowCount = LABKEY_VIS.GenericChartHelper.getMeasureStoreRecords(_measureStore).length;
                            setRenderMsg(getChartRenderMsg(chartConfig, rowCount, false));

                            setMeasureStore(_measureStore);
                            setTrendlineData(_trendlineData);
                            setLoadingData(false);
                        }
                    );
                } else {
                    const plots = LABKEY_VIS.GenericChartHelper.generateChartSVG(
                        divId,
                        {
                            ...chartConfig,
                            // Issue 49754: need to wait until we have measureStore to calculated width
                            ...computeDimensions(chartConfig, measureStore, ref.current.offsetWidth),
                        },
                        measureStore,
                        trendlineData
                    );
                    if (plots) setPlot(plots[0]);
                }
            }
        };
        // Debounce the call to render because we may trigger many resize events back to back, which will produce many
        // new chartConfig objects
        const renderId = window.setTimeout(render, 250);
        return () => window.clearTimeout(renderId);
    }, [divId, chartConfig, queryConfig, measureStore, trendlineData]);

    // console.log('chartConfig', chartConfig);
    // console.log('measureStore', measureStore);
    // console.log('trendlineData', trendlineData);
    return (
        <div className="svg-chart chart-body">
            {error !== undefined && <span className="text-danger">{error}</span>}
            {loadError !== undefined && <span className="text-danger">{loadError}</span>}
            {(isLoading(loadingState) || loadingData) && <ChartLoadingMask />}
            {renderMsg && <span className="gray-text pull-right">{renderMsg}</span>}
            <div className="svg-chart__chart" id={divId} ref={ref} />
            {/*{!(isLoading(loadingState) || loadingData) && (*/}
            {/*    <VegaLiteChart*/}
            {/*        chart={chart}*/}
            {/*        chartConfig={chartConfig}*/}
            {/*        measureStore={measureStore}*/}
            {/*        trendlineData={trendlineData}*/}
            {/*    />*/}
            {/*)}*/}
            {trendlineData !== undefined && (
                <CurveFitStatsGrid name={chart.name} plot={plot} trendLineData={trendlineData} />
            )}
        </div>
    );
});
SVGChart.displayName = 'SVGChart';

interface FileAnchor {
    href: string;
    text: string;
}

interface RReportData {
    error?: string;
    fileAnchors: FileAnchor[];
    imageUrls: string[];
}

function parseRReportHtml(html: string): RReportData {
    let _fileAnchors;
    let _imageUrls;
    let error;
    if (html !== undefined) {
        // The HTML returned by our server includes a bunch of stuff we don't want. So instead of inserting it
        // directly we'll just grab the URLs for all the images named "resultImage", which are the outputs from an
        // R Report.
        const el = document.createElement('div');
        el.innerHTML = html;
        const resultAnchors = el.querySelectorAll('a[href*="reports-streamFile.view"]');
        _fileAnchors = Array.from(resultAnchors).map((anchor: HTMLAnchorElement) => ({
            href: anchor.href,
            text: anchor.innerText,
        }));
        const resultImages = el.querySelectorAll('img[name="resultImage"]');
        _imageUrls = Array.from(resultImages).map((img: HTMLImageElement) => img.src);
        const errorEl = el.querySelector('.labkey-error');

        if (errorEl) {
            error = errorEl.parentElement.querySelector('pre')?.innerText;
        }
    }

    return {
        error,
        fileAnchors: _fileAnchors?.length > 0 ? _fileAnchors : undefined,
        imageUrls: _imageUrls?.length > 0 ? _imageUrls : undefined,
    };
}

const RReport: FC<Props> = memo(({ api, chart, container, filters }) => {
    const { dataRegionName, error: chartError, reportId } = chart;
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [reportHtml, setReportHtml] = useState<string>(undefined);
    const [loadError, setLoadError] = useState<string>(undefined);
    const filterKey = useMemo(() => computeFilterKey(filters), [filters]);
    const loadReport = useCallback(async () => {
        setLoadingState(LoadingState.LOADING);
        setLoadError(undefined);

        try {
            const html = await api.fetchRReport(reportId, dataRegionName, container, filters);
            setReportHtml(html);
        } catch (e) {
            setLoadError(e.exception);
        } finally {
            setLoadingState(LoadingState.LOADED);
        }
        // We purposely don't use filters as a dep, see note in computeFilterKey
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, reportId, filterKey]);
    const { error: outputError, fileAnchors, imageUrls } = useMemo(() => parseRReportHtml(reportHtml), [reportHtml]);

    useEffect(() => {
        if (chartError) {
            // We won't bother loading anything if the chart object has an error
            setLoadingState(LoadingState.LOADED);
        } else {
            loadReport();
        }
    }, [chartError, loadReport]);

    const isEmpty =
        loadingState === LoadingState.LOADED &&
        chartError === undefined &&
        fileAnchors === undefined &&
        imageUrls === undefined;

    return (
        <div className="r-report chart-body">
            {chartError !== undefined && <span className="text-danger">{chartError}</span>}
            {loadError !== undefined && <span className="text-danger">{loadError}</span>}
            {outputError !== undefined && (
                <div>
                    <span className="text-danger">An error occurred while executing the report:</span>
                    <pre>{outputError}</pre>
                </div>
            )}
            {isLoading(loadingState) && <ChartLoadingMask msg="Loading Report..." />}
            {isEmpty && (
                <div className="r-report__errors text-danger">
                    No output detected. You may not have enough data, or there may be an issue with your R Report.
                </div>
            )}
            {fileAnchors !== undefined && (
                <div className="r-report__files">
                    {fileAnchors.map(({ href, text }) => {
                        return (
                            <a className="attachment-card" href={href} key={href} title={text}>
                                <div className="attachment-card__body">
                                    <div className="attachment-card__icon">
                                        <span className="attachment-card__icon_tile fa fa-file-text-o" />
                                    </div>
                                    <div className="attachment-card__content">
                                        <div className="attachment-card__name">{text}</div>
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
            {imageUrls !== undefined && (
                <div className="r-report__images">
                    {imageUrls.map(url => (
                        <div className="r-report__image" key={url}>
                            <img alt="R Report Image Output" src={url} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});
RReport.displayName = 'RReport';

export const Chart: FC<Props> = memo(({ api = DEFAULT_API_WRAPPER, chart, container, filters, queryParameters }) => {
    if (chart.type === DataViewInfoTypes.RReport) {
        return <RReport api={api} chart={chart} container={container} filters={filters} />;
    } else if (GENERIC_CHART_REPORTS.indexOf(chart.type) > -1) {
        return (
            <SVGChart
                api={api}
                chart={chart}
                container={container}
                filters={filters}
                queryParameters={queryParameters}
            />
        );
    }
    return null;
});

Chart.displayName = 'Chart';
