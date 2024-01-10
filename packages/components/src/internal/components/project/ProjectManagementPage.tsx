import React, { FC, memo, ReactNode, useCallback, useEffect, useState } from 'react';
import { Security } from '@labkey/api';
import { useSearchParams } from 'react-router-dom';

import { useAdministrationSubNav } from '../administration/useAdministrationSubNav';

import { useServerContext } from '../base/ServerContext';
import { AppURL, createProductUrl } from '../../url/AppURL';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { AUDIT_KEY } from '../../app/constants';
import { AUDIT_EVENT_TYPE_PARAM, PROJECT_AUDIT_QUERY } from '../auditlog/constants';
import { Alert } from '../base/Alert';
import { removeParameters } from '../../util/URL';
import { AppContext, useAppContext } from '../../AppContext';
import { Container } from '../base/models/Container';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { useRouteLeave } from '../../util/RouteLeave';
import { getAppHomeFolderPath, getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';
import { VerticalScrollPanel } from '../base/VeriticalScrollPanel';

import { useContainerUser } from '../container/actions';

import { ProjectSettings } from './ProjectSettings';

import { ProjectListing } from './ProjectListing';

export const ProjectManagementPage: FC = memo(() => {
    useAdministrationSubNav();
    const [searchParams, setSearchParams] = useSearchParams();
    const [getIsDirty, setIsDirty] = useRouteLeave();
    const [successMsg, setSuccessMsg] = useState<string>();
    const { user, moduleContext, container } = useServerContext();
    const homeFolderPath = getAppHomeFolderPath(container, moduleContext);
    const homeContainer = useContainerUser(homeFolderPath);
    const { api } = useAppContext<AppContext>();
    // TODO: get rid of reloadCounter, instead create a load callback for loading data, and call load when needed
    //  (on mount, on success) instead of incrementing the counter.
    const [reloadCounter, setReloadCounter] = useState<number>(0);
    const [projects, setProjects] = useState<Container[]>();
    const [selectedProject, setSelectedProject] = useState<Container>();
    const [error, setError] = useState<string>();
    const [loaded, setLoaded] = useState<boolean>(false);
    useEffect(() => {
        (async () => {
            setLoaded(false);
            setError(undefined);

            try {
                let projects_ = await api.folder.getProjects(container, moduleContext, true, true, false);
                projects_ = projects_.filter(c => c.effectivePermissions.indexOf(Security.PermissionTypes.Admin) > -1);
                setProjects(projects_);

                if (selectedProject) {
                    if (projects_.some(proj => proj.id === selectedProject.id)) {
                        // selected project is still present
                        return;
                    }
                }

                let defaultContainer = container?.isFolder ? container : projects_?.[0];
                const createdProjectName = searchParams.get('created');
                if (createdProjectName) {
                    removeParameters(setSearchParams, 'created');
                    const createdProject = projects_.find(proj => proj.name === createdProjectName);
                    if (createdProject) defaultContainer = createdProject;
                }

                setSelectedProject(defaultContainer);
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            } finally {
                setLoaded(true);
            }
        })();
    }, [reloadCounter]);

    useEffect(() => {
        const successMessage = searchParams.get('successMsg');
        if (successMessage) {
            setSuccessMsg(`${successMessage} successfully deleted.`);
            removeParameters(setSearchParams, 'successMsg');
        }
    }, []);

    const onError = useCallback((e: string) => {
        setError(e);
    }, []);

    const onSettingsChange = useCallback(() => {
        setIsDirty(true);
    }, [setIsDirty]);

    const onSettingsSuccess = useCallback(
        (dirty?: boolean, maybeReload?: boolean, isDelete?: boolean) => {
            setIsDirty(dirty);
            const isCurrentContainerSelected = selectedProject.id === container.id;
            if (maybeReload) {
                if (isCurrentContainerSelected) window.location.reload();
            } else {
                if (isCurrentContainerSelected && isDelete)
                    window.location.href = createProductUrl(
                        getPrimaryAppProperties()?.productId,
                        getCurrentAppProperties()?.productId,
                        AppURL.create('admin', 'projects').addParam('successMsg', selectedProject.name).toHref(),
                        container.parentPath
                    ).toString();
                else {
                    setReloadCounter(prevState => prevState + 1);
                    if (isDelete) setSuccessMsg(`${selectedProject.name} successfully deleted.`);
                }
            }
        },
        [setIsDirty, selectedProject, container]
    );

    const renderButtons = useCallback(() => {
        return (
            <>
                {homeContainer.user?.isAdmin && (
                    <a
                        className="button-right-spacing btn btn-success"
                        href={AppURL.create('admin', 'projects', 'new').toHref()}
                    >
                        Create a Project
                    </a>
                )}
                <a href={AppURL.create(AUDIT_KEY).addParam(AUDIT_EVENT_TYPE_PARAM, PROJECT_AUDIT_QUERY.value).toHref()}>
                    View Audit History
                </a>
            </>
        );
    }, [homeContainer.user]);

    return (
        <>
            {successMsg && (
                <Alert bsStyle="success" className="admin-settings-error">
                    {successMsg}
                </Alert>
            )}

            <BasePermissionsCheckPage
                hasPermission={user.isAdmin}
                renderButtons={renderButtons}
                title="Project Settings"
                user={user}
            >
                <Alert>{error}</Alert>
                {!loaded && !error && <LoadingSpinner />}
                {loaded && !error && projects?.length === 0 && (
                    <Alert bsStyle="warning">
                        No projects have been created. Click{' '}
                        <a href={AppURL.create('admin', 'projects', 'new').toHref()}>here</a> to get started.
                    </Alert>
                )}
                {projects?.length > 0 && (
                    <div className="side-panels-container">
                        <ProjectListing
                            projects={projects}
                            selectedProject={selectedProject}
                            setSelectedProject={setSelectedProject}
                            setIsDirty={setIsDirty}
                            getIsDirty={getIsDirty}
                        />
                        <VerticalScrollPanel cls="merged-panels-container col-md-9 col-xs-12" offset={210}>
                            {!!selectedProject && (
                                <ProjectSettings
                                    onChange={onSettingsChange}
                                    onSuccess={onSettingsSuccess}
                                    onPageError={onError}
                                    project={selectedProject}
                                    key={selectedProject?.id}
                                />
                            )}
                        </VerticalScrollPanel>
                    </div>
                )}
            </BasePermissionsCheckPage>
        </>
    );
});
