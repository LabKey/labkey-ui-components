/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import * as React from 'react';
import { Panel } from "react-bootstrap";
import { Map } from 'immutable'
import { Principal, SecurityPolicy, SecurityRole } from "../permissions/models";
import { EffectiveRolesList } from "../permissions/EffectiveRolesList";

interface Props {
    principal: Principal
    policy: SecurityPolicy
    rolesByUniqueName: Map<string, SecurityRole>
}

export class UserDetailsPanel extends React.PureComponent<Props, any> {

    render() {
        const { principal } = this.props;

        return (
            <Panel>
                <Panel.Heading>
                    User Details
                </Panel.Heading>
                <Panel.Body>
                    {principal
                        ? <>
                            <p className={'permissions-title-primary'}>{principal.displayName}</p>
                            <EffectiveRolesList {...this.props}/>
                            {/*TODO when groups are implemented, add "Member of" for users*/}
                        </>
                        : <div>No user selected.</div>
                    }
                </Panel.Body>
            </Panel>
        )
    }
}
