import { EntityDataType } from '../entities/models';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { SAMPLE_STATUS_REQUIRED_COLUMNS } from '../samples/constants';

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

export function getFinderViewColumnsConfig(queryModel: QueryModel): {hasUpdates: boolean, columns: any} {
    const defaultDisplayColumns = queryModel.queryInfo?.getDisplayColumns().toArray();
    const displayColumnKeys = defaultDisplayColumns.map(col => (col.fieldKey));
    const columnKeys = [];
    let hasUpdates = false;
    queryModel.requiredColumns.forEach(fieldKey => {
        if (displayColumnKeys.indexOf(fieldKey) == -1 && SAMPLE_STATUS_REQUIRED_COLUMNS.indexOf(fieldKey) == -1) {
            columnKeys.push(fieldKey);
            hasUpdates = true;
        }
    });
    columnKeys.push(...defaultDisplayColumns.map(col => (col.fieldKey)));
    return { hasUpdates, columns: columnKeys.map(fieldKey => ({fieldKey})) };
}
