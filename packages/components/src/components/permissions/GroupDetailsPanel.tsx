/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { Panel } from 'react-bootstrap';
import { Map } from 'immutable';

import { Principal, SecurityPolicy, SecurityRole } from './models';
import { EffectiveRolesList } from './EffectiveRolesList';

interface Props {
    principal: Principal;
    policy: SecurityPolicy;
    rolesByUniqueName: Map<string, SecurityRole>;
}

export class GroupDetailsPanel extends React.PureComponent<Props, any> {
    render() {
        const { principal } = this.props;

        return (
            <Panel>
                <Panel.Heading>Group Details</Panel.Heading>
                <Panel.Body>
                    {principal ? (
                        <>
                            <p className="principal-title-primary">{principal.displayName}</p>
                            <EffectiveRolesList {...this.props} userId={principal.userId} />
                            {/* TODO when groups are implemented, "Members" for groups*/}
                        </>
                    ) : (
                        <div>No group selected.</div>
                    )}
                </Panel.Body>
            </Panel>
        );
    }
}
