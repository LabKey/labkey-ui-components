/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react'
import { List } from 'immutable'
import { DropdownButton, MenuItem } from 'react-bootstrap'

interface CreateButtonProps {
    currentContextKey?: any
    currentMenuChoice?: string
    entityType?: string
    menuKeys: List<string>
    pullRight?: boolean
    renderMenuItem: any
    updateExperimentCallback? : any
}


interface State {
    // flag if the child <DropdownButton/> has ever been opened -- used to optimize render performance
    opened?: boolean
}

export class CreateButton extends React.Component<CreateButtonProps, State> {

    constructor(props: CreateButtonProps) {
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
        const { currentContextKey, menuKeys, renderMenuItem } = this.props;

        let items = [];
        if (currentContextKey) {
            items.push(renderMenuItem(currentContextKey));
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
        const { pullRight } = this.props;
        const { opened } = this.state;

        return (
            <DropdownButton
                id="create-dropdown"
                bsStyle="success"
                onToggle={this.onToggle}
                pullRight={pullRight}
                title="Create"
            >
                {opened && this.renderMenuItems()}
            </DropdownButton>
        )
    }
}
