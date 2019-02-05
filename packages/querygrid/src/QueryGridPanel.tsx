/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'
import { Location } from 'history'
import { List, Map } from 'immutable'

import { Alert } from './components/Alert'
import { QueryGridModel } from './model'
import { initQueryGridState } from './reducers'
import { QueryGrid } from './QueryGrid'
// import { QueryGridBar, QueryGridBarButtons } from './GridBar'

interface Props {
    model: QueryGridModel | List<QueryGridModel>
    location?: Location,
    // buttons?: QueryGridBarButtons
    header?: React.ReactNode
    message?: any
    asPanel?: boolean
    showTabs?: boolean
}

interface State {
    activeTab: number
}

export class QueryGridPanel extends React.Component<Props, State> {

    static defaultProps = {
        asPanel: true
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            activeTab: 0
        };

        initQueryGridState(this);
    }

    getModel(): QueryGridModel {
        const { model } = this.props;

        if (List.isList(model))
            return (model as List<QueryGridModel>).get(this.state.activeTab);
        return model as QueryGridModel;
    }

    hasTabs(): boolean {
        const { showTabs } = this.props;

        if (showTabs)
            return true;

        if (List.isList(this.props.model)) {
            let modelList = this.props.model as List<QueryGridModel>;

            if (modelList.size < 2)
                return false;
            else {
                let nonZeroSets = modelList.reduce((count, model) => (count + (model.totalRows > 0 ? 1 : 0)), 0);
                return nonZeroSets > 1;
            }
        }

        return false;
    }

    setActiveTab(id: number) {
        this.setState({activeTab: id})
    }

    renderTabs() {
        const { activeTab } = this.state;
        const { model } = this.props;

        return this.hasTabs() ? (
            <ul className="nav nav-tabs">
                {
                    (model as List<QueryGridModel>).map((value, index) => (
                        (value.totalRows > 0 || value.filterArray.size > 0) &&
                        <li key={index} className={activeTab === index ? "active" : ""}>
                            <a onClick={() => this.setActiveTab(index)}>{value.title ? value.title : (value.queryInfo ? value.queryInfo.queryLabel : value.query)} ({value.totalRows})</a>
                        </li>
                    ))
                }
            </ul>
        ) : null;
    }

    render() {
        const { asPanel, header, message, model } = this.props;
        const activeModel = this.getModel();

        const content = model ? (
            <>
                {/*<QueryGridBar buttons={buttons} model={activeModel} />*/}
                {message}

                {/* Grid row */}
                <div className="row">
                    <div className="col-md-12">
                        {this.renderTabs()}
                        <QueryGrid model={activeModel} />
                    </div>
                </div>
            </>
        ) : <Alert>No QueryGridModels defined for this QueryGridPanel.</Alert>;

        return (
            <div className={asPanel ? 'panel panel-default' : ''}>
                {header ? <div className={asPanel ? 'panel-heading' : ''}>{header}</div> : null}
                <div className={asPanel ? 'panel-body' : ''}>
                    {content}
                </div>
            </div>
        );
    }
}