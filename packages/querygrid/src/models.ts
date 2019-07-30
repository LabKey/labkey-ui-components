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
import { fromJS, List, Map, OrderedMap, Record, Set } from 'immutable'
import { Filter } from '@labkey/api'
import {
    IGridLoader,
    IQueryGridModel,
    QueryColumn,
    QueryGridModel,
    QueryInfo,
    resolveSchemaQuery,
    SchemaQuery,
    ViewInfo
} from '@glass/base'

import { genCellKey } from './actions'
import { getQueryGridModel } from './global'
import { DefaultGridLoader } from './components/GridLoader'

const emptyList = List<string>();

interface IStateModelProps {
    allowSelection?: boolean
    baseFilters?: List<Filter.IFilter>
    bindURL?: boolean
    editable?: boolean
    isPaged?: boolean
    loader?: IGridLoader
    maxRows?: number
    queryInfo?: QueryInfo
    requiredColumns?: List<string>
    sorts?: string
    sortable?: boolean
    title?: string
    urlPrefix?: string
    omittedColumns?: List<string>
}

export function getStateModelId(gridId: string, schemaQuery: SchemaQuery, keyValue?: any): string {
    let parts = [gridId, resolveSchemaQuery(schemaQuery)];

    if (schemaQuery && schemaQuery.viewName) {
        parts.push(schemaQuery.viewName);
    }
    if (keyValue !== undefined) {
        parts.push(keyValue);
    }

    return parts.join('|').toLowerCase();
}

/**
 * Used to create a QueryGridModel, based on some initial props, that can be put into the global state.
 * @param gridId
 * @param schemaQuery
 * @param [initProps] can be either a props object or a function that returns a props object. The advantage of using
 * a function is that it is only called once for the lifetime of the model thus saving cycles constructing the prop
 * object.
 * @param [keyValue]
 * @returns {QueryGridModel}
 */
export function getStateQueryGridModel(
    gridId: string,
    schemaQuery: SchemaQuery,
    initProps?: IStateModelProps | Function, // () => IStateModelProps
    keyValue?: any
): QueryGridModel {
    const modelId = getStateModelId(gridId, schemaQuery, keyValue);

    // if the model already exists in the global state, return it
    const model = getQueryGridModel(modelId);
    if (model) {
        return model;
    }

    let modelProps: Partial<IQueryGridModel> = {
        allowSelection: true,
        baseFilters: List<Filter.IFilter>(),
        bindURL: true,
        editable: false,
        id: modelId,
        isPaged: false, // Figure out how to set this to the same default value as the model
        loader: DefaultGridLoader,
        keyValue: undefined,
        maxRows: 20,
        schema: schemaQuery.schemaName,
        query: schemaQuery.queryName,
        queryInfo: undefined,
        requiredColumns: emptyList,
        sorts: undefined,
        sortable: true,
        title: undefined,
        urlPrefix: undefined,
        view: schemaQuery.viewName,
        omittedColumns: emptyList
    };

    if (keyValue !== undefined) {
        modelProps.keyValue = keyValue;

        if (schemaQuery.viewName === undefined) {
            modelProps.view = ViewInfo.DETAIL_NAME;
            modelProps.bindURL = false;
        }
    }

    let props: IStateModelProps;
    if (initProps !== undefined) {
        props = typeof initProps === 'function' ? initProps() : initProps;

        if (props) {
            if (props.bindURL !== undefined) {
                modelProps.bindURL = props.bindURL === true;
            }

            if (props.isPaged !== undefined) {
                modelProps.isPaged = props.isPaged === true;
            }

            if (props.loader !== undefined) {
                modelProps.loader = props.loader;
            }

            if (props.queryInfo !== undefined) {
                modelProps.queryInfo = props.queryInfo;
            }

            if (props.maxRows !== undefined) {
                modelProps.maxRows = props.maxRows;
            }

            if (props.baseFilters) {
                modelProps.baseFilters = props.baseFilters;
            }

            if (props.requiredColumns !== undefined) {
                modelProps.requiredColumns = props.requiredColumns;
            }
            if (props.urlPrefix !== undefined) {
                modelProps.urlPrefix = props.urlPrefix;
            }

            if (props.title !== undefined) {
                modelProps.title = props.title;
            }

            if (props.allowSelection !== undefined) {
                modelProps.allowSelection = props.allowSelection;
            }

            if (props.editable !== undefined) {
                modelProps.editable = props.editable;
            }

            if (props.sortable !== undefined) {
                modelProps.sortable = props.sortable;
            }

            if (props.sorts !== undefined) {
                modelProps.sorts = props.sorts;
            }

            if (props.omittedColumns !== undefined) {
                modelProps.omittedColumns = props.omittedColumns;
            }
        }
    }

    return new QueryGridModel(modelProps);
}

