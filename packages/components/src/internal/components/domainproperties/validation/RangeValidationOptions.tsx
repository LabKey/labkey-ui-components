import React, { PureComponent, ReactNode } from 'react';
import { Button, Col, FormControl, Row } from 'react-bootstrap';

import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { createFormInputId, createFormInputName, getNameFromId } from '../actions';
import {
    DOMAIN_VALIDATOR_DESCRIPTION,
    DOMAIN_VALIDATOR_ERRORMESSAGE,
    DOMAIN_VALIDATOR_NAME,
    DOMAIN_VALIDATOR_REMOVE,
} from '../constants';

import { PropertyValidator } from '../models';
import { PropDescType } from '../PropDescType';

import { LabelHelpTip } from '../../../..';

import { Filters } from './Filters';

interface RangeValidationOptionsProps {
    validator: any;
    index: number;
    domainIndex: number;
    validatorIndex: number;
    mvEnabled: boolean;
    expanded: boolean;
    dataType: PropDescType;
    onExpand?: (index: number) => void;
    onChange: (validator: PropertyValidator, index: number) => void;
    onDelete: (index: number) => void;
}

export class RangeValidationOptions extends PureComponent<RangeValidationOptionsProps> {
    labelWidth = 4;
    fieldWidth = 8;

    static isValid = (validator: PropertyValidator): boolean => {
        return Filters.isValid(validator.get('expression')) && !!validator.get('name');
    };

    renderRowTextbox(label: string, name: string, value: string) {
        const { validatorIndex, domainIndex } = this.props;

        return (
            <Row className="domain-validator-filter-row">
                <Col xs={this.labelWidth}>
                    <div>{label}</div>
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

    onDelete = (): void => {
        const { onDelete, validatorIndex } = this.props;
        onDelete(validatorIndex);
    };

    onChange = (evt): void => {
        const { onChange, validator, validatorIndex } = this.props;

        const value = evt.target.value;
        const name = getNameFromId(evt.target.id);
        const newValidator = validator.set(name, value);

        onChange(newValidator, validatorIndex);
    };

    onFilterChange = (expression: string): void => {
        const { validator, validatorIndex, onChange } = this.props;

        onChange(validator.set('expression', expression), validatorIndex);
    };

    expandValidator = (): void => {
        const { onExpand, validatorIndex } = this.props;
        onExpand?.(validatorIndex);
    };

    firstFilterTooltip = (): ReactNode => {
        return (
            <LabelHelpTip title="First Condition" required={true}>
                Add a condition to this validation rule that will be tested against the value for this field.
            </LabelHelpTip>
        );
    };

    secondFilterTooltip = (): ReactNode => {
        return (
            <LabelHelpTip title="Second Condition">
                Add a condition to this validation rule that will be tested against the value for this field. Both the
                first and second conditions will be tested for this field.
            </LabelHelpTip>
        );
    };

    render() {
        const { validatorIndex, expanded, dataType, validator, mvEnabled, domainIndex } = this.props;

        return (
            <div className="domain-validator-panel" id={'domain-range-validator-' + validatorIndex}>
                {expanded && (
                    <div>
                        <Filters
                            validatorIndex={validatorIndex}
                            domainIndex={domainIndex}
                            range={true}
                            mvEnabled={mvEnabled}
                            onChange={this.onFilterChange}
                            type={dataType.getJsonType()}
                            expression={validator.expression}
                            firstFilterTooltip={this.firstFilterTooltip()}
                            secondFilterTooltip={this.secondFilterTooltip()}
                        />

                        {this.renderRowTextbox('Description', DOMAIN_VALIDATOR_DESCRIPTION, validator.description)}
                        {this.renderRowTextbox('Error Message', DOMAIN_VALIDATOR_ERRORMESSAGE, validator.errorMessage)}

                        <Row>
                            <Col xs={this.labelWidth}>
                                <div>Name *</div>
                            </Col>
                            <Col xs={this.fieldWidth}>
                                <FormControl
                                    type="text"
                                    id={createFormInputId(DOMAIN_VALIDATOR_NAME, domainIndex, validatorIndex)}
                                    name={createFormInputName(DOMAIN_VALIDATOR_NAME)}
                                    value={validator.name}
                                    onChange={this.onChange}
                                />
                            </Col>
                        </Row>

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
                    </div>
                )}
                {!expanded && (
                    <div>
                        {(validator.name ? validator.name : 'Range Validator') +
                            ': ' +
                            (validator.expression
                                ? Filters.describeExpression(validator.expression)
                                : 'Missing condition')}
                        <div className="domain-validator-collapse-icon" onClick={this.expandValidator}>
                            <FontAwesomeIcon icon={faPencilAlt} />
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
