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
import { Iterable, List, Map, OrderedMap, Record, Set } from 'immutable';

import { genCellKey } from './actions';
import { getQueryColumnRenderers, getQueryGridModel, getQueryMetadata } from './global';
import { DefaultGridLoader } from './components/GridLoader';
import { IQueryGridModel, QueryColumn, QueryGridModel, SchemaQuery, ViewInfo } from './components/base/models/model';
import { resolveSchemaQuery } from './util/utils';
import { AppURL } from './url/AppURL';
import { GRID_EDIT_INDEX } from './components/base/models/constants';
import { DataViewInfoTypes, VISUALIZATION_REPORTS } from './constants';

export function getStateModelId(gridId: string, schemaQuery: SchemaQuery, keyValue?: any): string {
    const parts = [gridId, resolveSchemaQuery(schemaQuery)];

    if (schemaQuery && schemaQuery.viewName) {
        parts.push(schemaQuery.viewName);
    }
    if (keyValue !== undefined) {
        parts.push(keyValue);
    }

    return parts.join('|').toLowerCase();
}

export type PropsInitializer = () => IQueryGridModel;

/**
 * Used to create a QueryGridModel, based on some initial props, that can be put into the global state.
 * @param gridId
 * @param schemaQuery
 * @param [initProps] can be either a props object or a function that returns a props object.
 * @param [keyValue]
 * @returns {QueryGridModel}
 */
export function getStateQueryGridModel(
    gridId: string,
    schemaQuery: SchemaQuery,
    initProps?: IQueryGridModel | PropsInitializer,
    keyValue?: any
): QueryGridModel {
    const modelId = getStateModelId(gridId, schemaQuery, keyValue);

    // if the model already exists in the global state, return it
    const model = getQueryGridModel(modelId);

    if (model) {
        return model;
    }

    const metadata = getQueryMetadata();

    let modelProps: Partial<IQueryGridModel> = {
        keyValue,
        id: modelId,
        loader: DefaultGridLoader, // Should we make this a default on the QueryGridModel class?
        schema: schemaQuery.schemaName,
        query: schemaQuery.queryName,
        view: schemaQuery.viewName,
        hideEmptyChartSelector: metadata.get('hideEmptyChartSelector'),
        hideEmptyViewSelector: metadata.get('hideEmptyViewSelector'),
    };

    if (keyValue !== undefined && schemaQuery.viewName === undefined) {
        modelProps.view = ViewInfo.DETAIL_NAME;
        modelProps.bindURL = false;
    }

    if (initProps !== undefined) {
        const props = typeof initProps === 'function' ? initProps() : initProps;
        modelProps = {
            ...modelProps,
            ...props,
        };
    }

    return new QueryGridModel(modelProps);
}

type DataViewInfoType =
    | DataViewInfoTypes.AutomaticPlot
    | DataViewInfoTypes.BarChart
    | DataViewInfoTypes.BoxAndWhiskerPlot
    | DataViewInfoTypes.CrosstabReport
    | DataViewInfoTypes.Dataset
    | DataViewInfoTypes.ParticipantReport
    | DataViewInfoTypes.PieChart
    | DataViewInfoTypes.Query
    | DataViewInfoTypes.RReport
    | DataViewInfoTypes.SampleComparison
    | DataViewInfoTypes.TimeChart
    | DataViewInfoTypes.XYScatterPlot
    | DataViewInfoTypes.XYSeriesLinePlot;
/**
 * IDataViewInfo is a client side implementation of the server-side class DataViewInfo. We currently only implement
 * a subset of the fields that are used by the client.
 */
