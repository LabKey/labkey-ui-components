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

import { getCurrentAppProperties, hasProductProjects, setProductProjects } from '../../app/utils';

import { useFolderMenuContext } from '../navigation/hooks';
import { IDNameSettings } from '../settings/NameIdSettings';

import { ProjectProperties } from './ProjectProperties';
import { invalidateFullQueryDetailsCache } from '../../query/api';

export interface CreateProjectContainerProps {
    api: FolderAPIWrapper;
    onCancel: () => void;
    onCreated: (project: Container) => void;
}

export const CreateProjectContainer: FC<CreateProjectContainerProps> = memo(props => {
    const { api, onCancel, onCreated } = props;
    const [error, setError] = useState<string>();
    const [isSaving, setIsSaving] = useState<boolean>(false);

    const onSubmit = useCallback(
        async evt => {
            evt.preventDefault();
            evt.stopPropagation();
            setIsSaving(true);

            const formData = new FormData(evt.target);
            const options: ProjectSettingsOptions = {
                allowUserSpecifiedNames: !!formData.get('allowUserSpecifiedNames'),
                name: formData.get('name') as string,
                nameAsTitle: !!formData.get('nameAsTitle'),
                prefix: formData.get('prefix') as string,
                title: formData.get('title') as string,
            };

            let project: Container;
            try {
                project = await api.createProject(options);
            } catch (e) {
                setError(resolveErrorMessage(e));
                setIsSaving(false);
                return;
            }

            setIsSaving(false);
            onCreated(project);
        },
        [api, onCreated]
    );

    return (
        <div className="create-project-container">
            <form className="create-project-form" onSubmit={onSubmit}>
                <div className="panel panel-default">
                    <div className="panel-body">
                        {!!error && <Alert>{error}</Alert>}

                        <div className="form-horizontal">
                            <div className="form-subtitle">Project Properties</div>

                            <ProjectProperties autoFocus />

                            <div className="form-subtitle">ID/Name Settings</div>

                            <IDNameSettings />

                            {/* Dummy submit button so browsers trigger onSubmit with enter key */}
                            <button type="submit" className="dummy-input" tabIndex={-1} />
                        </div>
                    </div>
                </div>

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
            router.replace(AppURL.create('admin', 'projects').toString());

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
        <Page notAuthorized={!user.isAdmin} hasHeader={false} title="Create Project">
            <CreateProjectContainer api={api.folder} onCancel={router.goBack} onCreated={onCreated} />
        </Page>
    );
});
