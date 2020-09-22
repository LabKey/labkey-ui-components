import { List, Map, Set } from 'immutable';

import { naturalSort, QueryGridModel } from '../../../index';
import { DELIMITER } from '../forms/input/SelectInput';

import { PARENT_DATA_GRID_PREFIX } from './constants';
import { EntityChoice, EntityDataType, IEntityTypeOption } from './models';

export function getParentGridPrefix(parentDataType: EntityDataType): string {
    return parentDataType.typeListingSchemaQuery.queryName + '-' + PARENT_DATA_GRID_PREFIX;
}

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
        const originalValues = original.value ? original.value.split(DELIMITER).sort(naturalSort).join(DELIMITER) : '';
        const currentValues = current.value ? current.value.split(DELIMITER).sort(naturalSort).join(DELIMITER) : '';
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
    childModel: QueryGridModel
): List<EntityChoice> {
    let parentValuesByType = Map<string, EntityChoice>();

    if (childModel && childModel.isLoaded) {
        const row = childModel.getRow();

        if (row.size > 0) {
            const inputs: List<Map<string, any>> = row.get(parentDataType.inputColumnName);
            const inputTypes: List<Map<string, any>> = row.get(parentDataType.inputTypeColumnName);
            if (inputs && inputTypes) {
                // group the inputs by parent type so we can show each in its own grid.
                inputTypes.forEach((typeMap, index) => {
                    // I'm not sure when the type could have more than one value here, but 'value' is an array
                    const typeValue = typeMap.getIn(['value', 0]);
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
                            });
                        }
                        const updatedChoice = parentValuesByType.get(typeOption.query);
                        updatedChoice.ids.push(inputs.getIn([index, 'value']));
                        parentValuesByType = parentValuesByType.set(typeOption.query, updatedChoice);
                    }
                });
            }
        }
    }
    // having collected the values by type, create a list, sorted by the type label and return that.
    return parentValuesByType.sortBy(choice => choice.type.label, naturalSort).toList();
}

export function getUpdatedRowForParentChanges(
    parentDataType: EntityDataType,
    originalParents: List<EntityChoice>,
    currentParents: List<EntityChoice>,
    childModel: QueryGridModel
) {
    const queryData = childModel.getRow();
    const queryInfo = childModel.queryInfo;

    const definedCurrentParents = currentParents
        .filter(parent => parent.type !== null && parent.type !== undefined)
        .toList();
    const updatedValues = {};
    if (definedCurrentParents.isEmpty()) {
        // have no current parents but have original parents, send in empty strings so original parents are removed.
        originalParents.forEach(parentChoice => {
            updatedValues[parentDataType.insertColumnNamePrefix + parentChoice.type.label] = null;
        });
    } else {
        let definedParents = Set<string>();
        definedCurrentParents.forEach(parentChoice => {
            // Label may seem wrong here, but it is the same as query when extracted from the original query to get
            // the entity types.
            updatedValues[parentDataType.insertColumnNamePrefix + parentChoice.type.label] = parentChoice.value || null;
            definedParents = definedParents.add(parentChoice.type.label);
        });
        // Issue 40194: for any original parents that have been removed, send null values so they will actually be removed
        originalParents.forEach(parent => {
            if (!definedParents.contains(parent.type.label)) {
                updatedValues[parentDataType.insertColumnNamePrefix + parent.type.label] = null;
            }
        });
    }

    queryInfo.getPkCols().forEach(pkCol => {
        const pkVal = queryData.getIn([pkCol.fieldKey, 'value']);

        if (pkVal !== undefined && pkVal !== null) {
            updatedValues[pkCol.fieldKey] = pkVal;
        } else {
            console.warn('Unable to find value for pkCol "' + pkCol.fieldKey + '"');
        }
    });
    return updatedValues;
}
