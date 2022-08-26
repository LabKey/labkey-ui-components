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
import { Filter, PermissionTypes, Security, User, Utils } from '@labkey/api';
import { fromJS, Map } from 'immutable';
import { useCallback, useEffect, useState } from 'react';

import { similaritySortFactory } from '../../util/similaritySortFactory';

import { QuerySelectModel, QuerySelectModelProps } from './model';
import {
    getQueryDetails,
    ISelectRowsResult,
    quoteValueColumnWithDelimiters,
    searchRows,
    selectRowsDeprecated, updateRows
} from '../../query/api';
import { parseCsvString } from '../../util/utils';
import {QueryInfo} from "../../../public/QueryInfo";
import {QuerySelectOwnProps} from "./QuerySelect";
import {SelectInputOption} from "./input/SelectInput";
import {resolveDetailFieldValue} from "./renderers";
import {naturalSortByProperty} from "../../../public/sort";
import {LoadingState} from "../../../public/LoadingState";
import {QueryModel} from "../../../public/QueryModel/QueryModel";

const emptyMap = Map<string, any>();

function initDisplayColumn(queryInfo: QueryInfo, column?: string): string {
    let displayColumn: string;

    if (column) {
        if (!queryInfo.getColumn(column)) {
            console.warn(
                `Unable to initialize QuerySelect for (${queryInfo.schemaName}.${queryInfo.name}). The "displayColumn" "${column}" does not exist.`
            );
        } else {
            displayColumn = column;
        }
    }

    // fallback to titleColumn
    if (!displayColumn) {
        displayColumn = queryInfo.titleColumn;
    }

    return displayColumn;
}

function getQueryColumnNames(model: QuerySelectModel): string[] {
    const { displayColumn, queryInfo, schemaQuery, valueColumn } = model;

    // Include PKs plus useful-to-search-over columns and append the grid view's column list
    const requiredColumns = queryInfo.pkCols.concat([displayColumn, valueColumn, 'Name', 'Description', 'Alias']);
    return queryInfo
        .getDisplayColumns(schemaQuery.viewName)
        .map(c => c.fieldKey)
        .concat(requiredColumns)
        .toArray();
}

export function initSelect(props: QuerySelectOwnProps): Promise<QuerySelectModel> {
    return new Promise((resolve, reject) => {
        const { containerFilter, containerPath, schemaQuery } = props;

        if (schemaQuery) {
            const { queryName, schemaName } = schemaQuery;

            getQueryDetails({ schemaName, queryName, containerPath })
                .then(queryInfo => {
                    const valueColumn = initValueColumn(queryInfo, props.valueColumn);
                    const displayColumn = initDisplayColumn(queryInfo, props.displayColumn);

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

                        selectRowsDeprecated({
                            columns: getQueryColumnNames(model),
                            containerFilter,
                            containerPath,
                            schemaName,
                            queryName,
                            filterArray: [filter],
                        }).then(data => {
                            const selectedItems = fromJS(quoteValueColumnWithDelimiters(data, props.valueColumn, props.delimiter).models[data.key]);

                            model = model.merge({
                                rawSelectedValue: props.value,
                                selectedItems,
                            }) as QuerySelectModel;

                            if (selectedItems.size) {
                                model = model.merge({
                                    allResults: model.allResults.merge(selectedItems),
                                    selectedQuery: parseSelectedQuery(model, selectedItems),
                                }) as QuerySelectModel;
                            }

                            if (props.fireQSChangeOnInit && Utils.isFunction(props.onQSChange)) {
                                let items: SelectInputOption | SelectInputOption[] = formatResults(
                                    model,
                                    model.selectedItems
                                );

                                // mimic ReactSelect in that it will return a single option if multiple is not true
                                if (props.multiple === false) {
                                    items = items[0];
                                }

                                props.onQSChange(props.name, model.rawSelectedValue, items, model.selectedItems);
                            }

                            // fire listener if given an initial value and a listener function
                            if (model.rawSelectedValue && Utils.isFunction(props.onInitValue)) {
                                props.onInitValue(model.rawSelectedValue, model.selectedItems.toList());
                            }

                            resolve(model);
                        });
                    } else {
                        resolve(model);
                    }
                })
                .catch(err => {
                    // TODO: Need better handling of errors
                    console.warn(err);
                    reject(err);
                });
        } else {
            resolve(undefined);
        }
    });
}

function initValueColumn(queryInfo: QueryInfo, column?: string): string {
    // determine 'valueColumn'
    let valueColumn: string;
    if (column) {
        valueColumn = column;

        if (!queryInfo.getColumn(valueColumn)) {
            throw `Unable to initialize QuerySelect for (${queryInfo.schemaName}.${queryInfo.name}). The "valueColumn" "${valueColumn}" does not exist.`;
        }
    } else {
        const pkCols = queryInfo.getPkCols();

        if (pkCols.size === 1) {
            valueColumn = pkCols.get(0).fieldKey;
        } else if (pkCols.size > 0) {
            throw (
                `Unable to initialize QuerySelect for (${queryInfo.schemaName}.${queryInfo.name}). Set "valueColumn" explicitly to any of ` +
                pkCols.map(col => col.fieldKey).join(', ')
            );
        } else {
            throw `Unable to initialize QuerySelect for (${queryInfo.schemaName}.${queryInfo.name}). Set "valueColumn" explicitly as this query does not have any primary keys.`;
        }
    }

    return valueColumn;
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
    return searchRows({
        containerFilter: model.containerFilter,
        containerPath: model.containerPath,
        schemaName: schemaQuery.getSchema(),
        queryName: schemaQuery.getQuery(),
        columns: getQueryColumnNames(model),
        filterArray: allFilters,
        sort: displayColumn,
        maxRows,
        includeTotalCount: 'f',
    }, filterVal, model.valueColumn, model.delimiter, addExactFilter ? displayColumn : undefined);
}

