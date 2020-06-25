/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Button, Col, Panel, Row } from 'react-bootstrap';
import { List } from 'immutable';
import { getServerContext, Security } from '@labkey/api';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { Alert } from '../base/Alert';

import { UserDetailsPanel } from '../user/UserDetailsPanel';

import { PermissionsProviderProps, Principal, SecurityPolicy, SecurityRole } from './models';
import { PermissionsRole } from './PermissionsRole';
import { GroupDetailsPanel } from './GroupDetailsPanel';
import { fetchContainerSecurityPolicy } from "./actions";

interface Props extends PermissionsProviderProps {
    title?: string;
    containerId: string;
    policy: SecurityPolicy;
    onChange: (policy: SecurityPolicy) => any;
    onSuccess: () => any;
    rolesToShow?: List<string>; // a subset list of role uniqueNames to show in this component usage, see sampleManagement PermissionsPanel.tsx for example
    typeToShow?: string; // a specific principal type (i.e. 'u' for users and 'g' for groups) to show in this component usage, see sampleManagement PermissionsPanel.tsx for example
    showDetailsPanel?: boolean;
    disabledId?: number; // a userId to disable to prevent removing assignments for that id
}

interface State {
    selectedUserId: number;
    dirty: boolean;
    submitting: boolean;
    saveErrorMsg: string;
    rootPolicy: SecurityPolicy;
}

export class PermissionAssignments extends React.PureComponent<Props, State> {
    static defaultProps = {
        title: 'Security Roles and Assignments',
        showDetailsPanel: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            selectedUserId: undefined,
            dirty: false,
            submitting: false,
            saveErrorMsg: undefined,
            rootPolicy: undefined,
        };
    }

    componentDidMount(): void {
        const rootId = getServerContext().project.rootId;
        if (this.props.containerId !== rootId) {
            fetchContainerSecurityPolicy(rootId, this.props.principalsById, this.props.inactiveUsersById)
                .then((rootPolicy) => {
                    this.setState(() => ({ rootPolicy }));
                });
        }
    }

    addAssignment = (principal: Principal, role: SecurityRole) => {
        const { policy, onChange } = this.props;
        onChange(SecurityPolicy.addAssignment(policy, principal, role));
        this.setState(() => ({ selectedUserId: principal.userId, dirty: true }));
    };

    removeAssignment = (userId: number, role: SecurityRole) => {
        const { policy, onChange } = this.props;
        onChange(SecurityPolicy.removeAssignment(policy, userId, role));
        this.setState(() => ({ selectedUserId: undefined, dirty: true }));
    };

    showDetails = (selectedUserId: number) => {
        this.setState(() => ({ selectedUserId }));
    };

    onSavePolicy = () => {
        const { containerId, policy } = this.props;

        this.setState(() => ({ submitting: true }));

        Security.savePolicy({
            containerPath: containerId,
            policy: { policy },
            success: response => {
                if (response.success) {
                    this.props.onSuccess();
                    this.setState(() => ({ selectedUserId: undefined, submitting: false, dirty: false }));
                } else {
                    // TODO when this is used in LKS, need to support response.needsConfirmation
                    const message = response.message.replace('Are you sure that you want to continue?', '');
                    this.setState(() => ({ saveErrorMsg: message, submitting: false }));
                }
            },
            failure: response => {
                this.setState(() => ({ saveErrorMsg: response.exception, submitting: false }));
            },
        });
    };

    renderSaveButton() {
        const { submitting, dirty } = this.state;

        return (
            <Button
                className="pull-right"
                bsStyle="success"
                disabled={submitting || !dirty}
                onClick={this.onSavePolicy}
            >
                Save
            </Button>
        );
    }

    render() {
        const {
            title,
            policy,
            rolesToShow,
            typeToShow,
            roles,
            rolesByUniqueName,
            principals,
            error,
            showDetailsPanel,
            disabledId,
            principalsById,
        } = this.props;
        const { selectedUserId, saveErrorMsg, dirty, rootPolicy } = this.state;
        const selectedPrincipal = principalsById ? principalsById.get(selectedUserId) : undefined;
        const isLoading = (!policy || !roles || !principals) && !error;
        const isEditable = policy && !policy.isInheritFromParent();

        if (isLoading) {
            return <LoadingSpinner />;
        } else if (error) {
            return <Alert>{error}</Alert>;
        }

        // use the explicit set of role uniqueNames from the rolesToShow prop, if provided.
        // fall back to show all of the relevant roles for the policy, if the rolesToShow prop is undefined
        const visibleRoles = SecurityRole.filter(roles, policy, rolesToShow);

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
                                            {this.renderSaveButton()}
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
                            {visibleRoles.map((role, i) => {
                                return (
                                    <PermissionsRole
                                        key={i}
                                        role={role}
                                        assignments={policy.assignmentsByRole.get(role.uniqueName)}
                                        typeToShow={typeToShow}
                                        principals={principals}
                                        onClickAssignment={this.showDetails}
                                        onRemoveAssignment={isEditable ? this.removeAssignment : undefined}
                                        onAddAssignment={isEditable ? this.addAssignment : undefined}
                                        selectedUserId={selectedUserId}
                                        disabledId={disabledId}
                                    />
                                );
                            })}
                            <br />
                            {saveErrorMsg && <Alert>{saveErrorMsg}</Alert>}
                            {isEditable && this.renderSaveButton()}
                        </Panel.Body>
                    </Panel>
                </Col>
                {showDetailsPanel && (
                    <Col xs={12} md={4}>
                        {selectedPrincipal && selectedPrincipal.type === 'g' ? (
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
    }
}
