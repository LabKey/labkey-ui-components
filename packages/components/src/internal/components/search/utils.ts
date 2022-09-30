import { ActionURL, Filter, getServerContext, Utils, Query } from '@labkey/api';

import { EntityDataType } from '../entities/models';
import { JsonType } from '../domainproperties/PropDescType';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryConfig, QueryModel } from '../../../public/QueryModel/QueryModel';
import { QueryConfigMap } from '../../../public/QueryModel/withQueryModels';
import { SAMPLE_STATUS_REQUIRED_COLUMNS } from '../samples/constants';
import { User } from '../base/models/User';

import { getOmittedSampleTypeColumns, isSamplesSchema } from '../samples/utils';
import { SCHEMAS } from '../../schemas';

import { resolveFilterType } from '../../../public/QueryModel/grid/actions/Filter';
import { QueryColumn } from '../../../public/QueryColumn';

import { NOT_ANY_FILTER_TYPE } from '../../url/NotAnyFilterType';

import { IN_EXP_DESCENDANTS_OF_FILTER_TYPE } from '../../url/InExpDescendantsOfFilterType';
import {
    COLUMN_IN_FILTER_TYPE,
    COLUMN_NOT_IN_FILTER_TYPE,
    CONCEPT_COLUMN_FILTER_TYPES,
    getLegalIdentifier,
    getFilterLabKeySql,
} from '../../query/filter';

import { QueryInfo } from '../../../public/QueryInfo';

import { getPrimaryAppProperties, isOntologyEnabled } from '../../app/utils';

import { formatDateTime } from '../../util/Date';

import { getContainerFilter } from '../../query/api';

import { AssayResultDataType } from '../entities/constants';

import { SearchScope, SAMPLE_FINDER_SESSION_PREFIX } from './constants';
import { FieldFilter, FieldFilterOption, FilterProps, FilterSelection, SearchSessionStorageProps } from './models';

export const SAMPLE_FILTER_METRIC_AREA = 'sampleFinder';
export const FIND_SAMPLE_BY_ID_METRIC_AREA = 'findSamplesById';

export function getFinderStartText(parentEntityDataTypes: EntityDataType[], enabledEntityTypes: string[]): string {
    const hintText = 'Start by adding ';
    let names = parentEntityDataTypes
        .filter(entityType => enabledEntityTypes?.indexOf(entityType.typeListingSchemaQuery.queryName) >= 0)
        .map(entityType => entityType.nounAsParentSingular)
        .join(', ');
    if (names.length === 0) {
        return null;
    }
    const lastComma = names.lastIndexOf(',');
    if (lastComma >= 0) {
        names = names.substring(0, lastComma) + ' or' + names.substring(lastComma + 1);
    }
    return hintText + names + ' properties.';
}

export function getFilterCardColumnName(
    entityDataType: EntityDataType,
    schemaQuery: SchemaQuery,
    useAncestors: boolean
): string {
    if (useAncestors) return entityDataType.ancestorColumnName + '/' + schemaQuery.queryName;
    else return entityDataType.inputColumnName.replace('First', schemaQuery.queryName);
}

const FIRST_COLUMNS_IN_VIEW = ['Name', 'SampleSet'];

export function getFinderViewColumnsConfig(
    queryModel: QueryModel,
    columnDisplayNames: { [key: string]: string }
): { columns: any; hasUpdates: boolean } {
    const defaultDisplayColumns = queryModel.queryInfo?.getDisplayColumns().toArray();
    const displayColumnKeys = defaultDisplayColumns.map(col => col.fieldKey.toLowerCase());
    const columnKeys = [];
    FIRST_COLUMNS_IN_VIEW.forEach(fieldKey => {
        const lcFieldKey = fieldKey.toLowerCase();
        if (displayColumnKeys.indexOf(lcFieldKey) >= 0) {
            columnKeys.push(fieldKey);
        }
    });
    queryModel.requiredColumns.forEach(fieldKey => {
        const lcFieldKey = fieldKey.toLowerCase();
        if (displayColumnKeys.indexOf(lcFieldKey) == -1 && SAMPLE_STATUS_REQUIRED_COLUMNS.indexOf(fieldKey) === -1) {
            columnKeys.push(fieldKey);
        }
    });
    columnKeys.push(
        ...defaultDisplayColumns
            .filter(col => FIRST_COLUMNS_IN_VIEW.indexOf(col.fieldKey) === -1)
            .map(col => col.fieldKey)
    );
    const viewDisplayFieldKeys = queryModel.queryInfo
        ?.getDisplayColumns(queryModel.viewName)
        .map(column => column.fieldKey)
        .toArray()
        .sort();
    return {
        hasUpdates: viewDisplayFieldKeys.join(',') !== [...columnKeys].sort().join(','),
        columns: columnKeys.map(fieldKey => ({ fieldKey, title: columnDisplayNames[fieldKey] })),
    };
}

