/*
 * Copyright (c) 2018-2022 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Checkbox, Col, Row } from 'react-bootstrap';
import { List } from 'immutable';
import { InjectedRouter } from 'react-router';
import { Security } from '@labkey/api';
import { FormButtons } from '../../FormButtons';

import { UserDetailsPanel } from '../user/UserDetailsPanel';

import {
    getProjectPath,
    isProjectContainer,
    isProductProjectsEnabled,
    userCanReadGroupDetails,
    isAppHomeFolder,
} from '../../app/utils';

import { useServerContext } from '../base/ServerContext';

import { AppContext, useAppContext } from '../../AppContext';

import { resolveErrorMessage } from '../../util/messaging';
import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

import { Alert } from '../base/Alert';

import { GroupMembership, MemberType } from '../administration/models';

import { fetchGroupMembership } from '../administration/actions';

import { getLocation } from '../../util/URL';

import { useContainerUser } from '../container/actions';

import { VerticalScrollPanel } from '../base/VeriticalScrollPanel';

import { ProjectListing } from '../project/ProjectListing';

import { Container } from '../base/models/Container';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { naturalSortByProperty } from '../../../public/sort';

import { Principal, SecurityPolicy, SecurityRole } from './models';
import { PermissionsRole } from './PermissionsRole';
import { GroupDetailsPanel } from './GroupDetailsPanel';
import { InjectedPermissionsPage } from './withPermissionsPage';

// exported for testing
export interface PermissionAssignmentsProps extends InjectedPermissionsPage, InjectedRouteLeaveProps {
    onSuccess: () => void;
    /** Subset list of role uniqueNames to show in this component usage */
    rolesToShow?: List<string>;
    rootRolesToShow?: List<string>;
    router?: InjectedRouter;
    setLastModified?: (modified: string) => void;
    setProjectCount?: (count: number) => void;
    /** Specific principal type (i.e. 'u' for users and 'g' for groups) to show in this component usage */
    typeToShow?: string;
}

const INVALID_PROJECT_ROLES = [
    'org.labkey.api.inventory.security.StorageDesignerRole'
];

