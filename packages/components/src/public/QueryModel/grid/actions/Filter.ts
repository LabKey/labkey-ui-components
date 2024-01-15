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
import { Map, Set } from 'immutable';
import { Filter, Utils } from '@labkey/api';

import { decodePart } from '../../../SchemaQuery';

import { JsonType } from '../../../../internal/components/domainproperties/PropDescType';

import { getColFormattedDateFilterValue } from '../../../../internal/util/Date';

import { QueryColumn } from '../../../QueryColumn';

import { Action, ActionValue } from './Action';
import { ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE } from '../../../../internal/query/filter';

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

/**
 * Given a symbol/suffix/text and a QueryColumn this will resolve the IFilterType based on the column
 * type matched against the symbol/suffix/text.
 * @param token
 * @param column
 * @returns {IFilterType}
 */
export function resolveFilterType(token: string, column: QueryColumn): Filter.IFilterType {
    if (SUFFIX_MAP.has(token)) {
        return SUFFIX_MAP.get(token);
    }

    if (token === ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE.getURLSuffix())
        return ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE;

    if (SYMBOL_MAP.has(token)) {
        const symbolTypes = SYMBOL_MAP.get(token);
        const types = Filter.getFilterTypesForType(column.getDisplayFieldJsonType() as JsonType);

        let value: Filter.IFilterType;
        let match = false;

        for (let i = 0; i < types.length; i++) {
            const suffix = getURLSuffix(types[i]);
            if (symbolTypes.has(suffix)) {
                if (match) {
                    console.warn(`Column of type "${column.jsonType}" has multiple filters for symbol "${token}".`);
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
    const symbol = filterType?.getDisplaySymbol();
    if (symbol) {
        return symbol;
    }

    const displayText = filterType?.getDisplayText();
    if (displayText) {
        return displayText;
    }

    return getURLSuffix(filterType);
}

export class FilterAction implements Action {
    iconCls = 'filter';
    keyword = 'filter';
    getFilterDisplayValue: (columnName: string, rawValue: string) => string;

    constructor(getFilterDisplayValue?: (columnName: string, rawValue: string) => string) {
        this.getFilterDisplayValue = getFilterDisplayValue;
    }

    private getDisplayValue(
        columnName: string,
        filterType: Filter.IFilterType,
        rawValue: string | string[]
    ): { displayValue: string; inputValue: string } {
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

        return { displayValue: displayParts.join(' '), inputValue };
    }

    actionValueFromFilter(filter: Filter.IFilter, column?: QueryColumn, isReadOnly?: string): ActionValue {
        const label = column?.shortCaption;
        const columnName = filter.getColumnName();
        const filterType = filter.getFilterType();
        const operator = resolveSymbol(filter.getFilterType());
        let value = filter.getValue();

        // Issue 45140: match date display format in grid filter status pill display
        if (column?.getDisplayFieldJsonType() === 'date') {
            value = getColFormattedDateFilterValue(column, value);
        }

        const { displayValue, inputValue } = this.getDisplayValue(label ?? columnName, filterType, value);

        return {
            action: this,
            displayValue,
            isReadOnly,
            value: inputValue ? inputValue : `"${label ?? columnName}" ${operator} ${value}`,
            valueObject: filter,
        };
    }
}
