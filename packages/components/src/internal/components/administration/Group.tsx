import React, { FC, memo, useCallback, useMemo } from 'react';
import { Button } from 'react-bootstrap';

import { List } from 'immutable';

import { ExpandableContainer } from '../ExpandableContainer';

import { RemovableButton } from '../permissions/RemovableButton';
import { Principal } from '../permissions/models';
import { SelectInput } from '../forms/input/SelectInput';


export interface GroupProps {
    addMember: any;
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
            principal => !addedPrincipalIds.has(principal.get('userId')) && principal.get('userId') !== parseInt(id)
        );
    }, [members, usersAndGroups, id]);

    const onSelectMember = useCallback(
        (name: string, formValue: any, selected: Principal) => {
            addMember(id, selected.get('userId'), selected.get('displayName'), selected.get('type'));
        },
        [id, addMember]
    );

    return (
        <ExpandableContainer
            clause={generateClause()}
            links={generateLinks()}
            iconFaCls="users fa-3x"
            useGreyTheme={true}
            isExpandable={true}
        >
            <div className="group-membership-container">
                <Button
                    className="pull-right alert-button"
                    bsStyle="danger"
                    disabled={canDeleteGroup}
                    onClick={onDeleteGroup}
                >
                    Delete Empty Group
                </Button>

                <div className="group-member-row">
                    {members.map(member => (
                        <li key={member.id} className="group-member-row__member">
                            <RemovableButton
                                id={member.id}
                                display={member.name}
                                onClick={userId => {
                                    onClickAssignment(userId);
                                }}
                                onRemove={memberId => {
                                    onRemoveMember(id, memberId);
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
                    onChange={onSelectMember}
                    selectedOptions={null}
                />
            </div>
        </ExpandableContainer>
    );
});
