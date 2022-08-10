/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, {FC, memo, useCallback} from 'react';
import {Col, Panel, Row} from 'react-bootstrap';
import { Map } from 'immutable';

import { Principal, SecurityPolicy, SecurityRole } from './models';
import { EffectiveRolesList } from './EffectiveRolesList';
import {caseInsensitive} from "../../util/utils";
import moment from "moment";
import {getDateTimeFormat} from "../../util/Date";

interface Props {
    principal: Principal;
    policy: SecurityPolicy;
    rolesByUniqueName: Map<string, SecurityRole>;
    members?: any;
}

export const GroupDetailsPanel: FC<Props> = memo(props => {
    const {principal, members} = props;

    const renderUserProp = useCallback((title: string, prop: string) => {
        return (
            <Row>
                <Col xs={4} className="principal-detail-label">
                    {title}:
                </Col>
                <Col xs={8} className="principal-detail-value">
                    {prop}
                </Col>
            </Row>
        );
    }, []);

    return (
        <Panel>
            <Panel.Heading>Group Details</Panel.Heading>
            <Panel.Body>
                {principal ? (
                    <>
                        <p className="principal-title-primary">{principal.displayName}</p>

                        {renderUserProp("Member Count", members.users.length)}
                        {renderUserProp("Group Count", members.groups.length)}

                        <hr className="principal-hr" />



                        <EffectiveRolesList {...props} userId={principal.userId} />
                        {/* TODO when groups are implemented, "Members" for groups*/}
                    </>
                ) : (
                    <div>No group selected.</div>
                )}
            </Panel.Body>
        </Panel>
    );
});
