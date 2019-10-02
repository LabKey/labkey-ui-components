import * as React from "react";
import {Button, Checkbox, Col, Collapse, FormControl, Row} from "react-bootstrap";
import {createFormInputId, createFormInputName, getNameFromId} from "../../actions/actions";
import {
    DOMAIN_VALIDATOR_DESCRIPTION, DOMAIN_VALIDATOR_ERRORMESSAGE,
    DOMAIN_VALIDATOR_EXPRESSION, DOMAIN_VALIDATOR_FAILONMATCH, DOMAIN_VALIDATOR_NAME, DOMAIN_VALIDATOR_REMOVE,
} from "../../constants";
import {faPencilAlt} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {PropDescType, PropertyValidator} from "../../models";
import {Filters} from "./Filters";
import {LabelHelpTip} from "@glass/base";

interface RangeValidationOptionsProps {
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

export class RangeValidationOptions extends React.PureComponent<RangeValidationOptionsProps, any> {

    labelWidth = 4;
    fieldWidth = 8;


    renderRowTextbox(label: string, name: string, validatorIndex: number, value: string, tooltipTitle?: string, tooltipBody?: () => any) {
        return (
            <Row className='domain-validator-filter-row'>
                <Col xs={this.labelWidth}>
                    <div>
                        {label}
                        {tooltipTitle && tooltipBody &&
                        <LabelHelpTip title={tooltipTitle} body={tooltipBody}/>
                        }
                    </div>
                </Col>
                <Col xs={this.fieldWidth}>
                    <div>
                        <FormControl
                            componentClass='textarea'
                            className='domain-validation-textarea'
                            rows={3}
                            id={createFormInputId(name, validatorIndex)}
                            name={createFormInputName(name)}
                            value={value}
                            onChange={this.onChange}
                        />
                    </div>
                </Col>
            </Row>
        )
    }

    renderName(validatorIndex: number, value: string) {
        return (
            <Row>
                <Col xs={this.labelWidth}>
                    <div>
                        Name:*
                    </div>
                </Col>
                <Col xs={this.fieldWidth}>
                    <FormControl
                        type='text'
                        id={createFormInputId(DOMAIN_VALIDATOR_NAME, validatorIndex)}
                        name={createFormInputName(DOMAIN_VALIDATOR_NAME)}
                        value={value}
                        onChange={this.onChange}
                    />
                </Col>
            </Row>
        )
    }

    renderRemoveValidator() {
        const { validatorIndex } = this.props;

        return (
            <Row>
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

    onChange = (evt) => {
        const { onChange, validator, validatorIndex } = this.props;

        let value = evt.target.value;
        let name = getNameFromId(evt.target.id);

        let newValidator;
        newValidator = validator.set(name, value);

        onChange(newValidator, validatorIndex);
    };

    onFilterChange = (expression: string) => {
        const { validator, validatorIndex, onChange } = this.props;

        onChange(validator.set('expression', expression), validatorIndex)
    };

    expandValidator = (evt) => {
        const { onExpand, validatorIndex } = this.props;

        if (onExpand) {
            onExpand(validatorIndex);
        }
    };

    firstFilterTooltipText = () => {
        return 'Add a condition to this validation rule that will be tested against the value for this field.'
    };

    firstFilterTooltip = () => {
        return (<LabelHelpTip title='First Condition' body={this.firstFilterTooltipText}/>)
    };

    secondFilterTooltipText = () => {
        return ('Add a condition to this validation rule that will be tested against the value for this field. ' +
            'Both the first and second conditions will be tested for this field.')
    };

    secondFilterTooltip = () => {
        return (<LabelHelpTip title='Second Condition' body={this.secondFilterTooltipText}/>)
    };
    
    renderCollapsed = () => {
        const { validator } = this.props;

        return(
            <div>{(validator.name ? validator.name : 'Range Validator') + ': ' + (validator.expression ? Filters.describeExpression(validator.expression) : 'Missing condition') }
                <div className='domain-validator-collapse-icon' onClick={this.expandValidator}><FontAwesomeIcon icon={faPencilAlt}/></div>
            </div>
        )
    };

    render() {
        const { validatorIndex, expanded, dataType, validator, mvEnabled } = this.props;

        return(
            <div className='domain-validator-panel'>
                {expanded &&
                <div>
                    <Filters validatorIndex={validatorIndex}
                             range={true}
                             mvEnabled={mvEnabled}
                             onChange={this.onFilterChange}
                             type={dataType.getJsonType()}
                             expression={validator.expression}
                             firstFilterTypeLabel='First Condition:*'
                             firstFilterValueLabel=''
                             firstFilterTooltip={this.firstFilterTooltip()}
                             secondFilterTypeLabel='Second Condition:'
                             secondFilterValueLabel=''
                             secondFilterTooltip={this.secondFilterTooltip()}
                             
                    />
                    {this.renderRowTextbox('Description:', DOMAIN_VALIDATOR_DESCRIPTION, validatorIndex, validator.description)}
                    {this.renderRowTextbox('Error Message:', DOMAIN_VALIDATOR_ERRORMESSAGE, validatorIndex, validator.errorMessage)}
                    {this.renderName(validatorIndex, validator.name)}
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