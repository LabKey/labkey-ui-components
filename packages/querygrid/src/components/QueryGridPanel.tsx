/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'reactn'
import { List } from 'immutable'
import { QueryGridModel, Alert, LoadingSpinner } from '@glass/base'

import { gridInit } from '../actions'
import { getQueryGridModel } from '../global'
import { QueryGrid } from './QueryGrid'
import { QueryGridBar, QueryGridBarButtons } from './gridbar/QueryGridBar'

import '../theme/index.scss'

interface Props {
    model: QueryGridModel | List<QueryGridModel>
    buttons?: QueryGridBarButtons
    header?: React.ReactNode
    message?: any
    asPanel?: boolean
    showTabs?: boolean
    showAllTabs?: boolean
    showGridBar?: boolean
}

interface State {
    activeTab: number
}

export class QueryGridPanel extends React.Component<Props, State> {

    static defaultProps = {
        asPanel: true,
        showGridBar: true
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            activeTab: undefined // initially set to undefined until a tab is clicked
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
                gridInit(model);
            }
        });
    }

    getActiveModel(): QueryGridModel {
        const { activeTab } = this.state;
        const models = this.getModelsAsList(this.props);
        const nonZeroModels = models.filter((model) => model && model.isLoaded && model.totalRows > 0);

        let activeModel;
        if (this.hasTabs()) {
            if (activeTab !== undefined) {
                activeModel = models.get(activeTab);
            }
            else {
                activeModel = nonZeroModels.size > 0 ? nonZeroModels.get(0) : models.get(0);
            }
        }
        else {
            activeModel = nonZeroModels.size > 0 ? nonZeroModels.get(0) : models.get(0);
        }

        return activeModel;
    }

    getModel(): QueryGridModel {
        const activeModel = this.getActiveModel();

        // need to access this.global directly to connect this component to the re-render cycle
        return activeModel ? this.global.QueryGrid_models.get(activeModel.getId()) : undefined;
    }

    getModelsFromGlobalState(): List<QueryGridModel> {
        return this.getModelsAsList(this.props).map((model) => getQueryGridModel(model.getId())).toList();
    }

    getModelsAsList(props: Props): List<QueryGridModel> {
        const { model } = props;

        return List.isList(model) ? List(model.toArray()) : List<QueryGridModel>([model]);
    }

    hasTabs(): boolean {
        const { showTabs } = this.props;
        if (showTabs)
            return true;

        const models = this.getModelsAsList(this.props);
        if (models.size < 2)
            return false;
        else {
            const nonZeroSets = models.reduce((count, model) => (count + (model.totalRows > 0 ? 1 : 0)), 0);
            return nonZeroSets > 1;
        }

        return false;
    }

    setActiveTab(id: number) {
        this.setState({activeTab: id})
    }

    renderTabs() {
        const { showAllTabs } = this.props;
        const activeModel = this.getActiveModel();

        return this.hasTabs() ? (
            <ul className="nav nav-tabs">
                {
                    this.getModelsFromGlobalState().map((model, index) => (
                        model && (showAllTabs || model.totalRows > 0 || (model.filterArray && model.filterArray.size > 0)) &&
                        <li key={index} className={activeModel.getId() === model.getId() ? "active" : ""}>
                            <a onClick={() => this.setActiveTab(index)}>{model.title ? model.title : (model.queryInfo ? model.queryInfo.queryLabel : model.query)} ({model.totalRows})</a>
                        </li>
                    ))
                }
            </ul>
        ) : null;
    }

    render() {
        const { asPanel, showGridBar, buttons, header, message, model } = this.props;
        const activeModel = this.getModel();

        const content = model ? (
            <>
                {showGridBar && <QueryGridBar buttons={buttons} model={activeModel} />}
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