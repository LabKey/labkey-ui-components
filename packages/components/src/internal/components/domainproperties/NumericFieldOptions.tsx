import React from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { helpLinkNode, NUMBER_FORMATS_TOPIC } from '../../util/helpLinks';

import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, createFormInputName } from './actions';
import { DEFAULT_SCALE_LINEAR, DEFAULT_SCALE_LOG, DOMAIN_FIELD_DEFAULT_SCALE, DOMAIN_FIELD_FORMAT } from './constants';
import { ITypeDependentProps } from './models';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

interface NumericFieldProps extends ITypeDependentProps {
    format: string;
    defaultScale: string;
}

export class NumericFieldOptions extends React.PureComponent<NumericFieldProps, any> {
    onFieldChange = evt => {
        const { onChange } = this.props;

        const value = evt.target.value;

        if (onChange) {
            onChange(evt.target.id, value);
        }
    };

    getFormatHelpText = () => {
        return (
            <>
                To control how a number value is displayed, provide a string format compatible with the Java class
                DecimalFormat.
                <br />
                <br />
                Learn more about using {helpLinkNode(NUMBER_FORMATS_TOPIC, 'Number formats')} in LabKey.
            </>
        );
    };

    render() {
        const { index, label, format, defaultScale, lockType, domainIndex } = this.props;

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
                            <DomainFieldLabel label="Format for Numbers" helpTipBody={this.getFormatHelpText()} />
                        </div>
                    </Col>
                    <Col xs={2}>
                        <div className="domain-field-label">Default Scale Type</div>
                    </Col>
                </Row>
                <Row>
                    <Col xs={3}>
                        <FormControl
                            type="text"
                            value={format || ''}
                            onChange={this.onFieldChange}
                            id={createFormInputId(DOMAIN_FIELD_FORMAT, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_FORMAT)}
                            disabled={isFieldFullyLocked(lockType)}
                        />
                    </Col>
                    <Col xs={2}>
                        <FormControl
                            componentClass="select"
                            id={createFormInputId(DOMAIN_FIELD_DEFAULT_SCALE, domainIndex, index)}
                            disabled={isFieldFullyLocked(lockType)}
                            name={createFormInputName(DOMAIN_FIELD_DEFAULT_SCALE)}
                            onChange={this.onFieldChange}
                            value={defaultScale}
                        >
                            <option
                                key={createFormInputId(
                                    DOMAIN_FIELD_DEFAULT_SCALE + 'option-' + DEFAULT_SCALE_LINEAR,
                                    domainIndex,
                                    index
                                )}
                                value={DEFAULT_SCALE_LINEAR}
                            >
                                Linear
                            </option>
                            <option
                                key={createFormInputId(
                                    DOMAIN_FIELD_DEFAULT_SCALE + 'option-' + DEFAULT_SCALE_LOG,
                                    domainIndex,
                                    index
                                )}
                                value={DEFAULT_SCALE_LOG}
                            >
                                Log
                            </option>
                        </FormControl>
                    </Col>
                </Row>
            </div>
        );
    }
}
