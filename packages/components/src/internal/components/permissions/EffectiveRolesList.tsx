/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Map, List } from 'immutable';

import { SecurityAssignment, SecurityPolicy, SecurityRole } from './models';
import {Col, Row} from "react-bootstrap";

interface Props {
    policy?: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    rootPolicy?: SecurityPolicy;
    userId: number;
}

export class EffectiveRolesList extends React.PureComponent<Props, any> {
    render() {
        const { userId, policy, rootPolicy, rolesByUniqueName } = this.props;
        let assignments =
            policy && rolesByUniqueName
                ? policy.assignments.filter(assignment => assignment.userId === userId).toList()
                : List<SecurityAssignment>();

        if (rootPolicy && rolesByUniqueName) {
            assignments = assignments
                .concat(rootPolicy.assignments.filter(assignment => assignment.userId === userId))
                .toList();
        }

        if (assignments.size === 0) {
            return null;
        }

        return (
            <>
                <hr className="principal-hr" />
                <Row>
                    <Col xs={4} className="principal-detail-label">
                        Permissions
                    </Col>
                    <Col xs={8} className="principal-detail-value">
                        <ul className="principal-detail-ul">
                            {assignments.map(assignment => {
                                const role = rolesByUniqueName.get(assignment.role);
                                return (
                                    <li key={assignment.role} className="principal-detail-li">
                                        {role ? role.displayName : assignment.role}
                                    </li>
                                );
                            })}
                        </ul>
                    </Col>
                </Row>
            </>
        );
    }
}
