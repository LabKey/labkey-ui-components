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
import { List, Map } from 'immutable';

import { User } from '../../..';

import { ProductMenu } from './ProductMenu';
import { SearchBox } from './SearchBox';
import { UserMenu } from './UserMenu';
import { MenuSectionConfig } from './ProductMenuSection';
import { ProductMenuModel } from './model';
import { ServerNotifications } from "../notifications/ServerNotifications";

interface NavigationBarProps {
    brand?: ReactNode;
    projectName?: string;
    menuSectionConfigs?: List<Map<string, MenuSectionConfig>>;
    model: ProductMenuModel;
    showSearchBox: boolean;
    onSearch?: (form: any) => any;
    searchPlaceholder?: string;
    user?: User;
    showSwitchToLabKey: boolean;
    signOutUrl?: string;
    showNotifications: boolean;
}

export class NavigationBar extends React.Component<NavigationBarProps, any> {
    static defaultProps: {
        showSearchBox: false;
        showSwitchToLabKey: true;
        showNotifications: false;
    };

    render(): ReactNode {
        const {
            brand,
            menuSectionConfigs,
            model,
            projectName,
            showSearchBox,
            onSearch,
            searchPlaceholder,
            user,
            showNotifications,
            showSwitchToLabKey,
            signOutUrl,
        } = this.props;
        const productMenu = model ? <ProductMenu model={model} sectionConfigs={menuSectionConfigs} /> : null;
        const searchBox = showSearchBox ? <SearchBox onSearch={onSearch} placeholder={searchPlaceholder} /> : null;
        const userMenu = user ? (
            <UserMenu model={model} user={user} showSwitchToLabKey={showSwitchToLabKey} signOutUrl={signOutUrl} />
        ) : null;

        const notifications = showNotifications && user && !user.isGuest ? <ServerNotifications /> : null;

        return (
            <nav className="navbar navbar-container test-loc-nav-header">
                <div className="container">
                    <div className="row">
                        <div className="navbar-left col-sm-5 col-xs-7">
                            <span className="navbar-item pull-left">{brand}</span>
                            <span className="navbar-item-padded">{productMenu}</span>
                            {projectName && (
                                <span className="navbar-item hidden-sm hidden-xs">
                                    <span className="project-name">
                                        <i className="fa fa-folder-open-o" /> {projectName}{' '}
                                    </span>
                                </span>
                            )}
                        </div>
                        <div className="navbar-right col-sm-7 col-xs-5">
                            <div className="navbar-item pull-right">{userMenu}</div>
                            <div className="navbar-item pull-right">
                                {notifications}
                            </div>
                            <div className="navbar-item pull-right hidden-xs">{searchBox}</div>
                            <div className="navbar-item pull-right visible-xs">
                                {showSearchBox && (
                                    <i className="fa fa-search navbar__xs-search-icon" onClick={() => onSearch('')} />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        );
    }
}
