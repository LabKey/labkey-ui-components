import React from 'react';
import {Checkbox, Col, Row} from 'react-bootstrap';

import { createFormInputId, createFormInputName, getCheckedValue } from './actions';
import { isFieldFullyLocked } from './propertiesUtil';
import { DOMAIN_FIELD_DERIVATION_DATA_SCOPE } from './constants';
import { ITypeDependentProps } from './models';
import { SectionHeading } from './SectionHeading';
import { helpLinkNode, LabelHelpTip } from "../../..";
import { SAMPLE_ALIQUOT_TOPIC } from "../../util/helpLinks";

interface AliquotFieldProps extends ITypeDependentProps {
    value?: string;
    disabled?: boolean;
}

const ALIQUOT_ONLY = 'ChildOnly'; // todo, define Enum

export class MaterialPropertyFieldOptions extends React.PureComponent<AliquotFieldProps, any> {
    handleCheckboxChange = (evt) => {
        const { onChange } = this.props;

        if (onChange) {
            const value = getCheckedValue(evt);
            onChange(evt.target.id, value ? ALIQUOT_ONLY : '');
        }

    };

    render() {
        const { index, label, value, lockType, domainIndex, disabled } = this.props;

        return (
            <div>
                <Row>
                    <Col xs={12}>
                        <SectionHeading title={label} cls="domain-field-section-hdr" />
                    </Col>
                </Row>
                <Row>
                    <Col xs={3}>
                        <Checkbox
                            checked={value?.toLocaleLowerCase() === ALIQUOT_ONLY.toLocaleLowerCase()}
                            onChange={this.handleCheckboxChange}
                            id={createFormInputId(DOMAIN_FIELD_DERIVATION_DATA_SCOPE, domainIndex, index)}
                            disabled={disabled || isFieldFullyLocked(lockType)}
                            name={createFormInputName(DOMAIN_FIELD_DERIVATION_DATA_SCOPE)}
                        >
                            Aliquot specific field
                            <LabelHelpTip title="Aliquot specific field">
                                <div>
                                    <p>
                                        If checked, this field is only available for aliquots, but not for samples that are not aliquots.
                                    </p>
                                    <p>
                                        Learn more about {' '}
                                        {helpLinkNode(SAMPLE_ALIQUOT_TOPIC, 'Sample Aliquots')}.
                                    </p>
                                </div>
                            </LabelHelpTip>
                        </Checkbox>
                    </Col>
                </Row>
            </div>
        );
    }
}
