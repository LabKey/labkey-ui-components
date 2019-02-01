/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, OrderedMap, Record } from 'immutable'
import { Filter } from '@labkey/api'

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

export enum QueryInfoStatus { ok, notFound, unknown }

export function insertColumnFilter(col: QueryColumn): boolean {
    return (
        col &&
        col.removeFromViews !== true &&
        col.shownInInsertView === true &&
        col.userEditable === true &&
        col.fieldKeyArray.length === 1
    );
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

    getFilters(view?: string): List<Filter.Filter> {
        if (view) {
            let viewInfo = this.getView(view);

            if (viewInfo) {
                return viewInfo.filters;
            }

            console.warn('Unable to find view:', view, '(' + this.schemaName + '.' + this.name + ')');
        }

        return List<Filter.Filter>();
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
    filters: List<Filter.Filter>(),
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
    filters: List<Filter.Filter>;
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

function getFiltersFromView(rawViewInfo): List<Filter.Filter> {
    let filters = List<Filter.Filter>().asMutable();

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

export enum MessageLevel { info, warning, error }

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