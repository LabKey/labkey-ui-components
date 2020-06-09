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
import { fromJS, List, Map, OrderedMap, OrderedSet, Record } from 'immutable';
import {
    ActionURL,
    Container as IContainer,
    Filter,
    PermissionTypes,
    Query,
    UserWithPermissions,
    Utils,
} from '@labkey/api';

import {
    getSchemaQuery,
    hasAllPermissions,
    intersect,
    resolveKey,
    resolveSchemaQuery,
    toLowerSafe,
} from '../../../util/utils';
import { AppURL } from '../../../url/AppURL';
import { WHERE_FILTER_TYPE } from '../../../url/WhereFilterType';

import { GRID_CHECKBOX_OPTIONS, GRID_EDIT_INDEX, GRID_SELECTION_INDEX } from './constants';
import { QueryInfo } from './QueryInfo';
import { QuerySort } from './QuerySort';

const emptyList = List<string>();
const emptyColumns = List<QueryColumn>();
const emptyRow = Map<string, any>();

export enum QueryInfoStatus {
    ok,
    notFound,
    unknown,
}
export enum MessageLevel {
    info,
    warning,
    error,
}

const defaultContainer: Partial<IContainer> = {
    activeModules: [],
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
    type: '',
};

/**
 * Model for org.labkey.api.data.Container as returned by Container.toJSON()
 */
export class Container extends Record(defaultContainer) implements Partial<IContainer> {
    activeModules: string[];
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

    constructor(values?: { [key: string]: any }) {
        super(values);
    }
}

interface IUserProps extends Partial<UserWithPermissions> {
    permissionsList: List<string>;
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

    permissionsList: List(),
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

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    hasUpdatePermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.Update]);
    }

    hasInsertPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.Insert]);
    }

    hasDeletePermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.Delete]);
    }

    hasDesignAssaysPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.DesignAssay]);
    }

    hasDesignSampleSetsPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.DesignSampleSet]);
    }

    hasManageUsersPermission(): boolean {
        return hasAllPermissions(this, [PermissionTypes.UserManagement], false);
    }

    isAppAdmin(): boolean {
        return hasAllPermissions(this, [PermissionTypes.ApplicationAdmin], false);
    }
}

export interface IParsedSelectionKey {
    keys: string;
    schemaQuery: SchemaQuery;
}

const APP_SELECTION_PREFIX = 'appkey';

export class SchemaQuery extends Record({
    schemaName: undefined,
    queryName: undefined,
    viewName: undefined,
}) {
    static create(schemaName: string, queryName: string, viewName?: string): SchemaQuery {
        return new SchemaQuery({ schemaName, queryName, viewName });
    }

    schemaName: string;
    queryName: string;
    viewName: string;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    // TODO: remove unnecessary function, Records are Immutable and/or this can be a getter function.
    getSchema() {
        return this.schemaName;
    }

    // TODO: remove unnecessary function, Records are Immutable and/or this can be a getter function.
    getQuery() {
        return this.queryName;
    }

    // TODO: remove unnecessary function, Records are Immutable and/or this can be a getter function.
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
        const [appkey /* not used */, schemaQueryKey, keys] = selectionKey.split('|');

        return {
            keys,
            schemaQuery: getSchemaQuery(schemaQueryKey),
        };
    }

    static createAppSelectionKey(targetSQ: SchemaQuery, keys: any[]): string {
        return [APP_SELECTION_PREFIX, resolveSchemaQuery(targetSQ), keys.join(';')].join('|');
    }
}

