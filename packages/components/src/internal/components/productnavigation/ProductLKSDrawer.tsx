import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { getServerContext } from '@labkey/api';

import { Container, buildURL } from '../../..';

import { ContainerTabModel } from './models';
import { LK_DOC_FOLDER_TABS } from './constants';
import { ProductClickableItem } from './ProductClickableItem';

interface ProductLKSDrawerProps {
    showHome: boolean;
    tabs: ContainerTabModel[];
}

export const ProductLKSDrawer: FC<ProductLKSDrawerProps> = memo(props => {
    const { tabs, showHome } = props;
    const { container, homeContainer, user } = getServerContext();

    const showContainer = useMemo(() => container.path != '/home', [container])
    const [transition, setTransition] = useState<boolean>(true);
    useEffect(() => {
        // use setTimeout so that the "left" property will change and trigger the transition
        setTimeout(() => setTransition(false), 10);
    }, []);

    const navigate = useCallback((tab: ContainerTabModel) => {
        window.location.href = tab.href;
    }, []);

    const visibleTabs = tabs.filter(tab => !tab.disabled);

    return (
        <div className={'menu-transition-left' + (transition ? ' transition' : '')}>
            {showHome && (
                <a className="container-item lk-text-theme-dark" href={getProjectBeginUrl(homeContainer)}>
                    <i className="fa fa-home container-icon" />
                    LabKey Home
                </a>
            )}
            {showContainer && (
                <a className="container-item lk-text-theme-dark" href={getProjectBeginUrl(container.path)}>
                    <i className="fa fa-folder-o container-icon" />
                    {container.title}
                </a>
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
