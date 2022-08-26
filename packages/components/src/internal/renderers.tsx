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
import React, { ChangeEvent, FC, memo, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Map, OrderedMap } from 'immutable';
import { Dropdown, MenuItem } from 'react-bootstrap';
import { Filter } from '@labkey/api';

import { DefaultRenderer } from './renderers/DefaultRenderer';
import { getQueryColumnRenderers } from './global';
import { CustomToggle } from './components/base/CustomToggle';
import { HelpTipRenderer } from './components/forms/HelpTipRenderer';
import {APP_FIELD_CANNOT_BE_REMOVED_MESSAGE, GRID_CHECKBOX_OPTIONS} from './constants';
import {QueryColumn} from "../public/QueryColumn";
import {useEnterEscape} from "../public/useEnterEscape";
import {GridColumn} from "./components/base/models/GridColumn";
import {QueryModel} from "../public/QueryModel/QueryModel";
import {LabelHelpTip} from "./components/base/LabelHelpTip";
import {DisableableMenuItem} from "./components/samples/DisableableMenuItem";

export function isFilterColumnNameMatch(filter: Filter.IFilter, col: QueryColumn): boolean {
    return filter.getColumnName() === col.name || filter.getColumnName() === col.resolveFieldKey();
}

interface EditableColumnTitleProps {
    column: QueryColumn;
    editing?: boolean;
    onChange: (newValue: string) => void;
    onEditToggle: (editing: boolean) => void;
}

// exported for jest tests
export const EditableColumnTitle: FC<EditableColumnTitleProps> = memo(props => {
    const { column, editing, onChange, onEditToggle } = props;
    const initialTitle = useMemo(() => {
        return column.caption ?? column.name;
    }, [column.caption, column.name]);
    const [title, setTitle] = useState<string>(initialTitle);

    const titleInput: React.RefObject<HTMLInputElement> = React.createRef();

    useEffect(() => {
        setTitle(initialTitle);
    }, [initialTitle]);

    const onTitleChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        setTitle(evt.target.value);
    }, []);

    const onCancelEdit = useCallback(() => {
        onEditToggle(false);
        setTitle(initialTitle);
    }, [initialTitle]);

    const onEditFinish = useCallback(() => {
        onEditToggle(false);
        const trimmedTitle = title?.trim();
        if (!trimmedTitle) {
            setTitle(initialTitle);
        } else if (trimmedTitle !== initialTitle) {
            onChange(trimmedTitle);
        }
    }, [initialTitle, onChange, onEditToggle, title]);

    const onKeyDown = useEnterEscape(onEditFinish, onCancelEdit);

    if (initialTitle === '&nbsp;') {
        return <></>;
    }

    if (editing) {
        return (
            <input
                autoFocus
                ref={titleInput}
                defaultValue={title}
                onKeyDown={onKeyDown}
                onChange={onTitleChange}
                onBlur={onEditFinish}
            />
        );
    }

    return <>{initialTitle}</>;
});

interface HeaderCellDropdownProps {
    column: GridColumn;
    columnCount?: number;
    handleAddColumn?: (column: QueryColumn) => void;
    handleFilter?: (column: QueryColumn, remove?: boolean) => void;
    handleHideColumn?: (column: QueryColumn) => void;
    handleSort?: (column: QueryColumn, dir?: string) => void;
    headerClickCount?: number;
    i: number;
    model?: QueryModel;
    onColumnTitleChange?: (column: QueryColumn) => void;
    onColumnTitleEdit?: (column: QueryColumn) => void;
    selectable?: boolean;
}

