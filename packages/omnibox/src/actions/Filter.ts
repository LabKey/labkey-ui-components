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
import { List, Map, Set } from 'immutable'
import { Filter, Utils } from '@labkey/api'
import { QueryGridModel, QueryColumn, naturalSort } from '@glass/base'

import { Action, ActionOption, ActionValue, Value } from './Action'

/**
 * The following section prepares the SYMBOL_MAP and SUFFIX_MAP to allow any Filter Action instances
 * to quickly resolve a IFilterType from a symbol/suffix for a filter.
 */

// construct symbol map
let SYMBOL_MAP = Map<string /* symbol */, Map<string /* suffix */, Filter.IFilterType>>().asMutable();
let SUFFIX_MAP = Map<string /* suffix */, Filter.IFilterType>().asMutable();

let TYPE_SET = Set<string>().asMutable();
let TYPE_MAP = Map<string, Filter.IFilterType>(Filter.Types);
TYPE_MAP.valueSeq().forEach((type: Filter.IFilterType) => {
    // there are duplicates of the same filter in the type map (e.g. NEQ and NOT_EQUAL)
    const suffix = type.getURLSuffix();
    const symbol = type.getDisplaySymbol();

    if (!TYPE_SET.has(suffix)) {
        TYPE_SET.add(suffix);

        SUFFIX_MAP.set(suffix, type);
        if (symbol !== null) {

            if (!SYMBOL_MAP.has(symbol)) {
                SYMBOL_MAP.set(symbol, Map<string, Filter.IFilterType>().asMutable());
            }

            SYMBOL_MAP.get(symbol).set(suffix, type);
        }
    }
});
SYMBOL_MAP = SYMBOL_MAP.asImmutable();
SUFFIX_MAP = SUFFIX_MAP.asImmutable();
TYPE_SET = undefined;

/**
 * From the supplied columnName this method will determine which columns in the "columns" list
 * match based on name. If none match, then the columnName will attempt to resolve against each
 * column's shortCaption (see QueryColumn).
 * @param columns
 * @param columnName
 * @returns {List<QueryColumn>}
 */
export function parseColumns(columns: List<QueryColumn>, columnName: string): List<QueryColumn> {
    const _columnName = columnName ? columnName.toLowerCase() : '';

    // First, attempt to match by column name/lookup
    let nameMatches = columns.filter(c => {
        if (_columnName.indexOf('/') > -1) {
            if (c.isLookup()) {
                const name = _columnName.split('/')[0];
                return c.name.toLowerCase() === name;
            }

            return false;
        }

        return c.name.toLowerCase() === _columnName;
    }).toList();

    // Second, if there are no matches by column name/lookup, attempt to match by column shortCaption
    if (nameMatches.size === 0) {
        return columns.filter(c => c.shortCaption.toLowerCase() === _columnName).toList();
    }

    return nameMatches;
}

/**
 * Determines what the field key should be from a supplied columnName.
 * If a column (QueryColumn) is supplied it will override the columnName for either
 * the column's lookup column or the column's name.
 * @param columnName
 * @param column
 * @returns {any}
 */
