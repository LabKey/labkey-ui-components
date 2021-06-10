import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { getServerContext } from '@labkey/api';

import { buildURL, incrementClientSideMetricCount } from '../../..';

import { ContainerTabModel } from './models';
import {
    APPLICATION_NAVIGATION_METRIC,
    LK_DOC_FOLDER_TABS,
    TO_LKS_CONTAINER_METRIC,
    TO_LKS_HOME_METRIC, TO_LKS_TAB_METRIC
} from './constants';
import { ProductClickableItem } from './ProductClickableItem';
import classNames from 'classnames';

interface ProductLKSDrawerProps {
    showHome: boolean;
    disableLKSContainerLink?: boolean;
    tabs: ContainerTabModel[];
}

export const ProductLKSDrawer: FC<ProductLKSDrawerProps> = memo(props => {
    const { tabs, disableLKSContainerLink, showHome } = props;
    const { container, homeContainer, user } = getServerContext();
    const isHomeContainer = useMemo(() => container.path === '/home', [container])
    const [transition, setTransition] = useState<boolean>(true);
    useEffect(() => {
        // use setTimeout so that the "left" property will change and trigger the transition
        setTimeout(() => setTransition(false), 10);
    }, []);

    const navigate = useCallback((tab: ContainerTabModel) => {
        incrementClientSideMetricCount(APPLICATION_NAVIGATION_METRIC, TO_LKS_TAB_METRIC);
        window.location.href = tab.href;
    }, []);

    const visibleTabs = tabs.filter(tab => !tab.disabled);

    const clickWithStats = (href: string, name: string) => {
        incrementClientSideMetricCount(APPLICATION_NAVIGATION_METRIC, name)
        window.location.href = href;
    };

    const onHomeClick = useCallback(() => {
        clickWithStats(getProjectBeginUrl(homeContainer), TO_LKS_HOME_METRIC);
    }, [clickWithStats]);

    const onContainerClick = useCallback(() => {
        clickWithStats(getProjectBeginUrl(container.path), TO_LKS_CONTAINER_METRIC);
    }, [clickWithStats]);

    return (
        <div className={'menu-transition-left' + (transition ? ' transition' : '')}>
            {showHome && (
                <div className={classNames("container-item ", {'lk-text-theme-dark': !isHomeContainer, clickable: !isHomeContainer})}
                     onClick={!isHomeContainer ? onHomeClick : undefined}
                >
                    <i className="fa fa-home container-icon" />
                    LabKey Home
                </div>
            )}
            {!isHomeContainer && (
                <div className={classNames("container-item", {'lk-text-theme-dark': !disableLKSContainerLink, clickable: !disableLKSContainerLink})}
                     onClick={disableLKSContainerLink ? undefined : onContainerClick} >
                    <i className="fa fa-folder-o container-icon" />
                    {container.title}
                </div>
            )}
            <div className="container-tabs">
                {visibleTabs.length > 1 &&
                    visibleTabs.map(tab => {
                        return (
                            <ProductClickableItem key={tab.id} id={tab.id} onClick={() => navigate(tab)}>
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


// exported for jest testing
export function getProjectBeginUrl(container: string): string {
    return buildURL('project', 'begin', undefined, {
        returnUrl: false,
        container,
    });
}