export const SAMPLE_FINDER_VIEW_NAME = '~~samplefinder~~';

function getSampleFinderConfigId(finderId: string, suffix: string): string {
    const { uuids } = getServerContext();
    // We need to make sure these ids are unique per application load since
    // the server holds on to the selection keys even after the grid is gone.
    return uuids[0] + '-' + finderId + '|' + suffix;
}

/**
 * Note: this is an experimental API that may change unexpectedly in future releases.
 * From an array of FieldFilter, LabKey sql where clause
 * @param fieldFilters
 * @param skipWhere if true, don't include 'WHERE ' prefix in the returned sql fragment
 * @return labkey sql where clauses
 */
export function getLabKeySqlWhere(fieldFilters: FieldFilter[], skipWhere?: boolean): string {
    const clauses = [];
    fieldFilters.forEach(fieldFilter => {
        const clause = getFilterLabKeySql(fieldFilter.filter, fieldFilter.jsonType);
        if (clause) clauses.push(clause);
    });

    if (clauses.length === 0) return '';

    return (skipWhere ? '' : 'WHERE ') + clauses.join(' AND ');
}

/**
 * Note: this is an experimental API that may change unexpectedly in future releases.
 * generate LabKey select sql
 * @param selectColumn the column to select
 * @param schemaName
 * @param queryName
 * @param fieldFilters
 * @return labkey sql
 */
export function getLabKeySql(
    selectColumn: string,
    schemaName: string,
    queryName: string,
    fieldFilters?: FieldFilter[]
): string {
    const from = getLegalIdentifier(schemaName) + '.' + getLegalIdentifier(queryName);
    const where = fieldFilters ? ' ' + getLabKeySqlWhere(fieldFilters) : '';
    return 'SELECT ' + getLegalIdentifier(selectColumn) + ' FROM ' + from + where;
}

export function getExpDescendantOfSelectClause(
    schemaQuery: SchemaQuery,
    fieldFilters: FieldFilter[],
    cf?: Query.ContainerFilter
): string {
    const selectClauseWhere = getLabKeySqlWhere(fieldFilters);
    if (!selectClauseWhere) return null;

    const { queryName, schemaName } = schemaQuery;
    const cfClause = cf ? `[ContainerFilter='${cf}']` : '';

    return `SELECT "${queryName}".expObject() FROM ${schemaName}."${queryName}"${cfClause} ${selectClauseWhere}`;
}

export function getExpDescendantOfFilter(
    schemaQuery: SchemaQuery,
    fieldFilters: FieldFilter[],
    cf?: Query.ContainerFilter
): Filter.IFilter {
    const selectClause = getExpDescendantOfSelectClause(schemaQuery, fieldFilters, cf);
    if (!selectClause) return null;

    return Filter.create('*', selectClause, IN_EXP_DESCENDANTS_OF_FILTER_TYPE);
}

export function getAssayFilter(card: FilterProps, cf?: Query.ContainerFilter): Filter.IFilter {
    const { schemaQuery, filterArray, selectColumnFieldKey, targetColumnFieldKey } = card;
    if (!filterArray || filterArray.length === 0) return undefined;

    const noAssayDataFilter = filterArray.find(
        fieldFilter => fieldFilter.filter.getFilterType().getURLSuffix() === COLUMN_NOT_IN_FILTER_TYPE.getURLSuffix()
    )?.filter;

    if (noAssayDataFilter) return noAssayDataFilter;

    const whereConditions = getLabKeySqlWhere(filterArray, true);
    if (!whereConditions) return null;

    const { schemaName, queryName } = schemaQuery;

    // const cfClause = cf ? `[ContainerFilter='${cf}']` : ''; //TODO add container filter

    return Filter.create(
        selectColumnFieldKey,
        getLabKeySql(targetColumnFieldKey, schemaName, queryName, filterArray),
        COLUMN_IN_FILTER_TYPE
    );
}

