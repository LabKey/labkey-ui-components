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
import React from 'react';
import classNames from 'classnames';
import { OrderedMap } from 'immutable';
import { Dropdown, MenuItem } from 'react-bootstrap';

import { DefaultRenderer } from './renderers/DefaultRenderer';
import { getQueryColumnRenderers } from './global';
import { GridColumn } from './components/base/Grid';
import { CustomToggle } from './components/base/CustomToggle';
import { QueryColumn } from './components/base/models/model';
import { GRID_CHECKBOX_OPTIONS } from './components/base/models/constants';

export function headerCell(
    handleSort: (column: QueryColumn, dir: string) => any,
    column: GridColumn,
    i: number,
    selectable?: boolean,
    sortable = true,
    columnCount?: number
) {
    const col: QueryColumn = column.raw;

    if (!col) {
        return null;
    }

    const isSortAsc = col.sorts === '+';
    const isSortDesc = col.sorts === '-';
    const isOnlyColumn =
        columnCount !== undefined && ((selectable && columnCount === 2) || (!selectable && columnCount === 1));

    return (
        <span>
            {col.caption === '&nbsp;' ? '' : col.caption}
            {sortable && col.sortable && (
                <span className={classNames({ 'pull-right': (i === 0 && !selectable) || (selectable && i === 1) })}>
                    <Dropdown
                        id={`grid-menu-${i}`}
                        className={classNames('hidden-xs hidden-sm', {
                            'pull-right': isOnlyColumn || (i > 0 && !selectable) || i > 1,
                        })}
                    >
                        <CustomToggle bsRole="toggle">
                            <span
                                className="fa fa-chevron-circle-down"
                                style={{ color: 'lightgray', fontSize: '12px' }}
                            />
                        </CustomToggle>
                        <Dropdown.Menu>
                            <MenuItem
                                disabled={isSortAsc}
                                onClick={
                                    !isSortAsc
                                        ? () => {
                                              handleSort(col, '+');
                                          }
                                        : undefined
                                }
                            >
                                <span className="fa fa-sort-amount-asc" />
                                &nbsp; Sort ascending
                            </MenuItem>
                            <MenuItem
                                disabled={isSortDesc}
                                onClick={
                                    !isSortDesc
                                        ? () => {
                                              handleSort(col, '-');
                                          }
                                        : undefined
                                }
                            >
                                <span className="fa fa-sort-amount-desc" />
                                &nbsp; Sort descending
                            </MenuItem>
                        </Dropdown.Menu>
                    </Dropdown>
                </span>
            )}
        </span>
    );
}

export function headerSelectionCell(handleSelection: any, selectedState: GRID_CHECKBOX_OPTIONS, disabled: boolean) {
    const isChecked = selectedState === GRID_CHECKBOX_OPTIONS.ALL;
    const isIndeterminate = selectedState === GRID_CHECKBOX_OPTIONS.SOME;

    // Ref below is required as indeterminate is not an actual HTML attribute
    // See: https://github.com/facebook/react/issues/1798
    return (
        <input
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

        return columns.map((col: QueryColumn) => {
            let node = DefaultRenderer;
            if (col && col.columnRenderer && columnRenderers.has(col.columnRenderer.toLowerCase())) {
                node = columnRenderers.get(col.columnRenderer.toLowerCase());
            }

            // TODO: Just generate one function per type
            return col.set('cell', data => {
                return React.createElement(node, { data, col });
            });
        }) as OrderedMap<string, QueryColumn>;
    }

    return columns;
}
