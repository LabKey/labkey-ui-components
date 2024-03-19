/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useEffect, useMemo, useState } from 'react';
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
    principal?: Principal;
    rolesByUniqueName: Map<string, SecurityRole>;
    showPermissionListLinks?: boolean;
}

export const GroupDetailsPanel: FC<Props> = memo(props => {
    const { principal, members, isSiteGroup, displayCounts = true, showPermissionListLinks = true } = props;
    const [created, setCreated] = useState<string>('');
    const { api } = useAppContext();
    const { user } = useServerContext();

    useEffect(() => {
        if (!principal) return;
        (async () => {
            try {
                const createdState = await api.security.getAuditLogDate('group/UserId', principal.userId);
                setCreated(createdState);
            } catch (e) {
                console.error(resolveErrorMessage(e) ?? 'Failed to load when group created');
            }
        })();
    }, [api, principal]);

    const { groupsCount, usersCount } = useMemo(() => {
        const usersCount_ = members.filter(member => member.type === MemberType.user).length;

        return {
            groupsCount: (members.length - usersCount_).toLocaleString(),
            usersCount: usersCount_.toLocaleString(),
        };
    }, [members]);

    return (
        <div className="panel panel-default group-details-panel">
            <div className="panel-heading">{principal?.displayName ?? 'Group Details'}</div>
            <div className="panel-body">
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
            </div>
        </div>
    );
});
