import React, { PureComponent } from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { List } from 'immutable';

import produce from 'immer';

import { SectionHeading } from '../SectionHeading';

import { DomainFieldLabel } from '../DomainFieldLabel';
import { LoadingSpinner, Principal, SelectInput } from '../../../..';

import { IssuesListDefModel } from './models';
import {
    ISSUES_LIST_DEF_SORT_DIRECTION_TIP,
    ISSUES_LIST_DEF_SINGULAR_PLURAL_TIP,
    ISSUES_LIST_GROUP_ASSIGN_TIP,
    ISSUES_LIST_USER_ASSIGN_TIP,
} from './constants';
import { getProjectGroups, getUsersForGroup } from './actions';

interface IssuesListDefBasicPropertiesInputsProps {
    model: IssuesListDefModel;
    onInputChange?: (any) => void;
    onSelect?: (name: string, value: any) => any;
}

interface AssignmentOptionsProps {
    model: IssuesListDefModel;
    onSelect: (name: string, value: any) => any;
}

interface AssignmentOptionsState {
    coreGroups?: List<Principal>;
    coreUsers?: List<Principal>;
}

// For AssignedToGroupInput & DefaultUserAssignmentInput components
interface AssignmentOptionsInputProps {
    model: IssuesListDefModel;
    onSelect: (name: string, value: any) => any;
    coreGroups?: List<Principal>;
    coreUsers?: List<Principal>;
    onGroupChange?: (groupId: number) => any;
}

export class BasicPropertiesFields extends PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange, onSelect } = this.props;
        return (
            <Col xs={12} md={6}>
                <SectionHeading title="Basic Properties" />
                <CommentSortDirectionDropDown model={model} onSelect={onSelect} />
                <SingularItemNameInput model={model} onInputChange={onInputChange} />
                <PluralItemNameInput model={model} onInputChange={onInputChange} />
            </Col>
        );
    }
}

export class AssignmentOptions extends PureComponent<AssignmentOptionsProps, AssignmentOptionsState> {
    constructor(props: any) {
        super(props);

        this.state = produce(
            {
                coreGroups: undefined,
                coreUsers: undefined,
            },
            () => {}
        );
    }

    handleGroupChange = (groupId: number) => {
        this.getFilteredCoreUsers(groupId);
    };

    componentDidMount() {
        getProjectGroups().then(coreGroupsData => {
            this.setState(() => ({
                coreGroups: coreGroupsData,
            }));
        });

        this.getFilteredCoreUsers(this.props.model.assignedToGroup);
    }

    getFilteredCoreUsers = (groupId: any): any => {
        getUsersForGroup(groupId).then(coreUsersData => {
            this.setState(() => ({
                coreUsers: coreUsersData,
            }));
        });
    };

    render() {
        const { model, onSelect } = this.props;
        const { coreUsers, coreGroups } = this.state;

        return (
            <Col xs={12} md={6}>
                <SectionHeading title="Assignment Options" />
                <AssignedToGroupInput
                    model={model}
                    coreGroups={coreGroups}
                    onSelect={onSelect}
                    onGroupChange={this.handleGroupChange}
                />
                <DefaultUserAssignmentInput model={model} coreUsers={coreUsers} onSelect={onSelect} />
            </Col>
        );
    }
}

export class SingularItemNameInput extends PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.singularItemName === null ? '' : model.singularItemName;
        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Singular Item Name"
                        helpTipBody={ISSUES_LIST_DEF_SINGULAR_PLURAL_TIP}
                        required={false}
                    />
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl id="singularItemName" type="text" value={value} onChange={onInputChange} />
                </Col>
            </Row>
        );
    }
}

export class PluralItemNameInput extends PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.pluralItemName === null ? '' : model.pluralItemName;
        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Plural Items Name"
                        helpTipBody={ISSUES_LIST_DEF_SINGULAR_PLURAL_TIP}
                        required={false}
                    />
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl id="pluralItemName" type="text" value={value} onChange={onInputChange} />
                </Col>
            </Row>
        );
    }
}

export class CommentSortDirectionDropDown extends PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    onChange = (name: string, formValue: any, selected: any): void => {
        if (selected) {
            this.props.onSelect?.(name, selected.id);
        }
    };

    render() {
        const { model } = this.props;

        const sortDirectionOptions = [
            { label: 'Oldest first', id: 'ASC' },
            { label: 'Newest first', id: 'DESC' },
        ];

        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Comment Sort Direction"
                        helpTipBody={ISSUES_LIST_DEF_SORT_DIRECTION_TIP}
                        required={false}
                    />
                </Col>

                <Col xs={9} lg={8}>
                    <SelectInput
                        name="commentSortDirection"
                        options={sortDirectionOptions}
                        inputClass="col-xs-12"
                        valueKey="id"
                        onChange={this.onChange}
                        value={model.commentSortDirection ? model.commentSortDirection : 'ASC'}
                        formsy={false}
                        showLabel={true}
                        multiple={false}
                        required={false}
                        clearable={false}
                    />
                </Col>
            </Row>
        );
    }
}

export class AssignedToGroupInput extends PureComponent<AssignmentOptionsInputProps, any> {
    onChange = (name: string, formValue: any, selected: Principal, ref: any): void => {
        const groupId = selected ? selected.userId : undefined;
        this.props.onGroupChange(groupId);
        this.props.onSelect(name, groupId);
    };

    render() {
        const { model, coreGroups } = this.props;

        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Populate ‘Assigned To’ Field from"
                        helpTipBody={ISSUES_LIST_GROUP_ASSIGN_TIP}
                        required={false}
                    />
                </Col>
                <Col xs={9} lg={8}>
                    {!coreGroups ? (
                        <LoadingSpinner />
                    ) : (
                        <SelectInput
                            name="assignedToGroup"
                            options={coreGroups.toArray()}
                            placeholder="All Project Users"
                            inputClass="col-xs-12"
                            valueKey="userId"
                            labelKey="displayName"
                            onChange={this.onChange}
                            value={model.assignedToGroup ? model.assignedToGroup : undefined}
                            formsy={false}
                            showLabel={false}
                            multiple={false}
                            required={false}
                        />
                    )}
                </Col>
            </Row>
        );
    }
}

export class DefaultUserAssignmentInput extends PureComponent<AssignmentOptionsInputProps, any> {
    onChange = (name: string, formValue: any, selected: Principal, ref: any): any => {
        this.props.onSelect(name, selected ? selected.userId : undefined);
    };

    render() {
        const { model, coreUsers } = this.props;

        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Default User Assignment"
                        helpTipBody={ISSUES_LIST_USER_ASSIGN_TIP}
                        required={false}
                    />
                </Col>
                <Col xs={9} lg={8}>
                    {!coreUsers ? (
                        <LoadingSpinner />
                    ) : (
                        <SelectInput
                            name="assignedToUser"
                            options={coreUsers ? coreUsers.toArray() : undefined}
                            placeholder="Unassigned"
                            inputClass="col-xs-12"
                            valueKey="userId"
                            labelKey="displayName"
                            onChange={this.onChange}
                            value={model.assignedToUser ? model.assignedToUser : undefined}
                            formsy={false}
                            showLabel={false}
                            multiple={false}
                            required={false}
                        />
                    )}
                </Col>
            </Row>
        );
    }
}
