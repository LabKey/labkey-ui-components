import React from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { List } from 'immutable';

import produce from 'immer';

import { SectionHeading } from '../SectionHeading';

import { DomainFieldLabel } from '../DomainFieldLabel';
import { LoadingSpinner, Principal, SelectInput } from '../../..';

import { UserGroup } from '../../permissions/models';

import { getCoreGroups } from '../../permissions/actions';

import { IssuesListDefModel } from './models';
import {
    ISSUES_LIST_DEF_SORT_DIRECTION_TIP,
    ISSUES_LIST_DEF_SINGULAR_PLURAL_TIP,
    ISSUES_LIST_GROUP_ASSIGN_TIP,
    ISSUES_LIST_USER_ASSIGN_TIP,
} from './constants';
import {ActionURL, Ajax, Utils} from "@labkey/api";

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
    coreUsersLoading?: boolean
    // coreUsers?: List<UserGroup>;
}

// For AssignedToGroupInput & DefaultUserAssignmentInput components
interface AssignmentOptionsInputProps {
    model: IssuesListDefModel;
    onSelect: (name: string, value: any) => any;
    coreGroups?: List<Principal>;
    coreUsersLoading?: boolean
    // coreUsers?: List<UserGroup>;
}

export class BasicPropertiesFields extends React.PureComponent<IssuesListDefBasicPropertiesInputsProps> {
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

export class AssignmentOptions extends React.PureComponent<AssignmentOptionsProps, AssignmentOptionsState> {
    constructor(props: any) {
        super(props);

        this.state = produce(
            {
                coreGroups: undefined,
                coreUsersLoading: undefined,
                // coreUsers: undefined,
            },
            () => {}
        );
    }

    componentDidMount() {
        getCoreGroups().then((coreGroupsData: List<Principal>) => {
            this.setState(() => ({
                coreGroups: coreGroupsData,
            }));
        });
    }

    render() {
        const { model, onSelect } = this.props;
        const { coreGroups } = this.state;
        // const { coreUsers, coreGroups } = this.state;
        return (
            <Col xs={12} md={6}>
                <SectionHeading title="Assignment Options" />
                <AssignedToGroupInput model={model} coreGroups={coreGroups} onSelect={onSelect} />
                <DefaultUserAssignmentInput model={model} onSelect={onSelect} />
            </Col>
        );
    }
}

export class SingularItemNameInput extends React.PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    getIssueNameHelpTip() {
        return ISSUES_LIST_DEF_SINGULAR_PLURAL_TIP;
    }
    render() {
        const { model, onInputChange } = this.props;
        const value = model.singularItemName === null ? '' : model.singularItemName;
        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Singular Item Name"
                        helpTipBody={this.getIssueNameHelpTip}
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

export class PluralItemNameInput extends React.PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    getIssueNameHelpTip() {
        return ISSUES_LIST_DEF_SINGULAR_PLURAL_TIP;
    }

    render() {
        const { model, onInputChange } = this.props;
        const value = model.pluralItemName === null ? '' : model.pluralItemName;
        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Plural Items Name"
                        helpTipBody={this.getIssueNameHelpTip}
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

export class CommentSortDirectionDropDown extends React.PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    getHelpTip() {
        return ISSUES_LIST_DEF_SORT_DIRECTION_TIP;
    }

    onChange = (name: string, formValue: any, selected: any, ref: any): any => {
        if (selected && this.props.onSelect) {
            this.props.onSelect(name, selected.id);
        }
    };

    render() {
        const { model } = this.props;

        const sortDirectionOptions = [];
        sortDirectionOptions.push({ label: 'Oldest first', id: 'ASC' });
        sortDirectionOptions.push({ label: 'Newest first', id: 'DESC' });

        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel label="Comment Sort Direction" helpTipBody={this.getHelpTip} required={false} />
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

export class AssignedToGroupInput extends React.PureComponent<AssignmentOptionsInputProps, any> {
    getHelpTip() {
        return ISSUES_LIST_GROUP_ASSIGN_TIP;
    }

    onChange = (name: string, formValue: any, selected: Principal, ref: any): any => {
        this.props.onSelect(name, selected ? selected.userId : undefined);
    };

    render() {
        const { model, coreGroups } = this.props;

        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel
                        label="Populate ‘Assigned To’ Field from"
                        helpTipBody={this.getHelpTip}
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

export class DefaultUserAssignmentInput extends React.PureComponent<AssignmentOptionsInputProps, any> {
    getHelpTip() {
        return ISSUES_LIST_USER_ASSIGN_TIP;
    }

    onChange = (name: string, formValue: any, selected: UserGroup, ref: any): any => {
        this.props.onSelect(name, selected ? selected.userId : undefined);
    };

    getFilteredCoreUsers = (groupId: any): any => {
        this.getUsersForGroup(groupId).then(users => {
            let coreUsers = List<UserGroup>();
            users.forEach(user => {
                coreUsers.push(UserGroup.create(user));
            });
            return coreUsers.size > 0 ? coreUsers.toArray() : undefined;
        });
    };

    getUsersForGroup = (groupId: any): Promise<any> => {
        return new Promise((resolve, reject) => {
            Ajax.request({
                url: ActionURL.buildURL('issues', 'GetUsersForGroup'),
                method: 'GET',
                params: {groupId},
                scope: this,
                success: Utils.getCallbackWrapper(data => {
                    resolve(data);
                }),
                failure: Utils.getCallbackWrapper(error => {
                    reject(error);
                }),
            });
        });
    };

    render() {
        const { model } = this.props;

        //TODO : add loading spinner
        return (
            <Row className="margin-top">
                <Col xs={3} lg={4}>
                    <DomainFieldLabel label="Default User Assignment" helpTipBody={this.getHelpTip} required={false} />
                </Col>
                <Col xs={9} lg={8}>
                        <SelectInput
                            name="assignedToUser"
                            options={this.getFilteredCoreUsers(model.assignedToGroup)}
                            placeholder="Unassigned"
                            inputClass="col-xs-12"
                            valueKey="userId"
                            labelKey="userName"
                            onChange={this.onChange}
                            value={model.assignedToUser ? model.assignedToUser : undefined}
                            formsy={false}
                            showLabel={false}
                            multiple={false}
                            required={false}
                        />
                </Col>
            </Row>
        );
    }
}
