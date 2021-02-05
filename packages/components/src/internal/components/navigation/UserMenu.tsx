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

import React, { FC, ReactNode, useCallback, useMemo } from 'react';
import { Dropdown, Image, MenuItem } from 'react-bootstrap';

import { User, devToolsActive, toggleDevTools, buildURL, AppURL } from '../../..';

import { ProductMenuModel } from './model';
import { signOut, signIn } from './actions';

export interface UserMenuProps {
    extraDevItems?: ReactNode;
    extraUserItems?: ReactNode;
    model: ProductMenuModel;
    onSignIn?: () => void;
    onSignOut?: (signOutUrl: string) => void;
    showSwitchToLabKey?: boolean;
    signOutUrl?: string;
    user?: User;
}

export const UserMenu: FC<UserMenuProps> = props => {
    const { extraDevItems, extraUserItems, model, onSignIn, onSignOut, user, showSwitchToLabKey, signOutUrl } = props;
    const menuSection = useMemo(() => model.getSection('user'), [model]);

    const switchToLabKeyItem = useMemo(() => {
        const beginUrl = buildURL('project', 'begin', undefined, { returnUrl: false });
        return (
            <MenuItem key="projectBegin" href={beginUrl}>
                Switch to LabKey
            </MenuItem>
        );
    }, []);

    const menuItems = useMemo(() => {
        return menuSection?.items
            .filter(item => !item.requiresLogin || (item.requiresLogin && user?.isSignedIn))
            .map(item => {
                const href = item.url instanceof AppURL ? item.url.toHref() : item.url;
                return (
                    <MenuItem key={item.key} href={href} target={item.key === 'docs' ? '_blank' : '_self'}>
                        {item.label}
                    </MenuItem>
                );
            });
    }, [menuSection?.items, user?.isSignedIn]);

    const handleSignOut = useCallback(() => {
        onSignOut(signOutUrl);
    }, [onSignOut, signOutUrl]);

    if (!menuSection || !user) {
        return null;
    }

    return (
        <Dropdown id="user-menu-dropdown">
            <Dropdown.Toggle useAnchor>
                {user.avatar ? (
                    <Image src={user.avatar} alt="User Avatar" rounded height={32} width={32} />
                ) : (
                    <span className="navbar-item">
                        <span className="user-name">
                            <span className="fas fa-user-circle" /> {user.displayName}{' '}
                        </span>
                    </span>
                )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="pull-right" pullRight>
                <div className="navbar-connector" />
                {menuItems}
                {showSwitchToLabKey && switchToLabKeyItem}
                {extraUserItems}
                {LABKEY.devMode && (
                    <>
                        <MenuItem divider />
                        <MenuItem header>Dev Tools</MenuItem>
                        <MenuItem onClick={toggleDevTools}>
                            {devToolsActive() ? 'Disable' : 'Enable'} Redux Tools
                        </MenuItem>
                        {!showSwitchToLabKey && switchToLabKeyItem}
                        {extraDevItems}
                    </>
                )}
                <MenuItem divider />
                {user.isSignedIn ? (
                    <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                ) : (
                    <MenuItem onClick={onSignIn}>Sign In</MenuItem>
                )}
            </Dropdown.Menu>
        </Dropdown>
    );
};

UserMenu.defaultProps = {
    onSignIn: signIn,
    onSignOut: signOut,
};
