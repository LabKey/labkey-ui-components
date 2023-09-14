import React, {FC, memo, Fragment } from "react";
import { WithDirtyCheckLink} from "../../util/RouteLeave";
import {Container} from "../base/models/Container";
import classNames from "classnames";
import {VerticalScrollPanel} from "../base/VeriticalScrollPanel";
import {SVGIcon} from "../base/SVGIcon";

interface Props {
    projects: Container[];
    selectedProject: Container;
    setSelectedProject: (c: Container) => void;
    getIsDirty: () => boolean;
    setIsDirty: (isDirty: boolean) => void;
    inheritedProjects?: string[];
}

export const ProjectListing: FC<Props> = memo(props => {
    const { projects, selectedProject, inheritedProjects, setSelectedProject, getIsDirty, setIsDirty } = props;

    const dividerInd = inheritedProjects?.length > 0 ? inheritedProjects.length : -1;
    return (
        <VerticalScrollPanel cls="col-md-3 col-xs-12" offset={210}>
            <div className="listing-content-title-medium">Projects</div>
            <ul className="project-listing-left">
                {projects?.map((project, ind) => {
                    const showInherited = inheritedProjects?.indexOf(project.name) > -1;
                    return (
                        <>
                            <Fragment key={project.id}>
                                <li
                                    className={classNames('menu-section-item', {
                                        active: project.id === selectedProject?.id
                                    })}
                                >
                                    <div className="row">
                                        <div className='col menu-folder-body'>
                                            <WithDirtyCheckLink
                                                className="menu-folder-item"
                                                onClick={() => setSelectedProject(project)}
                                                getIsDirty={getIsDirty}
                                                setIsDirty={setIsDirty}
                                            >
                                                {showInherited &&
                                                    <SVGIcon
                                                        iconSrc='inherited-arrow'
                                                        className="label-help-target"
                                                        alt="inherited"
                                                    />
                                                }
                                                <span>{project.name}</span>
                                            </WithDirtyCheckLink>
                                        </div>
                                    </div>
                                </li>
                            </Fragment>
                            {ind === dividerInd &&
                                <li><div className="row"><hr/></div></li>
                            }
                        </>
                    );
                })}
            </ul>
        </VerticalScrollPanel>
    )
});
