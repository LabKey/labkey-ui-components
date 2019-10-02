
import * as React from 'react'
import { Col, FormControl, Row } from "react-bootstrap";
import {isFieldFullyLocked} from "../propertiesUtil";
import {createFormInputId, createFormInputName, getNameFromId} from "../actions/actions";
import {
    DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING,
    DOMAIN_FIELD_FORMAT, DOMAIN_FIELD_SCALE
} from "../constants";
import {LabelHelpTip} from "@glass/base";
import {ITypeDependentProps} from "../models";

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
        let helpPrefix = "https://www.labkey.org/Documentation/wiki-page.view?name=";

        if (LABKEY && LABKEY.helpLinkPrefix) {
            helpPrefix = LABKEY.helpLinkPrefix;
        }

        return (
            <>
                To control how a date or time value is displayed, provide a string format compatible with the java data class SimpleDateFormat.
                <br/><br/>
                Learn more about using <a target='_blank' href={helpPrefix + 'dateFormats#date'}>Date and Time formats</a> in LabKey.
            </>
        )
    }

    getDateShiftingText = () => {
        return (
            'Participant date columns with this property checked will not be shifted on export/publication when the "Shift Participant Dates" option is selected.'
        )
    }

    render() {
        const { index, label, format, excludeFromShifting, lockType } = this.props;

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
                    <Col xs={3}>
                        <div className={'domain-field-label'}>
                            Participant Date Shifting
                            <LabelHelpTip
                                title='Participant Date Shifting'
                                body={this.getDateShiftingText} />
                        </div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={2}>
                        <FormControl type="text"
                                     value={format || ''}
                                     onChange={this.onFieldChange}
                                     disabled={isFieldFullyLocked(lockType)}
                                     id={createFormInputId(DOMAIN_FIELD_FORMAT, index)}
                                     name={createFormInputName(DOMAIN_FIELD_FORMAT)}
                        />
                    </Col>
                    <Col xs={1}/>
                    <Col xs={9}>
                        <input type='checkbox'
                               name={createFormInputName(DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING)}
                               className='domain-field-float-left'
                               value='ExcludeFromShiftingOptions'
                               checked={excludeFromShifting}
                               onChange={this.onFieldChange}
                               disabled={isFieldFullyLocked(lockType)}
                               id={createFormInputId(DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING, index)}
                        />
                        <div className='domain-field-float-left domain-field-checkbox-label'>Do Not Shift Dates on Export or Publication</div>
                    </Col>
                </Row>
            </div>
        )
    }
}