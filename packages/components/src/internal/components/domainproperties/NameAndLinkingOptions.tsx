import React, { PureComponent, ReactNode } from 'react';
import { List } from 'immutable';

import { HelpLink, URL_ENCODING_TOPIC } from '../../util/helpLinks';

import { OntologyConceptAnnotation } from '../ontology/OntologyConceptAnnotation';

import { ONTOLOGY_MODULE_NAME } from '../ontology/actions';

import { hasModule } from '../../app/utils';

import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, createFormInputName, isEmptyString } from './utils';
import {
    DOMAIN_FIELD_DESCRIPTION,
    DOMAIN_FIELD_IMPORTALIASES,
    DOMAIN_FIELD_LABEL,
    DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT,
    DOMAIN_FIELD_URL,
    DOMAIN_FIELD_URL_TARGET,
} from './constants';
import { DomainField, IDomainFormDisplayOptions, IFieldChange } from './models';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

interface NameAndLinkingProps {
    appPropertiesOnly?: boolean;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    domainIndex: number;
    field: DomainField;
    index: number;
    onChange: (string, any) => void;
    onMultiChange: (changes: List<IFieldChange>) => void;
}

export class NameAndLinkingOptions extends PureComponent<NameAndLinkingProps> {
    handleChange = (evt: any): void => {
        this.onChange(evt.target.id, evt.target.value);
    };

    onChange = (id: string, value: any): void => {
        this.props.onChange(id, value);
    };

    handleURLChange = (evt: any): void => {
        const { index, domainIndex } = this.props;
        const val = evt.target.value;
        const isEmpty = isEmptyString(val);

        // make sure to uncheck the "open in new tab" option if URL is cleared out
        if (isEmpty) {
            let changes = List<IFieldChange>();
            changes = changes.push({ id: evt.target.id, value: null });
            changes = changes.push({
                id: createFormInputId(DOMAIN_FIELD_URL_TARGET, domainIndex, index),
                value: false,
            });
            this.props.onMultiChange(changes);
        } else {
            this.onChange(evt.target.id, isEmpty ? null : val);
        }
    };

    handleURLTargetChange = (evt: any): void => {
        this.onChange(evt.target.id, evt.target.checked);
    };

    getImportAliasHelpText = (): ReactNode => {
        return (
            <>
                Define alternate field names to be used when importing from a file.
                <br />
                <br />
                Multiple aliases may be separated by spaces or commas. To define an alias that contains spaces, use
                double-quotes (") around it.
            </>
        );
    };

    getURLHelpText = (): ReactNode => {
        return (
            <>
                Use this to change the display of the field value within a data grid into a link. Multiple formats are
                supported, which allows ways to easily substitute and link to other locations in LabKey.
                <br />
                <br />
                Learn more about using <HelpLink topic={URL_ENCODING_TOPIC}>URL Formatting Options</HelpLink>.
            </>
        );
    };

    render(): ReactNode {
        const { index, field, domainIndex, appPropertiesOnly, domainFormDisplayOptions } = this.props;

        return (
            <div>
                <div className="row">
                    <div className="col-xs-12">
                        <SectionHeading cls="domain-field-section-hdr" title="Name and Linking Options" />
                    </div>
                </div>
                <div className="row">
                    <div className="col-xs-5">
                        <div className="domain-field-label">Description</div>
                        <textarea
                            className="form-control"
                            disabled={isFieldFullyLocked(field.lockType)}
                            id={createFormInputId(DOMAIN_FIELD_DESCRIPTION, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_DESCRIPTION)}
                            onChange={this.handleChange}
                            rows={4}
                            value={field.description || ''}
                        />
                    </div>
                    <div className="col-xs-3">
                        <div className="domain-field-label">Label</div>
                        <input
                            className="form-control"
                            disabled={isFieldFullyLocked(field.lockType)}
                            id={createFormInputId(DOMAIN_FIELD_LABEL, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_LABEL)}
                            onChange={this.handleChange}
                            type="text"
                            value={field.label || ''}
                        />
                        {!field.isUniqueIdField() &&
                            !field.isCalculatedField() &&
                            !domainFormDisplayOptions?.hideImportAliases && (
                                <>
                                    <div className="domain-field-label">
                                        <DomainFieldLabel
                                            helpTipBody={this.getImportAliasHelpText()}
                                            label="Import Aliases"
                                        />
                                    </div>
                                    <input
                                        className="form-control"
                                        disabled={isFieldFullyLocked(field.lockType)}
                                        id={createFormInputId(DOMAIN_FIELD_IMPORTALIASES, domainIndex, index)}
                                        name={createFormInputName(DOMAIN_FIELD_IMPORTALIASES)}
                                        onChange={this.handleChange}
                                        type="text"
                                        value={field.importAliases || ''}
                                    />
                                </>
                            )}
                    </div>
                    <div className="col-xs-4">
                        {!appPropertiesOnly &&
                            hasModule(ONTOLOGY_MODULE_NAME) &&
                            !field.isUniqueIdField() &&
                            !field.isCalculatedField() && (
                                <OntologyConceptAnnotation
                                    field={field}
                                    id={createFormInputId(DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT, domainIndex, index)}
                                    onChange={this.onChange}
                                />
                            )}
                        <div className="domain-field-label">
                            <DomainFieldLabel helpTipBody={this.getURLHelpText()} label="URL" />
                        </div>
                        <input
                            className="form-control"
                            disabled={isFieldFullyLocked(field.lockType)}
                            id={createFormInputId(DOMAIN_FIELD_URL, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_URL)}
                            onChange={this.handleURLChange}
                            type="text"
                            value={field.URL || ''}
                        />
                        {/*GitHub Issue 503: Field editor URL option to set target window (i.e. _blank)*/}
                        <div className="domain-text-options-col">
                            <input
                                checked={field.isTargetBlank}
                                className="form-control domain-text-option-istargetblank"
                                disabled={isFieldFullyLocked(field.lockType) || isEmptyString(field.URL)}
                                id={createFormInputId(DOMAIN_FIELD_URL_TARGET, domainIndex, index)}
                                name={createFormInputName(DOMAIN_FIELD_URL_TARGET)}
                                onChange={this.handleURLTargetChange}
                                type="checkbox"
                            />
                            <span>Open links in a new tab</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
