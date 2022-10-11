import { List, Map } from 'immutable';

import { getCurrentProductName } from '../../app/utils';

import { ParentIdData } from '../samples/actions';

import { naturalSort } from '../../../public/sort';
import { QueryInfo } from '../../../public/QueryInfo';
import { EditableColumnMetadata } from '../editable/EditableGrid';
import { SCHEMAS } from '../../schemas';

import { EntityChoice, EntityDataType, IEntityTypeOption } from './models';

export function getInitialParentChoices(
    parentTypeOptions: List<IEntityTypeOption>,
    parentDataType: EntityDataType,
    childData: Record<string, any>,
    parentIdData: Record<string, ParentIdData>
): List<EntityChoice> {
    let parentValuesByType = Map<string, EntityChoice>();

    if (Object.keys(childData).length > 0) {
        const inputs: Array<Record<string, any>> = childData[parentDataType.inputColumnName];
        if (inputs) {
            // group the inputs by parent type so we can show each in its own grid.
            inputs.forEach(inputRow => {
                const inputValue = inputRow.value;
                const typeValue = parentIdData[inputValue]?.parentId;
                const typeOption = parentTypeOptions.find(
                    option => option[parentDataType.inputTypeValueField] === typeValue
                );
                if (!typeOption) {
                    console.warn('Unable to find parent type.', typeValue);
                } else {
                    if (!parentValuesByType.has(typeOption.query)) {
                        parentValuesByType = parentValuesByType.set(typeOption.query, {
                            type: typeOption,
                            ids: [],
                            value: undefined,
                            gridValues: [],
                        });
                    }
                    const updatedChoice = parentValuesByType.get(typeOption.query);
                    updatedChoice.ids.push(inputValue);
                    // when using the data for an editable grid, we need the RowId/DisplayValue pairs
                    if (parentIdData[inputValue]) {
                        updatedChoice.gridValues.push({
                            value: parentIdData[inputValue].rowId,
                            displayValue: inputRow?.displayValue,
                        });
                    }

                    parentValuesByType = parentValuesByType.set(typeOption.query, updatedChoice);
                }
            });
        }
    }
    // having collected the values by type, create a list, sorted by the type label and return that.
    return parentValuesByType.sortBy(choice => choice.type.label, naturalSort).toList();
}

export function getUniqueIdColumnMetadata(queryInfo: QueryInfo): Map<string, EditableColumnMetadata> {
    let columnMetadata = Map<string, EditableColumnMetadata>();
    queryInfo?.columns
        .filter(column => column.isUniqueIdColumn)
        .forEach(column => {
            columnMetadata = columnMetadata.set(column.fieldKey, {
                readOnly: true,
                placeholder: '[generated value]',
                toolTip: `A unique value will be provided by ${getCurrentProductName()} for this field.`,
            });
        });
    return columnMetadata;
}

export function getEntityNoun(entityDataType: EntityDataType, quantity: number): string {
    return quantity === 1 ? entityDataType.nounSingular : entityDataType.nounPlural;
}

export function getEntityDescription(entityDataType: EntityDataType, quantity: number): string {
    return quantity === 1 ? entityDataType.descriptionSingular : entityDataType.descriptionPlural;
}

export function isSampleEntity(dataType: EntityDataType) {
    return dataType.instanceSchemaName === SCHEMAS.SAMPLE_SETS.SCHEMA;
}

export function isDataClassEntity(dataType: EntityDataType) {
    return dataType.instanceSchemaName === SCHEMAS.DATA_CLASSES.SCHEMA;
}
