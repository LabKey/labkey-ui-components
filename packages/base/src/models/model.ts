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
import { fromJS, List, Map, OrderedMap, OrderedSet, Record } from 'immutable'
import { ActionURL, Filter, Utils } from '@labkey/api'

import { GRID_CHECKBOX_OPTIONS, GRID_EDIT_INDEX, GRID_SELECTION_INDEX } from './constants'
import { decodePart, getSchemaQuery, intersect, resolveKey, resolveSchemaQuery, toLowerSafe } from '../utils/utils'
import { AppURL } from "../url/AppURL";
import { WHERE_FILTER_TYPE } from "../url/WhereFilterType";

const emptyList = List<string>();
const emptyColumns = List<QueryColumn>();
const emptyRow = Map<string, any>();

export enum QueryInfoStatus { ok, notFound, unknown }
export enum MessageLevel { info, warning, error }

/**
 * Model for org.labkey.api.data.Container as returned by Container.toJSON()
 */
export class Container extends Record({
    activeModules: List<string>(),
    folderType: '',
    hasRestrictedActiveModule: false,
    id: '',
    isContainerTab: false,
    isWorkbook: false,
    name: '',
    parentId: '',
    parentPath: '',
    path: '',
    sortOrder: 0,
    title: '',
    type: ''
}) {
    activeModules: List<string>;
    folderType: string;
    hasRestrictedActiveModule: boolean;
    id: string;
    isContainerTab: boolean;
    isWorkbook: boolean;
    name: string;
    parentId: string;
    parentPath: string;
    path: string;
    sortOrder: number;
    title: string;
    type: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

interface IUserProps {
    id: number

    canDelete: boolean
    canDeleteOwn: boolean
    canInsert: boolean
    canUpdate: boolean
    canUpdateOwn: boolean

    displayName: string
    email: string
    phone: string
    avatar: string

    isAdmin: boolean
    isGuest: boolean
    isSignedIn: boolean
    isSystemAdmin: boolean

    permissionsList: List<string>
}

const defaultUser: IUserProps = {
    id: 0,

    canDelete: false,
    canDeleteOwn: false,
    canInsert: false,
    canUpdate: false,
    canUpdateOwn: false,

    displayName: 'guest',
    email: 'guest',
    phone: null,
    avatar: ActionURL.getContextPath() + '/_images/defaultavatar.png',

    isAdmin: false,
    isGuest: true,
    isSignedIn: false,
    isSystemAdmin: false,

    permissionsList: List()
};

/**
 * Model for org.labkey.api.security.User as returned by User.getUserProps()
 */
export class User extends Record(defaultUser) implements IUserProps {
    id: number;

    canDelete: boolean;
    canDeleteOwn: boolean;
    canInsert: boolean;
    canUpdate: boolean;
    canUpdateOwn: boolean;

    displayName: string;
    email: string;
    phone: string;
    avatar: string;

    isAdmin: boolean;
    isGuest: boolean;
    isSignedIn: boolean;
    isSystemAdmin: boolean;

    permissionsList: List<string>;

    static getDefaultUser(): User {
        return new User(defaultUser);
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

export interface IParsedSelectionKey {
    keys: string
    schemaQuery: SchemaQuery
}

const APP_SELECTION_PREFIX = 'appkey';

export class SchemaQuery extends Record({
    schemaName: undefined,
    queryName: undefined,
    viewName: undefined
}) {

    static create(schemaName: string, queryName: string, viewName?: string) : SchemaQuery {
        return new SchemaQuery({schemaName, queryName, viewName});
    }

    schemaName: string;
    queryName: string;
    viewName: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    getSchema() {
        return this.schemaName;
    }

    getQuery() {
        return this.queryName;
    }

    getView() {
        return this.viewName;
    }

    isEqual(sq: SchemaQuery): boolean {
        if (!sq) return false;
        return (
            [this.schemaName, this.queryName, this.viewName].join('|').toLowerCase() ===
            [sq.schemaName, sq.queryName, sq.viewName].join('|').toLowerCase()
        );
    }

    hasSchema(schemaName: string): boolean {
        if (schemaName) {
            return this.schemaName.toLowerCase() === schemaName.toLowerCase();
        }

        return false;
    }

    static parseSelectionKey(selectionKey: string): IParsedSelectionKey {
        const [ appkey /* not used */, schemaQueryKey, keys ] = selectionKey.split('|');

        return {
            keys,
            schemaQuery: getSchemaQuery(schemaQueryKey)
        };
    }

    static createAppSelectionKey(targetSQ: SchemaQuery, keys: Array<any>): string {
        return [
            APP_SELECTION_PREFIX,
            resolveSchemaQuery(targetSQ),
            keys.join(';')
        ].join('|');
    }
}

// commented out attributes are not used in app
export class QueryColumn extends Record({
    align: undefined,
    // autoIncrement: undefined,
    // calculated: undefined,
    caption: undefined,
    conceptURI: null,
    // defaultScale: undefined,
    defaultValue: null,
    description: undefined,
    // dimension: undefined,
    displayAsLookup: undefined,
    // excludeFromShifting: undefined,
    // ext: undefined,
    // facetingBehaviorType: undefined,
    fieldKey: undefined,
    fieldKeyArray: undefined,
    // fieldKeyPath: undefined,
    format: undefined,
    // friendlyType: undefined,
    hidden: undefined,
    inputType: undefined,
    // isAutoIncrement: undefined, // DUPLICATE
    // isHidden: undefined, // DUPLICATE
    isKeyField: undefined,
    // isMvEnabled: undefined,
    // isNullable: undefined,
    // isReadOnly: undefined,
    // isSelectable: undefined, // DUPLICATE
    // isUserEditable: undefined, // DUPLICATE
    // isVersionField: undefined,
    jsonType: undefined,
    // keyField: undefined,
    lookup: undefined,
    // measure: undefined,
    multiValue: false,
    // mvEnabled: undefined,
    name: undefined,
    // nullable: undefined,
    'protected': undefined,
    rangeURI: undefined,
    readOnly: undefined,
    // recommendedVariable: undefined,
    required: undefined,
    // selectable: undefined,
    shortCaption: undefined,
    // shownInDetailsView: undefined,
    shownInInsertView: undefined,
    shownInUpdateView: undefined,
    sortable: true,
    // sqlType: undefined,
    type: undefined,
    userEditable: undefined,
    // versionField: undefined,

    cell: undefined,
    columnRenderer: undefined,
    detailRenderer: undefined,
    inputRenderer: undefined,
    removeFromViews: false,
    sorts: undefined,
    units: undefined
}) {
    align: string;
    // autoIncrement: boolean;
    // calculated: boolean;
    caption: string;
    conceptURI: string;
    // defaultScale: string;
    defaultValue: any;
    description: string;
    // dimension: boolean;
    displayAsLookup: boolean;
    // excludeFromShifting: boolean;
    // ext: any;
    // facetingBehaviorType: string;
    fieldKey: string;
    fieldKeyArray: Array<string>;
    // fieldKeyPath: string;
    format: string;
    // friendlyType: string;
    hidden: boolean;
    inputType: string;
    // isAutoIncrement: boolean; // DUPLICATE
    // isHidden: boolean; // DUPLICATE
    isKeyField: boolean;
    // isMvEnabled: boolean;
    // isNullable: boolean;
    // isReadOnly: boolean;
    // isSelectable: boolean; // DUPLICATE
    // isUserEditable: boolean; // DUPLICATE
    // isVersionField: boolean;
    jsonType: string;
    // keyField: boolean;
    lookup: QueryLookup;
    // measure: boolean;
    multiValue: boolean;
    // mvEnabled: boolean;
    name: string;
    // nullable: boolean;
    'protected': boolean;
    rangeURI: string;
    readOnly: boolean;
    // recommendedVariable: boolean;
    required: boolean;
    // selectable: boolean;
    shortCaption: string;
    // shownInDetailsView: boolean;
    shownInInsertView: boolean;
    shownInUpdateView: boolean;
    sortable: boolean;
    // sqlType: string;
    type: string;
    userEditable: boolean;
    // versionField: boolean;

    cell: Function;
    columnRenderer: string;
    detailRenderer: string;
    inputRenderer: string;
    sorts: '+' | '-';
    removeFromViews: boolean; // strips this column from all ViewInfo definitions
    units: string;

    static create(rawColumn): QueryColumn {
        if (rawColumn && rawColumn.lookup !== undefined) {
            return new QueryColumn(Object.assign({}, rawColumn, {
                lookup: new QueryLookup(rawColumn.lookup)
            }));
        }

        return new QueryColumn(rawColumn);
    }

    static DATA_INPUTS: string = 'DataInputs';
    static MATERIAL_INPUTS: string = 'MaterialInputs';

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    isExpInput(): boolean {
        return this.isDataInput() || this.isMaterialInput();
    }

    isDataInput(): boolean {
        return this.name && this.name.toLowerCase().indexOf(QueryColumn.DATA_INPUTS.toLowerCase()) !== -1;
    }

    isEditable() {
        return !this.readOnly && this.userEditable && this.shownInUpdateView;
    }

    isJunctionLookup(): boolean {
        return this.isLookup() && this.lookup.multiValued === 'junction';
    }

    isLookup(): boolean {
        return this.lookup !== undefined;
    }

    isMaterialInput(): boolean {
        return this.name && this.name.toLowerCase().indexOf(QueryColumn.MATERIAL_INPUTS.toLowerCase()) !== -1;
    }
}

export class QueryLookup extends Record({
    // server defaults
    displayColumn: undefined,
    isPublic: false,
    keyColumn: undefined,
    junctionLookup: undefined,
    multiValued: undefined,
    queryName: undefined,
    schemaName: undefined,
    table: undefined
}) {
    displayColumn: string;
    isPublic: boolean;
    junctionLookup: string; // name of the column on the junction table that is also a lookup
    keyColumn: string;
    multiValued: string; // can be "junction", "value" or undefined. Server only support "junction" at this time
    //public: boolean; -- NOT ALLOWING DUE TO KEYWORD -- USE isPublic
    queryName: string;
    //schema: string; -- NOT ALLOWING -- USE schemaName
    schemaName: string;
    //table: string; -- NOT ALLOWING -- USE queryName

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

export interface IQueryGridModel {
    id?: string
    schema?: string
    query?: string
    allowSelection?: boolean
    baseFilters?: List<Filter.IFilter>
    bindURL?: boolean
    data?: Map<any, Map<string, any>>
    dataIds?: List<any>
    displayColumns?: List<string>
    editable?: boolean
    editing?: boolean
    filterArray?: List<Filter.IFilter>
    isError?: boolean
    isLoaded?: boolean
    isLoading?: boolean
    isPaged?: boolean
    keyValue?: any
    loader?: IGridLoader
    maxRows?: number
    message?: string
    offset?: number
    omittedColumns?: List<string>
    pageNumber?: number
    queryInfo?: QueryInfo
    requiredColumns?: List<string>
    showSearchBox?: boolean
    showViewSelector?: boolean
    showChartSelector?: boolean
    sortable?: boolean
    sorts?: string
    selectedIds?: List<string>
    selectedLoaded?: boolean
    selectedState?: GRID_CHECKBOX_OPTIONS
    selectedQuantity?: number
    title?: string
    totalRows?: number
    urlParams?: List<string>
    urlParamValues?: Map<string, any>
    urlPrefix?: string
    view?: string
}

export interface IGridLoader {
    fetch: (model: QueryGridModel) => Promise<IGridResponse>
    fetchSelection?: (model: QueryGridModel) => Promise<IGridSelectionResponse>
}

export interface IGridResponse {
    data: Map<any, any>,
    dataIds: List<any>,
    totalRows?: number,
    messages?: List<Map<string, string>>,
}

export interface IGridSelectionResponse {
    selectedIds: List<any>
}

export class QueryGridModel extends Record({
    id: undefined,
    schema: undefined,
    query: undefined,

    allowSelection: true,
    baseFilters: List<Filter.IFilter>(),
    bindURL: true,
    data: Map<any, Map<string, any>>(),
    dataIds: List<any>(),
    displayColumns: undefined,
    editable: false,
    editing: false,
    filterArray: List<Filter.IFilter>(),
    isError: false,
    isLoaded: false,
    isLoading: false,
    isPaged: false,
    keyValue: undefined,
    loader: undefined,
    maxRows: 20,
    // message is a client-only attribute used to store error messages encountered when trying to load a model. It does
    // not come from a LK server response.
    message: undefined,
    // messages comes from LK Server via the metadata object in the selectRows response. At the moment it is only used
    // to notify users that they are looking at a subset of rows due to QC Flags State.
    messages: undefined,
    offset: 0,
    omittedColumns: emptyList,
    pageNumber: 1,
    queryInfo: undefined,
    requiredColumns: emptyList,
    selectedIds: emptyList,
    selectedLoaded: false,
    selectedState: GRID_CHECKBOX_OPTIONS.NONE,
    selectedQuantity: 0,
    showSearchBox: true,
    showViewSelector: true,
    showChartSelector: true,
    sortable: true,
    sorts: undefined,
    title: undefined,
    totalRows: 0,
    urlParams: List<string>(['p']), // page number parameter
    urlParamValues: Map<string, any>(),
    urlPrefix: undefined, // TODO we should give each new model a default prefix?
    view: undefined,
}) implements IQueryGridModel {
    id: string;
    schema: string;
    query: string;
    allowSelection: boolean;
    baseFilters: List<Filter.IFilter>;
    bindURL: boolean;
    data: Map<any, Map<string, any>>;
    dataIds: List<any>;
    displayColumns: List<string>;
    editable: boolean;
    editing: boolean;
    filterArray: List<Filter.IFilter>;
    isError: boolean;
    isLoaded: boolean;
    isLoading: boolean;
    isPaged: boolean;
    keyValue: any;
    loader?: IGridLoader;
    maxRows: number;
    message: string;
    messages?: List<Map<string, string>>;
    offset: number;
    omittedColumns: List<string>;
    pageNumber: number;
    queryInfo: QueryInfo;
    requiredColumns: List<string>;
    showSearchBox: boolean;
    showViewSelector: boolean;
    showChartSelector: boolean;
    sortable: boolean;
    sorts: string;
    selectedIds: List<string>;
    selectedLoaded: boolean;
    selectedState: GRID_CHECKBOX_OPTIONS;
    selectedQuantity: number;
    title: string;
    totalRows: number;
    urlParams: List<string>;
    urlParamValues: Map<string, any>;
    urlPrefix: string;
    view: string;

    constructor(values?: IQueryGridModel) {
        super(values);

        if (LABKEY.devMode) {
            // ensure that requiredColumns and omittedColumns do not intersect
            let i = intersect(this.requiredColumns, this.omittedColumns);
            if (i.size > 0) {
                console.log('Intersection', i.toJS());
                throw new Error('Required and omitted columns cannot intersect. Model id: "' + this.id + '". See console for colliding columns.');
            }
        }
    }

    canImport() {
        return this.showImportDataButton().get('canImport');
    }

    createParam(param: string, useDefault?: string): string {
        return this.urlPrefix ? [this.urlPrefix, param].join('.') : (useDefault ? [useDefault, param].join('.') : param);
    }

    getColumn(fieldKey: string): QueryColumn {
        if (this.queryInfo) {
            return this.queryInfo.getColumn(fieldKey);
        }
        return undefined;
    }

    isRequiredColumn(fieldKey: string): boolean {
        const column = this.getColumn(fieldKey);
        return column ? column.required : false;
    }

    /**
     * Returns the set of display columns for this QueryGridModel based on its configuration.
     * @returns {List<QueryColumn>}
     */
    getDisplayColumns(): List<QueryColumn> {
        if (this.queryInfo) {
            let cols = this.queryInfo.getDisplayColumns(this.view);

            if (this.omittedColumns.size > 0) {
                const lowerOmit = toLowerSafe(this.omittedColumns);
                return cols.filter(c => c && c.fieldKey && !lowerOmit.includes(c.fieldKey.toLowerCase())).toList();
            }

            return cols;
        }

        return emptyColumns;
    }

    getColumnIndex(fieldKey: string): number {
        if (!fieldKey)
            return -1;

        const lcFieldKey = fieldKey.toLowerCase();
        return this.queryInfo.columns.keySeq().findIndex((column) => (column.toLowerCase() === lcFieldKey));
    }

    getAllColumns(): List<QueryColumn> {
        if (this.queryInfo) {
            return List<QueryColumn>(this.queryInfo.columns.values());
        }

        return emptyColumns;
    }

    getData(): List<any> {
        return this.dataIds.map((i) => {
            if (this.allowSelection) {
                const isChecked = this.selectedIds.indexOf(i) !== -1;
                if (isChecked) {
                    // only set if row is currently checked, otherwise defaults to false
                    return this.data.get(i).merge({
                        [GRID_SELECTION_INDEX]: isChecked
                    });
                }
            }

            return this.data.get(i);

        }).toList();
    }

    /**
     * @returns the data for the current page that has been selected.
     */
    getSelectedData(): Map<any, Map<string, any>> {
        let dataMap = Map<any, Map<string, any>>();
        this.selectedIds.forEach((id) => {
            if (this.data.has(id)) {
                dataMap = dataMap.set(id, this.data.get(id));
            }
        });
        return dataMap;
    }

    getPkData(id) : any {
        let data = {};
        const queryData = this.data.get(id);
        this.queryInfo.getPkCols().forEach((pkCol) => {
            let pkVal = queryData.getIn([pkCol.fieldKey]);

            if (pkVal !== undefined && pkVal !== null) {
                // when backing an editable grid, the data is a simple value, but when
                // backing a grid, it is a Map, which has type 'object'.
                data[pkCol.fieldKey] = (typeof pkVal === 'object') ? pkVal.get('value') : pkVal;
            }
            else {
                console.warn('Unable to find value for pkCol \"' + pkCol.fieldKey + '\"');
            }
        });
        return data;
    }

    getSelectedDataWithKeys(data: any)  : Array<any> {
        let rows = [];
        if (!Utils.isEmptyObj(data)) {
            // walk though all the selected rows and construct an update row for each
            // using the primary keys from the original data
            rows = this.selectedIds.map((id) => {
                return {...this.getPkData(id), ...data};
            }).toArray();
        }
        return rows;
    }

    getExportColumnsString(): string {
        // does not include required columns -- app only
        return this.getDisplayColumns().map(c => c.fieldKey).join(',');
    }

    getFilters(): List<Filter.IFilter> {
        let filterList = List<Filter.IFilter>();
        if (this.queryInfo) {
            if (this.keyValue !== undefined) {
                if (this.queryInfo.pkCols.size === 1) {
                    filterList = filterList.push(
                        Filter.create(this.queryInfo.pkCols.first(), this.keyValue)
                    );
                } else {
                    console.warn('Too many keys. Unable to filter for specific keyValue.', this.queryInfo.pkCols.toJS());
                }
            }
            // if a keyValue if provided, we may still have baseFilters to apply in the case that the default
            // filter on a query view is a limiting filter and we want to expand the set of values returned (e.g., for assay runs
            // that may have been replaced)
            return filterList.concat(this.baseFilters.concat(this.queryInfo.getFilters(this.view)).concat(this.filterArray)).toList();
        }

        return this.baseFilters.concat(this.filterArray).toList();
    }

    getId(): string {
        return this.id;
    }

    getInsertColumnIndex(fieldKey) : number {
        if (!fieldKey)
            return -1;

        const lcFieldKey = fieldKey.toLowerCase();
        return this.getInsertColumns()
            .findIndex((column) => (column.fieldKey.toLowerCase() === lcFieldKey));
    }

    getInsertColumns(): List<QueryColumn> {
        if (this.queryInfo) {
            return this.queryInfo.getInsertColumns();
        }
        return emptyColumns;
    }

    getUpdateColumns(readOnlyColumns?: List<string>): List<QueryColumn> {
        if (this.queryInfo) {
            return this.queryInfo.getUpdateColumns(readOnlyColumns);
        }
        return emptyColumns;
    }

    getKeyColumns(): List<QueryColumn> {
        if (this.queryInfo) {
            return this.queryInfo.getPkCols();
        }
        return emptyColumns;
    }

    getMaxRowIndex() {
        let max = this.pageNumber > 1 ? this.pageNumber * this.maxRows : this.maxRows;

        if (max > this.totalRows) {
            return this.totalRows;
        }

        return max;
    }

    getMaxRows() {
        return this.isPaged ? this.maxRows : undefined;
    }

    getMinRowIndex() {
        return this.getOffset() + 1;
    }

    getModelName() {
        return resolveKey(this.schema, this.query);
    }

    getOffset() {
        return this.pageNumber > 1 ? (this.pageNumber - 1) * this.maxRows : 0;
    }

    getRequestColumnsString(): string {
        let fieldKeys = this.requiredColumns
            .concat(this.getKeyColumns().map(c => c.fieldKey))
            .concat(this.getDisplayColumns().map(c => c.fieldKey));

        if (this.omittedColumns.size > 0) {
            const lowerOmit = toLowerSafe(this.omittedColumns);
            fieldKeys = fieldKeys.filter(fieldKey => fieldKey && !lowerOmit.includes(fieldKey.toLowerCase()));
        }

        return fieldKeys.join(',');
    }

    getRow(index?: number): Map<string, any> {
        if (index === undefined) {
            index = 0;
        }

        if (this.dataIds.size > index) {
            return this.data.get(this.dataIds.get(index));
        }

        return emptyRow;
    }

    getSorts(): string {
        if (this.view && this.queryInfo) {
            let sorts = this.queryInfo.getSorts(this.view);

            if (sorts.size > 0) {
                // user sorts are respected over built-in view sorts
                let allSorts = OrderedSet<string>(this.sorts ? this.sorts.split(',') : []).asMutable();
                sorts.forEach(sort => {
                    allSorts.add(sort.dir === '-' ? '-' + sort.fieldKey : sort.fieldKey);
                });
                return allSorts.toArray().join(',');
            }
        }

        return this.sorts;
    }

    getTitle(): string {
        if (this.queryInfo) {
            return this.queryInfo.queryLabel;
        }

        return this.title;
    }

    /**
     * Retrieves the value for a given dataId/column. Defaults to retrieving the "value" from the row, however,
     * it can return any part that is desired (e.g. "displayValue" or "formattedValue") by specifying the "part" argument.
     */
    getValue(column: QueryColumn | string, dataId: string, part?: string): any {
        if (!column || (dataId === null || dataId === undefined)) {
            return undefined;
        }

        const col: QueryColumn = (typeof column === 'string') ? this.getColumn(column) : column;

        // assumes QueryColumn fieldKey casing is same as data fieldKey casing
        return this.data.getIn([dataId, col.fieldKey, part ? part : 'value']);
    }

    showImportDataButton(): Map<any, any> {
        const query = this.queryInfo;

        if (query) {
            return Map({
                canImport: query.showInsertNewButton && query.importUrl && !query.importUrlDisabled,
                importUrl: query.importUrl
            });
        }

        return Map({
            canImport: false,
            importUrl: undefined
        });
    }

    showInsertNewButton(): Map<any, any> {
        const query = this.queryInfo;

        if (query) {
            return Map({
                canInsert: query.showInsertNewButton && query.insertUrl && !query.insertUrlDisabled,
                insertUrl: query.insertUrl
            });
        }
        return Map({
            canInsert: false,
            insertUrl: false
        });
    }

    getDataEdit(): List<Map<string, any>> {
        return this.dataIds.map(i => {
            if (this.data.has(i)) {
                return this.data.get(i).merge({
                    [GRID_EDIT_INDEX]: i
                });
            }

            return Map<string, any>({
                [GRID_EDIT_INDEX]: i
            })
        }).toList();
    }

    getRowIdsList(useSelectedIds: boolean): List<Map<string, any>> {
        let rows = List<Map<string, any>>();
        if (!useSelectedIds) {
            this.getData().forEach( (data) => {
                rows = rows.push(Map(fromJS({rowId: data.getIn(['RowId', 'value'])})));
            });
        }
        else {
            this.selectedIds.forEach( (rowId) => {
                rows = rows.push(Map(fromJS({rowId})));
            });
        }

        return rows;
    }
}

// commented out attributes are not used in app
export class QueryInfo extends Record({
    // canEdit: false,
    // canEditSharedViews: false,
    columns: OrderedMap<string, QueryColumn>(),
    description: undefined,
    // editDefinitionUrl: undefined,
    importTemplates: List<any>(),
    // indices: Map<string, any>(),
    // isInherited: false,

    iconURL: false,
    // isMetadataOverrideable: false,
    // isTemporary: false,
    // isUserDefined: false,
    lastAction: undefined,
    // lastUpdate: undefined,
    name: undefined,
    pkCols: List<string>(),
    schemaName: undefined,
    status: QueryInfoStatus.unknown,
    // targetContainers: List<any>(),
    title: undefined, // DEPRECATED: Use queryLabel
    titleColumn: undefined,
    // viewDataUrl: undefined,
    views: Map<string, ViewInfo>(),
    importUrlDisabled: undefined,
    importUrl: undefined,
    insertUrlDisabled: undefined,
    insertUrl: undefined,

    // our stuff
    appEditableTable: false,
    isLoading: false,
    isMedia: false, // opt in
    queryLabel: undefined,
    schemaLabel: undefined,
    schemaQuery: undefined,
    showInsertNewButton: true, // opt out
    singular: undefined, // defaults to value of queryLabel
    plural: undefined  // defaults to value of queryLabel
}) {
    private appEditableTable: boolean; // use isAppEditable()
    // canEdit: boolean;
    // canEditSharedViews: boolean;
    columns: OrderedMap<string, QueryColumn>;
    description: string;
    // editDefinitionUrl: string;
    iconURL: string;
    importTemplates: List<any>;
    // indices: Map<string, any>;
    // isInherited: boolean;
    isLoading: boolean;
    isMedia: boolean;
    // isMetadataOverrideable: boolean;
    // isTemporary: boolean;
    // isUserDefined: boolean;
    lastAction: LastActionStatus;
    // lastUpdate: Date;
    name: string;
    pkCols: List<string>;
    plural: string;
    queryLabel: string;
    schemaName: string;
    schemaQuery: SchemaQuery;
    singular: string;
    status: QueryInfoStatus;
    // targetContainers: List<any>;
    title: string;
    titleColumn: string;
    // viewDataUrl: string;
    views: Map<string, ViewInfo>;
    schemaLabel: string;
    showInsertNewButton: boolean;
    importUrlDisabled: boolean;
    importUrl: string;
    insertUrlDisabled: boolean;
    insertUrl: boolean;

    static create(rawQueryInfo: any): QueryInfo {
        let schemaQuery: SchemaQuery;

        if (rawQueryInfo.schemaName && rawQueryInfo.name) {
            schemaQuery = SchemaQuery.create(rawQueryInfo.schemaName, rawQueryInfo.name);
        }

        return new QueryInfo(Object.assign({}, rawQueryInfo, {
            schemaQuery
        }));
    }

    /**
     * Use this method for creating a basic QueryInfo object with a proper schemaQuery object
     * and columns map from a JSON object.
     *
     * @param queryInfoJson
     */
    static fromJSON(queryInfoJson: any) : QueryInfo {
        let schemaQuery: SchemaQuery;

        if (queryInfoJson.schemaName && queryInfoJson.name) {
            schemaQuery = SchemaQuery.create(queryInfoJson.schemaName, queryInfoJson.name);
        }
        let columns = OrderedMap<string, QueryColumn>();
        Object.keys(queryInfoJson.columns).forEach((columnKey) => {
            let rawColumn = queryInfoJson.columns[columnKey];
            columns = columns.set(rawColumn.fieldKey.toLowerCase(), QueryColumn.create(rawColumn))
        });

        return QueryInfo.create(Object.assign({}, queryInfoJson, {
            columns,
            schemaQuery
        }))
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    isAppEditable(): boolean {
        return this.appEditableTable && this.getPkCols().size > 0;
    }

    getColumn(fieldKey: string): QueryColumn {
        if (fieldKey) {
            return this.columns.get(fieldKey.toLowerCase());
        }

        return undefined;
    }

    isRequiredColumn(fieldKey: string): boolean {
        const column = this.getColumn(fieldKey);
        return column ? column.required : false;
    }

    getDisplayColumns(view?: string): List<QueryColumn> {

        if (!view) {
            view = ViewInfo.DEFAULT_NAME;
        }

        let viewInfo = this.getView(view);
        if (viewInfo) {
            return viewInfo.columns
                .reduce((list, col) => {
                    let c = this.getColumn(col.fieldKey);

                    if (c !== undefined) {
                        if (col.title !== undefined) {
                            c = c.merge({
                                caption: col.title,
                                shortCaption: col.title
                            }) as QueryColumn;
                        }

                        return list.push(c);
                    }

                    console.warn(`Unable to resolve column '${col.fieldKey}' on view '${viewInfo.name}' (${this.schemaName}.${this.name})`);
                    return list;
                }, List<QueryColumn>());
        }

        console.warn('Unable to find columns on view:', view, '(' + this.schemaName + '.' + this.name + ')');
        return List<QueryColumn>();
    }

    getInsertColumns(): List<QueryColumn> {
        // CONSIDER: use the columns in ~~INSERT~~ view to determine this set
        return this.columns
            .filter(insertColumnFilter)
            .toList();
    }

    getUpdateColumns(readOnlyColumns?: List<string>): List<QueryColumn> {

        return this.columns
            .filter((column) => {
                return updateColumnFilter(column) || (readOnlyColumns && readOnlyColumns.indexOf(column.fieldKey) > -1);
            })
            .map((column) => {
                if (readOnlyColumns && readOnlyColumns.indexOf(column.fieldKey) > -1) {
                    return column.set('readOnly', true) as QueryColumn;
                }
                else {
                    return column;
                }
            })
            .toList();
    }

    getFilters(view?: string): List<Filter.IFilter> {
        if (view) {
            let viewInfo = this.getView(view);

            if (viewInfo) {
                return viewInfo.filters;
            }

            console.warn('Unable to find view:', view, '(' + this.schemaName + '.' + this.name + ')');
        }

        return List<Filter.IFilter>();
    }

    getPkCols(): List<QueryColumn> {
        return this.pkCols.reduce((list, pkFieldKey) => {
            const pkCol = this.getColumn(pkFieldKey);

            if (pkCol) {
                return list.push(pkCol);
            }

            console.warn(`Unable to resolve pkCol '${pkFieldKey}' on (${this.schemaName}.${this.name})`);
            return list;
        }, List<QueryColumn>());
    }

    getSorts(view?: string): List<QuerySort> {
        if (view) {
            let viewInfo = this.getView(view);

            if (viewInfo) {
                return viewInfo.sorts;
            }

            console.warn('Unable to find view:', view, '(' + this.schemaName + '.' + this.name + ')');
        }

        return List<QuerySort>();
    }

    getView(view: string): ViewInfo {
        const _view = view.toLowerCase();

        // see if there is a specific detail view override
        if (_view === ViewInfo.DETAIL_NAME.toLowerCase()) {
            const details = this.views.get(ViewInfo.BIO_DETAIL_NAME.toLowerCase());

            if (details) {
                return details;
            }
        }

        return this.views.get(_view);
    }

    /**
     * Insert a set of columns into this queryInfo's columns at a designated index.  If the given column index
     * is outside the range of the existing columns, this queryInfo's columns will be returned.  An index that is equal to the
     * current number of columns will cause the given queryColumns to be appended to the existing ones.
     * @param colIndex the index at which the new columns should start
     * @param queryColumns the (ordered) set of columns
     * @returns a new set of columns when the given columns inserted
     */
    insertColumns(colIndex: number, queryColumns: OrderedMap<string, QueryColumn>) : OrderedMap<string, QueryColumn> {
        if (colIndex < 0 || colIndex > this.columns.size)
            return this.columns;

        // put them at the end
        if (colIndex === this.columns.size)
            return this.columns.merge(queryColumns);

        let columns = OrderedMap<string, QueryColumn>();
        let index = 0;

        this.columns.forEach((column, key) => {
            if (index === colIndex) {
                columns = columns.merge(queryColumns);
                index = index + queryColumns.size;
            }
            columns = columns.set(key, column);
            index++;
        });
        return columns;
    }
}

export class QuerySort extends Record({
    dir: '',
    fieldKey: undefined
}) {
    dir: string;
    fieldKey: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

export class SchemaDetails extends Record({
    description: undefined,
    fullyQualifiedName: undefined,
    hidden: true,
    schemaName: undefined,
    schemas: List<string>()
}) {
    description: string;
    fullyQualifiedName: string;
    hidden: boolean;
    schemaName: string;
    schemas: List<string>;

    static create(schema): SchemaDetails {
        let copy = Object.assign({}, schema);
        let schemas = List<string>().asMutable();

        if (schema.schemas) {
            for (let s in schema.schemas) {
                if (schema.schemas.hasOwnProperty(s)) {
                    schemas.push(schema.schemas[s].fullyQualifiedName.toLowerCase());
                }
            }
        }

        copy.schemas = schemas.asImmutable();
        return new SchemaDetails(copy);
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    getLabel() {
        return this.schemaName;
    }

    getName() {
        return this.fullyQualifiedName;
    }
}

interface IViewInfoColumn {
    fieldKey: string
    key: string
    name: string
    title?: string
}

// commented out attributes are not used in app
export class ViewInfo extends Record({
    // aggregates: List(),
    // analyticsProviders: List(),
    columns: List<IViewInfoColumn>(),
    // deletable: false,
    // editable: false,
    filters: List<Filter.IFilter>(),
    hidden: false,
    // inherit: false,
    isDefault: false,
    label: undefined,
    name: undefined,
    // revertable: false,
    // savable: false,
    // session: false,
    shared: false,
    sorts: List<QuerySort>()
}) {
    // aggregates: List<any>;
    // analyticsProviders: List<any>;
    columns: List<IViewInfoColumn>;
    // deletable: boolean;
    // editable: boolean;
    filters: List<Filter.IFilter>;
    hidden: boolean;
    // inherit: boolean;
    isDefault: boolean; // 'default' is a JavaScript keyword
    label: string;
    name: string;
    // revertable: boolean;
    // savable: boolean;
    // session: boolean;
    shared: boolean;
    sorts: List<QuerySort>;

    static DEFAULT_NAME = '~~DEFAULT~~';
    static DETAIL_NAME = '~~DETAILS~~';
    // TODO seems like this should not be in the generic model, but we'll need a good way
    //  to define the override detail name.
    static BIO_DETAIL_NAME = 'BiologicsDetails';

    static create(rawViewInfo): ViewInfo {

        // prepare name and isDefault
        let label = rawViewInfo.label;
        let name = '';
        let isDefault = rawViewInfo['default'] === true;
        if (isDefault) {
            name = ViewInfo.DEFAULT_NAME;
            label = 'Default';
        }
        else {
            name = rawViewInfo.name;
        }

        return new ViewInfo(Object.assign({}, rawViewInfo, {
            columns: List<IViewInfoColumn>(rawViewInfo.columns),
            filters: getFiltersFromView(rawViewInfo),
            isDefault,
            label,
            name,
            sorts: getSortsFromView(rawViewInfo)
        }))
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

export class LastActionStatus extends Record({
    type: undefined,
    date: undefined,
    level: MessageLevel.info,
    message: undefined
}) {
    type: string;
    date: Date;
    level: MessageLevel;
    message: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

function getFiltersFromView(rawViewInfo): List<Filter.IFilter> {
    let filters = List<Filter.IFilter>().asMutable();

    // notice, in the raw version it is raw.filter (no s)
    if (rawViewInfo && rawViewInfo.filter) {
        const rawFilters: Array<{
            fieldKey: string
            value: any
            op: string
        }> = rawViewInfo.filter;

        for (let i=0; i < rawFilters.length; i++) {
            let filter = rawFilters[i];
            filters.push(Filter.create(filter.fieldKey, filter.value, Filter.getFilterTypeForURLSuffix(filter.op)));
        }
    }

    return filters.asImmutable();
}

function getSortsFromView(rawViewInfo): List<QuerySort> {

    if (rawViewInfo && rawViewInfo.sort && rawViewInfo.sort.length > 0) {
        let sorts = List<QuerySort>().asMutable();
        rawViewInfo.sort.forEach(sort => {
            sorts.push(new QuerySort(sort));
        });
        return sorts.asImmutable();
    }

    return List<QuerySort>();
}

export function insertColumnFilter(col: QueryColumn): boolean {
    return (
        col &&
        col.removeFromViews !== true &&
        col.shownInInsertView === true &&
        col.userEditable === true &&
        col.fieldKeyArray.length === 1
    );
}

export function updateColumnFilter(col: QueryColumn): boolean {
    return (
        col &&
        col.removeFromViews !== true &&
        col.shownInUpdateView === true &&
        col.userEditable === true &&
        col.fieldKeyArray.length === 1
    );
}

export class AssayProtocolModel extends Record({
    allowTransformationScript: false,
    autoCopyTargetContainer: undefined,
    availableDetectionMethods: undefined,
    availableMetadataInputFormats: undefined,
    availablePlateTemplates: undefined,
    backgroundUpload: false,
    description: undefined,
    // domains: undefined,
    editableResults: false,
    editableRuns: false,
    metadataInputFormatHelp: undefined,
    moduleTransformScripts: undefined,
    name: undefined,
    protocolId: undefined,
    protocolParameters: undefined,
    protocolTransformScripts: undefined,
    providerName: undefined,
    saveScriptFiles: false,
    selectedDetectionMethod: undefined,
    selectedMetadataInputFormat: undefined,
    selectedPlateTemplate: undefined,
    qcEnabled: undefined
}) {
    allowTransformationScript: boolean;
    autoCopyTargetContainer: string;
    availableDetectionMethods: any;
    availableMetadataInputFormats: any;
    availablePlateTemplates: any;
    backgroundUpload: boolean;
    description: string;
    // domains: any;
    editableResults: boolean;
    editableRuns: boolean;
    metadataInputFormatHelp: any;
    moduleTransformScripts: Array<any>;
    name: string;
    protocolId: number;
    protocolParameters: any;
    protocolTransformScripts: any;
    providerName: string;
    saveScriptFiles: boolean;
    selectedDetectionMethod: any;
    selectedMetadataInputFormat: any;
    selectedPlateTemplate: any;
    qcEnabled: boolean;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}

export enum AssayDomainTypes {
    BATCH = 'Batch',
    RUN = 'Run',
    RESULT = 'Result',
}

export enum AssayLink {
    BATCHES = 'batches',
    BEGIN = 'begin',
    DESIGN_COPY = 'designCopy',
    DESIGN_EDIT = 'designEdit',
    IMPORT = 'import',
    RESULT = 'result',
    RESULTS = 'results',
    RUNS = 'runs'
}

interface ScopedSampleColumn {
    domain: AssayDomainTypes;
    column: QueryColumn;
}

export const enum AssayUploadTabs {
    Files = 1,
    Copy = 2,
    Grid = 3
}

export class AssayDefinitionModel extends Record({
    containerPath: undefined,
    description: undefined,
    domains: Map<string, List<QueryColumn>>(),
    domainTypes: Map<string, string>(),
    id: undefined,
    importAction: undefined,
    importController: undefined,
    links: Map<AssayLink, string>(),
    name: undefined,
    projectLevel: undefined,
    protocolSchemaName: undefined,
    templateLink: undefined,
    type: undefined
}) {
    containerPath: string;
    description: string;
    domains: Map<string, List<QueryColumn>>;
    domainTypes: Map<string, string>;
    id: number;
    importAction: string;
    importController: string;
    links: Map<AssayLink, string>;
    name: string;
    projectLevel: boolean;
    protocolSchemaName: string;
    templateLink: string;
    type: string;

    static create(rawModel): AssayDefinitionModel {
        let domains = Map<string, List<QueryColumn>>();
        let domainTypes = Map<string, string>();
        let links = Map<AssayLink, string>();

        if (rawModel) {
            if (rawModel.domainTypes) {
                domainTypes = fromJS(rawModel.domainTypes);
            }

            if (rawModel.domains) {
                const rawDomains = Object.keys(rawModel.domains).reduce((result, k) => {
                    result[k] = List<QueryColumn>(rawModel.domains[k].map(rawColumn => QueryColumn.create(rawColumn)));
                    return result;
                }, {});
                domains = Map<string, List<QueryColumn>>(rawDomains);
            }

            if (rawModel.links) {
                links = fromJS(rawModel.links);
            }
        }

        return new AssayDefinitionModel({
            ...rawModel,
            domains,
            domainTypes,
            links,
            protocolSchemaName: decodePart(rawModel.protocolSchemaName),
        });
    }

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    getDomainByType(domainType: AssayDomainTypes): List<QueryColumn> {
        if (this.domainTypes.has(domainType)) {
            return this.domains.get(this.domainTypes.get(domainType));
        }

        return undefined;
    }

    getImportUrl(dataTab?: AssayUploadTabs, selectionKey?: string) {
        let url;
        // Note, will need to handle the re-import run case separately. Possibly introduce another URL via links
        if (this.name !== undefined && this.importAction === 'uploadWizard' && this.importController === 'assay') {
            url = AppURL.create('assays', this.type, this.name, 'upload').addParam('rowId', this.id);
            if (dataTab)
                url = url.addParam('dataTab', dataTab);
            if (selectionKey)
                url = url.addParam('selectionKey', selectionKey);
            url = url.toHref();
        }
        else {
            url = this.links.get(AssayLink.IMPORT)
        }
        return url;
    }

    getRunsUrl() {
        return AppURL.create('assays', this.type, this.name, 'runs');
    }

    hasLookup(targetSQ: SchemaQuery): boolean {
        const isSampleSet = targetSQ.hasSchema('samples');
        const findLookup = (col) => {
            if (col.isLookup()) {
                const lookupSQ = SchemaQuery.create(col.lookup.schemaName, col.lookup.queryName);
                const isMatch = targetSQ.isEqual(lookupSQ);

                // 35881: If targetSQ is a Sample Set then allow targeting exp.materials table as well
                if (isSampleSet) {
                    return isMatch || SchemaQuery.create('exp', 'Materials').isEqual(lookupSQ);
                }

                return isMatch;
            }

            return false;
        };

        // Traditional for loop so we can short circuit.
        for (const k of Object.keys(AssayDomainTypes)) {
            const domainType = AssayDomainTypes[k];
            const domainColumns = this.getDomainByType(domainType);

            if (domainColumns && domainColumns.find(findLookup)) {
                return true;
            }
        }

        return false;
    }

    private getSampleColumnByDomain(domainType: AssayDomainTypes): QueryColumn {
        const columns = this.getDomainByType(domainType);

        if (columns) {
            return columns.find(c => isSampleLookup(c));
        }

        return null;
    }

    /**
     * get all sample lookup columns found in the result, run, and batch domains.
     */
    getSampleColumns(): List<ScopedSampleColumn> {
        let ret = [];
        // The order matters here, we care about result, run, and batch in that order.
        for (const domain of [AssayDomainTypes.RESULT, AssayDomainTypes.RUN, AssayDomainTypes.BATCH]) {
            const column = this.getSampleColumnByDomain(domain);

            if (column) {
                ret.push({column, domain});
            }
        }

        return List(ret);
    }

    /**
     * get the first sample lookup column found in the result, run, or batch domain.
     */
    getSampleColumn(): ScopedSampleColumn {
        const sampleColumns = this.getSampleColumns();
        return !sampleColumns.isEmpty() ? sampleColumns.first() : null;
    }

    /**
     * returns the FieldKey string of the sample column relative from the assay Results table.
     */
    sampleColumnFieldKey(sampleCol: ScopedSampleColumn): string {
        if (sampleCol.domain == AssayDomainTypes.RESULT) {
            return sampleCol.column.fieldKey;
        } else if (sampleCol.domain == AssayDomainTypes.RUN) {
            return `Run/${sampleCol.column.fieldKey}`;
        } else if (sampleCol.domain == AssayDomainTypes.BATCH) {
            return `Run/Batch/${sampleCol.column.fieldKey}`;
        }
        throw new Error("Unexpected assay domain type: " + sampleCol.domain);
    }

    /**
     * returns the FieldKey string of the sample columns relative from the assay Results table.
     */
    getSampleColumnFieldKeys(): List<string> {
        const sampleCols = this.getSampleColumns();
        return List(sampleCols.map(this.sampleColumnFieldKey));
    }

    createSampleFilter(sampleColumns: List<string>, value, singleFilter: Filter.IFilterType, whereClausePart: (fieldKey, value) => string) {
        if (sampleColumns.size == 1) {
            // generate simple equals filter
            let sampleColumn = sampleColumns.get(0);
            return Filter.create(`${sampleColumn}/RowId`, value, singleFilter);
        } else {
            // generate an OR filter to include all sample columns
            let whereClause = '(' + sampleColumns.map(sampleCol => {
                let fieldKey = (sampleCol + '/RowId').replace(/\//g, '.');
                return whereClausePart(fieldKey, value);
            }).join(' OR ') + ')';
            return Filter.create('*', whereClause, WHERE_FILTER_TYPE);
        }
    }

    getDomainColumns(type: AssayDomainTypes): OrderedMap<string, QueryColumn> {
        let columns = OrderedMap<string, QueryColumn>();

        if (this.domains && this.domains.size) {
            const domainColumns = this.getDomainByType(type);

            if (domainColumns && domainColumns.size) {
                domainColumns.forEach(dc => {
                    columns = columns.set(dc.fieldKey.toLowerCase(), dc);
                });
            }
        }

        return columns;
    }
}

export function isSampleLookup(column: QueryColumn) {
    /**
     * 35881: Ensure that a column is a valid lookup to one of the following
     * - exp.Materials
     * - samples.* (any sample set)
     */

    if (!column.isLookup()) {
        return false;
    }

    const lookupSQ = SchemaQuery.create(column.lookup.schemaName, column.lookup.queryName);

    return SchemaQuery.create('exp', 'Materials').isEqual(lookupSQ) || lookupSQ.hasSchema('samples');
}

export class InferDomainResponse extends Record({
    data: List<any>(),
    fields: List<QueryColumn>()
}) {
    data: List<any>;
    fields: List<QueryColumn>;

    static create(rawModel): InferDomainResponse {
        let data = List<any>();
        let fields = List<QueryColumn>();

        if (rawModel) {
            if (rawModel.data) {
                data = fromJS(rawModel.data);
            }

            if (rawModel.fields) {
                fields = rawModel.fields.map((field) => QueryColumn.create(field));
            }
        }

        return new InferDomainResponse({
            data,
            fields
        });
    }
}