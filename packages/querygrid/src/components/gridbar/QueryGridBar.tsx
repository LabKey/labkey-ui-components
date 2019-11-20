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

import { ChartSelector } from '../chart/ChartSelector'
import { Export } from './Export'
import { QueryGridPaging } from './QueryGridPaging'
import { ViewSelector } from "./ViewSelector";
import { URLBox } from './URLBox'
import { GridSelectionBanner } from "./GridSelectionBanner";
import { QueryGridModel } from '../base/models/model';

type QueryGridBarButtonResolver = (model?: QueryGridModel) => React.ReactNode;
export type QueryGridBarButtons = React.ReactNode | QueryGridBarButtonResolver;

interface QueryGridBarProps {
    buttons?: QueryGridBarButtons
    model: QueryGridModel
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
        const { buttons, model } = this.props;
        const buttonsNode = typeof buttons === 'function' ? (buttons as QueryGridBarButtonResolver)(model) : buttons;

        const box = model && model.showSearchBox ? (
            <URLBox
                key={model.getId()}
                queryModel={model}/>
        ) : null;

        const paging = model && model.isPaged ? (
            <QueryGridPaging model={model}/>
        ) : null;

        const exportBtn = model ? (
            <Export model={model} style={{paddingLeft: '10px'}}/>
        ) : null;

        const chart = model && model.showChartSelector ? (
            <ChartSelector model={model} style={buttonsNode ? {paddingLeft: '10px'} : {}}/>
        ) : null;

        const view = model && model.showViewSelector ? (
            <ViewSelector model={model} style={{paddingLeft: '10px'}}/>
        ) : null;

        let leftContent;

        if (buttons || chart) {
            leftContent = (
                <div className="col-md-6 col-sm-6 col-xs-12">
                    <div className="btn-group">
                        {buttonsNode}
                    </div>

                    {chart}
                </div>
            );
        }

        const rightContent = (
            <div className="col-md-6 col-sm-6 col-xs-12">
                <div className="paging pull-right text-nowrap">
                    {paging}

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
                    <div className="col-md-12 col-xs-12">
                        {box}
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-12 col-xs-12">
                        <GridSelectionBanner containerCls="QueryGrid-bottom-spacing" model={model}/>
                    </div>
                </div>
            </div>
        )
    }
}
