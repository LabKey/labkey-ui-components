/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { ExtendedMap } from '../../../public/ExtendedMap';

import { User } from '../base/models/User';
import { AppURL } from '../../url/AppURL';

import { AppLink } from '../../url/AppLink';

import { ADMIN_KEY } from '../../app/constants';

import { SecurityAssignment, SecurityPolicy, SecurityRole } from './models';

interface Props {
    currentUser: User;
    policy?: SecurityPolicy;
    rolesByUniqueName?: ExtendedMap<string, SecurityRole>;
    rootPolicy?: SecurityPolicy;
    showLinks?: boolean;
    userId: number;
}

export class EffectiveRolesList extends React.PureComponent<Props> {
    render() {
        const { userId, policy, rootPolicy, rolesByUniqueName, currentUser, showLinks = true } = this.props;

        const assignments: SecurityAssignment[] = [];
        if (policy && rolesByUniqueName) {
            assignments.push(...policy.assignments.filter(assignment => assignment.userId === userId).toArray());
        }
        if (rootPolicy && rolesByUniqueName) {
            assignments.push(...rootPolicy.assignments.filter(assignment => assignment.userId === userId).toArray());
        }

        if (assignments.length === 0) {
            return null;
        }

        return (
            <>
                <hr className="principal-hr" />
                <div className="row">
                    <div className="col-xs-4 principal-detail-label">Effective Roles</div>
                    <div className="col-xs-8 principal-detail-value">
                        <ul className="principal-detail-ul">
                            {assignments.map(assignment => {
                                const role = rolesByUniqueName.get(assignment.role);
                                const roleDisplay = role ? role.displayName : assignment.role;
                                const url = AppURL.create(ADMIN_KEY, 'permissions').addParams({
                                    expand: roleDisplay,
                                });
                                const showLink = currentUser.isAdmin && showLinks;

                                return (
                                    <li key={assignment.role} className="principal-detail-li">
                                        {showLink && <AppLink to={url}>{roleDisplay}</AppLink>}
                                        {!showLink && roleDisplay}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </div>
            </>
        );
    }
}
