/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { List, Map } from 'immutable';


import { User } from '../base/models/User';
import { AppURL, createProductUrlFromParts } from '../../url/AppURL';

import { getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';

import { SecurityAssignment, SecurityPolicy, SecurityRole } from './models';

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
        const currentProductId = getCurrentAppProperties()?.productId;
        const targetProductId = getPrimaryAppProperties()?.productId;

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
                <div className="row">
                    <div className="col-xs-4 principal-detail-label">
                        Effective Roles
                    </div>
                    <div className="col-xs-8 principal-detail-value">
                        <ul className="principal-detail-ul">
                            {assignments.map(assignment => {
                                const role = rolesByUniqueName.get(assignment.role);
                                const roleDisplay = role ? role.displayName : assignment.role;
                                const url = createProductUrlFromParts(
                                    targetProductId,
                                    currentProductId,
                                    { expand: roleDisplay },
                                    'admin',
                                    'permissions'
                                );

                                return (
                                    <li key={assignment.role} className="principal-detail-li">
                                        {currentUser.isAdmin && showLinks ? (
                                            <a href={url instanceof AppURL ? url.toHref() : url}>{roleDisplay}</a>
                                        ) : (
                                            roleDisplay
                                        )}
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