// exported for jest testing
export function getSampleFinderCommonConfigs(
    cards: FilterProps[],
    useAncestors: boolean,
    cf?: Query.ContainerFilter
): Partial<QueryConfig> {
    const baseFilters = [];
    const requiredColumns = [...SAMPLE_STATUS_REQUIRED_COLUMNS];
    cards.forEach(card => {
        if (card.entityDataType.nounAsParentSingular === AssayResultDataType.nounAsParentSingular) {
            const assayFilter = getAssayFilter(card, cf);
            if (assayFilter) baseFilters.push(assayFilter);
            return;
        }

        const schemaQuery = card.schemaQuery;
        const cardColumnName = getFilterCardColumnName(card.entityDataType, card.schemaQuery, useAncestors);

        requiredColumns.push(cardColumnName);
        if (card.filterArray?.length) {
            card.filterArray.forEach(f => {
                const filter = f.filter;
                const columnName = filter.getColumnName();

                // The 'Name' field is redundant since we always add a column for the parent type ID
                if (columnName.toLowerCase() !== 'name') {
                    const newColumnName = cardColumnName + '/' + columnName;
                    if (requiredColumns.indexOf(newColumnName) === -1) {
                        requiredColumns.push(newColumnName);
                    }
                }
            });

            const filter = getExpDescendantOfFilter(schemaQuery, card.filterArray, cf);
            if (filter) {
                baseFilters.push(filter);
            }
        } else {
            const pkColName = 'Name';
            const filter = getExpDescendantOfFilter(schemaQuery, [{
                fieldCaption: pkColName,
                fieldKey: pkColName,
                filter: Filter.create(pkColName, null, Filter.Types.NONBLANK),
                jsonType: 'string',
            }], cf);
            if (filter) {
                baseFilters.push(filter);
            }
        }
    });

    return {
        requiredColumns,
        baseFilters,
    };
}

export function getSampleFinderQueryConfigs(
    user: User,
    sampleTypeNames: string[],
    cards: FilterProps[],
    finderId: string
): QueryConfigMap {
    const omittedColumns = getOmittedSampleTypeColumns(user);
    const allSamplesKey = getSampleFinderConfigId(finderId, 'exp/materials');
    const cf = getContainerFilter();
    const configs: QueryConfigMap = {
        [allSamplesKey]: {
            id: allSamplesKey,
            title: 'All Samples',
            schemaQuery: SchemaQuery.create(
                SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
                SCHEMAS.EXP_TABLES.MATERIALS.queryName,
                SAMPLE_FINDER_VIEW_NAME
            ),
            omittedColumns: [...omittedColumns, 'Run'],
            ...getSampleFinderCommonConfigs(cards, false, cf),
        },
    };

    if (sampleTypeNames) {
        const commonConfig = getSampleFinderCommonConfigs(cards, true, cf);

        for (const name of sampleTypeNames) {
            const id = getSampleFinderConfigId(finderId, 'samples/' + name);
            const schemaQuery = SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, name, SAMPLE_FINDER_VIEW_NAME);

            configs[id] = {
                id,
                title: name,
                schemaQuery,
                omittedColumns,
                ...commonConfig,
            };
        }
    }

    return configs;
}

export function getSampleFinderColumnNames(cards: FilterProps[]): { [key: string]: string } {
    const columnNames = {};
    cards?.forEach(card => {
        if (card.entityDataType.nounAsParentSingular === AssayResultDataType.nounAsParentSingular) {
            return;
        }

        const ancestorCardColumnName = getFilterCardColumnName(card.entityDataType, card.schemaQuery, true);
        const parentCardColumnName = getFilterCardColumnName(card.entityDataType, card.schemaQuery, false);
        if (card.dataTypeDisplayName) {
            columnNames[ancestorCardColumnName] = card.dataTypeDisplayName + ' ID';
            columnNames[parentCardColumnName] = card.dataTypeDisplayName + ' ID';
            card.filterArray?.forEach(filter => {
                columnNames[ancestorCardColumnName + '/' + filter.fieldKey] =
                    card.dataTypeDisplayName + ' ' + filter.fieldCaption;
                columnNames[parentCardColumnName + '/' + filter.fieldKey] =
                    card.dataTypeDisplayName + ' ' + filter.fieldCaption;
            });
        }
    });
    return columnNames;
}

export const NEGATE_FILTERS = [
    Filter.Types.NEQ_OR_NULL.getURLSuffix(),
    Filter.Types.DATE_NOT_EQUAL.getURLSuffix(),
    Filter.Types.NOT_IN.getURLSuffix(),
];

export const SAMPLE_SEARCH_FILTER_TYPES_SKIP_TITLE = [
    Filter.Types.EQUAL.getURLSuffix(),
    Filter.Types.DATE_EQUAL.getURLSuffix(),
    Filter.Types.IN.getURLSuffix(),
    Filter.Types.BETWEEN.getURLSuffix(),
    COLUMN_NOT_IN_FILTER_TYPE.getURLSuffix(),
    ...NEGATE_FILTERS,
];

const CHOOSE_VALUE_FILTERS = [
    Filter.Types.EQUAL.getURLSuffix(),
    Filter.Types.IN.getURLSuffix(),
    Filter.Types.NEQ.getURLSuffix(),
    Filter.Types.NEQ_OR_NULL.getURLSuffix(),
    Filter.Types.NOT_IN.getURLSuffix(),
];

export function isBetweenOperator(urlSuffix: string): boolean {
    return ['between', 'notbetween'].indexOf(urlSuffix) > -1;
}

