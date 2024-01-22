import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { MenuItem } from 'react-bootstrap';
import { List } from 'immutable';

import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { useServerContext } from '../base/ServerContext';
import { useRouteLeave } from '../../util/RouteLeave';
import { resolveErrorMessage } from '../../util/messaging';
import { AppContext, useAppContext } from '../../AppContext';
import { ManageDropdownButton } from '../buttons/ManageDropdownButton';
import { AppURL } from '../../url/AppURL';

import { Principal, SecurityPolicy } from '../permissions/models';

import { InjectedPermissionsPage, withPermissionsPage } from '../permissions/withPermissionsPage';

import { getProjectPath, isProductProjectsEnabled } from '../../app/utils';
import { useNotificationsContext } from '../notifications/NotificationsContext';

import { CreatedModified } from '../base/CreatedModified';

import { naturalSort } from '../../../public/sort';

import { getPrincipals } from '../permissions/actions';

import { AUDIT_EVENT_TYPE_PARAM, GROUP_AUDIT_QUERY } from '../auditlog/constants';

import { AUDIT_KEY } from '../../app/constants';

import { NotFound } from '../base/NotFound';

import { useAdministrationSubNav } from './useAdministrationSubNav';

import { GroupAssignments } from './GroupAssignments';

import { showPremiumFeatures } from './utils';
import { Groups, MemberType } from './models';
import { fetchGroupMembership } from './actions';

export type GroupManagementPageProps = InjectedPermissionsPage;

