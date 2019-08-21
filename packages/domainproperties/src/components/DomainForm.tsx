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
import { List, Map } from "immutable";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { Col, Form, FormControl, Panel, Row } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle, faPlusSquare, faMinusSquare, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { Alert, ConfirmModal, FileAttachmentForm, InferDomainResponse, Tip } from "@glass/base";

import { DomainRow } from "./DomainRow";
import { DomainDesign, DomainField, DomainFieldError, IFieldChange} from "../models";
import {
    addDomainField,
    getIndexFromId,
    handleDomainUpdates,
    removeField, setDomainFields,
    updateDomainField
} from "../actions/actions";
import { LookupProvider } from "./Lookup/Context";

interface IDomainFormInput {
    domain: DomainDesign
    onChange: (newDomain: DomainDesign, dirty: boolean) => any
    helpURL?: string
    helpNoun?: string
    showHeader?: boolean
    initCollapsed?: boolean
    collapsible?: boolean
    markComplete?: boolean
    headerPrefix?: string // used as a string to remove from the heading when using the domain.name
    showInferFromFile?: boolean
}

interface IDomainFormState {
    expandedRowIndex: number
    showConfirm: boolean
    collapsed: boolean
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
        showHeader: true,
        initCollapsed: false
    };

    constructor(props) {
        super(props);

        this.state = {
            expandedRowIndex: undefined,
            showConfirm: false,
            collapsed: props.initCollapsed
        };
    }

    componentWillReceiveProps(nextProps: Readonly<IDomainFormInput>, nextContext: any): void {
        // if not collapsible, allow the prop change to update the collapsed state
        if (!this.props.collapsible && nextProps.initCollapsed !== this.props.initCollapsed) {
            this.togglePanel(null, nextProps.initCollapsed);
        }
    }

    togglePanel = (evt: any, collapsed?: boolean): void => {
        this.setState((state) => ({
            expandedRowIndex: undefined,
            collapsed: collapsed !== undefined ? collapsed : !state.collapsed
        }));
    };

    collapseRow = (): void => {
        if (this.isExpanded()) {
            this.setState({
                expandedRowIndex: undefined
            });
        }
    };

    expandRow = (index: number): void => {
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

        expandedRowIndex === index ? this.collapseRow() : this.expandRow(index);
    };

    onDomainChange(updatedDomain: DomainDesign) {
        const { onChange } = this.props;

        if (onChange) {
            onChange(updatedDomain, true);
        }
    }

    onDeleteConfirm = () => {
        this.setState({
            expandedRowIndex: undefined,
            showConfirm: false
        });

        this.onDomainChange(removeField(this.props.domain, this.state.expandedRowIndex));
    };

    onAddField = () => {
        this.onDomainChange(addDomainField(this.props.domain));
        this.collapseRow();
    };

    onFieldChange = (fieldId: string, value: any, index: number, expand: boolean) => {
        this.onDomainChange(updateDomainField(this.props.domain, value));
    };

    onFieldsChange = (changes: List<IFieldChange>, index: number, expand: boolean) => {
        this.onDomainChange(handleDomainUpdates(this.props.domain, changes));
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
        this.onDomainChange(this.props.domain);
    };

    onDragEnd = (result) => {
        const { domain } = this.props;

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
        let fieldsWithNewIndexesOnErrors = domain.hasException() ? domain.domainException.errors : List<DomainFieldError>();

        domain.fields.forEach((field, i) => {

            // move down
            if (i !== idIndex && srcIndex < destIndex) {
                newFields.push(field);
                fieldsWithNewIndexesOnErrors = this.setNewIndexOnError(i, newFields.size - 1, fieldsWithNewIndexesOnErrors, field.name);
            }

            if (i === destIndex) {
                newFields.push(movedField);
                fieldsWithNewIndexesOnErrors = this.setNewIndexOnError(idIndex, destIndex, fieldsWithNewIndexesOnErrors, movedField.name);
                if (idIndex === this.state.expandedRowIndex) {
                    this.expandRow(destIndex);
                } else if (idIndex + 1 === this.state.expandedRowIndex) {
                    this.expandRow(destIndex - 1);
                } else if (idIndex - 1 === this.state.expandedRowIndex) {
                    this.expandRow(destIndex + 1);
                }
            }

            // move up
            if (i !== idIndex && srcIndex > destIndex) {
                newFields.push(field);
                fieldsWithNewIndexesOnErrors = this.setNewIndexOnError(i, newFields.size - 1, fieldsWithNewIndexesOnErrors, field.name);
            }
        });

        //set existing error row indexes with new row indexes
        const fieldsWithMovedErrorsUpdated = fieldsWithNewIndexesOnErrors.map(error => {
            return error.merge({
                'rowIndexes': (error.newRowIndexes ? error.newRowIndexes : error.rowIndexes),
                'newRowIndexes': undefined //reset newRowIndexes
            });
        });

        const domainExceptionWithMovedErrors = domain.domainException.set('errors', fieldsWithMovedErrorsUpdated);

        const newDomain = domain.merge({
            fields: newFields.asImmutable(),
            domainException: domainExceptionWithMovedErrors
        }) as DomainDesign;

        this.onDomainChange(newDomain);
    };

    setNewIndexOnError = (oldIndex: number, newIndex: number, fieldErrors: List<DomainFieldError>, fieldName: string) => {

        let updatedErrorList = fieldErrors.map(fieldError => {

                let newRowIndexes;
                if (fieldError.newRowIndexes === undefined) {
                    newRowIndexes = List<number>().asMutable();
                }
                else {
                    newRowIndexes = fieldError.get('newRowIndexes');
                }

                fieldError.rowIndexes.forEach(val => {
                    if (val === oldIndex) {
                        newRowIndexes = newRowIndexes.push(newIndex);
                    }
                });

                return fieldError.set('newRowIndexes', newRowIndexes.asImmutable());
        });

        return updatedErrorList as List<DomainFieldError>;
    };

    renderAddFieldOption() {

        if (this.shouldShowInferFromFile()) {
            return (
                <div className={'domain-form-add-link margin-top'} onClick={this.onAddField}>
                    Or Start a New Design
                </div>
            )
        }
        else {
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
    }

    getFieldError(domain: DomainDesign, index: number) : DomainFieldError {

        if (domain.hasException()) {

            let fieldErrors = domain.domainException.errors;

            if (!fieldErrors.isEmpty())
            {
                const errorsWithIndex = fieldErrors.filter((error) => {
                    return error.rowIndexes.findIndex(idx => {return idx === index}) >= 0;
                });
                return errorsWithIndex.get(0);
            }
        }

        return undefined;
    };

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

    shouldShowInferFromFile(): boolean {
        const { domain, showInferFromFile } = this.props;
        return showInferFromFile && domain.fields.size === 0;
    }

    handleFilePreviewLoad = (response: InferDomainResponse) => {
        this.onDomainChange(setDomainFields(this.props.domain, response.fields));
    };

    renderEmptyDomain() {
        if (this.shouldShowInferFromFile()) {
            return (
                <FileAttachmentForm
                    acceptedFormats={".csv, .tsv, .txt, .xls, .xlsx"}
                    showAcceptedFormats={true}
                    allowDirectories={false}
                    allowMultiple={false}
                    label={'Infer fields from file'}
                    previewGridProps={{
                        previewCount: 3, // TODO what value to use here?
                        skipPreviewGrid: true,
                        onPreviewLoad: this.handleFilePreviewLoad
                    }}
                />
            )
        }
        else {
            const { helpURL, helpNoun } = this.props;

            return (
                <Panel className='domain-form-no-field-panel'>
                    {'No fields have been defined for this ' + helpNoun + ' yet. Start by using the “Add Field” button below. Learn more about '}
                    <a href={helpURL} target={'_blank'}>{' creating ' + helpNoun + ' designs '}</a> in our documentation.
                </Panel>
            )
        }
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

    renderForm() {
        const { domain, children } = this.props;
        const { expandedRowIndex } = this.state;

        return (
            <>
                <Row className='domain-form-hdr-row'>
                    {children ? children
                        : <p>Adjust fields and their properties that will be shown within this domain. Click a row
                            to access additional options. Drag and drop rows to re-order them.</p>
                    }
                </Row>
                {/*{this.renderSearchRow()}*/}
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
                                                fieldError={this.getFieldError(domain, i)}
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
                {this.renderAddFieldOption()}
            </>
        )
    }

    getHeaderName(): string {
        const { domain, headerPrefix } = this.props;
        const { collapsed } = this.state;
        let name = domain.name ? domain.name : "Domain Properties";

        // prefer to use the suffix "Properties" over "Fields"
        if (name.endsWith(' Fields')) {
            name = name.substring(0, name.length - 7) + ' Properties';
        }

        // in collapsed view, add the field count to the header
        if (collapsed && domain.fields.size > 0) {
            name = name + ' (' + domain.fields.size + ')';
        }

        // optionally trim off a headerPrefix from the name display
        if (headerPrefix && name.indexOf(headerPrefix + ' ') === 0) {
            name = name.replace(headerPrefix + ' ', '');
        }

        return name;
    }

    render() {
        const { domain, showHeader, collapsible, markComplete } = this.props;
        const { showConfirm, collapsed } = this.state;

        return (
            <>
                {showConfirm && this.renderFieldRemoveConfirm()}
                <Panel className={"domain-form-panel"}>
                    {showHeader &&
                        <Panel.Heading>
                            <span>{this.getHeaderName()}</span>
                            {collapsible && collapsed &&
                                <Tip caption="Expand Panel">
                                    <span className={'pull-right'} onClick={this.togglePanel}>
                                        <FontAwesomeIcon icon={faPlusSquare} className={"domain-form-expand-btn"}/>
                                    </span>
                                </Tip>
                            }
                            {collapsible && !collapsed &&
                                <Tip caption="Collapse Panel">
                                    <span className={'pull-right'} onClick={this.togglePanel}>
                                        <FontAwesomeIcon icon={faMinusSquare} className={"domain-form-expand-btn"}/>
                                    </span>
                                </Tip>
                            }
                            {!collapsible && collapsed && markComplete &&
                                <span className={'pull-right'} onClick={this.togglePanel}>
                                    <FontAwesomeIcon icon={faCheckCircle}/>
                                </span>
                            }
                        </Panel.Heading>
                    }
                    {!collapsed &&
                        <Panel.Body>
                            {this.isValidDomain(domain)
                                ? this.renderForm()
                                :<Alert>Invalid domain design.</Alert>
                            }
                        </Panel.Body>
                    }
                </Panel>
            </>
        );
    }
}