/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import classNames from 'classnames'
import { MenuItem, MenuItemProps, OverlayTrigger, Popover } from 'react-bootstrap'

const emptyFn = () => {};

export interface ISubItem extends MenuItemProps {
    disabledMsg?: string
    text: string
}

export interface SubMenuItemProps {
    allowFilter?: boolean
    disabled?: boolean
    filterPlaceholder?: string
    icon?: string
    items?: Array<ISubItem>
    itemsCls?: string
    minToFilter?: number
    onMouseOut?: any
    onMouseOver?: any
    text?: string
}

interface SubMenuItemState {
    activeIdx?: number
    expanded?: boolean
    filterInput?: string
    filterItems?: Array<ISubItem>
}

export class SubMenuItem extends React.Component<SubMenuItemProps, SubMenuItemState> {

    static defaultProps = {
        allowFilter: true,
        filterPlaceholder: 'Filter...',
        itemsCls: 'well',
        minToFilter: 5
    };

    refs: {
        filter: any
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
            activeIdx: 0,
            expanded: false,
            filterItems: this.props.items
        };
    }

    onClick() {
        this.toggle();
    }

    onItemEnter(activeIdx: number) {
        this.setState({
            activeIdx
        })
    }

    onKeyDown(evt: any) {
        switch (evt.keyCode) {
            case 13: // enter key
                this.toggle();
                return;
        }
    }

    onKeyDownInput(evt: any) {
        switch (evt.keyCode) {
            case 13: // enter key
                this.select();
                return;
            case 38: // up arrow
                this.setState({
                    activeIdx: this.state.activeIdx === 0 ? this.props.items.length - 1 : this.state.activeIdx - 1
                });
                evt.preventDefault();
                return;
            case 40: // down arrow
                const upperBound = this.props.items.length - 1;
                this.setState({
                    activeIdx: this.state.activeIdx >= upperBound ? 0 : this.state.activeIdx + 1
                });
                evt.preventDefault();
                return;
        }
    }

    onFilterChange(evt: React.ChangeEvent<HTMLInputElement>) {

        const filterInput = evt.target.value ? evt.target.value.toLowerCase() : undefined;

        const filterItems = [];
        this.props.items.forEach(item => {
            if (!filterInput || (item && item.text && item.text.toLowerCase().indexOf(filterInput) > -1)) {
                filterItems.push(item);
            }
        });

        this.setState({
            activeIdx: 0,
            filterInput,
            filterItems
        });
    }

    select() {
        const { activeIdx, filterItems } = this.state;

        if (filterItems && filterItems.length > activeIdx) {
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

        this.setState({
            activeIdx: 0,
            expanded,
            filterInput: undefined,
            filterItems: this.props.items
        });

        if (expanded) {
            window.setTimeout(() => {
                this.refs.filter && this.refs.filter.focus();
            }, 25);
        }
    }

    renderItems(filter?: boolean) {
        const itemSet = filter ? this.state.filterItems : this.props.items;

        if (itemSet && itemSet.length) {
            let activeIdx = this.state.activeIdx;

            return itemSet.map((item, i) => {
                let itemProps = Object.assign({}, item);

                // remove ISubItem specific props
                delete itemProps.text;
                delete itemProps.disabledMsg;

                const menuItem = (
                    <MenuItem
                        {...itemProps}
                        active={itemProps.active !== false && activeIdx === i}
                        onMouseEnter={this.onItemEnter.bind(this, i)}
                        key={i}>
                        {item.text}
                    </MenuItem>
                );

                if (item.disabledMsg && item.disabled) {
                    const overlay = <Popover id="attach-submenu-warning">{item.disabledMsg}</Popover>;
                    return (
                        <OverlayTrigger overlay={overlay} placement={"right"}>
                            {menuItem}
                        </OverlayTrigger>
                    );
                }
                return menuItem;
            });
        }

        return null;
    }

    onMouseOut() {
        const { onMouseOut } = this.props;
        this.setState({
            activeIdx: undefined
        });
        if (onMouseOut)
            onMouseOut();
    }

    render() {
        const { allowFilter, disabled, filterPlaceholder, icon, items, itemsCls, minToFilter, text } = this.props;
        const { expanded } = this.state;
        const filterActive = allowFilter && items && items.length > minToFilter;

        const menuItemProps = {
            className: classNames('dropdown-submenu', { disabled }),
            onMouseOut: this.onMouseOut,
            onMouseOver: this.props.onMouseOver,
            role: 'presentation'
        };

        return (
            <li {...menuItemProps}>
                <a onClick={disabled ? emptyFn : this.onClick} onKeyDown={disabled ? emptyFn : this.onKeyDown} role="menuitem" tabIndex={-1}>
                    {icon && <span className={`fa fa-${icon}`}>&nbsp;</span>}
                    {text}
                </a>
                <i onClick={disabled ? emptyFn : this.onClick} className={`fa fa-chevron-${expanded ? 'up' : 'down'}`}/>
                {expanded && (
                    <ul className={itemsCls}>
                        {filterActive && (
                            <MenuItem>
                                <input
                                    onChange={this.onFilterChange}
                                    onKeyDown={this.onKeyDownInput}
                                    placeholder={filterPlaceholder}
                                    ref="filter"
                                    type="text"/>
                            </MenuItem>
                        )}
                        {this.renderItems(filterActive)}
                    </ul>
                )}
            </li>
        )
    }
}