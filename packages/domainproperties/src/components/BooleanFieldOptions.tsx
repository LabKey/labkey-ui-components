

import * as React from 'react'
import {Col, FormControl, Row} from "react-bootstrap";
import {createFormInputId} from "../actions/actions";
import {
    DOMAIN_FIELD_FORMAT
} from "../constants";
import {LabelHelpTip} from "@glass/base";

interface BooleanFieldProps {
    index: number,
    label: string,
    format: string,
    onChange: (string, any) => any
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
                For example, "Yes;No;Blank" would output "Yes" if the value istrue, "No" if false, and "Blank" for a null value.
            </div>
        );
    }

    render() {
        const { index, label, format } = this.props;

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
                                     value={format}
                                     onChange={this.onFieldChange}
                                     id={createFormInputId(DOMAIN_FIELD_FORMAT, index)}
                                     key={createFormInputId(DOMAIN_FIELD_FORMAT, index)}/>
                    </Col>
                </Row>
            </div>
        )
    }
}