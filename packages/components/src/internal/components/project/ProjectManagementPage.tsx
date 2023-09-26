import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, MenuItem } from 'react-bootstrap';

import { Link } from 'react-router';

import { Security } from '@labkey/api';

import { useServerContext } from '../base/ServerContext';
import { AppURL, createProductUrl } from '../../url/AppURL';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { AUDIT_KEY } from '../../app/constants';
import { AUDIT_EVENT_TYPE_PARAM, PROJECT_AUDIT_QUERY } from '../auditlog/constants';
import { Alert } from '../base/Alert';
import { getLocation, removeParameters } from '../../util/URL';
import { AppContext, useAppContext } from '../../AppContext';
import { Container } from '../base/models/Container';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { InjectedRouteLeaveProps, withRouteLeave } from '../../util/RouteLeave';
import { getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';
import { VerticalScrollPanel } from '../base/VeriticalScrollPanel';

import { ProjectSettings } from './ProjectSettings';

import { ProjectListing } from './ProjectListing';

export const ProjectManagementPageImpl: FC<InjectedRouteLeaveProps> = memo(props => {
    const { getIsDirty, setIsDirty } = props;
    const [successMsg, setSuccessMsg] = useState<string>();
    const { user, moduleContext, container } = useServerContext();

    const { api } = useAppContext<AppContext>();

    const [reloadCounter, setReloadCounter] = useState<number>(0);
    const [projects, setProjects] = useState<Container[]>(undefined);
    const [selectedProject, setSelectedProject] = useState<Container>(undefined);
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
                    if (projects_.some(proj => proj.id === selectedProject.id))
                        // selected project is still present
                        return;
                }

                let defaultContainer = container?.isFolder ? container : projects_?.[0];
                const createdProjectName = getLocation().query?.get('created');
                if (createdProjectName) {
                    removeParameters(getLocation(), 'created');
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
        const successMessage = getLocation().query?.get('successMsg');
        if (successMessage) {
            setSuccessMsg(`${decodeURI(successMessage)} successfully deleted.`);
            removeParameters(getLocation(), 'successMsg');
        }
    }, []);

    const renderButtons = useMemo(
        () => () => (
            <>
                <Button
                    bsStyle="success"
                    className="button-right-spacing"
                    href={AppURL.create('admin', 'projects', 'new').toHref()}
                >
                    Create a Project
                </Button>
                <a href={AppURL.create(AUDIT_KEY).addParam(AUDIT_EVENT_TYPE_PARAM, PROJECT_AUDIT_QUERY.value).toHref()}>
                    View Audit History
                </a>
            </>
        ),
        []
    );

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
                    if (isDelete)
                        setSuccessMsg(`${selectedProject.name} successfully deleted.`);
                }
            }
        },
        [setIsDirty, selectedProject, container]
    );

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
                        <Link to={AppURL.create('admin', 'projects', 'new').toString()}>here</Link> to get started.
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

export const ProjectManagementPage = withRouteLeave(ProjectManagementPageImpl);
