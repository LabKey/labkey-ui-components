import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import { List } from 'immutable';

import {
    FIELD_EDITOR_CONDITIONAL_FORMAT_TOPIC,
    FIELD_EDITOR_RANGE_VALIDATION_TOPIC,
    FIELD_EDITOR_REGEX_TOPIC,
    helpLinkNode,
} from '../../../util/helpLinks';

import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, createFormInputName } from './actions';
import { DOMAIN_COND_FORMAT, DOMAIN_RANGE_VALIDATOR, DOMAIN_REGEX_VALIDATOR } from './constants';
import {
    ConditionalFormat,
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    DomainField,
    IDomainFormDisplayOptions,
    PropertyValidator,
} from './models';
import { ValidatorModal } from './validation/ValidatorModal';
import { RegexValidationOptions } from './validation/RegexValidationOptions';
import { RangeValidationOptions } from './validation/RangeValidationOptions';
import { ConditionalFormatOptions } from './validation/ConditionalFormatOptions';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

interface ConditionalFormattingAndValidationProps {
    index: number;
    domainIndex: number;
    field: DomainField;
    onChange: (string, any) => any;
    showingModal: (boolean) => any;
    hideConditionalFormatting?: boolean;
    successBsStyle?: string;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
}

interface ConditionalFormattingAndValidationState {
    showCondFormat: boolean;
    showRegex: boolean;
    showRange: boolean;
}

export class ConditionalFormattingAndValidation extends React.PureComponent<
    ConditionalFormattingAndValidationProps,
    ConditionalFormattingAndValidationState
