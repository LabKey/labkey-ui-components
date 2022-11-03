import classNames from 'classnames';
import React, { ReactNode } from 'react';
import { Button, Checkbox, Col, FormControl, Row } from 'react-bootstrap';
import { CompactPicker } from 'react-color';

import { createFormInputId, createFormInputName, getNameFromId } from '../utils';
import {
    DOMAIN_CONDITION_FORMAT_BACKGROUND_COLOR,
    DOMAIN_CONDITION_FORMAT_TEXT_COLOR,
    DOMAIN_CONDITIONAL_FORMAT_PREFIX,
    DOMAIN_VALIDATOR_BOLD,
    DOMAIN_VALIDATOR_ITALIC,
    DOMAIN_VALIDATOR_REMOVE,
    DOMAIN_VALIDATOR_STRIKETHROUGH,
} from '../constants';

import { PropertyValidator } from '../models';
import { PropDescType } from '../PropDescType';

import { LabelHelpTip } from '../../base/LabelHelpTip';

import { Filters } from './Filters';

interface ConditionalFormatOptionsProps {
    dataType: PropDescType;
    domainIndex: number;
    expanded: boolean;
    index: number;
    mvEnabled: boolean;
    onChange: (validator: PropertyValidator, index: number) => void;
    onDelete: (index: number) => void;
    onExpand: (index: number) => void;
    validator: any;
    validatorIndex: number;
}

interface ConditionalFormatState {
    showFillColor: boolean;
    showTextColor: boolean;
}

export class ConditionalFormatOptions extends React.PureComponent<
    ConditionalFormatOptionsProps,
    ConditionalFormatState
