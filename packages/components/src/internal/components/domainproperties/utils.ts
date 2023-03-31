import { DOMAIN_FIELD_PREFIX } from './constants';
import {IParentAlias} from "../entities/models";
import {OrderedMap, Set} from "immutable";

export function createFormInputName(name: string): string {
    return [DOMAIN_FIELD_PREFIX, name].join('-');
}

// TODO we should rename this to include the word "domain" in the name since it is exported from the package
export function createFormInputId(name: string, domainIndex: number, rowIndex: number): string {
    return [DOMAIN_FIELD_PREFIX, name, domainIndex, rowIndex].join('-');
}

export function getNameFromId(id: string): string {
    const parts = id.split('-');
    if (parts.length === 4) {
        return parts[1];
    }

    return undefined;
}

export function getIndexFromId(id: string): number {
    const parts = id.split('-');
    if (parts.length === 4) {
        return parseInt(parts[3]);
    }

    return -1;
}

function updateAliasValue(parentAliases: OrderedMap<string, IParentAlias>, id: string, field: string, newValue: any): IParentAlias {
    return {
        ...parentAliases.get(id),
        isDupe: false, // Clear error because of change
        [field]: newValue,
    } as IParentAlias;
}

export function getParentAliasChangeResult(parentAliases: OrderedMap<string, IParentAlias>, id: string, field: string, newValue: any): OrderedMap<string, IParentAlias> {
    const changedAlias = updateAliasValue(parentAliases, id, field, newValue);
    return parentAliases.set(id, changedAlias);
}

/**
 * returns a Set of ids corresponding to the aliases that have duplicate alias values
 */
export function getDuplicateAlias(parentAliases: OrderedMap<string, IParentAlias>, returnAliases = false): Set<string> {
    let uniqueAliases = Set<string>();
    let dupeAliases = Set<string>();
    let dupeIds = Set<string>();

    if (parentAliases) {
        parentAliases.forEach((alias: IParentAlias) => {
            if (uniqueAliases.has(alias.alias)) {
                dupeIds = dupeIds.add(alias.id);
                dupeAliases = dupeAliases.add(alias.alias);
            } else {
                uniqueAliases = uniqueAliases.add(alias.alias);
            }
        });
    }

    return returnAliases ? dupeAliases : dupeIds;
}

export function getParentAliasUpdateDupesResults(parentAliases: OrderedMap<string, IParentAlias>, id: string): OrderedMap<string, IParentAlias> {
    if (!parentAliases) {
        return null;
    }

    const dupes = getDuplicateAlias(parentAliases);
    let newAliases = OrderedMap<string, IParentAlias>();
    parentAliases.forEach((alias: IParentAlias) => {
        const isDupe = dupes && dupes.has(alias.id);
        let changedAlias = alias;
        if (isDupe !== alias.isDupe) {
            changedAlias = updateAliasValue(parentAliases, alias.id, 'isDupe', isDupe);
        }

        if (alias.id === id) {
            changedAlias = {
                ...changedAlias,
                ignoreAliasError: false,
                ignoreSelectError: false,
            };
        }

        newAliases = newAliases.set(alias.id, changedAlias);
    });

    return newAliases;
}

export function parentAliasInvalid(alias: Partial<IParentAlias>): boolean {
    if (!alias) return true;

    const aliasValueInvalid = !alias.alias || alias.alias.trim() === '';
    const parentValueInvalid = !alias.parentValue || !alias.parentValue.value;

    return !!(aliasValueInvalid || parentValueInvalid || alias.isDupe);
}
