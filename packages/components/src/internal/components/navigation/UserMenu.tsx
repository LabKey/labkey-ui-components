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
import { getServerContext } from '@labkey/api';

import { User, devToolsActive, toggleDevTools } from '../../..';

import { ProductMenuModel } from './model';
import { signOut, signIn } from './actions';
import { lpActive, toggleLP } from '../../util/utils';

export interface UserMenuProps {
    extraDevItems?: ReactNode;
    extraUserItems?: ReactNode;
    model: ProductMenuModel;
    onSignIn?: () => void;
    onSignOut?: (signOutUrl: string) => void;
    signOutUrl?: string;
    user?: User;
}

export const UserMenu: FC<UserMenuProps> = props => {
    const { extraDevItems, extraUserItems, model, onSignIn, onSignOut, user, signOutUrl } = props;
    const menuSection = useMemo(() => model.getSection('user'), [model]);

    const menuItems = useMemo(() => {
        return menuSection?.items
            .filter(item => !item.requiresLogin || (item.requiresLogin && user?.isSignedIn))
            .map(item => {
                const target = item.key === 'docs' ? '_blank' : '_self';
                return (
                    <MenuItem key={item.key} href={item.getUrlString()} target={target}>
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
                {extraUserItems}
                {getServerContext().devMode && (
                    <>
                        <MenuItem divider />
                        <MenuItem header>Dev Tools</MenuItem>
                        <MenuItem onClick={toggleDevTools}>
                            {devToolsActive() ? 'Disable' : 'Enable'} Redux Tools
                        </MenuItem>
                        <MenuItem onClick={toggleLP}>
                            {lpActive() ? 'Disable' : 'Enable'} Lab Processes
                        </MenuItem>
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
