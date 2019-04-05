import * as React from "react";
import { MenuItem } from 'react-bootstrap'
import { List } from 'immutable';
import { ISubItem, SubMenuItem } from "./SubMenuItem";

export interface CreateMenuOption {
    insertHref: string
    name: string
    pluralName: string
    route: string
}

interface CreationSubMenuProps {
    currentMenuChoice?: string
    options: List<CreateMenuOption>
    text: string
}

export class CreationSubMenu extends React.Component<CreationSubMenuProps, any> {

    constructor(props: CreationSubMenuProps) {
        super(props);

        this.isCurrentMenuChoice = this.isCurrentMenuChoice.bind(this);
    }

    isCurrentMenuChoice(option: CreateMenuOption): boolean {
        const { currentMenuChoice } = this.props;

        return option.route === currentMenuChoice;
    }

    getCurrentMenuChoiceItem() {
        const { options } = this.props;
        const currentOption = options.find(this.isCurrentMenuChoice);

        if (currentOption) {
            return <MenuItem href={currentOption.insertHref} key={0}>{currentOption.name}</MenuItem>
        }

        return undefined;
    }

    getItems(): Array<ISubItem> {
        const { options } = this.props;

        let items = [];
        options.forEach(option => {
            if (!this.isCurrentMenuChoice(option)) {
                items.push({
                    text: option.name,
                    href: option.insertHref
                });
            }
        });
        return items;
    }

    render() {
        const { currentMenuChoice, options, text } = this.props;

        let items = [];
        // if there are 2 items or fewer, just show the items as the menu
        if (currentMenuChoice && options.size < 3) {
            options.forEach((option, i) => {
                items.push(
                    <MenuItem href={option.insertHref} key={i}>{option.name}</MenuItem>
                )
            });
        }
        else {
            if (currentMenuChoice) {
                items.push(this.getCurrentMenuChoiceItem());
            }
            let menuProps = {
                key: 1,
                items: this.getItems(),
                minToFilter: 10,
                text
            };
            items.push(<SubMenuItem {...menuProps}/>);
        }

        return items;
    }
}