export const PermissionAssignments: FC<PermissionAssignmentsProps> = memo(props => {
    const {
        getIsDirty,
        inactiveUsersById,
        onSuccess,
        principals,
        principalsById,
        roles,
        rolesByUniqueName,
        rolesToShow,
        setIsDirty,
        router,
        rootRolesToShow,
        setLastModified,
        setProjectCount,
    } = props;
    const [inherited, setInherited] = useState<boolean>(false);
    const [rootPolicy, setRootPolicy] = useState<SecurityPolicy>();
    const [saveErrorMsg, setSaveErrorMsg] = useState<string>();
    const [selectedUserId, setSelectedUserId] = useState<number>();
    const [groupMembership, setGroupMembership] = useState<GroupMembership>();
    const [error, setError] = useState<string>();
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [hasPolicyChange, setHasPolicyChange] = useState<boolean>(false);
    const [hasRootPolicyChange, setHasRootPolicyChange] = useState<boolean>(false);
    const [policy, setPolicy] = useState<SecurityPolicy>(undefined);

    const [projects, setProjects] = useState<Container[]>(undefined);
    const [appHomeContainer, setAppHomeContainer] = useState<Container>(undefined);
    const [selectedProject, setSelectedProject] = useState<Container>(undefined);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [inheritedProjects, setInheritedProjects] = useState<string[]>(undefined);

    const { api } = useAppContext<AppContext>();
    const { container, project, user, moduleContext } = useServerContext();

    const isAppHome = isAppHomeFolder(container, moduleContext);
    const homeFolderPath = isAppHome ? container.path : container.parentPath;

    const selectedPrincipal = principalsById?.get(selectedUserId);
    const initExpandedRole = getLocation().query?.get('expand')
        ? decodeURI(getLocation().query?.get('expand'))
        : undefined;

    const projectUser = useContainerUser(getProjectPath(container?.path));

    const loadGroupMembership = useCallback(async () => {
        // Issue 47641: since groups are defined at the project container level,
        // check permissions there before requesting group membership info
        if (!selectedProject || projectUser.error || !userCanReadGroupDetails(projectUser?.user)) return;

        try {
            const groupMembershipState = await fetchGroupMembership(selectedProject, api.security);
            setGroupMembership(groupMembershipState);
        } catch (e) {
            setError(resolveErrorMessage(e) ?? 'Failed to load group membership data.');
        }
    }, [api.security, selectedProject, projectUser.error, projectUser?.user]);

    useEffect(() => {
        (async () => {
            setLoaded(false);
            setError(undefined);

            if (user.isRootAdmin) {
                try {
                    const rootPolicy_ = await api.security.fetchPolicy(
                        project.rootId,
                        principalsById,
                        inactiveUsersById
                    );
                    setRootPolicy(rootPolicy_);
                } catch (e) {
                    setSaveErrorMsg(resolveErrorMessage(e) ?? 'Failed to load policy');
                }
            }

            if (!isProductProjectsEnabled(moduleContext)) {
                setSelectedProject(container);
                setLoaded(true);
                return;
            }

            try {
                let projects_ = await api.folder.getProjects(container, moduleContext, true, true, true);
                projects_ = projects_.filter(c => c.effectivePermissions.indexOf(Security.PermissionTypes.Admin) > -1);

                // if app home lack admin perm, don't show project list
                if (!isAppHomeFolder(projects_[0], moduleContext)) {
                    setProjectCount?.(1);
                    setProjects([container]);
                } else {
                    setProjectCount?.(projects_.length);
                    setAppHomeContainer(projects_[0]);
                    setProjects(projects_);

                    if (projects_?.length > 1) {
                        await loadContainerTree(projects_[0]);
                    }
                }

                const defaultContainer = container?.isFolder ? container : projects_?.[0];
                setSelectedProject(defaultContainer);
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            } finally {
                setLoaded(true);
            }
        })();
    }, [moduleContext]);

    const loadContainerTree = useCallback(
        async (homeContainer?: Container) => {
            if (!isProductProjectsEnabled(moduleContext)) return;

            const _inherited = await api.security.getInheritedProjects(homeContainer ?? appHomeContainer);

            setInheritedProjects(_inherited);
        },
        [projects, moduleContext, container, appHomeContainer]
    );

    const sortedProjects = useMemo(() => {
        if (!inheritedProjects || inheritedProjects.length === 0) return projects;

        if (!project || projects.length <= 2) return projects;

        const home = projects[0];
        const _inheritedProjects = [];
        const _nonInheritedProjects = [];
        projects.forEach((proj, ind) => {
            if (ind === 0) return;

            if (inheritedProjects.indexOf(proj.name) > -1) _inheritedProjects.push(proj);
            else _nonInheritedProjects.push(proj);
        });
        _inheritedProjects.sort(naturalSortByProperty('title'));
        _nonInheritedProjects.sort(naturalSortByProperty('title'));
        return [home, ..._inheritedProjects, ..._nonInheritedProjects];
    }, [projects, inheritedProjects]);

    const loadPolicy = useCallback(async () => {
        try {
            if (!selectedProject) return;
            const policy_ = await api.security.fetchPolicy(selectedProject.id, principalsById, inactiveUsersById);
            setPolicy(policy_);
            setInherited(policy_.isInheritFromParent());
            setLastModified?.(policy_.modified);
            await loadGroupMembership();
        } catch (e) {
            setError(resolveErrorMessage(e) ?? 'Failed to load security policy');
        }
    }, [selectedProject?.id, principalsById, inactiveUsersById, setLastModified, loadGroupMembership]);

    useEffect(() => {
        (async () => {
            if (!projectUser.isLoaded || !selectedProject) return;
            await loadPolicy();
        })();
    }, [loadPolicy, selectedProject, projectUser.isLoaded, setLastModified]);

    const _addAssignment = useCallback(
        (isRootPolicy: boolean, principal: Principal, role: SecurityRole) => {
            if (isRootPolicy) setRootPolicy(SecurityPolicy.addAssignment(rootPolicy, principal, role));
            else setPolicy(SecurityPolicy.addAssignment(policy, principal, role));
            setSelectedUserId(principal.userId);
            isRootPolicy ? setHasRootPolicyChange(true) : setHasPolicyChange(true);
            setIsDirty(true);
        },
        [policy, rootPolicy]
    );

    const addAssignment = useCallback(
        (principal: Principal, role: SecurityRole) => {
            _addAssignment(false, principal, role);
        },
        [_addAssignment]
    );

    const addRootAssignment = useCallback(
        (principal: Principal, role: SecurityRole) => {
            _addAssignment(true, principal, role);
        },
        [_addAssignment]
    );

    const onInheritChange = useCallback(() => {
        setIsDirty(true);
        setInherited(!inherited);
        setHasPolicyChange(true);
    }, [inherited]);

    const _onSuccess = useCallback(() => {
        onSuccess();
        loadGroupMembership();
    }, [onSuccess, loadGroupMembership]);

    const onCancel = useCallback(() => {
        setIsDirty(false);
        router.goBack();
    }, [router, setIsDirty]);

    const onSaveSuccess = useCallback(async () => {
        await loadPolicy();

        if (projects.length > 1) await loadContainerTree();
    }, [loadPolicy, projects]);

    const onSavePolicy = useCallback(async () => {
        const wasInherited = policy.isInheritFromParent();

        setSubmitting(true);

        if (hasRootPolicyChange) {
            try {
                const resp = await api.security.savePolicy(
                    {
                        policy: {
                            assignments: rootPolicy.assignments
                                .map(a => ({ role: a.role, userId: a.userId }))
                                .toArray(),
                            resourceId: project.rootId,
                        },
                    },
                    project.rootId
                );

                if (resp['success']) {
                    setHasRootPolicyChange(false);
                } else {
                    // TODO when this is used in LKS, need to support response.needsConfirmation
                    setSaveErrorMsg(resp['message'].replace('Are you sure that you want to continue?', ''));
                    return;
                }
            } catch (e) {
                setSaveErrorMsg(resolveErrorMessage(e) ?? 'Failed to save policy');
                setSubmitting(false);
            }
        }

        // Policy unchanged, or remains inherited. Act as if it was a successful change.
        if (!hasPolicyChange || (inherited && wasInherited)) {
            _onSuccess();
            setHasPolicyChange(false);
            setIsDirty(false);
            setSubmitting(false);
            return;
        }

        // Policy has been switched to inherited. Delete the current policy.
        if (inherited && !wasInherited) {
            try {
                const resp = await api.security.deletePolicy(policy.resourceId, selectedProject.path);

                if (!resp['success']) {
                    setSaveErrorMsg(resolveErrorMessage(resp) ?? 'Failed to inherit policy');
                    return;
                }
            } catch (e) {
                setSaveErrorMsg(resolveErrorMessage(e) ?? 'Failed to inherit policy');
                setSubmitting(false);
            }
        } else {
            // Policy has been switched to un-inherited. Update policy assignments.
            const uninherited = !inherited && wasInherited;

            try {
                const resp = await api.security.savePolicy(
                    {
                        policy: {
                            assignments: policy.assignments
                                .filter(a => !uninherited || policy.relevantRoles.contains(a.role))
                                .map(a => ({ role: a.role, userId: a.userId }))
                                .toArray(),
                            resourceId: uninherited ? selectedProject.id : policy.resourceId,
                        },
                    },
                    selectedProject.path
                );

                if (!resp['success']) {
                    setSaveErrorMsg(resp['message'].replace('Are you sure that you want to continue?', ''));
                    return;
                }
            } catch (e) {
                setSaveErrorMsg(resolveErrorMessage(e) ?? 'Failed to save policy');
            }
        }

        _onSuccess();
        onSaveSuccess();
        setSelectedUserId(undefined);
        setHasPolicyChange(false);
        setIsDirty(false);
        setSubmitting(false);
    }, [project, selectedProject, inherited, _onSuccess, policy, hasRootPolicyChange, hasPolicyChange]);

    const _removeAssignment = useCallback(
        (isRootPolicy: boolean, userId: number, role: SecurityRole) => {
            if (isRootPolicy) setRootPolicy(SecurityPolicy.removeAssignment(rootPolicy, userId, role));
            else setPolicy(SecurityPolicy.removeAssignment(policy, userId, role));
            setSelectedUserId(undefined);
            setIsDirty(true);
            isRootPolicy ? setHasRootPolicyChange(true) : setHasPolicyChange(true);
        },
        [policy, rootPolicy]
    );

    const removeAssignment = useCallback(
        (userId: number, role: SecurityRole) => {
            _removeAssignment(false, userId, role);
        },
        [_removeAssignment, policy, rootPolicy]
    );

    const removeRootAssignment = useCallback(
        (userId: number, role: SecurityRole) => {
            _removeAssignment(true, userId, role);
        },
        [policy, _removeAssignment, rootPolicy]
    );

    const showDetails = useCallback((selectedUserId_: number) => {
        setSelectedUserId(selectedUserId_);
    }, []);

    const handleSelectProject = useCallback((project: Container) => {
        setHasPolicyChange(false);
        setHasRootPolicyChange(false);
        setSelectedProject(project);
        setSelectedUserId(undefined);
    }, []);

    // use the explicit set of role uniqueNames from the rolesToShow prop, if provided.
    // fall back to show all the relevant roles for the policy, if the rolesToShow prop is undefined
    const visibleRoles = useMemo(() => {
        if (!policy) return null;
        let _rolesToShow = rolesToShow;
        if (!isAppHomeFolder(selectedProject, moduleContext))
            _rolesToShow = _rolesToShow.filter(value => INVALID_PROJECT_ROLES.indexOf(value) === -1).toList();
        return SecurityRole.filter(roles, policy, _rolesToShow);
    }, [policy, rolesToShow, selectedProject, moduleContext, roles]);

    const visibleRootRoles = useMemo(() => {
        if (!rootPolicy || !rootRolesToShow) return null;
        return SecurityRole.filter(roles, rootPolicy, rootRolesToShow);
    }, [roles, rootPolicy, rootRolesToShow]);

    const panelTitle = useMemo(() => {
        if (!isAppHomeFolder(selectedProject, moduleContext) && selectedProject)
            return selectedProject.name + ' Permissions';
        return 'Application Permissions';
    }, [selectedProject, moduleContext]);

    if (error) {
        return <Alert>{error}</Alert>;
    }

    if (!loaded || !policy) return <LoadingSpinner />;

    const isSubfolder = !isProjectContainer(selectedProject.path);
    const canInherit = project.rootId !== selectedProject.id;
    const projectsEnabled = isProductProjectsEnabled(moduleContext);

    const _panelContent = (
        <div className="panel panel-default">
            <div className="panel-heading">{panelTitle}</div>
            <div className="panel-body permissions-groups-assignment-panel permissions-assignment-panel">
                {isSubfolder && canInherit && (
                    <div>
                        <form>
                            <Checkbox
                                checked={inherited}
                                className="permissions-assignment-inherit"
                                onChange={onInheritChange}
                            >
                                Inherit permissions from the application
                            </Checkbox>
                        </form>
                        <hr />
                    </div>
                )}

                {!getIsDirty() && inherited && (
                    <Alert bsStyle="info">Permissions for this project are being inherited from the application.</Alert>
                )}

                {!inherited && (
                    <>
                        {user.isRootAdmin &&
                            isAppHomeFolder(selectedProject, moduleContext) &&
                            visibleRootRoles?.map(role => (
                                <PermissionsRole
                                    assignments={rootPolicy.assignmentsByRole.get(role.uniqueName)}
                                    disabledId={user.id}
                                    key={role.uniqueName}
                                    onAddAssignment={addRootAssignment}
                                    onClickAssignment={showDetails}
                                    onRemoveAssignment={removeRootAssignment}
                                    principals={principals}
                                    role={role}
                                    selectedUserId={selectedUserId}
                                    groupMembership={groupMembership} // needed?
                                    initExpanded={initExpandedRole === role.displayName}
                                />
                            ))}
                        {visibleRoles?.map(role => (
                            <PermissionsRole
                                assignments={policy.assignmentsByRole.get(role.uniqueName)}
                                key={role.uniqueName}
                                onAddAssignment={inherited ? undefined : addAssignment}
                                onClickAssignment={showDetails}
                                onRemoveAssignment={inherited ? undefined : removeAssignment}
                                principals={principals}
                                role={role}
                                selectedUserId={selectedUserId}
                                groupMembership={groupMembership}
                                initExpanded={initExpandedRole === role.displayName}
                            />
                        ))}
                    </>
                )}
                <br />
                {saveErrorMsg && <Alert>{saveErrorMsg}</Alert>}
            </div>
        </div>
    );

    return (
        <div className="permission-assignments-panel">
            {error && <Alert>{error}</Alert>}
            <Row>
                {(!isProductProjectsEnabled(moduleContext) || projects?.length <= 1) && <>{_panelContent}</>}
                {isProductProjectsEnabled(moduleContext) && projects?.length > 1 && (
                    <Col xs={12} md={8}>
                        <div className="side-panels-container">
                            <ProjectListing
                                projects={sortedProjects}
                                selectedProject={selectedProject}
                                setSelectedProject={handleSelectProject}
                                setIsDirty={setIsDirty}
                                getIsDirty={getIsDirty}
                                inheritedProjects={inheritedProjects}
                                homeFolderPath={homeFolderPath}
                            />
                            <VerticalScrollPanel
                                key={selectedProject?.id}
                                cls="merged-panels-container col-md-9 col-xs-12"
                                offset={210}
                            >
                                {_panelContent}
                            </VerticalScrollPanel>
                        </div>
                    </Col>
                )}
                <Col xs={12} md={4}>
                    {selectedPrincipal?.type === MemberType.group && groupMembership ? (
                        <GroupDetailsPanel
                            principal={selectedPrincipal}
                            policy={policy}
                            rolesByUniqueName={rolesByUniqueName}
                            members={groupMembership[selectedPrincipal?.userId].members}
                            isSiteGroup={groupMembership[selectedPrincipal?.userId]?.type === MemberType.siteGroup}
                            getAuditLogData={api.security.getAuditLogData}
                            showPermissionListLinks={false}
                        />
                    ) : (
                        <UserDetailsPanel
                            currentUser={user}
                            userId={selectedUserId}
                            policy={policy}
                            rootPolicy={rootPolicy}
                            rolesByUniqueName={rolesByUniqueName}
                            showPermissionListLinks={false}
                            showGroupListLinks={!projectsEnabled || !isSubfolder}
                        />
                    )}
                </Col>
            </Row>

            <FormButtons>
                {router && <button className="btn btn-default" onClick={onCancel} type="button">Cancel</button>}

                <button
                    className="pull-right alert-button permissions-assignment-save-btn btn btn-success"
                    disabled={submitting || !getIsDirty()}
                    onClick={onSavePolicy}
                    type="button"
                >
                    Save
                </button>
            </FormButtons>
        </div>
    );
});

PermissionAssignments.displayName = 'PermissionAssignments';
