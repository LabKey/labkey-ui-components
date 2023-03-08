/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Panel } from 'react-bootstrap';
import { Map } from 'immutable';

import { resolveErrorMessage } from '../../util/messaging';
import { Member, MemberType } from '../administration/models';

import { UserProperties } from '../user/UserProperties';

import { useServerContext } from '../base/ServerContext';

import { EffectiveRolesList } from './EffectiveRolesList';

import { Principal, SecurityPolicy, SecurityRole } from './models';
import { MembersList } from './MembersList';

interface Props {
    displayCounts?: boolean;
    getAuditLogData: (columns: string, filterCol: string, filterVal: string | number) => Promise<string>;
    isSiteGroup: boolean;
    members?: Member[];
    policy: SecurityPolicy;
    principal: Principal;
    rolesByUniqueName: Map<string, SecurityRole>;
    showPermissionListLinks?: boolean;
}

export const GroupDetailsPanel: FC<Props> = memo(props => {
    const {
        getAuditLogData,
        principal,
        members,
        isSiteGroup,
        displayCounts = true,
        showPermissionListLinks = true,
    } = props;
    const [created, setCreated] = useState<string>('');
    const { user } = useServerContext();

    const loadWhenCreated = useCallback(async () => {
        try {
            const createdState = await getAuditLogData('Date,group/UserId', 'group/UserId', principal.userId);

            setCreated(createdState.slice(0, -7));
        } catch (e) {
            console.error(resolveErrorMessage(e) ?? 'Failed to load when group created');
        }
    }, [getAuditLogData, principal]);

    useEffect(() => {
        loadWhenCreated();
    }, [loadWhenCreated]);

    const { usersCount, groupsCount } = useMemo(() => {
        const usersCount = members.filter(member => member.type === MemberType.user).length;
        const groupsCount = (members.length - usersCount).toString();

        return { usersCount, groupsCount };
    }, [members]);

    return (
        <Panel className="group-details-panel">
            <Panel.Heading>{principal ? principal.displayName : 'Group Details'}</Panel.Heading>
            <Panel.Body>
                {principal ? (
                    <>
                        {displayCounts && (
                            <>
                                <UserProperties prop={usersCount.toString()} title="User Count" />
                                <UserProperties prop={groupsCount} title="Group Count" />
                                <hr className="principal-hr" />
                            </>
                        )}

                        <UserProperties prop={created} title="Created" />
                        {isSiteGroup && <UserProperties prop="true" title="Site Group" />}

                        <EffectiveRolesList
                            {...props}
                            currentUser={user}
                            userId={principal.userId}
                            showLinks={showPermissionListLinks}
                        />
                        <MembersList members={members} />
                    </>
                ) : (
                    <div>No group selected.</div>
                )}
            </Panel.Body>
        </Panel>
    );
});
