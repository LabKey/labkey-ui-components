/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react';
import { Map } from 'immutable'
import { Principal, SecurityPolicy, SecurityRole } from "./models";

interface Props {
    principal: Principal
    policy: SecurityPolicy
    rolesByUniqueName: Map<string, SecurityRole>
}

export class EffectiveRolesList extends React.PureComponent<Props, any> {

    render() {
        const { principal, policy, rolesByUniqueName } = this.props;

        return (
            <>
                <p>Effective Roles:</p>
                <ul className={'permissions-ul'}>
                    {policy.assignments.filter((assignment) => assignment.userId === principal.userId)
                        .map((assignment) => {
                            const role = rolesByUniqueName.get(assignment.role);
                            return <li key={assignment.role}>{role ? role.displayName : assignment.role}</li>
                        })
                    }
                </ul>
            </>
        )
    }
}
