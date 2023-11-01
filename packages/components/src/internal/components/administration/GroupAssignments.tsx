import React, { ChangeEvent, FC, memo, useCallback, useMemo, useState } from 'react';
import { Button, Panel } from 'react-bootstrap';
import { List, Map } from 'immutable';
import { InjectedRouter } from 'react-router';

import { FormButtons } from '../../FormButtons';

import { Alert } from '../base/Alert';

import { Principal, SecurityPolicy, SecurityRole } from '../permissions/models';
import { UserDetailsPanel } from '../user/UserDetailsPanel';
import { GroupDetailsPanel } from '../permissions/GroupDetailsPanel';

import { naturalSort } from '../../../public/sort';

import { getLocation } from '../../util/URL';

import { useServerContext } from '../base/ServerContext';

import { Group } from './Group';
import { GroupMembership, MemberType } from './models';

export interface GroupAssignmentsProps {
    addMembers: (groupId: string, principalId: number, principalName: string, principalType: string) => void;
    createGroup: (name: string) => void;
    deleteGroup: (id: string) => void;
    errorMsg: string;
    getAuditLogData: (columns: string, filterCol: string, filterVal: string | number) => Promise<string>;
    getIsDirty: () => boolean;
    groupMembership: GroupMembership;
    policy: SecurityPolicy;
    principalsById: Map<number, Principal>;
    removeMember: (groupId: string, memberId: number) => void;
    rolesByUniqueName: Map<string, SecurityRole>;
    router?: InjectedRouter;
    save: () => Promise<void>;
    setErrorMsg: (e: string) => void;
    setIsDirty: (isDirty: boolean) => void;
    showDetailsPanel?: boolean;
    usersAndGroups: List<Principal>;
}

export const GroupAssignments: FC<GroupAssignmentsProps> = memo(props => {
    const {
        errorMsg,
        getAuditLogData,
        getIsDirty,
        groupMembership,
        policy,
        rolesByUniqueName,
        principalsById,
        usersAndGroups,
        createGroup,
        deleteGroup,
        addMembers,
        removeMember,
        save,
        setErrorMsg,
        setIsDirty,
        router,
    } = props;
    const { user } = useServerContext();
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [selectedPrincipalId, setSelectedPrincipalId] = useState<number>();
    const [newGroupName, setNewGroupName] = useState<string>('');
    const initExpandedGroup = getLocation().query?.get('expand');

    const onCancel = useCallback(() => {
        setIsDirty(false);
        router.goBack();
    }, [router, setIsDirty]);

    const onSave = useCallback(async () => {
        setSubmitting(true);
        setErrorMsg(undefined);
        await save();
        setIsDirty(false);
        setSubmitting(false);
    }, [save, setErrorMsg, setIsDirty]);

    const showDetails = useCallback((principalId: number) => {
        setSelectedPrincipalId(principalId);
    }, []);

    const onChangeNewGroupName = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => setNewGroupName(event.target.value),
        []
    );

    const onCreateGroup = useCallback(() => {
        setErrorMsg(undefined);

        const trimmedName = newGroupName.trim();
        if (
            trimmedName in groupMembership ||
            Object.values(groupMembership).some(group => group.groupName.toLowerCase() === trimmedName.toLowerCase())
        ) {
            setErrorMsg(`Group ${trimmedName} already exists.`);
        } else {
            setIsDirty(true);
            createGroup(trimmedName);
        }

        setNewGroupName('');
    }, [createGroup, groupMembership, newGroupName, setErrorMsg, setIsDirty]);

    const onDeleteGroup = useCallback(
        (id: string) => {
            setSelectedPrincipalId(undefined);
            deleteGroup(id);
            setIsDirty(true);
        },
        [deleteGroup, setIsDirty]
    );

    const onAddMember = useCallback(
        (groupId: string, principalId: number, principalName: string, principalType: string) => {
            setSelectedPrincipalId(principalId);
            addMembers(groupId, principalId, principalName, principalType);
            setIsDirty(true);
        },
        [addMembers, setIsDirty]
    );

    const onRemoveMember = useCallback(
        (groupId: string, memberId: number) => {
            setIsDirty(true);
            setSelectedPrincipalId(undefined);
            removeMember(groupId, memberId);
        },
        [removeMember, setIsDirty]
    );

    const selectedPrincipal = useMemo(() => {
        return principalsById.get(selectedPrincipalId);
    }, [principalsById, selectedPrincipalId]);

    // Filter out site groups from display
    const orderedGroupMembership = useMemo(() => {
        return Object.keys(groupMembership)
            .filter(group => groupMembership[group]?.type !== MemberType.siteGroup)
            .sort((id1, id2) => naturalSort(groupMembership[id1].groupName, groupMembership[id2].groupName));
    }, [groupMembership]);

    // Folder and Project Admins may receive inaccurate group membership counts due to lack of permissions for viewing
    // data for users outside their Project. In this case, we opt to not display counts.
    const userIsAppAdmin = user.isAppAdmin();

    return (
        <div className="row">
            <div className="col-xs-12 col-md-8">
                <Panel>
                    <Panel.Heading> Application Groups and Assignments </Panel.Heading>
                    <Panel.Body className="permissions-groups-assignment-panel group-assignment-panel">
                        <div className="create-group">
                            <input
                                className="form-control create-group__input"
                                placeholder="New group name"
                                value={newGroupName}
                                onChange={onChangeNewGroupName}
                            />

                            <Button
                                className="alert-button"
                                bsStyle="info"
                                disabled={newGroupName.trim() === ''}
                                onClick={onCreateGroup}
                            >
                                Create Group
                            </Button>
                        </div>
                        {orderedGroupMembership.map(id => (
                            <Group
                                key={id}
                                id={id}
                                initExpanded={initExpandedGroup === id}
                                name={groupMembership[id].groupName}
                                usersAndGroups={usersAndGroups}
                                onClickAssignment={showDetails}
                                members={groupMembership[id].members}
                                selectedPrincipalId={selectedPrincipalId}
                                deleteGroup={onDeleteGroup}
                                onRemoveMember={onRemoveMember}
                                addMember={onAddMember}
                            />
                        ))}

                        <div className="group-assignment-panel__footer">{errorMsg && <Alert>{errorMsg}</Alert>}</div>

                        <FormButtons>
                            {router && (
                                <button className="btn btn-default" onClick={onCancel} type="button">
                                    Cancel
                                </button>
                            )}
                            <button
                                className="btn btn-success alert-button group-management-save-btn"
                                disabled={submitting || !getIsDirty()}
                                onClick={onSave}
                                type="button"
                            >
                                Save
                            </button>
                        </FormButtons>
                    </Panel.Body>
                </Panel>
            </div>

            <div className="col-xs-12 col-md-4">
                {selectedPrincipal?.type === MemberType.group ? (
                    <GroupDetailsPanel
                        principal={selectedPrincipal}
                        policy={policy}
                        rolesByUniqueName={rolesByUniqueName}
                        members={groupMembership[selectedPrincipal?.userId]?.members}
                        isSiteGroup={groupMembership[selectedPrincipal?.userId]?.type === MemberType.siteGroup}
                        getAuditLogData={getAuditLogData}
                        displayCounts={userIsAppAdmin}
                    />
                ) : (
                    <UserDetailsPanel
                        currentUser={user}
                        userId={selectedPrincipalId}
                        policy={policy}
                        rolesByUniqueName={rolesByUniqueName}
                        showGroupListLinks={false}
                    />
                )}
            </div>
        </div>
    );
});
