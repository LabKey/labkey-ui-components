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
import React, { ReactNode } from 'react';
import ReactN from 'reactn';
import { Panel } from 'react-bootstrap';
import { List, Map } from 'immutable';
import classNames from 'classnames';

import { addRows, gridInit } from '../../actions';

import {
    EditableColumnMetadata,
    EditorModel,
    getUniqueIdColumnMetadata,
    LoadingSpinner,
    QueryColumn,
    QueryGridModel,
} from '../../..';

import { GlobalAppState, updateEditorModel, updateQueryGridModel } from '../../global';

import { EditableGrid, SharedEditableGridProps } from './EditableGrid';

interface Props extends SharedEditableGridProps {
    model: QueryGridModel;
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
    getTabHeader?: (tabId?: number) => ReactNode;
    initialEmptyRowCount?: number;
    onCellModify?: () => void;
    onRowCountChange?: (rowCount?: number) => any;
}

interface State {
    activeTab: number;
    rowsInitialized: boolean;
}

export class EditableGridPanelDeprecated extends ReactN.Component<Props, State, GlobalAppState> {
    static defaultProps = {
        initialEmptyRowCount: 1,
    };

    constructor(props: Props) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);

        if (!props.model) {
            throw new Error('EditableGridPanel: a model must be provided.');
        }

        this.state = {
            activeTab: props.activeTab, // initially set to undefined until a tab is clicked
            // If we don't track this bit we will call addRows more than once because ReactN seems to take its sweet
            // time to process the changes emitted from this component.
            rowsInitialized: false,
        };
    }

    componentDidMount(): void {
        this.initModel();
    }

    componentDidUpdate(): void {
        this.initModel();
    }

    updateModels = (
        editorModelChanges: Partial<EditorModel>,
        dataKeys?: List<any>,
        data?: Map<any, Map<string, any>>
    ): void => {
        const { onCellModify, onRowCountChange } = this.props;
        const editorModel = this.getEditorModel();
        const newRowCount = Math.abs((editorModelChanges?.rowCount ?? 0) - editorModel.rowCount);

        updateEditorModel(editorModel, editorModelChanges);

        if (dataKeys !== undefined && data !== undefined) {
            updateQueryGridModel(this.getModel(), { data, dataIds: dataKeys });
        }

        // TODO: look at consumers that pass onRowCountChange and see if it's necessary, since in this scenario we also
        //  trigger onCellModify below, and onCellModify may be doing the same thing (e.g. setting dirty state)
        if (newRowCount > 0) {
            onRowCountChange?.();
        }

        if (newRowCount > 0 || editorModelChanges?.cellValues !== undefined) {
            onCellModify?.();
        }
    };

    addRows = async (count: number): Promise<void> => {
        const queryGridModel = this.getModel();
        const changes = await addRows(
            this.getEditorModel(),
            queryGridModel.dataIds,
            queryGridModel.data,
            queryGridModel.getInsertColumns(),
            count
        );
        this.updateModels(changes.editorModel, changes.dataKeys, changes.data);
    };

    initModel = (): void => {
        const model = this.getActiveModel();
        const { rowsInitialized } = this.state;
        const { initialEmptyRowCount } = this.props;

        // make sure the active QueryGridModel is initialized
        if (model && !model.isLoaded && !model.isLoading) {
            gridInit(model, false);
        }

        // If the model is loaded, but we don't have the amount of rows we're supposed to initialize with, we add the
        // rows to the model.
        //
        if (model.isLoaded && !model.isError && model.data.size === 0 && initialEmptyRowCount > 0 && !rowsInitialized) {
            this.setState({ rowsInitialized: true });
            this.addRows(initialEmptyRowCount);
        }
    };

    getModel = (): QueryGridModel => {
        const model = this.getActiveModel();

        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_models.get(model.getId());
    };

    getEditorModel = (): EditorModel => {
        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_editors.get(this.getModel().getId());
    };

    getModelsAsList = (): List<QueryGridModel> => {
        const { model, models } = this.props;
        if (models) return List.isList(models) ? List(models.toArray()) : List<QueryGridModel>([models]);

        return List<QueryGridModel>([model]);
    };

    getActiveModel = (): QueryGridModel => {
        const { activeTab } = this.state;
        const models = this.getModelsAsList();

        return models.get(activeTab) ?? models.get(0);
    };

    hasTabs = (): boolean => {
        const models = this.getModelsAsList();
        return models.size > 1;
    };

    setActiveTab = (id: number) => {
        this.setState({ activeTab: id });
    };

    renderTabs = (): ReactNode => {
        const { getTabTitle } = this.props;
        const models = this.getModelsAsList();
        const activeModel = this.getActiveModel();

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
    };

    getUpdateColumns = (): List<QueryColumn> => {
        return this.props.getUpdateColumns(this.state.activeTab);
    };

    render() {
        const { bsStyle, className, title } = this.props;
        const {
            columnMetadata,
            getColumnMetadata,
            getReadOnlyRows,
            getReadOnlyColumns,
            getTabHeader,
            getUpdateColumns,
            processBulkData,
            readOnlyColumns,
            readonlyRows,
        } = this.props;
        const { activeTab } = this.state;
        const model = this.getModel();

        if (!model || !model.isLoaded) {
            return <LoadingSpinner />;
        }

        let activeColumnMetadata = columnMetadata;
        if (!activeColumnMetadata && getColumnMetadata) activeColumnMetadata = getColumnMetadata(activeTab);
        if (!activeColumnMetadata) activeColumnMetadata = getUniqueIdColumnMetadata(model.queryInfo);

        let activeReadOnlyRows = readonlyRows;
        if (getReadOnlyRows) activeReadOnlyRows = getReadOnlyRows(activeTab);

        let activeReadOnlyColumns = readOnlyColumns;
        if (getReadOnlyColumns) activeReadOnlyColumns = getReadOnlyColumns(activeTab);

        const updateColumns = getUpdateColumns ? this.getUpdateColumns() : undefined;

        const editableGrid = (
            <EditableGrid
                {...this.props}
                columnMetadata={activeColumnMetadata}
                data={model.data}
                dataKeys={model.dataIds}
                editorModel={this.getEditorModel()}
                error={model.isError ? model.message ?? 'Something went wrong' : undefined}
                processBulkData={processBulkData}
                onChange={this.updateModels}
                queryInfo={model.queryInfo}
                readOnlyColumns={activeReadOnlyColumns}
                readonlyRows={activeReadOnlyRows}
                updateColumns={updateColumns}
            />
        );

        if (!title) {
            return editableGrid;
        }

        return (
            <Panel bsStyle={bsStyle} className={className}>
                <Panel.Heading>{title}</Panel.Heading>
                <Panel.Body className="table-responsive">
                    {this.renderTabs()}
                    {getTabHeader && getTabHeader(activeTab)}
                    {editableGrid}
                </Panel.Body>
            </Panel>
        );
    }
}