function resolveFieldKey(columnName: string, column?: QueryColumn): string {
    let fieldKey: string;

    if (column) {
        if (column.isLookup()) {
            fieldKey = [column.name, column.lookup.displayColumn.replace(/\//g, '$S')].join('/');
        }
        else {
            fieldKey = column.name;
        }
    }
    else {
        fieldKey = columnName;
    }

    return fieldKey;
}

/**
 * Given a symbol/suffix and a QueryColumn this will resolve the IFilterType based on the column
 * type matched against the symbol/suffix.
 * @param symbolOrSuffix
 * @param column
 * @returns {IFilterType}
 */
function resolveFilterType(symbolOrSuffix: string, column: QueryColumn): Filter.IFilterType {
    if (SUFFIX_MAP.has(symbolOrSuffix)) {
        return SUFFIX_MAP.get(symbolOrSuffix);
    }

    if (SYMBOL_MAP.has(symbolOrSuffix)) {
        let symbolTypes = SYMBOL_MAP.get(symbolOrSuffix);
        let types = Filter.getFilterTypesForType(column.get('jsonType'));

        let value: Filter.IFilterType;
        let match = false;

        for (let i=0; i < types.length; i++) {
            if (symbolTypes.has(types[i].getURLSuffix())) {
                if (match) {
                    console.warn(`Column of type \"${column.get('jsonType')}\" has multiple filter for symbol \"${symbolOrSuffix}\".`);
                    match = false;
                    value = undefined;
                    break; // stop the loop, ambiguous
                }
                else {
                    match = true;
                    value = symbolTypes.get(types[i].getURLSuffix());
                }
            }
        }

        if (match && value) {
            return value;
        }
    }

    console.warn('Unable to resolve symbol/suffix: \"' + symbolOrSuffix + '\"');

    return undefined;
}

/**
 * Given a IFilterType resolves the symbol (string) that should be displayed
 * @param filterType
 * @returns {string}
 */
function resolveSymbol(filterType: Filter.IFilterType): string {
    const symbol = filterType.getDisplaySymbol();
    if (symbol) {
        return symbol;
    }

    const displayText = filterType.getDisplayText();
    if (displayText) {
        return displayText;
    }

    return filterType.getURLSuffix();
}

export class FilterAction implements Action {
    iconCls = 'filter';
    keyword = 'filter';
    optionalLabel = 'columns';
    resolveColumns: (allColumns?: boolean) => Promise<List<QueryColumn>> = undefined;
    resolveModel: () => Promise<QueryGridModel>;
    urlPrefix: string;

    constructor(resolveColumns: () => Promise<List<QueryColumn>>, urlPrefix: string, resolveModel: () => Promise<QueryGridModel>) {
        this.resolveColumns = resolveColumns;
        this.resolveModel = resolveModel;
        this.urlPrefix = urlPrefix;
    }

    static parseTokens(tokens: Array<string>, columns: List<QueryColumn>): {
        activeFilterType?: Filter.IFilterType
        columnName: string
        column?: QueryColumn
        filterTypes?: Array<Filter.IFilterType>
        rawValue: any
    } {
        let options = {
            activeFilterType: undefined,
            column: undefined,
            columnName: undefined,
            filterTypeValue: undefined,
            filterTypes: undefined,
            rawValue: undefined
        };

        if (tokens.length > 0) {
            options.columnName = tokens[0];

            // see if the column is in our current domain
            const column = parseColumns(columns, options.columnName).first();
            if (column) {
                options.column = column;
                options.filterTypes = Filter.getFilterTypesForType(column.get('jsonType')); // TODO: Need to filter this set

                if (tokens.length > 1) {

                    options.filterTypeValue = tokens[1];
                    options.activeFilterType = resolveFilterType(options.filterTypeValue, column);

                    if (options.activeFilterType && tokens.length > 2) {
                        options.rawValue = tokens.slice(2).join(' ');
                    }
                }
            }
        }

        return options;
    }

    completeAction(tokens: Array<string>): Promise<Value> {
        return new Promise((resolve) => {
            return this.resolveColumns(true).then((columns: List<QueryColumn>) => {
                const { activeFilterType, column, columnName, rawValue } = FilterAction.parseTokens(tokens, columns);

                if (column && activeFilterType) {
                    if (rawValue !== undefined || !activeFilterType.isDataValueRequired()) {
                        const operator = resolveSymbol(activeFilterType);
                        const filter = Filter.create(resolveFieldKey(columnName, column), rawValue, activeFilterType);
                        const display = this.getDisplayValue(column.shortCaption, activeFilterType, rawValue);

                        resolve({
                            displayValue: display.displayValue,
                            isReadOnly: display.isReadOnly,
                            param: filter.getURLParameterName(this.urlPrefix) + '=' + filter.getURLParameterValue(),
                            value: [`"${column.shortCaption}"`, operator, rawValue].join(' ')
                        });
                    }
                }

                resolve({
                    value: tokens.join(' '),
                    isValid: false
                });
            });
        });
    }

    fetchOptions(tokens: Array<string>): Promise<Array<ActionOption>> {
        return new Promise((resolve) => {
            return this.resolveColumns().then((columns) => {

                let actionOptions: Array<ActionOption> = [];
                const { activeFilterType, column, columnName, rawValue, filterTypes } = FilterAction.parseTokens(tokens, columns);

                if (column) {

                    if (activeFilterType) {
                        return this.resolveValues(column, activeFilterType, rawValue).then(valueResults => {
                            resolve(actionOptions.concat(valueResults));
                        });
                    }
                    else if (filterTypes.length > 0) {

                        let noSymbolActionOptions: Array<ActionOption> = [];

                        for (let i=0; i < filterTypes.length; i++) {

                            const type = filterTypes[i];

                            // Do not currently support building multi-value filters
                            if (type.isMultiValued()) {
                                continue;
                            }

                            const symbol = type.getDisplaySymbol();
                            const suffix = type.getURLSuffix();
                            const isComplete = !type.isDataValueRequired();
                            const nextLabel = isComplete ? undefined : ' value';

                            if (symbol != null) {
                                actionOptions.push({
                                    isComplete,
                                    label: `"${column.shortCaption}" ${symbol}`,
                                    nextLabel,
                                    value: symbol
                                });
                            }
                            else if (suffix) {
                                const text = type.getDisplayText() ? type.getDisplayText() : suffix;
                                noSymbolActionOptions.push({
                                    isComplete,
                                    label: `"${column.shortCaption}" ${text.toLowerCase()}`,
                                    nextLabel,
                                    value: suffix
                                });
                            }
                        }

                        if (noSymbolActionOptions.length > 0) {
                            actionOptions = actionOptions.concat(noSymbolActionOptions);
                        }
                    }
                }
                else if (columns.size > 0) {
                    let columnSet = columns;
                    if (columnName) {
                        columnSet = columns
                            .filter(c => c.name.toLowerCase().indexOf(columnName.toLowerCase()) === 0)
                            .toList();
                    }

                    columnSet.forEach(c => {
                        actionOptions.push({
                            label: `"${c.shortCaption}" ...`,
                            value: `"${c.shortCaption}"`,
                            isComplete: false
                        });
                    });
                }

                resolve(actionOptions);
            });
        });
    }

    isEqual(action: Action): boolean {
        return false;
    }
    
    buildParams(actionValues: Array<ActionValue>) {
        return actionValues.map((actionValue: ActionValue) => {
            const [ paramKey, paramValue ] = actionValue.param.split('=');

            return {
                paramKey,
                paramValue
            };
        });
    }

    matchParam(paramKey: string, paramValue: any): boolean {
        return this.getFilterParameters(paramKey, paramValue).filters.length > 0;
    }

    parseParam(paramKey: string, paramValue: any, columns: List<QueryColumn>): Array<string> | Array<Value> {
        let results: Array<Value> = [];
        const { param, filters } = this.getFilterParameters(paramKey, paramValue);

        if (filters.length > 0) {
            for (let i = 0; i < filters.length; i++) {
                const filter = filters[i];
                const columnName = filter.getColumnName();
                const column = parseColumns(columns, columnName).first();
                const columnLabel = column ? column.shortCaption : columnName;

                const operator = resolveSymbol(filter.getFilterType());
                const rawValue = filter.getValue();
                const display = this.getDisplayValue(columnLabel, filter.getFilterType(), rawValue);

                results.push({
                    displayValue: display.displayValue,
                    isReadOnly: display.isReadOnly,
                    param,
                    value: [columnName, operator, rawValue].join(' ')
                });
            }
        }

        return results;
    }

    resolveValues(col: QueryColumn, activeFilterType: Filter.IFilterType, rawValue: any): Promise<Array<ActionOption>> {
        return new Promise(resolve => {
            return this.resolveModel().then(model => {
                let results: Array<ActionOption> = [];
                const safeValue = rawValue ? rawValue.toString().toLowerCase() : '';
                const operator = resolveSymbol(activeFilterType);

                model.data
                    .reduce((prev, v) => {
                        if (prev.size > 15) {
                            return prev;
                        }

                        const found = List([
                            v.getIn([col.name, 'displayValue']),
                            v.getIn([col.name, 'formattedValue']),
                            v.getIn([col.name, 'value'])
                        ]).find(va => {
                            return va !== undefined && va !== null && (
                                !safeValue ||
                                va.toString().toLowerCase().indexOf(safeValue) > -1
                            )
                        });

                        if (found !== undefined) {
                            prev.add(found.toString());
                        }

                        return prev;
                    }, Set<string>().asMutable())
                    .sort(naturalSort)
                    .forEach(value => {
                        results.push({
                            label: `"${col.shortCaption}" ${operator} ${value}`,
                            value,
                            isComplete: true
                        });
                    });

                if (results.length === 0) {
                    if (rawValue !== undefined) {
                        results.push({
                            label: `"${col.shortCaption}" ${operator} ${rawValue}`,
                            appendValue: false,
                            isComplete: true
                        });
                    }
                    else {
                        results.push({
                            label: `"${col.shortCaption}" ${operator}`,
                            nextLabel: ' value',
                            selectable: false
                        });
                    }
                }

                resolve(results);
            });
        });
    }

    private getDisplayValue(columnName: string, filterType: Filter.IFilterType, rawValue: string | Array<string>): {displayValue: string, isReadOnly: boolean} {
        let isReadOnly = false;

        let value: string;
        let displayParts = [columnName, resolveSymbol(filterType)];

        if (!filterType.isDataValueRequired()) {
            // intentionally do not modify "display" -- this filter type does not support a value (e.g. isblank)
        }
        else if (filterType.isMultiValued()) {
            if (Utils.isString(rawValue)) {
                // TODO: port the IFilterType.parseValue to labkey-api-js
                rawValue = rawValue.split(filterType.getMultiValueSeparator());
            }

            if (!Utils.isArray(rawValue)) {
                throw new Error("Expected '" + filterType.getMultiValueSeparator() + "' string or an Array of values, got: " + rawValue);
            }

            // TODO: This is just a stopgap to prevent rendering crazy long IN clauses. Pretty much any solution besides
            // showing all the values or this would be preferred. See 28884.
            if (rawValue.length > 3) {
                value = `(${rawValue.length} values)`;
                isReadOnly = true;
            }
            else {
                value = rawValue.join(', ');
            }
        }
        else {
            value = '' + rawValue;
        }

        if (value) {
            displayParts.push(value);
        }

        return {
            displayValue: displayParts.join(' '),
            isReadOnly
        };
    }

    private getFilterParameters(paramKey: string, paramValue: any): {param: string, filters: Array<Filter.IFilter>} {
        // Need to re-encode paramValue because it has already been decoded, and getFiltersFromUrl assumes that the
        // strings passed in are URL encoded. See Issue #34630 for more details.
        const param = `${paramKey}=${encodeURIComponent(paramValue)}`;

        return {
            filters: Filter.getFiltersFromUrl(param, this.urlPrefix),
            param
        };
    }
}