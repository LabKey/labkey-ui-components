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
import { Dropdown, DropdownButton, Image, MenuItem } from 'react-bootstrap';
import { getServerContext } from '@labkey/api';

import { User } from '../base/models/User';

import { devToolsActive, toggleDevTools } from '../../util/utils';

import { useServerContext } from '../base/ServerContext';
import { getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';
import { AppProperties } from '../../app/models';

import { AppContext, useAppContext } from '../../AppContext';

import { signIn, signOut } from './actions';
import { MenuSectionModel } from './model';
import { getHelpLink } from '../../util/helpLinks';

export interface UserMenuProps {
    appProperties?: AppProperties;
    extraDevItems?: ReactNode;
    extraUserItems?: ReactNode;
    onSignIn?: () => void;
    onSignOut?: (signOutUrl: string) => void;
    signOutUrl?: string;
    user: User;
}

interface ImplProps {
    model: MenuSectionModel;
}

// exported for jest testing
export const UserMenuGroupImpl: FC<UserMenuProps & ImplProps> = props => {
    const { model, extraDevItems, extraUserItems, onSignIn, onSignOut, user, signOutUrl } = props;
    const releaseNoteHref = getHelpLink(getPrimaryAppProperties().releaseNoteLink);

    const { helpHref, userMenuItems, adminMenuItems } = useMemo(() => {
        let helpHref;
        const userMenuItems = [];
        const adminMenuItems = [];
        model?.items
            .filter(item => !item.requiresLogin || (item.requiresLogin && user?.isSignedIn))
            .forEach(item => {
                if (item.key === 'docs') {
                    helpHref = item.getUrlString();
                } else {
                    const menuItem = (
                        <MenuItem key={item.key} href={item.getUrlString()} target="_self">
                            {item.label}
                        </MenuItem>
                    );
                    if (item.key.indexOf('admin') === 0) {
                        adminMenuItems.push(menuItem);
                    } else userMenuItems.push(menuItem);
                }
            });
        return {
            helpHref,
            userMenuItems,
            adminMenuItems,
        };
    }, [model?.items, user?.isSignedIn]);

    const handleSignOut = useCallback(() => {
        onSignOut(signOutUrl);
    }, [onSignOut, signOutUrl]);

    if (!model || !user) {
        return null;
    }

    return (
        <>
            <div className="navbar-item pull-right">
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
                        {userMenuItems}
                        {extraUserItems}
                        <MenuItem divider />
                        {user.isSignedIn ? (
                            <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                        ) : (
                            <MenuItem onClick={onSignIn}>Sign In</MenuItem>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            </div>
            {(adminMenuItems?.length > 0 || getServerContext().devMode) && (
                <div className="navbar-item pull-right navbar-item-product-navigation">
                    <DropdownButton
                        id="admin-menu-button"
                        className="navbar-icon-button-right admin-menu-nav-dropdown"
                        title={<i className="fa fa-cog navbar-header-icon" />}
                        noCaret
                        pullRight
                    >
                        <div className="navbar-icon-connector" />
                        {adminMenuItems}
                        {adminMenuItems?.length > 0 && getServerContext().devMode && <MenuItem divider />}
                        {getServerContext().devMode && (
                            <>
                                <MenuItem header>Dev Tools</MenuItem>
                                <MenuItem onClick={toggleDevTools}>
                                    {devToolsActive() ? 'Disable' : 'Enable'} Redux Tools
                                </MenuItem>
                                {extraDevItems}
                            </>
                        )}
                    </DropdownButton>
                </div>
            )}
            {(!!helpHref || !!releaseNoteHref) && (
                <div className="navbar-item pull-right navbar-item-product-navigation">
                    <DropdownButton
                        id="help-menu-button"
                        className="navbar-icon-button-right"
                        title={<i className="fa fa-question-circle navbar-header-icon" />}
                        noCaret
                        pullRight
                    >
                        <div className="navbar-icon-connector" />
                        {helpHref && <MenuItem key="help" href={helpHref} target="_blank" rel="noopener noreferrer">Help</MenuItem>}
                        {releaseNoteHref && <MenuItem key="release" href={releaseNoteHref} target="_blank" rel="noopener noreferrer">Release Notes</MenuItem>}
                    </DropdownButton>
                </div>
            )}
        </>
    );
};

export const UserMenuGroup: FC<UserMenuProps> = props => {
    const { api } = useAppContext<AppContext>();
    const { container, moduleContext } = useServerContext();
    const { appProperties = getPrimaryAppProperties(moduleContext) } = props;
    const productId = getCurrentAppProperties()?.productId ?? appProperties.productId;

    const [model, setModel] = useState<MenuSectionModel>();

    useEffect(() => {
        (async () => {
            // no try/catch as the loadUserMenu will catch errors and return undefined
            const sectionModel = await api.navigation.loadUserMenu(productId, appProperties, moduleContext);
            setModel(sectionModel);
        })();
    }, [api.navigation, appProperties, container.path, moduleContext, productId]);

    return <UserMenuGroupImpl {...props} model={model} />;
};

UserMenuGroup.defaultProps = {
    onSignIn: signIn,
    onSignOut: signOut,
};
