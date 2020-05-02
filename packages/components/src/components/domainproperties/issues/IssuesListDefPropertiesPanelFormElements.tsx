import React from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { List } from 'immutable';

import { SectionHeading } from '../SectionHeading';

import { DomainFieldLabel } from '../DomainFieldLabel';
import { Principal, SelectInput } from '../../..';

import { IssuesListDefModel } from './models';
import {UserGroup} from "../../permissions/models";
import {getCoreGroups, getCoreUsersInGroups} from "../../permissions/actions";
import produce from "immer";

interface IssuesListDefBasicPropertiesInputsProps {
    model: IssuesListDefModel;
    onInputChange?: (any) => void;
    onSelect?: (selected: String, name?: String) => void;
}

interface SecurityUserGroupProps {
    model: IssuesListDefModel;
    coreGroups?: List<Principal>;
    onSelect?: (selected: Principal, name?: String) => any;
    coreUsers?: List<UserGroup>;
}

interface SecurityUserGroupState {
    coreGroups?: List<Principal>;
    coreUsers?: List<UserGroup>;
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

export class AssignmentOptions extends React.PureComponent<SecurityUserGroupProps> {
    render() {
        const { model, coreUsers, coreGroups, onSelect } = this.props;
        return (
            <Col xs={12} md={6}>
                <SectionHeading title="Assignment Options" />
                <AssignedToGroupInput
                    model={model}
                    coreGroups={coreGroups}
                    onSelect={onSelect}
                />
                <DefaultUserAssignmentInput model={model} coreUsers={coreUsers} onSelect={onSelect} />
            </Col>
        );
    }
}

export class SingularItemNameInput extends React.PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.singularItemName === null ? '' : model.singularItemName;
        return (
            <Row className="margin-top">
                <Col xs={3} lg={2}>
                    <DomainFieldLabel label="Singular item name" required={false} />
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl
                        id="singularItemName"
                        type="text"
                        placeholder="Enter a singular name for this Issue"
                        value={value}
                        onChange={onInputChange}
                    />
                </Col>

                <Col lg={2} />
            </Row>
        );
    }
}

export class PluralItemNameInput extends React.PureComponent<IssuesListDefBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.pluralItemName === null ? '' : model.pluralItemName;
        return (
            <Row className="margin-top">
                <Col xs={3} lg={2}>
                    <DomainFieldLabel label="Plural items name" required={false} />
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl
                        id="pluralItemName"
                        type="text"
                        placeholder="Enter a plural name for this Issue"
                        value={value}
                        onChange={onInputChange}
                    />
                </Col>

                <Col lg={2} />
            </Row>
        );
    }
}

export class CommentSortDirectionDropDown extends React.PureComponent<IssuesListDefBasicPropertiesInputsProps> {

    getHelpTip() {
        return "By default, comments on an issue are shown in the order they are added, oldest first. Change the Comment Sort Direction to newest first if you prefer."
    }

    onChange = (name: string, formValue: any, selected: String, ref: any): any => {
        if (selected && this.props.onSelect) {
            this.props.onSelect(selected, name);
        }
    };

    render() {
        const { model, onSelect } = this.props;

        let sortDirectionOptions = [];
        sortDirectionOptions.push({label: "Oldest first", id: "ASC"});
        sortDirectionOptions.push({label: "Newest first", id: "DESC"});

        return (
            <Row className="margin-top">
                <Col xs={3} lg={2}>
                    <DomainFieldLabel label="Comment sort direction" helpTipBody={this.getHelpTip} required={false} />
                </Col>

                <Col xs={9} lg={8}>
                    <SelectInput
                        name={"commentSortDirection"}
                        options={sortDirectionOptions}
                        inputClass={'col-xs-12'}
                        valueKey={'id'}
                        onChange={this.onChange}
                        value={model.commentSortDirection}
                        formsy={false}
                        showLabel={true}
                        multiple={false}
                        required={false}
                        placeholder={''}
                    />
                </Col>

                <Col lg={2} />
            </Row>
        );
    }
}

export class AssignedToGroupInput extends React.PureComponent<SecurityUserGroupProps, any> {
    onChange = (name: string, formValue: any, selected: Principal, ref: any): any => {
        if (selected && this.props.onSelect) {
            this.props.onSelect(selected, name);
        }
    };

    render() {
        const { coreGroups } = this.state;
        const name = 'addGroupAssignment';
        return (
            <Row className="margin-top">
                <Col xs={3} lg={2}>
                    <DomainFieldLabel label="Assigned to list comes from" required={false} />
                </Col>
                <Col xs={9} lg={8}>
                    <SelectInput
                        name={name}
                        options={coreGroups.toArray()}
                        placeholder=""
                        inputClass="col-xs-12"
                        valueKey="userId"
                        labelKey="displayName"
                        onChange={this.onChange}
                        formsy={false}
                        showLabel={false}
                        multiple={false}
                        required={false}
                    />
                </Col>
                <Col lg={2} />
            </Row>
        );
    }
}

export class DefaultUserAssignmentInput extends React.PureComponent<SecurityUserGroupProps, any> {
    onChange = (name: string, formValue: any, selected: Principal, ref: any): any => {
        if (selected && this.props.onSelect) {
            this.props.onSelect(selected, name);
        }
    };

    getFilteredCoreUsers = (groupId: any, coreUsers: List<UserGroup>) => {
        let filteredCoreUser = coreUsers.filter(coreUser => {
            return coreUser.groupId === groupId;
        });
        return filteredCoreUser.toArray().length > 0 ? filteredCoreUser.toArray() : coreUsers.toArray();
    };

    render() {
        const { coreUsers } = this.state;
        const name = 'defaultUserAssignment';

        return (
            <Row className="margin-top">
                <Col xs={3} lg={2}>
                    <DomainFieldLabel label="Default user assignment" required={false} />
                </Col>
                <Col xs={9} lg={8}>
                    <SelectInput
                        name={name}
                        options={this.getFilteredCoreUsers(this.props.model.assignedToGroup, coreUsers)}
                        placeholder=""
                        inputClass="col-xs-12"
                        valueKey="userId"
                        labelKey="userName"
                        onChange={this.onChange}
                        formsy={false}
                        showLabel={false}
                        multiple={false}
                        required={false}
                    />
                </Col>
                <Col lg={2} />
            </Row>
        );
    }
}
