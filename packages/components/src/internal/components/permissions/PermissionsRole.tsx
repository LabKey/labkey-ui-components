/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { List } from 'immutable';

import { ExpandableContainer } from '../ExpandableContainer';

import { naturalSort } from '../../util/utils';

import { Principal, SecurityAssignment, SecurityRole } from './models';
import { RemovableButton } from './RemovableButton';
import { AddRoleAssignmentInput } from './AddRoleAssignmentInput';

interface Props {
    role: SecurityRole;
    assignments: List<SecurityAssignment>;
    typeToShow: string;
    principals: List<Principal>;
    onAddAssignment?: (principal: Principal, role: SecurityRole) => any;
    onRemoveAssignment?: (userId: number, role: SecurityRole) => any;
    onClickAssignment: (userId: number) => any;
    selectedUserId: number;
    disabledId?: number;
    initExpanded?: boolean;
}

export class PermissionsRole extends React.PureComponent<Props, any> {
    generateClause() {
        return (
            <div className="container-expandable-heading--clause">
                <span className="permissions-title">{this.props.role.displayName}</span>
            </div>
        );
    }

    generateLinks() {
        const { assignments, typeToShow } = this.props;
        let count = 0;
        if (assignments && assignments.size > 0) {
            // if we are only showing one principal type, filter the count to just those assignments
            count = typeToShow
                ? assignments.filter(assignment => SecurityAssignment.isTypeMatch(assignment.type, typeToShow)).size
                : assignments.size;
        }

        return (
            <div>
                <span className="container-expandable-heading">
                    <span>
                        {count} member{count !== 1 ? 's' : ''}
                    </span>
                </span>
            </div>
        );
    }

    getTypesToShow(): List<string> {
        if (this.props.typeToShow) {
            return List<string>([this.props.typeToShow]);
        }

        return List<string>(['g', 'u']);
    }

    render() {
        const {
            role,
            assignments,
            typeToShow,
            onRemoveAssignment,
            onClickAssignment,
            onAddAssignment,
            principals,
            selectedUserId,
            disabledId,
            initExpanded,
        } = this.props;
        const existingAssignments =
            assignments && assignments.size > 0
                ? assignments.map(assignment => assignment.userId).toList()
                : List<number>();
        const principalsToAdd = Principal.filterAndSort(principals, typeToShow, existingAssignments);
        const showOneType = typeToShow !== undefined;

        return (
            <ExpandableContainer
                clause={this.generateClause()}
                links={this.generateLinks()}
                iconFaCls="users fa-3x"
                iconClickOnly={true}
                isExpandable={true}
                initExpanded={initExpanded}
            >
                <div className="permissions-role-container">
                    {role.description && <div>{role.description}</div>}
                    <Row className="permissions-assignments-row">
                        {this.getTypesToShow().map(type => {
                            const key = role.uniqueName + ':' + type;
                            const typeAssignments = assignments
                                ? assignments
                                      .filter(assignment => SecurityAssignment.isTypeMatch(assignment.type, type))
                                      .toList()
                                : List<SecurityAssignment>();

                            return (
                                <Col xs={12} sm={showOneType ? 12 : 6} key={key}>
                                    {!showOneType && <div>{type === 'g' ? 'Groups:' : 'Users:'}</div>}
                                    <ul className="permissions-members-ul">
                                        {typeAssignments && typeAssignments.size > 0 ? (
                                            typeAssignments
                                                .sortBy(assignment => assignment.displayName, naturalSort)
                                                .map(assignment => {
                                                    const key = role.uniqueName + ':' + assignment.userId;
                                                    const disabledMsg =
                                                        !assignment.isNew && assignment.userId === disabledId
                                                            ? 'You are not allowed to remove yourself from this role.'
                                                            : undefined;

                                                    return (
                                                        <li key={key} className="permissions-member-li">
                                                            <RemovableButton
                                                                id={assignment.userId}
                                                                display={SecurityAssignment.getDisplayName(assignment)}
                                                                onClick={(userId: number) => onClickAssignment(userId)}
                                                                onRemove={
                                                                    onRemoveAssignment
                                                                        ? (userId: number) =>
                                                                              onRemoveAssignment(userId, role)
                                                                        : undefined
                                                                }
                                                                bsStyle={
                                                                    selectedUserId === assignment.userId
                                                                        ? 'primary'
                                                                        : undefined
                                                                }
                                                                added={assignment.isNew}
                                                                disabledMsg={disabledMsg}
                                                            />
                                                        </li>
                                                    );
                                                })
                                        ) : (
                                            <li className="permissions-member-li permissions-member-none">None</li>
                                        )}
                                    </ul>
                                </Col>
                            );
                        })}
                    </Row>
                    {onAddAssignment && (
                        <AddRoleAssignmentInput
                            role={role}
                            principals={principalsToAdd}
                            onSelect={(selected: Principal) => onAddAssignment(selected, role)}
                            placeholder={typeToShow === 'u' ? 'Add member...' : undefined}
                        />
                    )}
                </div>
            </ExpandableContainer>
        );
    }
}
