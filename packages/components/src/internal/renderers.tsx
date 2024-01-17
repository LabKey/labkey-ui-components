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
import classNames from 'classnames';
import React, {
    ChangeEvent,
    CSSProperties,
    FC,
    memo,
    ReactNode,
    SyntheticEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { MenuItem, SelectCallback } from 'react-bootstrap';
import { Filter } from '@labkey/api';
import { createPortal } from 'react-dom';

import { QueryColumn } from '../public/QueryColumn';

import { useEnterEscape } from '../public/useEnterEscape';

import { QueryModel } from '../public/QueryModel/QueryModel';

import { HelpTipRenderer } from './components/forms/HelpTipRenderer';
import { APP_FIELD_CANNOT_BE_REMOVED_MESSAGE, GRID_CHECKBOX_OPTIONS, GRID_HEADER_CELL_BODY } from './constants';

import { GridColumn } from './components/base/models/GridColumn';

import { LabelHelpTip } from './components/base/LabelHelpTip';
import { DisableableMenuItem } from './components/samples/DisableableMenuItem';
import { cancelEvent } from './events';
import { usePortalRef } from './hooks';

export function isFilterColumnNameMatch(filter: Filter.IFilter, col: QueryColumn): boolean {
    return filter.getColumnName() === col.name || filter.getColumnName() === col.resolveFieldKey();
}

interface EditableColumnTitleProps {
    column: QueryColumn;
    editing?: boolean;
    onCancel: () => void;
    onChange: (newValue: string) => void;
}

// exported for jest tests
export const EditableColumnTitle: FC<EditableColumnTitleProps> = memo(props => {
    const { column, editing, onChange, onCancel } = props;
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
        onCancel();
        setTitle(initialTitle);
    }, [initialTitle, onCancel]);

    const onEditFinish = useCallback(() => {
        const trimmedTitle = title?.trim();

        if (trimmedTitle && trimmedTitle !== initialTitle) {
            onChange(trimmedTitle);
            return;
        }

        setTitle(initialTitle);
        onCancel();
    }, [initialTitle, onCancel, onChange, title]);

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

interface SharedHeaderCellProps {
    handleAddColumn?: (column: QueryColumn) => void;
    handleFilter?: (column: QueryColumn, remove?: boolean) => void;
    handleHideColumn?: (column: QueryColumn) => void;
    handleSort?: (column: QueryColumn, dir?: string) => void;
    model?: QueryModel;
}

interface HeaderCellDropdownMenuProps extends SharedHeaderCellProps {
    allowColFilter: boolean;
    allowColSort: boolean;
    colFilters: Filter.IFilter[];
    isSortAsc: boolean;
    isSortDesc: boolean;
    onEditTitleClicked?: () => void;
    open: boolean;
    queryColumn: QueryColumn;
    setOpen: (open: boolean) => void;
}

const HeaderCellDropdownMenu: FC<HeaderCellDropdownMenuProps> = memo(props => {
    const {
        allowColFilter,
        allowColSort,
        colFilters,
        handleAddColumn,
        handleFilter,
        handleHideColumn,
        handleSort,
        isSortAsc,
        isSortDesc,
        model,
        onEditTitleClicked,
        open,
        queryColumn,
        setOpen,
    } = props;
    const showGridCustomization = handleHideColumn || handleAddColumn;
    const toggleEl = useRef<HTMLSpanElement>();
    const menuEl = useRef<HTMLUListElement>();
    const portalRef = usePortalRef('header-cell-dropdown-menu-portal');
    // Note: We need to make sure we cancel all events in our menu handlers or we also trigger the click handler in
    // HeaderCellDropdown, which will reset the open value to true, which will keep the menu open.
    const openFilterPanel = useCallback(
        (_: any, event: SyntheticEvent) => {
            cancelEvent(event);
            setOpen(false);
            handleFilter(queryColumn, false);
        },
        [setOpen, handleFilter, queryColumn]
    ) as SelectCallback;
    const removeFilter = useCallback(
        (_: any, event: SyntheticEvent) => {
            cancelEvent(event);
            setOpen(false);
            handleFilter(queryColumn, true);
        },
        [queryColumn, handleFilter, setOpen]
    ) as SelectCallback;

    const sort = useCallback(
        (event: SyntheticEvent, dir?: string) => {
            cancelEvent(event);
            setOpen(false);
            handleSort(queryColumn, dir);
        },
        [queryColumn, handleSort, setOpen]
    );
    // There is something wrong with the React Bootstrap types, the only way to get these callbacks properly typed is to
    // use "as SelectCallback", even though their type signature matches perfectly.
    const sortAsc = useCallback((_: any, event: SyntheticEvent): void => sort(event, '+'), [sort]) as SelectCallback;
    const sortDesc = useCallback((_: any, event: SyntheticEvent): void => sort(event, '-'), [sort]) as SelectCallback;
    const clearSort = useCallback((_: any, event: SyntheticEvent): void => sort(event), [sort]) as SelectCallback;
    const hideColumn = useCallback(
        (_: any, event: SyntheticEvent): void => {
            cancelEvent(event);
            setOpen(false);
            handleHideColumn(queryColumn);
        },
        [queryColumn, handleHideColumn, setOpen]
    ) as SelectCallback;
    const addColumn = useCallback(
        (_: any, event: SyntheticEvent): void => {
            cancelEvent(event);
            setOpen(false);
            handleAddColumn(queryColumn);
        },
        [queryColumn, handleAddColumn, setOpen]
    ) as SelectCallback;
    const editColumnTitle = useCallback(
        (_: any, event: SyntheticEvent): void => {
            cancelEvent(event);
            onEditTitleClicked();
        },
        [onEditTitleClicked]
    ) as SelectCallback;

    const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
    const updateMenuStyle = useCallback(() => {
        let top;
        let left;

        if (toggleEl.current && menuEl.current) {
            const headerRect = toggleEl.current.parentElement.getBoundingClientRect();
            const menuRect = menuEl.current.getBoundingClientRect();
            left = headerRect.x - menuRect.width + 18 + 'px';
            top = headerRect.y + headerRect.height + 5 + 'px';

            // Issue 45553
            // Render the dropdown menu above the header if the header is too close to the bottom of the screen.
            if (headerRect.bottom + menuRect.height > window.innerHeight) {
                top = headerRect.y - menuRect.height - 10 + 'px';
            }
        }

        setMenuStyle({
            left,
            // use visibility so we can know the rendered size of the menu before making it visible
            visibility: open ? 'visible' : 'hidden',
            top,
        });
    }, [open]);

    // In order to close the menu when the user clicks outside of it we have to add a click handler to the document and
    // close the menu when the user clicks on anything outside of the menu.
    const documentClickHandler = useCallback(
        event => {
            if (open && !menuEl.current.contains(event.target)) {
                setOpen(false);
            }
        },
        [setOpen, open]
    );

    useEffect(() => {
        document.addEventListener('click', documentClickHandler);
        return () => {
            document.removeEventListener('click', documentClickHandler);
        };
    }, [documentClickHandler]);

    // TODO: investigate passing down a ref of the .table-responsive div so we can add a scroll handler to it here the
    //  same way we add one to the document, then we can update the menu positions when the table is also scrolled.
    useEffect(() => {
        updateMenuStyle();
        window.addEventListener('scroll', updateMenuStyle);
        return () => {
            window.removeEventListener('scroll', updateMenuStyle);
        };
    }, [updateMenuStyle, open]);

    // Technically we don't need to add and remove this open class because it doesn't affect visibility, we do that
    // above via the visibility css property. We need this class so tests can look for the currently open menu.
    const className = classNames('grid-header-cell__dropdown-menu dropdown-menu', { open });

    const body = (
        <ul className={className} ref={menuEl} style={menuStyle}>
            {allowColFilter && (
                <>
                    <MenuItem onSelect={openFilterPanel}>
                        <span className="fa fa-filter grid-panel__menu-icon" />
                        Filter...
                    </MenuItem>
                    <MenuItem disabled={!colFilters || colFilters?.length === 0} onSelect={removeFilter}>
                        <span className="grid-panel__menu-icon-spacer" />
                        Remove filter{colFilters?.length > 1 ? 's' : ''}
                    </MenuItem>
                    {allowColSort && <MenuItem divider />}
                </>
            )}
            {allowColSort && (
                <>
                    <MenuItem disabled={isSortAsc} onSelect={sortAsc}>
                        <span className="fa fa-sort-amount-asc grid-panel__menu-icon" />
                        Sort ascending
                    </MenuItem>
                    <MenuItem disabled={isSortDesc} onSelect={sortDesc}>
                        <span className="fa fa-sort-amount-desc grid-panel__menu-icon" />
                        Sort descending
                    </MenuItem>
                    {/* Clear sort only applies for the grids that are backed by QueryModel */}
                    {model && (
                        <MenuItem disabled={!isSortDesc && !isSortAsc} onSelect={clearSort}>
                            <span className="grid-panel__menu-icon-spacer" />
                            Clear sort
                        </MenuItem>
                    )}
                </>
            )}
            {showGridCustomization && (
                <>
                    {(allowColSort || allowColFilter) && <MenuItem divider />}
                    <MenuItem onSelect={editColumnTitle}>
                        <span className="fa fa-pencil grid-panel__menu-icon" />
                        Edit Label
                    </MenuItem>
                    {handleAddColumn && (
                        <MenuItem onSelect={addColumn}>
                            <span className="fa fa-plus grid-panel__menu-icon" />
                            Insert Column
                        </MenuItem>
                    )}
                    <DisableableMenuItem
                        operationPermitted={handleHideColumn && !!model}
                        onSelect={hideColumn}
                        disabledMessage={APP_FIELD_CANNOT_BE_REMOVED_MESSAGE}
                    >
                        <span className="fa fa-eye-slash grid-panel__menu-icon" />
                        Hide Column
                    </DisableableMenuItem>
                </>
            )}
        </ul>
    );

    return (
        <div className="pull-right grid-panel__menu-toggle">
            {/* Note: we don't need a click handler on this icon because there is one on the wrapping div above */}
            <span className="fa fa-chevron-circle-down" ref={toggleEl} />
            {createPortal(body, portalRef)}
        </div>
    );
});

interface HeaderCellDropdownProps extends SharedHeaderCellProps {
    column: GridColumn;
    columnCount?: number;
    i: number;
    onColumnTitleChange?: (column: QueryColumn) => void;
    onColumnTitleEdit?: (column: QueryColumn) => void;
    selectable?: boolean;
}

// exported for jest testing
export const HeaderCellDropdown: FC<HeaderCellDropdownProps> = memo(props => {
    const {
        column,
        handleSort,
        handleFilter,
        handleAddColumn,
        handleHideColumn,
        model,
        onColumnTitleChange,
        onColumnTitleEdit,
    } = props;
    const queryColumn: QueryColumn = column.raw;
    const [editingTitle, setEditingTitle] = useState<boolean>(false);
    const [open, setOpen] = useState<boolean>(false);
    const click = useCallback(() => {
        setOpen(true);
    }, []);
    const allowColSort = handleSort && queryColumn?.sortable;
    const allowColFilter = handleFilter && queryColumn?.filterable;
    const allowColumnViewChange = (handleHideColumn || handleAddColumn) && !!model;
    const includeDropdown = allowColSort || allowColFilter || allowColumnViewChange;
    const onColumnTitleUpdate = useCallback(
        (newTitle: string) => {
            setEditingTitle(false);
            onColumnTitleChange(queryColumn.mutate({ caption: newTitle }));
            onColumnTitleEdit?.(queryColumn);
        },
        [onColumnTitleChange, queryColumn, onColumnTitleEdit]
    );
    const editTitle = useCallback(() => {
        setOpen(false);
        onColumnTitleEdit?.(queryColumn);
        setEditingTitle(true);
    }, [onColumnTitleEdit, queryColumn]);
    const cancelEditTitle = useCallback(() => {
        setEditingTitle(false);
        onColumnTitleEdit?.(queryColumn);
    }, [onColumnTitleEdit, queryColumn]);
    const view = useMemo(() => model?.queryInfo?.getView(model?.viewName, true), [model?.queryInfo, model?.viewName]);

    if (!queryColumn) return null;

    // using filterArray to indicate user-defined filters only and concatenating with any view filters
    let colFilters = model?.filterArray.filter(filter => isFilterColumnNameMatch(filter, queryColumn));
    const viewColFilters = view?.filters.filter(filter => isFilterColumnNameMatch(filter, queryColumn));
    if (viewColFilters?.length) colFilters = colFilters.concat(viewColFilters);
    // first check the model users (user-defined) and then fall back to the view sorts
    const colQuerySortDir =
        model?.sorts?.find(sort => sort.fieldKey === queryColumn.resolveFieldKey())?.dir ??
        view?.sorts?.find(sort => sort.fieldKey === queryColumn.resolveFieldKey())?.dir;
    const isSortAsc = queryColumn.sorts === '+' || colQuerySortDir === '+' || colQuerySortDir === '';
    const isSortDesc = queryColumn.sorts === '-' || colQuerySortDir === '-';

    return (
        <div className={GRID_HEADER_CELL_BODY} onClick={click}>
            <span>
                <EditableColumnTitle
                    column={queryColumn}
                    onChange={onColumnTitleUpdate}
                    editing={editingTitle}
                    onCancel={cancelEditTitle}
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
                    <LabelHelpTip title={column.title} popoverClassName="label-help-arrow-top">
                        <HelpTipRenderer type={column.helpTipRenderer} />
                    </LabelHelpTip>
                )}
            </span>
            {includeDropdown && !editingTitle && (
                <HeaderCellDropdownMenu
                    allowColFilter={allowColFilter}
                    allowColSort={allowColSort}
                    colFilters={colFilters}
                    handleAddColumn={handleAddColumn}
                    handleFilter={handleFilter}
                    handleHideColumn={handleHideColumn}
                    handleSort={handleSort}
                    isSortAsc={isSortAsc}
                    isSortDesc={isSortDesc}
                    model={model}
                    open={open}
                    onEditTitleClicked={editTitle}
                    queryColumn={queryColumn}
                    setOpen={setOpen}
                />
            )}
        </div>
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
            handleAddColumn={handleAddColumn}
            handleHideColumn={handleHideColumn}
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
