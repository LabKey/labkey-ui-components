

import * as React from 'react'
import {Col, FormControl, Row} from "react-bootstrap";
import {isFieldFullyLocked} from "../propertiesUtil";
import {createFormInputId, createFormInputName} from "../actions/actions";
import {
    DEFAULT_SCALE_LINEAR,
    DEFAULT_SCALE_LOG,
    DOMAIN_FIELD_DEFAULT_SCALE,
    DOMAIN_FIELD_FORMAT, DOMAIN_FIELD_LABEL
} from "../constants";
import {LabelHelpTip} from "@glass/base";
import {ITypeDependentProps} from "../models";

interface NumericFieldProps extends ITypeDependentProps {
    format: string,
    defaultScale: string
}

export class NumericFieldOptions extends React.PureComponent<NumericFieldProps, any> {

    onFieldChange = (evt) => {
        const { onChange } = this.props;

        let value = evt.target.value;

        if (onChange) {
            onChange(evt.target.id, value);
        }
    }

    getFormatHelpText = () => {
        let helpPrefix = "https://www.labkey.org/Documentation/wiki-page.view?name=";

        if (LABKEY && LABKEY.helpLinkPrefix) {
            helpPrefix = LABKEY.helpLinkPrefix;
        }

        return (
            <>
                To control how a number value is displayed, provide a string format compatible with the java data class DecimalFormat.
                <br/><br/>
                Learn more about using <a target='_blank'
                                          href={helpPrefix + 'dateFormats#number'}>Number formats</a> in LabKey.
            </>
        )
    }

    render() {
        const { index, label, format, defaultScale, lockType } = this.props;

        return (
            <div>
                <Row className='domain-row-expanded'>
                    <Col xs={12}>
                        <div className={'domain-field-section-heading'}>{label}</div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={3}>
                        <div className={'domain-field-label'}>
                            Format Numeric Values
                            <LabelHelpTip
                                title='Format Strings'
                                body={this.getFormatHelpText} />
                        </div>
                    </Col>
                    <Col xs={3}>
                        <div className={'domain-field-label'}>Default Scale Type</div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={2}>
                        <FormControl type="text"
                                     value={format || ""}
                                     onChange={this.onFieldChange}
                                     id={createFormInputId(DOMAIN_FIELD_FORMAT, index)}
                                     name={createFormInputName(DOMAIN_FIELD_FORMAT)}
                                     disabled={isFieldFullyLocked(lockType)}
                        />
                    </Col>
                    <Col xs={1} />
                    <Col xs={2}>

                        <FormControl componentClass="select"
                                     id={createFormInputId(DOMAIN_FIELD_DEFAULT_SCALE, index)}
                                     disabled={isFieldFullyLocked(lockType)}
                                     name={createFormInputName(DOMAIN_FIELD_DEFAULT_SCALE)}
                                     onChange={this.onFieldChange} value={defaultScale}>
                            <option
                                key={createFormInputId(DOMAIN_FIELD_DEFAULT_SCALE + 'option-' + DEFAULT_SCALE_LINEAR, index)}
                                value={DEFAULT_SCALE_LINEAR}>{DEFAULT_SCALE_LINEAR}</option>
                            <option
                                key={createFormInputId(DOMAIN_FIELD_DEFAULT_SCALE + 'option-' + DEFAULT_SCALE_LOG, index)}
                                value={DEFAULT_SCALE_LOG}>{DEFAULT_SCALE_LOG}</option>
                        </FormControl>
                    </Col>
                </Row>
            </div>
        )
    }
}