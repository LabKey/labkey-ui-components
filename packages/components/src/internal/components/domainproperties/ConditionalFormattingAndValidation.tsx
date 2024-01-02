import React, { FC, PureComponent, ReactNode } from 'react';
import { Col, Row } from 'react-bootstrap';
import { List } from 'immutable';

import { FIELD_EDITOR_TOPIC, HelpLink } from '../../util/helpLinks';

import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, createFormInputName } from './utils';
import {
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    DOMAIN_COND_FORMAT,
    DOMAIN_RANGE_VALIDATOR,
    DOMAIN_REGEX_VALIDATOR,
} from './constants';
import { ConditionalFormat, DomainField, IDomainFormDisplayOptions, PropertyValidator } from './models';
import { RegexValidationOptionsModal } from './validation/RegexValidationOptions';
import { RangeValidationOptionsModal } from './validation/RangeValidationOptions';
import { ConditionalFormatOptionsModal } from './validation/ConditionalFormatOptions';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

const RANGE_VALIDATION_TOPIC = FIELD_EDITOR_TOPIC + '#range';
const REGEX_TOPIC = FIELD_EDITOR_TOPIC + '#regex';
const CONDITIONAL_FORMAT_TOPIC = FIELD_EDITOR_TOPIC + '#conditional';

const RangeValidatorHelpText: FC = () => (
    <>
        <p>Range validators allow you to specify numeric comparisons that must be satisfied.</p>

        <p>
            Learn more about using <HelpLink topic={RANGE_VALIDATION_TOPIC}>Range Validation</HelpLink>.
        </p>
    </>
);

const RegexValidatorHelpText: FC = () => (
    <>
        <p>RegEx validators allow you to specify a regular expression that defines what string values are valid.</p>

        <p>
            Learn more about using <HelpLink topic={REGEX_TOPIC}>Regular Expression Validation</HelpLink>.
        </p>
    </>
);

const ConditionalFormatHelpText: FC = () => (
    <>
        <p>Conditional formats allow targeted display formatting for values that meet defined conditions.</p>

        <p>
            Learn more about using <HelpLink topic={CONDITIONAL_FORMAT_TOPIC}>Conditional Formats</HelpLink>.
        </p>
    </>
);

interface Props {
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    domainIndex: number;
    field: DomainField;
    index: number;
    onChange: (string, any) => void;
    showingModal: (boolean) => void;
}

interface State {
    showCondFormat: boolean;
    showRange: boolean;
    showRegex: boolean;
}

export class ConditionalFormattingAndValidation extends PureComponent<Props, State> {
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

    handleChange = (evt: any): void => {
        const { onChange } = this.props;
        onChange(evt.target.id, evt.target.value);
    };

    onApply = (validator: List<PropertyValidator | ConditionalFormat>, type: string): void => {
        const { onChange, index, domainIndex } = this.props;
        onChange(createFormInputId(type, domainIndex, index), validator);
    };

    showHideConditionalFormat = (): void => {
        const { showingModal } = this.props;

        this.setState(state => ({ showCondFormat: !state.showCondFormat }), () => showingModal(this.state.showCondFormat));
    };

    showHideRegexValidator = (): void => {
        const { showingModal } = this.props;

        this.setState(state => ({ showRegex: !state.showRegex }), () => showingModal(this.state.showRegex));
    };

    showHideRangeValidator = (): void => {
        const { showingModal } = this.props;

        this.setState(state => ({ showRange: !state.showRange }), () => showingModal(this.state.showRange));
    };

    renderValidator = (range: boolean): ReactNode => {
        const { field, index, domainIndex } = this.props;
        const validators = range ? field.rangeValidators : field.regexValidators;
        const count = validators ? validators.size : 0;

        return (
            <div className={range ? '' : 'domain-validation-group'}>
                <div className="domain-field-label domain-no-wrap">
                    <DomainFieldLabel
                        label={'Create ' + (range ? 'Range' : 'Regular Expression') + ' Validator'}
                        helpTipBody={range ? <RangeValidatorHelpText /> : <RegexValidatorHelpText />}
                    />
                </div>
                <div>
                    <button
                        className="domain-validation-button btn btn-default"
                        disabled={isFieldFullyLocked(field.lockType)}
                        id={createFormInputId(
                            range ? DOMAIN_RANGE_VALIDATOR : DOMAIN_REGEX_VALIDATOR,
                            domainIndex,
                            index
                        )}
                        name={createFormInputName(range ? DOMAIN_RANGE_VALIDATOR : DOMAIN_REGEX_VALIDATOR)}
                        onClick={range ? this.showHideRangeValidator : this.showHideRegexValidator}
                        type="button"
                    >
                        {count > 0 ? (range ? 'Edit Ranges' : 'Edit Regex') : range ? 'Add Range' : 'Add Regex'}
                    </button>
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
        );
    };