export const FILTER_URL_SUFFIX_ANY_ALT = 'any';

export function getFilterOptionsForType(field: QueryColumn): FieldFilterOption[] {
    if (!field) return null;

    const jsonType = field.getDisplayFieldJsonType() as JsonType;

    const useConceptFilters = field.isConceptCodeColumn && isOntologyEnabled();

    const filterList = (
        useConceptFilters ? CONCEPT_COLUMN_FILTER_TYPES : Filter.getFilterTypesForType(jsonType)
    ).filter(function (result) {
        return Filter.Types.HAS_ANY_VALUE.getURLSuffix() !== result.getURLSuffix();
    });

    if (jsonType === 'date') {
        filterList.push(Filter.Types.BETWEEN);
        filterList.push(Filter.Types.NOT_BETWEEN);
    }

    return filterList.map(filter => {
        let urlSuffix = filter.getURLSuffix();
        if (urlSuffix === '') urlSuffix = FILTER_URL_SUFFIX_ANY_ALT;
        return {
            value: urlSuffix,
            label: filter.getDisplayText(),
            valueRequired: filter.isDataValueRequired(),
            multiValue: filter.isMultiValued(),
            betweenOperator: isBetweenOperator(urlSuffix),
            isSoleFilter:
                urlSuffix === Filter.Types.EQUAL.getURLSuffix() ||
                urlSuffix === Filter.Types.ISBLANK.getURLSuffix() ||
                urlSuffix === Filter.Types.DATE_EQUAL.getURLSuffix(),
        } as FieldFilterOption;
    });
}

export function isFilterUrlSuffixMatch(suffix: string, filterType: Filter.IFilterType): boolean {
    if (suffix === 'any' && filterType.getURLSuffix() === '') return true;
    return suffix === filterType.getURLSuffix();
}

export function getFilterTypePlaceHolder(suffix: string, jsonType: string): string {
    if (suffix === 'in' || suffix === 'notin') {
        switch (jsonType) {
            case 'float':
                return 'Example: 1.0;2.2;3';
            case 'int':
                return 'Example: 1;2;3';
            case 'string':
                return 'Example: a;b;c';
        }
    } else if (suffix === 'containsoneof' || suffix === 'containsnoneof') {
        return 'Example: a;b;c';
    }

    return null;
}

export function isChooseValuesFilter(filter: Filter.IFilter): boolean {
    return CHOOSE_VALUE_FILTERS.indexOf(filter.getFilterType().getURLSuffix()) >= 0;
}

export function filterToJson(filter: Filter.IFilter): string {
    return encodeURIComponent(filter.getURLParameterName()) + '=' + encodeURIComponent(filter.getURLParameterValue());
}

export function filterFromJson(filterStr: string): Filter.IFilter {
    return Filter.getFiltersFromUrl(filterStr, 'query')?.[0];
}

export function getSearchFilterObjs(filterProps: FilterProps[]): any[] {
    const filterPropsObj = [];

    filterProps.forEach(filterProp => {
        const filterPropsEntityDataType = { ...filterProp.entityDataType };
        const filterPropObj = { ...filterProp, entityDataType: filterPropsEntityDataType };

        const filterArrayObjs = [];
        [...filterPropObj.filterArray].forEach(field => {
            filterArrayObjs.push({
                fieldKey: field.fieldKey,
                fieldCaption: field.fieldCaption,
                filter: filterToJson(field.filter),
                jsonType: field.jsonType,
            });
        });
        filterPropObj.filterArray = filterArrayObjs;

        const entityDataFilterArrayObjs = [];
        if (filterPropObj.entityDataType.filterArray?.length > 0) {
            [...filterPropObj.entityDataType.filterArray].forEach(filter => {
                entityDataFilterArrayObjs.push(filterToJson(filter));
            });

            filterPropObj.entityDataType.filterArray = entityDataFilterArrayObjs;
        }

        filterPropsObj.push(filterPropObj);
    });

    return filterPropsObj;
}

export function searchFiltersToJson(
    filterProps: FilterProps[],
    filterChangeCounter: number,
    time?: Date,
    timezone?: string
): string {
    return JSON.stringify({
        filters: getSearchFilterObjs(filterProps),
        filterChangeCounter,
        filterTimestamp: SAMPLE_FINDER_SESSION_PREFIX + formatDateTime(time ?? new Date(), timezone),
    });
}

