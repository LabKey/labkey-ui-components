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
import { fromJS, List, Map, OrderedMap, Record as ImmutableRecord } from 'immutable';
import { Filter, Query, Utils } from '@labkey/api';

import { QueryInfo } from '../../../public/QueryInfo';

import { SchemaQuery } from '../../../public/SchemaQuery';

import {
    getQueryDetails,
    ISelectRowsResult,
    quoteValueColumnWithDelimiters,
    searchRows,
    selectRowsDeprecated,
} from '../../query/api';
import { similaritySortFactory } from '../../util/similaritySortFactory';
import { parseCsvString } from '../../util/utils';

import { SelectInputOption } from './input/SelectInput';
import { DELIMITER } from './constants';
import { QuerySelectOwnProps } from './QuerySelect';
import { resolveDetailFieldLabel, resolveDetailFieldValue } from './utils';

function formatResults(model: QuerySelectModel, results: Map<string, any>, token?: string): SelectInputOption[] {
    const { displayColumn, queryInfo, valueColumn } = model;

    if (!queryInfo || !results) {
        return [];
    }

    let options = results.map(result => {
        return {
            label: (resolveDetailFieldLabel(result.get(displayColumn)) ??
                resolveDetailFieldLabel(result.get(valueColumn))) as string,
            value: resolveDetailFieldValue(result.get(valueColumn)),
        };
    });

    // Issue 46618: If a sort key is applied, then skip sorting on the client to retain sort done on server.
    if (!queryInfo.getColumn(displayColumn)?.hasSortKey) {
        options = options.sortBy(item => item.label, similaritySortFactory(token));
    }

    return options.toArray();
}

/**
 * Given a model this method returns "options" that are consumable by a ReactSelect.
 * @param model for which results are formatted
 * @param result select rows result
 * @param token an optional search token that will be used to sort the results
 */
export function formatSavedResults(model: QuerySelectModel, result: ISelectRowsResult, token?: string): SelectInputOption[] {
    const { queryInfo, selectedItems } = model;

    if (!queryInfo) {
        return [];
    }

    const { key, orderedModels } = result;
    const models = fromJS(result.models[key]);
    const filteredResults = orderedModels[key]
        .filter(k => !selectedItems.has(k))
        .reduce((ordered, k) => ordered.set(k, models.get(k)), OrderedMap<string, any>());

    return formatResults(model, filteredResults, token);
}

export function saveSearchResults(model: QuerySelectModel, result: ISelectRowsResult): QuerySelectModel {
    const { key } = result;
    const searchResults = fromJS(result.models[key]);

    return model.merge({
        allResults: model.allResults.merge(searchResults),
        searchResults,
    }) as QuerySelectModel;
}

function getSelectedOptions(model: QuerySelectModel, value: any): Map<string, any> {
    // if no "value", just return currently selectedItems
    if (value === undefined || value === null || value === '') {
        return Map<string, any>();
    }

    const keyPath = [model.valueColumn, 'value'];
    const sources = model.allResults.merge(model.selectedItems);

    // multi-value case
    if (model.multiple === true) {
        const values = parseCsvString(value.toString(), model.delimiter);
        return sources
            .filter(result => {
                const resultValue = result.getIn(keyPath);
                return resultValue !== undefined && values.includes(resultValue.toString());
            })
            .toMap();
    }

    // single-value case
    return sources.filter(source => source.getIn(keyPath) === value).toMap();
}

// "selectedQuery" should match against displayColumn as that is what the user is typing against
export function parseSelectedQuery(model: QuerySelectModelProps, data: Map<string, Map<string, any>>): any {
    return data.map(result => result.getIn([model.displayColumn, 'value'])).join(model.delimiter);
}

export function setSelection(model: QuerySelectModel, rawSelectedValue: any): QuerySelectModel {
    const selectedItems = getSelectedOptions(model, rawSelectedValue);

    return model.merge({
        rawSelectedValue,
        selectedItems,
        selectedQuery: parseSelectedQuery(model, selectedItems),
    }) as QuerySelectModel;
}

