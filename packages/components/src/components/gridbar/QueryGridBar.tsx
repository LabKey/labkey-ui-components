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
import React from 'reactn';
import { Map } from 'immutable';

import { ChartSelector } from '../chart/ChartSelector';

import { QueryGridModel } from '../base/models/model';

import { Export } from './Export';
import { QueryGridPaging } from './QueryGridPaging';
import { ViewSelector } from './ViewSelector';
import { URLBox } from './URLBox';
import { GridSelectionBanner } from './GridSelectionBanner';
import { PageSizeSelector } from './PageSizeSelector';

type QueryGridBarButtonResolver = (model?: QueryGridModel) => React.ReactNode;
export type QueryGridBarButtons = React.ReactNode | QueryGridBarButtonResolver;

interface QueryGridBarProps {
    buttons?: QueryGridBarButtons;
    model: QueryGridModel;
    showSampleComparisonReports?: boolean;
    onReportClicked?: Function;
    onCreateReportClicked?: Function;
    onSelectionChange?: (model: QueryGridModel, row: Map<string, any>, checked: boolean) => any;
    advancedExportOption?: Record<string, any>;
}

/**
 * Displays a bar of controls for a query grid based on the properties of the provided model.
 * This includes
 * - a URLBox for use in filtering and sorting (based on model.showSearchBox),
 * - a paging element (based on model.isPaged)
 * - an export menu (always)
 * - a chart selector (based on model.showChartSelector)
 * - a view selector (based on model.showViewSelector)
 * You may also provide a set of buttons to be displayed within the bar.
 */
export class QueryGridBar extends React.PureComponent<QueryGridBarProps, any> {
    render() {
        const {
            buttons,
            model,
            showSampleComparisonReports,
            onReportClicked,
            onCreateReportClicked,
            onSelectionChange,
            advancedExportOption,
        } = this.props;
        let buttonsNode = typeof buttons === 'function' ? (buttons as QueryGridBarButtonResolver)(model) : buttons;

        if (buttons) {
            buttonsNode = <div className="btn-group gridbar-buttons">{buttonsNode}</div>;
        }

        const box = model?.showSearchBox ? <URLBox key={model.getId()} queryModel={model} /> : null;

        const paging = model?.isPaged ? <QueryGridPaging model={model} /> : null;

        const pageSizeBtn = model?.isPaged ? <PageSizeSelector model={model} /> : null;

        const exportBtn = model?.showExport ? <Export model={model} advancedOption={advancedExportOption} /> : null;

        const chart = model?.showChartSelector ? (
            <ChartSelector
                model={model}
                showSampleComparisonReports={showSampleComparisonReports}
                onReportClicked={onReportClicked}
                onCreateReportClicked={onCreateReportClicked}
            />
        ) : null;

        const view = model?.showViewSelector ? <ViewSelector model={model} /> : null;

        let leftContent = <div className="col-md-6 col-sm-6 col-xs-12" />;

        if (buttons || chart) {
            leftContent = (
                <div className="col-md-6 col-sm-6 col-xs-12">
                    {buttonsNode}
                    {chart}
                </div>
            );
        }

        const rightContent = (
            <div className="col-md-6 col-sm-6 col-xs-12">
                <div className="paging pull-right text-nowrap">
                    {paging}
                    {pageSizeBtn}
                    {exportBtn}
                    {view}
                </div>
            </div>
        );

        return (
            <div className="query-grid-bar">
                <div className="row QueryGrid-bottom-spacing">
                    {leftContent}

                    {rightContent}
                </div>

                <div className="row QueryGrid-bottom-spacing">
                    <div className="col-md-12 col-xs-12">{box}</div>
                </div>

                <div className="row">
                    <div className="col-md-12 col-xs-12">
                        <GridSelectionBanner
                            containerCls="QueryGrid-bottom-spacing"
                            model={model}
                            onSelectionChange={onSelectionChange}
                        />
                    </div>
                </div>
            </div>
        );
    }
}