export function getSearchFiltersFromObjs(filterPropsObj: any[]): FilterProps[] {
    const filters: FilterProps[] = [];
    filterPropsObj.forEach(filterPropObj => {
        const filterArray = [];
        filterPropObj['filterArray']?.forEach(field => {
            filterArray.push({
                fieldKey: field.fieldKey,
                fieldCaption: field.fieldCaption,
                filter: filterFromJson(field.filter),
                jsonType: field.jsonType,
            });
        });
        filterPropObj['filterArray'] = filterArray;

        if (filterPropObj['entityDataType']?.['filterArray']) {
            const filterArray = [];
            filterPropObj['entityDataType']?.['filterArray']?.forEach(filter => {
                filterArray.push(filterFromJson(filter));
            });

            filterPropObj['entityDataType']['filterArray'] = filterArray;
        }

        if (filterPropObj['entityDataType']?.['descriptionSingular'] === AssayResultDataType.descriptionSingular) {
            filterPropObj['entityDataType']['getInstanceSchemaQuery'] = AssayResultDataType.getInstanceSchemaQuery;
            filterPropObj['entityDataType']['getInstanceDataType'] = AssayResultDataType.getInstanceDataType;
        }

        filters.push(filterPropObj as FilterProps);
    });

    return filters;
}

export function searchFiltersFromJson(filterPropsStr: string): SearchSessionStorageProps {
    const obj = JSON.parse(filterPropsStr);
    const filterPropsObj: any[] = obj['filters'];
    const filterChangeCounter: number = obj['filterChangeCounter'];
    const filterTimestamp: string = obj['filterTimestamp'];

    return {
        filters: getSearchFiltersFromObjs(filterPropsObj),
        filterChangeCounter,
        filterTimestamp,
    };
}

export const ALL_VALUE_DISPLAY = '[All]';
export const EMPTY_VALUE_DISPLAY = '[blank]';
export function getFilterValuesAsArray(filter: Filter.IFilter, blankValue?: string): any[] {
    let values = [],
        rawValues;
    const rawValue = filter.getValue();

    if (Array.isArray(rawValue)) {
        rawValues = [...rawValue];
    } else if (typeof rawValue === 'string') {
        rawValues = rawValue.split(';');
    } else rawValues = [rawValue];

    rawValues.forEach(v => {
        values.push(v == '' ? blankValue ?? EMPTY_VALUE_DISPLAY : v);
    });

    return values;
}

export function getFieldFiltersValidationResult(
    dataTypeFilters: { [key: string]: FieldFilter[] },
    queryLabels?: { [key: string]: string }
): string {
    let parentFields = {},
        hasError = false;
    Object.keys(dataTypeFilters).forEach(parent => {
        const filters = dataTypeFilters[parent];
        filters.forEach(fieldFilter => {
            const filter = fieldFilter.filter;
            if (filter.getFilterType().isDataValueRequired()) {
                const value = filter.getValue();
                const isBetween = isBetweenOperator(filter.getFilterType().getURLSuffix());

                let fieldError = false;
                if (value === undefined || value === null || (Utils.isString(value) && !value)) {
                    fieldError = true;
                } else if (isBetween) {
                    if (!Array.isArray(value) || value.length < 2) {
                        fieldError = true;
                    } else {
                        if ((Utils.isString(value[0]) && !value[0]) || (Utils.isString(value[1]) && !value[1])) {
                            fieldError = true;
                        }
                    }
                }

                if (fieldError == true) {
                    hasError = true;
                    const fields = parentFields[parent] ?? [];
                    if (fields.indexOf(fieldFilter.fieldCaption) === -1) {
                        fields.push(fieldFilter.fieldCaption);
                        parentFields[parent] = fields;
                    }
                }
            }
        });
    });

    if (hasError) {
        const parentMsgs = [];
        Object.keys(parentFields).forEach(parent => {
            const parentLabel = queryLabels?.[parent];
            parentMsgs.push((parentLabel ? parentLabel + ': ' : '') + parentFields[parent].join(', '));
        });
        return 'Missing filter values for: ' + parentMsgs.join('; ') + '.';
    }

    return null;
}

export function getFilterForFilterSelection(filterSelection: FilterSelection, field: QueryColumn): Filter.IFilter {
    return getUpdateFilterExpressionFilter(
        filterSelection.filterType,
        field,
        filterSelection.firstFilterValue,
        filterSelection.secondFilterValue,
        filterSelection.firstFilterValue,
        false,
        false
    );
}