export interface IDataViewInfo {
    name?: string;
    description?: string;
    detailsUrl?: string;
    runUrl?: string; // This comes directly from the API response and is a link to LK Server
    type?: DataViewInfoType;
    visible?: boolean;
    id?: string; // This is actually a uuid from the looks of it, should we be more strict on the type here?
    reportId?: string; // This is in the format of "db:953", not quite sure why we have an id and reportId.
    created?: Date;
    modified?: Date;
    createdBy?: string;
    modifiedBy?: string;
    thumbnail?: string; // This is actually a URL, do we enforce that?
    icon?: string;
    iconCls?: string;
    shared?: boolean;
    schemaName?: string;
    queryName?: string;
    viewName?: string;

    appUrl?: AppURL; // This is a client side only attribute. Used to navigate within a Single Page App.
}

interface DataViewClientMetadata extends IDataViewInfo {
    // The attributes here are all specific to the DataViewInfo class and are not useful as part of IDataViewInfo
    isLoading?: boolean;
    isLoaded?: boolean;
    error?: any;
}

const DataViewInfoDefaultValues = {
    name: undefined,
    description: undefined,
    detailsUrl: undefined,
    runUrl: undefined,
    type: undefined,
    visible: undefined,
    id: undefined,
    reportId: undefined,
    created: undefined,
    modified: undefined,
    createdBy: undefined,
    modifiedBy: undefined,
    thumbnail: undefined,
    icon: undefined,
    iconCls: undefined,
    schemaName: undefined,
    queryName: undefined,
    shared: false,

    // Client Side only attributes
    isLoading: false,
    isLoaded: false,
    error: undefined,
};

// commented out attributes are not used in app
export class DataViewInfo extends Record(DataViewInfoDefaultValues) {
    name: string;
    description?: string;
    detailsUrl: string;
    runUrl: string;
    type: DataViewInfoType;
    visible: boolean;
    id: string;
    reportId: string;
    created?: Date;
    modified: Date;
    createdBy?: string;
    modifiedBy?: string;
    thumbnail: string;
    icon: string;
    iconCls: string;
    shared: boolean;
    schemaName?: string;
    queryName?: string;
    viewName?: string;

    // Client Side only attributes
    appUrl?: AppURL;
    isLoading: boolean;
    isLoaded: boolean;
    error: string;

    constructor(values?: DataViewClientMetadata) {
        super(values);
    }

    // TODO: remove the getters below, they're not necessary, consumers can safely access them via dot notation.
    getLabel() {
        return this.name;
    }

    isShared() {
        return this.shared;
    }

    getIconCls() {
        return this.iconCls;
    }

    isVisChartType() {
        return VISUALIZATION_REPORTS.contains(this.type);
    }
}

export class VisualizationConfigModel extends Record({
    queryConfig: undefined,
    chartConfig: undefined,
}) {
    queryConfig: QueryConfigModel;
    chartConfig: ChartConfigModel;

    static create(raw: any): VisualizationConfigModel {
        return new VisualizationConfigModel(
            Object.assign({}, raw, {
                chartConfig: new ChartConfigModel(raw.chartConfig),
                queryConfig: new QueryConfigModel(raw.queryConfig),
            })
        );
    }

    constructor(values?: { [key: string]: any }) {
        super(values);
    }
}

export class ChartConfigModel extends Record({
    geomOptions: undefined,
    height: undefined,
    labels: undefined,
    measures: undefined,
    pointType: undefined,
    renderType: undefined,
    scales: undefined,
    width: undefined,
}) {
    geomOptions: any;
    height: number;
    labels: any;
    measures: any;
    pointType: string;
    renderType: string;
    scales: any;
    width: number;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }
}

export class QueryConfigModel extends Record({
    columns: undefined,
    containerPath: undefined,
    // dataRegionName: undefined,
    filterArray: undefined,
    maxRows: undefined,
    method: undefined,
    parameters: undefined,
    // queryLabel: undefined,
    queryName: undefined,
    requiredVersion: undefined,
    schemaName: undefined,
    // sort: undefined,
    viewName: undefined,
}) {
    columns: List<string>;
    containerPath: string;
    // dataRegionName: string;
    filterArray: List<any>;
    maxRows: number;
    method: string;
    parameters: any;
    // queryLabel: string;
    queryName: string;
    requiredVersion: string;
    schemaName: string;
    // sort: string;
    viewName: string;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }
}