// commented out attributes are not used in app
export class DataViewInfo extends Record({
    name: undefined,
    type: undefined,
    reportId: undefined,
    schemaName: undefined,
    queryName: undefined,
    shared: false,
    iconCls: undefined,
    description: undefined,
    // container: undefined,
    // access: undefined,
    // detailsUrl: undefined,
    // icon: undefined,
    // runUrl: undefined,
    // defaultThumbnailUrl: undefined,
    // defaultIconCls: undefined,
    // modified: undefined,
    // modifiedBy: undefined,
    // id: undefined,
    // cratedByuserId: undefined,
    // showInDashboard: undefined,
    // thumbnail: undefined,
    // visible: undefined,
    // contentModified: undefined,
    // author: undefined,
    // created: undefined,
    // dataType: undefined,
    // readOnly: undefined,
    // createdBy: undefined,
    // allowCustomThumbnail: undefined,
    // category: undefined,

    // our stuff
    isLoading: false,
    isLoaded: false,
    error: undefined
}) {
    name: string;
    type: string;
    reportId: string;
    schemaName: string;
    queryName: string;
    shared: boolean;
    iconCls: string;
    description: string;
    // container: string;
    // access: any;
    // detailsUrl: string;
    // icon: string;
    // runUrl: string;
    // defaultThumbnailUrl: string;
    // defaultIconCls: string;
    // modified: date;
    // modifiedBy: number;
    // id: string;
    // cratedByuserId: number;
    // showInDashboard: boolean;
    // thumbnail: string;
    // visible: boolean;
    // contentModified: date;
    // author: string;
    // created: date;
    // dataType: string;
    // readOnly: boolean;
    // createdBy: number;
    // allowCustomThumbnail: boolean;
    // category: any;
    isLoading: boolean;
    isLoaded: boolean;
    error: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

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
        return this.type === "Bar Chart"
            || this.type === "Box and Whisker Plot"
            || this.type === "Pie Chart"
            || this.type === "XY Scatter Plot"
            || this.type === "XY Series Line Plot";
    }
}