// exported for jest testing
export const HeaderCellDropdown: FC<HeaderCellDropdownProps> = memo(props => {
    const {
        i,
        column,
        handleSort,
        handleFilter,
        handleAddColumn,
        handleHideColumn,
        headerClickCount,
        model,
        onColumnTitleChange,
        onColumnTitleEdit,
    } = props;
    const col: QueryColumn = column.raw;
    const [open, setOpen] = useState<boolean>();
    const [editingTitle, setEditingTitle] = useState<boolean>(false);
    const wrapperEl = useRef<HTMLSpanElement>();
    const view = useMemo(() => model?.queryInfo?.getView(model?.viewName, true), [model?.queryInfo, model?.viewName]);

    const allowColSort = handleSort && col?.sortable;
    const allowColFilter = handleFilter && col?.filterable;
    const allowColumnViewChange = (handleHideColumn || handleAddColumn) && !!model;
    const includeDropdown = allowColSort || allowColFilter || allowColumnViewChange;

    useEffect(() => {
        return () => {
            setOpen(false);
        };
    }, []);

    const onToggleClick = useCallback(
        (shouldOpen: boolean, evt?: any) => {
            if (!includeDropdown || editingTitle) return;

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
    }, [col, handleHideColumn]);

    const _handleAddColumn = useCallback(() => {
        setOpen(false);
        handleAddColumn(col);
    }, [col, handleAddColumn]);

    const editColumnTitle = useCallback(() => {
        setOpen(false);
        setEditingTitle(true);
        onColumnTitleEdit?.(col);
    }, [col, onColumnTitleEdit]);

    const onColumnTitleUpdate = useCallback(
        (newTitle: string) => {
            onColumnTitleChange(col.set('caption', newTitle) as QueryColumn);
        },
        [col, onColumnTitleChange]
    );

    const onEditTitleToggle = useCallback(
        (value: boolean) => {
            setEditingTitle(value);
            onColumnTitleEdit?.(col);
        },
        [col, onColumnTitleEdit]
    );

    // headerClickCount is tracked by the GridPanel, if it changes we will open the dropdown menu
    useEffect(() => {
        setOpen(headerClickCount !== undefined);
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
    const showGridCustomization = handleHideColumn || handleAddColumn;

    return (
        <>
            <span onClick={evt => onToggleClick(!open, evt)}>
                <EditableColumnTitle
                    column={col}
                    onChange={onColumnTitleUpdate}
                    editing={editingTitle}
                    onEditToggle={onEditTitleToggle}
                />

                {!editingTitle && colFilters?.length > 0 && (
                    <span
                        className="fa fa-filter grid-panel__col-header-icon"
                        title={colFilters?.length + ' filter' + (colFilters?.length > 1 ? 's' : '') + ' applied'}
                    />
                )}
                {!editingTitle && isSortAsc && (
                    <span className="fa fa-sort-amount-asc grid-panel__col-header-icon" title="Sorted ascending" />
                )}
                {!editingTitle && isSortDesc && (
                    <span className="fa fa-sort-amount-desc grid-panel__col-header-icon" title="Sorted descending" />
                )}
                {!editingTitle && column.helpTipRenderer && (
                    <LabelHelpTip id={column.index} title={column.title} popoverClassName="label-help-arrow-top">
                        <HelpTipRenderer type={column.helpTipRenderer} />
                    </LabelHelpTip>
                )}
            </span>
            {includeDropdown && !editingTitle && (
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
                            {showGridCustomization && (
                                <>
                                    {(allowColSort || allowColFilter) && <MenuItem divider />}
                                    <MenuItem onClick={editColumnTitle}>
                                        <span className="fa fa-pencil grid-panel__menu-icon" /> Edit Label
                                    </MenuItem>
                                    {handleAddColumn && (
                                        <MenuItem onClick={_handleAddColumn}>
                                            <span className="fa fa-plus grid-panel__menu-icon" /> Insert Column
                                        </MenuItem>
                                    )}
                                    <DisableableMenuItem
                                        operationPermitted={handleHideColumn && !!model}
                                        onClick={() => _handleHideColumn()}
                                        disabledMessage={APP_FIELD_CANNOT_BE_REMOVED_MESSAGE}
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
    handleAddColumn?: (column: QueryColumn) => void,
    handleHideColumn?: (column: QueryColumn) => void,
    onColumnTitleEdit?: (column: QueryColumn) => void,
    onColumnTitleChange?: (column: QueryColumn) => void,
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
            handleAddColumn={handleAddColumn}
            handleHideColumn={handleHideColumn}
            headerClickCount={headerClickCount}
            model={model}
            onColumnTitleChange={onColumnTitleChange}
            onColumnTitleEdit={onColumnTitleEdit}
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
