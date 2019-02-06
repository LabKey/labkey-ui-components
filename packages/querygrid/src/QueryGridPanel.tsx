/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'
import { Location } from 'history'
import { List } from 'immutable'

import { Alert } from './components/Alert'
import { QueryGridModel } from './model'
import { getQueryGridModel } from './reducers'
import { QueryGrid } from './QueryGrid'
import { LoadingSpinner } from './components/LoadingSpinner'
import { QueryGridBar, QueryGridBarButtons } from './QueryGridBar'

interface Props {
    model: QueryGridModel | List<QueryGridModel>
    location?: Location,
    buttons?: QueryGridBarButtons
    header?: React.ReactNode
    message?: any
    asPanel?: boolean
    showTabs?: boolean
    showAllTabs?: boolean
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
    }

    componentDidMount() {
        this.initModel(this.props);
    }

    componentWillReceiveProps(nextProps: Props) {
        this.initModel(nextProps);
    }

    initModel(props: Props) {
        // make sure each QueryGridModel is initialized
        this.getModelsAsList(props).forEach((model, index) => {
            if (model && !model.isLoaded && !model.isLoading) {
                model.init(props.location);
            }
        });
    }

    getModel(): QueryGridModel {
        const { model } = this.props;

        let activeModel;
        if (List.isList(model)) {
            activeModel = this.getModelsAsList(this.props).get(this.state.activeTab);
        }
        else {
            activeModel = model as QueryGridModel;
        }

        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid.models.get(activeModel.getId());
    }

    getModelsFromGlobalState(): List<QueryGridModel> {
        return this.getModelsAsList(this.props).map((model, index) => {
           return getQueryGridModel(model.getId());
        }).toList();
    }

    getModelsAsList(props: Props): List<QueryGridModel> {
        const { model } = props;

        return List.isList(model) ? List(model.toArray()) : List<QueryGridModel>([model]);
    }

    hasTabs(): boolean {
        const { showTabs, model } = this.props;

        if (showTabs)
            return true;

        if (List.isList(model)) {
            let modelList = this.getModelsAsList(this.props);

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
        const { showAllTabs } = this.props;
        const { activeTab } = this.state;

        return this.hasTabs() ? (
            <ul className="nav nav-tabs">
                {
                    this.getModelsFromGlobalState().map((value, index) => (
                        value && (showAllTabs || value.totalRows > 0 || (value.filterArray && value.filterArray.size > 0)) &&
                        <li key={index} className={activeTab === index ? "active" : ""}>
                            <a onClick={() => this.setActiveTab(index)}>{value.title ? value.title : (value.queryInfo ? value.queryInfo.queryLabel : value.query)} ({value.totalRows})</a>
                        </li>
                    ))
                }
            </ul>
        ) : null;
    }

    render() {
        const { asPanel, buttons, header, message, model } = this.props;
        const activeModel = this.getModel();

        const content = model ? (
            <>
                <QueryGridBar buttons={buttons} model={activeModel} />
                {message}

                {/* Grid row */}
                <div className="row">
                    <div className="col-md-12">
                        {this.renderTabs()}
                        {activeModel
                            ? <QueryGrid model={activeModel} />
                            : <LoadingSpinner/>
                        }
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