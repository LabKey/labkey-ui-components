/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, {FC, memo, useCallback, useMemo} from 'react';
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

    const {usersCount, groupsCount} = useMemo(() => {
        const usersCount = members.filter(member => member.type === 'u').length;
        const groupsCount = (members.length - usersCount).toString();

        return {usersCount, groupsCount}
    }, [members]);

    return (
        <Panel>
            <Panel.Heading>Group Details</Panel.Heading>
            <Panel.Body>
                {principal ? (
                    <>
                        <p className="principal-title-primary">{principal.displayName}</p>

                        {renderUserProp("Member Count", usersCount)}
                        {renderUserProp("Group Count", groupsCount)}

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
