import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Col, Panel, Row } from 'react-bootstrap';

import { List, Map } from 'immutable';

import { Alert } from '../base/Alert';

import { Principal, SecurityPolicy, SecurityRole } from '../permissions/models';
import { UserDetailsPanel } from '../user/UserDetailsPanel';
import { GroupDetailsPanel } from '../permissions/GroupDetailsPanel';

import { Group } from './Group';
import {GroupMembership} from "./models";

export interface GroupAssignmentsProps {
    addMembers: (groupId: string, principalId: number, principalName: string, principalType: string) => void;
    createGroup: (name: string) => void;
    deleteGroup: (id: string) => void;
    groupMembership: GroupMembership;
    policy: SecurityPolicy;
    principalsById: Map<number, Principal>;
    removeMember: (groupId: string, memberId: number) => void;
    rolesByUniqueName: Map<string, SecurityRole>;
    save: () => Promise<void>;
    showDetailsPanel?: boolean;
    usersAndGroups: List<Principal>;
}

export const GroupAssignments: FC<GroupAssignmentsProps> = memo(props => {
    const {
        groupMembership,
        showDetailsPanel = true,
        policy,
        rolesByUniqueName,
        principalsById,
        usersAndGroups,
        createGroup,
        deleteGroup,
        addMembers,
        removeMember,
        save,
    } = props;

    const [dirty, setDirty] = useState<boolean>();
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string>();
    const [selectedPrincipalId, setSelectedPrincipalId] = useState<number>();
    const [newGroupName, setNewGroupName] = useState<string>('');

    const onSave = useCallback(() => {
        setErrorMsg(undefined);
        save();
        setDirty(false);
    }, [save]);

    const saveButton = (
        <Button
            className="pull-right alert-button group-management-save-btn"
            bsStyle="success"
            disabled={submitting || !dirty}
            onClick={onSave}
        >
            Save
        </Button>
    );

    const showDetails = useCallback((selectedPrincipalId: number) => {
        setSelectedPrincipalId(selectedPrincipalId);
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
            Object.values(groupMembership).some(group => group.groupName === trimmedName)
        ) {
            setErrorMsg(`Group ${trimmedName} already exists.`);
        } else {
            setDirty(true);
            createGroup(trimmedName);
        }

        setNewGroupName('');
    }, [createGroup, groupMembership, newGroupName]);

    const onAddMember = useCallback(
        (groupId: string, principalId: number, principalName: string, principalType: string) => {
            setSelectedPrincipalId(principalId);
            addMembers(groupId, principalId, principalName, principalType);
            setDirty(true);
        },
        [addMembers]
    );

    const onRemoveMember = useCallback(
        (groupId: string, memberId: number) => {
            setSelectedPrincipalId(undefined);
            removeMember(groupId, memberId);
            setDirty(true);
        },
        [removeMember]
    );

    const selectedPrincipal = useMemo(() => {
        return principalsById?.get(selectedPrincipalId);
    }, [principalsById, selectedPrincipalId]);

    return (
        <Row>
            <Col xs={12} md={showDetailsPanel ? 8 : 12}>
                <Panel>
                    <Panel.Heading> Application Groups and Assignments </Panel.Heading>
                    <Panel.Body className="group-assignment-panel">
                        {dirty && (
                            <div className="group-save-alert">
                                <Alert bsStyle="info">
                                    You have unsaved changes.
                                    {saveButton}
                                </Alert>
                            </div>
                        )}

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

                        {Object.keys(groupMembership).map(id => (
                            <Group
                                key={id}
                                id={id}
                                name={groupMembership[id].groupName}
                                usersAndGroups={usersAndGroups}
                                onClickAssignment={showDetails}
                                members={groupMembership[id].members}
                                selectedPrincipalId={selectedPrincipalId}
                                deleteGroup={deleteGroup}
                                onRemoveMember={onRemoveMember}
                                setDirty={setDirty}
                                addMember={onAddMember}
                            />
                        ))}

                        <div className="group-assignment-panel__footer">
                            {errorMsg && <Alert>{errorMsg}</Alert>}
                            {saveButton}
                        </div>
                    </Panel.Body>
                </Panel>
            </Col>
            {showDetailsPanel && (
                <Col xs={12} md={4}>
                    {selectedPrincipal?.type === 'g' ? (
                        <GroupDetailsPanel
                            principal={selectedPrincipal}
                            policy={policy}
                            rolesByUniqueName={rolesByUniqueName}
                            members={groupMembership[selectedPrincipal?.userId].members}
                        />
                    ) : (
                        <UserDetailsPanel
                            userId={selectedPrincipalId}
                            policy={policy}
                            rolesByUniqueName={rolesByUniqueName}
                        />
                    )}
                </Col>
            )}
        </Row>
    );
});
