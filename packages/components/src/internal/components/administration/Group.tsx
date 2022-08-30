import React, { Dispatch, FC, memo, SetStateAction, useCallback, useMemo } from 'react';
import { Button, Col, Row } from 'react-bootstrap';

import { List } from 'immutable';

import { ExpandableContainer } from '../ExpandableContainer';

import { RemovableButton } from '../permissions/RemovableButton';
import { Principal } from '../permissions/models';
import { SelectInput } from '../forms/input/SelectInput';

import { Member } from './models';

export interface GroupProps {
    addMember: (groupId: string, principalId: number, principalName: string, principalType: string) => void;
    deleteGroup: (id: string) => void;
    id: string;
    members: Member[];
    name: string;
    onClickAssignment: (selectedUserId: number) => void;
    onRemoveMember: (groupId: string, memberId: number) => void;
    selectedPrincipalId: number;
    setDirty: Dispatch<SetStateAction<boolean>>;
    usersAndGroups: List<Principal>;
}

export const Group: FC<GroupProps> = memo(props => {
    const {
        name,
        id,
        members,
        usersAndGroups,
        onClickAssignment,
        selectedPrincipalId,
        deleteGroup,
        addMember,
        onRemoveMember,
        setDirty,
    } = props;

    const generateClause = useCallback(() => {
        return (
            <div className="container-expandable-heading--clause">
                <span className="permissions-title"> {name} </span>
            </div>
        );
    }, [name]);

    const generateLinks = useCallback(() => {
        const usersCount = members.filter(member => member.type === 'u').length;
        const groupsCount = members.length - usersCount;

        return (
            <span className="container-expandable-heading">
                <span>
                    {usersCount} member{usersCount !== 1 ? 's' : ''}, {groupsCount} group{groupsCount !== 1 ? 's' : ''}
                </span>
            </span>
        );
    }, [members]);

    const onClick = useCallback(
        (userId: number) => {
            onClickAssignment(userId);
        },
        [onClickAssignment]
    );

    const onRemove = useCallback(
        (memberId: number) => {
            onRemoveMember(id, memberId);
        },
        [id, onRemoveMember]
    );

    const generateMemberButtons = useCallback(
        (member: Member[], title: string) => {
            return (
                <Col xs={12} sm={6}>
                    <div>{title}:</div>
                    <ul className="group-members-ul">
                        {member.length > 0 ? (
                            member.map(group => (
                                <li key={group.id} className="group-member-row__member">
                                    <RemovableButton
                                        id={group.id}
                                        display={group.name}
                                        onClick={onClick}
                                        onRemove={onRemove}
                                        bsStyle={selectedPrincipalId === group.id ? 'primary' : undefined}
                                        added={false}
                                    />
                                </li>
                            ))
                        ) : (
                            <li className="group-member-li group-member-none">None</li>
                        )}
                    </ul>
                </Col>
            );
        },
        [onClick, onRemove, selectedPrincipalId]
    );

    const canDeleteGroup = useMemo(() => {
        return members.length !== 0;
    }, [members]);

    const onDeleteGroup = useCallback(() => {
        deleteGroup(id);
        setDirty(true);
    }, [deleteGroup, id, setDirty]);

    const principalsToAdd = useMemo(() => {
        const addedPrincipalIds = new Set(members.map(principal => principal.id));
        return usersAndGroups.filter(
            principal => !addedPrincipalIds.has(principal.get('userId')) && principal.get('userId') !== parseInt(id, 10)
        );
    }, [members, usersAndGroups, id]);

    const onSelectMember = useCallback(
        (name: string, formValue: any, selected: Principal) => {
            addMember(id, selected.get('userId'), selected.get('displayName'), selected.get('type'));
        },
        [id, addMember]
    );

    const { groups, users } = useMemo(() => {
        return {
            groups: members.filter(member => member.type === 'g'),
            users: members.filter(member => member.type === 'u'),
        };
    }, [members]);

    return (
        <ExpandableContainer
            clause={generateClause()}
            links={generateLinks()}
            iconFaCls="users fa-3x"
            useGreyTheme={true}
            isExpandable={true}
        >
            <div className="group-membership-container">
                <Row className="group-membership-container__member-buttons">
                    {generateMemberButtons(groups, 'Groups')}
                    {generateMemberButtons(users, 'Users')}
                </Row>

                <Row className="group-membership-container__action-container">
                    <Col xs={12} sm={6}>
                        <SelectInput
                            autoValue={false}
                            options={principalsToAdd.toArray()}
                            placeholder="Add member..."
                            inputClass="col-xs-12"
                            valueKey="userId"
                            labelKey="name"
                            onChange={onSelectMember}
                            selectedOptions={null}
                        />
                    </Col>

                    <Col xs={12} sm={6}>
                        <Button
                            className="pull-right alert-button"
                            bsStyle="danger"
                            disabled={canDeleteGroup}
                            onClick={onDeleteGroup}
                        >
                            Delete Empty Group
                        </Button>
                    </Col>
                </Row>
            </div>
        </ExpandableContainer>
    );
});
