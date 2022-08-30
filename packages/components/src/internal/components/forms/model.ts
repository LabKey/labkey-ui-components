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
import { List, Map, Record } from 'immutable';
import { Filter, Query } from '@labkey/api';

import { QueryInfo } from '../../../public/QueryInfo';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { ISelectRowsResult } from '../../query/api';

import { SelectInputOption } from './input/SelectInput';
import * as actions from './actions';
import { DELIMITER } from './constants';

export interface QuerySelectModelProps {
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
    schemaQuery: SchemaQuery;
    searchResults: Map<string, Map<string, any>>;
    selectedItems: Map<string, any>;
    selectedQuery: string;
    valueColumn: string;
}

export class QuerySelectModel
    extends Record({
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
    declare schemaQuery: SchemaQuery;
    declare searchResults: Map<string, Map<string, any>>;
    declare selectedQuery: string;
    declare selectedItems: Map<string, any>;
    declare valueColumn: string;

    formatSavedResults(data?: Map<string, Map<string, any>>, token?: string): SelectInputOption[] {
        return actions.formatSavedResults(this, data, token);
    }

    getSelectedOptions(): SelectInputOption | SelectInputOption[] {
        const options = actions.formatResults(this, this.selectedItems);

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

    saveSearchResults(data: Map<string, Map<string, any>>) {
        return actions.saveSearchResults(this, data);
    }

    setSelection(value: any) {
        return actions.setSelection(this, value);
    }

    search(input: any): Promise<ISelectRowsResult> {
        return actions.fetchSearchResults(this, input);
    }
}

export interface ISelectInitData {
    getSelectComponentId(): string;
    name: string;
    type: string;
}
