import React from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { createFormInputId, createFormInputName, getNameFromId } from './actions';
import { isFieldFullyLocked } from './propertiesUtil';
import {
    DOMAIN_FIELD_CUSTOM_LENGTH,
    DOMAIN_FIELD_MAX_LENGTH,
    DOMAIN_FIELD_SCALE,
    DOMAIN_FIELD_SCANNABLE_OPTION,
    MAX_TEXT_LENGTH,
    UNLIMITED_TEXT_LENGTH,
} from './constants';
import { ITypeDependentProps } from './models';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

interface TextFieldProps extends ITypeDependentProps {
    scale: number;
    scannable?: boolean;
    appPropertiesOnly?: boolean;
    showScannableOption?: boolean;
}

export interface TextFieldState {
    radio: string;
}

export class TextFieldOptions extends React.PureComponent<TextFieldProps, TextFieldState> {
    constructor(props) {
        super(props);

        this.state = {
            radio: DOMAIN_FIELD_MAX_LENGTH,
        };
    }

    componentDidMount(): void {
        this.setState({
            radio:
                !this.props.scale || this.props.scale > MAX_TEXT_LENGTH
                    ? DOMAIN_FIELD_MAX_LENGTH
                    : DOMAIN_FIELD_CUSTOM_LENGTH,
        });
    }

    handleChange = (event: any) => {
        const { onChange, scale, domainIndex, index } = this.props;
        const target = event.target;

        // Initially set to handle custom character count
        let scaleId = target.id;
        let value = event.target.value;

        const fieldName = getNameFromId(target.id);

        // If handling radio button
        if (fieldName !== DOMAIN_FIELD_SCALE) {
            this.setState({ radio: value }); // set local state
            scaleId = createFormInputId(DOMAIN_FIELD_SCALE, domainIndex, index); // updating scale
            value = value === DOMAIN_FIELD_MAX_LENGTH ? UNLIMITED_TEXT_LENGTH : MAX_TEXT_LENGTH;
        } else {
            value = parseInt(value);
        }

        if (onChange && value !== scale) {
            onChange(scaleId, value);
        }
    };

    handleScannableOptionToggle = (event: any): void => {
        const { onChange } = this.props;
        const target = event.target;

        onChange?.(target.id, target.checked);
    };

    getMaxCountHelpText = () => {
        return (
            <>
                <p>Sets the maximum character count for a text field.</p>
                <p>Anything over 4,000 characters will use the 'Unlimited' designation.</p>
            </>
        );
    };

    renderIsScannableOption = () => {
        const { domainIndex, index, lockType, scannable = false, appPropertiesOnly, showScannableOption } = this.props;
        if (!appPropertiesOnly || !showScannableOption) return undefined;

        return (
            <>
                <Row>
                    <Col xs={3}>
                        <div className="domain-field-label">
                            <DomainFieldLabel
                                label="Barcode Field"
                                helpTipBody={
                                    'When using the Find Samples dialog from the search bar and choosing the\n' +
                                    '                                        "Barcodes" option, text fields\n' +
                                    '                                        that are designated as Barcode fields will be queried\n' +
                                    '                                        along with any UniqueId fields for this sample type.'
                                }
                            />
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12} className="domain-text-options-col">
                        <FormControl
                            type="checkbox"
                            id={createFormInputId(DOMAIN_FIELD_SCANNABLE_OPTION, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_SCANNABLE_OPTION)}
                            className="domain-text-option-scannable"
                            onChange={this.handleScannableOptionToggle}
                            disabled={isFieldFullyLocked(lockType)}
                            checked={scannable}
                        />
                        <span>Search this field when scanning samples</span>
                    </Col>
                </Row>
            </>
        );
    };

    render() {
        const { index, label, scale, lockType, domainIndex } = this.props;
        const { radio } = this.state;
        const textOptionsFormControl = (
            <FormControl
                type="number"
                id={createFormInputId(DOMAIN_FIELD_SCALE, domainIndex, index)}
                name={createFormInputName(DOMAIN_FIELD_SCALE)}
                className="domain-text-length-field"
                value={typeof scale !== 'undefined' && radio === DOMAIN_FIELD_CUSTOM_LENGTH ? scale : MAX_TEXT_LENGTH}
                onChange={this.handleChange}
                disabled={isFieldFullyLocked(lockType) || radio === DOMAIN_FIELD_MAX_LENGTH}
            />
        );

        return (
            <div>
                <Row>
                    <Col xs={12}>
                        <SectionHeading title={label} />
                    </Col>
                </Row>
                <Row>
                    <Col xs={12}>
                        <div className="domain-field-label">
                            <DomainFieldLabel label="Maximum Text Length" helpTipBody={this.getMaxCountHelpText()} />
                        </div>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12} className="domain-text-options-col">
                        <FormControl
                            type="radio"
                            className="domain-text-options-radio1 domain-field-float-left"
                            value={DOMAIN_FIELD_MAX_LENGTH}
                            checked={radio === DOMAIN_FIELD_MAX_LENGTH}
                            onChange={this.handleChange}
                            id={createFormInputId(DOMAIN_FIELD_MAX_LENGTH, domainIndex, index)}
                            disabled={isFieldFullyLocked(lockType)}
                        />
                        <div>Unlimited</div>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12}>
                        <FormControl
                            type="radio"
                            className="domain-text-options-radio2 domain-field-float-left"
                            value={DOMAIN_FIELD_CUSTOM_LENGTH}
                            checked={radio === DOMAIN_FIELD_CUSTOM_LENGTH}
                            onChange={this.handleChange}
                            id={createFormInputId(DOMAIN_FIELD_CUSTOM_LENGTH, domainIndex, index)}
                        />
                        <span className="domain-text-options-length domain-field-float-left">
                            No longer than {textOptionsFormControl} characters
                        </span>
                    </Col>
                </Row>
                {this.renderIsScannableOption()}
            </div>
        );
    }
}
