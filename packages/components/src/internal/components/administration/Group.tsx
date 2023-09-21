import React, { FC, memo, useCallback, useMemo } from 'react';
import { Col, Row } from 'react-bootstrap';

import { List } from 'immutable';

import { ExpandableContainer } from '../ExpandableContainer';

import { Principal } from '../permissions/models';
import { SelectInput } from '../forms/input/SelectInput';

import { DisableableButton } from '../buttons/DisableableButton';

import { Member, MemberType } from './models';
import { MemberButtons } from './MemberButtons';
import { createGroupedOptions } from './utils';

export interface GroupProps {
    addMember: (groupId: string, principalId: number, principalName: string, principalType: string) => void;
    deleteGroup: (id: string) => void;
    id: string;
    initExpanded: boolean;
    members: Member[];
    name: string;
    onClickAssignment: (selectedUserId: number) => void;
    onRemoveMember: (groupId: string, memberId: number) => void;
    selectedPrincipalId: number;
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
        initExpanded,
    } = props;

    const generateClause = useMemo(() => {
        return (
            <div className="container-expandable-heading--clause">
                <span className="permissions-title"> {name} </span>
            </div>
        );
    }, [name]);

    const generateLinks = useMemo(() => {
        return (
            <span className="container-expandable-heading">
                <span>
                    {members.length} member{members.length !== 1 ? 's' : ''}
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

    const disabledMsg = useMemo(() => {
        return members.length !== 0 ? 'To delete this group, first remove all members.' : undefined;
    }, [members]);

    const onDeleteGroup = useCallback(() => {
        deleteGroup(id);
    }, [deleteGroup, id]);

    const principalsToAdd = useMemo(() => {
        const addedPrincipalIds = new Set(members.map(principal => principal.id));

        return createGroupedOptions(
            usersAndGroups.filter(
                principal => !addedPrincipalIds.has(principal.userId) && principal.userId !== parseInt(id, 10)
            ) as List<Principal>
        );
    }, [members, usersAndGroups, id]);

    const onSelectMember = useCallback(
        (name: string, formValue: any, selected: Principal) => {
            addMember(id, selected.userId, selected.displayName, selected.type);
        },
        [id, addMember]
    );

    const { groups, users } = useMemo(() => {
        return {
            groups: members.filter(member => member.type === MemberType.group),
            users: members.filter(member => member.type === MemberType.user),
        };
    }, [members]);

    return (
        <ExpandableContainer
            clause={generateClause}
            links={generateLinks}
            initExpanded={initExpanded}
            iconFaCls="unlock-alt fa-3x"
            useGreyTheme={true}
            isExpandable={true}
        >
            <div className="permissions-groups-expandable-container">
                <Row className="expandable-container__member-buttons">
                    <MemberButtons
                        members={groups}
                        title="Groups"
                        selectedPrincipalId={selectedPrincipalId}
                        onClick={onClick}
                        onRemove={onRemove}
                    />
                    <MemberButtons
                        members={users}
                        title="Users"
                        selectedPrincipalId={selectedPrincipalId}
                        onClick={onClick}
                        onRemove={onRemove}
                    />
                </Row>

                <Row className="expandable-container__action-container">
                    <Col xs={12} sm={6}>
                        <SelectInput
                            autoValue={false}
                            options={principalsToAdd}
                            placeholder="Add member..."
                            inputClass="col-xs-12"
                            valueKey="userId"
                            labelKey="name"
                            onChange={onSelectMember}
                            selectedOptions={null}
                        />
                    </Col>

                    <Col xs={12} sm={6}>
                        <DisableableButton
                            className="pull-right alert-button"
                            bsStyle="danger"
                            disabledMsg={disabledMsg}
                            onClick={onDeleteGroup}
                        >
                            Delete Empty Group
                        </DisableableButton>
                    </Col>
                </Row>
            </div>
        </ExpandableContainer>
    );
});
