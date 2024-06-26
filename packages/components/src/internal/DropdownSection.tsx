import React, { FC, ReactNode, useCallback, useMemo, useState } from 'react';

import classNames from 'classnames';

import { MenuDivider, MenuItem, preventDocumentHandler } from './dropdowns';
import { DisableableMenuItem, DisableableMenuItemProps } from './components/samples/DisableableMenuItem';

const SHOW_FILTER_CUTOFF = 10;

function isString(label: string | ReactNode): label is string {
    return typeof label === 'string';
}

export interface MenuSectionItem extends Omit<DisableableMenuItemProps, 'children'> {
    disabledMessage?: string;
    label: string | ReactNode;
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
    // We default expanded when there is no toggle text, which also means there is no way to expand or collapse the
    // children when there is no toggleText; this is by design. We want to always render the children when toggleText
    // is undefined because that means we're rendering the items as the only menu items; this is typically when we're
    // rendering a DropdownButton that gets condensed into a "More" menu on smaller screens.
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
            return items.filter(item => isString(item.label) && item.label.toLowerCase().indexOf(filterValueLC) > -1);
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
                menuItems.map(({ label: menuItemLabel, ...props }, index) => (
                    <DisableableMenuItem
                        key={index}
                        {...props}
                        className={classNames('dropdown-section__menu-item', props.className)}
                    >
                        {menuItemLabel}
                    </DisableableMenuItem>
                ))}

            {showDivider && expanded && <MenuDivider />}
        </>
    );
};
