import React, { ReactNode } from 'react';
import { Button, Checkbox, Col, FormControl, Row } from 'react-bootstrap';

import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { createFormInputId, createFormInputName, getNameFromId } from '../actions';
import {
    DOMAIN_VALIDATOR_DESCRIPTION,
    DOMAIN_VALIDATOR_ERRORMESSAGE,
    DOMAIN_VALIDATOR_EXPRESSION,
    DOMAIN_VALIDATOR_FAILONMATCH,
    DOMAIN_VALIDATOR_NAME,
    DOMAIN_VALIDATOR_REMOVE,
} from '../constants';

import { PropertyValidator } from '../models';
import { PropDescType } from '../PropDescType';
import { LabelHelpTip } from '../../../..';

interface RegexValidationOptionsProps {
    validator: any;
    index: number;
    domainIndex: number;
    validatorIndex: number;
    expanded: boolean;
    onExpand: (index: number) => any;
    dataType: PropDescType;
    onChange: (validator: PropertyValidator, index: number) => any;
    onDelete: (index: number) => any;
}

export class RegexValidationOptions extends React.PureComponent<RegexValidationOptionsProps, any> {
    labelWidth = 4;
    fieldWidth = 8;

    static isValid = (validator: PropertyValidator) => {
        return !!validator.get('expression') && !!validator.get('name');
    };

    renderRowTextbox(
        label: string,
        name: string,
        value: string,
        tooltipTitle?: string,
        tooltipBody?: ReactNode,
        required?: boolean
    ) {
        const { validatorIndex, domainIndex } = this.props;

        return (
            <Row className="domain-validator-filter-row">
                <Col xs={this.labelWidth}>
                    <div>
                        {label}
                        {tooltipTitle && tooltipBody && (
                            <LabelHelpTip title={tooltipTitle} required={required}>
                                {tooltipBody}
                            </LabelHelpTip>
                        )}
                    </div>
                </Col>
                <Col xs={this.fieldWidth}>
                    <div>
                        <FormControl
                            componentClass="textarea"
                            className="domain-validation-textarea"
                            rows={3}
                            id={createFormInputId(name, domainIndex, validatorIndex)}
                            name={createFormInputName(name)}
                            value={value}
                            onChange={this.onChange}
                        />
                    </div>
                </Col>
            </Row>
        );
    }

    renderFailValidationCheckbox(value: boolean) {
        const { validatorIndex, domainIndex } = this.props;

        return (
            <Row>
                <Col xs={this.labelWidth} />
                <Col xs={this.fieldWidth} className="domain-validation-failOnMatch-row">
                    <Checkbox
                        id={createFormInputId(DOMAIN_VALIDATOR_FAILONMATCH, domainIndex, validatorIndex)}
                        name={createFormInputName(DOMAIN_VALIDATOR_FAILONMATCH)}
                        checked={value}
                        onChange={this.onChange}
                    >
                        Fail validation when pattern matches field value
                        <LabelHelpTip title="Fail when pattern matches?">
                            By default, validation will fail if the field value does not match the specified regular
                            expression. Check this box if you want validation to fail when the pattern matches the field
                            value.
                        </LabelHelpTip>
                    </Checkbox>
                </Col>
            </Row>
        );
    }

    renderName(value: string) {
        const { validatorIndex, domainIndex } = this.props;

        return (
            <Row>
                <Col xs={this.labelWidth}>
                    <div>Name *</div>
                </Col>
                <Col xs={this.fieldWidth}>
                    <FormControl
                        type="text"
                        id={createFormInputId(DOMAIN_VALIDATOR_NAME, domainIndex, validatorIndex)}
                        name={createFormInputName(DOMAIN_VALIDATOR_NAME)}
                        value={value}
                        onChange={this.onChange}
                    />
                </Col>
            </Row>
        );
    }

    renderRemoveValidator() {
        const { validatorIndex, domainIndex } = this.props;

        return (
            <Row>
                <Col xs={12}>
                    <Button
                        className="domain-validation-delete"
                        name={createFormInputName(DOMAIN_VALIDATOR_REMOVE)}
                        id={createFormInputId(DOMAIN_VALIDATOR_REMOVE, domainIndex, validatorIndex)}
                        onClick={this.onDelete}
                    >
                        Remove Validator
                    </Button>
                </Col>
            </Row>
        );
    }

    onDelete = () => {
        const { onDelete, validatorIndex } = this.props;

        onDelete(validatorIndex);
    };

    onChange = evt => {
        const { onChange, validator, validatorIndex } = this.props;

        const value = evt.target.value;
        const name = getNameFromId(evt.target.id);

        let newValidator;
        if (name === DOMAIN_VALIDATOR_FAILONMATCH) {
            const newProperties = validator.properties.set(name, evt.target.checked);
            newValidator = validator.set('properties', newProperties);
        } else {
            newValidator = validator.set(name, value);
        }

        onChange(newValidator, validatorIndex);
    };

    expandValidator = evt => {
        const { onExpand, validatorIndex } = this.props;

        if (onExpand) {
            onExpand(validatorIndex);
        }
    };

    renderCollapsed = () => {
        const { validator } = this.props;

        return (
            <div>
                {(validator.name ? validator.name : 'Regex Validator') +
                    ': ' +
                    (validator.expression ? validator.expression : 'Missing expression')}
                <div className="domain-validator-collapse-icon" onClick={this.expandValidator}>
                    <FontAwesomeIcon icon={faPencilAlt} />
                </div>
            </div>
        );
    };

    render() {
        const { validatorIndex, expanded, validator } = this.props;

        return (
            <div className="domain-validator-panel" id={'domain-regex-validator-' + validatorIndex}>
                {expanded && (
                    <div>
                        {this.renderRowTextbox(
                            'Regular Expression *',
                            DOMAIN_VALIDATOR_EXPRESSION,
                            validator.expression,
                            'Regular Expression',
                            "The regular expression that this field's value will be evaluated against. All regular expressions must be compatible with Java regular expressions as implemented in the Pattern class.",
                            true
                        )}
                        {this.renderRowTextbox('Description', DOMAIN_VALIDATOR_DESCRIPTION, validator.description)}
                        {this.renderRowTextbox(
                            'Error Message',
                            DOMAIN_VALIDATOR_ERRORMESSAGE,
                            validator.errorMessage,
                            'Error Message',
                            'The message that will be displayed to the user in the event that validation fails for this field.'
                        )}
                        {this.renderFailValidationCheckbox(validator.properties.failOnMatch)}
                        {this.renderName(validator.name)}
                        {this.renderRemoveValidator()}
                    </div>
                )}
                {!expanded && <div>{this.renderCollapsed()}</div>}
            </div>
        );
    }
}
