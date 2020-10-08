// commented out attributes are not used in app
import { List, Map, OrderedMap, Record } from 'immutable';

import { Filter } from '@labkey/api';

import { insertColumnFilter, LastActionStatus, QueryColumn, QueryInfoStatus, SchemaQuery, ViewInfo } from '..';
import { QuerySort } from './QuerySort';
import { toLowerSafe } from '../internal/util/utils';

export class QueryInfo extends Record({
    // canEdit: false,
    // canEditSharedViews: false,
    columns: OrderedMap<string, QueryColumn>(),
    description: undefined,
    // editDefinitionUrl: undefined,
    importTemplates: List<any>(),
    // indices: Map<string, any>(),
    // isInherited: false,

    iconURL: 'default',
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
    plural: undefined, // defaults to value of queryLabel
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
    static fromJSON(queryInfoJson: any): QueryInfo {
        let schemaQuery: SchemaQuery;

        if (queryInfoJson.schemaName && queryInfoJson.name) {
            schemaQuery = SchemaQuery.create(queryInfoJson.schemaName, queryInfoJson.name);
        }
        let columns = OrderedMap<string, QueryColumn>();
        Object.keys(queryInfoJson.columns).forEach(columnKey => {
            const rawColumn = queryInfoJson.columns[columnKey];
            columns = columns.set(rawColumn.fieldKey.toLowerCase(), QueryColumn.create(rawColumn));
        });

        return QueryInfo.create(
            Object.assign({}, queryInfoJson, {
                columns,
                schemaQuery,
                views: Map<string, ViewInfo>(), // need views to be a Map to avoid 'get is not defined' errors
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
                        c = c.merge({
                            caption: col.title,
                            shortCaption: col.title,
                        }) as QueryColumn;
                    }

                    return list.push(c);
                }

                console.warn(
                    `Unable to resolve column '${col.fieldKey}' on view '${viewInfo.name}' (${this.schemaName}.${this.name})`
                );
                return list;
            }, List<QueryColumn>());

            // add addToDisplayView columns
            const columnFieldKeys = viewInfo.columns.reduce((list, col) => {
                return list.push(col.fieldKey.toLowerCase());
            }, List<string>());
            this.columns.forEach(col => {
                if (col.fieldKey && col.addToDisplayView && !columnFieldKeys.includes(col.fieldKey.toLowerCase())) {
                    if (!lowerOmit || (lowerOmit.size > 0 && !lowerOmit.includes(col.fieldKey.toLowerCase())))
                        displayColumns = displayColumns.push(col);
                }
            });

            return displayColumns;
        }

        console.warn('Unable to find columns on view:', view, '(' + this.schemaName + '.' + this.name + ')');
        return List<QueryColumn>();
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

    getInsertColumns(): List<QueryColumn> {
        // CONSIDER: use the columns in ~~INSERT~~ view to determine this set
        return this.columns.filter(insertColumnFilter).toList();
    }

    getUpdateColumns(readOnlyColumns?: List<string>): List<QueryColumn> {
        return this.columns
            .filter(column => {
                return column.isUpdateColumn || (readOnlyColumns && readOnlyColumns.indexOf(column.fieldKey) > -1);
            })
            .map(column => {
                if (readOnlyColumns && readOnlyColumns.indexOf(column.fieldKey) > -1) {
                    return column.set('readOnly', true) as QueryColumn;
                } else {
                    return column;
                }
            })
            .toList();
    }

    getUpdateDisplayColumns(view?: string, omittedColumns?: List<string>): List<QueryColumn> {
        return this.getDisplayColumns(view, omittedColumns)
            .filter(col => col.isUpdateColumn)
            .toList();
    }

    getFilters(view?: string): List<Filter.IFilter> {
        if (view) {
            const viewInfo = this.getView(view);

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
            const viewInfo = this.getView(view);

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
    insertColumns(colIndex: number, queryColumns: OrderedMap<string, QueryColumn>): OrderedMap<string, QueryColumn> {
        if (colIndex < 0 || colIndex > this.columns.size) return this.columns;

        // put them at the end
        if (colIndex === this.columns.size) return this.columns.merge(queryColumns);

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
                .map(col => col.fieldKey)
                .toArray();
        }

        return [];
    }
}
