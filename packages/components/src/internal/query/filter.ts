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
import { Filter } from '@labkey/api';

import { JsonType } from '../components/domainproperties/PropDescType';
import { FieldFilter } from '../components/search/models';

export function isEqual(first: List<Filter.IFilter>, second: List<Filter.IFilter>): boolean {
    if (first.size !== second.size) {
        return false;
    }

    let isEqual = true;
    first.forEach((f: Filter.IFilter, i: number) => {
        const s = second.get(i);
        if (f === undefined) {
            if (s !== undefined) {
                isEqual = false;
                return false;
            }
        }

        if (s === undefined) {
            isEqual = false;
            return false;
        }

        if (f.getURLParameterName() !== s.getURLParameterName()) {
            isEqual = false;
            return false;
        } else if (JSON.stringify(f.getURLParameterValue()) !== JSON.stringify(s.getURLParameterValue())) {
            isEqual = false;
            return false;
        }
    });

    return isEqual;
}

function getColumnSelect(columnName: string): string {
    const columnNameParts = columnName.split('/');
    const formattedParts = [];
    columnNameParts.forEach(part => {
        if (part) {
            formattedParts.push('"' + part.replace('"', '""') + '"');
        }
    });

    return formattedParts.join('.');
}

function getLabKeySqlValue(value: any, jsonType: JsonType): any {
    if (jsonType === 'string' || jsonType === 'date') {
        return "'" + value.toString().replace("'", "''") + "'";
    }

    if (jsonType === 'boolean')
        return value?.toLowerCase() === 'true' || value?.toLowerCase() === 'yes' || value?.toLowerCase() === 'on'
            ? 'TRUE'
            : 'FALSE';

    return value;
}

/**
 * Note: this is an experimental API that may change unexpectedly in future releases.
 * From a filter and its column jsonType, return the LabKey sql operator clause
 * @param filter The Filter
 * @param jsonType The json type ("string", "int", "float", "date", or "boolean") of the field
 * @return labkey sql fragment
 */
export function getLabKeySql(filter: Filter.IFilter, jsonType: JsonType): string {
    const filterType = filter.getFilterType();

    const columnNameSelect = getColumnSelect(filter.getColumnName());

    let operatorSql = null;

    if (filterType.getURLSuffix() === Filter.Types.HAS_ANY_VALUE.getURLSuffix()) return null;

    if (filterType.getLabKeySqlOperator()) {
        if (!filterType.isDataValueRequired()) operatorSql = filterType.getLabKeySqlOperator();
        else operatorSql = filterType.getLabKeySqlOperator() + ' ' + getLabKeySqlValue(filter.getValue(), jsonType);
    } else if (filterType.isMultiValued()) {
        const values = filterType.parseValue(filter.getValue());

        if (
            filterType.getURLSuffix() === Filter.Types.IN.getURLSuffix() ||
            filterType.getURLSuffix() === Filter.Types.NOT_IN.getURLSuffix()
        ) {
            const sqlValues = [];
            values.forEach(val => {
                sqlValues.push(getLabKeySqlValue(val, jsonType));
            });

            operatorSql =
                (filterType.getURLSuffix() === Filter.Types.NOT_IN.getURLSuffix() ? 'NOT ' : '') +
                'IN (' +
                sqlValues.join(', ') +
                ')';
        } else if (
            filterType.getURLSuffix() === Filter.Types.BETWEEN.getURLSuffix() ||
            filterType.getURLSuffix() === Filter.Types.NOT_BETWEEN.getURLSuffix()
        ) {
            operatorSql =
                (filterType.getURLSuffix() === Filter.Types.NOT_BETWEEN.getURLSuffix() ? 'NOT ' : '') +
                'BETWEEN ' +
                getLabKeySqlValue(values[0], jsonType) +
                ' AND ' +
                getLabKeySqlValue(values[1], jsonType);
        }
    } else if (filterType.getURLSuffix() === Filter.Types.NEQ_OR_NULL.getURLSuffix()) {
        return (
            '(' +
            columnNameSelect +
            ' ' +
            Filter.Types.ISBLANK.getLabKeySqlOperator() +
            ' OR ' +
            columnNameSelect +
            ' ' +
            Filter.Types.NOT_EQUAL.getLabKeySqlOperator() +
            ' ' +
            getLabKeySqlValue(filter.getValue(), jsonType) +
            ')'
        );
    }

    if (operatorSql) return columnNameSelect + ' ' + operatorSql;

    return null;
}