export function getUpdateFilterExpressionFilter(
    newFilterType: FieldFilterOption,
    field?: QueryColumn,
    previousFirstFilterValue?: any,
    previousSecondFilterValue?: any,
    newFilterValue?: any,
    isSecondValue?: boolean,
    clearBothValues?: boolean
): Filter.IFilter {
    if (!newFilterType) {
        return null;
    }

    const filterType = resolveFilterType(newFilterType?.value, field);
    if (!filterType) return null;

    let filter: Filter.IFilter;

    const fieldKey = field.getDisplayFieldKey();
    if (!newFilterType.valueRequired) {
        filter = Filter.create(fieldKey, null, filterType);
    } else {
        let value = newFilterValue;
        if (newFilterType?.betweenOperator) {
            if (clearBothValues) {
                value = null;
            } else if (isSecondValue) {
                if (newFilterValue == null) {
                    value = previousFirstFilterValue != null ? previousFirstFilterValue : '';
                } else {
                    value = (previousFirstFilterValue != null ? previousFirstFilterValue + ',' : '') + newFilterValue;
                }
            } else {
                if (newFilterValue == null) {
                    value = previousSecondFilterValue != null ? previousSecondFilterValue : '';
                } else {
                    value = newFilterValue + (previousSecondFilterValue != null ? ',' + previousSecondFilterValue : '');
                }
            }
        } else if (!value && field.getDisplayFieldJsonType() === 'boolean') {
            value = 'false';
        }

        filter = Filter.create(fieldKey, value, filterType);
    }

    return filter;
}

// this util is only for string field type
export function getCheckedFilterValues(filter: Filter.IFilter, allValues: string[]): string[] {
    if (!filter || !allValues)
        // if no existing filter, check all values by default
        return allValues;

    if (filter.getFilterType().isDataValueRequired() && filter.getValue() == null) return allValues;

    const filterUrlSuffix = filter.getFilterType().getURLSuffix();
    const filterValues = getFilterValuesAsArray(filter);
    const hasBlank = allValues.findIndex(value => value === EMPTY_VALUE_DISPLAY) !== -1;

    switch (filterUrlSuffix) {
        case '':
        case 'any':
            return allValues;
        case 'isblank':
            return [EMPTY_VALUE_DISPLAY];
        case 'isnonblank':
            return hasBlank
                ? allValues.filter(value => value !== EMPTY_VALUE_DISPLAY && value !== ALL_VALUE_DISPLAY)
                : allValues;
        case 'neq':
        case 'neqornull':
            return allValues.filter(value => value !== filterValues[0] && value !== ALL_VALUE_DISPLAY);
        case 'eq':
        case 'in':
            return filterValues;
        case 'notin':
            return allValues.filter(value => filterValues.indexOf(value) === -1 && value !== ALL_VALUE_DISPLAY);
        default:
            return [];
    }
}

export function getUpdatedCheckedValues(
    allValues: string[],
    newValue: string,
    check: boolean,
    oldFilter: Filter.IFilter,
    uncheckOthers?: boolean
): string[] {
    if (uncheckOthers) return [newValue];

    const oldCheckedValues = getCheckedFilterValues(oldFilter, allValues);
    let newCheckedValues = [...oldCheckedValues];
    if (check) {
        if (newCheckedValues.indexOf(newValue) === -1) newCheckedValues.push(newValue);
        if (allValues.length - newCheckedValues.length === 1) {
            if (newCheckedValues.indexOf(ALL_VALUE_DISPLAY) === -1) newCheckedValues.push(ALL_VALUE_DISPLAY);
        }
    } else {
        newCheckedValues = newCheckedValues.filter(val => val !== newValue && val !== ALL_VALUE_DISPLAY);
    }

    return newCheckedValues;
}
// this util is only for string field type
export function getUpdatedChooseValuesFilter(
    allValues: string[],
    fieldKey: string,
    newValue: string,
    check: boolean,
    oldFilter: Filter.IFilter,
    uncheckOthers?: /* click on the row but not on the checkbox would check the row value and uncheck everything else*/ boolean
): Filter.IFilter {
    const hasBlank = allValues.findIndex(value => value === EMPTY_VALUE_DISPLAY) !== -1;
    // if check all, or everything is checked, this is essentially "no filter", unless there is no blank value
    // then it's an NONBLANK filter
    if (newValue === ALL_VALUE_DISPLAY && check) {
        return hasBlank ? null : Filter.create(fieldKey, null, Filter.Types.NONBLANK);
    }

    const newCheckedDisplayValues = getUpdatedCheckedValues(allValues, newValue, check, oldFilter, uncheckOthers);
    const newUncheckedDisplayValue = allValues.filter(val => newCheckedDisplayValues.indexOf(val) === -1);

    const newCheckedValues = [];
    const newUncheckedValues = [];

    newCheckedDisplayValues.forEach(v => {
        newCheckedValues.push(v === EMPTY_VALUE_DISPLAY ? '' : v);
    });
    newUncheckedDisplayValue
        .filter(v => v !== ALL_VALUE_DISPLAY)
        .forEach(v => {
            newUncheckedValues.push(v === EMPTY_VALUE_DISPLAY ? '' : v);
        });

    // if everything is checked, this is the same as not filtering
    if ((newValue === ALL_VALUE_DISPLAY && check) || newCheckedValues.length === allValues.length) return null;

    // if uncheck all or if everything is unchecked, create a new NOTANY filter type
    if ((newValue === ALL_VALUE_DISPLAY && !check) || newCheckedValues.length === 0)
        return Filter.create(fieldKey, null, NOT_ANY_FILTER_TYPE);

    // if only one is checked
    if (newCheckedValues.length === 1) {
        if (newCheckedValues[0] === '') return Filter.create(fieldKey, null, Filter.Types.ISBLANK);

        return Filter.create(fieldKey, newCheckedValues[0]);
    }

    // if only one is unchecked
    if (newUncheckedValues.length === 1) {
        if (newUncheckedValues[0] === '') return Filter.create(fieldKey, null, Filter.Types.NONBLANK);

        return Filter.create(fieldKey, newUncheckedValues[0], Filter.Types.NEQ_OR_NULL);
    }

    // if number of checked is greater than unchecked, use Not_In unchecked
    if (newCheckedValues.length > newUncheckedValues.length) {
        return Filter.create(fieldKey, newUncheckedValues, Filter.Types.NOT_IN);
    }

    return Filter.create(fieldKey, newCheckedValues, Filter.Types.IN);
}