export interface ValueDescriptor {
    display: any;
    raw: any;
}

export interface CellMessage {
    message: string;
}

export type CellMessages = Map<string, CellMessage>;
export type CellValues = Map<string, List<ValueDescriptor>>;

export interface EditorModelProps {
    cellMessages: CellMessages;
    cellValues: CellValues;
    colCount: number;
    id: string;
    isPasting: boolean;
    focusColIdx: number;
    focusRowIdx: number;
    focusValue: List<ValueDescriptor>;
    numPastedRows: number;
    rowCount: number;
    selectedColIdx: number;
    selectedRowIdx: number;
    selectionCells: Set<string>;
}

export class EditorModel
    extends Record({
        cellMessages: Map<string, CellMessage>(),
        cellValues: Map<string, List<ValueDescriptor>>(),
        colCount: 0,
        deletedIds: Set<any>(),
        id: undefined,
        isPasting: false,
        focusColIdx: -1,
        focusRowIdx: -1,
        focusValue: undefined,
        numPastedRows: 0,
        rowCount: 0,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: Set<string>(),
    })
    implements EditorModelProps {
    cellMessages: CellMessages;
    cellValues: CellValues;
    colCount: number;
    deletedIds: Set<any>;
    id: string;
    isPasting: boolean;
    focusColIdx: number;
    focusRowIdx: number;
    focusValue: List<ValueDescriptor>;
    numPastedRows: number;
    rowCount: number;
    selectedColIdx: number;
    selectedRowIdx: number;
    selectionCells: Set<string>;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    findNextCell(
        startCol: number,
        startRow: number,
        predicate: (value: List<ValueDescriptor>, colIdx: number, rowIdx: number) => boolean,
        advance: (colIdx: number, rowIdx: number) => { colIdx: number; rowIdx: number }
    ) {
        let colIdx = startCol,
            rowIdx = startRow;

        while (true) {
            ({ colIdx, rowIdx } = advance(colIdx, rowIdx));
            if (!this.isInBounds(colIdx, rowIdx)) break;

            const value = this.getValue(colIdx, rowIdx);
            if (predicate(value, colIdx, rowIdx)) {
                return {
                    value,
                    colIdx,
                    rowIdx,
                };
            }
        }

        // not found
        return null;
    }

    getMessage(colIdx: number, rowIdx: number): CellMessage {
        return this.cellMessages.get(genCellKey(colIdx, rowIdx));
    }

    getColumns(model: QueryGridModel, forUpdate?: boolean, readOnlyColumns?: List<string>): List<QueryColumn> {
        if (forUpdate) {
            return model.getUpdateColumns(readOnlyColumns);
        } else {
            return model.getInsertColumns();
        }
    }

    getRawData(model: QueryGridModel, forUpdate = false, readOnlyColumns?: List<string>): List<Map<string, any>> {
        let data = List<Map<string, any>>();
        const columns = this.getColumns(model, forUpdate, readOnlyColumns);

        for (let rn = 0; rn < model.data.size; rn++) {
            let row = Map<string, any>();
            columns.forEach((col, cn) => {
                const values = this.getValue(cn, rn);

                let renderer;
                if (col.columnRenderer) {
                    renderer = getQueryColumnRenderers().get(col.columnRenderer.toLowerCase());
                }

                if (renderer?.getEditableRawValue) {
                    row = row.set(col.name, renderer.getEditableRawValue(values));
                } else if (col.isLookup()) {
                    if (col.isExpInput()) {
                        let sep = '';
                        row = row.set(
                            col.name,
                            values.reduce((str, vd) => {
                                if (vd.display !== undefined && vd.display !== null) {
                                    str += sep + vd.display;
                                    sep = ', ';
                                }
                                return str;
                            }, '')
                        );
                        return;
                    } else if (col.isJunctionLookup()) {
                        row = row.set(
                            col.name,
                            values.reduce((arr, vd) => {
                                if (vd.raw !== undefined && vd.raw !== null) {
                                    arr.push(vd.raw);
                                }
                                return arr;
                            }, [])
                        );
                        return;
                    } else {
                        row = row.set(col.name, values.size === 1 ? values.first().raw : undefined);
                    }
                }
                else {
                    row = row.set(col.name, values.size === 1 ? values.first().raw : undefined);
                }
            });
            if (forUpdate) {
                row = row.merge(model.getPkData(model.dataIds.get(rn)));
            }

            data = data.push(row);
        }

        return data;
    }

    /**
     * Determines which rows in the grid have missing required fields, which sets of rows have combinations
     * of key fields that are duplicated, and, optionally, which sets of rows have duplicated values for a
     * given field key.
     *
     * @param queryGridModel the model whose data we are validating
     * @param uniqueFieldKey optional (non-key) field that should be unique.
     */
    validateData(
        queryGridModel: QueryGridModel,
        uniqueFieldKey?: string
    ): {
        uniqueKeyViolations: Map<string, Map<string, List<number>>>; // map from the column captions (joined by ,) to a map from values that are duplicates to row numbers.
        missingRequired: Map<string, List<number>>; // map from column caption to row numbers with missing values
    } {
        const columns = queryGridModel.getInsertColumns();
        let uniqueFieldCol;
        const keyColumns = columns.filter(column => column.isKeyField);
        let keyValues = Map<number, List<string>>(); // map from row number to list of key values on that row
        let uniqueKeyMap = Map<string, List<number>>(); // map from value to rows with that value
        let missingRequired = Map<string, List<number>>(); // map from column caption to list of rows missing a value for that column
        for (let rn = 0; rn < queryGridModel.data.size; rn++) {
            columns.forEach((col, cn) => {
                const values = this.getValue(cn, rn);
                if (col.required) {
                    if (values.isEmpty() || values.find(value => this.hasRawValue(value)) == undefined) {
                        if (missingRequired.has(col.caption)) {
                            missingRequired = missingRequired.set(
                                col.caption,
                                missingRequired.get(col.caption).push(rn + 1)
                            );
                        } else {
                            missingRequired = missingRequired.set(
                                col.caption,
                                List<number>([rn + 1])
                            );
                        }
                    }
                }

                if (col.isKeyField) {
                    // there better be only one of these
                    const valueDescriptor = values.get(0);
                    if (this.hasRawValue(valueDescriptor)) {
                        if (keyValues.has(rn + 1)) {
                            keyValues = keyValues.set(
                                rn + 1,
                                keyValues.get(rn + 1).push(valueDescriptor.raw.toString())
                            );
                        } else {
                            keyValues = keyValues.set(
                                rn + 1,
                                List<string>([valueDescriptor.raw.toString()])
                            );
                        }
                    }
                } else if (uniqueFieldKey && col.fieldKey === uniqueFieldKey) {
                    uniqueFieldCol = col;
                    // there better be only one of these
                    const valueDescriptor = values.get(0);
                    if (valueDescriptor && this.hasRawValue(valueDescriptor)) {
                        const stringVal = valueDescriptor.raw.toString().trim().toLowerCase();
                        if (uniqueKeyMap.has(stringVal)) {
                            uniqueKeyMap = uniqueKeyMap.set(stringVal, uniqueKeyMap.get(stringVal).push(rn + 1));
                        } else {
                            uniqueKeyMap = uniqueKeyMap.set(
                                stringVal,
                                List<number>([rn + 1])
                            );
                        }
                    }
                }
            });
        }

        let uniqueKeyViolations = Map<string, Map<string, List<number>>>();
        const duplicates = uniqueKeyMap.filter(rowNumbers => rowNumbers.size > 1).toMap();
        if (duplicates.size > 0 && uniqueFieldCol) {
            uniqueKeyViolations = uniqueKeyViolations.set(uniqueFieldCol.caption, duplicates);
        }

        // Join all the keyValues together and put them in a map with a list of row
        // numbers with that key.  Then filter to those lists with more than one item.
        const keyViolations = keyValues
            .reduce((keyMap, values, rowNumber) => {
                const key = values.join(', ');
                if (keyMap.has(key)) return keyMap.set(key, keyMap.get(key).push(rowNumber));
                else
                    return keyMap.set(
                        key,
                        List<number>([rowNumber])
                    );
            }, Map<string, List<number>>())
            .filter(rowNumbers => rowNumbers.size > 1)
            .toMap();
        if (!keyViolations.isEmpty()) {
            uniqueKeyViolations = uniqueKeyViolations.set(
                keyColumns.map(column => column.caption).join(', '),
                keyViolations
            );
        }

        // need to return a map from the column names/captions to the rows with duplicates.
        // Message:
        //   Duplicate values (val1, val2) for <column1, column2> on rows X, Y, Z.
        return {
            uniqueKeyViolations,
            missingRequired,
        };
    }

    getValidationErrors(queryGridModel: QueryGridModel, uniqueFieldKey?: string): string[] {
        const { uniqueKeyViolations, missingRequired } = this.validateData(queryGridModel, uniqueFieldKey);
        let errors = [];
        if (!uniqueKeyViolations.isEmpty()) {
            const messages = uniqueKeyViolations.reduce((keyMessages, valueMap, fieldNames) => {
                return keyMessages.concat(
                    valueMap.reduce((messages, rowNumbers, values) => {
                        messages.push(
                            'Duplicate value (' +
                                values +
                                ') for ' +
                                fieldNames +
                                ' on rows ' +
                                rowNumbers.join(', ') +
                                '.'
                        );
                        return messages;
                    }, new Array<string>())
                );
            }, new Array<string>());
            errors = errors.concat(messages);
        }
        if (!missingRequired.isEmpty()) {
            const messages = missingRequired
                .reduce((messages, rowNumbers, fieldName) => {
                    messages.push(
                        fieldName +
                            ' is missing from ' +
                            (rowNumbers.size > 1 ? 'rows ' : 'row ') +
                            rowNumbers.join(', ') +
                            '.'
                    );
                    return messages;
                }, new Array<string>())
                .join(' ');
            errors = errors.concat(messages);
        }

        return errors;
    }

    getValue(colIdx: number, rowIdx: number): List<ValueDescriptor> {
        const cellKey = genCellKey(colIdx, rowIdx);
        if (this.cellValues.has(cellKey)) {
            return this.cellValues.get(cellKey);
        }

        return List<ValueDescriptor>();
    }

    hasFocus(): boolean {
        return this.focusColIdx > -1 && this.focusRowIdx > -1;
    }

    hasMultipleSelection(): boolean {
        return this.selectionCells.size > 1;
    }

    hasSelection(): boolean {
        return this.selectedColIdx > -1 && this.selectedRowIdx > -1;
    }

    isInBounds(colIdx: number, rowIdx: number): boolean {
        return colIdx >= 0 && colIdx < this.colCount && rowIdx >= 0 && rowIdx < this.rowCount;
    }

    inSelection(colIdx: number, rowIdx: number): boolean {
        return colIdx > -1 && rowIdx > -1 && this.selectionCells.get(genCellKey(colIdx, rowIdx)) !== undefined;
    }

    hasRawValue(descriptor: ValueDescriptor) {
        return descriptor && descriptor.raw !== undefined && descriptor.raw.toString().trim() !== '';
    }

    hasData(): boolean {
        return (
            this.cellValues.find(valueList => {
                return valueList.find(value => this.hasRawValue(value)) !== undefined;
            }) !== undefined
        );
    }

    isFocused(colIdx: number, rowIdx: number): boolean {
        return colIdx > -1 && rowIdx > -1 && this.focusColIdx === colIdx && this.focusRowIdx === rowIdx;
    }

    isSelected(colIdx: number, rowIdx: number): boolean {
        return colIdx > -1 && rowIdx > -1 && this.selectedColIdx === colIdx && this.selectedRowIdx === rowIdx;
    }

    static getEditorDataFromQueryValueMap(valueMap: any): List<any> | any {
        // Editor expects to get either a single value or an array of an object with fields displayValue and value
        if (valueMap && List.isList(valueMap)) {
            return valueMap.map(val => {
                // If immutable convert to normal JS
                if (Iterable.isIterable(val)) {
                    return { displayValue: val.get('displayValue'), value: val.get('value') };
                } else return val;
            });
        } else if (
            valueMap &&
            valueMap.has('value') &&
            valueMap.get('value') !== null &&
            valueMap.get('value') !== undefined
        ) {
            return valueMap.has('displayValue')
                ? List<any>([{ displayValue: valueMap.get('displayValue'), value: valueMap.get('value') }])
                : valueMap.get('value');
        } else return undefined;
    }

    static convertQueryDataToEditorData(data: Map<string, any>, updates?: Map<any, any>): Map<any, Map<string, any>> {
        return data.map(valueMap => {
            const returnMap = valueMap.reduce((m, valueMap, key) => {
                const editorData = EditorModel.getEditorDataFromQueryValueMap(valueMap);
                if (editorData) return m.set(key, editorData);
                else return m;
            }, Map<any, any>());
            return updates ? returnMap.merge(updates) : returnMap;
        }) as Map<any, Map<string, any>>;
    }

    getDeletedIds(): Set<any> {
        return this.deletedIds.filter(id => id.toString().indexOf(GRID_EDIT_INDEX) === -1).toSet();
    }

    isModified(editedRow: Map<string, any>, originalQueryRow: Map<string, any>): boolean {
        return editedRow.find((value, key) => originalQueryRow.get(key) !== value) !== undefined;
    }

    isRowEmpty(editedRow: Map<string, any>): boolean {
        return editedRow.find(value => value !== undefined) === undefined;
    }

    getModifiedData(
        model: QueryGridModel,
        readOnlyColumns?: List<string>
    ): { newRows: List<Map<string, any>>; updatedRows: List<Map<string, any>> } {
        // find all the rows where the dataId has a prefix of GRID_EDIT_INDEX
        const rawData: List<Map<string, any>> = this.getRawData(model, false, readOnlyColumns);
        let updatedRows = List<Map<string, any>>();
        let newRows = List<Map<string, any>>();
        model.dataIds.forEach((id, index) => {
            const editedRow = rawData.get(index);
            if (id.toString().indexOf(GRID_EDIT_INDEX) === 0) {
                if (!this.isRowEmpty(editedRow)) newRows = newRows.push(editedRow);
            } else if (this.isModified(editedRow, model.data.get(id))) {
                updatedRows = updatedRows.push(editedRow.merge(model.getPkData(id)));
            }
        });
        return {
            newRows,
            updatedRows,
        };
    }
}

export class LookupStore extends Record({
    key: undefined,
    descriptors: OrderedMap<any, ValueDescriptor>(),
    isLoaded: false,
    isLoading: false,
    lastToken: '~~INITIAL_TOKEN~~',
    loadCount: 0,
    matchCount: 0,
}) {
    key: string;
    descriptors: OrderedMap<any, ValueDescriptor>;
    isLoaded: boolean;
    isLoading: boolean;
    lastToken: string;
    loadCount: number;
    matchCount: number;

    static key(col: QueryColumn): string {
        return [col.lookup.schemaName, col.lookup.queryName, col.fieldKey].join('|');
    }

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    containsAll(values: List<string>): boolean {
        const displayValues = this.descriptors.reduce(
            (valueSet, descriptor) => valueSet.add(descriptor.display),
            Set<string>()
        );

        return values.find(value => !displayValues.contains(value)) == undefined;
    }
}
