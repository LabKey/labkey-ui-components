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
    policy: SecurityPolicy
    onChange: (policy: SecurityPolicy) => any
    onSuccess: () => any
    rolesToShow?: List<string>
    typesToShow?: List<string>
}

interface State {
    selectedPrincipal: Principal
    dirty: boolean
    submitting: boolean
    saveErrorMsg: string
}

export class PermissionAssignments extends React.PureComponent<Props, State> {

    static defaultProps = {
        typesToShow: List<string>(['g', 'u'])
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
        this.setState(() => ({submitting: true}));

        Security.savePolicy({
            containerPath: LABKEY.container.id,
            policy: {policy: this.props.policy},
            success: (response) => {
                this.props.onSuccess();
                this.setState(() => ({selectedPrincipal: undefined, submitting: false, dirty: false}));
            },
            failure: (response) => {
                this.setState(() => ({saveErrorMsg: response.exception, submitting: false}));
            }
        });
    };

    render() {
        const { policy, rolesToShow, typesToShow, roles, rolesByUniqueName, principals, error } = this.props;
        const { selectedPrincipal, saveErrorMsg, submitting, dirty } = this.state;
        const isLoading = (!policy || !roles || !principals) && !error;

        if (isLoading) {
            return <LoadingSpinner/>
        }
        else if (error) {
            return <Alert>{error}</Alert>
        }

        // use the explicit set if passes as a prop, fall back to the relevant roles for the policy
        const visibleRoles = SecurityRole.filter(roles, policy, rolesToShow);

        return (
            <Row>
                <Col xs={12} md={8}>
                    <Panel>
                        <Panel.Heading>
                            Roles and Assignments
                        </Panel.Heading>
                        <Panel.Body className={'permissions-assignment-panel'}>
                            {visibleRoles.map((role, i) => {
                                return (
                                    <PermissionsRole
                                        key={i}
                                        role={role}
                                        assignments={policy.assignmentsByRole.get(role.uniqueName)}
                                        typesToShow={typesToShow}
                                        principals={principals}
                                        onClickAssignment={this.showDetails}
                                        onRemoveAssignment={this.removeAssignment}
                                        onAddAssignment={this.addAssignment}
                                        selected={selectedPrincipal}
                                    />
                                )
                            })}
                            <br/>
                            {saveErrorMsg && <Alert>{saveErrorMsg}</Alert>}
                            <Button
                                className={'pull-right'}
                                bsStyle={'success'}
                                disabled={submitting || !dirty}
                                onClick={this.onSavePolicy}
                            >
                                Save
                            </Button>
                        </Panel.Body>
                    </Panel>
                </Col>
                <Col xs={12} md={4}>
                    <PrincipalDetailsPanel
                        principal={selectedPrincipal}
                        policy={policy}
                        rolesByUniqueName={rolesByUniqueName}
                    />
                </Col>
            </Row>
        )
    }
}
