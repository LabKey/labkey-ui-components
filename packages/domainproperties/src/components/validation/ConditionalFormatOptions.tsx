import * as React from "react";
import {Button, Checkbox, Col, Collapse, FormControl, Row} from "react-bootstrap";
import {createFormInputId, createFormInputName, getNameFromId} from "../../actions/actions";
import {
    DOMAIN_CONDITION_FORMAT_BACKGROUND_COLOR,
    DOMAIN_CONDITION_FORMAT_TEXT_COLOR,
    DOMAIN_CONDITIONAL_FORMAT_PREFIX,
    DOMAIN_VALIDATOR_BOLD,
    DOMAIN_VALIDATOR_ITALIC,
    DOMAIN_VALIDATOR_REMOVE, DOMAIN_VALIDATOR_STRIKETHROUGH,
} from "../../constants";
import {faPencilAlt, faCaretDown, faCaretUp} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {PropDescType, PropertyValidator} from "../../models";
import {Filters} from "./Filters";
import { CompactPicker } from 'react-color';

interface ConditionalFormatOptionsProps {
    validator: any
    index: number
    validatorIndex: number
    mvEnabled: boolean
    expanded: boolean
    dataType: PropDescType
    onExpand: (index: number) => any
    onChange: (validator: PropertyValidator, index: number) => any
    onDelete: (index: number) => any
}

interface ConditionalFormatState {
    showTextColor: boolean
    showFillColor: boolean
}

export class ConditionalFormatOptions extends React.PureComponent<ConditionalFormatOptionsProps, ConditionalFormatState> {

    constructor(props) {
        super(props);

        this.state = {
            showTextColor: false,
            showFillColor: false
        };
    }

    renderRemoveValidator() {
        const { validatorIndex } = this.props;

        return (
            <Row className='domain-validator-color-row'>
                <Col xs={12}>
                    <Button
                        bsStyle="danger"
                        className="domain-validation-delete"
                        name={createFormInputName(DOMAIN_VALIDATOR_REMOVE)}
                        id={createFormInputId(DOMAIN_VALIDATOR_REMOVE, validatorIndex)}
                        onClick={this.onDelete}>
                        Remove Validator
                    </Button>
                </Col>
            </Row>
        )
    }

    onDelete = () => {
        const { onDelete, validatorIndex } = this.props;

        onDelete(validatorIndex);
    };

    onFieldChange = (evt) => {
        const { onChange, validator, validatorIndex } = this.props;

        let value = evt.target.value;
        let name = getNameFromId(evt.target.id);

        let newValidator;
        if (name === DOMAIN_VALIDATOR_BOLD || name === DOMAIN_VALIDATOR_STRIKETHROUGH || name === DOMAIN_VALIDATOR_ITALIC) {
            value = evt.target.checked;
        }

        newValidator = validator.set(name, value);
        onChange(newValidator, validatorIndex);
    };

    onFilterChange = (expression: string) => {
        const { validator, validatorIndex, onChange } = this.props;

        onChange(validator.set('formatFilter', expression), validatorIndex)
    };

    expandValidator = (evt) => {
        const { onExpand, validatorIndex } = this.props;

        if (onExpand) {
            onExpand(validatorIndex);
        }
    };

    renderCollapsed = () => {
        const { validator } = this.props;

        return(
            <div>{(validator.formatFilter ? Filters.describeExpression(validator.formatFilter, DOMAIN_CONDITIONAL_FORMAT_PREFIX) : 'Missing condition') }
                <div className='domain-validator-collapse-icon' onClick={this.expandValidator}><FontAwesomeIcon icon={faPencilAlt}/></div>
            </div>
        )
    };

    renderDisplayCheckbox(name: string, label: string, value: boolean) {
        const { validatorIndex } = this.props;

        return (
            <Row>
                <Col xs={12} className='domain-validation-display-checkbox-row'>
                    <Checkbox
                        id={createFormInputId(name, validatorIndex)}
                        name={createFormInputName(name)}
                        checked={value}
                        onChange={this.onFieldChange}
                    >{label}</Checkbox>
                </Col>
            </Row>
        )
    }

    onColorShow = (evt) => {
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
            this.setState(() => ({showTextColor: !showTextColor, showFillColor: false}))
        }

