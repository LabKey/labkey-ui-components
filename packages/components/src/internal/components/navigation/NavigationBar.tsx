/*
 * Copyright (c) 2019-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import classNames from 'classnames';
import React, { FC, memo, useCallback, useMemo } from 'react';
import { List, Map } from 'immutable';
import { Link, useLocation } from 'react-router';

import { ServerNotifications } from '../notifications/ServerNotifications';
import { ServerNotificationsConfig } from '../notifications/model';

import { ProductNavigation } from '../productnavigation/ProductNavigation';

import { shouldShowProductNavigation } from '../productnavigation/utils';

import { SearchBox } from '../search/SearchBox';

import { FindAndSearchDropdown } from '../search/FindAndSearchDropdown';

import { getAppLogoImageUrls, getPrimaryAppProperties } from '../../app/utils';

import { User } from '../base/models/User';

import { useServerContext } from '../base/ServerContext';

import { isAdminRoute, ProductMenuButton } from './ProductMenu';
import { SubNav } from './SubNav';
import { UserMenuGroup, UserMenuProps } from './UserMenuGroup';
import { MenuSectionConfig } from './model';
import { SEARCH_PLACEHOLDER } from './constants';
import { useFolderMenuContext, useSubNavTabsContext } from './hooks';
import { Icon } from '../../Icon';
import { AssistantButton } from '../mcp/AssistantPanel';
import { useAssistantService } from '../mcp/AssistantService';

const HeaderLogo: FC = memo(() => {
    const { badge, withText } = getAppLogoImageUrls();
    return (
        <div className="header-logo">
            <div className="hidden-xs hidden-sm">
                <Link className="header-logo__link" to="/">
                    <span className="sr-only">Home</span>
                    <img
                        alt={getPrimaryAppProperties().name + ' Dashboard'}
                        className="header-logo__image"
                        height="32px"
                        src={withText}
                        srcSet={withText}
                        title="Dashboard"
                    />
                </Link>
            </div>
            <div className="hidden-md hidden-lg">
                <Link className="header-logo__link" to="/">
                    <span className="sr-only">Home</span>
                    <img
                        alt={getPrimaryAppProperties().name + 'Dashboard'}
                        className="header-logo__image"
                        height="36px"
                        src={badge}
                        srcSet={badge}
                        title="Dashboard"
                        width="36px"
                    />
                </Link>
            </div>
        </div>
    );
});
HeaderLogo.displayName = 'AppLogo';

interface NavigationBarProps {
    menuSectionConfigs?: List<Map<string, MenuSectionConfig>>;
    notificationsConfig?: ServerNotificationsConfig;
    onFindByIds?: (sessionkey: string) => void;
    onSearch?: (form: any) => void;
    searchPlaceholder?: string;
    showFolderMenu?: boolean;
    showNavMenu?: boolean;
    user?: User;
}

type Props = NavigationBarProps & UserMenuProps;

export const NavigationBar: FC<Props> = memo(props => {
    const {
        extraDevItems,
        extraUserItems,
        menuSectionConfigs,
        notificationsConfig,
        onSearch,
        onFindByIds,
        onSignIn,
        onSignOut,
        searchPlaceholder,
        showNavMenu = true,
        showFolderMenu,
        signOutUrl,
        user,
    } = props;
    const { extThemeName_42: themeName, moduleContext } = useServerContext();
    const { enabled: assistantEnabled, open: openAssistant } = useAssistantService();
    const folderMenuContext = useFolderMenuContext();
    const location = useLocation();
    const isAdminPage = useMemo(() => isAdminRoute(location.pathname), [location.pathname]);
    const onSearchIconClick = useCallback(() => {
        onSearch('');
    }, [onSearch]);
    const _searchPlaceholder =
        searchPlaceholder ?? getPrimaryAppProperties(moduleContext)?.searchPlaceholder ?? SEARCH_PLACEHOLDER;
    const showNotifications = !!notificationsConfig && !!user && !user.isGuest;
    const showProductNav = shouldShowProductNavigation(user, moduleContext);
    const { noun, tabs } = useSubNavTabsContext();
    const hasSubNav = noun !== undefined || tabs.length > 0;
    const className = classNames('app-navigation', {
        [`app-navigation--${themeName}`]: !!themeName,
        'with-sub-nav': hasSubNav,
        'app-navigation--admin': isAdminPage,
    });

    return (
        <div className={className}>
            <nav className="main-app-nav">
                <div className="main-app-nav__menus">
                    <HeaderLogo />

                    {showNavMenu && (
                        <ProductMenuButton
                            key={folderMenuContext.key} // re-render and reload folderItems when folder added
                            sectionConfigs={menuSectionConfigs}
                            showFolderMenu={showFolderMenu}
                        />
                    )}
                </div>

                <div className="main-app-nav__buttons">
                    {assistantEnabled && <AssistantButton label="LabKey Assistant" onClick={openAssistant} />}

                    {!isAdminPage && (
                        <SearchBox
                            findNounPlural="samples"
                            onFindByIds={onFindByIds}
                            onSearch={onSearch}
                            placeholder={_searchPlaceholder}
                        />
                    )}

                    {!isAdminPage && !!onFindByIds && (
                        <FindAndSearchDropdown
                            className="visible-md visible-sm visible-xs"
                            findNounPlural="samples"
                            onFindByIds={onFindByIds}
                            onSearch={onSearchIconClick}
                            title={<Icon iconClass="fa fa-search navbar-header-icon" srText="Search and Find" />}
                        />
                    )}

                    {!isAdminPage && !onFindByIds && (
                        <i className="fa fa-search navbar__xs-search-icon" onClick={onSearchIconClick} />
                    )}

                    {showProductNav && <ProductNavigation />}

                    {showNotifications && !isAdminPage && <ServerNotifications {...notificationsConfig} />}

                    {!!user && (
                        <UserMenuGroup
                            extraDevItems={extraDevItems}
                            extraUserItems={extraUserItems}
                            onSignIn={onSignIn}
                            onSignOut={onSignOut}
                            signOutUrl={signOutUrl}
                            user={user}
                        />
                    )}
                </div>
            </nav>

            <SubNav />
        </div>
    );
});
NavigationBar.displayName = 'NavigationBar';
