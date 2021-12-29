import { EntityDataType } from '../entities/models';

export function getFinderStartText(parentEntityDataTypes: EntityDataType[]) {
    let hintText = "Start by adding ";
    let names = parentEntityDataTypes.map(entityType => entityType.nounAsParentSingular).join(", ");
    const lastComma = names.lastIndexOf(",");
    if (lastComma >= 0) {
        names = names.substr(0, lastComma) + " or" + names.substr(lastComma + 1);
    }
    return hintText + names + " properties.";
}
