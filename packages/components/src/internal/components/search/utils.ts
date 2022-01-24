import { Filter, getServerContext } from "@labkey/api";

import { EntityDataType } from '../entities/models';
import { JsonType } from "../domainproperties/PropDescType";
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryConfig, QueryModel } from '../../../public/QueryModel/QueryModel';
import { SAMPLE_STATUS_REQUIRED_COLUMNS } from '../samples/constants';
import { User } from '../base/models/User';

import { getOmittedSampleTypeColumns } from '../samples/utils';
import { SCHEMAS } from '../../schemas';

import {FieldFilter, FilterProps, SearchSessionStorageProps} from './models';

export function getFinderStartText(parentEntityDataTypes: EntityDataType[]): string {
    const hintText = 'Start by adding ';
    let names = parentEntityDataTypes.map(entityType => entityType.nounAsParentSingular).join(', ');
    const lastComma = names.lastIndexOf(',');
    if (lastComma >= 0) {
        names = names.substr(0, lastComma) + ' or' + names.substr(lastComma + 1);
    }
    return hintText + names + ' properties.';
}

export const SAMPLE_SEARCH_FILTER_TYPES_TO_EXCLUDE = [Filter.Types.CONTAINS.getURLSuffix(), Filter.Types.DOES_NOT_CONTAIN.getURLSuffix(), Filter.Types.DOES_NOT_START_WITH.getURLSuffix(), Filter.Types.STARTS_WITH.getURLSuffix(), Filter.Types.CONTAINS_ONE_OF.getURLSuffix(), Filter.Types.CONTAINS_NONE_OF.getURLSuffix()];

export const SAMPLE_SEARCH_FILTER_TYPES_SKIP_TITLE = [Filter.Types.EQUAL.getURLSuffix(), Filter.Types.DATE_EQUAL.getURLSuffix(), Filter.Types.IN.getURLSuffix(), Filter.Types.BETWEEN.getURLSuffix()];

export function getSampleFinderFilterTypesForType(jsonType: JsonType) : any[] {
    let filterList = Filter.getFilterTypesForType(jsonType)
        .filter(function(result) {
            return SAMPLE_SEARCH_FILTER_TYPES_TO_EXCLUDE.indexOf(result.getURLSuffix()) === -1;
        })
    ;

    if (jsonType === 'date') {
        filterList.push(Filter.Types.BETWEEN);
        filterList.push(Filter.Types.NOT_BETWEEN);
    }

    let filters = [];

    filterList.forEach(filter => {
        let urlSuffix = filter.getURLSuffix();
        if (urlSuffix === '')
            urlSuffix = 'any';
        filters.push({
            value: urlSuffix,
            label: filter.getDisplayText(),
            valueRequired: filter.isDataValueRequired(),
            multiValue: filter.isMultiValued(),
            betweenOperator: ['between', 'notbetween'].indexOf(urlSuffix) > -1
        });
    })

    return filters;
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
    return uuids[0] + "-" + finderId + '|' + suffix;
}

// exported for jest testing
export function getSampleFinderCommonConfigs(cards: FilterProps[]): Partial<QueryConfig> {
    const baseFilters = [];
    const requiredColumns = [...SAMPLE_STATUS_REQUIRED_COLUMNS];
    cards.forEach(card => {
        const cardColumnName = getFilterCardColumnName(card.entityDataType, card.schemaQuery);

        if (card.filterArray?.length) {
            let filters = [];
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

export function filterToJson(filter: Filter.IFilter) : string {
    return encodeURIComponent(filter.getURLParameterName()) + '=' + encodeURIComponent(filter.getURLParameterValue());
}

export function filterFromJson(filterStr: string) : Filter.IFilter {
    return Filter.getFiltersFromUrl(filterStr, 'query')?.[0];
}

export function searchFiltersToJson(filterProps: FilterProps[], filterChangeCounter: number) : string {
    let filterPropsObj = [];

    filterProps.forEach(filterProp => {
        let filterPropObj = {...filterProp};
        const filterArrayObjs = [];
        [...filterPropObj.filterArray].forEach(field => {
            filterArrayObjs.push({
                fieldKey: field.fieldKey,
                fieldCaption: field.fieldCaption,
                filter: filterToJson(field.filter)
            });
        });
        filterPropObj.filterArray = filterArrayObjs;
        filterPropsObj.push(filterPropObj)
    })

    return JSON.stringify({
        filters: filterPropsObj,
        filterChangeCounter
    });
}

export function searchFiltersFromJson(filterPropsStr: string) : SearchSessionStorageProps{
    let filters : FilterProps[] = [];
    let obj = JSON.parse(filterPropsStr);
    let filterPropsObj : any[] = obj['filters'];
    const filterChangeCounter : number = obj['filterChangeCounter'];
    filterPropsObj.forEach(filterPropObj => {
        let filterArray = [];
        filterPropObj['filterArray']?.forEach(field => {
            filterArray.push({
                fieldKey: field.fieldKey,
                fieldCaption: field.fieldCaption,
                filter: filterFromJson(field.filter),
                expanded: field.expanded,
            });
        });
        filterPropObj['filterArray'] = filterArray;
        filters.push(filterPropObj as FilterProps)
    });

    return {
        filters,
        filterChangeCounter
    };
}

const EMPTY_VALUE_DISPLAY = '[blank]';
export function getFilterValuesAsArray(filter: Filter.IFilter, blankValue?: string) : string[] {
    let values = [], rawValues = [];
    const rawValue = filter.getValue();
    if (Array.isArray(rawValue)) {
        rawValues = [...rawValue];
    }
    else {
        rawValues = rawValue.split(';');

    }

    rawValues.forEach(v => {
        values.push(v == '' ? (blankValue ?? EMPTY_VALUE_DISPLAY) : v);
    })


    return values;
}


export function getFieldFilterKey(fieldFilter: FieldFilter,  schemaQuery?: SchemaQuery): string  {
    return schemaQuery.schemaName + '|' + schemaQuery.queryName + '|' + fieldFilter.fieldKey;
}


