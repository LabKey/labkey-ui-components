import React, { FC, memo, useMemo } from 'react';
import { getServerContext } from "@labkey/api";
import { getHelpLink } from "../../util/helpLinks";
import { Container } from "../base/models/Container";
import { buildURL } from '../../url/AppURL';

interface ProductLKSDrawerProps {
    /**
     * List of projects which the current user has permissions to so we can use that to decide which container-item
     * options to show below.
     */
    projects: Container[];
}

export const ProductLKSDrawer: FC<ProductLKSDrawerProps> = memo(props => {
    const { projects } = props;
    const { project, container, homeContainer } = getServerContext();
    const showHome = useMemo(() => isProjectAvailable(projects, undefined, 'home'), [projects]);
    const showProject = useMemo(() => isProjectAvailable(projects, project.id) && project.name !== homeContainer && container.path !== '/home', [projects, project]);
    const showContainer = useMemo(() => project.id !== container.id, [projects, project]);

    return (
        <>
            {showHome && (
                <a className="container-item" href={getProjectBeginUrl(homeContainer)}>
                    <i className="fa fa-home container-icon" />
                    LabKey Home
                </a>
            )}
            {showProject && (
                <a className="container-item" href={getProjectBeginUrl(project.path)}>
                    <i className="fa fa-folder-open-o container-icon" />
                    {project.name}
                </a>
            )}
            {showContainer && (
                <a className="container-item" href={getProjectBeginUrl(container.path)}>
                    <i className="fa fa-folder-o container-icon" />
                    {container.title}
                </a>
            )}
            <div className="container-tabs">
                <div className="empty">
                    No tabs have been added to this folder.
                    <a className="how-to" href={getHelpLink('tabs')} target="_blank" rel="noopener noreferrer">
                        How to use tabs in LabKey
                    </a>
                </div>
            </div>
        </>
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
