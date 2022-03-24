/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, {ChangeEvent, ReactNode, FC, memo, useState, useCallback} from 'react';
import classNames from 'classnames';
import { OrderedMap, Map } from 'immutable';
import { Dropdown, MenuItem } from 'react-bootstrap';
import { Filter } from '@labkey/api';

import { GridColumn, QueryColumn, GRID_CHECKBOX_OPTIONS, QueryModel } from '..';

import { DefaultRenderer } from './renderers/DefaultRenderer';
import { getQueryColumnRenderers } from './global';
import { CustomToggle } from './components/base/CustomToggle';
import { isGridColSortFilterEnabled } from './app/utils';

export function isFilterColumnNameMatch(filter: Filter.IFilter, col: QueryColumn): boolean {
    return filter.getColumnName() === col.name || filter.getColumnName() === col.resolveFieldKey();
}

interface HeaderCellDropdownProps {
    i: number;
    column: GridColumn;
    selectable?: boolean;
    columnCount?: number;
    handleSort?: (column: QueryColumn, dir?: string) => void;
    handleFilter?: (column: QueryColumn, remove?: boolean) => void;
    model?: QueryModel;
}

const HeaderCellDropdown: FC<HeaderCellDropdownProps> = memo(props => {
    const { i, column, selectable, columnCount, handleSort, handleFilter, model } = props;
    const col: QueryColumn = column.raw;
    const gridColSortFilterEnabled = isGridColSortFilterEnabled();
    const [open, setOpen] = useState<boolean>();

    const onToggleClick = useCallback((isOpen: boolean) => {
        setOpen(isOpen);
    }, []);

    const _handleFilter = useCallback(
        (remove?: boolean) => {
            handleFilter(col, remove);
            setOpen(false);
        },
        [col, handleFilter]
    );

    const _handleSort = useCallback(
        (dir?: string) => {
            handleSort(col, dir);
            setOpen(false);
        },
        [col, handleSort]
    );

    if (!col) return null;

    const isOnlyColumn =
        columnCount !== undefined && ((selectable && columnCount === 2) || (!selectable && columnCount === 1));
    const allowColSort = handleSort !== undefined && col.sortable;

    const colQuerySortDir = model?.sorts?.find(sort => sort.get('fieldKey') === col.resolveFieldKey())?.get('dir');
    const isSortAsc = col.sorts === '+' || colQuerySortDir === '';
    const isSortDesc = col.sorts === '-' || colQuerySortDir === '-';
    const allowColFilter = handleFilter !== undefined && col.filterable;
    const colFilters = model?.filterArray.filter(filter => isFilterColumnNameMatch(filter, col)); // using filterArray to indicate user-defined filters only

    return (
        <>
            <span>
                {col.caption === '&nbsp;' ? '' : col.caption}
                {gridColSortFilterEnabled && colFilters?.length > 0 && (
                    <span
                        className="fa fa-filter grid-panel__col-header-icon"
                        title={colFilters?.length + ' filter' + (colFilters?.length > 1 ? 's' : '') + ' applied'}
                    />
                )}
                {gridColSortFilterEnabled && isSortAsc && (
                    <span className="fa fa-sort-amount-asc grid-panel__col-header-icon" title="Sorted ascending" />
                )}
                {gridColSortFilterEnabled && isSortDesc && (
                    <span className="fa fa-sort-amount-desc grid-panel__col-header-icon" title="Sorted descending" />
                )}
            </span>
            {(allowColSort || allowColFilter) && (
                <span className={classNames({ 'pull-right': (i === 0 && !selectable) || (selectable && i === 1) })}>
                    <Dropdown
                        id={`grid-menu-${i}`}
                        className={classNames('hidden-xs hidden-sm', {
                            'pull-right': isOnlyColumn || (i > 0 && !selectable) || i > 1,
                        })}
                        onToggle={onToggleClick}
                        open={open}
                    >
                        <CustomToggle bsRole="toggle">
                            <span
                                className="fa fa-chevron-circle-down"
                                style={{ color: 'lightgray', fontSize: '12px' }}
                            />
                        </CustomToggle>
                        <Dropdown.Menu>
                            {gridColSortFilterEnabled && allowColFilter && (
                                <>
                                    <MenuItem onClick={() => _handleFilter()}>
                                        <span className="fa fa-filter grid-panel__menu-icon" />
                                        &nbsp; Filter...
                                    </MenuItem>
                                    <MenuItem
                                        disabled={!colFilters || colFilters?.length === 0}
                                        onClick={
                                            colFilters?.length
                                                ? () => {
                                                    _handleFilter(true);
                                                }
                                                : undefined
                                        }
                                    >
                                        <span className="grid-panel__menu-icon-spacer" />
                                        &nbsp; Remove filter{colFilters?.length > 1 ? 's' : ''}
                                    </MenuItem>
                                    {allowColSort && (
                                        <MenuItem divider />
                                    )}
                                </>
                            )}
                            {allowColSort && (
                                <>
                                    <MenuItem
                                        disabled={isSortAsc}
                                        onClick={
                                            !isSortAsc
                                                ? () => {
                                                    _handleSort('+');
                                                }
                                                : undefined
                                        }
                                    >
                                        <span className="fa fa-sort-amount-asc grid-panel__menu-icon" />
                                        &nbsp; Sort ascending
                                    </MenuItem>
                                    <MenuItem
                                        disabled={isSortDesc}
                                        onClick={
                                            !isSortDesc
                                                ? () => {
                                                    _handleSort('-');
                                                }
                                                : undefined
                                        }
                                    >
                                        <span className="fa fa-sort-amount-desc grid-panel__menu-icon" />
                                        &nbsp; Sort descending
                                    </MenuItem>
                                    {/* Clear sort only applies for the grids that are backed by QueryModel */}
                                    {gridColSortFilterEnabled && model && (
                                        <MenuItem
                                            disabled={!isSortDesc && !isSortAsc}
                                            onClick={
                                                isSortDesc || isSortAsc
                                                    ? () => {
                                                        _handleSort();
                                                    }
                                                    : undefined
                                            }
                                        >
                                            <span className="grid-panel__menu-icon-spacer" />
                                            &nbsp; Clear sort
                                        </MenuItem>
                                    )}
                                </>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>
                </span>
            )}
        </>
    );
});

export function headerCell(
    i: number,
    column: GridColumn,
    selectable?: boolean,
    columnCount?: number,
    handleSort?: (column: QueryColumn, dir?: string) => void,
    handleFilter?: (column: QueryColumn, remove?: boolean) => void,
    model?: QueryModel
): ReactNode {
    return (
        <HeaderCellDropdown
            i={i}
            column={column}
            selectable={selectable}
            columnCount={columnCount}
            handleSort={handleSort}
            handleFilter={handleFilter}
            model={model}
        />
    );
}

export function headerSelectionCell(
    handleSelection: (event: ChangeEvent<HTMLInputElement>) => void,
    selectedState: GRID_CHECKBOX_OPTIONS,
    disabled: boolean,
    className?
) {
    const isChecked = selectedState === GRID_CHECKBOX_OPTIONS.ALL;
    const isIndeterminate = selectedState === GRID_CHECKBOX_OPTIONS.SOME;

    // Ref below is required as indeterminate is not an actual HTML attribute
    // See: https://github.com/facebook/react/issues/1798
    return (
        <input
            className={className}
            checked={isChecked}
            disabled={disabled}
            onChange={handleSelection}
            ref={elem => elem && (elem.indeterminate = isIndeterminate)}
            type="checkbox"
        />
    );
}

export function bindColumnRenderers(columns: OrderedMap<string, QueryColumn>): OrderedMap<string, QueryColumn> {
    if (columns) {
        const columnRenderers: Map<string, any> = getQueryColumnRenderers();

        return columns.map(queryCol => {
            let node = DefaultRenderer;
            if (queryCol && queryCol.columnRenderer && columnRenderers.has(queryCol.columnRenderer.toLowerCase())) {
                node = columnRenderers.get(queryCol.columnRenderer.toLowerCase());
            }

            // TODO: Just generate one function per type
            return queryCol.set('cell', (data, row, col, rowIndex, columnIndex) => {
                return React.createElement(node, { data, row, col: queryCol, rowIndex, columnIndex });
            });
        }) as OrderedMap<string, QueryColumn>;
    }

    return columns;
}
