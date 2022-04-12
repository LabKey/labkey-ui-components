import { List } from 'immutable';
import { Filter } from '@labkey/api';

import { QueryColumn } from '../../..';

import { ActionValue } from './actions/Action';
import { SearchAction } from './actions/Search';

export enum ChangeType {
    add = 'add',
    remove = 'remove',
    modify = 'modify',
    none = 'none',
}

export interface Change {
    type: ChangeType;
    index?: number;
}

/**
 * From the supplied columnName this method will determine which columns in the "columns" list
 * match based on name. If none match, then the columnName will attempt to resolve against each
 * column's shortCaption (see QueryColumn).
 * @param columns
 * @param columnName
 * @returns {List<QueryColumn>}
 */
export function parseColumns(columns: List<QueryColumn>, columnName: string): List<QueryColumn> {
    const _columnName = columnName ? columnName.toLowerCase() : '';

    // First, attempt to match by column name/lookup
    const nameMatches = columns
        .filter(c => {
            if (_columnName.indexOf('/') > -1) {
                if (c.isLookup()) {
                    const name = _columnName.split('/')[0];
                    return c.name.toLowerCase() === name;
                }

                return false;
            }

            return c.name.toLowerCase() === _columnName;
        })
        .toList();

    // Second, if there are no matches by column name/lookup, attempt to match by column shortCaption
    if (nameMatches.size === 0) {
        return columns.filter(c => c.shortCaption.toLowerCase() === _columnName).toList();
    }

    return nameMatches;
}

/**
 * Determines what the field key should be from a supplied columnName.
 * If a column (QueryColumn) is supplied it will override the columnName for either
 * the column's lookup column or the column's name.
 * @param columnName
 * @param column
 * @returns {any}
 */
export function resolveFieldKey(columnName: string, column?: QueryColumn): string {
    return column?.resolveFieldKey() ?? columnName;
}

export function removeActionValue(actionValues: ActionValue[], indexToRemove: number): ActionValue[] {
    if (indexToRemove < actionValues.length) {
        const newActionValues = [...actionValues];
        newActionValues.splice(indexToRemove, 1);
        return newActionValues;
    }

    return actionValues;
}

export function replaceSearchValue(
    actionValues: ActionValue[],
    value: string,
    searchAction: SearchAction
): { actionValues: ActionValue[]; change: Change } {
    const hasNewSearch = value?.length > 0;
    const existingSearchIndex = actionValues.findIndex(actionValue => actionValue.action.keyword === 'search');
    const newActionValues = actionValues.filter(actionValue => actionValue.action.keyword !== 'search');
    if (hasNewSearch) {
        newActionValues.push({
            action: searchAction,
            value,
            valueObject: Filter.create('*', value, Filter.Types.Q),
        });
    }

    let change = { type: ChangeType.add } as Change;
    if (existingSearchIndex > -1) {
        if (hasNewSearch) {
            change = { type: ChangeType.modify, index: existingSearchIndex };
        } else {
            change = { type: ChangeType.remove, index: existingSearchIndex };
        }
    }

    return { actionValues: newActionValues, change };
}

export function filterActionValuesByType(actionValues: ActionValue[], keyword: string): ActionValue[] {
    return actionValues.filter(actionValue => actionValue.action.keyword === keyword);
}