export const GroupManagementPageImpl: FC<GroupManagementPageProps> = memo(props => {
    const { inactiveUsersById, principalsById, rolesByUniqueName, principals } = props;
    useAdministrationSubNav();
    const [getIsDirty, setIsDirty] = useRouteLeave();
    const [error, setError] = useState<string>();
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [savedGroupMembership, setSavedGroupMembership] = useState<Groups>();
    const [groupMembership, setGroupMembership] = useState<Groups>();
    const [updatedPrincipals, setUpdatedPrincipals] = useState<List<Principal>>(principals);
    const [lastModified, setLastModified] = useState<string>();
    const [policy, setPolicy] = useState<SecurityPolicy>();
    const [errorMsg, setErrorMsg] = useState<string>();
    const { api } = useAppContext<AppContext>();
    const { dismissNotifications, createNotification } = useNotificationsContext();
    const { container, moduleContext, user } = useServerContext();

    const projectPath = useMemo(() => getProjectPath(container.path), [container]);
    const loaded = !isLoading(loadingState);

    const loadGroups = useCallback(async () => {
        setError(undefined);
        setIsDirty(false);

        setLoadingState(LoadingState.LOADING);
        try {
            // Used in renderButtons()
            const lastModifiedState = await api.security.getAuditLogDate('ProjectId/Name', projectPath.slice(0, -1));
            setLastModified(lastModifiedState);

            // Used in DetailsPanels
            const policyState = await api.security.fetchPolicy(container.id, principalsById, inactiveUsersById);

            // Assemble single cohesive data structure representing group data
            const groupMembershipState = await fetchGroupMembership(container, api.security);

            setPolicy(policyState);
            setSavedGroupMembership(groupMembershipState);
            setGroupMembership(groupMembershipState);
        } catch (e) {
            setError(resolveErrorMessage(e) ?? 'Failed to load group data');
        }

        setLoadingState(LoadingState.LOADED);
    }, [api.security, container, inactiveUsersById, principalsById, projectPath, setIsDirty]);

    useEffect(() => {
        loadGroups();
    }, [loadGroups]);

    const onSetErrorMsg = useCallback((e: string) => {
        setErrorMsg(e);
    }, []);

    const save = useCallback(async () => {
        try {
            // TODO: This should all be done server-side and transacted
            // Delete members
            const newGroupMembership = { ...groupMembership };
            for (const groupId of Object.keys(newGroupMembership)) {
                const currentMembers = new Set(newGroupMembership[groupId].members.map(member => member.id));
                const oldMembers = savedGroupMembership[groupId]?.members.map(member => member.id);
                const deletedMembers = oldMembers?.filter(id => !currentMembers.has(id));
                if (deletedMembers?.length)
                    await api.security.removeGroupMembers(parseInt(groupId, 10), deletedMembers, projectPath);
            }

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
            newlyAddedGroupIds.forEach(addedGroup => {
                newGroupMembership[addedGroup.id] = newGroupMembership[addedGroup.name];
                delete newGroupMembership[addedGroup.name];
            });

            // Add new members
            for (const groupId of Object.keys(newGroupMembership)) {
                const currentMembers = newGroupMembership[groupId].members.map(member => member.id);
                const oldMembers = new Set(savedGroupMembership[groupId]?.members.map(member => member.id));
                const addedMembers = currentMembers.filter(id => !oldMembers.has(id));
                if (addedMembers.length)
                    await api.security.addGroupMembers(parseInt(groupId, 10), addedMembers, projectPath);
            }

            const principals_ = await getPrincipals();

            // Save updated state
            setUpdatedPrincipals(principals_);
            setSavedGroupMembership(newGroupMembership);
            setGroupMembership(newGroupMembership);

            dismissNotifications();
            createNotification('Successfully updated groups and assignments.');
        } catch (e) {
            setErrorMsg(resolveErrorMessage(e) ?? 'Failed to update groups.');
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
                <CreatedModified row={row} useServerDate={false} />
                <ManageDropdownButton>
                    <MenuItem
                        href={AppURL.create(AUDIT_KEY)
                            .addParam(AUDIT_EVENT_TYPE_PARAM, GROUP_AUDIT_QUERY.value)
                            .toHref()}
                    >
                        View Audit History
                    </MenuItem>
                </ManageDropdownButton>
            </>
        );
    }, [lastModified]);

    const createGroup = useCallback((name: string) => {
        setGroupMembership(current => ({ ...current, [name]: { groupName: name, members: [] } }));
    }, []);

    const deleteGroup = useCallback((id: string) => {
        setGroupMembership(current => {
            // Remove deleted group from membership in other groups first
            const newGroupMembership = Object.fromEntries(
                Object.entries(current).map(([groupId, group]) => {
                    const newMembers = group.members.filter(g => g.id !== parseInt(id, 10));
                    return [groupId, { ...group, members: [...newMembers] }];
                })
            );
            delete newGroupMembership[id];
            return newGroupMembership;
        });
    }, []);

    const addMembers = useCallback(
        (groupId: string, principalId: number, principalName: string, principalType: string) => {
            setGroupMembership(current => {
                const group = current[groupId];
                const newMember = { name: principalName, id: principalId, type: principalType };
                const members = [...group.members, newMember].sort((m1, m2) => naturalSort(m1.name, m2.name));

                return {
                    ...current,
                    [groupId]: { groupName: group.groupName, members },
                };
            });
        },
        []
    );

    const removeMember = useCallback((groupId: string, memberId: number) => {
        setGroupMembership(current =>
            Object.fromEntries(
                Object.entries(current).map(([id, group]) => {
                    if (id === groupId) {
                        const newMembers = group.members.filter(member => member.id !== memberId);
                        return [id, { ...group, members: [...newMembers] }];
                    } else {
                        return [id, group];
                    }
                })
            )
        );
    }, []);

    const usersAndGroups = useMemo(() => {
        return updatedPrincipals
            .filter(principal => principal.type === MemberType.user || principal.userId > 0)
            .map(
                principal =>
                    (groupMembership && groupMembership[principal.userId]?.type === MemberType.siteGroup
                        ? principal.set('isSiteGroup', true)
                        : principal) as Principal
            )
            .sort((p1, p2) => naturalSort(p1.displayName, p2.displayName)) as List<Principal>;
    }, [updatedPrincipals, groupMembership]);

    const description = useMemo(() => {
        return showPremiumFeatures(moduleContext) ? container.path : undefined;
    }, [container, moduleContext]);

    if (isProductProjectsEnabled(moduleContext) && !container.isProject) return <NotFound />;

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
                    errorMsg={errorMsg}
                    setErrorMsg={onSetErrorMsg}
                    setIsDirty={setIsDirty}
                    getIsDirty={getIsDirty}
                />
            )}
        </BasePermissionsCheckPage>
    );
});

export const GroupManagementPage = withPermissionsPage(GroupManagementPageImpl);
