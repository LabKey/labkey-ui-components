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
import React, { ChangeEvent, FC, memo, ReactNode, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Map, OrderedMap } from 'immutable';
import { Dropdown, MenuItem } from 'react-bootstrap';
import { Filter } from '@labkey/api';

import { DisableableMenuItem, GRID_CHECKBOX_OPTIONS, GridColumn, LabelHelpTip, QueryColumn, QueryModel } from '..';

import { DefaultRenderer } from './renderers/DefaultRenderer';
import { getQueryColumnRenderers } from './global';
import { CustomToggle } from './components/base/CustomToggle';
import { HelpTipRenderer } from './components/forms/HelpTipRenderer';
import { isCustomizeViewsInAppEnabled } from './app/utils';

export function isFilterColumnNameMatch(filter: Filter.IFilter, col: QueryColumn): boolean {
    return filter.getColumnName() === col.name || filter.getColumnName() === col.resolveFieldKey();
}

export const APP_COLUMN_CANNOT_BE_REMOVED_MESSAGE = 'This application column cannot be removed.';

interface HeaderCellDropdownProps {
    column: GridColumn;
    columnCount?: number;
    handleFilter?: (column: QueryColumn, remove?: boolean) => void;
    handleHideColumn?: (column: QueryColumn) => void;
    handleSort?: (column: QueryColumn, dir?: string) => void;
    headerClickCount?: number;
    i: number;
    model?: QueryModel;
    selectable?: boolean;
}

// exported for jest testing
export const HeaderCellDropdown: FC<HeaderCellDropdownProps> = memo(props => {
    const { i, column, handleSort, handleFilter, handleHideColumn, headerClickCount, model } = props;
    const col: QueryColumn = column.raw;
    const [open, setOpen] = useState<boolean>();
    const wrapperEl = useRef<HTMLSpanElement>();
    const view = useMemo(() => model?.queryInfo?.getView(model?.viewName, true), [model?.queryInfo, model?.viewName]);

    const allowColSort = handleSort && col?.sortable;
    const allowColFilter = handleFilter && col?.filterable;
    const allowColumnViewChange = handleHideColumn && model && isCustomizeViewsInAppEnabled() && !col.addToDisplayView;
    const includeDropdown = allowColSort || allowColFilter || allowColumnViewChange;

    const onToggleClick = useCallback(
        (shouldOpen: boolean, evt?: any) => {
            if (!includeDropdown) return;

            // when menu is closed skip any clicks on icons by just checking for span el type
            if (shouldOpen && evt && evt.target.tagName.toLowerCase() !== 'span') return;

            setOpen(shouldOpen);
        },
        [includeDropdown]
    );

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

    const _handleHideColumn = useCallback(() => {
        setOpen(false);
        handleHideColumn(col);
    }, [col]);

    // headerClickCount is tracked by the GridPanel, if it changes we will open the dropdown menu
    useEffect(() => {
        if (headerClickCount) {
            setOpen(true);
        }
    }, [headerClickCount]);

    useEffect(() => {
        if (open) {
            // Issue 45139: grid header menu is clipped by the bounding container instead of overflowing it
            // (see related SCSS in query-model.scss)
            if (wrapperEl.current) {
                const menuEl = wrapperEl.current.querySelector<HTMLElement>('.dropdown-menu');
                if (menuEl) {
                    const headerRect = wrapperEl.current.parentElement.getBoundingClientRect();
                    const menuRect = menuEl.getBoundingClientRect();
                    Object.assign(menuEl.style, {
                        top: headerRect.y + headerRect.height + 'px',
                        left: headerRect.x + headerRect.width - menuRect.width + 'px',
                    });
                }
            }
        }
    }, [open]);

    if (!col) return null;

    // using filterArray to indicate user-defined filters only and concatenating with any view filters
    let colFilters = model?.filterArray.filter(filter => isFilterColumnNameMatch(filter, col));
    const viewColFilters = view?.filters.toArray().filter(filter => isFilterColumnNameMatch(filter, col));
    if (viewColFilters?.length) colFilters = colFilters.concat(viewColFilters);

    // first check the model users (user-defined) and then fall back to the view sorts
    const colQuerySortDir =
        model?.sorts?.find(sort => sort.get('fieldKey') === col.resolveFieldKey())?.get('dir') ??
        view?.sorts?.find(sort => sort.get('fieldKey') === col.resolveFieldKey())?.get('dir');

    const isSortAsc = col.sorts === '+' || colQuerySortDir === '+' || colQuerySortDir === '';
    const isSortDesc = col.sorts === '-' || colQuerySortDir === '-';

    return (
        <>
            <span onClick={evt => onToggleClick(!open, evt)}>
                {col.caption === '&nbsp;' ? '' : col.caption}
                {colFilters?.length > 0 && (
                    <span
                        className="fa fa-filter grid-panel__col-header-icon"
                        title={colFilters?.length + ' filter' + (colFilters?.length > 1 ? 's' : '') + ' applied'}
                    />
                )}
                {isSortAsc && (
                    <span className="fa fa-sort-amount-asc grid-panel__col-header-icon" title="Sorted ascending" />
                )}
                {isSortDesc && (
                    <span className="fa fa-sort-amount-desc grid-panel__col-header-icon" title="Sorted descending" />
                )}
                {column.helpTipRenderer && (
                    <LabelHelpTip id={column.index} title={column.title} popoverClassName="label-help-arrow-top">
                        <HelpTipRenderer type={column.helpTipRenderer} />
                    </LabelHelpTip>
                )}
            </span>
            {includeDropdown && (
                <span className="pull-right" ref={wrapperEl}>
                    <Dropdown id={`grid-menu-${i}`} onToggle={onToggleClick} open={open}>
                        <CustomToggle bsRole="toggle">
                            <span className="fa fa-chevron-circle-down grid-panel__menu-toggle" />
                        </CustomToggle>
                        <Dropdown.Menu>
                            {allowColFilter && (
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
                                    {allowColSort && <MenuItem divider />}
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
                                    {model && (
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
                            {handleHideColumn && isCustomizeViewsInAppEnabled() && (
                                <>
                                    {(allowColSort || allowColFilter) && <MenuItem divider />}
                                    <DisableableMenuItem
                                        operationPermitted={allowColumnViewChange}
                                        onClick={() => _handleHideColumn()}
                                        disabledMessage={APP_COLUMN_CANNOT_BE_REMOVED_MESSAGE}
                                    >
                                        <span className="fa fa-eye-slash grid-panel__menu-icon" />
                                        &nbsp; Hide Column
                                    </DisableableMenuItem>
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
    handleHideColumn?: (column: QueryColumn) => void,
    model?: QueryModel,
    headerClickCount?: number
): ReactNode {
    return (
        <HeaderCellDropdown
            i={i}
            column={column}
            selectable={selectable}
            columnCount={columnCount}
            handleSort={handleSort}
            handleFilter={handleFilter}
            handleHideColumn={handleHideColumn}
            headerClickCount={headerClickCount}
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
