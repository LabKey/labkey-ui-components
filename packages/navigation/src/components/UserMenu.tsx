/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */

import * as React from 'react'
import { Dropdown, Image, MenuItem } from 'react-bootstrap'
import { User, buildURL, devToolsActive, toggleDevTools } from '@glass/base'

import { MenuSectionModel, ProductMenuModel } from '../model'
import { createNotification } from "@glass/base";

interface UserMenuProps {
    model: ProductMenuModel
    user: User
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

    notify() {
        createNotification({
            message: 'This is a test notification.'
        })
    }

    render() {
        const { extraDevItems, extraUserItems, model, user } = this.props;

        const menuSection = model.getSection("user");

        if (menuSection) {
            let logoutLink,
                logoutDivider;

            let menuItems = [];
            menuSection.items.forEach((item) => {
                if ((item.requiresLogin && user.isSignedIn) || !item.requiresLogin) {
                    menuItems.push(<MenuItem key={item.key} href={item.url} target={item.key === "docs" ? "_blank" : "_self"}>{item.label}</MenuItem>)
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
                        {user.avatar ? <Image src={user.avatar}
                               alt="User Avatar"
                               rounded={true}
                               height={32}
                               width={32}/> : <span className="navbar-item">
                                <span className="user-name"><span className="fas fa-user-circle"/> {user.displayName} </span>
                            </span>}
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
                                <MenuItem onClick={this.notify}>
                                    Fire Notification
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
