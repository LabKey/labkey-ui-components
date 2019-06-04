/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map, Record } from 'immutable'
import { Filter } from '@labkey/api'
import { QueryInfo, SchemaQuery } from '@glass/base'

import { ISelectRowsResult } from '../../query/api'
import { DELIMITER } from './input/SelectInput'
import * as actions from './actions'

// This is the same as ReactSelect Option
export interface ReactSelectOption {
    label: string
    value: any
}

export interface QuerySelectModelProps {
    allResults: Map<string, Map<string, any>>
    displayColumn: string
    delimiter: string
    id: string
    isInit: boolean
    maxRows: number
    multiple: boolean
    preLoad: boolean
    queryFilters: List<Filter.IFilter>
    queryInfo: QueryInfo
    rawSelectedValue: any
    schemaQuery: SchemaQuery
    searchResults: Map<string, Map<string, any>>
    selectedQuery: string
    selectedItems: Map<string, any>
    valueColumn: string
}

export class QuerySelectModel extends Record({
    addExactFilter: true,
    allResults: Map<string, Map<string, any>>(),
    displayColumn: undefined,
    delimiter: DELIMITER,
    id: undefined,
    isInit: false,
    maxRows: 20,
    multiple: false,
    preLoad: false,
    queryFilters: undefined,
    queryInfo: undefined,
    rawSelectedValue: undefined,
    schemaQuery: undefined,
    searchResults: Map<string, Map<string, any>>(),
    selectedQuery: '',
    selectedItems: Map<string, any>(),
    valueColumn: undefined
}) implements QuerySelectModelProps {
    addExactFilter: boolean;
    allResults: Map<string, Map<string, any>>;
    displayColumn: string;
    delimiter: string;
    id: string;
    isInit: boolean;
    maxRows: number;
    multiple: boolean;
    preLoad: boolean;
    queryFilters: List<Filter.IFilter>;
    queryInfo: QueryInfo;
    rawSelectedValue: any;
    schemaQuery: SchemaQuery;
    searchResults: Map<string, Map<string, any>>;
    selectedQuery: string;
    selectedItems: Map<string, any>;
    valueColumn: string;

    constructor(values?: Partial<QuerySelectModelProps>) {
        super(values);
    }

    formatSavedResults(data?: Map<string, Map<string, any>>, token?: string): Array<ReactSelectOption> {
        return actions.formatSavedResults(this, data, token);
    }

    getSelectedOptions(): ReactSelectOption | Array<ReactSelectOption> {
        const options = actions.formatResults(this, this.selectedItems);

        if (this.multiple) {
            return options;
        }
        else if (options.length === 1) {
            return options[0];
        }
        else if (options.length > 1) {
            console.warn('QuerySelect.getSelectedOptions: There are more than one options available, however, must in in "multiple" mode.');
        }

        return undefined;
    }

    parseSearch(input: any): boolean | string {
        return actions.selectShouldSearch(this, input);
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
    name: string
    type: string
    getSelectComponentId(): string
}