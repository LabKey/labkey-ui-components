import { List, Map, Set } from 'immutable';


import { getCurrentProductName } from '../../app/utils';

import { ParentIdData } from '../samples/actions';

import { DELIMITER } from '../forms/constants';

import { EntityChoice, EntityDataType, IEntityTypeOption } from './models';
import { naturalSort } from '../../../public/sort';
import { caseInsensitive, parseCsvString } from '../../util/utils';
import { QueryInfo } from '../../../public/QueryInfo';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { EditableColumnMetadata } from '../editable/EditableGrid';
import { SCHEMAS } from '../../schemas';

export function parentValuesDiffer(
    sortedOriginalParents: List<EntityChoice>,
    currentParents: List<EntityChoice>
): boolean {
    const sortedCurrentParents = currentParents
        .sortBy(choice => (choice.type ? choice.type.label : '~~NO_TYPE~~'), naturalSort)
        .toList();
    const difference = sortedOriginalParents.find((original, index) => {
        const current = sortedCurrentParents.get(index);
        if (!current) return true;
        if (current.type && original.type.rowId !== current.type.rowId) {
            return true;
        }
        const originalValues = original.value
            ? parseCsvString(original.value, DELIMITER).sort(naturalSort).join(DELIMITER)
            : '';
        const currentValues = current.value
            ? parseCsvString(current.value, DELIMITER).sort(naturalSort).join(DELIMITER)
            : '';
        if (originalValues !== currentValues) {
            return true;
        }
    });
    if (difference) {
        return true;
    }
    // we have more current parents than the original and we have selected a value for at least one of these parents.
    if (sortedCurrentParents.size > sortedOriginalParents.size) {
        return (
            sortedCurrentParents.slice(sortedOriginalParents.size).find(parent => parent.value !== undefined) !==
            undefined
        );
    }
    return false;
}

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

export function getUpdatedRowForParentChanges(
    originalParents: List<EntityChoice>,
    currentParents: List<EntityChoice>,
    childData: Record<string, any>,
    childQueryInfo?: QueryInfo
): Record<string, any> {
    const definedCurrentParents = currentParents
        .filter(parent => parent.type !== null && parent.type !== undefined)
        .toList();
    const updatedValues = {};
    if (definedCurrentParents.isEmpty()) {
        // have no current parents but have original parents, send in empty strings so original parents are removed.
        originalParents?.forEach(parentChoice => {
            updatedValues[parentChoice.type.entityDataType.insertColumnNamePrefix + parentChoice.type.label] = null;
        });
    } else {
        let definedParents = Set<string>();
        definedCurrentParents.forEach(parentChoice => {
            // Label may seem wrong here, but it is the same as query when extracted from the original query to get
            // the entity types.
            updatedValues[parentChoice.type.entityDataType.insertColumnNamePrefix + parentChoice.type.label] =
                parentChoice.value || null;
            definedParents = definedParents.add(parentChoice.type.label);
        });
        // Issue 40194: for any original parents that have been removed, send null values so they will actually be removed
        originalParents?.forEach(parent => {
            if (!definedParents.contains(parent.type.label)) {
                updatedValues[parent.type.entityDataType.insertColumnNamePrefix + parent.type.label] = null;
            }
        });
    }

    childQueryInfo?.getPkCols().forEach(pkCol => {
        const pkVal = childData[pkCol.fieldKey]?.['value'];

        if (pkVal !== undefined && pkVal !== null) {
            updatedValues[pkCol.fieldKey] = pkVal;
        } else {
            console.warn('Unable to find value for pkCol "' + pkCol.fieldKey + '"');
        }
    });
    return updatedValues;
}

export function createEntityParentKey(schemaQuery: SchemaQuery, id?: string): string {
    const keys = [schemaQuery.schemaName, schemaQuery.queryName];
    if (id) {
        keys.push(id);
    }
    return keys.join(':').toLowerCase();
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

export function getUpdatedLineageRowsForBulkEdit(
    nonAliquots: Record<string, any>,
    selectedParents: List<EntityChoice>,
    originalParents: Record<string, List<EntityChoice>>,
    queryInfo: QueryInfo
): any[] {
    const rows = [];
    Object.keys(nonAliquots).forEach(rowId => {
        const updatedValues = {};
        let haveUpdate = false;

        // Find the types that are included and use those for change comparison.
        // Types that are not represented in the selected parents won't be changed.
        selectedParents.forEach(selected => {
            if (selected.type) {
                let originalValue = null;
                const possibleChange = originalParents[rowId].find(p => p.type.lsid == selected.type.lsid);
                if (possibleChange) {
                    originalValue = possibleChange.gridValues
                        .map(gridValue => gridValue.displayValue)
                        .sort(naturalSort)
                        .join(',');
                }
                const selValue = selected.value
                    ? parseCsvString(selected.value, ',', false).sort(naturalSort).join(',')
                    : null;
                if (originalValue !== selValue) {
                    updatedValues[selected.type.entityDataType.insertColumnNamePrefix + selected.type.label] = selValue;
                    haveUpdate = true;
                }
            }
        });
        if (haveUpdate) {
            queryInfo.getPkCols().forEach(pkCol => {
                const pkVal = caseInsensitive(nonAliquots[rowId], pkCol.fieldKey)?.['value'];

                if (pkVal !== undefined && pkVal !== null) {
                    updatedValues[pkCol.fieldKey] = pkVal;
                } else {
                    console.warn('Unable to find value for pkCol "' + pkCol.fieldKey + '"');
                }
            });
            rows.push(updatedValues);
        }
    });
    return rows;
}

export function isSampleEntity(dataType: EntityDataType) {
    return dataType.instanceSchemaName === SCHEMAS.SAMPLE_SETS.SCHEMA;
}

export function isDataClassEntity(dataType: EntityDataType) {
    return dataType.instanceSchemaName === SCHEMAS.DATA_CLASSES.SCHEMA;
}


export function getCrossFolderSelectionMsg(crossFolderSelectionCount: number, currentFolderSelectionCount: number, noun: string, nounPlural: string): string {
    let first = '';
    if (!crossFolderSelectionCount)
        return undefined;
    if (currentFolderSelectionCount === 0) {
        if (crossFolderSelectionCount === 1)
            first = `The ${noun} you selected does not `;
        else
            first = `The ${nounPlural} you selected don't `;
    }
    else
        first = `Some of the ${nounPlural} you selected don't `;
    first += 'belong to this project.';
    const second = ` Please select ${nounPlural} from only this project, or navigate to the appropriate project to work with them.`;
    return first + second;
}
