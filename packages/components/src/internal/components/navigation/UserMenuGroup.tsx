/*
 * Copyright (c) 2023-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

import React, { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { getServerContext } from '@labkey/api';

import { User } from '../base/models/User';

import { devToolsActive, toggleDevTools } from '../../util/utils';

import { useServerContext } from '../base/ServerContext';
import { getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';
import { AppProperties } from '../../app/models';

import { AppContext, useAppContext } from '../../AppContext';

import { getHelpLink } from '../../util/helpLinks';

import { HELP_LINK_METRIC, RELEASE_NOTES_METRIC } from '../productnavigation/constants';

import { DropdownButton, DropdownMenu, MenuDivider, MenuHeader, MenuItem } from '../../dropdowns';

import { signIn as defaultSignIn, signOut as defaultSignOut } from './actions';
import { MenuSectionModel } from './model';
import { biologicsIsPrimaryApp } from '../../app/products';
import { Icon } from '../../Icon';

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
export const UserMenuGroupImpl: FC<ImplProps & UserMenuProps> = props => {
    const {
        model,
        extraDevItems,
        extraUserItems,
        onSignIn = defaultSignIn,
        onSignOut = defaultSignOut,
        user,
        signOutUrl,
    } = props;
    const { api } = useAppContext();
    const releaseNoteLink = getPrimaryAppProperties()?.releaseNoteLink;
    const releaseNoteHref = releaseNoteLink
        ? getHelpLink(
              getPrimaryAppProperties()?.releaseNoteLink,
              null,
              biologicsIsPrimaryApp() /* needed for FM in Biologics*/
          )
        : undefined;

    const { helpHref, userMenuItems, adminMenuItems } = useMemo(() => {
        let helpHref_: string;
        const userMenuItems_ = [];
        const adminMenuItems_ = [];
        model?.items
            .filter(item => !item.requiresLogin || (item.requiresLogin && user?.isSignedIn))
            .forEach(item => {
                if (item.key === 'docs') {
                    helpHref_ = item.getUrlString();
                } else {
                    const menuItem = (
                        <MenuItem href={item.getUrlString()} key={item.key} target="_self">
                            {item.label}
                        </MenuItem>
                    );
                    if (item.key.indexOf('admin') === 0) {
                        adminMenuItems_.push(menuItem);
                    } else {
                        userMenuItems_.push(menuItem);
                    }
                }
            });
        return {
            helpHref: helpHref_,
            userMenuItems: userMenuItems_,
            adminMenuItems: adminMenuItems_,
        };
    }, [model?.items, user?.isSignedIn]);

    const handleSignOut = useCallback(() => {
        onSignOut(signOutUrl);
    }, [onSignOut, signOutUrl]);

    const onReleaseNotesClick = useCallback(() => {
        api.query.incrementClientSideMetricCount(RELEASE_NOTES_METRIC, 'FromHelpMenu');
    }, []);

    const onHelpClick = useCallback(() => {
        api.query.incrementClientSideMetricCount(HELP_LINK_METRIC, 'clickCount');
    }, []);

    if (!model || !user) {
        return null;
    }

    const userToggle = user.avatar ? (
        <img alt="User Avatar" className="img-rounded" height={32} src={user.avatar} width={32} />
    ) : (
        <span className="navbar-item">
            <span className="user-name">
                <span className="fas fa-user-circle" /> {user.displayName}{' '}
            </span>
        </span>
    );

    return (
        <>
            {(!!helpHref || !!releaseNoteHref) && (
                <DropdownButton
                    buttonClassName="navbar-menu-button"
                    className="help-dropdown navbar-dropdown"
                    noCaret
                    pullRight
                    title={<Icon iconClass="fa fa-question-circle navbar-header-icon" srText="Help" />}
                >
                    <div className="navbar-menu-connector" />
                    {helpHref && (
                        <MenuItem href={helpHref} onClick={onHelpClick} rel="noopener noreferrer" target="_blank">
                            Help
                        </MenuItem>
                    )}
                    {releaseNoteHref && (
                        <MenuItem
                            href={releaseNoteHref}
                            onClick={onReleaseNotesClick}
                            rel="noopener noreferrer"
                            target="_blank"
                        >
                            Release Notes
                        </MenuItem>
                    )}
                </DropdownButton>
            )}

            {(adminMenuItems?.length > 0 || getServerContext().devMode) && (
                <DropdownButton
                    buttonClassName="navbar-menu-button"
                    className="admin-dropdown navbar-dropdown"
                    noCaret
                    pullRight
                    title={<Icon iconClass="fa fa-cog navbar-header-icon" srText="Admin" />}
                >
                    <div className="navbar-menu-connector" />
                    {adminMenuItems}
                    {adminMenuItems?.length > 0 && getServerContext().devMode && <MenuDivider />}
                    {getServerContext().devMode && (
                        <>
                            <MenuHeader text="Dev Tools" />
                            <MenuItem onClick={toggleDevTools}>
                                {devToolsActive() ? 'Disable' : 'Enable'} Redux Tools
                            </MenuItem>
                            {extraDevItems}
                        </>
                    )}
                </DropdownButton>
            )}

            <DropdownMenu className="user-dropdown navbar-dropdown" label="User menu" noCaret pullRight title={userToggle}>
                <div className="navbar-menu-connector" />
                {userMenuItems}
                {extraUserItems}
                {(userMenuItems?.length > 0 || extraUserItems) && <MenuDivider />}
                {user.isSignedIn && <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>}
                {!user.isSignedIn && <MenuItem onClick={onSignIn}>Sign In</MenuItem>}
            </DropdownMenu>
        </>
    );
};
UserMenuGroupImpl.displayName = 'UserMenuGroupImpl';

export const UserMenuGroup: FC<UserMenuProps> = props => {
    const { api } = useAppContext<AppContext>();
    const { container, moduleContext } = useServerContext();
    const { appProperties = getPrimaryAppProperties(moduleContext) } = props;

    const [model, setModel] = useState<MenuSectionModel>();

    useEffect(() => {
        (async () => {
            // no try/catch as the loadUserMenu will catch errors and return undefined
            const sectionModel = await api.navigation.loadUserMenu(appProperties.productId, container.path);
            setModel(sectionModel);
        })();
    }, [api.navigation, appProperties, container.path, moduleContext]);

    return <UserMenuGroupImpl {...props} model={model} />;
};
UserMenuGroup.displayName = 'UserMenuGroup';
