/*
 * Copyright (c) 2018-2022 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Button, Checkbox, Col, Panel, Row } from 'react-bootstrap';
import { List } from 'immutable';
import { Security } from '@labkey/api';

import { Alert, useServerContext, useAppContext, AppContext, resolveErrorMessage } from '../../..';

import { UserDetailsPanel } from '../user/UserDetailsPanel';

import { isProjectContainer } from '../../app/utils';

import { Principal, SecurityPolicy, SecurityRole } from './models';
import { PermissionsRole } from './PermissionsRole';
import { GroupDetailsPanel } from './GroupDetailsPanel';
import { InjectedPermissionsPage } from './withPermissionsPage';
import {constructGroupMembership, getGroupRows} from "../administration/actions";
import {GroupMembership} from "../administration/models";

// exported for testing
export interface PermissionAssignmentsProps extends InjectedPermissionsPage {
    containerId: string;
    /** UserId to disable to prevent removing assignments for that id */
    disabledId?: number;
    onChange: (policy: SecurityPolicy) => void;
    onSuccess: () => void;
    policy: SecurityPolicy;
    groupMembership: GroupMembership;
    /** Subset list of role uniqueNames to show in this component usage */
    rolesToShow?: List<string>;
    showDetailsPanel?: boolean;
    title?: string;
}

export const PermissionAssignments: FC<PermissionAssignmentsProps> = memo(props => {
    const {
        containerId,
        disabledId,
        error,
        groupMembership,
        inactiveUsersById,
        onChange,
        onSuccess,
        policy,
        principals,
        principalsById,
        roles,
        rolesByUniqueName,
        rolesToShow,
        showDetailsPanel = true,
        title = 'Security Roles and Assignments',
    } = props;
    const [dirty, setDirty] = useState<boolean>();
    const [inherited, setInherited] = useState<boolean>(() => policy.isInheritFromParent());
    const [rootPolicy, setRootPolicy] = useState<SecurityPolicy>();
    const [saveErrorMsg, setSaveErrorMsg] = useState<string>();
    const [selectedUserId, setSelectedUserId] = useState<number>();
    const [submitting, setSubmitting] = useState<boolean>(false);

    const { api } = useAppContext<AppContext>();
    const { container, project, user } = useServerContext();

    const selectedPrincipal = principalsById?.get(selectedUserId);

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
            setDirty(true);
        },
        [onChange, policy]
    );

    const onInheritChange = useCallback(() => {
        setDirty(true);
        setInherited(!inherited);
    }, [inherited]);

    const onSavePolicy = useCallback(() => {
        const wasInherited = policy.isInheritFromParent();

        // Policy remains inherited. Act as if it was a successful change.
        if (inherited && wasInherited) {
            onSuccess();
            setDirty(false);
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
                        onSuccess();
                        setSelectedUserId(undefined);
                        setDirty(false);
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
                        onSuccess();
                        setSelectedUserId(undefined);
                        setDirty(false);
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
    }, [containerId, inherited, onSuccess, policy]);

    const removeAssignment = useCallback(
        (userId: number, role: SecurityRole) => {
            onChange(SecurityPolicy.removeAssignment(policy, userId, role));
            setSelectedUserId(undefined);
            setDirty(true);
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
            disabled={submitting || !dirty}
            onClick={onSavePolicy}
        >
            Save
        </Button>
    );

    return (
        <Row>
            <Col xs={12} md={showDetailsPanel ? 8 : 12}>
                <Panel>
                    <Panel.Heading>{title}</Panel.Heading>
                    <Panel.Body className="permissions-assignment-panel">
                        {dirty && (
                            <div className="permissions-save-alert">
                                <Alert bsStyle="info">
                                    You have unsaved changes.
                                    {saveButton}
                                </Alert>
                            </div>
                        )}

                        {!dirty && inherited && (
                            <div className="permissions-save-alert">
                                <Alert bsStyle="info">
                                    Permissions for this container are being inherited from its parent.
                                </Alert>
                            </div>
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
                            />
                        ))}
                        <br />
                        {saveErrorMsg && <Alert>{saveErrorMsg}</Alert>}
                        {saveButton}
                    </Panel.Body>
                </Panel>
            </Col>
            {showDetailsPanel && (
                <Col xs={12} md={4}>
                    {selectedPrincipal?.type === 'g' ? (
                        <GroupDetailsPanel // flag--is this being used anywhere?
                            principal={selectedPrincipal}
                            policy={policy}
                            rolesByUniqueName={rolesByUniqueName}
                            members={groupMembership[selectedPrincipal?.userId].members}
                        />
                    ) : (
                        <UserDetailsPanel
                            userId={selectedUserId}
                            policy={policy}
                            rootPolicy={rootPolicy} // ToDo: delete unused prop
                            rolesByUniqueName={rolesByUniqueName}
                        />
                    )}
                </Col>
            )}
        </Row>
    );
});

PermissionAssignments.displayName = 'PermissionAssignments';
