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

import { useAppContext } from '../../AppContext';

import { EffectiveRolesList } from './EffectiveRolesList';

import { Principal, SecurityPolicy, SecurityRole } from './models';
import { MembersList } from './MembersList';

interface Props {
    displayCounts?: boolean;
    isSiteGroup: boolean;
    members?: Member[];
    policy: SecurityPolicy;
    principal: Principal; // TODO: Is "principal" required or not? The code seems confused about this
    rolesByUniqueName: Map<string, SecurityRole>;
    showPermissionListLinks?: boolean;
}

export const GroupDetailsPanel: FC<Props> = memo(props => {
    const { principal, members, isSiteGroup, displayCounts = true, showPermissionListLinks = true } = props;
    const [created, setCreated] = useState<string>('');
    const { api } = useAppContext();
    const { user } = useServerContext();

    const loadWhenCreated = useCallback(async () => {
        try {
            const createdState = await api.security.getAuditLogData('group/UserId', principal.userId);
            // TODO: Surely need a comment about -7
            setCreated(createdState.slice(0, -7));
        } catch (e) {
            console.error(resolveErrorMessage(e) ?? 'Failed to load when group created');
        }
    }, [api, principal]);

    useEffect(() => {
        loadWhenCreated();
    }, [loadWhenCreated]);

    const { usersCount, groupsCount } = useMemo(() => {
        const usersCount_ = members.filter(member => member.type === MemberType.user).length;

        return { usersCount: usersCount_, groupsCount: (members.length - usersCount_).toString() };
    }, [members]);

    return (
        <Panel className="group-details-panel">
            <Panel.Heading>{principal?.displayName ?? 'Group Details'}</Panel.Heading>
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
