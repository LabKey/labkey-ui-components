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
import { List } from 'immutable';

import { parseColumns, resolveFieldKey } from '../utils';
import { QueryColumn } from '../../base/models/model';

import { Action, ActionOption, ActionValue, Value } from './Action';
import { QuerySort } from '../../..';

export class SortAction implements Action {
    iconCls = 'sort';
    param = 'sort';
    keyword = 'sort';
    optionalLabel = 'columns';
    separator = ',';
    getColumns: (all?: boolean) => List<QueryColumn>;

    constructor(urlPrefix: string, getColumns: () => List<QueryColumn>) {
        this.getColumns = getColumns;

        if (urlPrefix) {
            this.param = [urlPrefix, this.param].join('.');
        }
    }

    static parseTokens(
        tokens: string[],
        columns: List<QueryColumn>
    ): { columnName: string; dir: string; column?: QueryColumn } {
        const options = {
            column: undefined,
            columnName: undefined,
            dir: undefined,
        };

        if (tokens.length > 0) {
            options.columnName = tokens[0];

            // see if the column is in our current domain
            const column = parseColumns(columns, options.columnName).first();
            if (column) {
                options.column = column;
            }
        }

        if (tokens.length > 1 && tokens[1].length > 0) {
            options.dir = tokens[1].toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        }

        return options;
    }

    // e.g. inputValue - "Name ASC" or "Some/Column DESC"
    completeAction(tokens: string[]): Promise<Value> {
        return new Promise(resolve => {
            const { column, columnName, dir } = SortAction.parseTokens(tokens, this.getColumns());
            // resolveFieldKey because of Issue 34627
            const fieldKey = column ? resolveFieldKey(columnName, column) : columnName;
            const paramDir = dir === 'DESC' ? '-' : '';
            resolve({
                displayValue: column ? column.shortCaption : fieldKey,
                isValid: !!fieldKey,
                param: `${paramDir}${fieldKey}`,
                value: `${fieldKey} ${dir === 'DESC' ? 'DESC' : 'ASC'}`,
                valueObject: new QuerySort({dir: paramDir, fieldKey}),
            });
        });
    }

    fetchOptions(tokens: string[]): Promise<ActionOption[]> {
        return new Promise(resolve => {
            const columns = this.getColumns();
            const options = SortAction.parseTokens(tokens, columns);
            const results: ActionOption[] = [];

            // user has a chosen column
            if (options.column) {
                const ASC = {
                    label: `"${options.column.shortCaption}" asc`,
                    value: 'asc',
                    isComplete: true,
                };
                const DESC = {
                    label: `"${options.column.shortCaption}" desc`,
                    value: 'desc',
                    isComplete: true,
                };

                if (options.dir) {
                    if (ASC.value.toLowerCase().indexOf(options.dir.toLowerCase()) == 0) {
                        results.push(ASC);
                    } else if (DESC.value.toLowerCase().indexOf(options.dir.toLowerCase()) == 0) {
                        results.push(DESC);
                    } else {
                        // leave results empty
                    }
                } else {
                    results.push(ASC);
                    results.push(DESC);
                }
            } else if (columns.size > 0) {
                let columnSet: List<QueryColumn>;

                if (options.columnName) {
                    columnSet = columns
                        .filter(c => c.name.toLowerCase().indexOf(options.columnName.toLowerCase()) === 0)
                        .toList();
                } else {
                    columnSet = columns.filter(c => c.sortable === true).toList();
                }

                columnSet.forEach(c => {
                    results.push({
                        label: `"${c.shortCaption}" ...`,
                        value: `"${c.shortCaption}"`,
                        isComplete: false,
                    });
                });
            }

            resolve(results);
        });
    }

    buildParams(actionValues: ActionValue[]): Array<{ paramKey: string; paramValue: string }> {
        let paramValue = '',
            sep = '';

        for (let i = 0; i < actionValues.length; i++) {
            paramValue += sep + actionValues[i].param;
            sep = this.separator;
        }

        return [
            {
                paramKey: this.param,
                paramValue,
            },
        ];
    }

    matchParam(paramKey: string, paramValue: any): boolean {
        return paramKey && paramKey === this.param;
    }

    parseParam(paramKey: string, paramValue: any, columns: List<QueryColumn>): string[] | Value[] {
        let columnName,
            dir,
            params = paramValue.split(this.separator),
            raw;

        return params.map(param => {
            raw = param.trim();

            if (raw.length > 0) {
                dir = raw.indexOf('-') === 0 ? 'DESC' : 'ASC';
                columnName = dir === 'DESC' ? raw.slice(1) : raw;
                const column = parseColumns(columns, columnName).first();
                const columnLabel = column ? column.shortCaption : columnName;

                return {
                    displayValue: columnLabel,
                    param: raw,
                    value: columnName + ' ' + dir.toLowerCase(),
                };
            }
        });
    }
}