export function isValidFilterField(
    field: QueryColumn,
    queryInfo: QueryInfo,
    exprColumnsWithSubSelect?: string[]
): boolean {
    // cannot include fields that are not supported by the database
    if (
        !queryInfo.supportGroupConcatSubSelect &&
        exprColumnsWithSubSelect &&
        exprColumnsWithSubSelect.indexOf(field.fieldKey) !== -1
    ) {
        return false;
    }

    // exclude the storage Units field for sample types since the display of this field is nonstandard and it is not
    // a useful field for filtering parent values
    if (isSamplesSchema(queryInfo.schemaQuery) && field?.fieldKey === 'Units') {
        return false;
    }

    return true;
}

export function isValidFilterFieldExcludeLookups(
    field: QueryColumn,
    queryInfo: QueryInfo,
    exprColumnsWithSubSelect?: string[]
): boolean {
    if (!isValidFilterField(field, queryInfo, exprColumnsWithSubSelect)) return false;

    // also exclude lookups since MVFKs don't support following lookups
    return !field.isLookup();
}

export function isValidFilterFieldSampleFinder(
    field: QueryColumn,
    queryInfo: QueryInfo,
    exprColumnsWithSubSelect?: string[]
): boolean {
    if (!isValidFilterField(field, queryInfo, exprColumnsWithSubSelect)) return false;

    // also exclude multiValue lookups (MVFKs)
    return !field.multiValue;
}

export function getUpdatedDataTypeFilters(
    dataTypeFilters: { [p: string]: FieldFilter[] },
    activeQuery: string,
    activeField: QueryColumn,
    newFilters: Filter.IFilter[]
): { [p: string]: FieldFilter[] } {
    const lcActiveQuery = activeQuery.toLowerCase();
    const dataTypeFiltersUpdated = { ...dataTypeFilters };
    const activeParentFilters: FieldFilter[] = dataTypeFiltersUpdated[lcActiveQuery];
    const activeFieldKey = activeField.fieldKey;
    // the filters on the parent type that aren't associated with this field.
    const otherFieldFilters = activeParentFilters?.filter(filter => filter.fieldKey !== activeFieldKey) ?? [];

    // the filters on the parent type associated with this field.
    const thisFieldFilters =
        newFilters
            ?.filter(newFilter => newFilter !== null)
            .map(newFilter => {
                return {
                    fieldKey: activeFieldKey,
                    fieldCaption: activeField.caption,
                    filter: newFilter,
                    jsonType: activeField.getDisplayFieldJsonType(),
                } as FieldFilter;
            }) ?? [];

    if (otherFieldFilters.length + thisFieldFilters.length > 0) {
        dataTypeFiltersUpdated[lcActiveQuery] = [...otherFieldFilters, ...thisFieldFilters];
    } else {
        delete dataTypeFiltersUpdated[lcActiveQuery];
    }
    return dataTypeFiltersUpdated;
}

export function getDataTypeFiltersWithNotInQueryUpdate(
    dataTypeFilters: { [p: string]: FieldFilter[] },
    schemaQuery: SchemaQuery,
    dataType: string,
    selectQueryFilterKey: string,
    targetQueryFilterKey: string,
    noDataInTypeChecked: boolean,
    cf?: Query.ContainerFilter
): { [p: string]: FieldFilter[] } {
    const lcActiveQuery = dataType.toLowerCase();
    const dataTypeFiltersUpdated = { ...dataTypeFilters };

    // TODO add cf
    if (noDataInTypeChecked) {
        const noDataFilter = Filter.create(
            selectQueryFilterKey,
            getLabKeySql(targetQueryFilterKey, schemaQuery.schemaName, schemaQuery.queryName),
            COLUMN_NOT_IN_FILTER_TYPE
        );

        dataTypeFiltersUpdated[lcActiveQuery] = [
            {
                fieldKey: '*',
                fieldCaption: 'Results',
                filter: noDataFilter,
                jsonType: undefined,
            } as FieldFilter,
        ];
    } else {
        delete dataTypeFiltersUpdated[lcActiveQuery];
    }
    return dataTypeFiltersUpdated;
}

