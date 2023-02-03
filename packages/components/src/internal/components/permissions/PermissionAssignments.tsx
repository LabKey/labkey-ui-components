/*
 * Copyright (c) 2018-2022 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Button, Checkbox, Col, Row } from 'react-bootstrap';
import { List } from 'immutable';
import { Security } from '@labkey/api';

import { UserDetailsPanel } from '../user/UserDetailsPanel';

import { isProjectContainer } from '../../app/utils';

import { useServerContext } from '../base/ServerContext';

import { AppContext, useAppContext } from '../../AppContext';

import { resolveErrorMessage } from '../../util/messaging';
import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

import { Alert } from '../base/Alert';

import { GroupMembership, MemberType } from '../administration/models';

import { fetchGroupMembership } from '../administration/actions';

import { getLocation } from '../../util/URL';

import { Principal, SecurityPolicy, SecurityRole } from './models';
import { PermissionsRole } from './PermissionsRole';
import { GroupDetailsPanel } from './GroupDetailsPanel';
import { InjectedPermissionsPage } from './withPermissionsPage';

// exported for testing
export interface PermissionAssignmentsProps extends InjectedPermissionsPage, InjectedRouteLeaveProps {
    containerId: string;
    /** UserId to disable to prevent removing assignments for that id */
    disabledId?: number;
    onChange: (policy: SecurityPolicy) => void;
    onSuccess: () => void;
    policy: SecurityPolicy;
    /** Subset list of role uniqueNames to show in this component usage */
    rolesToShow?: List<string>;
    showDetailsPanel?: boolean;
    title?: string;
    /** Specific principal type (i.e. 'u' for users and 'g' for groups) to show in this component usage */
    typeToShow?: string;
}

