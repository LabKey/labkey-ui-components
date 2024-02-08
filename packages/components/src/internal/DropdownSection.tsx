// We show the filter input after 10 items
import React, { FC, useCallback, useMemo, useState } from 'react';

import { MenuDivider, MenuItem, preventDocumentHandler } from './dropdowns';
import { DisableableMenuItem, DisableableMenuItemProps } from './components/samples/DisableableMenuItem';
import classNames from 'classnames';

const SHOW_FILTER_CUTOFF = 10;

export interface MenuSectionItem extends Omit<DisableableMenuItemProps, 'children'> {
    disabledMessage?: string;
    text: string;
}

interface MenuSectionProps {
    items: MenuSectionItem[];
    showDivider?: boolean;
    toggleText?: string;
}

/**
 * Use this component when you want to render a section of a dropdown menu that can be expanded. Useful when you have
 * many items in a menu that would make it overwhelmingly long.
 */
export const DropdownSection: FC<MenuSectionProps> = ({ items, showDivider = false, toggleText }) => {
    const [expanded, setExpanded] = useState<boolean>(!toggleText);
    const onHeaderClick = useCallback(event => {
        preventDocumentHandler(event);
        event.preventDefault();
        setExpanded(e => !e);
    }, []);
    const [filterValue, setFilterValue] = useState<string>('');
    const onFilterChange = useCallback(event => setFilterValue(event.target.value), []);
    const onFilterClick = useCallback(event => {
        preventDocumentHandler(event);
    }, []);
    const menuItems = useMemo(() => {
        if (filterValue.trim()) {
            const filterValueLC = filterValue.toLowerCase();
            return items.filter(item => item.text.toLowerCase().indexOf(filterValueLC) > -1)
        }
        return items;
    }, [filterValue, items]);
    return (
        <>
            {toggleText && (
                <li className="dropdown-section-toggle" role="presentation">
                    <a href="#" onClick={onHeaderClick} role="menuitem">
                        <span className="dropdown-section-toggle__text">{toggleText}</span>
                        <span className={`fa fa-chevron-${expanded ? 'up' : 'down'}`} />
                    </a>
                </li>
            )}

            {expanded && items.length > SHOW_FILTER_CUTOFF && (
                <MenuItem>
                    <input
                        onChange={onFilterChange}
                        onClick={onFilterClick}
                        placeholder="Filter..."
                        value={filterValue}
                    />
                </MenuItem>
            )}

            {expanded &&
                menuItems.map(({ text: menuItemText, ...props }) => (
                    <DisableableMenuItem key={menuItemText} {...props} className={classNames('dropdown-section__menu-item', props.className)}>
                        {menuItemText}
                    </DisableableMenuItem>
                ))}

            {showDivider && expanded && <MenuDivider />}
        </>
    );
};
