/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Panel } from 'react-bootstrap';
import { Map } from 'immutable';

import { Filter, Query } from '@labkey/api';

import { resolveErrorMessage } from '../../util/messaging';
import { Member } from '../administration/models';

import { UserProperties } from '../user/UserProperties';

import { EffectiveRolesList } from './EffectiveRolesList';

import { Principal, SecurityPolicy, SecurityRole } from './models';
import { MembersList } from './MembersList';

function getWhenCreated(id: number): Promise<string> {
    return new Promise((resolve, reject) => {
        Query.selectRows({
            method: 'POST',
            schemaName: 'auditLog',
            queryName: 'GroupAuditEvent',
            columns: 'Date,group/UserId',
            filterArray: [Filter.create('group/UserId', id, Filter.Types.EQUAL)],
            containerFilter: Query.ContainerFilter.allFolders,
            sort: '-Date',
            maxRows: 1,
            success: response => {
                resolve(response.rows.length ? response.rows[0].Date : '');
            },
            failure: error => {
                console.error('Failed to fetch group memberships', error);
                reject(error);
            },
        });
    });
}

interface Props {
    members?: Member[];
    policy: SecurityPolicy;
    principal: Principal;
    rolesByUniqueName: Map<string, SecurityRole>;
}

export const GroupDetailsPanel: FC<Props> = memo(props => {
    const { principal, members } = props;
    const [created, setCreated] = useState<string>('');

    const loadWhenCreated = useCallback(async () => {
        try {
            const createdState = await getWhenCreated(principal.userId);
            setCreated(createdState.slice(0, -7));
        } catch (e) {
            console.error(resolveErrorMessage(e) ?? 'Failed to when group created');
        }
    }, [principal]);

    useEffect(() => {
        loadWhenCreated();
    }, [loadWhenCreated]);

    const { usersCount, groupsCount } = useMemo(() => {
        const usersCount = members.filter(member => member.type === 'u').length;
        const groupsCount = (members.length - usersCount).toString();

        return { usersCount, groupsCount };
    }, [members]);

    return (
        <Panel>
            <Panel.Heading>Group Details</Panel.Heading>
            <Panel.Body>
                {principal ? (
                    <>
                        <p className="principal-title-primary">{principal.displayName}</p>

                        <UserProperties prop={usersCount.toString()} title="User Count" />
                        <UserProperties prop={groupsCount} title="Group Count" />

                        <hr className="principal-hr" />
                        <UserProperties prop={created} title="Created" />

                        <EffectiveRolesList {...props} userId={principal.userId} />
                        <MembersList members={members} />
                    </>
                ) : (
                    <div>No group selected.</div>
                )}
            </Panel.Body>
        </Panel>
    );
});
