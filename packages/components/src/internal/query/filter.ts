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
import {
    getNDaysStrFromToday,
    getNextDateStr,
    getParsedRelativeDateStr,
    isRelativeDateFilterValue,
} from '../util/Date';

const QUERY_KEY_CHAR_DECODED = ['$', '/', '&', '}', '~', ',', '.'];
const QUERY_KEY_CHAR_ENCODED = ['$D', '$S', '$A', '$B', '$T', '$C', '$P'];

export const CONCEPT_COLUMN_FILTER_TYPES = [
    Filter.Types.HAS_ANY_VALUE,
    Filter.Types.EQUAL,
    Filter.Types.NEQ_OR_NULL,
    Filter.Types.ISBLANK,
    Filter.Types.NONBLANK,
    Filter.Types.IN,
    Filter.Types.NOT_IN,
    Filter.Types.ONTOLOGY_IN_SUBTREE,
    Filter.Types.ONTOLOGY_NOT_IN_SUBTREE,
];

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

export function getLegalIdentifier(columnName: string, tableAlias?: string): string {
    const columnNameParts = columnName.split('/');
    const formattedParts = [];
    columnNameParts.forEach(part => {
        if (part) {
            let decodedPart = part.replace(/"/g, '""');
            QUERY_KEY_CHAR_ENCODED.forEach((encoded, ind) => {
                const reg = new RegExp('\\' + encoded, 'g');
                decodedPart = decodedPart.replace(reg, QUERY_KEY_CHAR_DECODED[ind]);
            });
            formattedParts.push('"' + decodedPart + '"');
        }
    });

    let columnSelect = formattedParts.join('.');
    if (tableAlias) columnSelect = tableAlias + '.' + columnSelect;
    return columnSelect;
}

function getLabKeySqlValue(value: any, jsonType: JsonType, suppressQuote?: boolean): any {
    if (jsonType === 'string' || jsonType === 'date' || jsonType === 'time') {
        const quote = suppressQuote ? '' : "'";
        return quote + value.toString().replace(/'/g, "''") + quote;
    }

    if (jsonType === 'boolean')
        return value?.toLowerCase() === 'true' || value?.toLowerCase() === 'yes' || value?.toLowerCase() === 'on'
            ? 'TRUE'
            : 'FALSE';

    return value;
}

/**
 * @returns [effectiveDate 00:00:00, effectiveDate+1 00:00:00]. end timestamp should be exclusive
 * @param dateStr the timestamp of the effective date, can be anytime in the day
 */
function getDateStrRange(dateStr: string): string[] {
    let datePart: string;
    if (dateStr.match(/^\s*(\d\d\d\d)-(\d\d)-(\d\d)\s*$/)) {
        datePart = dateStr;
    } else if (dateStr.match(/^\s*(\d\d\d\d)-(\d\d)-(\d\d)\s*(\d\d):(\d\d)\s*$/)) {
        datePart = dateStr.split('s')[0];
    } else if (isRelativeDateFilterValue(dateStr)) {
        const { days, positive } = getParsedRelativeDateStr(dateStr);
        datePart = getNDaysStrFromToday(days * (positive ? 1 : -1));
    }

    if (!datePart) return [dateStr, dateStr];

    return ["'" + datePart + "'", "'" + getNextDateStr(datePart) + "'"];
}

// for date (not datetime) field, ignore the time portion and do date only comparison
export function getDateFieldLabKeySql(filter: Filter.IFilter, tableAlias?: string): string {
    const filterType = filter.getFilterType();
    const columnNameSelect = getLegalIdentifier(filter.getColumnName(), tableAlias);

    let startDateStart, startDateEnd, endDateStart, endDateEnd: string;
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

        if (urlSuffix === Filter.Types.DATE_EQUAL.getURLSuffix()) {
            return (
                '(' +
                columnNameSelect +
                ' >= ' +
                startDateStart +
                ' AND ' +
                columnNameSelect +
                ' < ' +
                startDateEnd +
                ')'
            );
        } else if (urlSuffix === Filter.Types.DATE_NOT_EQUAL.getURLSuffix()) {
            return (
                '(' +
                columnNameSelect +
                ' < ' +
                startDateStart +
                ' OR ' +
                columnNameSelect +
                ' >= ' +
                startDateEnd +
                ')'
            );
        } else if (urlSuffix === Filter.Types.BETWEEN.getURLSuffix()) {
            return (
                '(' + columnNameSelect + ' >= ' + startDateStart + ' AND ' + columnNameSelect + ' < ' + endDateEnd + ')'
            );
        } else if (urlSuffix === Filter.Types.NOT_BETWEEN.getURLSuffix()) {
            return (
                '(' + columnNameSelect + ' < ' + startDateStart + ' OR ' + columnNameSelect + ' >= ' + endDateEnd + ')'
            );
        } else if (urlSuffix === Filter.Types.DATE_GREATER_THAN.getURLSuffix()) {
            return '(' + columnNameSelect + ' >= ' + startDateEnd + ')';
        } else if (urlSuffix === Filter.Types.DATE_LESS_THAN.getURLSuffix()) {
            return '(' + columnNameSelect + ' < ' + startDateStart + ')';
        } else if (urlSuffix === Filter.Types.DATE_GREATER_THAN_OR_EQUAL.getURLSuffix()) {
            return '(' + columnNameSelect + ' >= ' + startDateStart + ')';
        } else if (urlSuffix === Filter.Types.DATE_LESS_THAN_OR_EQUAL.getURLSuffix()) {
            return '(' + columnNameSelect + ' < ' + startDateEnd + ')';
        }
    }

    if (filterType.getLabKeySqlOperator() && !filterType.isDataValueRequired()) {
        return columnNameSelect + ' ' + filterType.getLabKeySqlOperator();
    }

    return null;
}

function getInClauseLabKeySql(
    filter: Filter.IFilter,
    jsonType: JsonType,
    tableAlias?: string,
    flipNegative?: boolean
): string {
    const filterType = filter.getFilterType();
    const columnNameSelect = getLegalIdentifier(filter.getColumnName(), tableAlias);
    let operatorSql = null;

    const values = filterType.parseValue(filter.getValue());

    const sqlValues = [];
    const negate = filterType.getURLSuffix() === Filter.Types.NOT_IN.getURLSuffix() && !flipNegative;
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
}

const LABKEY_SQL_LIKE_CLAUSE_ESCAPE = " ESCAPE '!'"; // see LikeClause.sqlEscape

function getLikeClause(sqlValue, isStart: boolean): string {
    if (!sqlValue || sqlValue === '') return ' IS NULL';
    return " LIKE LOWER('" + (isStart ? '' : '%') + sqlValue + "%')" + LABKEY_SQL_LIKE_CLAUSE_ESCAPE; // lower() might not be needed, but keeping it here to be consistent with server code
}

function getContainsClause(sqlValue): string {
    return getLikeClause(sqlValue, false);
}

function getNotLikeClause(sqlValue, isStart: boolean): string {
    if (!sqlValue || sqlValue === '') return ' IS NOT NULL';

    return ' NOT' + getLikeClause(sqlValue, isStart);
}

function getNotContainsClause(sqlValue): string {
    return getNotLikeClause(sqlValue, false);
}

function getLikeFullClause(filter: Filter.IFilter, jsonType: JsonType, isStart: boolean, tableAlias?: string): string {
    const columnNameSelect = getLegalIdentifier(filter.getColumnName(), tableAlias);
    const sqlValue = getLabKeySqlValue(filter.getValue(), jsonType, true);
    if (!sqlValue || sqlValue === '') return columnNameSelect + getLikeClause(sqlValue, isStart);
    return 'LOWER(' + columnNameSelect + ')' + getLikeClause(sqlValue, isStart);
}

function getContainsFullClause(filter: Filter.IFilter, jsonType: JsonType, tableAlias?: string): string {
    return getLikeFullClause(filter, jsonType, false, tableAlias);
}

function getStartsWithFullClause(filter: Filter.IFilter, jsonType: JsonType, tableAlias?: string): string {
    return getLikeFullClause(filter, jsonType, true, tableAlias);
}

function getNotLikeFullClause(
    filter: Filter.IFilter,
    jsonType: JsonType,
    isStart: boolean,
    tableAlias?: string
): string {
    const columnNameSelect = getLegalIdentifier(filter.getColumnName(), tableAlias);
    const sqlValue = getLabKeySqlValue(filter.getValue(), jsonType, true);
    if (!sqlValue || sqlValue === '') return columnNameSelect + ' IS NOT NULL';
    return (
        '(' +
        columnNameSelect +
        ' IS NULL) OR (LOWER(' +
        columnNameSelect +
        ')' +
        getNotLikeClause(sqlValue, isStart) +
        ')'
    );
}

function getNotContainsFullClause(filter: Filter.IFilter, jsonType: JsonType, tableAlias?: string): string {
    return getNotLikeFullClause(filter, jsonType, false, tableAlias);
}

function getNotStartsWithFullClause(filter: Filter.IFilter, jsonType: JsonType, tableAlias?: string): string {
    return getNotLikeFullClause(filter, jsonType, true, tableAlias);
}

function getInSubTreeClause(filter: Filter.IFilter, jsonType: JsonType, not?: boolean, tableAlias?: string): string {
    const columnNameSelect = getLegalIdentifier(filter.getColumnName(), tableAlias);

    const notFrag = not ? 'NOT ' : '';
    const pathValue = filter.getValue();
    if (!pathValue || pathValue === '') return columnNameSelect + 'IS ' + notFrag + 'NULL';

    // 'Path1/Path1-1/Path1-1-2' to 'Path1', 'Path1-1', 'Path1-1-2'
    const paths = pathValue.split('/').filter(p => !!p);
    const sqlValue = paths
        .map(path => {
            return getLabKeySqlValue(path, jsonType);
        })
        .join(', ');

    return notFrag + 'IsInSubtree(' + columnNameSelect + ', ConceptPath(' + sqlValue + '))';
}

function getInContainsClauseLabKeySql(
    filter: Filter.IFilter,
    jsonType: JsonType,
    tableAlias?: string,
    flipNegative?: boolean
): string {
    const filterType = filter.getFilterType();
    const columnNameSelect = getLegalIdentifier(filter.getColumnName(), tableAlias);

    const values = filterType.parseValue(filter.getValue());

    const negate = filterType.getURLSuffix() === Filter.Types.CONTAINS_NONE_OF.getURLSuffix() && !flipNegative;

    if (values.length === 0) return '';

    if (values.length === 1) {
        return negate
            ? getNotContainsFullClause(filter, jsonType, tableAlias)
            : getContainsFullClause(filter, jsonType, tableAlias);
    }

    const includeNull = values.indexOf(null) > -1 || values.indexOf('') > -1;

    const clauses = [];
    values.forEach(val => {
        const sqlValue = getLabKeySqlValue(val, jsonType, true);
        if (sqlValue) {
            const operatorSql = negate ? getNotContainsClause(sqlValue) : getContainsClause(sqlValue);
            clauses.push('(LOWER(' + columnNameSelect + ')' + operatorSql + ')');
        }
    });
    const likeClause = '(' + clauses.join(negate ? ' AND ' : ' OR ') + ')';

    let nullClause = '';
    if (includeNull) {
        if (negate) {
            nullClause = ' AND (' + columnNameSelect + ' IS NOT NULL)';
        } else {
            nullClause = ' OR (' + columnNameSelect + ' IS NULL)';
        }
    } else {
        if (negate) {
            nullClause = ' OR (' + columnNameSelect + ' IS NULL)';
        }
    }

    return likeClause + nullClause;
}

const NEGATIVE_FILTERS = [
    Filter.Types.NOT_IN.getURLSuffix(),
    Filter.Types.CONTAINS_NONE_OF.getURLSuffix(),
    Filter.Types.NOT_BETWEEN.getURLSuffix(),
    Filter.Types.NEQ_OR_NULL.getURLSuffix(),
    Filter.Types.DOES_NOT_CONTAIN.getURLSuffix(),
    Filter.Types.DOES_NOT_START_WITH.getURLSuffix(),
    Filter.Types.ONTOLOGY_NOT_IN_SUBTREE.getURLSuffix(),
    Filter.Types.NOT_EQUAL.getURLSuffix(),
    Filter.Types.DATE_NOT_EQUAL.getURLSuffix(),
];

export function isNegativeFilterType(filterType: Filter.IFilterType) {
    return NEGATIVE_FILTERS.indexOf(filterType.getURLSuffix()) > -1;
}

/**
 * Note: this is an experimental API that may change unexpectedly in future releases.
 * From a filter and its column jsonType, return the LabKey sql operator clause
 * @param filter The Filter
 * @param jsonType The json type ("string", "int", "float", "date", or "boolean") of the field
 * @param tableAlias
 * @param flipNegative If true, use the non-negative version of the current negative filter type: not equal -> equal, not in -> in. This is used to generate a ~notinexpdescendantsof filter, when the field contains another ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE
 * @return labkey sql fragment
 */
export function getFilterLabKeySql(
    filter: Filter.IFilter,
    jsonType: JsonType,
    tableAlias?: string,
    flipNegative?: boolean
): string {
    if (!filter) return null;

    const filterType = filter.getFilterType();

    let columnNameSelect = getLegalIdentifier(filter.getColumnName());
    if (tableAlias) columnNameSelect = tableAlias + '.' + columnNameSelect;

    let operatorSql = null;

    if (
        filterType.getURLSuffix() === Filter.Types.HAS_ANY_VALUE.getURLSuffix() ||
        filterType.getURLSuffix() === COLUMN_NOT_IN_FILTER_TYPE.getURLSuffix()
    )
        return null;

    if (jsonType === 'date' && filterType.isDataValueRequired()) {
        let dateValue: string;
        if (filterType.isMultiValued()) {
            const values = filterType.parseValue(filter.getValue());
            if (values.length > 1) {
                dateValue = values[0];
            }
        } else {
            dateValue = filter.getValue();
        }

        if (isRelativeDateFilterValue(dateValue) || dateValue?.match(/^\s*(\d\d\d\d)-(\d\d)-(\d\d)\s*$/)) {
            // for date (not datetime) field, ignore the time portion and do date only comparison
            return getDateFieldLabKeySql(filter, tableAlias);
        }
    }

    if (filterType.getLabKeySqlOperator()) {
        if (!filterType.isDataValueRequired()) operatorSql = filterType.getLabKeySqlOperator();
        else operatorSql = filterType.getLabKeySqlOperator() + ' ' + getLabKeySqlValue(filter.getValue(), jsonType);

        return columnNameSelect + ' ' + operatorSql;
    } else if (filterType.isMultiValued()) {
        if (
            filterType.getURLSuffix() === Filter.Types.IN.getURLSuffix() ||
            filterType.getURLSuffix() === Filter.Types.NOT_IN.getURLSuffix()
        ) {
            return getInClauseLabKeySql(filter, jsonType, tableAlias, flipNegative);
        } else if (
            filterType.getURLSuffix() === Filter.Types.CONTAINS_ONE_OF.getURLSuffix() ||
            filterType.getURLSuffix() === Filter.Types.CONTAINS_NONE_OF.getURLSuffix()
        ) {
            return getInContainsClauseLabKeySql(filter, jsonType, tableAlias, flipNegative);
        } else if (
            filterType.getURLSuffix() === Filter.Types.BETWEEN.getURLSuffix() ||
            filterType.getURLSuffix() === Filter.Types.NOT_BETWEEN.getURLSuffix()
        ) {
            const values = filterType.parseValue(filter.getValue());

            operatorSql =
                (filterType.getURLSuffix() === Filter.Types.NOT_BETWEEN.getURLSuffix() && !flipNegative ? 'NOT ' : '') +
                'BETWEEN ' +
                getLabKeySqlValue(values[0], jsonType) +
                ' AND ' +
                getLabKeySqlValue(values[1], jsonType);

            return columnNameSelect + ' ' + operatorSql;
        }
    } else if (filterType.getURLSuffix() === Filter.Types.NEQ_OR_NULL.getURLSuffix()) {
        if (flipNegative) {
            return columnNameSelect + ' = ' + getLabKeySqlValue(filter.getValue(), jsonType);
        }
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
    } else if (filterType.getURLSuffix() === Filter.Types.CONTAINS.getURLSuffix()) {
        return getContainsFullClause(filter, jsonType, tableAlias);
    } else if (filterType.getURLSuffix() === Filter.Types.DOES_NOT_CONTAIN.getURLSuffix()) {
        if (flipNegative) return getContainsFullClause(filter, jsonType, tableAlias);
        return getNotContainsFullClause(filter, jsonType, tableAlias);
    } else if (filterType.getURLSuffix() === Filter.Types.STARTS_WITH.getURLSuffix()) {
        return getStartsWithFullClause(filter, jsonType, tableAlias);
    } else if (filterType.getURLSuffix() === Filter.Types.DOES_NOT_START_WITH.getURLSuffix()) {
        if (flipNegative) return getStartsWithFullClause(filter, jsonType, tableAlias);
        return getNotStartsWithFullClause(filter, jsonType, tableAlias);
    } else if (filterType.getURLSuffix() === Filter.Types.ONTOLOGY_IN_SUBTREE.getURLSuffix()) {
        return getInSubTreeClause(filter, jsonType, false, tableAlias);
    } else if (filterType.getURLSuffix() === Filter.Types.ONTOLOGY_NOT_IN_SUBTREE.getURLSuffix()) {
        if (flipNegative) return getInSubTreeClause(filter, jsonType, false, tableAlias);
        return getInSubTreeClause(filter, jsonType, true, tableAlias);
    }

    return null;
}

/**
 * This method is a forwarding method for the version in @labkey/api. Calling the one from @labkey/api
 * directly from another npm package registers with a different global urlMap (somehow), so essentially doesn't
 * register the filter at all, just creates a new filter type for you.
 *
 */
export function registerFilterType(
    displayText: string,
    displaySymbol?: string,
    urlSuffix?: string,
    dataValueRequired?: boolean,
    multiValueSeparator?: string,
    longDisplayText?: string,
    minOccurs?: number,
    maxOccurs?: number,
    tableWise?: boolean,
    labkeySqlOperator?: string
): Filter.IFilterType {
    return Filter.registerFilterType(
        displayText,
        displaySymbol,
        urlSuffix,
        dataValueRequired,
        multiValueSeparator,
        longDisplayText,
        minOccurs,
        maxOccurs,
        tableWise,
        labkeySqlOperator
    );
}

/**
 * This implements the filter corresponding to QueryServiceImpl.COLUMN_IN and QueryServiceImpl.COLUMN_NOT_IN. Updates there should also be reflected here.
 */
export const COLUMN_IN_FILTER_TYPE = registerFilterType('COLUMN IN', null, 'columnin', true);
export const COLUMN_NOT_IN_FILTER_TYPE = registerFilterType('COLUMN NOT IN', null, 'columnnotin', true);

export const ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE = registerFilterType(
    'Equals All Of',
    null,
    'ancestormatchesallof',
    true,
    ';'
);

export const IN_EXP_DESCENDANTS_OF_FILTER_TYPE = registerFilterType(
    'IN DESCENDANTS OF',
    null,
    'inexpdescendantsof',
    true,
    undefined
);
export const NOT_IN_EXP_DESCENDANTS_OF_FILTER_TYPE = registerFilterType(
    'NOT IN DESCENDANTS OF',
    null,
    'notinexpdescendantsof',
    true,
    undefined
);
export const IN_EXP_ANCESTORS_OF_FILTER_TYPE = registerFilterType(
    'IN ANCESTORS OF',
    null,
    'inexpancestorsof',
    true,
    undefined
);
