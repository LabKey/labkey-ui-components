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
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';

import { ReactBootstrapMenuItemProps } from './types';

const emptyFn = () => {};

export interface ISubItem extends ReactBootstrapMenuItemProps {
    disabledMsg?: string;
    disabledOverlayPlacement?: 'top' | 'right' | 'bottom' | 'left';
    text: string;
}

export interface SubMenuItemProps {
    allowFilter?: boolean;
    disabled?: boolean;
    filterPlaceholder?: string;
    icon?: string;
    items?: ISubItem[];
    itemsCls?: string;
    maxWithoutFilter?: number;
    onMouseOut?: any;
    onMouseOver?: any;
    text?: string;
    inline?: boolean;
}

interface SubMenuItemState {
    activeIdx?: number;
    expanded?: boolean;
    filterInput?: string;
}

export class SubMenuItem extends React.Component<SubMenuItemProps, SubMenuItemState> {
    static defaultProps = {
        allowFilter: true,
        filterPlaceholder: 'Filter...',
        maxWithoutFilter: 5,
    };

    refs: {
        filter: any;
    };

    constructor(props: SubMenuItemProps) {
        super(props);

        this.onClick = this.onClick.bind(this);
        this.onFilterChange = this.onFilterChange.bind(this);
        this.onItemEnter = this.onItemEnter.bind(this);
        this.onKeyDown = this.onKeyDown.bind(this);
        this.onKeyDownInput = this.onKeyDownInput.bind(this);
        this.onMouseOut = this.onMouseOut.bind(this);

        this.state = {
            activeIdx: props.inline ? undefined : 0,
            expanded: false,
        };
    }

    onClick() {
        this.toggle();
    }

    onItemEnter(activeIdx: number) {
        this.setState(() => ({
            activeIdx,
        }));
    }

    onKeyDown(evt: any) {
        switch (evt.keyCode) {
            case 13: // enter key
                this.toggle();
        }
    }

    onKeyDownInput(evt: any) {
        switch (evt.keyCode) {
            case 13: // enter key
                this.select();
                return;
            case 38: // up arrow
                this.setState(() => ({
                    activeIdx: this.state.activeIdx === 0 ? this.props.items.length - 1 : this.state.activeIdx - 1,
                }));
                evt.preventDefault();
                return;
            case 40: // down arrow
                const upperBound = this.props.items.length - 1;
                this.setState(() => ({
                    activeIdx: this.state.activeIdx >= upperBound ? 0 : this.state.activeIdx + 1,
                }));
                evt.preventDefault();
        }
    }

    onFilterChange(evt: React.ChangeEvent<HTMLInputElement>) {
        const filterInput = evt.target.value ? evt.target.value.toLowerCase() : undefined;

        this.setState(() => ({
            activeIdx: 0,
            filterInput,
        }));
    }

    getFilteredItems(): ISubItem[] {
        const { items } = this.props;
        const { filterInput } = this.state;
        return items.filter(item => !filterInput || item?.text.toLowerCase().indexOf(filterInput) > -1);
    }

    select() {
        const { activeIdx } = this.state;
        const filterItems = this.getFilteredItems();

        if (filterItems?.length > activeIdx) {
            const item: ISubItem = filterItems[activeIdx];

            // TODO: support rest of MenuItemProps interface
            if (item.disabled) {
                return;
            }

            if (item.href) {
                document.location.href = item.href;
            }
        }
    }

    toggle() {
        const expanded = !this.state.expanded;
        this.setState(() => {
            return {
                activeIdx: 0,
                expanded,
                filterInput: undefined,
            };
        });

        if (expanded) {
            window.setTimeout(() => {
                this.refs.filter?.focus();
            }, 25);
        }
    }

    renderItems(filter?: boolean) {
        const itemSet = filter ? this.getFilteredItems() : this.props.items;

        if (itemSet && itemSet.length) {
            const activeIdx = this.state.activeIdx;

            return itemSet.map((item, i) => {
                const itemProps = Object.assign({}, item);

                // remove ISubItem specific props
                delete itemProps.text;
                delete itemProps.disabledMsg;

                // FIXME: the way we are setting active here is incorrect. It makes menu items look active on hover,
                //  because we are setting activeIdx during mouseEnter, however that is not how a typical menu is
                //  supposed to work, which makes this menu look odd. It's especially odd within the menu because
                //  hovering over a Menu header, which is clickable/expandable doesn't highlight blue.
                const menuItem = (
                    <MenuItem
                        {...itemProps}
                        active={itemProps.active !== false && activeIdx === i}
                        onMouseEnter={this.onItemEnter.bind(this, i)}
                        key={i}
                    >
                        {item.text}
                    </MenuItem>
                );

                if (item.disabledMsg && item.disabled) {
                    const overlay = <Popover id="attach-submenu-warning">{item.disabledMsg}</Popover>;
                    return (
                        <OverlayTrigger overlay={overlay} placement={item.disabledOverlayPlacement || 'right'} key={i}>
                            {menuItem}
                        </OverlayTrigger>
                    );
                }
                return menuItem;
            });
        }

        return this.props.children;
    }

    onMouseOut() {
        const { onMouseOut } = this.props;
        this.setState(() => ({
            activeIdx: undefined,
        }));
        if (onMouseOut) onMouseOut();
    }

    render() {
        const { allowFilter, disabled, filterPlaceholder, icon, items, itemsCls, maxWithoutFilter, text, inline } =
            this.props;
        const { expanded } = this.state;
        const filterActive = allowFilter && items && items.length > maxWithoutFilter;
        const _itemsCls = itemsCls ?? (!inline ? 'well' : '');

        const menuItemProps = {
            className: classNames('dropdown-submenu', { disabled }),
            onMouseOut: this.onMouseOut,
            onMouseOver: this.props.onMouseOver,
            role: 'presentation',
        };

        const subMenuItems = (
            <>
                {filterActive && (
                    <li role="presentation">
                        <a role="menuitem">
                            <input
                                onChange={this.onFilterChange}
                                onKeyDown={this.onKeyDownInput}
                                placeholder={filterPlaceholder}
                                ref="filter"
                                type="text"
                            />
                        </a>
                    </li>
                )}
                {this.renderItems(filterActive)}
            </>
        );

        // FIXME: because we render a <ul> and inside that we render the subMenuItems, which are more MenuItems we are
        //  generating a DOM structure that is doesn't align with what bootstrap 3 expects, which causes the MenuItems
        //  to not be highlighted on hover if they were passed as children. This is most apparent in our "More" menu
        //  rendered by our ResponsiveMenuButton and ResponsiveMenuButtonGroup components.
        return (
            <>
                {inline && text && <MenuItem header>{text}</MenuItem>}
                <li {...menuItemProps}>
                    {!inline && (
                        <>
                            <a
                                onClick={disabled ? emptyFn : this.onClick}
                                onKeyDown={disabled ? emptyFn : this.onKeyDown}
                                role="menuitem"
                                tabIndex={-1}
                            >
                                {icon && <span className={`fa fa-${icon}`}>&nbsp;</span>}
                                {text}
                            </a>
                            <i
                                onClick={disabled ? emptyFn : this.onClick}
                                className={`fa fa-chevron-${expanded ? 'up' : 'down'}`}
                            />
                        </>
                    )}
                    {(expanded || inline) && <ul className={_itemsCls}>{subMenuItems}</ul>}
                </li>
            </>
        );
    }
}