    renderConditionalFormats = (): ReactNode => {
        const { field, index, domainFormDisplayOptions, domainIndex } = this.props;
        if (domainFormDisplayOptions.hideConditionalFormatting) return null;

        const count = field.conditionalFormats ? field.conditionalFormats.size : 0;

        return (
            <div className="domain-validation-group">
                <div className="domain-field-label domain-no-wrap">
                    <DomainFieldLabel
                        label="Create Conditional Format Criteria"
                        helpTipBody={<ConditionalFormatHelpText />}
                    />
                </div>
                <div>
                    <button
                        className="domain-validation-button btn btn-default"
                        disabled={isFieldFullyLocked(field.lockType)}
                        id={createFormInputId(DOMAIN_COND_FORMAT, domainIndex, index)}
                        name={createFormInputName(DOMAIN_COND_FORMAT)}
                        onClick={this.showHideConditionalFormat}
                        type="button"
                    >
                        {count > 0 ? 'Edit Formats' : 'Add Format'}
                    </button>
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
        const { index, field, domainFormDisplayOptions } = this.props;
        const { showCondFormat, showRegex, showRange } = this.state;
        const showCondFormatSection = !domainFormDisplayOptions.hideConditionalFormatting;
        const showRegexSection = !domainFormDisplayOptions.hideValidators && DomainField.hasRegExValidation(field);
        const showRangeSection = !domainFormDisplayOptions.hideValidators && DomainField.hasRangeValidation(field);
        const showValidation = showRegexSection || showRangeSection;
        const title =
            (showCondFormatSection ? 'Conditional Formatting' : '') +
            (showCondFormatSection && showValidation ? ' and ' : '') +
            (showValidation ? 'Validation' : '') +
            ' Options';

        // don't render anything for this component if none of the sections apply
        if (!showCondFormatSection && !showRegexSection && !showRangeSection) {
            return null;
        }

        return (
            <div>
                <Row>
                    <Col xs={12}>
                        <SectionHeading title={title} cls="domain-field-section-hdr" />
                    </Col>
                </Row>
                <Row>
                    <Col xs={12}>
                        {showCondFormatSection && this.renderConditionalFormats()}
                        {showRegexSection && this.renderValidator(false)}
                        {showRangeSection && this.renderValidator(true)}
                        {showCondFormat && (
                            <ConditionalFormatOptionsModal
                                title={'Conditional Formatting ' + (field.name ? 'for ' + field.name : '')}
                                addName="Formatting"
                                index={index}
                                show={showCondFormat}
                                type={DOMAIN_COND_FORMAT}
                                mvEnabled={field.mvEnabled}
                                validators={field.conditionalFormats}
                                dataType={field.dataType}
                                onHide={this.showHideConditionalFormat}
                                onApply={this.onApply}
                            />
                        )}
                        {showRegex && (
                            <RegexValidationOptionsModal
                                title={'Regular Expression Validator(s) ' + (field.name ? 'for ' + field.name : '')}
                                addName="Validator"
                                index={index}
                                show={showRegex}
                                type={DOMAIN_REGEX_VALIDATOR}
                                mvEnabled={field.mvEnabled}
                                validators={field.regexValidators}
                                dataType={field.dataType}
                                onHide={this.showHideRegexValidator}
                                onApply={this.onApply}
                            />
                        )}
                        {showRange && (
                            <RangeValidationOptionsModal
                                title={'Range Validator(s) ' + (field.name ? 'for ' + field.name : '')}
                                addName="Validator"
                                index={index}
                                show={showRange}
                                type={DOMAIN_RANGE_VALIDATOR}
                                mvEnabled={field.mvEnabled}
                                validators={field.rangeValidators}
                                dataType={field.dataType}
                                onHide={this.showHideRangeValidator}
                                onApply={this.onApply}
                            />
                        )}
                    </Col>
                </Row>
            </div>
        );
    }
}
