import React from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';
import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, createFormInputName, getNameFromId } from './actions';
import { DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING, DOMAIN_FIELD_FORMAT } from './constants';
import { ITypeDependentProps } from './models';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { DATE_FORMATS_TOPIC, helpLinkNode } from '../../util/helpLinks';

interface DateTimeFieldProps extends ITypeDependentProps {
    format: string,
    excludeFromShifting: boolean,
}

export class DateTimeFieldOptions extends React.PureComponent<DateTimeFieldProps, any> {


    onFieldChange = (evt) => {
        const { onChange } = this.props;

        let value = evt.target.value;

        if (getNameFromId(evt.target.id) === DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING) {
            value = evt.target.checked;
        }

        if (onChange) {
            onChange(evt.target.id, value);
        }
    };

    getFormatHelpText = () => {
        return (
            <>
                To control how a date or time value is displayed, provide a string format compatible with the Java class SimpleDateFormat.
                <br/><br/>
                Learn more about using {helpLinkNode(DATE_FORMATS_TOPIC, "Date and Time formats")} in LabKey.
            </>
        )
    };

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
                    <Col xs={3}>
                        <div className={'domain-field-label'}>
                            Format for Dates
                            <LabelHelpTip
                                title='Format String'
                                body={this.getFormatHelpText} />
                        </div>
                    </Col>
                    <Col xs={9} />
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={3}>
                        <FormControl type="text"
                                     value={format || ''}
                                     onChange={this.onFieldChange}
                                     disabled={isFieldFullyLocked(lockType)}
                                     id={createFormInputId(DOMAIN_FIELD_FORMAT, index)}
                                     name={createFormInputName(DOMAIN_FIELD_FORMAT)}
                        />
                    </Col>
                    <Col xs={9} />
                </Row>
            </div>
        )
    }
}
