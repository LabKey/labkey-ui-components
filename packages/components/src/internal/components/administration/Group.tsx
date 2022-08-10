import React, {FC, memo, useCallback, useEffect, useMemo, useState} from "react";
import {Button, Col, Row} from 'react-bootstrap';
import {GroupAssignmentsProps} from "./GroupAssignments";
import {ExpandableContainer} from "../ExpandableContainer";
import {AppContext, useAppContext} from "../../AppContext";
import {resolveErrorMessage} from "../../util/messaging";
import {LoadingState} from "../../../public/LoadingState";
import {RemovableButton} from "../permissions/RemovableButton";
import {Principal, SecurityAssignment} from "../permissions/models";
import {SelectInput} from "../forms/input/SelectInput";
import {getPrincipals} from "../security/actions";
import {List} from "immutable";

export interface GroupProps {
    name: string;
    id: any;
    usersAndGroups: List<Principal>;
    members: any;
    onClickAssignment: (selectedUserId: number) => void;
    selectedPrincipalId: number;
    deleteGroup: any;
    setDirty: any;
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
        setDirty
    } = props;

    const generateClause = useCallback(() => {
        return (
            <div className="container-expandable-heading--clause">
                <span className="permissions-title"> {name} </span>
            </div>
        );
    },[]);

    const generateLinks = useCallback(() => {
        const usersCount = members.users.length ?? 0;
        const groupsCount = members.groups.length ?? 0;


        return (
            <span className="container-expandable-heading">
                <span>
                    {usersCount} member{usersCount !== 1 ? 's' : ''}, {groupsCount} group{groupsCount !== 1 ? 's' : ''}
                </span>
            </span>
        );
    }, [members]);

    const canDeleteGroup = useMemo(() => {
        return members.users.length !== 0 || members.groups.length !== 0;
    }, [members]);

    const onDeleteGroup = useCallback(() => {
        deleteGroup(id);
        setDirty(true);
    }, [deleteGroup]);

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
                    {(members.groups.concat(members.users)).map(principal => (
                        <li key={principal.id} className="permissions-member-li">
                            <RemovableButton
                                id={principal.id}
                                display={principal.name}
                                onClick={(userId) => {onClickAssignment(userId)}}
                                onRemove={() => {}}
                                bsStyle={selectedPrincipalId === principal.id ? 'primary' : undefined}
                                added={false}
                            />
                        </li>
                    ))}
                </div>

                <SelectInput
                    autoValue={false}
                    options={usersAndGroups.toArray()}
                    placeholder={'Add member...'}
                    inputClass="col-xs-12"
                    valueKey="userId"
                    labelKey="name"
                    onChange={() => {}}
                    selectedOptions={null}
                />
            </div>

        </ExpandableContainer>
        );
});

