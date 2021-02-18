import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { getServerContext } from '@labkey/api';

import { Container, buildURL } from '../../..';

import { ContainerTabModel } from './models';
import { LK_DOC_FOLDER_TABS } from './constants';
import { ProductClickableItem } from './ProductClickableItem';

interface ProductLKSDrawerProps {
    /**
     * List of projects which the current user has permissions to so we can use that to decide which container-item
     * options to show below.
     */
    projects: Container[];
    tabs: ContainerTabModel[];
}

export const ProductLKSDrawer: FC<ProductLKSDrawerProps> = memo(props => {
    const { projects, tabs } = props;
    const { project, container, homeContainer, user } = getServerContext();
    const showHome = useMemo(() => isProjectAvailable(projects, undefined, 'home'), [projects]);
    const showProject = useMemo(
        () =>
            project !== undefined &&
            isProjectAvailable(projects, project.id) &&
            project.name !== homeContainer &&
            container.path !== '/home',
        [projects, project, container, homeContainer]
    );
    const showContainer = useMemo(() => project !== undefined && project.id !== container.id, [projects, project]);

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
            {showProject && (
                <a className="container-item lk-text-theme-dark" href={getProjectBeginUrl(project.path)}>
                    <i className="fa fa-folder-open-o container-icon" />
                    {project.title}
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

/**
 * Does a project exist in an array of project containres by either the name or id?
 * @param projects
 * @param id
 * @param name
 */
function isProjectAvailable(projects: Container[], id?: string, name?: string): boolean {
    return projects.find(project => (id ? project.id === id : project.name === name)) !== undefined;
}

function getProjectBeginUrl(container: string): string {
    return buildURL('project', 'begin', undefined, {
        returnUrl: false,
        container,
    });
}
