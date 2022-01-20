import { EntityDataType } from '../entities/models';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryConfig, QueryModel } from '../../../public/QueryModel/QueryModel';
import { SAMPLE_STATUS_REQUIRED_COLUMNS } from '../samples/constants';
import { User } from '../base/models/User';
import { FilterProps } from './FilterCards';
import { getOmittedSampleTypeColumns } from '../samples/utils';
import { SCHEMAS } from '../../schemas';
import { Filter } from '@labkey/api';

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
    return entityDataType.inputColumnName
        .replace("Inputs", 'QueryableInputs')
        .replace("First", schemaQuery.queryName);
}

const FIRST_COLUMNS_IN_VIEW = ["Name", "SampleSet"];

export function getFinderViewColumnsConfig(queryModel: QueryModel): {hasUpdates: boolean, columns: any} {
    const defaultDisplayColumns = queryModel.queryInfo?.getDisplayColumns().toArray();
    const displayColumnKeys = defaultDisplayColumns.map(col => (col.fieldKey));
    const columnKeys = [];
    FIRST_COLUMNS_IN_VIEW.forEach(fieldKey => {
        if (displayColumnKeys.indexOf(fieldKey) >= 0) {
            columnKeys.push(fieldKey);
        }
    })
    let hasUpdates = false;
    queryModel.requiredColumns.forEach(fieldKey => {
        if (displayColumnKeys.indexOf(fieldKey) == -1 && SAMPLE_STATUS_REQUIRED_COLUMNS.indexOf(fieldKey) === -1) {
            columnKeys.push(fieldKey);
            hasUpdates = true;
        }
    });
    columnKeys.push(...defaultDisplayColumns.filter(col => FIRST_COLUMNS_IN_VIEW.indexOf(col.fieldKey) === -1).map(col => (col.fieldKey)));
    return { hasUpdates, columns: columnKeys.map(fieldKey => ({fieldKey})) };
}

export const SAMPLE_FINDER_VIEW_NAME = 'Sample Finder';

function getSampleFinderConfigId(finderId: string, suffix: string): string {
    return finderId + '|' + suffix;
}

// exported for jest testing
export function getSampleFinderCommonConfigs(cards: FilterProps[]): Partial<QueryConfig> {
    const baseFilters = [];
    const requiredColumns = [...SAMPLE_STATUS_REQUIRED_COLUMNS];
    cards.forEach(card => {
        const cardColumnName = getFilterCardColumnName(card.entityDataType, card.schemaQuery);

        if (card.filterArray?.length) {
            card.filterArray.forEach(filter => {
                requiredColumns.push(cardColumnName + "/" + filter.getColumnName());
            });
            baseFilters.push(...card.filterArray);
        } else {
            requiredColumns.push(cardColumnName);
            baseFilters.push(Filter.create(cardColumnName + '/Name', null, Filter.Types.NONBLANK));
        }
    });
    return {
        requiredColumns,
        baseFilters
    };
}

export function getSampleFinderQueryConfigs(user: User, sampleTypeNames: string[], cards: FilterProps[], finderId: string): { [key: string]: QueryConfig } {
    const omittedColumns = getOmittedSampleTypeColumns(user);
    const commonConfig = getSampleFinderCommonConfigs(cards);
    const allSamplesKey = getSampleFinderConfigId(finderId, 'exp/materials');
    const configs: { [key: string]: QueryConfig } = {
        [allSamplesKey]: {
            id: allSamplesKey,
            title: 'All Samples',
            schemaQuery: SchemaQuery.create(SCHEMAS.EXP_TABLES.MATERIALS.schemaName, SCHEMAS.EXP_TABLES.MATERIALS.queryName, SAMPLE_FINDER_VIEW_NAME),
            omittedColumns: [...omittedColumns, 'Run'],
            ...commonConfig
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
