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
import React, { FC, memo, ReactNode, useCallback } from 'react';
import { List, Map } from 'immutable';
import { getServerContext } from '@labkey/api';

import { User } from '../../..';
import { hasPremiumModule } from '../../app/utils';

import { ServerNotifications } from '../notifications/ServerNotifications';
import { ServerNotificationsConfig } from '../notifications/model';
import { ProductMenu } from './ProductMenu';
import { SearchBox } from './SearchBox';
import { UserMenu, UserMenuProps } from './UserMenu';
import { MenuSectionConfig } from './ProductMenuSection';
import { ProductMenuModel } from './model';
import { ProductNavigation } from '../productnavigation/ProductNavigation';

interface NavigationBarProps {
    brand?: ReactNode;
    menuSectionConfigs?: List<Map<string, MenuSectionConfig>>;
    model: ProductMenuModel;
    notificationsConfig?: ServerNotificationsConfig;
    onSearch?: (form: any) => void;
    projectName?: string;
    searchPlaceholder?: string;
    showSearchBox?: boolean;
    user?: User;
}

type Props = NavigationBarProps & UserMenuProps;

export const NavigationBar: FC<Props> = memo(props => {
    const {
        brand,
        extraDevItems,
        extraUserItems,
        menuSectionConfigs,
        model,
        notificationsConfig,
        onSearch,
        onSignIn,
        onSignOut,
        projectName,
        searchPlaceholder,
        showSearchBox,
        signOutUrl,
        user,
    } = props;

    const onSearchIconClick = useCallback(() => {
        onSearch('');
    }, [onSearch]);

    const notifications =
        !!notificationsConfig && user && !user.isGuest ? <ServerNotifications {...notificationsConfig} /> : null;
    const productNav = hasPremiumModule() || getServerContext().devMode ? <ProductNavigation /> : null;

    return (
        <nav className="navbar navbar-container test-loc-nav-header">
            <div className="container">
                <div className="row">
                    <div className="navbar-left col-sm-5 col-xs-7">
                        <span className="navbar-item pull-left">{brand}</span>
                        <span className="navbar-item-padded">
                            {!!model && <ProductMenu model={model} sectionConfigs={menuSectionConfigs} />}
                        </span>
                        {projectName && (
                            <span className="navbar-item hidden-sm hidden-xs">
                                <span className="project-name">
                                    <i className="fa fa-folder-open-o" /> {projectName}{' '}
                                </span>
                            </span>
                        )}
                    </div>
                    <div className="navbar-right col-sm-7 col-xs-5">
                        <div className="navbar-item pull-right">
                            {!!user && (
                                <UserMenu
                                    extraDevItems={extraDevItems}
                                    extraUserItems={extraUserItems}
                                    model={model}
                                    onSignIn={onSignIn}
                                    onSignOut={onSignOut}
                                    signOutUrl={signOutUrl}
                                    user={user}
                                />
                            )}
                        </div>
                        <div className="navbar-item pull-right navbar-item-notification">{notifications}</div>
                        <div className="navbar-item pull-right navbar-item-product-navigation">{productNav}</div>
                        <div className="navbar-item pull-right hidden-xs">
                            {showSearchBox && <SearchBox onSearch={onSearch} placeholder={searchPlaceholder} />}
                        </div>
                        <div className="navbar-item pull-right visible-xs">
                            {showSearchBox && (
                                <i className="fa fa-search navbar__xs-search-icon" onClick={onSearchIconClick} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
});

NavigationBar.defaultProps = {
    showSearchBox: false,
};
