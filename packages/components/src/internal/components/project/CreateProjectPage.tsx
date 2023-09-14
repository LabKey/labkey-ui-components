import React, { FC, memo, useCallback, useState } from 'react';
import { WithRouterProps } from 'react-router';
import { ActionURL } from '@labkey/api';

import { Page } from '../base/Page';
import { useServerContext, useServerContextDispatch } from '../base/ServerContext';
import { Alert } from '../base/Alert';
import { AppContext, useAppContext } from '../../AppContext';
import { FolderAPIWrapper, ProjectSettingsOptions } from '../container/FolderAPIWrapper';
import { resolveErrorMessage } from '../../util/messaging';
import { useNotificationsContext } from '../notifications/NotificationsContext';
import { Container } from '../base/models/Container';
import { AppURL } from '../../url/AppURL';

import {getCurrentAppProperties, hasProductProjects, isAppHomeFolder, setProductProjects} from '../../app/utils';

import { useFolderMenuContext } from '../navigation/hooks';

import { invalidateFullQueryDetailsCache } from '../../query/api';

import { useAdminAppContext } from '../administration/useAdminAppContext';

import { ProjectConfigurableDataType } from '../entities/models';

import { PageDetailHeader } from '../forms/PageDetailHeader';

import { ProjectNameSetting } from './ProjectNameSetting';
import { ProjectDataTypeSelections } from './ProjectDataTypeSelections';

const TITLE = 'Create New Project';

export interface CreateProjectContainerProps {
    api: FolderAPIWrapper;
    onCancel: () => void;
    onCreated: (project: Container) => void;
}

export const CreateProjectContainer: FC<CreateProjectContainerProps> = memo(props => {
    const { api, onCancel, onCreated } = props;
    const { projectDataTypes, ProjectFreezerSelectionComponent } = useAdminAppContext();

    const { moduleContext, container } = useServerContext();

    const [error, setError] = useState<string>();
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [dataTypeExclusion, setDataTypeExclusion] = useState<{ [key: string]: number[] }>({});

    const updateDataTypeExclusions = useCallback(
        (dataType: ProjectConfigurableDataType, exclusions: number[]) => {
            setDataTypeExclusion(prevState => {
                const uncheckedUpdates = { ...prevState };
                uncheckedUpdates[dataType] = exclusions;
                return uncheckedUpdates;
            });
        },
        [dataTypeExclusion]
    );

    const onSubmit = useCallback(
        async evt => {
            evt.preventDefault();
            evt.stopPropagation();
            setIsSaving(true);

            const formData = new FormData(evt.target);
            const options: ProjectSettingsOptions = {
                name: formData.get('name') as string,
                nameAsTitle: !!formData.get('nameAsTitle'),
                title: formData.get('title') as string,
                disabledSampleTypes: dataTypeExclusion?.['SampleType'],
                disabledDataClasses: dataTypeExclusion?.['DataClass'],
                disabledAssayDesigns: dataTypeExclusion?.['AssayDesign'],
                disabledStorageLocations: dataTypeExclusion?.['StorageLocation'],
            };

            const homeFolderPath = isAppHomeFolder(container, moduleContext)
                ? container.path
                : container.parentPath;

            let project: Container;
            try {
                project = await api.createProject(options, homeFolderPath);
            } catch (e) {
                setError(resolveErrorMessage(e));
                setIsSaving(false);
                return;
            }

            setIsSaving(false);
            onCreated(project);
        },
        [api, onCreated, dataTypeExclusion]
    );

    return (
        <div className="create-project-container">
            <form className="create-project-form" onSubmit={onSubmit}>
                {!!error && <Alert>{error}</Alert>}

                <div className="panel panel-default">
                    <div className="panel-heading">Name of Project</div>
                    <div className="panel-body">
                        <div className="form-horizontal">
                            <ProjectNameSetting autoFocus />

                            {/* Dummy submit button so browsers trigger onSubmit with enter key */}
                            <button type="submit" className="dummy-input" tabIndex={-1} />
                        </div>
                    </div>
                </div>
                <ProjectDataTypeSelections
                    entityDataTypes={projectDataTypes}
                    project={null}
                    updateDataTypeExclusions={updateDataTypeExclusions}
                />
                {ProjectFreezerSelectionComponent && (
                    <ProjectFreezerSelectionComponent updateDataTypeExclusions={updateDataTypeExclusions} />
                )}
                <div className="form-group no-margin-bottom">
                    <div className="pull-left">
                        <button className="project-cancel-button btn btn-default" onClick={onCancel} type="button">
                            Cancel
                        </button>
                    </div>
                    <div className="pull-right">
                        <span className="gridbar-button-spacer">
                            <button className="create-project-button btn btn-success" disabled={isSaving} type="submit">
                                {isSaving ? 'Creating Project' : 'Create Project'}
                            </button>
                        </span>
                    </div>
                </div>
            </form>
        </div>
    );
});

export const CreateProjectPage: FC<WithRouterProps> = memo(({ router }) => {
    const { api } = useAppContext<AppContext>();
    const { createNotification } = useNotificationsContext();
    const { moduleContext, user } = useServerContext();
    const { reload } = useFolderMenuContext();
    const dispatch = useServerContextDispatch();
    const hasProjects = hasProductProjects(moduleContext);

    const onCreated = useCallback(
        (project: Container) => {
            // Reroute user back to projects listing page
            router.replace(AppURL.create('admin', 'projects').addParam('created', project.name).toString());

            const appProps = getCurrentAppProperties();
            if (!appProps?.controllerName) return;
            const projectURL = ActionURL.buildURL(appProps.controllerName, 'app.view', project.path);
            const projectPermsURL = projectURL + AppURL.create('admin', 'permissions').toHref();

            createNotification({
                alertClass: 'warning',
                message: (
                    <span>
                        Project <a href={projectURL}>{project.title}</a> created. Only administrators can view this
                        project. <a href={projectPermsURL}>Update project permissions</a> for others to view.
                    </span>
                ),
            });

            // If this is the first project created then update the moduleContext
            if (!hasProjects) {
                dispatch({ moduleContext: setProductProjects(moduleContext, true) });

                // Invalidate caches due to moduleContext change
                invalidateFullQueryDetailsCache();
            }

            // Reload the folder menu to ensure the new project appears in the navigation for this session
            reload();
        },
        [createNotification, dispatch, hasProjects, moduleContext, reload, router]
    );

    return (
        <Page notAuthorized={!user.isAdmin} hasHeader title={TITLE}>
            <PageDetailHeader title={TITLE} />
            <CreateProjectContainer api={api.folder} onCancel={router.goBack} onCreated={onCreated} />
        </Page>
    );
});
