

import * as React from 'react'
import {Col, FormControl, Row} from "react-bootstrap";
import {createFormInputId, getIndexFromId, getNameFromId} from "../actions/actions";
import {
    DOMAIN_FIELD_FORMAT
} from "../constants";
import {LabelHelpTip} from "./LabelHelpTip";

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
                        <div className={'domain-field-label'}>Format Boolean Strings{LabelHelpTip({
                            title: 'Format Strings',
                            body: 'Booleans can be formatted by specifying the text to show when the value istrue followed by a semicolon and the text for when the value is false, optionally followed by a semicolon and the text to show for null values. Example: \'Yes;No;Blank\''
                        })}</div>
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