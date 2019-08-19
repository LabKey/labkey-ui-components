

import * as React from 'react'
import {Col, FormControl, Row} from "react-bootstrap";
import {createFormInputId, createFormInputName, getIndexFromId, getNameFromId} from "../actions/actions";
import {isFieldFullyLocked} from "../propertiesUtil";
import {
    DOMAIN_FIELD_CUSTOM_LENGTH, DOMAIN_FIELD_FORMAT,
    DOMAIN_FIELD_MAX_LENGTH, DOMAIN_FIELD_SCALE, MAX_TEXT_LENGTH
} from "../constants";
import {LabelHelpTip} from "@glass/base"
import {ITypeDependentProps} from "../models";

interface TextFieldProps extends ITypeDependentProps {
    scale: number
}

export interface TextFieldState {
    radio: string
}

export class TextFieldOptions extends React.PureComponent<TextFieldProps, TextFieldState> {

    constructor(props) {
        super(props);

        this.state = {
            radio: DOMAIN_FIELD_MAX_LENGTH
        };
    }

    componentDidMount(): void {
        this.setState({radio: (!this.props.scale || this.props.scale === MAX_TEXT_LENGTH
                ? DOMAIN_FIELD_MAX_LENGTH : DOMAIN_FIELD_CUSTOM_LENGTH)})
    }

    handleChange = (event: any) => {
        const { onChange, scale } = this.props;
        const target = event.target;

        // Initially set to handle custom character count
        let scaleId = target.id;
        let value = event.target.value;

        const fieldName = getNameFromId(target.id);

        // If handling radio button
        if (fieldName !== DOMAIN_FIELD_SCALE) {
            this.setState({radio: value});  // set local state
            scaleId = createFormInputId(DOMAIN_FIELD_SCALE, getIndexFromId(target.id));  // updating scale
            value = MAX_TEXT_LENGTH;  // set scale back to MAX_TEXT_LENGTH
        }
        else {
            value = parseInt(value);
        }

        // TODO: Probably should do an error message or something in the UI but waiting on more error handling clarity
        if (isNaN(value) || value > MAX_TEXT_LENGTH) {
            value = MAX_TEXT_LENGTH;
        }

        if (onChange && value !== scale) {
            onChange(scaleId, value);
        }
    }

    getMaxCountHelpText = () => {
        return (
            <div>
                Sets the maximum character count for a text field.
            </div>
        )
    }

    render() {
        const { index, label, scale, onChange, lockType } = this.props;
        const { radio } = this.state;

        return (
            <div>
                <Row className='domain-row-expanded'>
                    <Col xs={12}>
                        <div className={'domain-field-section-heading margin-top'}>{label}</div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded '>
                    <Col xs={12}>
                        <div className={'domain-field-label'}>
                            Max Text Character Count<LabelHelpTip
                                title="Max Text Length"
                                body={this.getMaxCountHelpText} />
                        </div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={12} className='domain-text-options-col'>
                        <input type='radio'
                               name={createFormInputName(DOMAIN_FIELD_MAX_LENGTH)}
                               className='domain-text-options-radio1 domain-field-float-left'
                               value={DOMAIN_FIELD_MAX_LENGTH}
                               checked={radio === DOMAIN_FIELD_MAX_LENGTH}
                               onChange={this.handleChange}
                               id={createFormInputId(DOMAIN_FIELD_MAX_LENGTH, index)}
                               disabled={isFieldFullyLocked(lockType)}
                        />
                        <div className='domain-text-label'>Allow max character count</div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={12}>
                        <input type='radio'
                               name={createFormInputName(DOMAIN_FIELD_CUSTOM_LENGTH)}
                               className='domain-text-options-radio2 domain-field-float-left'
                               value={DOMAIN_FIELD_CUSTOM_LENGTH}
                               checked={radio === DOMAIN_FIELD_CUSTOM_LENGTH}
                               onChange={this.handleChange}
                               id={createFormInputId(DOMAIN_FIELD_CUSTOM_LENGTH, index)}
                        />
                        <span className='domain-text-options-length domain-field-float-left domain-text-label'>Set character count to</span>
                        <FormControl type="text"
                                     id={createFormInputId(DOMAIN_FIELD_SCALE, index)}
                                     name={createFormInputName(DOMAIN_FIELD_SCALE)}
                                     style={{width: '60px'}}
                                     value={typeof scale !== "undefined" && radio === DOMAIN_FIELD_CUSTOM_LENGTH ? scale : 4000}
                                     onChange={this.handleChange}
                                     disabled={isFieldFullyLocked(lockType) || radio === DOMAIN_FIELD_MAX_LENGTH}
                        />
                    </Col>
                </Row>
            </div>
        )
    }
}