        if (name === DOMAIN_CONDITION_FORMAT_BACKGROUND_COLOR) {
            this.setState(() => ({showFillColor: !showFillColor, showTextColor: false}))
        }
    };

    onColorChange = (color, event) => {
        const { onChange, validator, validatorIndex } = this.props;
        const { showTextColor } = this.state;

        let name = (showTextColor ? DOMAIN_CONDITION_FORMAT_TEXT_COLOR : DOMAIN_CONDITION_FORMAT_BACKGROUND_COLOR);

        let newValidator;
        newValidator = validator.set(name, color.hex.substring(1)); // LK does not save the #
        onChange(newValidator, validatorIndex);
    };

    renderColorPickers() {
        const { validator } = this.props;
        const { showTextColor, showFillColor } = this.state;

        const textColor = validator.textColor ? '#' + validator.textColor : 'black';
        const fillColor = validator.backgroundColor ? '#' + validator.backgroundColor : 'white';

        return (
            <Row className='domain-validator-color-row'>
                <Col xs={4}>
                    {this.getColorPickerButton(DOMAIN_CONDITION_FORMAT_TEXT_COLOR, "Text Color", textColor, showTextColor)}
                </Col>
                <Col xs={4}>
                    {this.getColorPickerButton(DOMAIN_CONDITION_FORMAT_BACKGROUND_COLOR, "Fill Color", fillColor, showFillColor)}
                </Col>
                <Col xs={1} />
                <Col xs={3}>
                    <FormControl
                        type='text'
                        defaultValue='Preview Text'
                        style={{fontSize: '12px', width: '100px', color: textColor, backgroundColor: fillColor,
                            fontWeight: (validator.bold?'bold':'normal'),
                            fontStyle: (validator.italic?'italic':'normal'),
                            textDecoration: (validator.strikethrough?'line-through':'')
                        }}
                    />
                </Col>
            </Row>
        )
    }

    getColorPickerButton(name: string, label: string, color: string, showColorPicker: boolean) {
        const { validatorIndex } = this.props;

        return (
            <div style={{width:'100%'}}>
                <Button
                    id={createFormInputId(name, validatorIndex)}
                    key={createFormInputId(name, validatorIndex)}
                    name={createFormInputName(name)}
                    onClick={this.onColorShow}
                    className='domain-color-picker-btn'
                >{label}<FontAwesomeIcon className='domain-color-caret' size='lg' icon={showColorPicker ? faCaretUp : faCaretDown}/></Button>
                {showColorPicker &&
                <div className='domain-validator-color-popover'>
                    <div className='domain-validator-color-cover' id={createFormInputId(name, validatorIndex)} onClick={this.onColorShow}/>
                    <CompactPicker id={createFormInputId(name, validatorIndex)} onChangeComplete={this.onColorChange} color={color}/>
                </div>
                }
                <div className='domain-color-preview' style={{backgroundColor: color}} />
            </div>
        )
    }

    render() {
        const { validatorIndex, expanded, dataType, validator, mvEnabled, index } = this.props;

        return(
            <div className='domain-validator-panel' id={"domain-condition-format-" + validatorIndex}>
                {expanded &&
                <div>
                    <Filters validatorIndex={validatorIndex}
                             onChange={this.onFilterChange}
                             type={dataType.getJsonType()}
                             mvEnabled={mvEnabled}
                             expression={validator.formatFilter}
                             prefix={DOMAIN_CONDITIONAL_FORMAT_PREFIX}
                    />
                    <div className='domain-validation-subtitle'>Display Options</div>
                    {this.renderDisplayCheckbox(DOMAIN_VALIDATOR_BOLD, 'Bold', validator.bold)}
                    {this.renderDisplayCheckbox(DOMAIN_VALIDATOR_ITALIC, 'Italics', validator.italic)}
                    {this.renderDisplayCheckbox(DOMAIN_VALIDATOR_STRIKETHROUGH, 'Strikethrough', validator.strikethrough)}

                    {this.renderColorPickers()}
                    {this.renderRemoveValidator()}

                </div>
                }
                {!expanded &&
                <div>
                    {this.renderCollapsed()}
                </div>
                }
            </div>

        )
    }
}