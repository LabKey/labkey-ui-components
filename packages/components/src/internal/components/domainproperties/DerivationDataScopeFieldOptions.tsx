import React from 'react';
import { Checkbox, Col, Row } from 'react-bootstrap';

import { createFormInputId, createFormInputName, getCheckedValue } from './actions';
import { isFieldFullyLocked } from './propertiesUtil';
import { DOMAIN_FIELD_DERIVATION_DATA_SCOPE } from './constants';
import { IDerivationDataScope, ITypeDependentProps } from './models';
import { SectionHeading } from './SectionHeading';
import { LabelHelpTip } from "../../..";

interface Props extends ITypeDependentProps {
    value?: string;
    config?: IDerivationDataScope;
}

const CHILD_ONLY = 'ChildOnly';

export class DerivationDataScopeFieldOptions extends React.PureComponent<Props, any> {

    static defaultProps = {
        config: {
            show: true,
            disable: false,
            fieldLabel: 'Derivation Data Scope'
        },
    };

    handleCheckboxChange = (evt) => {
        const { onChange } = this.props;

        if (onChange) {
            const value = getCheckedValue(evt);
            onChange(evt.target.id, value ? CHILD_ONLY : '');
        }

    };

    renderHelp() {
        const { config } = this.props;
        return config.helpLinkNode ? config.helpLinkNode :
            <LabelHelpTip title="Child specific field">
                <div>
                    <p>
                        If checked, this field is only available for child data.
                    </p>
                </div>
            </LabelHelpTip>
    }

    render() {
        const { index, label, value, lockType, domainIndex, config } = this.props;

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
                            checked={value?.toLocaleLowerCase() === CHILD_ONLY.toLocaleLowerCase()}
                            onChange={this.handleCheckboxChange}
                            id={createFormInputId(DOMAIN_FIELD_DERIVATION_DATA_SCOPE, domainIndex, index)}
                            disabled={config.disable || isFieldFullyLocked(lockType)}
                            name={createFormInputName(DOMAIN_FIELD_DERIVATION_DATA_SCOPE)}
                        >
                            {config.fieldLabel}
                            {this.renderHelp()}
                        </Checkbox>
                    </Col>
                </Row>
            </div>
        );
    }
}
