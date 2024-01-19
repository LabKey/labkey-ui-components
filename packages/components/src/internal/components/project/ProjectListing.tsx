import React, { FC, memo, Fragment, useCallback } from 'react';

import classNames from 'classnames';

import { CONFIRM_MESSAGE, InjectedRouteLeaveProps } from '../../util/RouteLeave';
import { Container } from '../base/models/Container';
import { VerticalScrollPanel } from '../base/VeriticalScrollPanel';
import { SVGIcon } from '../base/SVGIcon';
import { HOME_PATH, HOME_TITLE } from '../navigation/constants';

export interface WithDirtyCheckLinkProps {
    className?: string;
    leaveMsg?: string;
    onClick: () => void;
}

export const WithDirtyCheckLink: FC<WithDirtyCheckLinkProps & InjectedRouteLeaveProps> = props => {
    const { className, onClick, children, setIsDirty, getIsDirty, leaveMsg } = props;

    const handleOnClick = useCallback(() => {
        const dirty = getIsDirty();
        if (dirty) {
            const result = confirm(leaveMsg ?? CONFIRM_MESSAGE);
            if (!result) return;

            setIsDirty(false);
        }
        onClick();
    }, [setIsDirty, getIsDirty, onClick, leaveMsg]);

    return (
        <a className={className} onClick={handleOnClick}>
            {children}
        </a>
    );
};

interface Props {
    getIsDirty: () => boolean;
    inheritedProjects?: string[];
    projects: Container[];
    selectedProject: Container;
    setIsDirty: (isDirty: boolean) => void;
    setSelectedProject: (c: Container) => void;
}

export const ProjectListing: FC<Props> = memo(props => {
    const { projects, selectedProject, inheritedProjects, setSelectedProject, getIsDirty, setIsDirty } = props;

    const dividerInd = inheritedProjects?.length > 0 ? inheritedProjects.length + 1 : -1;
    return (
        <VerticalScrollPanel cls="col-md-3 col-xs-12" offset={210}>
            <div className="listing-content-title-medium">Projects</div>
            <ul className="project-listing-left">
                {projects?.map((project, ind) => {
                    const showInherited = inheritedProjects?.indexOf(project.name) > -1;
                    let projectTitle = project.path === HOME_PATH ? HOME_TITLE : project.title;
                    if (!projectTitle) projectTitle = project.name;
                    return (
                        <Fragment key={project.id}>
                            {ind === dividerInd && (
                                <li key={project.id + '_divider'}>
                                    <div className="row">
                                        <hr />
                                    </div>
                                </li>
                            )}
                            <li
                                key={project.id}
                                className={classNames('menu-section-item', {
                                    active: project.id === selectedProject?.id,
                                })}
                            >
                                <div className="row">
                                    <div className="col menu-folder-body">
                                        <WithDirtyCheckLink
                                            className="menu-folder-item"
                                            onClick={() => setSelectedProject(project)}
                                            getIsDirty={getIsDirty}
                                            setIsDirty={setIsDirty}
                                        >
                                            {showInherited && (
                                                <SVGIcon
                                                    iconSrc="inherited-arrow"
                                                    className="label-help-target"
                                                    alt="inherited"
                                                />
                                            )}
                                            <span>{projectTitle}</span>
                                        </WithDirtyCheckLink>
                                    </div>
                                </div>
                            </li>
                        </Fragment>
                    );
                })}
            </ul>
        </VerticalScrollPanel>
    );
});
