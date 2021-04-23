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
import { List, Map, Set } from 'immutable';
import { Filter, Utils } from '@labkey/api';

import { QueryColumn, QueryInfo } from '../../../..';

import { parseColumns, resolveFieldKey } from '../utils';

import { Action, ActionOption, ActionValue, Value } from './Action';
import { decodePart } from '../../../../public/SchemaQuery';

/**
 * The following section prepares the SYMBOL_MAP and SUFFIX_MAP to allow any Filter Action instances
 * to quickly resolve a IFilterType from a symbol/suffix for a filter.
 */

// construct symbol map
let SYMBOL_MAP = Map<string /* symbol */, Map<string /* suffix */, Filter.IFilterType>>().asMutable();
let SUFFIX_MAP = Map<string /* suffix */, Filter.IFilterType>().asMutable();
let TEXT_MAP = Map<string /* displayText */, Filter.IFilterType>().asMutable();

let TYPE_SET = Set<string>().asMutable();
const TYPE_MAP = Map<string, Filter.IFilterType>(Filter.Types);
TYPE_MAP.valueSeq().forEach((type: Filter.IFilterType) => {
    // there are duplicates of the same filter in the type map (e.g. NEQ and NOT_EQUAL)
    const suffix = getURLSuffix(type);
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

        const text = type.getDisplayText();
        if (text) {
            TEXT_MAP.set(text.toLowerCase(), type);
        }
    }
});
SYMBOL_MAP = SYMBOL_MAP.asImmutable();
SUFFIX_MAP = SUFFIX_MAP.asImmutable();
TEXT_MAP = TEXT_MAP.asImmutable();
TYPE_SET = undefined;

/**
 * Remaps URL suffixes for types where the suffix cannot be distinguished.
 * @private
 */
export function getURLSuffix(type: Filter.IFilterType): string {
    const suffix = type.getURLSuffix();
    if (suffix === '') return 'any';
    return suffix;
}

function matchingFilterTypes(filterTypes: Filter.IFilterType[], token: string): Filter.IFilterType[] {
    if (!token) {
        return filterTypes;
    }

    token = token.toLowerCase();

    return filterTypes.filter(type => resolveSymbol(type).toLowerCase().indexOf(token) === 0);
}

/**
 * Given a symbol/suffix/text and a QueryColumn this will resolve the IFilterType based on the column
 * type matched against the symbol/suffix/text.
 * @param token
 * @param column
 * @returns {IFilterType}
 */
function resolveFilterType(token: string, column: QueryColumn): Filter.IFilterType {
    if (SUFFIX_MAP.has(token)) {
        return SUFFIX_MAP.get(token);
    }

    if (SYMBOL_MAP.has(token)) {
        const symbolTypes = SYMBOL_MAP.get(token);
        const types = Filter.getFilterTypesForType(column.get('jsonType'));

        let value: Filter.IFilterType;
        let match = false;

        for (let i = 0; i < types.length; i++) {
            const suffix = getURLSuffix(types[i]);
            if (symbolTypes.has(suffix)) {
                if (match) {
                    console.warn(
                        `Column of type \"${column.get('jsonType')}\" has multiple filter for symbol \"${token}\".`
                    );
                    match = false;
                    value = undefined;
                    break; // stop the loop, ambiguous
                } else {
                    match = true;
                    value = symbolTypes.get(suffix);
                }
            }
        }

        if (match && value) {
            return value;
        }
    }

    const text = token.toLowerCase();
    if (TEXT_MAP.has(text)) {
        return TEXT_MAP.get(text);
    }

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

    return getURLSuffix(filterType);
}

export interface IFilterContext {
    activeFilterType?: Filter.IFilterType;
    columnName?: string;
    column?: QueryColumn;
    filterTypes?: Filter.IFilterType[];
    rawValue?: any;
}

export class FilterAction implements Action {
    iconCls = 'filter';
    keyword = 'filter';
    optionalLabel = 'columns';
    getColumns: (all?: boolean) => List<QueryColumn>;
    urlPrefix: string;
    getFilterDisplayValue: (columnName: string, rawValue: string) => string;

    // todo, define an interface for Action constructor param and use a signle object as param
    constructor(
        urlPrefix: string,
        getColumns: () => List<QueryColumn>,
        getQueryInfo?: () => QueryInfo,
        getFilterDisplayValue?: (columnName: string, rawValue: string) => string
    ) {
        this.getColumns = getColumns;
        this.urlPrefix = urlPrefix;
        // getQueryInfo is not used by Filter currently, but needs to be in params since it's used by View Action, see URLBox new urlAction(urlPrefix, this.getColumns, this.getQueryInfo)
        this.getFilterDisplayValue = getFilterDisplayValue;
    }

