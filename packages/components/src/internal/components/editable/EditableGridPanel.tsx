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
import React from 'react';
import ReactN from 'reactn';
import { Panel } from 'react-bootstrap';
import { List, Map } from 'immutable';
import classNames from 'classnames';

import { gridInit } from '../../actions';

import {
    EditableColumnMetadata,
    getUniqueIdColumnMetadata,
    LoadingSpinner,
    QueryColumn,
    QueryGridModel,
} from '../../..';

import { GlobalAppState } from '../../global';

import { EditableGrid, EditableGridProps } from './EditableGrid';

interface Props extends EditableGridProps {
    models?: QueryGridModel | List<QueryGridModel>;
    title?: string;
    bsStyle?: any;
    className?: string;
    activeTab?: number;
    getUpdateColumns?: (tabId?: number) => List<QueryColumn>;
    getColumnMetadata?: (tabId?: number) => Map<string, EditableColumnMetadata>;
    getSelectionData?: (tabId?: number) => Map<string, any>;
    getReadOnlyColumns?: (tabId?: number) => List<string>;
    getReadOnlyRows?: (tabId?: number) => List<any>;
    getIdField?: (tabId?: number) => string;
    getTabTitle?: (tabId?: number) => string;
}

interface State {
    activeTab: number;
}

export class EditableGridPanel extends ReactN.Component<Props, State, GlobalAppState> {
    constructor(props: Props) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);

        if (!props.model) {
            throw new Error('EditableGridPanel: a model must be provided.');
        }

        this.state = {
            activeTab: props.activeTab, // initially set to undefined until a tab is clicked
        };
    }

    componentDidMount() {
        this.initModel(this.props);
    }

    UNSAFE_componentWillReceiveProps(nextProps: Props): void {
        this.initModel(nextProps);
    }

    initModel(props: Props) {
        const model = this.getActiveModel(props);

        // make sure each QueryGridModel is initialized
        if (model && !model.isLoaded && !model.isLoading) {
            gridInit(model, false);
        }
    }

    getModel(): QueryGridModel {
        const model = this.getActiveModel(this.props);

        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_models.get(model.getId());
    }

    getModelsAsList(props: Props): List<QueryGridModel> {
        const { model, models } = props;
        if (models) return List.isList(models) ? List(models.toArray()) : List<QueryGridModel>([models]);

        return List<QueryGridModel>([model]);
    }

    getActiveModel(props: Props): QueryGridModel {
        const { activeTab } = this.state;
        const models = this.getModelsAsList(props);

        return models.get(activeTab) ?? models.get(0);
    }

    hasTabs(): boolean {
        const models = this.getModelsAsList(this.props);
        return models.size > 1;
    }

    setActiveTab(id: number) {
        this.setState({ activeTab: id });
    }

    renderTabs() {
        const { getTabTitle } = this.props;
        const models = this.getModelsAsList(this.props);
        const activeModel = this.getActiveModel(this.props);

        return this.hasTabs() ? (
            <ul className="nav nav-tabs">
                {models.map((model, index) => {
                    if (model) {
                        let tabTitle = model.title ? model.title : model.query;
                        if (getTabTitle) tabTitle = getTabTitle(index);

                        const classes = classNames({
                            active: activeModel.getId() === model.getId(),
                        });

                        return (
                            <li key={index} className={classes}>
                                <a onClick={() => this.setActiveTab(index)}>{tabTitle}</a>
                            </li>
                        );
                    }
                    return null;
                })}
            </ul>
        ) : null;
    }

    render() {
        const { bsStyle, className, title } = this.props;
        const {
            readOnlyColumns,
            readonlyRows,
            columnMetadata,
            getUpdateColumns,
            getColumnMetadata,
            getReadOnlyRows,
            getReadOnlyColumns,
        } = this.props;
        const { activeTab } = this.state;

        const model = this.getModel();

        if (!model) {
            return <LoadingSpinner />;
        }

        let activeColumnMetadata = columnMetadata;
        if (!activeColumnMetadata && getColumnMetadata) activeColumnMetadata = getColumnMetadata(activeTab);
        if (!activeColumnMetadata) activeColumnMetadata = getUniqueIdColumnMetadata(model.queryInfo);

        let activeReadOnlyRows = readonlyRows;
        if (getReadOnlyRows) activeReadOnlyRows = getReadOnlyRows(activeTab);

        let activeReadOnlyColumns = readOnlyColumns;
        if (getReadOnlyColumns) activeReadOnlyColumns = getReadOnlyColumns(activeTab);

        let activeGetUpdateColumnsFn = getUpdateColumns;
        if (getUpdateColumns)
            activeGetUpdateColumnsFn = () => {
                return getUpdateColumns(activeTab);
            };

        const gridProps = {
            ...this.props,
            ...{
                model,
                readOnlyColumns: activeReadOnlyColumns,
                readonlyRows: activeReadOnlyRows,
                columnMetadata: activeColumnMetadata,
                getUpdateColumns: activeGetUpdateColumnsFn,
            },
        };

        if (!title) {
            return <EditableGrid {...gridProps} />;
        }

        return (
            <Panel bsStyle={bsStyle} className={className}>
                <Panel.Heading>{title}</Panel.Heading>
                <Panel.Body className="table-responsive">
                    {this.renderTabs()}
                    <EditableGrid {...gridProps} />
                </Panel.Body>
            </Panel>
        );
    }
}
