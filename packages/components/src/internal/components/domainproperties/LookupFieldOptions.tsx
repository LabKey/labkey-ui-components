import React from 'react';
import { Checkbox, Col, Row } from 'react-bootstrap';
import { List } from 'immutable';

import { LabelHelpTip } from '../../..';

import { createFormInputId, createFormInputName, getIndexFromId, getNameFromId } from './actions';
import {
    DOMAIN_FIELD_FULLY_LOCKED,
    DOMAIN_FIELD_LOOKUP_CONTAINER,
    DOMAIN_FIELD_LOOKUP_QUERY,
    DOMAIN_FIELD_LOOKUP_SCHEMA,
    DOMAIN_FIELD_PARTIALLY_LOCKED,
    DOMAIN_VALIDATOR_LOOKUP,
} from './constants';
import { IDomainField, IFieldChange, ITypeDependentProps, PropertyValidator } from './models';
import { FolderSelect, SchemaSelect, TargetTableSelect } from './Lookup/Fields';

interface LookupFieldProps extends ITypeDependentProps {
    lookupContainer: string;
    lookupSchema: string;
    lookupQueryValue: string;
    lookupValidator?: PropertyValidator;
    original: Partial<IDomainField>;
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
            newLookupValidator = new PropertyValidator({ type: 'Lookup', name: 'Lookup Validator' });
        }

        let changes = List<IFieldChange>();
        changes = changes.push({ id: evt.target.id, value: newLookupValidator } as IFieldChange);

        if (onMultiChange) {
            onMultiChange(changes);
        }
    };

    render() {
        const {
            index,
            label,
            lookupContainer,
            lookupSchema,
            lookupQueryValue,
            original,
            lockType,
            lookupValidator,
            domainIndex,
        } = this.props;
        const disabled = lockType === DOMAIN_FIELD_PARTIALLY_LOCKED || lockType === DOMAIN_FIELD_FULLY_LOCKED;

        return (
            <div>
                <Row className="domain-row-expanded">
                    <Col xs={12}>
                        <div className="domain-field-section-heading">{label}</div>
                    </Col>
                </Row>
                <Row className="domain-row-expanded">
                    <Col xs={2}>
                        <div className="domain-field-label">Target Folder</div>
                        <FolderSelect
                            id={createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, domainIndex, index)}
                            key={createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, domainIndex, index)}
                            disabled={disabled}
                            onChange={this.onFieldChange}
                            value={lookupContainer}
                        />
                    </Col>
                    <Col xs={2}>
                        <div className="domain-field-label">Target Schema</div>
                        <SchemaSelect
                            containerPath={lookupContainer}
                            id={createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, domainIndex, index)}
                            key={createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, domainIndex, index)}
                            disabled={disabled}
                            onChange={this.onFieldChange}
                            value={lookupSchema}
                        />
                    </Col>
                    <Col xs={2}>
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
                        />
                    </Col>
                    <Col xs={6}>
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
                    </Col>
                </Row>
            </div>
        );
    }
}
