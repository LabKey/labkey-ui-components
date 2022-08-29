import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { MenuItem } from 'react-bootstrap';

import { List, Map } from 'immutable';

import { Filter, Query } from '@labkey/api';

import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { useServerContext } from '../base/ServerContext';
import { InjectedRouteLeaveProps, withRouteLeave } from '../../util/RouteLeave';
import { resolveErrorMessage } from '../../util/messaging';
import { AppContext, useAppContext } from '../../AppContext';
import { ManageDropdownButton } from '../buttons/ManageDropdownButton';
import { AppURL } from '../../url/AppURL';

import { Principal, SecurityPolicy } from '../permissions/models';

import { InjectedPermissionsPage, withPermissionsPage } from '../permissions/withPermissionsPage';

import { getProjectPath } from '../../app/utils';
import { useNotificationsContext } from '../notifications/NotificationsContext';

import { CreatedModified } from '../base/CreatedModified';
import { Row } from '../../query/selectRows';

import { GroupAssignments } from './GroupAssignments';

import { showPremiumFeatures } from './utils';
import { GroupMembership } from './models';
import { constructGroupMembership, getGroupRows } from './actions';

function getLastModified(project: string): Promise<string> {
    return new Promise((resolve, reject) => {
        Query.selectRows({
            method: 'POST',
            schemaName: 'auditLog',
            queryName: 'GroupAuditEvent',
            columns: 'Date,Project',
            filterArray: [Filter.create('ProjectId/Name', project, Filter.Types.EQUAL)],
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

interface OwnProps {
    rolesMap: Map<string, string>;
}

type GroupPermissionsProps = OwnProps & InjectedRouteLeaveProps & InjectedPermissionsPage;

export const GroupManagementImpl: FC<GroupPermissionsProps> = memo(props => {
    const { setIsDirty, inactiveUsersById, principalsById, rolesByUniqueName, principals } = props;
    const [error, setError] = useState<string>();
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [savedGroupMembership, setSavedGroupMembership] = useState<GroupMembership>();
    const [groupMembership, setGroupMembership] = useState<GroupMembership>();
    const [lastModified, setLastModified] = useState<string>();
    const [policy, setPolicy] = useState<SecurityPolicy>();

    const { api } = useAppContext<AppContext>();
    const { dismissNotifications, createNotification } = useNotificationsContext();
    const { container, user } = useServerContext();

    const projectPath = useMemo(() => getProjectPath(container.path), [container]);
    const loaded = !isLoading(loadingState);

    const loadGroups = useCallback(async () => {
        setError(undefined);
        setIsDirty(false);

        setLoadingState(LoadingState.LOADING);
        try {
            // Used in renderButtons()
            const lastModifiedState = await getLastModified(projectPath.slice(0, -1));
            setLastModified(lastModifiedState);

            // Used in DetailsPanels
            const policyState = await api.security.fetchPolicy(container.id, principalsById, inactiveUsersById);

            // Assemble single cohesive data structure representing group data
            const fetchedGroups = await api.security.fetchGroups(projectPath);
            const groupsData = fetchedGroups.filter(group => group.isProjectGroup);
            const groupRows = await getGroupRows();
            const groupMembershipState = constructGroupMembership(groupsData, groupRows);

            setPolicy(policyState);
            setSavedGroupMembership(groupMembershipState);
            setGroupMembership(groupMembershipState);
        } catch (e) {
            setError(resolveErrorMessage(e) ?? 'Failed to load group data');
        }

        setLoadingState(LoadingState.LOADED);
    }, [api.security, container.id, inactiveUsersById, principalsById, projectPath, setIsDirty]);

    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    const save = useCallback(async () => {
        try {
            // Create new groups
            const addedGroups = Object.keys(groupMembership).filter(groupId => !(groupId in savedGroupMembership));
            const newlyAddedGroupIds = await Promise.all(
                addedGroups.map(async groupName => {
                    const createGroupResponse = await api.security.createGroup(groupName, projectPath);
                    const newGroupId = createGroupResponse.id;
                    return { id: newGroupId, name: groupName };
                })
            );
            // (Replace old name keys with new id keys)
            const newGroupMembership = { ...groupMembership };
            newlyAddedGroupIds.forEach(addedGroup => {
                newGroupMembership[addedGroup.id] = newGroupMembership[addedGroup.name];
                delete newGroupMembership[addedGroup.name];
            });

            // Delete groups
            const deletedGroups = Object.keys(savedGroupMembership).filter(groupId => !(groupId in groupMembership));
            const deletedGroupIds = await Promise.all(
                deletedGroups.map(async groupId => {
                    const createGroupResponse = await api.security.deleteGroup(parseInt(groupId, 10), projectPath);
                    return createGroupResponse.deleted;
                })
            );
            deletedGroupIds.forEach(deletedGroup => {
                delete newGroupMembership[deletedGroup];
            });

            // Add new members
            Object.keys(newGroupMembership).map(async groupId => {
                const currentMembers = newGroupMembership[groupId].members.map(member => member.id);
                const oldMembers = new Set(savedGroupMembership[groupId]?.members.map(member => member.id));
                const addedMembers = currentMembers.filter(id => !oldMembers.has(id));
                if (addedMembers.length)
                    await api.security.addGroupMembers(parseInt(groupId, 10), addedMembers, projectPath);
            });

            // Delete members
            Object.keys(newGroupMembership).map(async groupId => {
                const currentMembers = new Set(newGroupMembership[groupId].members.map(member => member.id));
                const oldMembers = savedGroupMembership[groupId]?.members.map(member => member.id);
                const deletedMembers = oldMembers?.filter(id => !currentMembers.has(id));
                if (deletedMembers?.length)
                    await api.security.removeGroupMembers(parseInt(groupId, 10), deletedMembers, projectPath);
            });

            // Save updated state
            setSavedGroupMembership(newGroupMembership);
            setGroupMembership(newGroupMembership);

            dismissNotifications();
            createNotification('Successfully updated groups and assignments.');
        } catch (e) {
            setError(resolveErrorMessage(e) ?? 'Failed to update groups.');
        }

        setIsDirty(false);
    }, [
        setIsDirty,
        groupMembership,
        savedGroupMembership,
        dismissNotifications,
        createNotification,
        api.security,
        projectPath,
    ]);

    const renderButtons = useCallback(() => {
        const row = { Modified: { value: lastModified } };

        return (
            <>
                <CreatedModified row={row} />
                <ManageDropdownButton collapsed id="admin-page-manage" pullRight>
                    <MenuItem href={AppURL.create('audit', 'groupauditevent').toHref()}>View Audit History</MenuItem>
                </ManageDropdownButton>
            </>
        );
    }, [lastModified]);

    const createGroup = useCallback(
        (name: string) => {
            setGroupMembership({ ...groupMembership, [name]: { groupName: name, members: [] } });
        },
        [groupMembership]
    );

    const deleteGroup = useCallback(
        (id: string) => {
            const newGroupMembership = { ...groupMembership };
            delete newGroupMembership[id];

            setGroupMembership(newGroupMembership);
        },
        [groupMembership]
    );

    const addMembers = useCallback(
        (groupId: string, principalId: number, principalName: string, principalType: string) => {
            const group = groupMembership[groupId];
            const newMember = { name: principalName, id: principalId, type: principalType };
            setGroupMembership({
                ...groupMembership,
                [groupId]: { groupName: group.groupName, members: [...group.members, newMember] },
            });
        },
        [groupMembership]
    );

    const removeMember = useCallback(
        (groupId: string, memberId: number) => {
            const newGroupMembership = Object.fromEntries(
                Object.entries(groupMembership).map(([id, group]) => {
                    if (id === groupId) {
                        const newMembers = group.members.filter(member => member.id !== memberId);
                        return [id, { ...group, members: [...newMembers] }];
                    } else {
                        return [id, group];
                    }
                })
            );
            setGroupMembership(newGroupMembership);
        },
        [groupMembership]
    );

    const usersAndGroups = useMemo(() => {
        return principals.filter(principal => principal.type === 'u' || principal.userId > 0) as List<Principal>;
    }, [principals]);

    const description = useMemo(() => {
        return showPremiumFeatures() ? container.path : undefined;
    }, [container]);

    return (
        <BasePermissionsCheckPage
            description={description}
            hasPermission={user.isAdmin}
            renderButtons={renderButtons}
            title="Group Management"
            user={user}
        >
            {!loaded && <LoadingSpinner />}
            {!!error && <Alert>{error}</Alert>}
            {loaded && !error && (
                <GroupAssignments
                    groupMembership={groupMembership}
                    policy={policy}
                    rolesByUniqueName={rolesByUniqueName}
                    principalsById={principalsById}
                    usersAndGroups={usersAndGroups}
                    createGroup={createGroup}
                    deleteGroup={deleteGroup}
                    addMembers={addMembers}
                    removeMember={removeMember}
                    save={save}
                />
            )}
        </BasePermissionsCheckPage>
    );
});

export const GroupManagement = withRouteLeave<OwnProps>(withPermissionsPage(GroupManagementImpl));