> {
    constructor(props) {
        super(props);

        this.state = {
            showTextColor: false,
            showFillColor: false,
        };
    }

    static isValid = (validator: PropertyValidator): boolean => {
        return Filters.isValid(validator.get('formatFilter'), DOMAIN_CONDITIONAL_FORMAT_PREFIX);
    };

    onDelete = (): void => {
        const { onDelete, validatorIndex } = this.props;

        onDelete(validatorIndex);
    };

    onFieldChange = (evt): void => {
        const { onChange, validator, validatorIndex } = this.props;

        let value = evt.target.value;
        const name = getNameFromId(evt.target.id);

        if (
            name === DOMAIN_VALIDATOR_BOLD ||
            name === DOMAIN_VALIDATOR_STRIKETHROUGH ||
            name === DOMAIN_VALIDATOR_ITALIC
        ) {
            value = evt.target.checked;
        }

        onChange(validator.set(name, value), validatorIndex);
    };

    onFilterChange = (expression: string) => {
        const { validator, validatorIndex, onChange } = this.props;

        onChange(validator.set('formatFilter', expression), validatorIndex);
    };

    expandValidator = (): void => {
        const { onExpand, validatorIndex } = this.props;

        if (onExpand) {
            onExpand(validatorIndex);
        }
    };

    firstFilterTooltip = (): ReactNode => {
        return (
            <LabelHelpTip title="First Condition" required={true}>
                Add a condition to this format rule that will be tested against the value for this field.
            </LabelHelpTip>
        );
    };

    renderDisplayCheckbox = (name: string, label: string, value: boolean): ReactNode => {
        const { validatorIndex, domainIndex } = this.props;

        return (
            <Row>
                <Col xs={12} className="domain-validation-display-checkbox-row">
                    <Checkbox
                        id={createFormInputId(name, domainIndex, validatorIndex)}
                        name={createFormInputName(name)}
                        checked={value}
                        onChange={this.onFieldChange}
                    >
                        {label}
                    </Checkbox>
                </Col>
            </Row>
        );
    };

    onColorShow = (evt): void => {
        const { showTextColor, showFillColor } = this.state;
        let name = getNameFromId(evt.target.id);

        // If click on caret icon
        if (!name) {
            name = getNameFromId(evt.target.parentElement.parentElement.id);
        }

        // Strange little border between icon and button
        if (!name) {
            name = getNameFromId(evt.target.parentElement.id);
        }

        if (name === DOMAIN_CONDITION_FORMAT_TEXT_COLOR) {
            this.setState(() => ({ showTextColor: !showTextColor, showFillColor: false }));
        }

        if (name === DOMAIN_CONDITION_FORMAT_BACKGROUND_COLOR) {
            this.setState(() => ({ showFillColor: !showFillColor, showTextColor: false }));
        }
    };

    onColorChange = (color): void => {
        const { onChange, validator, validatorIndex } = this.props;
        const { showTextColor } = this.state;
        const name = showTextColor ? DOMAIN_CONDITION_FORMAT_TEXT_COLOR : DOMAIN_CONDITION_FORMAT_BACKGROUND_COLOR;
        onChange(validator.set(name, color.hex.substring(1)), validatorIndex);
    };

    renderColorPickers = (): ReactNode => {
        const { validator, validatorIndex } = this.props;
        const { showTextColor, showFillColor } = this.state;

        const textColor = validator.textColor ? '#' + validator.textColor : 'black';
        const fillColor = validator.backgroundColor ? '#' + validator.backgroundColor : 'white';

        return (
            <Row className="domain-validator-color-row">
                <Col xs={4}>
                    {this.getColorPickerButton(
                        DOMAIN_CONDITION_FORMAT_TEXT_COLOR,
                        'Text Color',
                        textColor,
                        showTextColor
                    )}
                </Col>
                <Col xs={4}>
                    {this.getColorPickerButton(
                        DOMAIN_CONDITION_FORMAT_BACKGROUND_COLOR,
                        'Fill Color',
                        fillColor,
                        showFillColor
                    )}
                </Col>
                <Col xs={1} />
                <Col xs={3}>
                    <FormControl
                        type="text"
                        id={'domain-validator-preview-' + validatorIndex}
                        defaultValue="Preview Text"
                        style={{
                            fontSize: '12px',
                            width: '100px',
                            color: textColor,
                            backgroundColor: fillColor,
                            fontWeight: validator.bold ? 'bold' : 'normal',
                            fontStyle: validator.italic ? 'italic' : 'normal',
                            textDecoration: validator.strikethrough ? 'line-through' : '',
                        }}
                    />
                </Col>
            </Row>
        );
    };

    getColorPickerButton = (name: string, label: string, color: string, showColorPicker: boolean): ReactNode => {
        const { validatorIndex, domainIndex } = this.props;
        const iconClassName = classNames('domain-color-caret', 'fa', 'fa-lg', {
            'fa-caret-up': showColorPicker,
            'fa-caret-down': !showColorPicker,
        });

        return (
            <div style={{ width: '100%' }}>
                <Button
                    id={createFormInputId(name, domainIndex, validatorIndex)}
                    key={createFormInputId(name, domainIndex, validatorIndex)}
                    name={createFormInputName(name)}
                    onClick={this.onColorShow}
                    className="domain-color-picker-btn"
                >
                    {label}
                    <span className={iconClassName} />
                </Button>
                {showColorPicker && (
                    <div className="domain-validator-color-popover">
                        <div
                            className="domain-validator-color-cover"
                            id={createFormInputId(name, domainIndex, validatorIndex)}
                            onClick={this.onColorShow}
                        />
                        <CompactPicker onChangeComplete={this.onColorChange} color={color} />
                    </div>
                )}
                <div className="domain-color-preview" style={{ backgroundColor: color }} />
            </div>
        );
    };

    render(): ReactNode {
        const { validatorIndex, expanded, dataType, validator, mvEnabled, domainIndex } = this.props;

        // Needs to be able to take string values for between syntax, but keep as date if that is the selected type (issue 39193)
        const type = dataType.getJsonType() === 'date' ? dataType.getJsonType() : 'string';

        return (
            <div className="domain-validator-panel" id={'domain-condition-format-' + validatorIndex}>
                {expanded && (
                    <div>
                        <Filters
                            validatorIndex={validatorIndex}
                            domainIndex={domainIndex}
                            onChange={this.onFilterChange}
                            type={type}
                            mvEnabled={mvEnabled}
                            expression={validator.formatFilter}
                            prefix={DOMAIN_CONDITIONAL_FORMAT_PREFIX}
                            firstFilterTooltip={this.firstFilterTooltip()}
                        />
                        <div className="domain-validation-subtitle">Display Options</div>
                        {this.renderDisplayCheckbox(DOMAIN_VALIDATOR_BOLD, 'Bold', validator.bold)}
                        {this.renderDisplayCheckbox(DOMAIN_VALIDATOR_ITALIC, 'Italics', validator.italic)}
                        {this.renderDisplayCheckbox(
                            DOMAIN_VALIDATOR_STRIKETHROUGH,
                            'Strikethrough',
                            validator.strikethrough
                        )}

                        {this.renderColorPickers()}

                        <Row className="domain-validator-color-row">
                            <Col xs={12}>
                                <Button
                                    className="domain-validation-delete"
                                    name={createFormInputName(DOMAIN_VALIDATOR_REMOVE)}
                                    id={createFormInputId(DOMAIN_VALIDATOR_REMOVE, domainIndex, validatorIndex)}
                                    onClick={this.onDelete}
                                >
                                    Remove Formatting
                                </Button>
                            </Col>
                        </Row>
                    </div>
                )}
                {!expanded && (
                    <div>
                        {validator.formatFilter
                            ? Filters.describeExpression(validator.formatFilter, DOMAIN_CONDITIONAL_FORMAT_PREFIX)
                            : 'Missing condition'}
                        <div className="domain-validator-collapse-icon" onClick={this.expandValidator}>
                            <span className="fa fa-pencil-alt" />
                        </div>
                    </div>
                )}
            </div>
        );
    }
}
