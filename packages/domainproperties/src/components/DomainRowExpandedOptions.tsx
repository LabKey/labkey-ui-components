/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import * as React from "react";
import { Col, FormControl, Row } from "react-bootstrap";
import {Alert} from "@glass/base";

import {DomainField} from "../models";
import { createFormInputId } from "../actions/actions";
import {
    DOMAIN_FIELD_DESCRIPTION,
    DOMAIN_FIELD_IMPORTALIASES,
    DOMAIN_FIELD_LABEL,
    DOMAIN_FIELD_URL,
    DOMAIN_FIELD_LOOKUP_CONTAINER,
    DOMAIN_FIELD_LOOKUP_QUERY,
    DOMAIN_FIELD_LOOKUP_SCHEMA
} from "../constants";
import { LookupContextConsumer } from "./Lookup/Context";
import { FolderSelect, SchemaSelect, QuerySelect } from "./Lookup/Fields";

interface IDomainRowExpandedOptions {
    field: DomainField
    index: number
    onChange: (evt: React.FormEvent<FormControl>) => any
}

export class DomainRowExpandedOptions extends React.Component<IDomainRowExpandedOptions, any> {

    render() {
        const { field, index, onChange } = this.props;

        return(
            <>
                {field.dataType.isLookup() && (
                    <>
                        <Row className="domain-row-expanded">
                            <Col xs={12}>
                                <div className="domain-field-section-heading">Lookup Definition Options</div>
                            </Col>
                        </Row>
                        <Row className="domain-row-expanded">
                            <LookupContextConsumer>
                                {(context) => (
                                    <>
                                        <Col xs={2}>
                                            <div className="domain-field-label">From Folder</div>
                                            <FolderSelect
                                                container={context.activeContainer}
                                                dataProvider={context.fetchContainers}
                                                id={createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, index)}
                                                key={createFormInputId(DOMAIN_FIELD_LOOKUP_CONTAINER, index)}
                                                onChange={onChange}
                                                value={field.lookupContainer ? field.lookupContainer : ''}/>
                                        </Col>
                                        <Col xs={2}>
                                            <div className="domain-field-label">From Schema</div>
                                            <SchemaSelect
                                                containerPath={field.lookupContainer}
                                                dataProvider={context.fetchSchemas}
                                                id={createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, index)}
                                                key={createFormInputId(DOMAIN_FIELD_LOOKUP_SCHEMA, index)}
                                                onChange={onChange}
                                                value={field.lookupSchema}/>
                                        </Col>
                                        <Col xs={2}>
                                            <div className="domain-field-label">Target Table</div>
                                            <QuerySelect
                                                containerPath={field.lookupContainer}
                                                dataProvider={context.fetchQueries}
                                                id={createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, index)}
                                                key={createFormInputId(DOMAIN_FIELD_LOOKUP_QUERY, index)}
                                                onChange={onChange}
                                                schemaName={field.lookupSchema}
                                                value={field.lookupQuery}/>
                                        </Col>
                                    </>
                                )}
                            </LookupContextConsumer>
                        </Row>
                    </>
                )}
                <Row className='domain-row-expanded'>
                    <Col xs={12}>
                        <div className={'domain-field-section-heading'}>Name and Linking Options</div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={5}>
                        <div className={'domain-field-label'}>Description</div>
                        <FormControl
                            className="form-control"
                            componentClass="textarea"
                            id={createFormInputId(DOMAIN_FIELD_DESCRIPTION, index)}
                            key={createFormInputId(DOMAIN_FIELD_DESCRIPTION, index)}
                            onChange={onChange}
                            placeholder="Add a description"
                            rows={4}
                            value={field.description ? field.description : ''}/>
                    </Col>
                    <Col xs={3}>
                        <div className={'domain-field-label'}>Label</div>
                        <FormControl type="text" value={field.label ? field.label : ''}
                             id={createFormInputId(DOMAIN_FIELD_LABEL, index)}
                             key={createFormInputId(DOMAIN_FIELD_LABEL, index)}
                             onChange={onChange}/>

                        <div className={'domain-field-label'}>Import Aliases</div>
                        <FormControl type="text" value={field.importAliases ? field.importAliases : ''}
                            id={createFormInputId(DOMAIN_FIELD_IMPORTALIASES, index)}
                            key={createFormInputId(DOMAIN_FIELD_IMPORTALIASES, index)}
                            onChange={onChange}/>
                    </Col>
                    <Col xs={4}>
                        <Alert bsStyle={'info'}>Default value options coming soon...</Alert>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={5}>
                        <div className={'domain-field-label'}>URL</div>
                        <FormControl type="text" value={field.URL ? field.URL : ''}
                            id={createFormInputId(DOMAIN_FIELD_URL, index)}
                            key={createFormInputId(DOMAIN_FIELD_URL, index)}
                            onChange={onChange}/>
                    </Col>
                </Row>
            </>
        );
    }
}