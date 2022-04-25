/*
 * Copyright (c) 2018-2022 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Button, Col, Panel, Row } from 'react-bootstrap';
import { List } from 'immutable';
import { Security } from '@labkey/api';

import { LoadingSpinner, Alert, useServerContext, useAppContext, AppContext } from '../../..';

import { UserDetailsPanel } from '../user/UserDetailsPanel';

import { PermissionsProviderProps, Principal, SecurityPolicy, SecurityRole } from './models';
import { PermissionsRole } from './PermissionsRole';
import { GroupDetailsPanel } from './GroupDetailsPanel';

// exported for testing
export interface PermissionAssignmentsProps extends PermissionsProviderProps {
    containerId: string;
    /** UserId to disable to prevent removing assignments for that id */
    disabledId?: number;
    title?: string;
    onChange: (policy: SecurityPolicy) => void;
    onSuccess: () => void;
    policy: SecurityPolicy;
    /** Subset list of role uniqueNames to show in this component usage */
    rolesToShow?: List<string>;
    showDetailsPanel?: boolean;
    /** Specific principal type (i.e. 'u' for users and 'g' for groups) to show in this component usage */
    typeToShow?: string;
}

export const PermissionAssignments: FC<PermissionAssignmentsProps> = memo(props => {
    const {
        containerId,
        disabledId,
        error,
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
        typeToShow,
    } = props;
    const [dirty, setDirty] = useState<boolean>();
    const [rootPolicy, setRootPolicy] = useState<SecurityPolicy>();
    const [saveErrorMsg, setSaveErrorMsg] = useState<number>();
    const [selectedUserId, setSelectedUserId] = useState<number>();
    const [submitting, setSubmitting] = useState<boolean>(false);

    const { api } = useAppContext<AppContext>();
    const { project, user } = useServerContext();

    const selectedPrincipal = principalsById?.get(selectedUserId);
    const isLoading = (!policy || !roles || !principals) && !error;
    const isEditable = policy && !policy.isInheritFromParent();

    useEffect(() => {
        if (containerId !== project.rootId && user.isRootAdmin) {
            (async () => {
                try {
                    const rootPolicy_ = await api.security.fetchPolicy(containerId, principalsById, inactiveUsersById);
                    setRootPolicy(rootPolicy_);
                } catch (e) {
                    // TODO: Handle error
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

    const onSavePolicy = useCallback(() => {
        setSubmitting(true);

        Security.savePolicy({
            containerPath: containerId,
            policy: { policy },
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
                setSaveErrorMsg(response.exception);
                setSubmitting(false);
            },
        });
    }, [containerId, onSuccess, policy]);

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

    if (isLoading) {
        return <LoadingSpinner />;
    } else if (error) {
        return <Alert>{error}</Alert>;
    }

    // use the explicit set of role uniqueNames from the rolesToShow prop, if provided.
    // fall back to show all of the relevant roles for the policy, if the rolesToShow prop is undefined
    const visibleRoles = SecurityRole.filter(roles, policy, rolesToShow);

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
                        {isEditable ? (
                            dirty && (
                                <div className="permissions-save-alert">
                                    <Alert bsStyle="info">
                                        You have unsaved changes.
                                        {saveButton}
                                    </Alert>
                                </div>
                            )
                        ) : (
                            <div className="permissions-save-alert">
                                <Alert bsStyle="info">
                                    Permissions for this container are being inherited from its parent.
                                </Alert>
                            </div>
                        )}
                        {visibleRoles.map(role => (
                            <PermissionsRole
                                assignments={policy.assignmentsByRole.get(role.uniqueName)}
                                disabledId={disabledId}
                                key={role.uniqueName}
                                onAddAssignment={isEditable ? addAssignment : undefined}
                                onClickAssignment={showDetails}
                                onRemoveAssignment={isEditable ? removeAssignment : undefined}
                                principals={principals}
                                role={role}
                                selectedUserId={selectedUserId}
                                typeToShow={typeToShow}
                            />
                        ))}
                        <br />
                        {saveErrorMsg && <Alert>{saveErrorMsg}</Alert>}
                        {isEditable && saveButton}
                    </Panel.Body>
                </Panel>
            </Col>
            {showDetailsPanel && (
                <Col xs={12} md={4}>
                    {selectedPrincipal?.type === 'g' ? (
                        <GroupDetailsPanel
                            principal={selectedPrincipal}
                            policy={policy}
                            rolesByUniqueName={rolesByUniqueName}
                        />
                    ) : (
                        <UserDetailsPanel
                            userId={selectedUserId}
                            policy={policy}
                            rootPolicy={rootPolicy}
                            rolesByUniqueName={rolesByUniqueName}
                        />
                    )}
                </Col>
            )}
        </Row>
    );
});

PermissionAssignments.displayName = 'PermissionAssignments';