export const PermissionAssignments: FC<PermissionAssignmentsProps> = memo(props => {
    const {
        containerId,
        disabledId,
        getIsDirty,
        inactiveUsersById,
        onChange,
        onSuccess,
        policy,
        principals,
        principalsById,
        roles,
        rolesByUniqueName,
        rolesToShow,
        setIsDirty,
        showDetailsPanel = true,
        title = 'Security Roles and Assignments',
    } = props;
    const [inherited, setInherited] = useState<boolean>(() => policy.isInheritFromParent());
    const [rootPolicy, setRootPolicy] = useState<SecurityPolicy>();
    const [saveErrorMsg, setSaveErrorMsg] = useState<string>();
    const [selectedUserId, setSelectedUserId] = useState<number>();
    const [groupMembership, setGroupMembership] = useState<GroupMembership>();
    const [error, setError] = useState<string>();
    const [submitting, setSubmitting] = useState<boolean>(false);

    const { api } = useAppContext<AppContext>();
    const { container, project, user } = useServerContext();

    const selectedPrincipal = principalsById?.get(selectedUserId);
    const initExpandedRole = getLocation().query?.get('expand')
        ? decodeURI(getLocation().query?.get('expand'))
        : undefined;

    const loadGroupMembership = useCallback(async () => {
        try {
            const groupMembershipState = await fetchGroupMembership(container, api.security);
            setGroupMembership(groupMembershipState);
        } catch (e) {
            setError(resolveErrorMessage(e) ?? 'Failed to load group membership data.');
        }
    }, [api.security, container]);

    useEffect(() => {
        (async () => {
            await loadGroupMembership();
        })();
    }, [loadGroupMembership]);

    useEffect(() => {
        if (containerId !== project.rootId && user.isRootAdmin) {
            (async () => {
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
            })();
        }
    }, [api.security, containerId, inactiveUsersById, principalsById, project, user]);

    const addAssignment = useCallback(
        (principal: Principal, role: SecurityRole) => {
            onChange(SecurityPolicy.addAssignment(policy, principal, role));
            setSelectedUserId(principal.userId);
            setIsDirty(true);
        },
        [onChange, policy]
    );

    const onInheritChange = useCallback(() => {
        setIsDirty(true);
        setInherited(!inherited);
    }, [inherited]);

    const _onSuccess = useCallback(() => {
        onSuccess();
        loadGroupMembership();
    }, [onSuccess, loadGroupMembership]);

    const onSavePolicy = useCallback(() => {
        const wasInherited = policy.isInheritFromParent();

        // Policy remains inherited. Act as if it was a successful change.
        if (inherited && wasInherited) {
            _onSuccess();
            setIsDirty(false);
            return;
        }

        setSubmitting(true);

        // Policy has been switched to inherited. Delete the current policy.
        if (inherited && !wasInherited) {
            Security.deletePolicy({
                containerPath: containerId,
                resourceId: policy.resourceId,
                success: response => {
                    if (response.success) {
                        _onSuccess();
                        setSelectedUserId(undefined);
                        setIsDirty(false);
                    } else {
                        setSaveErrorMsg(resolveErrorMessage(response) ?? 'Failed to inherit policy');
                    }

                    setSubmitting(false);
                },
                failure: response => {
                    setSaveErrorMsg(resolveErrorMessage(response) ?? 'Failed to inherit policy');
                    setSubmitting(false);
                },
            });
        } else {
            // Policy has been switched to un-inherited. Update policy assignments.
            const uninherited = !inherited && wasInherited;

            Security.savePolicy({
                containerPath: containerId,
                policy: {
                    policy: {
                        assignments: policy.assignments
                            .filter(a => !uninherited || policy.relevantRoles.contains(a.role))
                            .map(a => ({ role: a.role, userId: a.userId }))
                            .toArray(),
                        resourceId: uninherited ? containerId : policy.resourceId,
                    },
                },
                success: response => {
                    if (response.success) {
                        _onSuccess();
                        setSelectedUserId(undefined);
                        setIsDirty(false);
                    } else {
                        // TODO when this is used in LKS, need to support response.needsConfirmation
                        setSaveErrorMsg(response.message.replace('Are you sure that you want to continue?', ''));
                    }

                    setSubmitting(false);
                },
                failure: response => {
                    setSaveErrorMsg(resolveErrorMessage(response) ?? 'Failed to save policy');
                    setSubmitting(false);
                },
            });
        }
    }, [containerId, inherited, _onSuccess, policy]);

    const removeAssignment = useCallback(
        (userId: number, role: SecurityRole) => {
            onChange(SecurityPolicy.removeAssignment(policy, userId, role));
            setSelectedUserId(undefined);
            setIsDirty(true);
        },
        [onChange, policy]
    );

    const showDetails = useCallback((selectedUserId_: number) => {
        setSelectedUserId(selectedUserId_);
    }, []);

    if (error) {
        return <Alert>{error}</Alert>;
    }

    // use the explicit set of role uniqueNames from the rolesToShow prop, if provided.
    // fall back to show all of the relevant roles for the policy, if the rolesToShow prop is undefined
    const visibleRoles = SecurityRole.filter(roles, policy, rolesToShow);
    const isSubfolder = !isProjectContainer(container.path);

    const saveButton = (
        <Button
            className="pull-right alert-button permissions-assignment-save-btn"
            bsStyle="success"
            disabled={submitting || !getIsDirty()}
            onClick={onSavePolicy}
        >
            Save
        </Button>
    );

    return (
        <Row>
            <Col xs={12} md={showDetailsPanel ? 8 : 12}>
                <div className="panel panel-default">
                    <div className="panel-heading">{title}</div>
                    <div className="panel-body permissions-groups-assignment-panel permissions-assignment-panel">
                        {!getIsDirty() && inherited && (
                            <Alert bsStyle="info">
                                Permissions for this container are being inherited from its parent.
                            </Alert>
                        )}

                        {isSubfolder && (
                            <div>
                                <form>
                                    <Checkbox
                                        checked={inherited}
                                        className="permissions-assignment-inherit"
                                        onChange={onInheritChange}
                                    >
                                        Inherit permissions from parent
                                    </Checkbox>
                                </form>
                                <hr />
                            </div>
                        )}

                        {visibleRoles.map(role => (
                            <PermissionsRole
                                assignments={policy.assignmentsByRole.get(role.uniqueName)}
                                disabledId={disabledId}
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
                        <br />
                        {saveErrorMsg && <Alert>{saveErrorMsg}</Alert>}
                        {saveButton}
                    </div>
                </div>
            </Col>
            {showDetailsPanel && (
                <Col xs={12} md={4}>
                    {selectedPrincipal?.type === MemberType.group ? (
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
                        />
                    )}
                </Col>
            )}
        </Row>
    );
});

PermissionAssignments.displayName = 'PermissionAssignments';
