
import * as React from 'react'
import {Col, Row} from "react-bootstrap";
import {createFormInputId} from "../actions/actions";
import {
    DOMAIN_FIELD_LOOKUP_CONTAINER, DOMAIN_FIELD_LOOKUP_QUERY, DOMAIN_FIELD_LOOKUP_SCHEMA
} from "../constants";
import {IDomainField, ITypeDependentProps} from "../models";
import {FolderSelect, QuerySelect, SchemaSelect} from "./Lookup/Fields";

interface LookupFieldProps extends ITypeDependentProps {
    lookupContainer: string
    lookupSchema: string
    lookupQueryValue: string
    original: Partial<IDomainField>
}

export class LookupFieldOptions extends React.PureComponent<LookupFieldProps, any> {


    onFieldChange = (evt) => {
        const { onChange } = this.props;

        let value = evt.target.value;

        if (onChange) {
            onChange(evt.target.id, value);
        }
    }

    render() {
        const { index, label, lookupContainer, lookupSchema, lookupQueryValue, original } = this.props;

        return (
            <div>
                <Row className="domain-row-expanded">
                    <Col xs={12}>
                        <div className="domain-field-section-heading">{label}</div>
                    </Col>
                </Row>
                <Row className="domain-row-expanded">
                    <Col xs={2}>
                        <div className="domain-field-label">From Folder</div>
                        <FolderSelect
                            id={createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, index)}
                            key={createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, index)}
                            onChange={this.onFieldChange}
                            value={lookupContainer}/>
                    </Col>
                    <Col xs={2}>
                        <div className="domain-field-label">From Schema</div>
                        <SchemaSelect
                            containerPath={lookupContainer}
                            id={createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, index)}
                            key={createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, index)}
                            onChange={this.onFieldChange}
                            value={lookupSchema}/>
                    </Col>
                    <Col xs={2}>
                        <div className="domain-field-label">Target Table</div>
                        <QuerySelect
                            containerPath={lookupContainer}
                            id={createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, index)}
                            key={createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, index)}
                            lookupURI={original.rangeURI}
                            onChange={this.onFieldChange}
                            schemaName={lookupSchema}
                            value={lookupQueryValue}/>
                    </Col>
                </Row>
            </div>
        )
    }
}