import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Checkbox, Col, Panel, Row } from 'react-bootstrap';

import { List, Map } from 'immutable';

import { Alert } from '../base/Alert';

import { Principal, SecurityPolicy, SecurityRole } from '../permissions/models';
import { UserDetailsPanel } from '../user/UserDetailsPanel';
import { GroupDetailsPanel } from '../permissions/GroupDetailsPanel';

import { Group } from './Group';

export interface GroupAssignmentsProps {
    addGroup: any;
    addUser: any;
    deleteGroup: any;

    // TODO
    groupMembership: any;
    policy: SecurityPolicy;
    // taken from InjectedPermissionsPage
    principalsById: Map<number, Principal>;
    removeMember: any;
    rolesByUniqueName: Map<string, SecurityRole>;

    save: any;
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
        addGroup,
        deleteGroup,
        addUser,
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
            className="pull-right alert-button permissions-assignment-save-btn"
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

    const selectedPrincipal = useMemo(() => {
        return principalsById?.get(selectedPrincipalId);
    }, [principalsById, selectedPrincipalId]);

    const onChangeNewGroupName = useCallback(
        (event: ChangeEvent<HTMLInputElement>) => setNewGroupName(event.target.value),
        [newGroupName]
    );

    const onAddNewGroup = useCallback(() => {
        setErrorMsg(undefined);

        const trimmedName = newGroupName.trim();
        if (
            trimmedName in groupMembership ||
            Object.values(groupMembership).some(group => group['groupName'] === trimmedName)
        ) {
            // todo flag for typing
            setErrorMsg(`Group ${trimmedName} already exists.`);
        } else {
            setDirty(true);
            addGroup(trimmedName);
        }

        setNewGroupName('');
    }, [newGroupName]);

    const onAddPrincipal = useCallback(
        (userId: number, principalId: string, principalName: string, principalType: string) => {
            setSelectedPrincipalId(userId);
            addUser(userId, principalId, principalName, principalType);
            setDirty(true);
        },
        [addUser]
    );

    const onRemoveMember = useCallback(
        (memberId: number, groupId: string) => {
            setSelectedPrincipalId(undefined);
            removeMember(memberId, groupId);
            setDirty(true);
        },
        [removeMember]
    );

    return (
        <Row>
            <Col xs={12} md={showDetailsPanel ? 8 : 12}>
                <Panel>
                    <Panel.Heading> Application Groups and Assignments </Panel.Heading>
                    <Panel.Body className="group-assignment-panel">
                        {dirty && (
                            <div className="permissions-save-alert">
                                <Alert bsStyle="info">
                                    You have unsaved changes.
                                    {saveButton}
                                </Alert>
                            </div>
                        )}

                        <div className="create-group">
                            <input
                                className="form-control create-group-input"
                                placeholder="New group name"
                                name="create-group"
                                value={newGroupName}
                                onChange={onChangeNewGroupName}
                            />

                            <Button
                                className="alert-button"
                                bsStyle="info"
                                disabled={newGroupName.trim() === ''}
                                onClick={onAddNewGroup}
                            >
                                Create Group
                            </Button>
                        </div>

                        {Object.keys(groupMembership).map(k => (
                            <Group
                                key={k}
                                id={k}
                                name={groupMembership[k].groupName}
                                usersAndGroups={usersAndGroups}
                                onClickAssignment={showDetails}
                                members={groupMembership[k].members}
                                selectedPrincipalId={selectedPrincipalId}
                                deleteGroup={deleteGroup}
                                onRemoveMember={onRemoveMember}
                                setDirty={setDirty}
                                addUser={onAddPrincipal}
                            />
                        ))}

                        {/* todo: styling instead of br */}
                        <br />
                        {errorMsg && <Alert>{errorMsg}</Alert>}
                        {saveButton}
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
