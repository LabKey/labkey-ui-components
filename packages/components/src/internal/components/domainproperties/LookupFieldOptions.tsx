import React from 'react';
import { Checkbox } from 'react-bootstrap';
import { List } from 'immutable';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { createFormInputId, createFormInputName, getIndexFromId, getNameFromId } from './utils';
import {
    DOMAIN_FIELD_FULLY_LOCKED,
    DOMAIN_FIELD_LOOKUP_CONTAINER,
    DOMAIN_FIELD_LOOKUP_QUERY,
    DOMAIN_FIELD_LOOKUP_SCHEMA,
    DOMAIN_FIELD_PARTIALLY_LOCKED,
    DOMAIN_VALIDATOR_LOOKUP,
    LOOKUP_VALIDATOR_VALUES,
} from './constants';
import { DomainField, IFieldChange, ITypeDependentProps, PropertyValidator } from './models';
import { FolderSelect, SchemaSelect, TargetTableSelect } from './Lookup/Fields';

interface LookupFieldProps extends ITypeDependentProps {
    field: DomainField;
    lookupContainer: string;
    onMultiChange: (changes: List<IFieldChange>) => void;
}

export class LookupFieldOptions extends React.PureComponent<LookupFieldProps, any> {
    onFieldChange = evt => {
        const { onMultiChange, domainIndex } = this.props;
        const index = getIndexFromId(evt.target.id);
        const name = getNameFromId(evt.target.id);

        let changes = List<IFieldChange>();
        changes = changes.push({ id: evt.target.id, value: evt.target.value } as IFieldChange);

        if (name === DOMAIN_FIELD_LOOKUP_CONTAINER) {
            changes = changes.push({
                id: createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, domainIndex, index),
                value: '',
            });
            changes = changes.push({ id: createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, domainIndex, index), value: '' });
        }

        if (name === DOMAIN_FIELD_LOOKUP_SCHEMA) {
            changes = changes.push({ id: createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, domainIndex, index), value: '' });
        }

        if (onMultiChange) {
            onMultiChange(changes);
        }
    };

    addLookupValidator = evt => {
        const { onMultiChange } = this.props;

        let newLookupValidator;

        if (evt.target.checked) {
            newLookupValidator = new PropertyValidator(LOOKUP_VALIDATOR_VALUES);
        }

        let changes = List<IFieldChange>();
        changes = changes.push({ id: evt.target.id, value: newLookupValidator } as IFieldChange);

        if (onMultiChange) {
            onMultiChange(changes);
        }
    };

    render() {
        const { index, label, lookupContainer, lockType, domainIndex, field } = this.props;
        const {
            lookupSchema,
            lookupQueryValue,
            lookupValidator,
            original,
            lookupIsValid,
            wrappedColumnName,
            dataType,
        } = field;
        const disabled = lockType === DOMAIN_FIELD_PARTIALLY_LOCKED || lockType === DOMAIN_FIELD_FULLY_LOCKED;
        const isUserLookup = dataType.isUser();

        return (
            <div>
                <div className="row">
                    <div className="col-xs-12">
                        <div className="domain-field-section-heading">{label}</div>
                    </div>
                </div>
                <div className="row">
                    {!isUserLookup && (
                        <>
                            <div className="col-xs-2">
                                <div className="domain-field-label">Target Folder</div>
                                <FolderSelect
                                    id={createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, domainIndex, index)}
                                    key={createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, domainIndex, index)}
                                    disabled={disabled}
                                    onChange={this.onFieldChange}
                                    value={lookupContainer}
                                />
                            </div>
                            <div className="col-xs-2">
                                <div className="domain-field-label">Target Schema</div>
                                <SchemaSelect
                                    containerPath={lookupContainer}
                                    id={createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, domainIndex, index)}
                                    key={createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, domainIndex, index)}
                                    disabled={disabled}
                                    onChange={this.onFieldChange}
                                    value={lookupSchema}
                                />
                            </div>
                            <div className="col-xs-2">
                                <div className="domain-field-label">Target Table</div>
                                <TargetTableSelect
                                    containerPath={lookupContainer}
                                    id={createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, domainIndex, index)}
                                    key={createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, domainIndex, index)}
                                    disabled={disabled}
                                    lookupURI={original.rangeURI}
                                    onChange={this.onFieldChange}
                                    schemaName={lookupSchema}
                                    value={lookupQueryValue}
                                    lookupIsValid={lookupIsValid}
                                    shouldDisableNonExists={!wrappedColumnName && lookupIsValid} // Only disable non-wrapped fields with valid lookup value if the value is not in the query list
                                />
                            </div>
                        </>
                    )}
                    <div className="col-xs-6">
                        <div className="domain-field-label">Lookup Validator</div>
                        <Checkbox
                            className="domain-field-checkbox-margin"
                            id={createFormInputId(DOMAIN_VALIDATOR_LOOKUP, domainIndex, index)}
                            name={createFormInputName(DOMAIN_VALIDATOR_LOOKUP)}
                            checked={!!lookupValidator}
                            onChange={this.addLookupValidator}
                        >
                            <span className="domain-lookup-validator-text">Ensure Value Exists in Lookup Target</span>
                            <LabelHelpTip title="Lookup Validator">
                                <div>
                                    Lookup validators allow you to require that any value is present in the lookup's
                                    target table or query
                                </div>
                            </LabelHelpTip>
                        </Checkbox>
                    </div>
                </div>
            </div>
        );
    }
}