    static parseTokens(tokens: string[], columns: List<QueryColumn>, isComplete?: boolean): IFilterContext {
        const options: IFilterContext = {
            filterTypes: [],
        };

        if (tokens && tokens.length > 0) {
            options.columnName = tokens[0];

            // see if the column is in our current domain
            const column = parseColumns(columns, options.columnName).first();
            if (column) {
                options.column = column;
                options.filterTypes = Filter.getFilterTypesForType(column.get('jsonType'));

                if (tokens.length > 1) {
                    options.activeFilterType = resolveFilterType(tokens[1], column);

                    if (options.activeFilterType && tokens.length > 2) {
                        options.rawValue = tokens.slice(2).join(' ');
                    } else {
                        const part = tokens.slice(1).join(' ');
                        const matchingTypes = matchingFilterTypes(options.filterTypes, part);

                        if (isComplete && matchingTypes.length === 1) {
                            options.activeFilterType = matchingTypes[0];
                        } else {
                            options.filterTypes = matchingTypes;
                        }
                    }
                }
            }
        }

        return options;
    }

    completeAction(tokens: string[]): Promise<Value> {
        return new Promise(resolve => {
            const columns = this.getColumns(true);
            const { activeFilterType, column, columnName, rawValue } = FilterAction.parseTokens(tokens, columns, true);

            if (column && activeFilterType && (rawValue !== undefined || !activeFilterType.isDataValueRequired())) {
                const operator = resolveSymbol(activeFilterType);
                const filter = Filter.create(resolveFieldKey(columnName, column), rawValue, activeFilterType);
                const display = this.getDisplayValue(column.shortCaption, activeFilterType, rawValue);
                resolve({
                    isValid: true,
                    displayValue: display.displayValue,
                    isReadOnly: display.isReadOnly,
                    param: filter.getURLParameterName(this.urlPrefix) + '=' + filter.getURLParameterValue(),
                    value: [`"${column.shortCaption}"`, operator, rawValue].join(' '),
                    valueObject: filter,
                });
            } else {
                resolve({
                    value: tokens.join(' '),
                    isValid: false,
                });
            }
        });
    }

