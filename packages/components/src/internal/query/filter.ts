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
import { getNextDateStr } from "../util/Date";

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

function getDateStrRange(dateStr: string): string[] {

    let datePart : string;
    if (dateStr.match(/^\s*(\d\d\d\d)-(\d\d)-(\d\d)\s*$/)) {
        datePart = dateStr;
    }else if (dateStr.match(/^\s*(\d\d\d\d)-(\d\d)-(\d\d)\s*(\d\d):(\d\d)\s*$/)) {
        datePart = dateStr.split("\s")[0];
    }

    if (!datePart)
        return [dateStr, dateStr];

    return ["'" + dateStr + "'", "'" + getNextDateStr(dateStr) + "'"];
}

// for date (not datetime) field, ignore the time portion and do date only comparison
export function getDateFieldLabKeySql(filter: Filter.IFilter): string {
    const filterType = filter.getFilterType();
    const columnNameSelect = getColumnSelect(filter.getColumnName());

    let startDateStart, startDateEnd, endDateStart, endDateEnd : string;
    const urlSuffix = filterType.getURLSuffix();
    if (filterType.isDataValueRequired()) {
        if (filterType.isMultiValued()) {
            const values = filterType.parseValue(filter.getValue());
            [startDateStart, startDateEnd] = getDateStrRange(values[0]);
            if (values.length > 1) {
                [endDateStart, endDateEnd] = getDateStrRange(values[1]);
            }
        } else {
            [startDateStart, startDateEnd] = getDateStrRange(filter.getValue());
        }

        if (urlSuffix ===  Filter.Types.DATE_EQUAL.getURLSuffix()) {
            return "(" + columnNameSelect + " >= " + startDateStart + " AND " + columnNameSelect + " < " + startDateEnd + ")";
        } else if (urlSuffix ===  Filter.Types.DATE_NOT_EQUAL.getURLSuffix()) {
            return "(" + columnNameSelect + " < " + startDateStart + " OR " + columnNameSelect + " >= " + startDateEnd + ")";
        }
        else if (urlSuffix ===  Filter.Types.BETWEEN.getURLSuffix()) {
            return "(" + columnNameSelect + " >= " + startDateStart + " AND " + columnNameSelect + " < " + endDateEnd + ")";
        }
        else if (urlSuffix ===  Filter.Types.NOT_BETWEEN.getURLSuffix()) {
            return "(" + columnNameSelect + " < " + startDateStart + " OR " + columnNameSelect + " >= " + endDateEnd + ")";
        }
        else if (urlSuffix ===  Filter.Types.DATE_GREATER_THAN.getURLSuffix()) {
            return "(" + columnNameSelect + " >= " + startDateEnd + ")";
        }
        else if (urlSuffix ===  Filter.Types.DATE_LESS_THAN.getURLSuffix()) {
            return "(" + columnNameSelect + " < " + startDateStart + ")";
        }
        else if (urlSuffix ===  Filter.Types.DATE_GREATER_THAN_OR_EQUAL.getURLSuffix()) {
            return "(" + columnNameSelect + " >= " + startDateStart + ")";
        }
        else if (urlSuffix ===  Filter.Types.DATE_LESS_THAN_OR_EQUAL.getURLSuffix()) {
            return "(" + columnNameSelect + " < " + startDateEnd + ")";
        }
    }

    if (filterType.getLabKeySqlOperator() && !filterType.isDataValueRequired()) {
        return columnNameSelect + ' ' + filterType.getLabKeySqlOperator();
    }

    return null;
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

    if (jsonType === 'date' && filterType.isDataValueRequired()) {
        let dateValue : string;
        if (filterType.isMultiValued()) {
            const values = filterType.parseValue(filter.getValue());
            if (values.length > 1) {
                dateValue = values[0];
            }
        } else {
            dateValue = filter.getValue();
        }

        if (dateValue?.match(/^\s*(\d\d\d\d)-(\d\d)-(\d\d)\s*$/)) {
            // for date (not datetime) field, ignore the time portion and do date only comparison
            return getDateFieldLabKeySql(filter);
        }
    }

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
            const negate = filterType.getURLSuffix() === Filter.Types.NOT_IN.getURLSuffix();
            const includeNull = values.indexOf(null) > -1 || values.indexOf('') > -1;
            values.forEach(val => {
                sqlValues.push(getLabKeySqlValue(val, jsonType));
            });

            operatorSql = '(' + columnNameSelect + ' ' + (negate ? 'NOT ' : '') + 'IN (' + sqlValues.join(', ') + ')';

            if (includeNull) {
                if (negate) {
                    operatorSql = operatorSql + ' AND ' + columnNameSelect + ' IS NOT NULL)';
                } else {
                    operatorSql = operatorSql + ' OR ' + columnNameSelect + ' IS NULL)';
                }
            } else {
                if (negate) {
                    operatorSql = operatorSql + ' OR ' + columnNameSelect + ' IS NULL)';
                } else {
                    operatorSql = operatorSql + ')';
                }
            }

            return operatorSql;
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
