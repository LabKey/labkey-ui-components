import React, { FC, memo, useCallback, useState } from 'react';
import { ActionURL } from '@labkey/api';
import { useNavigate } from 'react-router-dom';

import { FormButtons } from '../../FormButtons';

import { Page } from '../base/Page';
import { useServerContext, useServerContextDispatch } from '../base/ServerContext';
import { Alert } from '../base/Alert';
import { AppContext, useAppContext } from '../../AppContext';
import { FolderAPIWrapper, ProjectSettingsOptions } from '../container/FolderAPIWrapper';
import { resolveErrorMessage } from '../../util/messaging';
import { useNotificationsContext } from '../notifications/NotificationsContext';
import { Container } from '../base/models/Container';
import { AppURL } from '../../url/AppURL';

import { getAppHomeFolderPath, getCurrentAppProperties, hasProductProjects, setProductProjects } from '../../app/utils';

import { useFolderMenuContext } from '../navigation/hooks';

import { invalidateFullQueryDetailsCache } from '../../query/api';

import { useAdminAppContext } from '../administration/useAdminAppContext';

import { ProjectConfigurableDataType } from '../entities/models';

import { PageDetailHeader } from '../forms/PageDetailHeader';

import { useContainerUser } from '../container/actions';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { ProjectNameSetting } from './ProjectNameSetting';
import { ProjectDataTypeSelections } from './ProjectDataTypeSelections';
import { useRouteLeave } from '../../util/RouteLeave';

const TITLE = 'Create New Project';

export interface CreateProjectContainerProps {
    api: FolderAPIWrapper;
    onCancel: () => void;
    onCreated: (project: Container) => void;
}

export const CreateProjectContainer: FC<CreateProjectContainerProps> = memo(props => {
    const { api, onCancel, onCreated } = props;
    const { projectDataTypes, sampleTypeDataType, ProjectFreezerSelectionComponent } = useAdminAppContext();

    const { moduleContext, container } = useServerContext();
    const [hasValidName, setHasValidName] = useState<boolean>(false);
    const [error, setError] = useState<string>();
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [dataTypeExclusion, setDataTypeExclusion] = useState<{ [key: string]: number[] }>({});
    const [getIsDirty, setIsDirty] = useRouteLeave();

    const updateDataTypeExclusions = useCallback((dataType: ProjectConfigurableDataType, exclusions: number[]) => {
        setDataTypeExclusion(prevState => {
            const uncheckedUpdates = { ...prevState };
            uncheckedUpdates[dataType] = exclusions;
            return uncheckedUpdates;
        });
    }, []);

    const onNameChange = useCallback((name: string) => {
        setHasValidName(name?.trim().length > 0);
    }, []);

    const _onCancel = useCallback(() => {
        setIsDirty(false);
        onCancel();
    }, [onCancel]);

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
                disabledDashboardSampleTypes: dataTypeExclusion?.['DashboardSampleType'],
                disabledDataClasses: dataTypeExclusion?.['DataClass'],
                disabledAssayDesigns: dataTypeExclusion?.['AssayDesign'],
                disabledStorageLocations: dataTypeExclusion?.['StorageLocation'],
            };

            const homeFolderPath = getAppHomeFolderPath(container, moduleContext);

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
        [dataTypeExclusion, container, moduleContext, onCreated, api]
    );

    return (
        <div className="create-project-container">
            <form className="create-project-form" onSubmit={onSubmit}>
                {!!error && <Alert>{error}</Alert>}

                <div className="panel panel-default">
                    <div className="panel-heading">Name of Project</div>
                    <div className="panel-body">
                        <div className="form-horizontal">
                            <ProjectNameSetting
                                autoFocus
                                setIsDirty={setIsDirty}
                                getIsDirty={getIsDirty}
                                onChange={onNameChange}
                            />

                            {/* Dummy submit button so browsers trigger onSubmit with enter key */}
                            <button type="submit" className="dummy-input" tabIndex={-1} />
                        </div>
                    </div>
                </div>
                <ProjectDataTypeSelections
                    entityDataTypes={projectDataTypes}
                    project={null}
                    updateDataTypeExclusions={updateDataTypeExclusions}
                    setIsDirty={setIsDirty}
                    getIsDirty={getIsDirty}
                />
                {sampleTypeDataType && (
                    <ProjectDataTypeSelections
                        panelTitle="Dashboard"
                        panelDescription="Select the data types to include in the Dashboard Insights graphs."
                        dataTypePrefix="Dashboard"
                        entityDataTypes={[sampleTypeDataType]}
                        project={null}
                        showUncheckedWarning={false}
                        updateDataTypeExclusions={updateDataTypeExclusions}
                        setIsDirty={setIsDirty}
                        getIsDirty={getIsDirty}
                    />
                )}
                {ProjectFreezerSelectionComponent && (
                    <ProjectFreezerSelectionComponent
                        updateDataTypeExclusions={updateDataTypeExclusions}
                        getIsDirty={getIsDirty}
                        setIsDirty={setIsDirty}
                    />
                )}
                <FormButtons>
                    <button className="project-cancel-button btn btn-default" onClick={_onCancel} type="button">
                        Cancel
                    </button>
                    <button
                        className="create-project-button btn btn-success"
                        disabled={isSaving || !hasValidName}
                        type="submit"
                    >
                        {isSaving ? 'Creating Project' : 'Create Project'}
                    </button>
                </FormButtons>
            </form>
        </div>
    );
});

export const CreateProjectPage = memo(() => {
    const navigate = useNavigate();
    const { api } = useAppContext<AppContext>();
    const { createNotification } = useNotificationsContext();
    const { moduleContext, container } = useServerContext();
    const homeFolderPath = getAppHomeFolderPath(container, moduleContext);
    const homeContainer = useContainerUser(homeFolderPath);
    const { reload } = useFolderMenuContext();
    const dispatch = useServerContextDispatch();
    const hasProjects = hasProductProjects(moduleContext);
    const onCancel = useCallback(() => navigate(-1), [navigate]);
    const notAuthorized = homeContainer.user && !homeContainer.user?.isAdmin;

    const onCreated = useCallback(
        (project: Container) => {
            // Reroute user back to projects listing page
            const url = AppURL.create('admin', 'projects').addParam('created', project.name);
            navigate(url.toString(), { replace: true });

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
        [createNotification, dispatch, hasProjects, moduleContext, navigate, reload]
    );

    return (
        <Page notAuthorized={notAuthorized} hasHeader title={TITLE}>
            <PageDetailHeader title={TITLE} />
            {!homeContainer.isLoaded && <LoadingSpinner />}
            {homeContainer.isLoaded && (
                <CreateProjectContainer api={api.folder} onCancel={onCancel} onCreated={onCreated} />
            )}
        </Page>
    );
});
