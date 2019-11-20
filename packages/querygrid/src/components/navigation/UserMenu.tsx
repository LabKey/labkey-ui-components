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

import * as React from 'react'
import { Dropdown, Image, MenuItem } from 'react-bootstrap'

import { MenuSectionModel, ProductMenuModel } from './model'
import { User } from '../base/models/model';
import { devToolsActive, toggleDevTools } from '../../util/utils';
import { buildURL } from '../../url/ActionURL';

interface UserMenuProps {
    model: ProductMenuModel
    user: User
    showSwitchToLabKey: boolean
    extraDevItems?: any
    extraUserItems?: any
}

export class UserMenu extends React.Component<UserMenuProps, any> {

    getSection() : MenuSectionModel {
        return this.props.model.getSection("user");
    }

    logout() {
        console.log("Not logging you out.  Just so you know.");
    }

    render() {
        const { extraDevItems, extraUserItems, model, user, showSwitchToLabKey } = this.props;

        const menuSection = model.getSection("user");

        if (menuSection) {
            let menuItems = [];
            menuSection.items.forEach((item) => {
                if ((item.requiresLogin && user.isSignedIn) || !item.requiresLogin) {
                    menuItems.push(<MenuItem key={item.key} href={item.url} target={item.key === "docs" ? "_blank" : "_self"}>{item.label}</MenuItem>)
                }
            });

            if (showSwitchToLabKey) {
                menuItems.push(
                    <MenuItem key="projectBegin" href={buildURL('project', 'begin.view', undefined, {returnURL: false})}>
                        Switch to LabKey
                    </MenuItem>
                );
            }

            // commenting this out for now because we have not implemented login/logout functionality
            let logoutLink, logoutDivider;
            // if (user.isSignedIn) {
            //     logoutLink = <MenuItem onClick={this.logout}>Logout</MenuItem>;
            //     logoutDivider = <MenuItem divider/>;
            // }

            return (
                <Dropdown id="user-menu-dropdown">
                    <Dropdown.Toggle useAnchor={true}>
                        {user.avatar
                            ? <Image src={user.avatar}
                               alt="User Avatar"
                               rounded={true}
                               height={32}
                               width={32}
                            />
                           : <span className="navbar-item">
                                <span className="user-name"><span className="fas fa-user-circle"/> {user.displayName} </span>
                            </span>
                        }
                    </Dropdown.Toggle>

                    <Dropdown.Menu pullRight className="pull-right">
                        <div className="navbar-connector"/>
                        {menuItems}
                        {extraUserItems}
                        {LABKEY.devMode ? (
                            <>
                                <MenuItem divider/>
                                <MenuItem header>
                                    Dev Tools
                                </MenuItem>
                                <MenuItem onClick={toggleDevTools}>
                                    {devToolsActive() ? 'Disable' : 'Enable'} Redux Tools
                                </MenuItem>
                                {extraDevItems}
                            </>
                        ) : null}
                        {logoutDivider}
                        {logoutLink}
                    </Dropdown.Menu>
                </Dropdown>
            )
        }
        return null;
    }
}
