import { Filter, getServerContext } from '@labkey/api';

import { EntityDataType } from '../entities/models';
import { JsonType } from '../domainproperties/PropDescType';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryConfig, QueryModel } from '../../../public/QueryModel/QueryModel';
import { SAMPLE_STATUS_REQUIRED_COLUMNS } from '../samples/constants';
import { User } from '../base/models/User';

import { getOmittedSampleTypeColumns } from '../samples/utils';
import { SCHEMAS } from '../../schemas';

import {FieldFilter, FieldFilterOption, FilterProps, SearchSessionStorageProps} from './models';
import {resolveFilterType} from "../omnibox/actions/Filter";
import {resolveFieldKey} from "../omnibox/utils";
import {QueryColumn} from "../../../public/QueryColumn";

export function getFinderStartText(parentEntityDataTypes: EntityDataType[]): string {
    const hintText = 'Start by adding ';
    let names = parentEntityDataTypes.map(entityType => entityType.nounAsParentSingular).join(', ');
    const lastComma = names.lastIndexOf(',');
    if (lastComma >= 0) {
        names = names.substr(0, lastComma) + ' or' + names.substr(lastComma + 1);
    }
    return hintText + names + ' properties.';
}

export function getFilterCardColumnName(entityDataType: EntityDataType, schemaQuery: SchemaQuery): string {
    return entityDataType.inputColumnName.replace('Inputs', 'QueryableInputs').replace('First', schemaQuery.queryName);
}

const FIRST_COLUMNS_IN_VIEW = ['Name', 'SampleSet'];

export function getFinderViewColumnsConfig(queryModel: QueryModel): { hasUpdates: boolean; columns: any } {
    const defaultDisplayColumns = queryModel.queryInfo?.getDisplayColumns().toArray();
    const displayColumnKeys = defaultDisplayColumns.map(col => col.fieldKey);
    const columnKeys = [];
    FIRST_COLUMNS_IN_VIEW.forEach(fieldKey => {
        if (displayColumnKeys.indexOf(fieldKey) >= 0) {
            columnKeys.push(fieldKey);
        }
    });
    let hasUpdates = false;
    queryModel.requiredColumns.forEach(fieldKey => {
        if (displayColumnKeys.indexOf(fieldKey) == -1 && SAMPLE_STATUS_REQUIRED_COLUMNS.indexOf(fieldKey) === -1) {
            columnKeys.push(fieldKey);
            hasUpdates = true;
        }
    });
    columnKeys.push(
        ...defaultDisplayColumns
            .filter(col => FIRST_COLUMNS_IN_VIEW.indexOf(col.fieldKey) === -1)
            .map(col => col.fieldKey)
    );
    return { hasUpdates, columns: columnKeys.map(fieldKey => ({ fieldKey })) };
}

export const SAMPLE_FINDER_VIEW_NAME = 'Sample Finder';

function getSampleFinderConfigId(finderId: string, suffix: string): string {
    const { uuids } = getServerContext();
    // We need to make sure these ids are unique per application load since
    // the server holds on to the selection keys even after the grid is gone.
    return uuids[0] + '-' + finderId + '|' + suffix;
}

