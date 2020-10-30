import React from 'react';
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
    onExpand: (index: number) => any;
    onChange: (validator: PropertyValidator, index: number) => any;
    onDelete: (index: number) => any;
}

export class RangeValidationOptions extends React.PureComponent<RangeValidationOptionsProps, any> {
    labelWidth = 4;
    fieldWidth = 8;

    static isValid = (validator: PropertyValidator) => {
        return Filters.isValid(validator.get('expression')) && !!validator.get('name');
    };

    renderRowTextbox(label: string, name: string, value: string, tooltipTitle?: string, tooltipBody?: () => any) {
        const { validatorIndex, domainIndex } = this.props;

        return (
            <Row className="domain-validator-filter-row">
                <Col xs={this.labelWidth}>
                    <div>
                        {label}
                        {tooltipTitle && tooltipBody && <LabelHelpTip title={tooltipTitle} body={tooltipBody} />}
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
        newValidator = validator.set(name, value);

        onChange(newValidator, validatorIndex);
    };

    onFilterChange = (expression: string) => {
        const { validator, validatorIndex, onChange } = this.props;

        onChange(validator.set('expression', expression), validatorIndex);
    };

    expandValidator = evt => {
        const { onExpand, validatorIndex } = this.props;

        if (onExpand) {
            onExpand(validatorIndex);
        }
    };

    firstFilterTooltipText = () => {
        return 'Add a condition to this validation rule that will be tested against the value for this field.';
    };

    firstFilterTooltip = () => {
        return <LabelHelpTip title="First Condition" body={this.firstFilterTooltipText} required={true} />;
    };

    secondFilterTooltipText = () => {
        return (
            'Add a condition to this validation rule that will be tested against the value for this field. ' +
            'Both the first and second conditions will be tested for this field.'
        );
    };

    secondFilterTooltip = () => {
        return <LabelHelpTip title="Second Condition" body={this.secondFilterTooltipText} />;
    };

    renderCollapsed = () => {
        const { validator } = this.props;

        return (
            <div>
                {(validator.name ? validator.name : 'Range Validator') +
                    ': ' +
                    (validator.expression ? Filters.describeExpression(validator.expression) : 'Missing condition')}
                <div className="domain-validator-collapse-icon" onClick={this.expandValidator}>
                    <FontAwesomeIcon icon={faPencilAlt} />
                </div>
            </div>
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
                        {this.renderName(validator.name)}
                        {this.renderRemoveValidator()}
                    </div>
                )}
                {!expanded && <div>{this.renderCollapsed()}</div>}
            </div>
        );
    }
}