export function saveSearchResults(
    model: QuerySelectModel,
    searchResults: Map<string, Map<string, any>>
): QuerySelectModel {
    return model.merge({
        allResults: model.allResults.merge(searchResults),
        searchResults,
    }) as QuerySelectModel;
}

export function formatResults(model: QuerySelectModel, results: Map<string, any>, token?: string): SelectInputOption[] {
    if (!model.queryInfo || !results) {
        return [];
    }

    return results
        .map(result => ({
            label: (resolveDetailFieldValue(result.get(model.displayColumn)) ??
                resolveDetailFieldValue(result.get(model.valueColumn))) as string,
            value: result.getIn([model.valueColumn, 'value']),
        }))
        .sortBy(item => item.label, similaritySortFactory(token))
        .toArray();
}

/**
 * Given a model this method returns "options" that are consumable by a ReactSelect.
 * @param {QuerySelectModel} model for which results are formatted
 * @param {Map<string, Map<string, any>>} results can be optionally supplied to override model searchResults
 * @param {string} token an optional search token that will be used to sort the results
 */
export function formatSavedResults(
    model: QuerySelectModel,
    results?: Map<string, Map<string, any>>,
    token?: string
): SelectInputOption[] {
    const { queryInfo, selectedItems, searchResults } = model;

    if (!queryInfo) {
        return [];
    }

    const filteredResults = (results !== undefined ? results : searchResults)
        .filter((v, k) => !selectedItems.has(k))
        .toMap();

    return formatResults(model, filteredResults, token);
}

function getSelectedOptions(model: QuerySelectModel, value: any): Map<string, any> {
    // if no "value", just return currently selectedItems
    if (value === undefined || value === null || value === '') {
        return emptyMap;
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

export function setSelection(model: QuerySelectModel, rawSelectedValue: any): QuerySelectModel {
    const selectedItems = getSelectedOptions(model, rawSelectedValue);

    return model.merge({
        rawSelectedValue,
        selectedItems,
        selectedQuery: parseSelectedQuery(model, selectedItems),
    }) as QuerySelectModel;
}

// "selectedQuery" should match against displayColumn as that is what the user is typing against
export function parseSelectedQuery(model: QuerySelectModelProps, data: Map<string, Map<string, any>>): any {
    return data.map(result => result.getIn([model.displayColumn, 'value'])).join(model.delimiter);
}

// "target" is not typed as an Element in base TypeScript library due to non-DOM events
// Not exactly correct typings but suffices for the usages below
// https://stackoverflow.com/q/28900077
interface ITargetElementEvent {
    keyCode: number;
    preventDefault(): void;
    target: HTMLInputElement;
}

export function handleInputTab(evt: ITargetElementEvent): void {
    if (evt.keyCode === 9) {
        // tab
        const element = evt.target;
        evt.preventDefault();
        const s = element.selectionStart;
        element.value = element.value.substring(0, s) + '\t' + element.value.substring(element.selectionEnd);
        element.selectionEnd = s + 1;
    }
}

export function handleTabKeyOnTextArea(evt: ITargetElementEvent): void {
    if (evt && evt.target && evt.target.type === 'textarea') {
        handleInputTab(evt);
    }
}

/**
 * Retrieve users in current container with a given set of permissions.  If no permission is specified, defaults to Read
 * permission
 * @param permissions the PermissionType or array of PermissionType values that all users must have.
 * @param containerPath the path of the container to request user permissions from. If not specified, then it defaults
 * to the page context's container.
 */
export function getUsersWithPermissions(
    permissions: string | string[] = PermissionTypes.Read,
    containerPath?: string
): Promise<User[]> {
    return new Promise((resolve, reject) => {
        return Security.getUsersWithPermissions({
            containerPath,
            permissions,
            success: ({ users }) => {
                users.sort(naturalSortByProperty('displayName'));
                resolve(users);
            },
            failure: response => {
                console.error('There was a problem retrieving users with permissions ', permissions, response);
                reject('There was a problem retrieving users with the given permissions');
            },
        });
    });
}

export type UsersLoader = (permissions: string | string[], containerPath?: string) => Promise<User[]>;

interface UsersState {
    error: string;
    loadingState: LoadingState;
    users: User[];
}

export function useUsersWithPermissions(
    permissions: string | string[] = PermissionTypes.Read,
    containerPath?: string,
    loader: UsersLoader = getUsersWithPermissions
): UsersState {
    const [users, setUsers_] = useState<User[]>(undefined);
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [error, setError] = useState<string>(undefined);
    const load = useCallback(async () => {
        setLoadingState(LoadingState.LOADING);

        try {
            const users_ = await loader(permissions, containerPath);
            setUsers_(users_);
        } catch (e) {
            setError(e);
        } finally {
            setLoadingState(LoadingState.LOADED);
        }
    }, [containerPath, loader, permissions]);

    useEffect(() => {
        load();
    }, [load]);

    return { error, loadingState, users };
}

export function updateRowFieldValue(model: QueryModel, name: string, value: any): Promise<any> {
    return updateRows({
        schemaQuery: model.schemaQuery,
        rows: [
            {
                rowId: model.getRowValue('rowId'),
                [name]: value,
            },
        ],
    });
}
