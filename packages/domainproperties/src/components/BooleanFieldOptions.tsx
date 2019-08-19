

import * as React from 'react'
import {Col, FormControl, Row} from "react-bootstrap";
import {createFormInputId, createFormInputName} from "../actions/actions";
import {isFieldFullyLocked} from "../propertiesUtil";
import {
    DOMAIN_FIELD_FORMAT, DOMAIN_FIELD_SCALE
} from "../constants";
import {LabelHelpTip} from "@glass/base";
import {ITypeDependentProps} from "../models";

interface BooleanFieldProps extends ITypeDependentProps {
    format: string
}

export class BooleanFieldOptions extends React.PureComponent<BooleanFieldProps, any> {


    onFieldChange = (evt) => {
        const { onChange } = this.props;

        let value = evt.target.value;

        if (onChange) {
            onChange(evt.target.id, value);
        }
    }

    getFormatHelpText = () => {
        return (
            <div>
                Use boolean formatting to specify the text to show when a value is true and false. Text can optionally be shown for null values.
                <br/><br/>
                For example, "Yes;No;Blank" would output "Yes" if the value is true, "No" if false, and "Blank" for a null value.
            </div>
        );
    }

    render() {
        const { index, label, format, lockType } = this.props;

        return (
            <div>
                <Row className='domain-row-expanded'>
                    <Col xs={12}>
                        <div className={'domain-field-section-heading'}>{label}</div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={12}>
                        <div className={'domain-field-label'}>
                            Format for Boolean Values
                            <LabelHelpTip title='Format Strings' body={this.getFormatHelpText} />
                        </div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={2}>
                        <FormControl type="text"
                                     value={format || ''}
                                     onChange={this.onFieldChange}
                                     id={createFormInputId(DOMAIN_FIELD_FORMAT, index)}
                                     disabled={isFieldFullyLocked(lockType)}
                                     name={createFormInputName(DOMAIN_FIELD_SCALE)}
                        />
                    </Col>
                </Row>
            </div>
        )
    }
}