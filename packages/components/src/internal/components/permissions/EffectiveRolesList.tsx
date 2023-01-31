/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Map, List } from 'immutable';

import { SecurityAssignment, SecurityPolicy, SecurityRole } from './models';
import {Col, Row} from "react-bootstrap";
import {User} from "../base/models/User";
import {AppURL} from "../../url/AppURL";

interface Props {
    currentUser: User;
    policy?: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    rootPolicy?: SecurityPolicy;
    showLinks?: boolean;
    userId: number;
}

export class EffectiveRolesList extends React.PureComponent<Props> {
    render() {
        const { userId, policy, rootPolicy, rolesByUniqueName, currentUser, showLinks = true } = this.props;
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
                                const roleDisplay = role ? role.displayName : assignment.role;
                                return (
                                    <li key={assignment.role} className="principal-detail-li">
                                        {currentUser.isAdmin && showLinks ? (
                                            <a
                                                href={AppURL.create('admin', 'permissions')
                                                    .addParam('expand', roleDisplay)
                                                    .toHref()}
                                            >
                                                {roleDisplay}
                                            </a>
                                        ) : (
                                            roleDisplay
                                        )}
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
