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

import React, { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Dropdown, Image, MenuItem } from 'react-bootstrap';
import { getServerContext } from '@labkey/api';

import { User } from '../base/models/User';

import { devToolsActive, toggleDevTools } from '../../util/utils';

import { useServerContext } from '../base/ServerContext';
import { getCurrentAppProperties } from '../../app/utils';
import { AppProperties } from '../../app/models';

import { AppContext, useAppContext } from '../../AppContext';

import { signIn, signOut } from './actions';
import { MenuSectionModel } from './model';

export interface UserMenuProps {
    appProperties?: AppProperties;
    extraDevItems?: ReactNode;
    extraUserItems?: ReactNode;
    onSignIn?: () => void;
    onSignOut?: (signOutUrl: string) => void;
    signOutUrl?: string;
    user?: User;
}

interface ImplProps {
    model: MenuSectionModel;
}

// exported for jest testing
export const UserMenuImpl: FC<UserMenuProps & ImplProps> = props => {
    const { model, extraDevItems, extraUserItems, onSignIn, onSignOut, user, signOutUrl } = props;

    const menuItems = useMemo(() => {
        return model?.items
            .filter(item => !item.requiresLogin || (item.requiresLogin && user?.isSignedIn))
            .map(item => {
                if (item.key === 'docs') {
                    return (
                        <MenuItem key={item.key} href={item.getUrlString()} target="_blank" rel="noopener noreferrer">
                            {item.label}
                        </MenuItem>
                    );
                }

                return (
                    <MenuItem key={item.key} href={item.getUrlString()} target="_self">
                        {item.label}
                    </MenuItem>
                );
            });
    }, [model?.items, user?.isSignedIn]);

    const handleSignOut = useCallback(() => {
        onSignOut(signOutUrl);
    }, [onSignOut, signOutUrl]);

    if (!model || !user) {
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

export const UserMenu: FC<UserMenuProps> = props => {
    const { appProperties = getCurrentAppProperties() } = props;
    const { api } = useAppContext<AppContext>();
    const { container, moduleContext } = useServerContext();
    const [model, setModel] = useState<MenuSectionModel>();

    useEffect(() => {
        (async () => {
            // no try/catch as the loadUserMenu will catch errors and return undefined
            const sectionModel = await api.navigation.loadUserMenu(appProperties, moduleContext, container.path);
            setModel(sectionModel);
        })();
    }, [api.navigation, appProperties, container.path, moduleContext]);

    return <UserMenuImpl {...props} model={model} />;
};

UserMenu.defaultProps = {
    onSignIn: signIn,
    onSignOut: signOut,
};
