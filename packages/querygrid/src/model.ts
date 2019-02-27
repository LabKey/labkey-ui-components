/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, OrderedMap, Record, Set } from 'immutable'
import { Filter } from '@labkey/api'
import {
    QueryColumn, QueryInfo, QueryGridModel, SchemaQuery, ViewInfo,
    IQueryGridModel, IGridLoader, resolveSchemaQuery
} from '@glass/models'

import { genCellKey } from './actions'
import { getQueryGridModel } from './global'
import { DefaultGridLoader } from './components/GridLoader'

const emptyList = List<string>();

interface IStateModelProps {
    allowSelection?: boolean
    baseFilters?: List<Filter.Filter>
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
        baseFilters: List<Filter.Filter>(),
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

    getRawData(model: QueryGridModel): List<Map<string, any>> {
        let data = List<Map<string, any>>().asMutable();
        const columns = model.getInsertColumns();

        for (let rn = 0; rn < model.data.size; rn++) {
            let row = Map<string, any>().asMutable();
            columns.forEach((col, cn) => {
                const values = this.getValue(cn, rn);

                if (col.isLookup()) {
                    if (col.isExpInput()) {
                        let sep = '';
                        row.set(col.name, values.reduce((str, vd) => {
                            if (vd.display !== undefined && vd.display !== null) {
                                str += sep + vd.display;
                                sep = ', ';
                            }
                            return str;
                        }, ''));
                        return;
                    }
                    else if (col.isJunctionLookup()) {
                        row.set(col.name, values.reduce((arr, vd) => {
                            if (vd.raw !== undefined && vd.raw !== null) {
                                arr.push(vd.raw);
                            }
                            return arr;
                        }, []));
                        return;
                    }
                }

                row.set(col.name, values.size === 1 ? values.first().raw : undefined);
            });

            data.push(row.asImmutable());
        }

        return data.asImmutable();
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