export class VisualizationConfigModel extends Record({
    queryConfig: undefined,
    chartConfig: undefined
}) {
    queryConfig: QueryConfigModel;
    chartConfig: ChartConfigModel;

    static create(raw: any): VisualizationConfigModel {
        return new VisualizationConfigModel(Object.assign({}, raw, {
            chartConfig: new ChartConfigModel(raw.chartConfig),
            queryConfig: new QueryConfigModel(raw.queryConfig)
        }))
    }

    constructor(values?: {[key:string]: any}) {
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
    width: undefined
}) {
    geomOptions: any;
    height: number;
    labels: any;
    measures: any;
    pointType: string;
    renderType: string;
    scales: any;
    width: number;

    constructor(values?: {[key:string]: any}) {
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
    viewName: undefined
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

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

export interface ValueDescriptor {
    display: any
    raw: any
}

export interface CellMessage {
    message: string
}

export type CellMessages = Map<string, CellMessage>;
export type CellValues = Map<string, List<ValueDescriptor>>;

export interface EditorModelProps {
    cellMessages: CellMessages
    cellValues: CellValues
    colCount: number
    id: string
    isPasting: boolean
    focusColIdx: number
    focusRowIdx: number
    focusValue: List<ValueDescriptor>
    numPastedRows: number
    rowCount: number
    selectedColIdx: number
    selectedRowIdx: number
    selectionCells: Set<string>
}

export class EditorModel extends Record({
    cellMessages: Map<string, CellMessage>(),
    cellValues: Map<string, List<ValueDescriptor>>(),
    colCount: 0,
    id: undefined,
    isPasting: false,
    focusColIdx: -1,
    focusRowIdx: -1,
    focusValue: undefined,
    numPastedRows: 0,
    rowCount: 0,
    selectedColIdx: -1,
    selectedRowIdx: -1,
    selectionCells: Set<string>()
}) implements EditorModelProps {
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

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    findNextCell(startCol: number, startRow: number,
                 predicate: (value: List<ValueDescriptor>, colIdx: number, rowIdx: number) => boolean,
                 advance: (colIdx: number, rowIdx: number) => {colIdx: number, rowIdx: number})
    {
        let colIdx = startCol,
            rowIdx = startRow;

        while (true) {
            ({colIdx, rowIdx} = advance(colIdx, rowIdx));
            if (!this.isInBounds(colIdx, rowIdx))
                break;

            let value = this.getValue(colIdx, rowIdx);
            if (predicate(value, colIdx, rowIdx)) {
                return {
                    value,
                    colIdx,
                    rowIdx
                };
            }
        }

        // not found
        return null;
    }

    getMessage(colIdx: number, rowIdx: number): CellMessage {
        return this.cellMessages.get(genCellKey(colIdx, rowIdx));
    }

    getColumns(model: QueryGridModel, forUpdate?: boolean, readOnlyColumns?: List<string>) {
        if (forUpdate) {
            return model.getUpdateColumns(readOnlyColumns);
        }
        else {
            return model.getInsertColumns();
        }
    }

    getRawData(model: QueryGridModel, forUpdate: boolean = false, readOnlyColumns?: List<string>): List<Map<string, any>> {
        let data = List<Map<string, any>>();
        const columns = this.getColumns(model, forUpdate, readOnlyColumns);

        for (let rn = 0; rn < model.data.size; rn++) {
            let row = Map<string, any>();
            columns.forEach((col, cn) => {
                const values = this.getValue(cn, rn);

                if (col.isLookup()) {
                    if (col.isExpInput()) {
                        let sep = '';
                        row = row.set(col.name, values.reduce((str, vd) => {
                            if (vd.display !== undefined && vd.display !== null) {
                                str += sep + vd.display;
                                sep = ', ';
                            }
                            return str;
                        }, ''));
                        return;
                    }
                    else if (col.isJunctionLookup()) {
                        row = row.set(col.name, values.reduce((arr, vd) => {
                            if (vd.raw !== undefined && vd.raw !== null) {
                                arr.push(vd.raw);
                            }
                            return arr;
                        }, []));
                        return;
                    }
                }

                row = row.set(col.name, values.size === 1 ? values.first().raw : undefined);
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
    validateData(queryGridModel: QueryGridModel, uniqueFieldKey?: string) : {
        uniqueKeyViolations: Map<string, Map<string, List<number>>>, // map from the column captions (joined by ,) to a map from values that are duplicates to row numbers.
        missingRequired: Map<string, List<number>> // map from column caption to row numbers with missing values
    } {
        const columns = queryGridModel.getInsertColumns();
        let uniqueFieldCol;
        let keyColumns = columns.filter((column) => column.isKeyField);
        let keyValues = Map<number, List<string>>(); // map from row number to list of key values on that row
        let uniqueKeyMap = Map<string, List<number>>(); // map from value to rows with that value
        let missingRequired = Map<string, List<number>>(); // map from column caption to list of rows missing a value for that column
        for (let rn = 0; rn < queryGridModel.data.size; rn++) {
            columns.forEach((col, cn) => {
                const values = this.getValue(cn, rn);
                if (col.required) {
                    if (values.isEmpty() || values.find((value) => this.hasRawValue(value)) == undefined) {
                        if (missingRequired.has(col.caption)) {
                            missingRequired = missingRequired.set(col.caption, missingRequired.get(col.caption).push(rn+1));
                        }
                        else {
                            missingRequired = missingRequired.set(col.caption, List<number>([rn+1]));
                        }
                    }
                }

                if (col.isKeyField) {
                    // there better be only one of these
                    const valueDescriptor = values.get(0);
                    if (this.hasRawValue(valueDescriptor)) {
                        if (keyValues.has(rn+1)) {
                            keyValues = keyValues.set(rn+1, keyValues.get(rn+1).push(valueDescriptor.raw.toString()));
                        }
                        else {
                            keyValues = keyValues.set(rn+1, List<string>([valueDescriptor.raw.toString()]));
                        }
                    }
                }
                else if (uniqueFieldKey && col.fieldKey === uniqueFieldKey) {
                    uniqueFieldCol = col;
                    // there better be only one of these
                    const valueDescriptor = values.get(0);
                    if (valueDescriptor && this.hasRawValue(valueDescriptor)) {
                        const stringVal = valueDescriptor.raw.toString();
                        if (uniqueKeyMap.has(stringVal)) {
                            uniqueKeyMap = uniqueKeyMap.set(stringVal, uniqueKeyMap.get(stringVal).push(rn+1));
                        }
                        else {
                            uniqueKeyMap = uniqueKeyMap.set(stringVal, List<number>([rn+1]))
                        }
                    }
                }
            });
        }

        let uniqueKeyViolations = Map<string, Map<string, List<number>>>();
        let duplicates = uniqueKeyMap.filter((rowNumbers => rowNumbers.size > 1)).toMap();
        if (duplicates.size > 0 && uniqueFieldCol) {
            uniqueKeyViolations = uniqueKeyViolations.set(uniqueFieldCol.caption, duplicates);
        }

        // Join all the keyValues together and put them in a map with a list of row
        // numbers with that key.  Then filter to those lists with more than one item.
        let keyViolations = keyValues.reduce((keyMap, values, rowNumber) => {
              const key = values.join(", ");
              if (keyMap.has(key))
                  return keyMap.set(key, keyMap.get(key).push(rowNumber));
              else
                  return keyMap.set(key, List<number>([rowNumber]));
        }, Map<string, List<number>>()).filter((rowNumbers => rowNumbers.size > 1)).toMap();
        if (!keyViolations.isEmpty()) {
            uniqueKeyViolations = uniqueKeyViolations.set(keyColumns.map(column => column.caption).join(", "), keyViolations)
        }

        // need to return a map from the column names/captions to the rows with duplicates.
        // Message:
        //   Duplicate values (val1, val2) for <column1, column2> on rows X, Y, Z.
        return {
            uniqueKeyViolations,
            missingRequired,
        };
    }

    getValidationErrors(queryGridModel: QueryGridModel, uniqueFieldKey?: string) : Array<string> {
        let { uniqueKeyViolations, missingRequired } = this.validateData(queryGridModel, uniqueFieldKey);
        let errors = [];
        if (!uniqueKeyViolations.isEmpty()) {
            const messages = uniqueKeyViolations.reduce((keyMessages, valueMap, fieldNames) => {
                return keyMessages.concat(valueMap.reduce((messages, rowNumbers, values) => {
                    messages.push("Duplicate value (" + values + ") for " + fieldNames + " on rows " + rowNumbers.join(", ") + ".");
                    return messages;
                }, new Array<string>()));
            }, new Array<string>());
            errors = errors.concat(messages);
        }
        if (!missingRequired.isEmpty()) {
            const messages = missingRequired.reduce((messages, rowNumbers, fieldName) => {
                messages.push(fieldName + " is missing from " + (rowNumbers.size > 1 ? "rows " : "row ") + rowNumbers.join(", ") + "." );
                return messages;
            }, new Array<string>()).join(" ");
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
        return (colIdx >= 0 && colIdx < this.colCount && rowIdx >= 0 && rowIdx < this.rowCount);
    }

    inSelection(colIdx: number, rowIdx: number): boolean {
        return (
            colIdx > -1 && rowIdx > -1 &&
            this.selectionCells.get(genCellKey(colIdx, rowIdx)) !== undefined
        )
    }

    hasRawValue(descriptor: ValueDescriptor) {
        return descriptor && descriptor.raw !== undefined && descriptor.raw !== "";
    }

    hasData() : boolean {
        return this.cellValues.find((valueList) => {
            return valueList.find(value => this.hasRawValue(value)) !== undefined
        } ) !== undefined;
    }

    isFocused(colIdx: number, rowIdx: number): boolean {
        return (
            colIdx > -1 && rowIdx > -1 &&
            this.focusColIdx === colIdx &&
            this.focusRowIdx === rowIdx
        );
    }

    isSelected(colIdx: number, rowIdx: number): boolean {
        return (
            colIdx > -1 && rowIdx > -1 &&
            this.selectedColIdx === colIdx &&
            this.selectedRowIdx === rowIdx
        );
    }
}

export class LookupStore extends Record({
    key: undefined,
    descriptors: OrderedMap<any, ValueDescriptor>(),
    isLoaded: false,
    isLoading: false,
    lastToken: '~~INITIAL_TOKEN~~',
    loadCount: 0,
    matchCount: 0
}) {
    key: string;
    descriptors: OrderedMap<any, ValueDescriptor>;
    isLoaded: boolean;
    isLoading: boolean;
    lastToken: string;
    loadCount: number;
    matchCount: number;

    static key(col: QueryColumn): string {
        return [
            col.lookup.schemaName,
            col.lookup.queryName,
            col.fieldKey
        ].join('|');
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    containsAll(values: List<string>): boolean {
        let displayValues = this.descriptors
            .reduce((valueSet, descriptor) => valueSet.add(descriptor.display), Set<String>());

        return values.find((value) => !displayValues.contains(value)) == undefined;
    }
}

export class SearchResultsModel extends Record({
    entities: undefined,
    error: undefined,
    isLoading: false,
    isLoaded: false,
    lastUpdate: undefined,
}) {
    entities: List<Map<any, any>>;
    error: string;
    isLoading: boolean;
    isLoaded: boolean;
    lastUpdate: Date;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(raw: any): SearchResultsModel {
        return new SearchResultsModel({
            ...raw,
            entities: raw.entities ? fromJS(raw.entities) : undefined
        });
    }
}

export class SearchIdData {
    group: string;
    id: string;
    type: string;
}