import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { MenuItem } from 'react-bootstrap';

import { List, Map } from 'immutable';

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

import { getGroupMembership } from '../security/actions';
import { getProjectPath } from '../../app/utils';
import { useNotificationsContext } from '../notifications/NotificationsContext';

import { GroupAssignments } from './GroupAssignments';

import { showPremiumFeatures } from './utils';

// todo: comment this up
const constructGroupMembership = (groupsData, groupRows) => {
    const groupsWithMembers = groupRows.reduce((prev, curr) => {
        const groupId = curr['GroupId'];
        if (groupId === -1) {
            return prev;
        }
        const userDisplayName = curr['UserId/DisplayName'];
        const isGroup = !userDisplayName;
        // consider efficiency of below line. Maybe make groupsData a map
        const member = {
            name: userDisplayName ?? groupsData.find(group => group.id === curr.UserId).name,
            id: curr.UserId,
            type: isGroup ? 'g' : 'u',
        };
        if (curr.GroupId in prev) {
            prev[groupId].members.push(member);
            return prev;
        } else {
            prev[groupId] = { groupName: curr['GroupId/Name'], members: [member] };
            return prev;
        }
    }, {});

    groupsData.forEach(group => {
        if (!(group.id in groupsWithMembers)) {
            groupsWithMembers[group.id] = { groupName: group.name, members: [] };
        }
    });

    return groupsWithMembers;
};

interface OwnProps {
    rolesMap: Map<string, string>;
}

type GroupPermissionsProps = OwnProps & InjectedRouteLeaveProps & InjectedPermissionsPage;

export const GroupManagementImpl: FC<GroupPermissionsProps> = memo(props => {
    const { setIsDirty, inactiveUsersById, principalsById, rolesByUniqueName, principals } = props;
    const [error, setError] = useState<string>();
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [savedGroupMembership, setSavedGroupMembership] = useState<any>();
    const [groupMembership, setGroupMembership] = useState<any>();

    const [policy, setPolicy] = useState<SecurityPolicy>();

    const { api } = useAppContext<AppContext>();
    const { dismissNotifications, createNotification } = useNotificationsContext();
    const { container, user } = useServerContext();
    const projectPath = useMemo(() => getProjectPath(container.path), [container]); // probably move this into fn

    const loaded = !isLoading(loadingState);

    const loadGroups = useCallback(async () => {
        setError(undefined);
        setIsDirty(false);

        if (user.isAdmin) {
            // TODO: is this correct gating?
            setLoadingState(LoadingState.LOADING);
            try {
                const fetchedGroups = await api.security.fetchGroups();
                const groupsData = fetchedGroups?.container?.groups.filter(group => group.isProjectGroup);

                const policy = await api.security.fetchPolicy(container.id, principalsById, inactiveUsersById);
                setPolicy(policy);

                const groupRows = await getGroupMembership();
                const groupMembership = constructGroupMembership(groupsData, groupRows);

                setSavedGroupMembership(groupMembership);
                setGroupMembership(groupMembership);
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to load group data');
            }
        }

        setLoadingState(LoadingState.LOADED);
    }, [api.security, setIsDirty, user]);

    useEffect(() => {
        loadGroups();
    }, []);

    const save = useCallback(async () => {
        // Add new groups
        const addedGroups = Object.keys(groupMembership).filter(groupId => !(groupId in savedGroupMembership));
        console.log('addedGroups', addedGroups);
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

        // Delete deleted groups
        const deletedGroups = Object.keys(savedGroupMembership).filter(groupId => !(groupId in groupMembership));
        console.log('deletedGroups', deletedGroups);
        const deletedGroupIds = await Promise.all(
            deletedGroups.map(async groupId => {
                const createGroupResponse = await api.security.deleteGroup(parseInt(groupId), projectPath);
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
            console.log('addedMembers', addedMembers);
            if (addedMembers.length) await api.security.addGroupMembers(parseInt(groupId), addedMembers, projectPath);
        });

        // Save updated state
        setIsDirty(false);
        setSavedGroupMembership(newGroupMembership);
        setGroupMembership(newGroupMembership);

        dismissNotifications();
        createNotification('Successfully updated groups and assignments.');
    }, [savedGroupMembership, groupMembership, projectPath]);

    const renderButtons = useCallback(() => {
        return (
            <>
                {/* TODO: needs modified date...?*/}
                <ManageDropdownButton collapsed id="admin-page-manage" pullRight>
                    <MenuItem href={AppURL.create('audit', 'groupauditevent').toHref()}>View Audit History</MenuItem>
                </ManageDropdownButton>
            </>
        );
    }, []);

    const addGroup = useCallback(
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

    const addUser = useCallback(
        (userId: number, principalId: string, principalName: string, principalType: string) => {
            const group = groupMembership[principalId];
            const newMember = { name: principalName, id: userId, type: principalType };
            setGroupMembership({
                ...groupMembership,
                [principalId]: { groupName: group.groupName, members: [...group.members, newMember] },
            });
        },
        [groupMembership]
    );

    const removeMember = useCallback(
        (memberId: number, groupId: string) => {
            const newGroupMembership = Object.keys(groupMembership).map(gId => {
                if (gId === groupId) {
                    const group = groupMembership[gId];
                    const newMembers = group.members.filter(member => member.id !== memberId);
                    return { groupName: group.groupName, members: [...newMembers] };
                } else {
                    return groupMembership[gId];
                }
            });
            setGroupMembership(newGroupMembership);
        },
        [groupMembership]
    );

    console.log('groupMembership', groupMembership);

    const usersAndGroups = useMemo(() => {
        return principals.filter(principal => principal.type === 'u' || principal.userId > 0) as List<Principal>; // typing weirdness
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
                    addGroup={addGroup}
                    deleteGroup={deleteGroup}
                    addUser={addUser}
                    removeMember={removeMember}
                    save={save}
                />
            )}
        </BasePermissionsCheckPage>
    );
});

export const GroupManagement = withRouteLeave<OwnProps>(withPermissionsPage(GroupManagementImpl));
