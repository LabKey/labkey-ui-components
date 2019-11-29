/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react';
import { Panel } from "react-bootstrap";
import { Map } from 'immutable'
import { Principal, SecurityPolicy, SecurityRole } from "./models";

interface Props {
    principal: Principal
    policy: SecurityPolicy
    rolesByUniqueName: Map<string, SecurityRole>
}

export class PrincipalDetailsPanel extends React.PureComponent<Props, any> {

    renderEffectiveRoles() {
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

    render() {
        const { principal } = this.props;

        return (
            <Panel>
                <Panel.Heading>
                    Details
                </Panel.Heading>
                <Panel.Body>
                    {principal
                        ? <>
                            <p className={'permissions-title-primary'}>{principal.displayName}</p>
                            <br/>
                            {this.renderEffectiveRoles()}
                            {/*TODO when groups are implemented, add "Member of" for users and "Members" for groups*/}
                        </>
                        : <div>No user/group selected.</div>
                    }
                </Panel.Body>
            </Panel>
        )
    }
}