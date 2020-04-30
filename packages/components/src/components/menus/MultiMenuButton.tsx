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
import React, { ReactNode } from 'react';
import { List } from 'immutable';
import { DropdownButton, MenuItem } from 'react-bootstrap';

interface MultiMenuButtonProps {
    bsStyle?: string;
    currentSubMenuKey?: any;
    currentSubMenuChoice?: string;
    id?: string;
    menuKeys: List<string>;
    pullRight?: boolean;
    renderMenuItem: (currentSubMenuKey: string, currentSubMenuChoice?: string) => ReactNode;
    title: string;
}

interface State {
    // flag if the child <DropdownButton/> has ever been opened -- used to optimize render performance
    opened?: boolean;
}

export class MultiMenuButton extends React.Component<MultiMenuButtonProps, State> {
    static defaultProps = {
        bsStyle: 'success',
        id: 'multi-menu-dropdown',
    };

    constructor(props: MultiMenuButtonProps) {
        super(props);

        this.onToggle = this.onToggle.bind(this);

        this.state = {
            opened: false,
        };
    }

    onToggle() {
        // set it and forget it
        if (!this.state.opened) {
            this.setState({
                opened: true,
            });
        }
    }

    renderMenuItems() {
        const { currentSubMenuKey, currentSubMenuChoice, menuKeys, renderMenuItem } = this.props;

        const items = [];
        if (currentSubMenuKey) {
            items.push(renderMenuItem(currentSubMenuKey, currentSubMenuChoice));
            items.push(<MenuItem divider key="d" />);
        }
        menuKeys
            .filter(key => key != currentSubMenuKey)
            .forEach(key => {
                items.push(renderMenuItem(key));
            });

        return items;
    }

    render() {
        const { id, bsStyle, pullRight, title } = this.props;
        const { opened } = this.state;

        return (
            <DropdownButton id={id} bsStyle={bsStyle} onToggle={this.onToggle} pullRight={pullRight} title={title}>
                {opened && this.renderMenuItems()}
            </DropdownButton>
        );
    }
}
