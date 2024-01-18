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
import { MenuItem, OverlayTrigger, Popover } from 'react-bootstrap';
import { List } from 'immutable';

import { ISubItem, SubMenuItem } from './SubMenuItem';

export interface MenuOption {
    disabled?: boolean;
    disabledMsg?: string;
    href?: string;
    onClick?: () => void;
    name: string;
    key: string;
}

interface SubMenuProps {
    currentMenuChoice?: string;
    extractCurrentMenuChoice?: boolean;
    options: List<MenuOption>;
    text: string;
    inlineItemsCount?: number;
}

export class SubMenu extends React.Component<SubMenuProps> {
    static defaultProps = {
        extractCurrentMenuChoice: true,
        inlineItemsCount: 2,
    };

    constructor(props: SubMenuProps) {
        super(props);

        this.isCurrentMenuChoice = this.isCurrentMenuChoice.bind(this);
    }

    isCurrentMenuChoice(option: MenuOption): boolean {
        const { currentMenuChoice } = this.props;
        return currentMenuChoice && option.key.toLowerCase() === currentMenuChoice.toLowerCase();
    }

    getCurrentMenuChoiceItem() {
        const { options } = this.props;
        const currentOption = options.find(this.isCurrentMenuChoice);

        if (currentOption) {
            return SubMenu.renderMenuItem(currentOption, 0);
        }

        return undefined;
    }

    getItems(): ISubItem[] {
        const { options, extractCurrentMenuChoice } = this.props;

        const items = [];
        options.forEach(option => {
            if (!extractCurrentMenuChoice || !this.isCurrentMenuChoice(option)) {
                items.push({
                    disabled: option.disabled,
                    disabledMsg: option.disabledMsg,
                    text: option.name,
                    href: option.href,
                    onClick: option.onClick,
                });
            }
        });
        return items;
    }

    // FIXME: this should be a component, not a static method on this class.
    static renderMenuItem(option: MenuOption, key: any) {
        const itemProps = Object.assign({}, option);

        // remove ISubItem specific props
        delete itemProps.name;
        delete itemProps.disabledMsg;

        const menuItem = (
            <MenuItem {...itemProps} key={key}>
                {option.name}
            </MenuItem>
        );

        if (option.disabledMsg && option.disabled) {
            const overlay = <Popover id="attach-submenu-warning">{option.disabledMsg}</Popover>;
            return (
                <OverlayTrigger overlay={overlay} placement="right">
                    {menuItem}
                </OverlayTrigger>
            );
        }
        return menuItem;
    }

    render() {
        const { currentMenuChoice, extractCurrentMenuChoice, options, text, inlineItemsCount } = this.props;

        const items = [];
        // if there are ${inlineItemsCount} items or fewer, just show the items as the menu
        if (currentMenuChoice && options.size <= inlineItemsCount) {
            options.forEach((option, i) => {
                items.push(SubMenu.renderMenuItem(option, i));
            });
        } else {
            if (extractCurrentMenuChoice && currentMenuChoice) {
                items.push(this.getCurrentMenuChoiceItem());
            }
            const menuProps = {
                key: 1,
                items: this.getItems(),
                maxWithoutFilter: 10,
                text,
                inline: text === null,
            };
            items.push(<SubMenuItem {...menuProps} />);
        }

        return items;
    }
}
