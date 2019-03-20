/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

import React from 'reactn'
import { Dropdown, MenuItem, Image } from 'react-bootstrap'

import { User } from '@glass/models';
import { menuInit } from '../actions';
import { MenuSectionModel } from '../model';
import { devToolsActive, toggleDevTools, buildURL } from '@glass/utils';

interface UserMenuProps {
    productId: string
    user: User
    extraDevItems?: any
    extraUserItems?: any
}

export class UserMenu extends React.Component<UserMenuProps, any> {

    componentWillMount() {
        this.initMenuModel(this.props)
    }

    initMenuModel(props: UserMenuProps)  {
        menuInit(props.productId)
    }

    getSection() : MenuSectionModel {
        return this.global.Navigation_menu.getSection("user");
    }

    logout() {
        console.log("Not logging you out.  Just so you know.");
    }

    render() {
        const { extraDevItems, extraUserItems, user } = this.props;

        const menuSection = this.getSection();

        if (menuSection) {
            let profileLink,
                logoutLink,
                logoutDivider;

            let menuItems = [];
            menuSection.items.forEach((item) => {
                if ((item.requiresLogin && user.isSignedIn) || !item.requiresLogin) {
                    profileLink = menuItems.push(<MenuItem key={item.key} href={item.url} target={item.key === "docs" ? "_blank" : "_self"}>{item.label}</MenuItem>)
                }
            });
            menuItems.push(
                <MenuItem key="projectBegin" href={buildURL('project', 'begin.view', undefined, {returnURL: false})}>
                    Switch to LabKey
                </MenuItem>
            );

            // commenting this out for now because we have not implemented login/logout functionality
            // if (user.isSignedIn) {
            //     logoutLink = <MenuItem onClick={this.logout}>Logout</MenuItem>;
            //     logoutDivider = <MenuItem divider/>;
            // }


            return (
                <Dropdown id="user-menu-dropdown">
                    <Dropdown.Toggle useAnchor={true}>
                        <Image src={user.avatar}
                               alt="User Avatar"
                               rounded={true}
                               height={32}
                               width={32}/>
                    </Dropdown.Toggle>
                    <Dropdown.Menu pullRight className="pull-right">
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
