/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { List } from 'immutable'
import { DropdownButton, MenuItem } from 'react-bootstrap'

interface MultiMenuButtonProps {
    bsStyle?: string
    currentContextKey?: any
    currentMenuChoice?: string
    id?: string
    menuKeys: List<string>
    pullRight?: boolean
    renderMenuItem: any
    title: string,
}


interface State {
    // flag if the child <DropdownButton/> has ever been opened -- used to optimize render performance
    opened?: boolean
}

export class MultiMenuButton extends React.Component<MultiMenuButtonProps, State> {

    static defaultProps = {
        bsStyle: "success",
        id: "multi-menu-dropdown"
    };

    constructor(props: MultiMenuButtonProps) {
        super(props);

        this.onToggle = this.onToggle.bind(this);

        this.state = {
            opened: false
        };
    }

    onToggle() {
        // set it and forget it
        if (!this.state.opened) {
            this.setState({
                opened: true
            });
        }
    }

    renderMenuItems() {
        const { currentContextKey, currentMenuChoice, menuKeys, renderMenuItem } = this.props;

        let items = [];
        if (currentContextKey) {
            items.push(renderMenuItem(currentContextKey, currentMenuChoice));
            items.push(<MenuItem divider key={"d"}/>);
        }
        menuKeys
            .filter((key) => key != currentContextKey)
            .forEach((key) => {
                items.push(renderMenuItem(key));
            });

        return items;
    }

    render() {
        const { id, bsStyle, pullRight, title } = this.props;
        const { opened } = this.state;

        return (
            <DropdownButton
                id={id}
                bsStyle={bsStyle}
                onToggle={this.onToggle}
                pullRight={pullRight}
                title={title}
            >
                {opened && this.renderMenuItems()}
            </DropdownButton>
        )
    }
}
