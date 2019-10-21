
import * as React from "react";
import {Checkbox, Col, Row} from "react-bootstrap";
import { List } from "immutable";
import {createFormInputId, createFormInputName, getIndexFromId, getNameFromId} from "../actions/actions";
import {
    DOMAIN_FIELD_FULLY_LOCKED,
    DOMAIN_FIELD_LOOKUP_CONTAINER,
    DOMAIN_FIELD_LOOKUP_QUERY,
    DOMAIN_FIELD_LOOKUP_SCHEMA,
    DOMAIN_FIELD_PARTIALLY_LOCKED,
    DOMAIN_VALIDATOR_LOOKUP
} from "../constants";
import {IDomainField, IFieldChange, ITypeDependentProps, PropDescType, PropertyValidator} from "../models";
import {FolderSelect, TargetTableSelect, SchemaSelect} from "./Lookup/Fields";
import {LabelHelpTip} from "@glass/base";

interface LookupFieldProps extends ITypeDependentProps {
    lookupContainer: string
    lookupSchema: string
    lookupQueryValue: string
    lookupValidator?: PropertyValidator
    original: Partial<IDomainField>
    onMultiChange: (changes: List<IFieldChange>) => void
}

export class LookupFieldOptions extends React.PureComponent<LookupFieldProps, any> {

    onFieldChange = (evt) => {
        const { onMultiChange } = this.props;
        const index = getIndexFromId(evt.target.id);
        const name = getNameFromId(evt.target.id);

        let changes = List<IFieldChange>().asMutable();
        changes.push({id: evt.target.id, value: evt.target.value} as IFieldChange);

        if (name === DOMAIN_FIELD_LOOKUP_CONTAINER) {
            changes.push({id: createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, index), value: ''})
            changes.push({id: createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, index), value: ''})
        }

        if (name === DOMAIN_FIELD_LOOKUP_SCHEMA) {
            changes.push({id: createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, index), value: ''})
        }

        if (onMultiChange) {
            onMultiChange(changes.asImmutable());
        }
    };

    addLookupValidator = (evt) => {
        const { lookupValidator, onMultiChange } = this.props;

        let newLookupValidator = undefined;

        if (evt.target.checked) {
            newLookupValidator = new PropertyValidator({type: 'Lookup', name: 'Lookup Validator'});
        }

        let changes = List<IFieldChange>().asMutable();
        changes.push({id: evt.target.id, value: newLookupValidator} as IFieldChange);

        if (onMultiChange) {
            onMultiChange(changes.asImmutable());
        }
    };

    getLookupValidatorHelp = () => {
        return (
            <div>Lookup validators allow you to require that any value is present in the lookup's target table or query</div>
        )
    }

    render() {
        const { index, label, lookupContainer, lookupSchema, lookupQueryValue, original, lockType, lookupValidator } = this.props;
        const disabled = lockType === DOMAIN_FIELD_PARTIALLY_LOCKED || lockType === DOMAIN_FIELD_FULLY_LOCKED;

        return (
            <div>
                <Row className="domain-row-expanded">
                    <Col xs={12}>
                        <div className="domain-field-section-heading">{label}</div>
                    </Col>
                </Row>
                <Row className="domain-row-expanded">
                    <Col xs={3}>
                        <div className="domain-field-label">From Folder</div>
                        <FolderSelect
                            id={createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, index)}
                            key={createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, index)}
                            disabled={disabled}
                            onChange={this.onFieldChange}
                            value={lookupContainer}
                        />
                    </Col>
                    <Col xs={3}>
                        <div className="domain-field-label">From Schema</div>
                        <SchemaSelect
                            containerPath={lookupContainer}
                            id={createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, index)}
                            key={createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, index)}
                            disabled={disabled}
                            onChange={this.onFieldChange}
                            value={lookupSchema}/>
                    </Col>
                    <Col xs={3}>
                        <div className="domain-field-label">Target Table</div>
                        <TargetTableSelect
                            containerPath={lookupContainer}
                            id={createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, index)}
                            key={createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, index)}
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
                            className='domain-field-checkbox-margin'
                            id={createFormInputId(DOMAIN_VALIDATOR_LOOKUP, index)}
                            name={createFormInputName(DOMAIN_VALIDATOR_LOOKUP)}
                            checked={!!lookupValidator}
                            onChange={this.addLookupValidator}
                        >
                            Ensure Value Exists in Lookup Target
                            <LabelHelpTip title='Lookup Validator' body={this.getLookupValidatorHelp}/>
                        </Checkbox>
                    </Col>
                </Row>
            </div>
        )
    }
}