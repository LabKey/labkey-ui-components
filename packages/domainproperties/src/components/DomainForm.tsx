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
import { List} from "immutable";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { Col, Form, FormControl, Panel, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import { Alert, ConfirmModal } from "@glass/base";

import { DomainRow } from "./DomainRow";
import { DomainDesign, DomainField, DomainException, DomainFieldError, IFieldChange} from "../models";
import {
    addDomainException,
    addField,
    getIndexFromId,
    getNameFromId, handleDomainUpdates,
    removeField,
    updateDomainField
} from "../actions/actions";
import { LookupProvider } from "./Lookup/Context";
import {DOMAIN_FIELD_CLIENT_SIDE_ERROR} from "../constants";

interface IDomainFormInput {
    domain: DomainDesign
    onChange: (newDomain: DomainDesign, dirty: boolean) => any
    helpURL: string
    helpNoun: string
    showHeader: boolean
}

interface IDomainFormState {
    expandedRowIndex: number
    showConfirm: boolean
}

export default class DomainForm extends React.PureComponent<IDomainFormInput> {

    render() {
        return (
            <LookupProvider>
                <DomainFormImpl {...this.props} />
            </LookupProvider>
        )
    }
}

/**
 * Form containing all properties of a domain
 */
export class DomainFormImpl extends React.PureComponent<IDomainFormInput, IDomainFormState> {
    static defaultProps = {
        helpNoun: 'domain',
        helpURL: 'https://www.labkey.org/Documentation/wiki-page.view?name=propertyFields',
        showHeader: true
    };

    constructor(props) {
        super(props);

        this.state = {
            expandedRowIndex: undefined,
            showConfirm: false
        };
    }

    collapse = (): void => {
        if (this.isExpanded()) {
            this.setState({
                expandedRowIndex: undefined
            });
        }
    };

    expand = (index: number): void => {
        const { domain } = this.props;
        const { expandedRowIndex } = this.state;

        if (expandedRowIndex !== index && index < domain.fields.size) {
            this.setState({
                expandedRowIndex: index
            })
        }
    };

    isExpanded = (): boolean => {
        return this.state.expandedRowIndex !== undefined;
    };

    isValidDomain(domainDesign: DomainDesign): boolean {
        return !!(domainDesign);
    }

    onFieldExpandToggle = (index: number): void => {
        const { expandedRowIndex } = this.state;

        expandedRowIndex === index ? this.collapse() : this.expand(index);
    };

    onDeleteConfirm = () => {
        const { domain, onChange } = this.props;
        const { expandedRowIndex } = this.state;

        const newDomain = removeField(domain, expandedRowIndex);

        this.setState({
            expandedRowIndex: undefined,
            showConfirm: false
        });

        if (onChange) {
            onChange(newDomain, true);
        }
    };

    onAddField = () => {
        const {domain, onChange} = this.props;

        const newDomain = addField(domain);

        if (onChange) {
            onChange(newDomain, true);
        }

        this.collapse();
    };

    onFieldChange = (fieldId: string, value: any, index: number, expand: boolean) => {
        const { domain, onChange } = this.props;

        if (onChange) {
            const newDomain = updateDomainField(domain, value);
            onChange(newDomain, true);
        }
    };

    onFieldsChange = (changes: List<IFieldChange>, index: number, expand: boolean) => {
        const {domain, onChange} = this.props;

        if (onChange) {
            const newDomain = handleDomainUpdates(domain, changes);
            onChange(newDomain, true);
        }
    };

    onDeleteField = (index: number): void => {
        const { domain } = this.props;

        let field = domain.fields.get(index);

        if (field) {
            this.setState({
                showConfirm: true
            });
        }
        else {
            this.onDeleteConfirm();
        }
    };

    onConfirmCancel = () => {
        this.setState({
            showConfirm: false
        });
    };

    onBeforeDragStart = () => {
        const { domain, onChange } = this.props;

        if (onChange) {
            onChange(domain, true);
        }
    };

    onDragEnd = (result) => {
        const { domain, onChange } = this.props;

        let destIndex = result.source.index;  // default behavior go back to original spot if out of bounds
        let srcIndex = result.source.index;
        const id = result.draggableId;
        let idIndex = id ? getIndexFromId(id) : undefined;

        if (result.destination) {
            destIndex = result.destination.index;
        }

        if (srcIndex === destIndex) {
            return;
        }

        let movedField = domain.fields.find((field, i) => i === idIndex);

        const newFields = List<DomainField>().asMutable();
        domain.fields.forEach((field, i) => {

            // move down
            if (i !== idIndex && srcIndex < destIndex) {
                newFields.push(field);
            }

            if (i === destIndex) {
                newFields.push(movedField);
                if (idIndex === this.state.expandedRowIndex) {
                    this.expand(destIndex);
                } else if (idIndex + 1 === this.state.expandedRowIndex) {
                    this.expand(destIndex - 1);
                } else if (idIndex - 1 === this.state.expandedRowIndex) {
                    this.expand(destIndex + 1);
                }
            }

            // move up
            if (i !== idIndex && srcIndex > destIndex) {
                newFields.push(field);
            }
        });

        const newDomain = domain.merge({
            fields: newFields.asImmutable()
        }) as DomainDesign;

        if (onChange) {
            onChange(newDomain, true);
        }
    };

    getAddFieldButton() {
        return (
            <Row>
                <Col xs={12}>
                    <span className={"domain-form-add"} onClick={this.onAddField}>
                        <FontAwesomeIcon icon={faPlusCircle} className={"domain-form-add-btn"}/> Add field
                    </span>
                </Col>
            </Row>
        )
    }

    renderFieldRemoveConfirm() {
        return (
            <ConfirmModal
                title='Confirm Field Deletion'
                msg='Are you sure you want to remove this field? All of its data will be deleted as well.'
                onConfirm={this.onDeleteConfirm}
                onCancel={this.onConfirmCancel}
                confirmVariant='danger'
            />
        )
    }

    renderRowHeaders() {
        return (
            <Row className='domain-form-hdr-row'>
                <Col xs={3}>
                    <b>Field Name</b>
                </Col>
                <Col xs={2}>
                    <b>Data Type</b>
                </Col>
                <Col xs={1}>
                    <b>Required?</b>
                </Col>
                <Col xs={6}>
                    <b>Details</b>
                </Col>
            </Row>
        )
    }

    renderEmptyDomain() {
        const { helpURL, helpNoun } = this.props;

        return (
            <Panel className='domain-form-no-field-panel'>
                {'No fields have been defined for this ' + helpNoun + ' yet. Start by using the “Add Field” button below. Learn more about '}
                <a href={helpURL} target={'_blank'}>{' creating ' + helpNoun + ' designs '}</a> in our documentation.
            </Panel>
        )
    }

    renderSearchRow() {
        return (
            <Row className='domain-form-search'>
                <Col xs={3}>
                    <FormControl id={"dom-search-" + name} type="text" placeholder={'Filter Fields'}
                                 disabled={true}/>
                </Col>
                <Col xs={1}/>
                <Col xs={8} md={6} lg={4}>
                    <Col xs={5} className='domain-zero-padding'>
                        <span>Show Fields Defined By: </span>
                    </Col>
                    <Col xs={7} className='domain-zero-padding'>
                        <FormControl id={"dom-user-" + name} type="text" placeholder={'User'}
                                     disabled={true}/>
                    </Col>
                </Col>
            </Row>
        )
    }

    render() {
        const { domain, showHeader } = this.props;
        const { showConfirm, expandedRowIndex } = this.state;

        return (
            <>
                {showConfirm && this.renderFieldRemoveConfirm()}
                <Panel className={"domain-form-panel"}>
                    {showHeader && <Panel.Heading>
                        <div className={"panel-title"}>{"Field Properties" + (domain.name ? " - " + domain.name : '')}</div>
                    </Panel.Heading>}
                    <Panel.Body>
                        {this.isValidDomain(domain) ? (
                            <>
                                <Row className='domain-form-hdr-row'>
                                    <p>Adjust fields and their properties that will be shown within this domain. Click a row
                                        to access additional options. Drag and drop rows to re-order them.</p>
                                </Row>
                                {this.renderSearchRow()}
                                {domain.fields.size > 0 ?
                                    <DragDropContext onDragEnd={this.onDragEnd} onBeforeDragStart={this.onBeforeDragStart}>
                                        {this.renderRowHeaders()}
                                        <Droppable droppableId='domain-form-droppable'>
                                            {(provided) => (
                                                <div ref={provided.innerRef}
                                                     {...provided.droppableProps}>
                                                    <Form>
                                                        {(domain.fields.map((field, i) => {
                                                            return <DomainRow
                                                                key={'domain-row-key-' + i}
                                                                field={field}
                                                                fieldError={this.getFieldError(field, domain.domainException)}
                                                                index={i}
                                                                expanded={expandedRowIndex === i}
                                                                onChange={this.onFieldsChange}
                                                                onExpand={this.onFieldExpandToggle}
                                                                onDelete={this.onDeleteField}
                                                            />
                                                        }))}
                                                        {provided.placeholder}
                                                    </Form>
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                    : this.renderEmptyDomain()
                                }
                                {this.getAddFieldButton()}
                            </>
                        ) :<Alert>Invalid domain design.</Alert>
                        }
                    </Panel.Body>
                </Panel>
            </>
        );
    }


    private getFieldError(field: DomainField, domainException: DomainException) : DomainFieldError
    {
        if (domainException && domainException.errors)
        {
            let fieldError = domainException.errors.filter( e => {

                return e && (field.isNew() || field.updatedField) &&
                    (e.get("id") == field.propertyId || e.get("field") == field.name);
            });

            return fieldError.get(0);
        }

        return undefined;
    };
}