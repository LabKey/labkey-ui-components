import React from "react";
import {Col, FormControl, Row} from "react-bootstrap";
import {SectionHeading} from "../SectionHeading";
import {IssuesModel} from "./models";
import {DomainFieldLabel} from "../DomainFieldLabel";
import {Principal, SecurityRole, SelectInput} from "../../..";
import {List} from "immutable";

interface IssuesBasicPropertiesInputsProps {
    model: IssuesModel;
    onInputChange: (any) => void;
}
interface SecurityGroupsProps {
    model: IssuesModel;
    coreGroups?: List<Principal>;
    onSelect?: (selected: Principal) => any;
}

export class IssuesBasicPropertiesFields extends React.PureComponent<IssuesBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        return (
            <Col xs={11} md={6}>
                <SectionHeading title="Basic Properties" />
                <CommentSortDirectionDropDown model={model} onInputChange={onInputChange} />
                <SingularItemNameInput model={model} onInputChange={onInputChange} />
                <PluralItemNameInput model={model} onInputChange={onInputChange} />
            </Col>
        );
    }
}

export class AssignmentOptions extends React.PureComponent<SecurityGroupsProps> {
    render() {
        const { model, coreGroups, onSelect } = this.props;
        return (
            <Col xs={11} md={6}>
                <SectionHeading title="Assignment Options" />
                <AssignedToGroupInput model={model} coreGroups={coreGroups} onSelect={(selected: Principal) => onSelect(selected)} />
                {/*<DefaultUserAssignmentInput model={model} coreUsers={coreUsers} onInputChange={onInputChange} />*/}
            </Col>
        );
    }
}

export class SingularItemNameInput extends React.PureComponent<IssuesBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.name === null ? '' : model.name;
        return (
            <Row className="margin-top">
                <Col xs={3} lg={2}>
                    <DomainFieldLabel
                        label="Singular item name"
                        required={false}
                    />
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

export class PluralItemNameInput extends React.PureComponent<IssuesBasicPropertiesInputsProps> {
    render() {
        const { model, onInputChange } = this.props;
        const value = model.name === null ? '' : model.name;
        return (
            <Row className="margin-top">
                <Col xs={3} lg={2}>
                    <DomainFieldLabel
                        label="Plural items name"
                        required={false}
                    />
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

export class CommentSortDirectionDropDown extends React.PureComponent<IssuesBasicPropertiesInputsProps> {
    render()
    {
        const {model, onInputChange} = this.props;
        const value = model.commentSortDirection;

        return (
            <Row className="margin-top">
                <Col xs={3} lg={2}>
                    <DomainFieldLabel
                        label="Comment sort direction"
                        required={false}
                    />
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl
                        componentClass="select"
                        id="commentSortDirection"
                        onChange={onInputChange}
                        value={value ? value : ''}
                    >
                        <option
                            key={'Oldest first'}
                            value={'ASC'}
                        >
                            Oldest first
                        </option>
                        <option
                            key={'Newest first'}
                            value={'DESC'}
                        >
                            Newest first
                        </option>
                    </FormControl>
                </Col>

                <Col lg={2}/>
            </Row>
        );
    }
}

export class AssignedToGroupInput extends React.PureComponent<SecurityGroupsProps, any> {

    onChange = (name: string, formValue: any, selected: Principal, ref: any): any => {
        if (selected && this.props.onSelect) {
            this.props.onSelect(selected);
        }
    };

    render() {
        const { coreGroups } = this.props;
        const name = 'addGroupAssignment';
        return (
            <Row className="margin-top">
                <Col xs={3} lg={2}>
                    <DomainFieldLabel
                        label="Assigned to list comes from"
                        required={false}
                    />
                </Col>
                <Col xs={9} lg={8}>
                    <SelectInput
                        name={name}
                        options={coreGroups.toArray()}
                        placeholder=''
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

export class DefaultUserAssignmentInput extends React.PureComponent<SecurityGroupsProps, any> {

    onChange = (name: string, formValue: any, selected: Principal, ref: any): any => {
        if (selected && this.props.onSelect) {
            this.props.onSelect(selected);

            // setting the react-select value back to null will clear it but leave it as focused
            ref.setValue(null);
        }
    };

    render() {
        const { coreGroups } = this.props;
        const name = 'defaultUserAssignment';
        return (
            <Row className="margin-top">
                <Col xs={3} lg={2}>
                    <DomainFieldLabel
                        label="Default user assignment"
                        required={false}
                    />
                </Col>
                <Col xs={9} lg={8}>
                    <SelectInput
                        name={name}
                        options={coreGroups.toArray()}
                        placeholder=''
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
