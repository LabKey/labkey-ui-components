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

import { User } from '../../..';

import { ServerNotifications } from '../notifications/ServerNotifications';
import { ServerNotificationsConfig } from '../notifications/model';

import { ProductNavigation } from '../productnavigation/ProductNavigation';

import { shouldShowProductNavigation } from '../productnavigation/utils';

import { SearchBox } from '../search/SearchBox';

import { FindAndSearchDropdown } from '../search/FindAndSearchDropdown';

import { HeaderWrapper } from './HeaderWrapper';

import { ProductMenu } from './ProductMenu';
import { UserMenu, UserMenuProps } from './UserMenu';
import { MenuSectionConfig } from './ProductMenuSection';
import { ProductMenuModel } from './model';

import { FolderMenu } from './FolderMenu';
import { getPrimaryAppProperties } from '../../app/utils';

interface NavigationBarProps {
    brand?: ReactNode;
    menuSectionConfigs?: List<Map<string, MenuSectionConfig>>;
    model: ProductMenuModel;
    notificationsConfig?: ServerNotificationsConfig;
    onSearch?: (form: any) => void;
    onFindByIds?: (sessionkey: string) => void;
    searchPlaceholder?: string;
    showFolderMenu?: boolean;
    showNavMenu?: boolean;
    showNotifications?: boolean;
    showProductNav?: boolean;
    showSearchBox?: boolean;
    user?: User;
}

type Props = NavigationBarProps & UserMenuProps;

export const NavigationBar: FC<Props> = memo(props => {
    const {
        brand,
        children,
        extraDevItems,
        extraUserItems,
        menuSectionConfigs,
        model,
        notificationsConfig,
        onSearch,
        onFindByIds,
        onSignIn,
        onSignOut,
        searchPlaceholder = getPrimaryAppProperties().searchPlaceholder,
        showFolderMenu,
        showNavMenu,
        showNotifications,
        showProductNav,
        showSearchBox,
        signOutUrl,
        user,
    } = props;

    const onSearchIconClick = useCallback(() => {
        onSearch('');
    }, [onSearch]);

    const _showNotifications = showNotifications !== false && !!notificationsConfig && user && !user.isGuest;
    const _showProductNav = showProductNav !== false && shouldShowProductNavigation(user);

    return (
        <div className="sticky-on-top">
            <HeaderWrapper>
                <nav className="navbar navbar-container test-loc-nav-header">
                    <div className="container">
                        <div className="row">
                            <div className="navbar-left col-xs-8 col-md-7">
                                <span className="navbar-item pull-left">{brand}</span>
                                {showFolderMenu && (
                                    <span className="navbar-item">
                                        <FolderMenu />
                                    </span>
                                )}
                                {showNavMenu && !!model && (
                                    <span className="navbar-item">
                                        <ProductMenu model={model} sectionConfigs={menuSectionConfigs} />
                                    </span>
                                )}
                            </div>
                            <div className="navbar-right col-xs-4 col-md-5">
                                {!!user && (
                                    <div className="navbar-item pull-right">
                                        <UserMenu
                                            extraDevItems={extraDevItems}
                                            extraUserItems={extraUserItems}
                                            model={model}
                                            onSignIn={onSignIn}
                                            onSignOut={onSignOut}
                                            signOutUrl={signOutUrl}
                                            user={user}
                                        />
                                    </div>
                                )}
                                {_showNotifications && (
                                    <div className="navbar-item pull-right navbar-item-notification">
                                        <ServerNotifications {...notificationsConfig} />
                                    </div>
                                )}
                                {_showProductNav && (
                                    <div className="navbar-item pull-right navbar-item-product-navigation hidden-xs">
                                        <ProductNavigation />
                                    </div>
                                )}
                                {showSearchBox && (
                                    <div className="navbar-item pull-right">
                                        <div className="hidden-md hidden-sm hidden-xs">
                                            <SearchBox
                                                onSearch={onSearch}
                                                placeholder={searchPlaceholder}
                                                onFindByIds={onFindByIds}
                                                findNounPlural="samples"
                                            />
                                        </div>
                                        <div className="visible-md visible-sm visible-xs">
                                            {onFindByIds ? (
                                                <FindAndSearchDropdown
                                                    className="navbar__xs-find-dropdown"
                                                    title={<i className="fa fa-search navbar__xs-search-icon" />}
                                                    findNounPlural="samples"
                                                    onSearch={onSearchIconClick}
                                                    onFindByIds={onFindByIds}
                                                />
                                            ) : (
                                                <i
                                                    className="fa fa-search navbar__xs-search-icon"
                                                    onClick={onSearchIconClick}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </nav>

                {children}
            </HeaderWrapper>
        </div>
    );
});

NavigationBar.defaultProps = {
    showFolderMenu: false,
    showNavMenu: true,
    showNotifications: true,
    showProductNav: true,
    showSearchBox: false,
};

NavigationBar.displayName = 'NavigationBar';
