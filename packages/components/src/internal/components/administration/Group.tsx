import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';

import { List } from 'immutable';

import { ExpandableContainer } from '../ExpandableContainer';

import { AppContext, useAppContext } from '../../AppContext';
import { resolveErrorMessage } from '../../util/messaging';
import { LoadingState } from '../../../public/LoadingState';
import { RemovableButton } from '../permissions/RemovableButton';
import { Principal, SecurityAssignment, SecurityPolicy, SecurityRole } from '../permissions/models';
import { SelectInput } from '../forms/input/SelectInput';
import { getPrincipals } from '../security/actions';

import { GroupAssignmentsProps } from './GroupAssignments';

export interface GroupProps {
    addUser: any;
    deleteGroup: any;
    id: any;
    members: any;
    name: string;
    onClickAssignment: (selectedUserId: number) => void;
    onRemoveMember: any;
    selectedPrincipalId: number;
    setDirty: any;
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
        addUser,
        onRemoveMember,
        setDirty,
    } = props;

    const generateClause = useCallback(() => {
        return (
            <div className="container-expandable-heading--clause">
                <span className="permissions-title"> {name} </span>
            </div>
        );
    }, []);

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

    const canDeleteGroup = useMemo(() => {
        return members.length !== 0;
    }, [members]);

    const onDeleteGroup = useCallback(() => {
        deleteGroup(id);
        setDirty(true);
    }, [deleteGroup]);

    const principalsToAdd = useMemo(() => {
        const addedPrincipalIds = new Set(members.map(principal => principal.id));
        return usersAndGroups.filter(
            principal => !addedPrincipalIds.has(principal.get('userId')) && principal.get('userId') !== parseInt(id)
        );
    }, [members, usersAndGroups, id]);

    const addAssignment = useCallback(
        (name: string, formValue: any, selected: Principal) => {
            addUser(selected.get('userId'), id, selected.get('displayName'), selected.get('type'));
        },
        [id, addUser]
    );

    return (
        <ExpandableContainer
            clause={generateClause()}
            links={generateLinks()}
            iconFaCls="users fa-3x"
            useGreyTheme={true}
            isExpandable={true}
        >
            <div className="permissions-role-container">
                <Button
                    className="pull-right alert-button"
                    bsStyle="danger"
                    disabled={canDeleteGroup}
                    onClick={onDeleteGroup}
                >
                    Delete Empty Group
                </Button>

                <div className="group-assignments-row">
                    {members.map(member => (
                        <li key={member.id} className="permissions-member-li">
                            <RemovableButton
                                id={member.id}
                                display={member.name}
                                onClick={userId => {
                                    onClickAssignment(userId);
                                }}
                                onRemove={memberId => {
                                    onRemoveMember(memberId, id);
                                }}
                                bsStyle={selectedPrincipalId === member.id ? 'primary' : undefined}
                                added={false}
                            />
                        </li>
                    ))}
                </div>

                <SelectInput
                    autoValue={false}
                    options={principalsToAdd.toArray()}
                    placeholder="Add member..."
                    inputClass="col-xs-12"
                    valueKey="userId"
                    labelKey="name"
                    onChange={addAssignment}
                    selectedOptions={null}
                />
            </div>
        </ExpandableContainer>
    );
});
