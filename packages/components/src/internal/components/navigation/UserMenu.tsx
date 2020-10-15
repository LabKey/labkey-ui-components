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
import { Dropdown, Image, MenuItem } from 'react-bootstrap';

import { User } from '../../..';
import { devToolsActive, toggleDevTools } from '../../util/utils';
import { buildURL } from '../../url/ActionURL';
import { AppURL } from '../../url/AppURL';

import { ProductMenuModel } from './model';
import { signOut, signIn } from './actions';

interface UserMenuProps {
    model: ProductMenuModel;
    user: User;
    showSwitchToLabKey: boolean;
    extraDevItems?: any;
    extraUserItems?: any;
    signOutUrl?: string;
}

export class UserMenu extends React.Component<UserMenuProps, any> {
    render() {
        const { extraDevItems, extraUserItems, model, user, showSwitchToLabKey, signOutUrl } = this.props;
        const menuSection = model.getSection('user');

        if (menuSection) {
            const beginUrl = buildURL('project', 'begin', undefined, { returnURL: false });
            const switchToLabKeyItem = (
                <MenuItem key="projectBegin" href={beginUrl}>
                    Switch to LabKey
                </MenuItem>
            );

            const menuItems = [];
            menuSection.items.forEach(item => {
                if ((item.requiresLogin && user.isSignedIn) || !item.requiresLogin) {
                    const href = item.url instanceof AppURL ? item.url.toHref() : item.url;
                    menuItems.push(
                        <MenuItem key={item.key} href={href} target={item.key === 'docs' ? '_blank' : '_self'}>
                            {item.label}
                        </MenuItem>
                    );
                }
            });

            return (
                <Dropdown id="user-menu-dropdown">
                    <Dropdown.Toggle useAnchor={true}>
                        {user.avatar ? (
                            <Image src={user.avatar} alt="User Avatar" rounded={true} height={32} width={32} />
                        ) : (
                            <span className="navbar-item">
                                <span className="user-name">
                                    <span className="fas fa-user-circle" /> {user.displayName}{' '}
                                </span>
                            </span>
                        )}
                    </Dropdown.Toggle>

                    <Dropdown.Menu pullRight className="pull-right">
                        <div className="navbar-connector" />
                        {menuItems}
                        {showSwitchToLabKey && switchToLabKeyItem}
                        {extraUserItems}
                        {LABKEY.devMode ? (
                            <>
                                <MenuItem divider />
                                <MenuItem header>Dev Tools</MenuItem>
                                <MenuItem onClick={toggleDevTools}>
                                    {devToolsActive() ? 'Disable' : 'Enable'} Redux Tools
                                </MenuItem>
                                {!showSwitchToLabKey && switchToLabKeyItem}
                                {extraDevItems}
                            </>
                        ) : null}
                        <MenuItem divider />
                        {user.isSignedIn ? (
                            <MenuItem onClick={() => signOut(signOutUrl)}>Sign Out</MenuItem>
                        ) : (
                            <MenuItem onClick={signIn}>Sign In</MenuItem>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            );
        }
        return null;
    }
}