// Consider having this implement Query.QueryColumn from @labkey/api
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
    protected: undefined,
    rangeURI: undefined,
    readOnly: undefined,
    // recommendedVariable: undefined,
    required: undefined,
    // selectable: undefined,
    shortCaption: undefined,
    addToDisplayView: undefined,
    shownInDetailsView: undefined,
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
    units: undefined,
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
    fieldKeyArray: string[];
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
    addToDisplayView: boolean;
    shownInDetailsView: boolean;
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
            return new QueryColumn(
                Object.assign({}, rawColumn, {
                    lookup: new QueryLookup(rawColumn.lookup),
                })
            );
        }

        return new QueryColumn(rawColumn);
    }

    static DATA_INPUTS = 'DataInputs';
    static MATERIAL_INPUTS = 'MaterialInputs';

    constructor(values?: { [key: string]: any }) {
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

    // Issue 39911: a public lookup indicates that it is available in the user schema (i.e. can be seen in the schema browser)
    isPublicLookup(): boolean {
        return this.isLookup() && this.lookup.isPublic;
    }

    isSampleLookup(): boolean {
        /**
         * 35881: Ensure that a column is a valid lookup to one of the following
         * - exp.Materials
         * - samples.* (any sample set)
         */

        if (!this.isLookup()) {
            return false;
        }

        const lookupSQ = SchemaQuery.create(this.lookup.schemaName, this.lookup.queryName);

        return MATERIALS_SQ.isEqual(lookupSQ) || lookupSQ.hasSchema('samples');
    }

    isMaterialInput(): boolean {
        return this.name && this.name.toLowerCase().indexOf(QueryColumn.MATERIAL_INPUTS.toLowerCase()) !== -1;
    }

    get isDetailColumn(): boolean {
        return !this.removeFromViews && this.shownInDetailsView === true;
    }

    get isUpdateColumn(): boolean {
        return (
            this.removeFromViews !== true &&
            this.shownInUpdateView === true &&
            this.userEditable === true &&
            this.fieldKeyArray.length === 1
        );
    }

    resolveFieldKey(): string {
        let fieldKey: string;

        if (this.isLookup()) {
            fieldKey = [this.name, this.lookup.displayColumn.replace(/\//g, '$S')].join('/');
        } else {
            fieldKey = this.name;
        }

        return fieldKey;
    }
}

// MATERIALS_SQ defined here to prevent compiler error "Class 'SchemaQuery' used before its declaration"
const MATERIALS_SQ = SchemaQuery.create('exp', 'Materials');

export class QueryLookup extends Record({
    // server defaults
    displayColumn: undefined,
    isPublic: false,
    keyColumn: undefined,
    junctionLookup: undefined,
    multiValued: undefined,
    queryName: undefined,
    schemaName: undefined,
    table: undefined,
}) {
    displayColumn: string;
    isPublic: boolean;
    junctionLookup: string; // name of the column on the junction table that is also a lookup
    keyColumn: string;
    multiValued: string; // can be "junction", "value" or undefined. Server only support "junction" at this time
    // public: boolean; -- NOT ALLOWING DUE TO KEYWORD -- USE isPublic
    queryName: string;
    // schema: string; -- NOT ALLOWING -- USE schemaName
    schemaName: string;
    // table: string; -- NOT ALLOWING -- USE queryName

    constructor(values?: { [key: string]: any }) {
        super(values);
    }
}

export interface IQueryGridModel {
    id?: string;
    schema?: string;
    query?: string;
    allowSelection?: boolean;
    baseFilters?: List<Filter.IFilter>;
    bindURL?: boolean;
    containerPath?: string;
    containerFilter?: Query.ContainerFilter;
    data?: Map<any, Map<string, any>>;
    dataIds?: List<any>;
    displayColumns?: List<string>;
    editable?: boolean;
    editing?: boolean;
    filterArray?: List<Filter.IFilter>;
    includeDetailsColumn?: boolean;
    includeUpdateColumn?: boolean;
    isError?: boolean;
    isLoaded?: boolean;
    isLoading?: boolean;
    isPaged?: boolean;
    keyValue?: any;
    loader?: IGridLoader;
    maxRows?: number;
    message?: string;
    messages?: List<Map<string, string>>;
    offset?: number;
    omittedColumns?: List<string>;
    pageNumber?: number;
    queryInfo?: QueryInfo;
    queryParameters?: any;
    requiredColumns?: List<string>;
    showSearchBox?: boolean;
    showViewSelector?: boolean;
    hideEmptyViewSelector?: boolean;
    showChartSelector?: boolean;
    showExport?: boolean;
    hideEmptyChartSelector?: boolean;
    sortable?: boolean;
    sorts?: string;
    selectedIds?: List<string>;
    selectedLoaded?: boolean;
    selectedState?: GRID_CHECKBOX_OPTIONS;
    selectedQuantity?: number;
    title?: string;
    totalRows?: number;
    urlParams?: List<string>;
    urlParamValues?: Map<string, any>;
    urlPrefix?: string;
    view?: string;
}

export interface IGridLoader {
    fetch: (model: QueryGridModel) => Promise<IGridResponse>;
    fetchSelection?: (model: QueryGridModel) => Promise<IGridSelectionResponse>;
}

export interface IGridResponse {
    data: Map<any, any>;
    dataIds: List<any>;
    totalRows?: number;
    messages?: List<Map<string, string>>;
}

export interface IGridSelectionResponse {
    selectedIds: List<any>;
}

export class QueryGridModel
    extends Record({
        id: undefined,
        schema: undefined,
        query: undefined,
        queryParameters: undefined, // These are the parameters used as input to a parameterized query

        allowSelection: true,
        baseFilters: List<Filter.IFilter>(),
        bindURL: true,
        containerPath: undefined,
        containerFilter: undefined,
        data: Map<any, Map<string, any>>(),
        dataIds: List<any>(),
        displayColumns: undefined,
        editable: false,
        editing: false,
        filterArray: List<Filter.IFilter>(),
        includeDetailsColumn: false,
        includeUpdateColumn: false,
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
        hideEmptyViewSelector: false,
        showChartSelector: true,
        showExport: true,
        hideEmptyChartSelector: false,
        sortable: true,
        sorts: undefined,
        title: undefined,
        totalRows: 0,
        urlParams: List<string>(['p', 'reportId']), // page number and reportId parameters
        urlParamValues: Map<string, any>(),
        urlPrefix: undefined, // TODO we should give each new model a default prefix?
        view: undefined,
    })
    implements IQueryGridModel {
    id: string;
    schema: string;
    query: string;
    queryParameters: any; // an object mapping parameter names to values such as {'MinTemp': '36', 'MinWeight': '90'}
    allowSelection: boolean;
    baseFilters: List<Filter.IFilter>;
    bindURL: boolean;
    containerPath?: string;
    containerFilter?: Query.ContainerFilter;
    data: Map<any, Map<string, any>>;
    dataIds: List<any>;
    displayColumns: List<string>;
    editable: boolean;
    editing: boolean;
    filterArray: List<Filter.IFilter>;
    includeDetailsColumn?: boolean;
    includeUpdateColumn?: boolean;
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
    hideEmptyViewSelector: boolean;
    showChartSelector: boolean;
    showExport: boolean;
    hideEmptyChartSelector: boolean;
    sortable: boolean;
    sorts: string;
    selectedIds: List<string>; // should be the set of ids selected for the current view, whether filtered or not
    selectedLoaded: boolean;
    selectedState: GRID_CHECKBOX_OPTIONS;
    selectedQuantity: number; // should be the quantity in the current view, whether filtered or not
    title: string;
    totalRows: number;
    urlParams: List<string>;
    urlParamValues: Map<string, any>;
    urlPrefix: string;
    view: string;

    static EMPTY_SELECTION = {
        selectedQuantity: 0,
        selectedIds: emptyList,
        selectedState: GRID_CHECKBOX_OPTIONS.NONE,
    };

    constructor(values?: IQueryGridModel) {
        super(values);

        if (LABKEY.devMode) {
            // ensure that requiredColumns and omittedColumns do not intersect
            const i = intersect(this.requiredColumns, this.omittedColumns);
            if (i.size > 0) {
                console.log('Intersection', i.toJS());
                throw new Error(
                    'Required and omitted columns cannot intersect. Model id: "' +
                        this.id +
                        '". See console for colliding columns.'
                );
            }
        }
    }

    canImport() {
        // TODO: Remove this. It Looks to be unused in this repo and consuming applications.
        return this.showImportDataButton().get('canImport');
    }

    createParam(param: string, useDefault?: string): string {
        return this.urlPrefix ? [this.urlPrefix, param].join('.') : useDefault ? [useDefault, param].join('.') : param;
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
        return this.queryInfo?.getDisplayColumns(this.view, this.omittedColumns) || emptyColumns;
    }

    /**
     * Returns the set of display columns for details view for this QueryGridModel based on its configuration.
     * @returns {List<QueryColumn>}
     */
    getDetailsDisplayColumns(): List<QueryColumn> {
        return this.queryInfo?.getDetailDisplayColumns(ViewInfo.DETAIL_NAME, this.omittedColumns) || emptyColumns;
    }

    /**
     * Returns the set of display columns for update view for this QueryGridModel based on its configuration.
     * @returns {List<QueryColumn>}
     */
    getUpdateDisplayColumns(): List<QueryColumn> {
        return this.queryInfo?.getUpdateDisplayColumns(ViewInfo.UPDATE_NAME, this.omittedColumns) || emptyColumns;
    }

    getColumnIndex(fieldKey: string): number {
        if (!fieldKey) return -1;

        const lcFieldKey = fieldKey.toLowerCase();
        return this.queryInfo.columns.keySeq().findIndex(column => column.toLowerCase() === lcFieldKey);
    }

    getAllColumns(): List<QueryColumn> {
        return this.queryInfo?.getAllColumns(this.view, this.omittedColumns) || emptyColumns;
    }

    getData(): List<any> {
        return this.dataIds
            .map(i => {
                if (this.allowSelection) {
                    const isChecked = this.selectedIds.indexOf(i) !== -1;
                    if (isChecked) {
                        // only set if row is currently checked, otherwise defaults to false
                        return this.data.get(i).merge({
                            [GRID_SELECTION_INDEX]: isChecked,
                        });
                    }
                }

                return this.data.get(i);
            })
            .toList();
    }

    /**
     * @returns the data for the current page that has been selected.
     */
    getSelectedData(): Map<any, Map<string, any>> {
        let dataMap = Map<any, Map<string, any>>();
        this.selectedIds.forEach(id => {
            if (this.data.has(id)) {
                dataMap = dataMap.set(id, this.data.get(id));
            }
        });
        return dataMap;
    }

    getPkData(id): any {
        const data = {};
        const queryData = this.data.get(id);
        this.queryInfo.getPkCols().forEach(pkCol => {
            const pkVal = queryData.getIn([pkCol.fieldKey]);

            if (pkVal !== undefined && pkVal !== null) {
                // when backing an editable grid, the data is a simple value, but when
                // backing a grid, it is a Map, which has type 'object'.
                data[pkCol.fieldKey] = typeof pkVal === 'object' ? pkVal.get('value') : pkVal;
            } else {
                console.warn('Unable to find value for pkCol "' + pkCol.fieldKey + '"');
            }
        });
        return data;
    }

    getSelectedDataWithKeys(data: any): any[] {
        let rows = [];
        if (!Utils.isEmptyObj(data)) {
            // walk though all the selected rows and construct an update row for each
            // using the primary keys from the original data
            rows = this.selectedIds
                .map(id => {
                    return { ...this.getPkData(id), ...data };
                })
                .toArray();
        }
        return rows;
    }

    getExportColumnsString(): string {
        // does not include required columns -- app only
        return this.getDisplayColumns()
            .map(c => c.fieldKey)
            .join(',');
    }

    isFiltered(): boolean {
        return !this.getFilters().isEmpty();
    }

    // Issue 39765: When viewing details for assays, we need to apply an "is not blank" filter on the "Replaced" column in order to
    // see replaced assay runs.  So this is the one case (we know of) where we want to apply base filters when viewing details since
    // the default view restricts the set of items found.
    // Applying other base filters will be problematic (Issue 39719) in that they could possibly exclude the row you are trying
    // to get details for.
    getDetailFilters(): List<Filter.IFilter> {
        return this.baseFilters
            ? this.baseFilters.filter(filter => filter.getColumnName().toLowerCase() === 'replaced').toList()
            : List<Filter.IFilter>();
    }

    getFilters(): List<Filter.IFilter> {
        const baseFilters = this.baseFilters || List<Filter.IFilter>();
        const filterArray = this.filterArray || List<Filter.IFilter>();
        let filterList = List<Filter.IFilter>();

        if (this.queryInfo) {
            if (this.keyValue !== undefined) {
                if (this.queryInfo.pkCols.size === 1) {
                    filterList = filterList.push(Filter.create(this.queryInfo.pkCols.first(), this.keyValue));
                } else {
                    console.warn(
                        'Too many keys. Unable to filter for specific keyValue.',
                        this.queryInfo.pkCols.toJS()
                    );
                }

                return filterList.concat(this.getDetailFilters()).toList();
            }
            return filterList
                .concat(baseFilters.concat(this.queryInfo.getFilters(this.view)).concat(filterArray))
                .toList();
        }

        return baseFilters.concat(filterArray).toList();
    }

    getId(): string {
        return this.id;
    }

    getInsertColumnIndex(fieldKey): number {
        if (!fieldKey) return -1;

        const lcFieldKey = fieldKey.toLowerCase();
        return this.getInsertColumns().findIndex(column => column.fieldKey.toLowerCase() === lcFieldKey);
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
        const max = this.pageNumber > 1 ? this.pageNumber * this.maxRows : this.maxRows;

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
            const sorts = this.queryInfo.getSorts(this.view);

            if (sorts.size > 0) {
                // user sorts are respected over built-in view sorts
                const allSorts = OrderedSet<string>(this.sorts ? this.sorts.split(',') : []).asMutable();
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
        if (!column || dataId === null || dataId === undefined) {
            return undefined;
        }

        const col: QueryColumn = typeof column === 'string' ? this.getColumn(column) : column;

        // assumes QueryColumn fieldKey casing is same as data fieldKey casing
        return this.data.getIn([dataId, col.fieldKey, part ? part : 'value']);
    }

    showImportDataButton(): Map<any, any> {
        // TODO: Make this just return the canInsert boolean. The only usages of this in Biologics/SampleManager only
        //  use the boolean and not the url.
        const query = this.queryInfo;

        if (query) {
            return Map({
                canImport: query.showInsertNewButton && query.importUrl && !query.importUrlDisabled,
                importUrl: query.importUrl,
            });
        }

        return Map({
            canImport: false,
            importUrl: undefined,
        });
    }

    showInsertNewButton(): Map<any, any> {
        // TODO: Make this just return the canInsert boolean. The only usages of this in Biologics/SampleManager only
        //  use the boolean and not the url.
        const query = this.queryInfo;

        if (query) {
            return Map({
                canInsert: query.showInsertNewButton && query.insertUrl && !query.insertUrlDisabled,
                insertUrl: query.insertUrl,
            });
        }
        return Map({
            canInsert: false,
            insertUrl: false,
        });
    }

    getDataEdit(): List<Map<string, any>> {
        return this.dataIds
            .map(i => {
                if (this.data.has(i)) {
                    return this.data.get(i).merge({
                        [GRID_EDIT_INDEX]: i,
                    });
                }

                return Map<string, any>({
                    [GRID_EDIT_INDEX]: i,
                });
            })
            .toList();
    }

    getRowIdsList(useSelectedIds: boolean): List<Map<string, any>> {
        // TODO: remove this method. It looks to only be used by SampleManager in a method called deleteSamples, but
        //  that method looks to be unused.
        let rows = List<Map<string, any>>();
        if (!useSelectedIds) {
            this.getData().forEach(data => {
                rows = rows.push(Map(fromJS({ rowId: data.getIn(['RowId', 'value']) })));
            });
        } else {
            this.selectedIds.forEach(rowId => {
                rows = rows.push(Map(fromJS({ rowId })));
            });
        }

        return rows;
    }

    get selectionKey() {
        if (!this.queryInfo) {
            return undefined;
        }

        if (this.keyValue !== undefined) {
            return SchemaQuery.createAppSelectionKey(this.queryInfo.schemaQuery, [this.keyValue]);
        }

        return this.getId();
    }
}

export class SchemaDetails extends Record({
    description: undefined,
    fullyQualifiedName: undefined,
    hidden: true,
    schemaName: undefined,
    schemas: List<string>(),
}) {
    description: string;
    fullyQualifiedName: string;
    hidden: boolean;
    schemaName: string;
    schemas: List<string>;

    static create(schema): SchemaDetails {
        const copy = Object.assign({}, schema);
        const schemas = List<string>().asMutable();

        if (schema.schemas) {
            for (const s in schema.schemas) {
                if (schema.schemas.hasOwnProperty(s)) {
                    schemas.push(schema.schemas[s].fullyQualifiedName.toLowerCase());
                }
            }
        }

        copy.schemas = schemas.asImmutable();
        return new SchemaDetails(copy);
    }

    constructor(values?: { [key: string]: any }) {
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
    fieldKey: string;
    key: string;
    name: string;
    title?: string;
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
    sorts: List<QuerySort>(),
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
    static UPDATE_NAME = '~~UPDATE~~';
    // TODO seems like this should not be in the generic model, but we'll need a good way
    //  to define the override detail name.
    static BIO_DETAIL_NAME = 'BiologicsDetails';

    static create(rawViewInfo): ViewInfo {
        // prepare name and isDefault
        let label = rawViewInfo.label;
        let name = '';
        const isDefault = rawViewInfo['default'] === true;
        if (isDefault) {
            name = ViewInfo.DEFAULT_NAME;
            label = 'Default';
        } else {
            name = rawViewInfo.name;
        }

        return new ViewInfo(
            Object.assign({}, rawViewInfo, {
                columns: List<IViewInfoColumn>(rawViewInfo.columns),
                filters: getFiltersFromView(rawViewInfo),
                isDefault,
                label,
                name,
                sorts: getSortsFromView(rawViewInfo),
            })
        );
    }

    constructor(values?: { [key: string]: any }) {
        super(values);
    }
}

export class LastActionStatus extends Record({
    type: undefined,
    date: undefined,
    level: MessageLevel.info,
    message: undefined,
}) {
    type: string;
    date: Date;
    level: MessageLevel;
    message: string;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }
}

function getFiltersFromView(rawViewInfo): List<Filter.IFilter> {
    const filters = List<Filter.IFilter>().asMutable();

    // notice, in the raw version it is raw.filter (no s)
    if (rawViewInfo && rawViewInfo.filter) {
        const rawFilters: Array<{
            fieldKey: string;
            value: any;
            op: string;
        }> = rawViewInfo.filter;

        for (let i = 0; i < rawFilters.length; i++) {
            const filter = rawFilters[i];
            filters.push(Filter.create(filter.fieldKey, filter.value, Filter.getFilterTypeForURLSuffix(filter.op)));
        }
    }

    return filters.asImmutable();
}

function getSortsFromView(rawViewInfo): List<QuerySort> {
    if (rawViewInfo && rawViewInfo.sort && rawViewInfo.sort.length > 0) {
        const sorts = List<QuerySort>().asMutable();
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
    RUNS = 'runs',
}

interface ScopedSampleColumn {
    domain: AssayDomainTypes;
    column: QueryColumn;
}

export const enum AssayUploadTabs {
    Files = 1,
    Copy = 2,
    Grid = 3,
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
    reRunSupport: undefined,
    templateLink: undefined,
    type: undefined,
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
    reRunSupport: string;
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
        });
    }

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    getDomainByType(domainType: AssayDomainTypes): List<QueryColumn> {
        if (this.domainTypes.has(domainType)) {
            return this.domains.get(this.domainTypes.get(domainType));
        }

        return undefined;
    }

    getImportUrl(dataTab?: AssayUploadTabs, selectionKey?: string, filterList?: List<Filter.IFilter>) {
        let url;
        // Note, will need to handle the re-import run case separately. Possibly introduce another URL via links
        if (this.name !== undefined && this.importAction === 'uploadWizard' && this.importController === 'assay') {
            url = AppURL.create('assays', this.type, this.name, 'upload').addParam('rowId', this.id);
            if (dataTab) url = url.addParam('dataTab', dataTab);
            if (filterList && !filterList.isEmpty()) {
                filterList.forEach(filter => {
                    // if the filter has a URL suffix and is not registered as one recognized for URL filters, we ignore it here
                    // CONSIDER:  Applications might want to be able to register their own filter types
                    const urlSuffix = filter.getFilterType().getURLSuffix();
                    if (!urlSuffix || Filter.getFilterTypeForURLSuffix(urlSuffix)) {
                        url = url.addParam(filter.getURLParameterName(), filter.getURLParameterValue());
                    }
                });
            }
            if (selectionKey) url = url.addParam('selectionKey', selectionKey);
            url = url.toHref();
        } else {
            url = this.links.get(AssayLink.IMPORT);
        }
        return url;
    }

    getRunsUrl() {
        return AppURL.create('assays', this.type, this.name, 'runs');
    }

    hasLookup(targetSQ: SchemaQuery): boolean {
        const isSampleSet = targetSQ.hasSchema('samples');
        const findLookup = col => {
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

    private getSampleColumnsByDomain(domainType: AssayDomainTypes): ScopedSampleColumn[] {
        const ret = [];
        const columns = this.getDomainByType(domainType);

        if (columns) {
            columns.forEach(column => {
                if (column.isSampleLookup()) {
                    ret.push({ column, domain: domainType });
                }
            });
        }

        return ret;
    }

    /**
     * get all sample lookup columns found in the result, run, and batch domains.
     */
    getSampleColumns(): List<ScopedSampleColumn> {
        let ret = [];
        // The order matters here, we care about result, run, and batch in that order.
        for (const domain of [AssayDomainTypes.RESULT, AssayDomainTypes.RUN, AssayDomainTypes.BATCH]) {
            const columns = this.getSampleColumnsByDomain(domain);

            if (columns && columns.length > 0) {
                ret = ret.concat(columns);
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
        throw new Error('Unexpected assay domain type: ' + sampleCol.domain);
    }

    /**
     * returns the FieldKey string of the sample columns relative from the assay Results table.
     */
    getSampleColumnFieldKeys(): List<string> {
        const sampleCols = this.getSampleColumns();
        return List(sampleCols.map(this.sampleColumnFieldKey));
    }

    createSampleFilter(
        sampleColumns: List<string>,
        value,
        singleFilter: Filter.IFilterType,
        whereClausePart: (fieldKey, value) => string,
        useLsid?: boolean,
        singleFilterValue?: any
    ) {
        const keyCol = useLsid ? '/LSID' : '/RowId';
        if (sampleColumns.size == 1) {
            // generate simple equals filter
            const sampleColumn = sampleColumns.get(0);
            return Filter.create(sampleColumn + keyCol, singleFilterValue ? singleFilterValue : value, singleFilter);
        } else {
            // generate an OR filter to include all sample columns
            const whereClause =
                '(' +
                sampleColumns
                    .map(sampleCol => {
                        const fieldKey = (sampleCol + keyCol).replace(/\//g, '.');
                        return whereClausePart(fieldKey, value);
                    })
                    .join(' OR ') +
                ')';
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

export class InferDomainResponse extends Record({
    data: List<any>(),
    fields: List<QueryColumn>(),
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
                fields = List(rawModel.fields.map(field => QueryColumn.create(field)));
            }
        }

        return new InferDomainResponse({
            data,
            fields,
        });
    }
}
