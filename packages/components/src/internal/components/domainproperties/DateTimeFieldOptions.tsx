import React, { ReactNode } from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { DATE_FORMATS_TOPIC, HelpLink, JavaDocsLink } from '../../util/helpLinks';

import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, createFormInputName, getNameFromId } from './utils';
import { DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING, DOMAIN_FIELD_FORMAT } from './constants';
import { ITypeDependentProps } from './models';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

interface DateTimeFieldProps extends ITypeDependentProps {
    excludeFromShifting: boolean;
    format: string;
    type: 'dateTime' | 'date' | 'time';
}

export class DateTimeFieldOptions extends React.PureComponent<DateTimeFieldProps> {
    onFieldChange = (evt): void => {
        const { onChange } = this.props;

        let value = evt.target.value;

        if (getNameFromId(evt.target.id) === DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING) {
            value = evt.target.checked;
        }

        if (onChange) {
            onChange(evt.target.id, value);
        }
    };

    getFormatHelpText = (): ReactNode => {
        const { type } = this.props;
        const noun = type === 'dateTime' ? "date or time" : type;
        return (
            <>
                <p>
                    To control how a {noun} value is displayed, provide a string format compatible with the Java{' '}
                    <JavaDocsLink urlSuffix="java/text/SimpleDateFormat.html">SimpleDateFormat</JavaDocsLink> class.
                </p>
                <p>
                    Learn more about using <HelpLink topic={DATE_FORMATS_TOPIC}>Date and Time formats</HelpLink> in
                    LabKey.
                </p>
            </>
        );
    };

    render(): ReactNode {
        const { index, label, format, lockType, domainIndex, type } = this.props;

        const noun = type === 'time' ? 'Times' : 'Dates';
        return (
            <div>
                <Row>
                    <Col xs={12}>
                        <SectionHeading title={label} />
                    </Col>
                </Row>
                <Row>
                    <Col xs={3}>
                        <div className="domain-field-label">
                            <DomainFieldLabel label={"Format for " + noun} helpTipBody={this.getFormatHelpText()} />
                        </div>
                    </Col>
                    <Col xs={9} />
                </Row>
                <Row>
                    <Col xs={3}>
                        <FormControl
                            type="text"
                            value={format || ''}
                            onChange={this.onFieldChange}
                            disabled={isFieldFullyLocked(lockType)}
                            id={createFormInputId(DOMAIN_FIELD_FORMAT, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_FORMAT)}
                        />
                    </Col>
                    <Col xs={9} />
                </Row>
            </div>
        );
    }
}