export function fetchSearchResults(model: QuerySelectModel, input: any): Promise<ISelectRowsResult> {
    const { addExactFilter, displayColumn, maxRows, queryFilters, schemaQuery, selectedItems, valueColumn } = model;

    let allFilters = [];
    const filterVal = input.trim();

    // fetch additional options and exclude previously selected so user can see more
    if (model.multiple) {
        const excluded = selectedItems.map(row => row.getIn([valueColumn, 'value'])).toList();

        if (excluded.size) {
            if (excluded.size === 1) {
                allFilters.push(Filter.create(valueColumn, excluded.first(), Filter.Types.NOT_EQUAL));
            } else {
                allFilters.push(Filter.create(valueColumn, excluded.toArray(), Filter.Types.NOT_IN));
            }
        }
    }

    if (queryFilters) {
        allFilters = allFilters.concat(queryFilters.toArray());
    }

    // 35112: Explicitly request exact matches -- can be disabled via QuerySelectModel.addExactFilter = false
    return searchRows(
        {
            containerFilter: model.containerFilter,
            containerPath: model.containerPath,
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            viewName: schemaQuery.viewName,
            columns: model.queryColumnNames,
            filterArray: allFilters,
            sort: displayColumn,
            maxRows,
            includeTotalCount: 'f',
        },
        filterVal,
        model.valueColumn,
        model.delimiter,
        addExactFilter ? displayColumn : undefined
    );
}

function initValueColumn(queryInfo: QueryInfo, column?: string): string {
    // determine 'valueColumn'
    let valueColumn: string;
    if (column) {
        valueColumn = column;

        if (!queryInfo.getColumn(valueColumn)) {
            throw new Error(`Unable to initialize QuerySelect for (${queryInfo.schemaName}.${queryInfo.name}). The "valueColumn" "${valueColumn}" does not exist.`);
        }
    } else {
        const pkCols = queryInfo.getPkCols();

        if (pkCols.length === 1) {
            valueColumn = pkCols[0].fieldKey;
        } else if (pkCols.length > 0) {
            throw new Error(
                `Unable to initialize QuerySelect for (${queryInfo.schemaName}.${queryInfo.name}). Set "valueColumn" explicitly to any of ` +
                pkCols.map(col => col.fieldKey).join(', ')
            );
        } else {
            throw new Error(`Unable to initialize QuerySelect for (${queryInfo.schemaName}.${queryInfo.name}). Set "valueColumn" explicitly as this query does not have any primary keys.`);
        }
    }

    return valueColumn;
}

function initDisplayColumn(queryInfo: QueryInfo, valueColumn: string, column?: string): string {
    let displayColumn: string;

    if (column) {
        if (!queryInfo.getColumn(column)) {
            console.warn(
                `Unable to initialize QuerySelect for (${queryInfo.schemaName}.${queryInfo.name}). The display column "${column}" does not exist.`
            );
        } else {
            displayColumn = column;
        }
    }

    // fallback to titleColumn
    if (!displayColumn && queryInfo.titleColumn && queryInfo.getColumn(queryInfo.titleColumn)) {
        displayColumn = queryInfo.titleColumn;
    }

    // fallback to valueColumn
    if (!displayColumn) {
        displayColumn = valueColumn;
    }

    return displayColumn;
}

