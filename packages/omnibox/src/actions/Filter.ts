/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, Set } from 'immutable'
import { Filter, Utils } from '@labkey/api'
import { QueryGridModel, QueryColumn } from '@glass/models'
import { naturalSort } from '@glass/utils'

import { Action, ActionOption, ActionValue, Value } from './Action'

type FilterType = Filter.FilterType;

/**
 * The following section prepares the SYMBOL_MAP and SUFFIX_MAP to allow any Filter Action instances
 * to quickly resolve a FilterType from a symbol/suffix for a filter.
 */

// construct symbol map
let SYMBOL_MAP = Map<string /* symbol */, Map<string /* suffix */, FilterType>>().asMutable();
let SUFFIX_MAP = Map<string /* suffix */, FilterType>().asMutable();

let TYPE_SET = Set<string>().asMutable();
let TYPE_MAP = Map<string, FilterType>(Filter.Types);
TYPE_MAP.valueSeq().forEach((type: FilterType) => {
    // there are duplicates of the same filter in the type map (e.g. NEQ and NOT_EQUAL)
    const suffix = type.getURLSuffix();
    const symbol = type.getDisplaySymbol();

    if (!TYPE_SET.has(suffix)) {
        TYPE_SET.add(suffix);

        SUFFIX_MAP.set(suffix, type);
        if (symbol !== null) {

            if (!SYMBOL_MAP.has(symbol)) {
                SYMBOL_MAP.set(symbol, Map<string, FilterType>().asMutable());
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
 * Given a symbol/suffix and a QueryColumn this will resolve the FilterType based on the column
 * type matched against the symbol/suffix.
 * @param symbolOrSuffix
 * @param column
 * @returns {FilterType}
 */
function resolveFilterType(symbolOrSuffix: string, column: QueryColumn): FilterType {
    if (SUFFIX_MAP.has(symbolOrSuffix)) {
        return SUFFIX_MAP.get(symbolOrSuffix);
    }

    if (SYMBOL_MAP.has(symbolOrSuffix)) {
        let symbolTypes = SYMBOL_MAP.get(symbolOrSuffix);
        let types = Filter.getFilterTypesForType(column.get('jsonType'));

        let value: FilterType;
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
 * Given a FilterType resolves the symbol (string) that should be displayed
 * @param filterType
 * @returns {string}
 */
function resolveSymbol(filterType: FilterType): string {
    return filterType.getDisplaySymbol() == null ? filterType.getURLSuffix() : filterType.getDisplaySymbol();
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
        activeFilterType?: FilterType
        columnName: string
        column?: QueryColumn
        filterTypes?: Array<FilterType>
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

                if (column && activeFilterType && rawValue !== undefined) {
                    const operator = resolveSymbol(activeFilterType);
                    const filter = Filter.create(resolveFieldKey(columnName, column), rawValue, activeFilterType);
                    const display = this.getDisplayValue(column.shortCaption, operator, rawValue);

                    resolve({
                        displayValue: display.displayValue,
                        isReadOnly: display.isReadOnly,
                        param: filter.getURLParameterName(this.urlPrefix) + '=' + filter.getURLParameterValue(),
                        value: [`"${column.shortCaption}"`, operator, rawValue].join(' ')
                    });
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

                let results: Array<ActionOption> = [];
                const { activeFilterType, column, columnName, rawValue, filterTypes } = FilterAction.parseTokens(tokens, columns);

                if (column) {

                    if (activeFilterType) {
                        const operator = resolveSymbol(activeFilterType);

                        return this.resolveValues(column, operator, rawValue).then(valueResults => {
                            resolve(results.concat(valueResults));
                        });
                    }
                    else if (filterTypes.length > 0) {

                        let noSymbol = [];
                        let displayNonSymbols = false;
                        for (let i=0; i < filterTypes.length; i++) {

                            const symbol = filterTypes[i].getDisplaySymbol();
                            const suffix = filterTypes[i].getURLSuffix();

                            // for now, only support options with displaySymbol
                            if (symbol != null) {
                                results.push({
                                    label: `"${column.shortCaption}" ${symbol}`,
                                    nextLabel: ' value',
                                    value: symbol
                                });
                            }
                            else if (displayNonSymbols) {
                                noSymbol.push({
                                    label: `"${column.shortCaption}" ${suffix}`,
                                    nextLabel: ' value',
                                    value: suffix
                                });
                            }
                        }

                        if (noSymbol.length > 0) {
                            results = results.concat(noSymbol);
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
                        results.push({
                            label: `"${c.shortCaption}" ...`,
                            value: `"${c.shortCaption}"`,
                            isComplete: false
                        });
                    });
                }

                resolve(results);
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

    parseParam(paramKey: string, paramValue: any): Array<string> | Array<Value> {
        let results: Array<Value> = [];
        const { param, filters } = this.getFilterParameters(paramKey, paramValue);

        if (filters.length > 0) {
            for (let i=0; i < filters.length; i++) {
                const columnName = filters[i].getColumnName();
                const operator = resolveSymbol(filters[i].getFilterType());
                let rawValue = filters[i].getValue();
                const display = this.getDisplayValue(columnName, operator, Utils.isArray(rawValue) ? rawValue[0] : rawValue);

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

    resolveValues(col: QueryColumn, operator: string, rawValue: any): Promise<Array<ActionOption>> {
        return new Promise(resolve => {
            return this.resolveModel().then(model => {
                let results: Array<ActionOption> = [];
                const safeValue = rawValue ? rawValue.toString().toLowerCase() : '';

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

    private getDisplayValue(columnName: string, operator: string, rawValue: string): {displayValue: string, isReadOnly: boolean} {
        // handle multi-value filters
        let _rawValue: string | Array<string> = rawValue;
        let isReadOnly = false;

        if (rawValue && rawValue.indexOf(';') > -1) {
            _rawValue = rawValue.split(';');
            // TODO: This is just a stopgap to prevent rendering crazy long IN clauses. Pretty much any solution besides
            // showing all the values or this would be preferred. See 28884.
            if (_rawValue.length > 3) {
                _rawValue = `(${_rawValue.length} values)`;
                isReadOnly = true;
            }
            else {
                _rawValue = _rawValue.join(', ');
            }
        }

        return {
            displayValue: [columnName, operator, _rawValue].join(' '),
            isReadOnly
        };
    }

    private getFilterParameters(paramKey: string, paramValue: any): {param: string, filters: Array<Filter.Filter>} {
        const param = [paramKey, paramValue].join('=');

        return {
            filters: Filter.getFiltersFromUrl(param, this.urlPrefix),
            param
        };
    }
}