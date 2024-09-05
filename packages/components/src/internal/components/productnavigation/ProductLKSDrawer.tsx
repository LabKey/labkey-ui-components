import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { getServerContext } from '@labkey/api';
import classNames from 'classnames';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { buildURL } from '../../url/AppURL';

import { ContainerTabModel } from './models';
import {
    APPLICATION_NAVIGATION_METRIC,
    LK_DOC_FOLDER_TABS,
    TO_LKS_CONTAINER_METRIC,
    TO_LKS_HOME_METRIC,
    TO_LKS_TAB_METRIC,
} from './constants';
import { ProductClickableItem } from './ProductClickableItem';

interface ProductLKSDrawerProps {
    api?: ComponentsAPIWrapper;
    disableLKSContainerLink?: boolean;
    showHome: boolean;
    tabs: ContainerTabModel[];
}

export const ProductLKSDrawer: FC<ProductLKSDrawerProps> = memo(props => {
    const { tabs, disableLKSContainerLink, showHome, api = getDefaultAPIWrapper() } = props;
    const { container, homeContainer, user } = getServerContext();
    const isHomeContainer = useMemo(() => container.path === '/home', [container]);
    const [transition, setTransition] = useState<boolean>(true);
    useEffect(() => {
        // use setTimeout so that the "left" property will change and trigger the transition
        setTimeout(() => setTransition(false), 10);
    }, []);

    const onTabClick = useCallback(() => {
        api.query.incrementClientSideMetricCount(APPLICATION_NAVIGATION_METRIC, TO_LKS_TAB_METRIC);
    }, []);

    const visibleTabs = tabs.filter(tab => !tab.disabled);

    const onHomeClick = useCallback(() => {
        api.query.incrementClientSideMetricCount(APPLICATION_NAVIGATION_METRIC, TO_LKS_HOME_METRIC);
    }, []);

    const onContainerClick = useCallback(() => {
        api.query.incrementClientSideMetricCount(APPLICATION_NAVIGATION_METRIC, TO_LKS_CONTAINER_METRIC);
    }, []);

    return (
        <div className={'menu-transition-left' + (transition ? ' transition' : '')}>
            {showHome && (
                <a
                    className={classNames('container-item ', {
                        'lk-text-theme-dark': !isHomeContainer,
                        clickable: !isHomeContainer,
                    })}
                    onClick={!isHomeContainer ? onHomeClick : undefined}
                    href={getProjectBeginUrl(homeContainer)}
                >
                    <i className="fa fa-home container-icon" />
                    LabKey Home
                </a>
            )}
            {!isHomeContainer && (
                <a
                    className={classNames('container-item', {
                        'lk-text-theme-dark': !disableLKSContainerLink,
                        clickable: !disableLKSContainerLink,
                    })}
                    onClick={disableLKSContainerLink ? undefined : onContainerClick}
                    href={getProjectBeginUrl(container.path)}
                >
                    <i className="fa fa-folder-o container-icon" />
                    {container.title}
                </a>
            )}
            <div className="container-tabs">
                {visibleTabs.length > 1 &&
                    visibleTabs.map(tab => {
                        return (
                            <ProductClickableItem href={tab.href} key={tab.id} id={tab.id} onClick={() => onTabClick()}>
                                {tab.text}
                            </ProductClickableItem>
                        );
                    })}
                {visibleTabs.length <= 1 && (
                    <div className="empty">
                        No tabs have been added to this folder.
                        {user.isAdmin && (
                            <a className="how-to" href={LK_DOC_FOLDER_TABS} target="_blank" rel="noopener noreferrer">
                                How to use tabs in LabKey
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});
ProductLKSDrawer.displayName = 'ProductLKSDrawer';

// exported for jest testing
export function getProjectBeginUrl(container: string): string {
    return buildURL('project', 'begin', undefined, {
        returnUrl: false,
        container,
    });
}