export async function initSelect(props: QuerySelectOwnProps): Promise<QuerySelectModel> {
    const { containerFilter, containerPath, schemaQuery, queryFilters } = props;
    const { queryName, schemaName, viewName } = schemaQuery;
    const filters = queryFilters ? queryFilters.toArray() : [];

    const queryInfo = await getQueryDetails({ containerPath, schemaQuery });
    const valueColumn = initValueColumn(queryInfo, props.valueColumn);
    const displayColumn = initDisplayColumn(queryInfo, valueColumn, props.displayColumn);

    let model = new QuerySelectModel({
        ...props,
        displayColumn,
        isInit: true,
        queryInfo,
        valueColumn,
    });

    if (props.value !== undefined && props.value !== null) {
        let filter: Filter.IFilter;

        if (props.multiple) {
            if (Array.isArray(props.value)) {
                filter = Filter.create(valueColumn, props.value, Filter.Types.IN);
            } else if (typeof props.value === 'string') {
                // Allow for setting multiValue value.
                // This requires updating the filter and the string
                filter = Filter.create(
                    valueColumn,
                    parseCsvString(props.value, props.delimiter, true),
                    Filter.Types.IN
                );
            }
        }

        if (!filter) {
            filter = Filter.create(valueColumn, props.value);
        }
        filters.push(filter);

        const data = await selectRowsDeprecated({
            columns: model.queryColumnNames,
            containerFilter,
            containerPath,
            filterArray: filters,
            queryName,
            schemaName,
            viewName,
        });

        const selectedItems = fromJS(
            quoteValueColumnWithDelimiters(data, props.valueColumn, props.delimiter).models[data.key]
        );

        model = model.merge({ rawSelectedValue: props.value, selectedItems }) as QuerySelectModel;

        if (selectedItems.size) {
            model = model.merge({
                allResults: model.allResults.merge(selectedItems),
                selectedQuery: parseSelectedQuery(model, selectedItems),
            }) as QuerySelectModel;
        }

        if (props.fireQSChangeOnInit && Utils.isFunction(props.onQSChange)) {
            let selectOptions: SelectInputOption | SelectInputOption[] = formatResults(model, model.selectedItems);

            // mimic ReactSelect in that it will return a single option if multiple is not true
            if (props.multiple === false) {
                selectOptions = selectOptions[0];
            }

            props.onQSChange(props.name, model.rawSelectedValue, selectOptions, props, model.selectedItems);
        }

        // fire listener if given an initial value and a listener function
        if (model.rawSelectedValue) {
            props.onInitValue?.(model.rawSelectedValue, model.selectedItems.toList());
        }
    }

    return model;
}

export interface QuerySelectModelProps {
    addExactFilter: boolean;
    allResults: Map<string, Map<string, any>>;
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    delimiter: string;
    displayColumn: string;
    isInit: boolean;
    maxRows: number;
    multiple: boolean;
    queryFilters: List<Filter.IFilter>;
    queryInfo: QueryInfo;
    rawSelectedValue: any;
    requiredColumns: string[];
    schemaQuery: SchemaQuery;
    searchResults: Map<string, Map<string, any>>;
    selectedItems: Map<string, any>;
    selectedQuery: string;
    valueColumn: string;
}

export class QuerySelectModel
    extends ImmutableRecord({
        addExactFilter: true,
        allResults: Map<string, Map<string, any>>(),
        containerFilter: undefined,
        containerPath: undefined,
        displayColumn: undefined,
        delimiter: DELIMITER,
        isInit: false,
        maxRows: 20,
        multiple: false,
        queryFilters: undefined,
        queryInfo: undefined,
        rawSelectedValue: undefined,
        requiredColumns: [],
        schemaQuery: undefined,
        searchResults: Map<string, Map<string, any>>(),
        selectedQuery: '',
        selectedItems: Map<string, any>(),
        valueColumn: undefined,
    })
    implements QuerySelectModelProps
{
    declare addExactFilter: boolean;
    declare allResults: Map<string, Map<string, any>>;
    declare containerFilter: Query.ContainerFilter;
    declare containerPath: string;
    declare displayColumn: string;
    declare delimiter: string;
    declare isInit: boolean;
    declare maxRows: number;
    declare multiple: boolean;
    declare queryFilters: List<Filter.IFilter>;
    declare queryInfo: QueryInfo;
    declare rawSelectedValue: any;
    declare requiredColumns: string[];
    declare schemaQuery: SchemaQuery;
    declare searchResults: Map<string, Map<string, any>>;
    declare selectedQuery: string;
    declare selectedItems: Map<string, any>;
    declare valueColumn: string;

    get selectedOptions(): SelectInputOption | SelectInputOption[] {
        const options = formatResults(this, this.selectedItems);

        if (this.multiple) {
            return options;
        } else if (options.length === 1) {
            return options[0];
        } else if (options.length > 1) {
            console.warn(
                'QuerySelect.getSelectedOptions: There are multiple options available, but model does not allow multiple selections.'
            );
        }

        return undefined;
    }

    get queryColumnNames(): string[] {
        const { displayColumn, queryInfo, requiredColumns, valueColumn } = this;
        const queryColumns = queryInfo.pkCols.concat([displayColumn, valueColumn].concat(requiredColumns));
        const lookupViewColumns = queryInfo.getLookupViewColumns();

        if (lookupViewColumns.length > 0) {
            return lookupViewColumns.map(c => c.fieldKey).concat(queryColumns);
        }

        return queryColumns;
    }
}

export interface ISelectInitData {
    getSelectComponentId(): string;
    name: string;
    type: string;
}