// exported for jest testing
export function getSampleFinderCommonConfigs(cards: FilterProps[]): Partial<QueryConfig> {
    const baseFilters = [];
    const requiredColumns = [...SAMPLE_STATUS_REQUIRED_COLUMNS];
    cards.forEach(card => {
        const cardColumnName = getFilterCardColumnName(card.entityDataType, card.schemaQuery);

        if (card.filterArray?.length) {
            const filters = [];
            card.filterArray.forEach(f => {
                const filter = f.filter;
                const newColumnName = cardColumnName + '/' + filter.getColumnName();
                const updatedFilter = Filter.create(newColumnName, filter.getValue(), filter.getFilterType());
                filters.push(updatedFilter);
                requiredColumns.push(newColumnName);
            });
            baseFilters.push(...filters);
        } else {
            requiredColumns.push(cardColumnName);
            baseFilters.push(Filter.create(cardColumnName + '/Name', null, Filter.Types.NONBLANK));
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
): { [key: string]: QueryConfig } {
    const omittedColumns = getOmittedSampleTypeColumns(user);
    const commonConfig = getSampleFinderCommonConfigs(cards);
    const allSamplesKey = getSampleFinderConfigId(finderId, 'exp/materials');
    const configs: { [key: string]: QueryConfig } = {
        [allSamplesKey]: {
            id: allSamplesKey,
            title: 'All Samples',
            schemaQuery: SchemaQuery.create(
                SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
                SCHEMAS.EXP_TABLES.MATERIALS.queryName,
                SAMPLE_FINDER_VIEW_NAME
            ),
            omittedColumns: [...omittedColumns, 'Run'],
            ...commonConfig,
        },
    };

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
    return configs;
}

export const SAMPLE_SEARCH_FILTER_TYPES_TO_EXCLUDE = [
    Filter.Types.CONTAINS.getURLSuffix(),
    Filter.Types.DOES_NOT_CONTAIN.getURLSuffix(),
    Filter.Types.DOES_NOT_START_WITH.getURLSuffix(),
    Filter.Types.STARTS_WITH.getURLSuffix(),
    Filter.Types.CONTAINS_ONE_OF.getURLSuffix(),
    Filter.Types.CONTAINS_NONE_OF.getURLSuffix(),
];

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
    ...NEGATE_FILTERS,
];

export function isBetweenOperator(urlSuffix: string): boolean {
    return ['between', 'notbetween'].indexOf(urlSuffix) > -1;
}

export const FILTER_URL_SUFFIX_ANY_ALT = 'any';

export function getSampleFinderFilterTypesForType(jsonType: JsonType): FieldFilterOption[] {
    const filterList = Filter.getFilterTypesForType(jsonType).filter(function (result) {
        return SAMPLE_SEARCH_FILTER_TYPES_TO_EXCLUDE.indexOf(result.getURLSuffix()) === -1;
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
        } as FieldFilterOption;
    });
}

export function isFilterUrlSuffixMatch(suffix: string, filterType: Filter.IFilterType): boolean {
    if (suffix === 'any' && filterType.getURLSuffix() === '') return true;
    return suffix === filterType.getURLSuffix();
}

export function filterToJson(filter: Filter.IFilter): string {
    return encodeURIComponent(filter.getURLParameterName()) + '=' + encodeURIComponent(filter.getURLParameterValue());
}

export function filterFromJson(filterStr: string): Filter.IFilter {
    return Filter.getFiltersFromUrl(filterStr, 'query')?.[0];
}

export function searchFiltersToJson(filterProps: FilterProps[], filterChangeCounter: number): string {
    const filterPropsObj = [];

    filterProps.forEach(filterProp => {
        const filterPropObj = { ...filterProp };
        const filterArrayObjs = [];
        [...filterPropObj.filterArray].forEach(field => {
            filterArrayObjs.push({
                fieldKey: field.fieldKey,
                fieldCaption: field.fieldCaption,
                filter: filterToJson(field.filter),
            });
        });
        filterPropObj.filterArray = filterArrayObjs;
        filterPropsObj.push(filterPropObj);
    });

    return JSON.stringify({
        filters: filterPropsObj,
        filterChangeCounter,
    });
}

export function searchFiltersFromJson(filterPropsStr: string): SearchSessionStorageProps {
    const filters: FilterProps[] = [];
    const obj = JSON.parse(filterPropsStr);
    const filterPropsObj: any[] = obj['filters'];
    const filterChangeCounter: number = obj['filterChangeCounter'];
    filterPropsObj.forEach(filterPropObj => {
        const filterArray = [];
        filterPropObj['filterArray']?.forEach(field => {
            filterArray.push({
                fieldKey: field.fieldKey,
                fieldCaption: field.fieldCaption,
                filter: filterFromJson(field.filter),
                expanded: field.expanded,
            });
        });
        filterPropObj['filterArray'] = filterArray;
        filters.push(filterPropObj as FilterProps);
    });

    return {
        filters,
        filterChangeCounter,
    };
}

const EMPTY_VALUE_DISPLAY = '[blank]';
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

export function getFieldFilterKey(fieldFilter: FieldFilter, schemaQuery?: SchemaQuery): string {
    return schemaQuery.schemaName + '|' + schemaQuery.queryName + '|' + fieldFilter.fieldKey;
}

export function getFieldFiltersValidationResult(dataTypeFilters: { [key: string]: FieldFilter[] }): string {
    let errorMsg = 'Invalid/incomplete filter values. Please correct input for fields. ',
        hasError = false,
        parentFields = {};
    Object.keys(dataTypeFilters).forEach(parent => {
        const filters = dataTypeFilters[parent];
        filters.forEach(fieldFilter => {
            const filter = fieldFilter.filter;
            if (filter.getFilterType().isDataValueRequired()) {
                const value = filter.getValue();
                const isBetween = isBetweenOperator(filter.getFilterType().getURLSuffix());

                let fieldError = false;
                if (value === undefined || value === null) {
                    fieldError = true;
                } else if (isBetween) {
                    if (!Array.isArray(value) || value.length < 2) fieldError = true;
                }

                if (fieldError == true) {
                    hasError = true;
                    const fields = parentFields[parent] ?? [];
                    fields.push(fieldFilter.fieldCaption);
                    parentFields[parent] = fields;
                }
            }
        });
    });

    if (hasError) {
        Object.keys(parentFields).forEach(parent => {
            errorMsg += parent + ': ' + parentFields[parent].join(', ') + '. ';
        });
        return errorMsg;
    }

    return null;
}

// TODO add jest
export function getUpdateFilterExpressionFilter(newFilterType: FieldFilterOption, field: QueryColumn, previousFirstFilterValue?: any, previousSecondFilterValue?: any, newFilterValue?: any, isSecondValue?: boolean, clearBothValues?: boolean) : Filter.IFilter {
        if (!newFilterType) {
            return null;
        }

        const filterType = resolveFilterType(newFilterType?.value, field);
        if (!filterType)
            return null;

        let filter: Filter.IFilter;

        if (!newFilterType.valueRequired) {
            filter = Filter.create(resolveFieldKey(field.name, field), null, filterType);
        } else {
            let value = newFilterValue;
            if (newFilterType?.betweenOperator) {
                if (clearBothValues) {
                    value = null;
                } else if (isSecondValue) {
                    if (!newFilterValue)
                        value = previousFirstFilterValue ? previousFirstFilterValue : '';
                    else
                        value = (previousFirstFilterValue ? previousFirstFilterValue + ',' : '') + newFilterValue;
                } else {
                    if (!newFilterValue)
                        value = previousSecondFilterValue ? previousSecondFilterValue : '';
                    else
                        value = newFilterValue + (previousSecondFilterValue ? ',' + previousSecondFilterValue : '');
                }
            } else if (!value && field.jsonType === 'boolean') value = 'false';

            filter = Filter.create(resolveFieldKey(field.name, field), value, filterType);
        }

        return filter;
}
