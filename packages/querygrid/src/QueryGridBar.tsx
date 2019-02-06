/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'

// import { URLBox } from '../Input/URLBox'

// import { QueryPaging } from './Paging'
import { QueryGridModel } from './model'
// import { GridSelectionBanner } from './GridSelectionBanner'
import { Export } from './Export'
import { ViewSelector } from "./ViewSelector";
// import { ChartSelector } from '../Charts/ChartSelector'

const layouts = {
    NO_BUTTONS: {
        LEFT: false,
        CENTER: 'col-sm-8 col-md-8',
        RIGHT: 'col-sm-4 col-md-4',
        MED_SM_LEFT: false,
        MED_SM_CENTER: 'col-xs-12',
        MED_SM_RIGHT: 'col-xs-12'
    },
    STANDARD: {
        LEFT: 'col-sm-4 col-md-4',
        CENTER: 'col-sm-4 col-md-4',
        RIGHT: 'col-sm-4 col-md-4',
        MED_SM_LEFT: 'col-md-7 col-sm-6 col-xs-12',
        MED_SM_CENTER: 'col-md-12 col-xs-12',
        MED_SM_RIGHT: 'col-md-5 col-sm-6 col-xs-12'
    }
};

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
export class QueryGridBar extends React.Component<QueryGridBarProps, any> {

    render() {
        const { buttons, model } = this.props;

        // const box = model && model.showSearchBox ? (
        //     <URLBox
        //         key={model.getId()}
        //         queryModel={model}/>
        // ) : null;

        const box = null;
        //
        // const paging = model && model.isPaged ? (
        //     <QueryPaging model={model}/>
        // ) : null;
        //
        const paging = null;

        const exportBtn = model ? (
            <Export model={model}/>
        ) : null;
        // const exportBtn = null;

        //
        // const chart = model && model.showChartSelector ? (
        //     <ChartSelector model={model}/>
        // ) : null;
        const chart = null;


        const view = model && model.showViewSelector ? (
            <ViewSelector model={model}/>
        ) : null;

        const rightContent = (
            <div className="paging pull-right text-nowrap">
                {paging}
                {exportBtn != null ? (
                    <span style={{paddingLeft: '10px'}}>
                        {exportBtn}
                    </span>
                ) : null}
                {view !== null ? (
                    <span style={{paddingLeft: '10px'}}>
                        {view}
                    </span>
                ) : null}
            </div>
        );

        const layout = buttons || chart ? layouts.STANDARD : layouts.NO_BUTTONS;
        const buttonsNode = typeof buttons === 'function' ? (buttons as QueryGridBarButtonResolver)(model) : buttons;

        // const selectionDetails = <GridSelectionBanner containerCls="bottom-spacing" model={model}/>;
        const selectionDetails = undefined;

        return (
            <div>
                {/* On most layouts, render side-by-side */}
                <div className="hidden-md hidden-xs hidden-sm">
                    <div className="row bottom-spacing">
                        {layout.LEFT && (
                            <div className={layout.LEFT + ''}>
                                <div className="btn-group">
                                    {buttonsNode}
                                </div>
                                {chart !== null ? (
                                    <span style={buttonsNode ? {paddingLeft: '10px'} : {}}>
                                        {chart}
                                    </span>
                                ) : null}
                            </div>
                        )}
                        <div className={layout.CENTER}>
                            {box}
                        </div>
                        <div className={layout.RIGHT}>
                            {rightContent}
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-xs-12">
                            {selectionDetails}
                        </div>
                    </div>
                </div>

                {/* On medium and x-small layout, render two rows */}
                <div className="visible-md visible-xs visible-sm">
                    <div className="row bottom-spacing">
                        {layout.MED_SM_LEFT && (
                            <div className={layout.MED_SM_LEFT + ''}>
                                <div className="btn-group">
                                    {buttonsNode}
                                </div>
                                {chart !== null ? (
                                    <span style={buttonsNode ? {paddingLeft: '10px'} : {}}>
                                        {chart}
                                    </span>
                                ) : null}
                            </div>
                        )}
                        <div className={layout.MED_SM_RIGHT}>
                            {rightContent}
                        </div>
                    </div>
                    <div className="row bottom-spacing">
                        <div className={layout.MED_SM_CENTER}>
                            {box}
                        </div>
                    </div>
                    <div className="row">
                        <div className={layout.MED_SM_CENTER}>
                            {selectionDetails}
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}