    fetchOptions(tokens: string[], uniqueValues?: List<any>): Promise<ActionOption[]> {
        return new Promise(resolve => {
            const columns = this.getColumns();
            let actionOptions: ActionOption[] = [];
            const { activeFilterType, column, columnName, rawValue, filterTypes } = FilterAction.parseTokens(
                tokens,
                columns
            );

            if (column) {
                if (activeFilterType) {
                    // Show the user the possible values
                    resolve(this.getFilterValues(column, activeFilterType, rawValue, uniqueValues));
                } else if (filterTypes.length > 0) {
                    // Show the user the available filter types
                    const noSymbolActionOptions: ActionOption[] = [];

                    for (let i = 0; i < filterTypes.length; i++) {
                        const type = filterTypes[i];

                        // Do not currently support building multi-value filters
                        if (type.isMultiValued()) {
                            continue;
                        }

                        const symbol = type.getDisplaySymbol();
                        const suffix = getURLSuffix(type);
                        const isComplete = !type.isDataValueRequired();
                        const nextLabel = isComplete ? undefined : ' value';

                        if (symbol != null) {
                            actionOptions.push({
                                isComplete,
                                label: `"${column.shortCaption}" ${symbol}`,
                                nextLabel,
                                value: symbol,
                            });
                        } else if (suffix) {
                            const text = type.getDisplayText() ? type.getDisplayText() : suffix;
                            noSymbolActionOptions.push({
                                isComplete,
                                label: `"${column.shortCaption}" "${text.toLowerCase()}"`,
                                nextLabel,
                                value: `"${text.toLowerCase()}"`,
                            });
                        }
                    }

                    if (noSymbolActionOptions.length > 0) {
                        actionOptions = actionOptions.concat(noSymbolActionOptions);
                    }
                }
            } else if (columns.size > 0) {
                // Show the user the columns to filter on
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
                        isComplete: false,
                    });
                });
            }

            resolve(actionOptions);
        });
    }

    isEqual(action: Action): boolean {
        return false;
    }

    buildParams(actionValues: ActionValue[]) {
        return actionValues.map((actionValue: ActionValue) => {
            const [paramKey, paramValue] = actionValue.param.split('=');

            return {
                paramKey,
                paramValue,
            };
        });
    }

    matchParam(paramKey: string, paramValue: any): boolean {
        return this.getFilterParameters(paramKey, paramValue).filters.length > 0;
    }

    parseParam(paramKey: string, paramValue: any, columns: List<QueryColumn>): string[] | Value[] {
        const results: Value[] = [];
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
                    value: [columnName, operator, rawValue].join(' '),
                });
            }
        }

        return results;
    }

    getFilterValues = (
        col: QueryColumn,
        activeFilterType: Filter.IFilterType,
        rawValue: any,
        uniqueValues: List<any>
    ): ActionOption[] => {
        if (uniqueValues === undefined) {
            return [
                {
                    label: 'Loading...',
                    appendValue: false,
                    isComplete: false,
                    selectable: false,
                },
            ];
        }

        const strValues: string[] = [];
        const safeValue = rawValue ? rawValue.toString().toLowerCase() : '';
        const operator = resolveSymbol(activeFilterType);

        uniqueValues.forEach(value => {
            if (value === null) {
                return;
            }

            const strValue = value.toString();

            if (strValue.toLowerCase().indexOf(safeValue) > -1) {
                strValues.push(strValue);
            }

            if (strValues.length === 16) {
                // exit forEach early if we have 16 results.
                return false;
            }
        });

        if (strValues.length === 0) {
            if (rawValue === undefined) {
                return [
                    {
                        label: `"${col.shortCaption}" ${operator}`,
                        nextLabel: ' value',
                        selectable: false,
                    },
                ];
            }

            return [
                {
                    label: `"${col.shortCaption}" ${operator} ${rawValue}`,
                    appendValue: false,
                    isComplete: true,
                },
            ];
        }

        return strValues.map(strValue => {
            const value = `"${col.shortCaption}" ${operator} ${strValue}`;
            let displayValue = value;
            if (this.getFilterDisplayValue) {
                const altDisplayValue = this.getFilterDisplayValue(col.shortCaption, strValue);
                if (altDisplayValue) displayValue = `"${col.shortCaption}" ${operator} ${altDisplayValue}`;
            }
            return {
                // label and value are the same, and appendValue is false, because we want to ignore all user input when
                // they select an option. This is a workaround because of how Omnibox.resolveInputValue works. See
                // Issue 40195.
                value,
                label: displayValue,
                appendValue: false,
                isComplete: true,
            };
        });
    };

    private getDisplayValue(
        columnName: string,
        filterType: Filter.IFilterType,
        rawValue: string | string[]
    ): { displayValue: string; isReadOnly: boolean; inputValue: string } {
        let isReadOnly = false;

        let value: string, inputValue: string;
        const displayParts = [decodePart(columnName), resolveSymbol(filterType)];
        const inputDisplayParts = [`"${displayParts[0]}"`, displayParts[1]]; // need to quote column name for input display

        if (!filterType.isDataValueRequired()) {
            // intentionally do not modify "display" -- this filter type does not support a value (e.g. isblank)
        } else if (filterType.isMultiValued()) {
            if (Utils.isString(rawValue)) {
                // TODO: port the IFilterType.parseValue to labkey-api-js
                rawValue = rawValue.split(filterType.getMultiValueSeparator());
            }

            if (!Utils.isArray(rawValue)) {
                throw new Error(
                    "Expected '" +
                        filterType.getMultiValueSeparator() +
                        "' string or an Array of values, got: " +
                        rawValue
                );
            }

            // TODO: This is just a stopgap to prevent rendering crazy long IN clauses. Pretty much any solution besides
            // showing all the values or this would be preferred. See 28884.
            if (rawValue.length > 3) {
                value = `(${rawValue.length} values)`;
                isReadOnly = true;
            } else {
                value = rawValue.join(', ');
            }
        } else {
            value = '' + rawValue;

            if (this.getFilterDisplayValue) {
                const displayValue = this.getFilterDisplayValue(columnName, value);
                if (displayValue) {
                    value = '' + displayValue;
                }
                inputDisplayParts.push(value);
                inputValue = inputDisplayParts.join(' ');
            }
        }

        if (value) {
            displayParts.push(value);
        }

        return {
            displayValue: displayParts.join(' '),
            inputValue,
            isReadOnly,
        };
    }

    private getFilterParameters(paramKey: string, paramValue: any): { param: string; filters: Filter.IFilter[] } {
        // Need to re-encode paramValue because it has already been decoded, and getFiltersFromUrl assumes that the
        // strings passed in are URL encoded. See Issue #34630 for more details.
        const param = `${paramKey}=${paramValue}`;
        const encodedParam = `${paramKey}=${encodeURIComponent(paramValue)}`;

        return {
            filters: Filter.getFiltersFromUrl(encodedParam, this.urlPrefix),
            param,
        };
    }

    actionValueFromFilter(filter: Filter.IFilter, label: string): ActionValue {
        const columnName = filter.getColumnName();
        const filterType = filter.getFilterType();
        const value = filter.getValue();
        const operator = resolveSymbol(filter.getFilterType());
        const { displayValue, isReadOnly, inputValue } = this.getDisplayValue(label ?? columnName, filterType, value);

        return {
            action: this,
            displayValue,
            isReadOnly,
            value: inputValue ? inputValue : `"${label ?? columnName}" ${operator} ${value}`,
            valueObject: filter,
        };
    }
}
