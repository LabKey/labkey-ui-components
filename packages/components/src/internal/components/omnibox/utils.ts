import { List } from 'immutable';
import { QueryColumn } from '../../../index';

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
    let nameMatches = columns.filter(c => {
        if (_columnName.indexOf('/') > -1) {
            if (c.isLookup()) {
                const name = _columnName.split('/')[0];
                return c.name.toLowerCase() === name;
            }

            return false;
        }

        return c.name.toLowerCase() === _columnName;
    }).toList();

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
