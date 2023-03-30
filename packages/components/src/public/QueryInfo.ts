// commented out attributes are not used in app
import { List, Record } from 'immutable';

import { Filter } from '@labkey/api';

import { toLowerSafe } from '../internal/util/utils';

import { ViewInfo } from '../internal/ViewInfo';
import { LastActionStatus } from '../internal/LastActionStatus';

import { ExtendedMap } from './ExtendedMap';

import { insertColumnFilter, QueryColumn } from './QueryColumn';
import { SchemaQuery } from './SchemaQuery';
import { QuerySort } from './QuerySort';
import { naturalSortByProperty } from './sort';

export enum QueryInfoStatus {
    ok,
    notFound,
    unknown,
}

export class QueryInfo extends Record({
    altUpdateKeys: undefined,
    disabledSystemFields: undefined,
    // canEdit: false,
    // canEditSharedViews: false,
    columns: new ExtendedMap<string, QueryColumn>(),
    description: undefined,
    domainContainerPath: undefined,
    // editDefinitionUrl: undefined,
    importTemplates: [],
    // indices: Map<string, any>(),
    // isInherited: false,

    iconURL: 'default',
    // isMetadataOverrideable: false,
    // isTemporary: false,
    // isUserDefined: false,
    lastAction: undefined,
    // lastUpdate: undefined,
    name: undefined,
    pkCols: [],
    schemaName: undefined,
    status: QueryInfoStatus.unknown,
    // targetContainers: List<any>(),
    title: undefined, // DEPRECATED: Use queryLabel
    titleColumn: undefined,
    // viewDataUrl: undefined,
    views: new ExtendedMap<string, ViewInfo>(),
    importUrlDisabled: undefined,
    importUrl: undefined,
    insertUrlDisabled: undefined,
    insertUrl: undefined,

    supportGroupConcatSubSelect: false,
    supportMerge: false,

    // our stuff
    appEditableTable: false,
    isLoading: false,
    isMedia: false, // opt in
    queryLabel: undefined,
    schemaLabel: undefined,
    schemaQuery: undefined,
    showInsertNewButton: true, // opt out
    singular: undefined, // defaults to value of queryLabel
    plural: undefined, // defaults to value of queryLabel
}) {
    private declare appEditableTable: boolean; // use isAppEditable()
    declare altUpdateKeys: Set<string>;
    declare disabledSystemFields: Set<string>;
    // declare canEdit: boolean;
    // declare canEditSharedViews: boolean;
    declare columns: ExtendedMap<string, QueryColumn>;
    declare description: string;
    declare domainContainerPath: string;
    // declare editDefinitionUrl: string;
    declare iconURL: string;
    declare importTemplates: any[];
    // declare indices: Map<string, any>;
    // declare isInherited: boolean;
    declare isLoading: boolean;
    declare isMedia: boolean;
    // declare isMetadataOverrideable: boolean;
    // declare isTemporary: boolean;
    // declare isUserDefined: boolean;
    declare lastAction: LastActionStatus;
    // declare lastUpdate: Date;
    declare name: string;
    declare pkCols: string[];
    declare plural: string;
    declare queryLabel: string;
    declare schemaName: string;
    declare schemaQuery: SchemaQuery;
    declare singular: string;
    declare status: QueryInfoStatus;
    declare supportGroupConcatSubSelect: boolean;
    declare supportMerge: boolean;
    // declare targetContainers: List<any>;
    declare title: string;
    declare titleColumn: string;
    // declare viewDataUrl: string;
    declare views: ExtendedMap<string, ViewInfo>;
    declare schemaLabel: string;
    declare showInsertNewButton: boolean;
    declare importUrlDisabled: boolean;
    declare importUrl: string;
    declare insertUrlDisabled: boolean;
    declare insertUrl: boolean;

    static create(rawQueryInfo: any): QueryInfo {
        let schemaQuery: SchemaQuery;

        if (rawQueryInfo.schemaName && rawQueryInfo.name) {
            schemaQuery = new SchemaQuery(rawQueryInfo.schemaName, rawQueryInfo.name);
        }

        return new QueryInfo(
            Object.assign({}, rawQueryInfo, {
                schemaQuery,
            })
        );
    }

    /**
     * Use this method for creating a basic QueryInfo object with a proper schemaQuery object
     * and columns map from a JSON object.
     *
     * @param queryInfoJson
     */
    static fromJSON(queryInfoJson: any, includeViews = false): QueryInfo {
        let schemaQuery: SchemaQuery;

        if (queryInfoJson.schemaName && queryInfoJson.name) {
            schemaQuery = new SchemaQuery(queryInfoJson.schemaName, queryInfoJson.name);
        }
        const columns = new ExtendedMap<string, QueryColumn>();
        Object.keys(queryInfoJson.columns).forEach(columnKey => {
            const rawColumn = queryInfoJson.columns[columnKey];
            columns.set(rawColumn.fieldKey.toLowerCase(), new QueryColumn(rawColumn));
        });

        const disabledSystemFields = new Set<string>();
        if (queryInfoJson.disabledSystemFields?.length > 0) {
            queryInfoJson.disabledSystemFields?.forEach(field => {
                disabledSystemFields.add(field);
            });
        }

        const altUpdateKeys = new Set<string>();
        if (queryInfoJson.altUpdateKeys?.length > 0) {
            queryInfoJson.altUpdateKeys?.forEach(key => {
                altUpdateKeys.add(key);
            });
        }

        const views = new ExtendedMap<string, ViewInfo>();
        if (includeViews) {
            queryInfoJson.views.forEach(view => {
                const viewInfo = ViewInfo.fromJson(view);
                views.set(viewInfo.name.toLowerCase(), viewInfo);
            });
        }

        return QueryInfo.create(
            Object.assign({}, queryInfoJson, {
                altUpdateKeys,
                disabledSystemFields,
                columns,
                schemaQuery,
                views,
            })
        );
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

    getDetailDisplayColumns(view?: string, omittedColumns?: List<string>): List<QueryColumn> {
        return this.getDisplayColumns(view, omittedColumns)
            .filter(col => col.isDetailColumn)
            .toList();
    }

    getDisplayColumns(view?: string, omittedColumns?: List<string>): List<QueryColumn> {
        if (!view) {
            view = ViewInfo.DEFAULT_NAME;
        }

        let lowerOmit;
        if (omittedColumns) lowerOmit = toLowerSafe(omittedColumns);

        const colFilter = c => {
            if (lowerOmit && lowerOmit.size > 0) {
                return c && c.fieldKey && !lowerOmit.includes(c.fieldKey.toLowerCase());
            }
            return true;
        };

        const viewInfo = this.getView(view);
        let displayColumns = List<QueryColumn>();
        if (viewInfo) {
            displayColumns = viewInfo.columns.filter(colFilter).reduce((list, col) => {
                let c = this.getColumn(col.fieldKey);

                if (c !== undefined) {
                    if (col.title !== undefined) {
                        c = c.mutate({
                            caption: col.title,
                            shortCaption: col.title,
                        });
                    }

                    return list.push(c);
                }

                console.warn(
                    `Unable to resolve column '${col.fieldKey}' on view '${viewInfo.name}' (${this.schemaName}.${this.name})`
                );
                return list;
            }, List<QueryColumn>());

            // add addToSystemView columns to unsaved system view (i.e. the default-default view, details view, or update view)
            if ((viewInfo.isDefault || viewInfo.isSystemView) && !viewInfo.isSaved && !viewInfo.session) {
                const columnFieldKeys = viewInfo.columns.reduce((list, col) => {
                    return list.push(col.fieldKey.toLowerCase());
                }, List<string>());

                const disabledSysFields = [];
                this.disabledSystemFields?.forEach(field => {
                    disabledSysFields.push(field.toLowerCase());
                });

                this.columns.forEach(col => {
                    const fieldKey = col.fieldKey?.toLowerCase();
                    if (
                        fieldKey &&
                        col.addToSystemView &&
                        !columnFieldKeys.includes(fieldKey) &&
                        disabledSysFields.indexOf(fieldKey) === -1
                    ) {
                        if (!lowerOmit || !lowerOmit.includes(col.fieldKey.toLowerCase()))
                            displayColumns = displayColumns.push(col);
                    }
                });
            }

            return displayColumns;
        }

        console.warn('Unable to find columns on view:', view, '(' + this.schemaName + '.' + this.name + ')');
        return List<QueryColumn>();
    }

    getLookupViewColumns(omittedColumns?: string[]): QueryColumn[] {
        const lcCols = omittedColumns ? omittedColumns.map(c => c.toLowerCase()) : [];
        return this.columns.filter(col => col.shownInLookupView && lcCols.indexOf(col.fieldKey.toLowerCase()) === -1)
            .valueArray;
    }

    getAllColumns(viewName?: string, omittedColumns?: List<string>): List<QueryColumn> {
        // initialReduction is getDisplayColumns() because they include custom metadata from the view, like alternate
        // column display names (e.g. the Experiment grid overrides Title to "Experiment Title"). See Issue 38186 for
        // additional context.
        return List<QueryColumn>(this.columns.values()).reduce((result, rawColumn) => {
            if (!result.find(displayColumn => displayColumn.name === rawColumn.name)) {
                return result.push(rawColumn);
            }

            return result;
        }, this.getDisplayColumns(viewName, omittedColumns));
    }

    // @param isIncludedColumn can be used to filter out columns that should not be designate as insertColumns
    // (e.g., if creating samples that are not aliquots, the aliquot-only fields should never be included)
    getInsertColumns(isIncludedColumn?: (col: QueryColumn) => boolean): List<QueryColumn> {
        // CONSIDER: use the columns in ~~INSERT~~ view to determine this set
        return List(this.columns.filter(col => insertColumnFilter(col, false, isIncludedColumn)));
    }

    getInsertColumnIndex(fieldKey: string): number {
        if (!fieldKey) return -1;

        const lcFieldKey = fieldKey.toLowerCase();
        return this.getInsertColumns().findIndex(column => column.fieldKey.toLowerCase() === lcFieldKey);
    }

    getUpdateColumns(readOnlyColumns?: List<string>): List<QueryColumn> {
        const lowerReadOnlyColumnsList = readOnlyColumns?.reduce((lowerReadOnlyColumnsList, value) => {
            return lowerReadOnlyColumnsList.push(value.toLowerCase());
        }, List<string>());
        const columns = this.columns
            .filter(column => {
                return (
                    column.isUpdateColumn ||
                    (lowerReadOnlyColumnsList && lowerReadOnlyColumnsList.indexOf(column.fieldKey.toLowerCase()) > -1)
                );
            })
            .map(column => {
                if (lowerReadOnlyColumnsList && lowerReadOnlyColumnsList.indexOf(column.fieldKey.toLowerCase()) > -1) {
                    return column.mutate({ readOnly: true });
                } else {
                    return column;
                }
            });
        return List(columns);
    }

    getUpdateDisplayColumns(view?: string, omittedColumns?: List<string>): List<QueryColumn> {
        return this.getDisplayColumns(view, omittedColumns)
            .filter(col => col.isUpdateColumn)
            .toList();
    }

    getFilters(view?: string): Filter.IFilter[] {
        if (view) {
            const viewInfo = this.getView(view);

            if (viewInfo) {
                return viewInfo.filters;
            }

            console.warn('Unable to find view:', view, '(' + this.schemaName + '.' + this.name + ')');
        }

        return [];
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

    getUniqueIdColumns(): List<QueryColumn> {
        return List(this.columns.filter(column => column.isUniqueIdColumn));
    }

    getSorts(view?: string): QuerySort[] {
        if (view) {
            const viewInfo = this.getView(view);

            if (viewInfo) {
                return viewInfo.sorts;
            }

            console.warn('Unable to find view:', view, '(' + this.schemaName + '.' + this.name + ')');
        }

        return [];
    }

    /**
     * An array of [[ViewInfo]] objects that are visible for a user to choose in the view menu. Note that the returned
     * array will be sorted by view label.
     */
    getVisibleViews(): ViewInfo[] {
        return this.views.filter(view => view.isVisible).valueArray.sort(naturalSortByProperty('label'));
    }

    getView(viewName: string, defaultToDefault = false): ViewInfo {
        let _viewName = viewName?.toLowerCase();
        if (_viewName === '') _viewName = ViewInfo.DEFAULT_NAME.toLowerCase();

        if (_viewName) {
            // see if there is a specific detail view override
            if (_viewName === ViewInfo.DETAIL_NAME.toLowerCase()) {
                const details = this.views.get(ViewInfo.BIO_DETAIL_NAME.toLowerCase());
                if (details) {
                    return details;
                }
            }

            const view = this.views.get(_viewName);
            if (view) return view;
        }

        return defaultToDefault ? this.views.get(ViewInfo.DEFAULT_NAME.toLowerCase()) : undefined;
    }

    getIconURL(): string {
        return this.iconURL;
    }

    /**
     * Get an array of fieldKeys for the column keys provided.
     * Default to getting all column fieldKeys if no parameter provided
     * @param keys The column keys to filter by
     */
    getColumnFieldKeys(keys?: string[]): string[] {
        if (this.columns) {
            return this.columns
                .filter((col, key) => !keys || keys.indexOf(key) > -1)
                .valueArray.map(col => col.fieldKey);
        }

        return [];
    }

    getColumnIndex(fieldKey: string): number {
        if (!fieldKey) return -1;

        const lcFieldKey = fieldKey.toLowerCase();
        return this.columns.keyArray.findIndex((column: string) => column.toLowerCase() === lcFieldKey);
    }

    getShowImportDataButton(): boolean {
        return !!(this.showInsertNewButton && this.importUrl && !this.importUrlDisabled);
    }

    getShowInsertNewButton(): boolean {
        return !!(this.showInsertNewButton && this.insertUrl && !this.insertUrlDisabled);
    }

    getInsertQueryInfo(): QueryInfo {
        const updateColumns = this.columns.filter(column => column.shownInInsertView && !column.isFileInput);
        return this.set('columns', updateColumns) as QueryInfo;
    }

    getFileColumnFieldKeys(): string[] {
        return this.columns.filter(col => col.isFileInput).valueArray.map(col => col.fieldKey);
    }
}