export function getFilterSelections(
    fieldFilters: Filter.IFilter[],
    filterOptions: FieldFilterOption[]
): FilterSelection[] {
    const filters = [];
    fieldFilters?.forEach(fieldFilter => {
        const filterOption = filterOptions?.find(option => {
            return isFilterUrlSuffixMatch(option.value, fieldFilter.getFilterType());
        });

        if (filterOption) {
            const filter: FilterSelection = {
                filterType: filterOption,
            };

            const values = getFilterValuesAsArray(fieldFilter, '');
            if (filterOption.betweenOperator) {
                filter.firstFilterValue = values[0];
                filter.secondFilterValue = values[1];
            } else if (values.length > 1) {
                filter.firstFilterValue = values.join(';');
            } else {
                filter.firstFilterValue = values[0];
            }
            filters.push(filter);
        }
    });
    return filters;
}

export function getUpdatedFilters(
    field: QueryColumn,
    activeFilters: FilterSelection[],
    filterIndex: number,
    newFilterType: FieldFilterOption,
    newFilterValue?: any,
    isSecondValue?: boolean,
    clearBothValues?: boolean
): Filter.IFilter[] {
    const newFilter = getUpdateFilterExpressionFilter(
        newFilterType,
        field,
        activeFilters[filterIndex]?.firstFilterValue,
        activeFilters[filterIndex]?.secondFilterValue,
        newFilterValue,
        isSecondValue,
        clearBothValues
    );
    let newFilters = [];
    if (!newFilter) {
        if (activeFilters.length > 1) {
            // retain the other filter
            newFilters = [getFilterForFilterSelection(activeFilters[filterIndex == 1 ? 0 : 1], field)];
        }
    } else {
        if (newFilterType.isSoleFilter) {
            newFilters = [newFilter];
        } else {
            if (filterIndex === 1) {
                newFilters = [getFilterForFilterSelection(activeFilters[0], field), newFilter];
            } else {
                newFilters =
                    activeFilters.length <= 1
                        ? [newFilter]
                        : [newFilter, getFilterForFilterSelection(activeFilters[1], field)];
            }
        }
    }
    return newFilters;
}

export function getUpdatedFilterSelection(
    newActiveFilterType: FieldFilterOption,
    activeFilter: FilterSelection
): { filterSelection: FilterSelection; shouldClear: boolean } {
    let firstValue = activeFilter?.firstFilterValue;
    let shouldClear = false;

    // when a value is required, we want to start with 'undefined' instead of 'null' since 'null' is seen as a valid value
    if (
        (newActiveFilterType?.valueRequired && !activeFilter?.filterType.valueRequired) ||
        (activeFilter?.filterType?.multiValue && !newActiveFilterType?.multiValue)
    ) {
        firstValue = undefined;
        shouldClear = true;
    } else if (!newActiveFilterType?.valueRequired) {
        // if value is not required, then we'll start with null
        firstValue = null;
        shouldClear = true;
    }
    return {
        shouldClear,
        filterSelection: {
            filterType: newActiveFilterType,
            firstFilterValue: firstValue,
            secondFilterValue: shouldClear ? undefined : activeFilter?.secondFilterValue,
        },
    };
}

export function getSampleFinderLocalStorageKey(): string {
    return getPrimaryAppProperties().productId + ActionURL.getContainer() + '-SampleFinder';
}

export function getSearchScopeFromContainerFilter(cf: Query.ContainerFilter): SearchScope {
    switch (cf) {
        case Query.ContainerFilter.allFolders:
            return SearchScope.All;
        case Query.ContainerFilter.current:
            return SearchScope.Folder;
        case Query.ContainerFilter.currentAndParents:
            return SearchScope.FolderAndProject; // TODO: I dont think this is a perfect match
        case Query.ContainerFilter.currentAndSubfoldersPlusShared:
            return SearchScope.FolderAndSubfoldersAndShared;
        case Query.ContainerFilter.currentPlusProject:
            return SearchScope.FolderAndProject;
        case Query.ContainerFilter.currentPlusProjectAndShared:
            return SearchScope.FolderAndProjectAndShared;
        case Query.ContainerFilter.currentAndFirstChildren: // TODO: I dont think this is a perfect match
        case Query.ContainerFilter.currentAndSubfolders:
        default:
            return SearchScope.FolderAndSubfolders;
    }
}