> {
    static defaultProps = {
        domainFormDisplayOptions: DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    };

    constructor(props) {
        super(props);

        this.state = {
            showCondFormat: false,
            showRegex: false,
            showRange: false,
        };
    }

    handleChange = (evt: any) => {
        const { onChange } = this.props;
        if (onChange) {
            onChange(evt.target.id, evt.target.value);
        }
    };

    onApply = (validator: List<PropertyValidator | ConditionalFormat>, type: string) => {
        const { onChange, index, domainIndex } = this.props;
        onChange(createFormInputId(type, domainIndex, index), validator);
    };

    getRangeValidatorHelpText = () => {
        return (
            <>
                <p>Range validators allow you to specify numeric comparisons that must be satisfied.</p>

                <p>Learn more about using {helpLinkNode(FIELD_EDITOR_RANGE_VALIDATION_TOPIC, 'Range Validation')}.</p>
            </>
        );
    };

    getRegexValidatorHelpText = () => {
        return (
            <>
                <p>
                    RegEx validators allow you to specify a regular expression that defines what string values are
                    valid.
                </p>

                <p>Learn more about using {helpLinkNode(FIELD_EDITOR_REGEX_TOPIC, 'Regular Expression Validation')}.</p>
            </>
        );
    };

    getConditionalFormatHelpText = () => {
        return (
            <>
                <p>Conditional formats allow targeted display formatting for values that meet defined conditions.</p>

                <p>
                    Learn more about using {helpLinkNode(FIELD_EDITOR_CONDITIONAL_FORMAT_TOPIC, 'Conditional Formats')}.
                </p>
            </>
        );
    };

    showHideConditionalFormat = () => {
        const { showingModal } = this.props;

        this.setState(state => ({ showCondFormat: !state.showCondFormat }), showingModal(this.state.showCondFormat));
    };

    showHideRegexValidator = () => {
        const { showingModal } = this.props;

        this.setState(state => ({ showRegex: !state.showRegex }), showingModal(this.state.showRegex));
    };

    showHideRangeValidator = () => {
        const { showingModal } = this.props;

        this.setState(state => ({ showRange: !state.showRange }), showingModal(this.state.showRange));
    };

    renderValidator = (range: boolean) => {
        const { field, index, domainIndex, domainFormDisplayOptions } = this.props;

        const validators = range ? field.rangeValidators : field.regexValidators;
        const count = validators ? validators.size : 0;

        return (
            <>
                {!domainFormDisplayOptions.hideValidators && (
                    <div className={range ? '' : 'domain-validation-group'}>
                        <div className="domain-field-label domain-no-wrap">
                            <DomainFieldLabel
                                label={'Create ' + (range ? 'Range' : 'Regular Expression') + ' Validator'}
                                helpTipBody={range ? this.getRangeValidatorHelpText : this.getRegexValidatorHelpText}
                            />
                        </div>
                        <div>
                            <Button
                                className="domain-validation-button"
                                name={createFormInputName(range ? DOMAIN_RANGE_VALIDATOR : DOMAIN_REGEX_VALIDATOR)}
                                id={createFormInputId(
                                    range ? DOMAIN_RANGE_VALIDATOR : DOMAIN_REGEX_VALIDATOR,
                                    domainIndex,
                                    index
                                )}
                                disabled={isFieldFullyLocked(field.lockType)}
                                onClick={range ? this.showHideRangeValidator : this.showHideRegexValidator}
                            >
                                {count > 0 ? (range ? 'Edit Ranges' : 'Edit Regex') : range ? 'Add Range' : 'Add Regex'}
                            </Button>
                            {count === 0 ? (
                                <span className="domain-text-label">None Set</span>
                            ) : (
                                <a
                                    className="domain-validator-link"
                                    onClick={
                                        isFieldFullyLocked(field.lockType)
                                            ? () => {}
                                            : range
                                            ? this.showHideRangeValidator
                                            : this.showHideRegexValidator
                                    }
                                >
                                    {'' + count + ' Active validator' + (count > 1 ? 's' : '')}
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </>
        );
    };

    renderConditionalFormats = () => {
        const { field, index, hideConditionalFormatting, domainIndex } = this.props;
        if (hideConditionalFormatting) return null;

        const count = field.conditionalFormats ? field.conditionalFormats.size : 0;

        return (
            <div className="domain-validation-group">
                <div className="domain-field-label domain-no-wrap">
                    <DomainFieldLabel
                        label="Create Conditional Format Criteria"
                        helpTipBody={this.getConditionalFormatHelpText}
                    />
                </div>
                <div>
                    <Button
                        className="domain-validation-button"
                        name={createFormInputName(DOMAIN_COND_FORMAT)}
                        id={createFormInputId(DOMAIN_COND_FORMAT, domainIndex, index)}
                        disabled={isFieldFullyLocked(field.lockType)}
                        onClick={this.showHideConditionalFormat}
                    >
                        {count > 0 ? 'Edit Formats' : 'Add Format'}
                    </Button>
                    {count === 0 ? (
                        <span className="domain-text-label">None Set</span>
                    ) : (
                        <a
                            className="domain-validator-link"
                            onClick={isFieldFullyLocked(field.lockType) ? () => {} : this.showHideConditionalFormat}
                        >
                            {'' + count + ' Active format' + (count > 1 ? 's' : '')}
                        </a>
                    )}
                </div>
            </div>
        );
    };

    render() {
        const { index, field, hideConditionalFormatting, successBsStyle } = this.props;
        const { showCondFormat, showRegex, showRange } = this.state;

        const CondFormatModal = ValidatorModal(ConditionalFormatOptions);
        const RangeValidator = ValidatorModal(RangeValidationOptions);
        const RegexValidator = ValidatorModal(RegexValidationOptions);

        const title = hideConditionalFormatting
            ? 'Validation Options'
            : 'Conditional Formatting and Validation Options';
        const showCondFormatSection = !hideConditionalFormatting;
        const showRegexSection = DomainField.hasRegExValidation(field);
        const showRangeSection = DomainField.hasRangeValidation(field);

        // don't render anything for this component if none of the sections apply
        if (!showCondFormatSection && !showRegexSection && !showRangeSection) {
            return null;
        }

        return (
            <div>
                <Row className="domain-row-expanded">
                    <Col xs={12}>
                        <SectionHeading title={title} cls="domain-field-section-hdr" />
                    </Col>
                </Row>
                <Row className="domain-row-expanded">
                    <Col xs={12}>
                        {showCondFormatSection && this.renderConditionalFormats()}
                        {showRegexSection && this.renderValidator(false)}
                        {showRangeSection && this.renderValidator(true)}
                        {showCondFormat && (
                            <CondFormatModal
                                title={'Conditional Formatting ' + (field.name ? 'for ' + field.name : '')}
                                subTitle="Add New Formatting:"
                                addName="formatting"
                                index={index}
                                show={showCondFormat}
                                type={DOMAIN_COND_FORMAT}
                                mvEnabled={field.mvEnabled}
                                validators={field.conditionalFormats}
                                dataType={field.dataType}
                                onHide={this.showHideConditionalFormat}
                                onApply={this.onApply}
                                successBsStyle={successBsStyle}
                            />
                        )}
                        {showRegex && (
                            <RegexValidator
                                title={'Regular Expression Validator ' + (field.name ? 'for ' + field.name : '')}
                                subTitle="Add New Validation Criteria:"
                                addName="Regex Validator"
                                index={index}
                                show={showRegex}
                                type={DOMAIN_REGEX_VALIDATOR}
                                mvEnabled={field.mvEnabled}
                                validators={field.regexValidators}
                                dataType={field.dataType}
                                onHide={this.showHideRegexValidator}
                                onApply={this.onApply}
                                successBsStyle={successBsStyle}
                            />
                        )}
                        {showRange && (
                            <RangeValidator
                                title={'Range Validator ' + (field.name ? 'for ' + field.name : '')}
                                subTitle="Add New Validation Criteria:"
                                addName="Range Validator"
                                index={index}
                                show={showRange}
                                type={DOMAIN_RANGE_VALIDATOR}
                                mvEnabled={field.mvEnabled}
                                validators={field.rangeValidators}
                                dataType={field.dataType}
                                onHide={this.showHideRangeValidator}
                                onApply={this.onApply}
                                successBsStyle={successBsStyle}
                            />
                        )}
                    </Col>
                </Row>
            </div>
        );
    }
}
