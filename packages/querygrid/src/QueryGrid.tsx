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
import { List, Map } from 'immutable'
import { Grid, GridColumn, GridProps } from '@glass/grid'

import { LoadingSpinner } from './components/LoadingSpinner'
import { Alert } from './components/Alert'
import { CHECKBOX_OPTIONS } from './query/constants'
import { generateId } from './query/utils'
import { SchemaQuery } from './query/model'
import { GRID_SELECTION_INDEX, QUERY_GRID_PREFIX } from './constants'
import { init, toggleGridRowSelection, toggleGridSelected, sort, reloadQueryGridModel } from './actions'
import { QueryGridModel, getStateQueryGridModel, getStateModelId } from './model'
import { headerCell, headerSelectionCell } from './renderers'
import { getBrowserHistory } from "./util/global";

interface QueryGridProps {
    model?: QueryGridModel
    schemaQuery?: SchemaQuery
}

interface QueryGridState {
    /**
     * modelId can be used to maintain a single instance model. This is useful when an explicit model
     * is not provided but persistence of the generated model is desired (fetched results, etc)
     */
    modelId: string
}

export class QueryGrid extends React.Component<QueryGridProps, QueryGridState> {

    constructor(props: QueryGridProps) {
        super(props);

        // bind event handlers
        this.headerCell = this.headerCell.bind(this);
        this.selectAll = this.selectAll.bind(this);
        this.sort = this.sort.bind(this);

        const { model, schemaQuery } = this.props;
        let _modelId;

        if (model) {
            _modelId = model.getId();
        }
        else {
            if (!schemaQuery) {
                throw new Error('QueryGrid: If a model is not provided, a SchemaQuery is required.');
            }

            _modelId = generateId(QUERY_GRID_PREFIX);
        }

        getBrowserHistory().listen((location, action) => {
            if (this.props.model && this.props.model.bindURL) {
                reloadQueryGridModel(this.props.model);
            }
        });

        // set local state for this component
        this.state = {
            modelId: _modelId
        };
    }

    componentDidMount() {
        this.initModel(this.props);
    }

    componentWillReceiveProps(nextProps: QueryGridProps) {
        this.initModel(nextProps);
    }

    initModel(props: QueryGridProps) {
        const { model, schemaQuery } = props;
        const { modelId } = this.state;

        if (model && !model.isLoaded && !model.isLoading) {
            init(model);
        }
        else if (!this.getModel(props)) {
            init(getStateQueryGridModel(modelId, schemaQuery));
        }
    }

    headerCell(column: GridColumn, i: number) {
        const model = this.getModel(this.props);

        if (model.allowSelection && column.index.toLowerCase() === GRID_SELECTION_INDEX && !model.editable) {
            return headerSelectionCell(this.selectAll, model);
        }

        return headerCell(this.sort, column, i, model.allowSelection, model.sortable);
    }

    getColumns(): List<any> {
        const model = this.getModel(this.props);

        if (model.editable) {
            return model.getInsertColumns();
        }

        if (model.allowSelection) {
            const selColumn = new GridColumn({
                index: GRID_SELECTION_INDEX,
                title: '&nbsp;',
                showHeader: true,
                cell: (selected: boolean, row) => {
                    return <input
                        checked={selected === true}
                        type="checkbox"
                        onChange={this.select.bind(this, row)}/>;
                }
            });

            return List([selColumn]).concat(model.getColumns()).toList();
        }

        return model.getColumns();
    }

    getModel(props: QueryGridProps): QueryGridModel {
        const { model, schemaQuery } = props;
        const { modelId } = this.state;

        // if a model is explicitly defined, use the id from it
        const stateModelId = model ? model.getId() : getStateModelId(modelId, schemaQuery);

        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid.models.get(stateModelId);
    }

    selectAll(evt) {
        const model = this.getModel(this.props);

        if (model) {
            const selected = evt.currentTarget.checked === true && model.selectedState !== CHECKBOX_OPTIONS.SOME;
            toggleGridSelected(model, selected);
        }
    }

    select(row: Map<string, any>, evt) {
        const model = this.getModel(this.props);

        if (model) {
            toggleGridRowSelection(model, row, evt.currentTarget.checked === true);
        }
    }

    sort(gridColumn, dir) {
        const model = this.getModel(this.props);

        if (model) {
            sort(model, gridColumn.index, dir);
        }
    }

    render() {
        const model = this.getModel(this.props);

        if (!model || !model.isLoaded || model.isLoading) {
            return (
                <div>
                    <LoadingSpinner/>
                </div>
            )
        }
        else if (model.isError) {
            return <Alert>{model.message ? model.message : 'Something went wrong loading the QueryGridModel.'}</Alert>
        }

        const gridProps: GridProps = {
            calcWidths: true,
            columns: this.getColumns(),
            condensed: true,
            data: model.getData(),
            gridId: model.getId(),
            headerCell: this.headerCell,
            isLoading: model.isLoading,
            loadingText: <LoadingSpinner/>
        };

        return <Grid {...gridProps} />
    }
}