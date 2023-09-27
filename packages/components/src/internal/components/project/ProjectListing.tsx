import React, { FC, memo, Fragment } from 'react';

import classNames from 'classnames';

import { WithDirtyCheckLink } from '../../util/RouteLeave';
import { Container } from '../base/models/Container';
import { VerticalScrollPanel } from '../base/VeriticalScrollPanel';
import { SVGIcon } from '../base/SVGIcon';

interface Props {
    getIsDirty: () => boolean;
    inheritedProjects?: string[];
    projects: Container[];
    selectedProject: Container;
    setIsDirty: (isDirty: boolean) => void;
    setSelectedProject: (c: Container) => void;
    homeFolderPath?: string;
}

export const ProjectListing: FC<Props> = memo(props => {
    const { homeFolderPath, projects, selectedProject, inheritedProjects, setSelectedProject, getIsDirty, setIsDirty } =
        props;

    const dividerInd = inheritedProjects?.length > 0 ? inheritedProjects.length + 1 : -1;
    return (
        <VerticalScrollPanel cls="col-md-3 col-xs-12" offset={210}>
            <div className="listing-content-title-medium">Projects</div>
            <ul className="project-listing-left">
                {projects?.map((project, ind) => {
                    const showInherited = inheritedProjects?.indexOf(project.name) > -1;
                    let projectTitle = project.path === homeFolderPath ? 'Application' : project.title;
                    if (!projectTitle) projectTitle = project.name;
                    return (
                        <>
                            {ind === dividerInd && (
                                <li>
                                    <div className="row">
                                        <hr />
                                    </div>
                                </li>
                            )}
                            <Fragment key={project.id}>
                                <li
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
                        </>
                    );
                })}
            </ul>
        </VerticalScrollPanel>
    );
});
