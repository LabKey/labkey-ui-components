import React, { ReactNode } from 'react';
import { Col, FormControl } from 'react-bootstrap';

import { HelpLink, JavaDocsLink, NUMBER_FORMATS_TOPIC } from '../../util/helpLinks';

import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, createFormInputName } from './utils';
import { DEFAULT_SCALE_LINEAR, DEFAULT_SCALE_LOG, DOMAIN_FIELD_DEFAULT_SCALE, DOMAIN_FIELD_FORMAT } from './constants';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';
import { ScannableOption, ScannableProps } from './ScannableOption';

interface NumericFieldProps extends ScannableProps {
    defaultScale: string;
    format: string;
}

export class NumericFieldOptions extends React.PureComponent<NumericFieldProps> {
    onFieldChange = (evt): void => {
        const { onChange } = this.props;

        const value = evt.target.value;

        if (onChange) {
            onChange(evt.target.id, value);
        }
    };

    getFormatHelpText = (): ReactNode => {
        return (
            <>
                <p>
                    To control how a number value is displayed, provide a string format compatible with the Java{' '}
                    <JavaDocsLink urlSuffix="java/text/DecimalFormat.html">DecimalFormat</JavaDocsLink> class.
                </p>
                <p>
                    Learn more about using <HelpLink topic={NUMBER_FORMATS_TOPIC}>Number formats</HelpLink> in LabKey.
                </p>
            </>
        );
    };

    render(): ReactNode {
        const { index, label, format, defaultScale, lockType, domainIndex } = this.props;

        return (
            <div>
                <div className="row">
                    <Col xs={12}>
                        <SectionHeading title={label} />
                    </Col>
                </div>
                <div className="row">
                    <Col xs={3}>
                        <div className="domain-field-label">
                            <DomainFieldLabel label="Format for Numbers" helpTipBody={this.getFormatHelpText()} />
                        </div>
                    </Col>
                    <Col xs={2}>
                        <div className="domain-field-label">Default Scale Type</div>
                    </Col>
                </div>
                <div className="row">
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
                </div>
                <ScannableOption {...this.props} />
            </div>
        );
    }
}
