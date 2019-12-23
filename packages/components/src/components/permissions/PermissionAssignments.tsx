/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react';
import { Button, Col, Panel, Row } from "react-bootstrap";
import { List } from 'immutable'
import { Security } from '@labkey/api'
import { PermissionsProviderProps, Principal, SecurityPolicy, SecurityRole } from "./models";
import { PermissionsRole } from "./PermissionsRole";
import { PrincipalDetailsPanel } from "./PrincipalDetailsPanel";
import { LoadingSpinner } from "../../components/base/LoadingSpinner";
import { Alert } from "../../components/base/Alert";

interface Props extends PermissionsProviderProps {
    title?: string
    containerPath: string
    policy: SecurityPolicy
    onChange: (policy: SecurityPolicy) => any
    onSuccess: () => any
    rolesToShow?: List<string> // a subset list of role uniqueNames to show in this component usage, see sampleManagement PermissionsPanel.tsx for example
    typeToShow?: string // a specific principal type (i.e. 'u' for users and 'g' for groups) to show in this component usage, see sampleManagement PermissionsPanel.tsx for example
    showDetailsPanel?: boolean
    disabledId?: number // a userId to disable to prevent removing assignments for that id
}

interface State {
    selectedPrincipal: Principal
    dirty: boolean
    submitting: boolean
    saveErrorMsg: string
}

export class PermissionAssignments extends React.PureComponent<Props, State> {

    static defaultProps = {
        title: 'Security roles and assignments',
        showDetailsPanel: true
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            selectedPrincipal: undefined,
            dirty: false,
            submitting: false,
            saveErrorMsg: undefined
        };
    }

    addAssignment = (principal: Principal, role: SecurityRole) => {
        const { policy, onChange } = this.props;
        onChange(SecurityPolicy.addAssignment(policy, principal, role));
        this.setState(() => ({selectedPrincipal: principal, dirty: true}));
    };

    removeAssignment = (userId: number, role: SecurityRole) => {
        const { policy, onChange } = this.props;
        onChange(SecurityPolicy.removeAssignment(policy, userId, role));
        this.setState(() => ({selectedPrincipal: undefined, dirty: true}))
    };

    showDetails = (selectedUserId: number) => {
        this.setState(() => ({selectedPrincipal: this.props.principalsById.get(selectedUserId)}));
    };

    onSavePolicy = () => {
        const { containerPath, policy} = this.props;

        this.setState(() => ({submitting: true}));

        Security.savePolicy({
            containerPath: containerPath,
            policy: {policy},
            success: (response) => {
                if (response.success) {
                    this.props.onSuccess();
                    this.setState(() => ({selectedPrincipal: undefined, submitting: false, dirty: false}));
                }
                else {
                    // TODO when this is used in LKS, need to support response.needsConfirmation
                    const message = response.message.replace('Are you sure that you want to continue?', '');
                    this.setState(() => ({saveErrorMsg: message, submitting: false}));
                }
            },
            failure: (response) => {
                this.setState(() => ({saveErrorMsg: response.exception, submitting: false}));
            }
        });
    };

    renderSaveButton() {
        const { submitting, dirty } = this.state;

        return (
            <Button
                className={'pull-right'}
                bsStyle={'success'}
                disabled={submitting || !dirty}
                onClick={this.onSavePolicy}
            >
                Save
            </Button>
        )
    }

    render() {
        const { title, policy, rolesToShow, typeToShow, roles, rolesByUniqueName, principals, error, showDetailsPanel, disabledId } = this.props;
        const { selectedPrincipal, saveErrorMsg, submitting, dirty } = this.state;
        const isLoading = (!policy || !roles || !principals) && !error;

        if (isLoading) {
            return <LoadingSpinner/>
        }
        else if (error) {
            return <Alert>{error}</Alert>
        }

        // use the explicit set of role uniqueNames from the rolesToShow prop, if provided.
        // fall back to show all of the relevant roles for the policy, if the rolesToShow prop is undefined
        const visibleRoles = SecurityRole.filter(roles, policy, rolesToShow);

        return (
            <Row>
                <Col xs={12} md={showDetailsPanel ? 8 : 12}>
                    <Panel>
                        <Panel.Heading>
                            {title}
                        </Panel.Heading>
                        <Panel.Body className={'permissions-assignment-panel'}>
                            {dirty && <div className={'permissions-save-alert'}>
                                <Alert bsStyle={'info'}>
                                    You have unsaved changes.
                                    {this.renderSaveButton()}
                                </Alert>
                            </div>}
                            {visibleRoles.map((role, i) => {
                                return (
                                    <PermissionsRole
                                        key={i}
                                        role={role}
                                        assignments={policy.assignmentsByRole.get(role.uniqueName)}
                                        typeToShow={typeToShow}
                                        principals={principals}
                                        onClickAssignment={this.showDetails}
                                        onRemoveAssignment={this.removeAssignment}
                                        onAddAssignment={this.addAssignment}
                                        selected={selectedPrincipal}
                                        disabledId={disabledId}
                                    />
                                )
                            })}
                            <br/>
                            {saveErrorMsg && <Alert>{saveErrorMsg}</Alert>}
                            {this.renderSaveButton()}
                        </Panel.Body>
                    </Panel>
                </Col>
                {showDetailsPanel && <Col xs={12} md={4}>
                    <PrincipalDetailsPanel
                        principal={selectedPrincipal}
                        policy={policy}
                        rolesByUniqueName={rolesByUniqueName}
                    />
                </Col>}
            </Row>
        )
    }
}
