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
import { List, Map } from 'immutable';

import { QUERY_GRID_PREFIX } from '../constants';
import { gridInit, reloadQueryGridModel, sort, toggleGridRowSelection, toggleGridSelected } from '../actions';
import { getStateModelId, getStateQueryGridModel } from '../models';
import { headerCell, headerSelectionCell } from '../renderers';
import { getBrowserHistory } from '../util/global';

import { generateId } from '../util/utils';

import { getRouteFromLocationHash } from '../util/URL';

import { QueryColumn, QueryGridModel, SchemaQuery } from './base/models/model';
import { Grid, GridColumn, GridProps } from './base/Grid';
import { GRID_CHECKBOX_OPTIONS, GRID_SELECTION_INDEX } from './base/models/constants';
import { LoadingSpinner } from './base/LoadingSpinner';
import { Alert } from './base/Alert';

interface QueryGridProps {
    model?: QueryGridModel;
    schemaQuery?: SchemaQuery;
    onSelectionChange?: (model: QueryGridModel, row: Map<string, any>, checked: boolean) => any;
    highlightLastSelectedRow?: boolean;
}

interface QueryGridState {
    /**
     * modelId can be used to maintain a single instance model. This is useful when an explicit model
     * is not provided but persistence of the generated model is desired (fetched results, etc)
     */
    modelId: string;

    /**
     * Original location.hash value so that we can avoid calling the reloadQueryGridModel listener on navigation
     */
    locationHash?: string;

    /**
     * Function returned by the getBrowserHistory().listen() call so that we can cleanup after unmount
     */
    unlisten?: any;
}

export class QueryGrid extends React.Component<QueryGridProps, QueryGridState> {
    constructor(props: QueryGridProps) {
        // @ts-ignore // see https://github.com/CharlesStover/reactn/issues/126
        super(props);

        const { model, schemaQuery } = this.props;
        let _modelId;

        if (model) {
            _modelId = model.getId();
        } else {
            if (!schemaQuery) {
                throw new Error('QueryGrid: If a model is not provided, a SchemaQuery is required.');
            }

            _modelId = generateId(QUERY_GRID_PREFIX);
        }

        // set local state for this component
        this.state = {
            modelId: _modelId,
        };
    }

    componentDidMount() {
        this.initModel(this.props);
        this.initUrlRouteListener();
    }

    componentWillReceiveProps(nextProps: QueryGridProps) {
        this.initModel(nextProps);

        // if the nextProps has a model and we didn't before or we have a different model id, then reset the url route listener
        const modelIdMisMatch =
            nextProps.model && this.props.model && nextProps.model.getId() !== this.props.model.getId();
        if (nextProps.model && (this.props.model === undefined || modelIdMisMatch)) {
            this.initUrlRouteListener();
        }
    }

    componentWillUnmount() {
        this.removeUrlRouteListener();
    }

    removeUrlRouteListener() {
        const { unlisten } = this.state;
        if (unlisten) {
            unlisten();
        }
    }

    initUrlRouteListener() {
        // make sure to remove any previous route listeners by calling their unlisten() function
        this.removeUrlRouteListener();

        if (this.props.model && this.props.model.bindURL) {
            const unlisten = getBrowserHistory().listen((location, action) => {
                // this listener only applies if we are staying on the same route, exit early if we are navigating
                const originalRoute = getRouteFromLocationHash(this.state.locationHash);
                const currentRoute = getRouteFromLocationHash(location.hash);
                if (originalRoute !== currentRoute) {
                    return;
                }

                reloadQueryGridModel(this.props.model);
            });

            this.setState(() => ({
                locationHash: getBrowserHistory().location.hash,
                unlisten,
            }));
        }
    }

    initModel(props: QueryGridProps) {
        const { model, schemaQuery } = props;
        const { modelId } = this.state;

        if (model && !model.isLoaded && !model.isLoading) {
            gridInit(model);
        } else if (!this.getModel(props)) {
            gridInit(getStateQueryGridModel(modelId, schemaQuery));
        }
    }

    headerCell = (column: GridColumn, i: number, columnCount?: number): any => {
        const model = this.getModel(this.props);

        if (
            model.allowSelection &&
            column.index &&
            column.index.toLowerCase() === GRID_SELECTION_INDEX &&
            !model.editable
        ) {
            return headerSelectionCell(this.selectAll, model.selectedState, !model.isLoaded || model.totalRows === 0);
        }

        return headerCell(this.sort, column, i, model.allowSelection, model.sortable, columnCount);
    };

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
                    return <input checked={selected === true} type="checkbox" onChange={this.select.bind(this, row)} />;
                },
            });

            return List([selColumn]).concat(model.getDisplayColumns()).toList();
        }

        return model.getDisplayColumns();
    }

    getModel(props: QueryGridProps): QueryGridModel {
        const { model, schemaQuery } = props;
        const { modelId } = this.state;

        // if a model is explicitly defined, use the id from it
        const stateModelId = model ? model.getId() : getStateModelId(modelId, schemaQuery);

        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_models.get(stateModelId);
    }

    selectAll = (evt): void => {
        const model = this.getModel(this.props);

        if (model) {
            const selected = evt.currentTarget.checked === true && model.selectedState !== GRID_CHECKBOX_OPTIONS.SOME;
            toggleGridSelected(model, selected, this.props.onSelectionChange);
        }
    };

    select(row: Map<string, any>, evt) {
        const model = this.getModel(this.props);

        if (model) {
            toggleGridRowSelection(model, row, evt.currentTarget.checked === true, this.props.onSelectionChange);
        }
    }

    sort = (column: QueryColumn, dir: string): void => {
        const model = this.getModel(this.props);

        if (model) {
            sort(model, column, dir);
        }
    };

    /**
     * @returns the row index for the selected row. If multiple rows are selected, get the last selected index
     */
    getLastSelectedRowInd(model: QueryGridModel): List<number> {
        const lastSelectedId = model.selectedIds.last();
        return List<number>([model.dataIds.indexOf(lastSelectedId)]);
    }

    getHighlightRowIndexes(): List<number> {
        const { highlightLastSelectedRow } = this.props;
        const model = this.getModel(this.props);

        return highlightLastSelectedRow ? this.getLastSelectedRowInd(model) : undefined;
    }

    render() {
        const model = this.getModel(this.props);
        if (!model) {
            return (
                <div>
                    <LoadingSpinner />
                </div>
            );
        } else if (model.isError) {
            return <Alert>{model.message ? model.message : 'Something went wrong loading the QueryGridModel.'}</Alert>;
        }

        const gridProps: GridProps = {
            calcWidths: true,
            columns: this.getColumns(),
            condensed: true,
            data: model.getData(),
            highlightRowIndexes: this.getHighlightRowIndexes(),
            gridId: model.getId(),
            messages: model.messages,
            headerCell: this.headerCell,
            isLoading: model.isLoading,
            loadingText: <LoadingSpinner />,
        };

        return <Grid {...gridProps} />;
    }
}
