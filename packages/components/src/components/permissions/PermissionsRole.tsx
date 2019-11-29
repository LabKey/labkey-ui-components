/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react';
import { Col, Row } from "react-bootstrap";
import { List } from 'immutable'
import { Principal, SecurityAssignment, SecurityRole } from "./models";
import { RemovableButton } from "./RemovableButton";
import { AddRoleAssignmentInput } from "./AddRoleAssignmentInput";
import { ExpandableContainer } from "../ExpandableContainer";
import { naturalSort } from "../../util/utils";

interface Props {
    role: SecurityRole
    assignments: List<SecurityAssignment>
    typesToShow: List<string>
    principals: List<Principal>
    onAddAssignment: (principal: Principal, role: SecurityRole) => any
    onRemoveAssignment: (userId: number, role: SecurityRole) => any
    onClickAssignment: (userId: number) => any
    selected: Principal
}

export class PermissionsRole extends React.PureComponent<Props, any> {

    generateClause() {
        return (
            <div className="container-expandable-heading--clause">
                <span className={'permissions-title'}>{this.props.role.displayName}</span>
            </div>
        )
    }

    generateLinks() {
        const { assignments, typesToShow } = this.props;
        let count = 0;
        if (assignments && assignments.size > 0) {
            count = typesToShow.size === 1
                ? assignments.filter((assignment) => SecurityAssignment.isTypeMatch(assignment.type, typesToShow.get(0))).size
                : assignments.size;
        }

        return (
            <div>
                <span className="container-expandable-heading">
                    <span>
                        <a>{count} member{count !== 1 ? 's' : ''}</a>
                    </span>
                </span>
            </div>
        )
    }

    render() {
        const { role, assignments, typesToShow, onRemoveAssignment, onClickAssignment, onAddAssignment, principals, selected } = this.props;
        const existingAssignments = assignments && assignments.size > 0 ? assignments.map((assignment) => assignment.userId).toList() : List<number>();
        const principalsToAdd = Principal.filter(principals, typesToShow, existingAssignments);

        return (
            <ExpandableContainer
                clause={this.generateClause()}
                links={this.generateLinks()}
                iconFaCls={'users fa-3x'}
                isExpandable={true}
            >
                <div className={'permissions-role-container'}>
                    {role.description && <div>{role.description}</div>}
                    <Row className={'permissions-assignments-row'}>
                        {typesToShow.map((type) => {
                            const key = role.uniqueName + ':' + type;
                            const typeAssignments = assignments
                                ? assignments.filter((assignment) => SecurityAssignment.isTypeMatch(assignment.type, type)).toList()
                                : List<SecurityAssignment>();

                            return (
                                <Col xs={12} sm={(typesToShow.size > 1 ? 6 : 12)} key={key}>
                                    {typesToShow.size > 1 && <div>{type === 'g' ? 'Groups:' : 'Users:'}</div>}
                                    <ul className={'permissions-members-ul'}>
                                    {typeAssignments && typeAssignments.size > 0
                                        ? typeAssignments
                                            .sortBy((assignment) => assignment.displayName, naturalSort)
                                            .map((assignment) => {
                                            const key = role.uniqueName + ':' + assignment.userId;

                                            return (
                                                <li key={key} className={'permissions-member-li'}>
                                                    <RemovableButton
                                                        id={assignment.userId}
                                                        display={SecurityAssignment.getDisplayName(assignment)}
                                                        onClick={(userId: number) => onClickAssignment(userId)}
                                                        onRemove={(userId: number) => onRemoveAssignment(userId, role)}
                                                        bsStyle={selected && selected.userId === assignment.userId ? 'primary' : undefined}
                                                    />
                                                </li>
                                            )
                                        })
                                        : <li className={'permissions-member-li permissions-member-none'}>None</li>
                                    }
                                    </ul>
                                </Col>
                            )
                        })}
                    </Row>
                    <AddRoleAssignmentInput
                        role={role}
                        principals={principalsToAdd}
                        onSelect={(selected: Principal) => onAddAssignment(selected, role)}
                        placeholder={typesToShow.size === 1 && typesToShow.get(0) === 'u' ? 'Add member...' : undefined}
                    />
                </div>
            </ExpandableContainer>
        )
    }
}
