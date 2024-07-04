import React, { ReactNode } from 'react';

import { Checkbox } from '../Checkbox';

import { createFormInputId, createFormInputName, getNameFromId } from '../utils';
import {
    DOMAIN_VALIDATOR_DESCRIPTION,
    DOMAIN_VALIDATOR_ERRORMESSAGE,
    DOMAIN_VALIDATOR_EXPRESSION,
    DOMAIN_VALIDATOR_FAILONMATCH,
    DOMAIN_VALIDATOR_NAME,
    DOMAIN_VALIDATOR_REMOVE,
} from '../constants';

import { PropertyValidator } from '../models';
import { PropDescType } from '../PropDescType';
import { JavaDocsLink } from '../../../util/helpLinks';
import { LabelHelpTip } from '../../base/LabelHelpTip';

import { ValidatorModal } from './ValidatorModal';

interface RegexValidationOptionsProps {
    dataType: PropDescType;
    domainIndex: number;
    expanded: boolean;
    index: number;
    onChange: (validator: PropertyValidator, index: number) => void;
    onDelete: (index: number) => void;
    onExpand: (index: number) => void;
    validator: any;
    validatorIndex: number;
}

export class RegexValidationOptions extends React.PureComponent<RegexValidationOptionsProps> {
    fieldWidth = 8;

    static isValid = (validator: PropertyValidator): boolean => {
        return !!validator.get('expression') && !!validator.get('name');
    };

    renderRowTextbox = (
        label: string,
        name: string,
        value: string,
        tooltipTitle?: string,
        tooltipBody?: ReactNode,
        required?: boolean
    ): ReactNode => {
        const { validatorIndex, domainIndex } = this.props;

        return (
            <div className="row domain-validator-filter-row">
                <div className="col-xs-4">
                    <div>
                        {label}
                        {tooltipTitle && tooltipBody && (
                            <LabelHelpTip title={tooltipTitle} required={required}>
                                {tooltipBody}
                            </LabelHelpTip>
                        )}
                    </div>
                </div>
                <div className="col-xs-8">
                    <div>
                        <textarea
                            className="form-control textarea-fullwidth"
                            rows={3}
                            id={createFormInputId(name, domainIndex, validatorIndex)}
                            name={createFormInputName(name)}
                            value={value}
                            onChange={this.onChange}
                        />
                    </div>
                </div>
            </div>
        );
    };

    onDelete = (): void => {
        const { onDelete, validatorIndex } = this.props;
        onDelete(validatorIndex);
    };

    onChange = (evt): void => {
        const { onChange, validator, validatorIndex } = this.props;

        const value = evt.target.value;
        const name = getNameFromId(evt.target.id);

        let newValidator;
        if (name === DOMAIN_VALIDATOR_FAILONMATCH) {
            const newProperties = validator.properties.set(name, evt.target.checked);
            newValidator = validator.set('properties', newProperties);
        } else {
            newValidator = validator.set(name, value);
        }

        onChange(newValidator, validatorIndex);
    };

    expandValidator = (): void => {
        const { onExpand, validatorIndex } = this.props;
        onExpand(validatorIndex);
    };

    render(): ReactNode {
        const { validatorIndex, expanded, validator, domainIndex } = this.props;

        return (
            <div className="domain-validator-panel" id={'domain-regex-validator-' + validatorIndex}>
                {expanded && (
                    <div>
                        {this.renderRowTextbox(
                            'Regular Expression *',
                            DOMAIN_VALIDATOR_EXPRESSION,
                            validator.expression,
                            'Regular Expression',
                            <p>
                                The regular expression that this field's value will be evaluated against. All regular
                                expressions must be compatible with Java regular expressions as implemented in the{' '}
                                <JavaDocsLink urlSuffix="java/util/regex/Pattern.html">Pattern</JavaDocsLink> class.
                            </p>,
                            true
                        )}
                        {this.renderRowTextbox('Description', DOMAIN_VALIDATOR_DESCRIPTION, validator.description)}
                        {this.renderRowTextbox(
                            'Error Message',
                            DOMAIN_VALIDATOR_ERRORMESSAGE,
                            validator.errorMessage,
                            'Error Message',
                            'The message that will be displayed to the user in the event that validation fails for this field.'
                        )}
                        <div className="row">
                            <div className="col-xs-4" />
                            <div className="col-xs-8 domain-validation-failOnMatch-row">
                                <Checkbox
                                    id={createFormInputId(DOMAIN_VALIDATOR_FAILONMATCH, domainIndex, validatorIndex)}
                                    name={createFormInputName(DOMAIN_VALIDATOR_FAILONMATCH)}
                                    checked={validator.properties.failOnMatch}
                                    onChange={this.onChange}
                                >
                                    Fail validation when pattern matches field value
                                    <LabelHelpTip title="Fail when pattern matches?">
                                        By default, validation will fail if the field value does not match the specified
                                        regular expression. Check this box if you want validation to fail when the
                                        pattern matches the field value.
                                    </LabelHelpTip>
                                </Checkbox>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-xs-4">
                                <div>Name *</div>
                            </div>
                            <div className="col-xs-8">
                                <input
                                    className="form-control"
                                    type="text"
                                    id={createFormInputId(DOMAIN_VALIDATOR_NAME, domainIndex, validatorIndex)}
                                    name={createFormInputName(DOMAIN_VALIDATOR_NAME)}
                                    value={validator.name}
                                    onChange={this.onChange}
                                />
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-xs-12">
                                <button
                                    className="domain-validation-delete btn btn-default"
                                    id={createFormInputId(DOMAIN_VALIDATOR_REMOVE, domainIndex, validatorIndex)}
                                    name={createFormInputName(DOMAIN_VALIDATOR_REMOVE)}
                                    onClick={this.onDelete}
                                    type="button"
                                >
                                    Remove Validator
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {!expanded && (
                    <div>
                        <div>
                            {(validator.name ? validator.name : 'Regex Validator') +
                                ': ' +
                                (validator.expression ? validator.expression : 'Missing expression')}
                            <div className="domain-validator-collapse-icon" onClick={this.expandValidator}>
                                <span className="fa fa-pencil" />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
}

export const RegexValidationOptionsModal = ValidatorModal(RegexValidationOptions);
