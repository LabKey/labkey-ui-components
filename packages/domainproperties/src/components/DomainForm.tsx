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
import { List } from "immutable";
import { DragDropContext, Droppable } from "react-beautiful-dnd";
import { Col, Form, FormControl, Panel, Row } from "react-bootstrap";
import {
    DomainDesign,
    DomainField,
    DomainFieldError,
    IFieldChange,
    PropDescType,
    PROP_DESC_TYPES,
    FLAG_TYPE,
    FILE_TYPE,
    ATTACHMENT_TYPE,
    IDomainField,
    IAppDomainHeader,
    HeaderRenderer
} from "../models";
import { StickyContainer, Sticky } from "react-sticky";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusSquare, faMinusSquare } from "@fortawesome/free-solid-svg-icons";
import { AddEntityButton, Alert, FileAttachmentForm, ConfirmModal, InferDomainResponse } from "@glass/base";

import { DomainRow } from "./DomainRow";
import {
    addDomainField,
    getIndexFromId,
    handleDomainUpdates,
    getMaxPhiLevel,
    removeField,
    setDomainFields
} from "../actions/actions";

import { LookupProvider } from "./Lookup/Context";
import {
    EXPAND_TRANSITION,
    EXPAND_TRANSITION_FAST,
    LK_DOMAIN_HELP_URL,
    PHILEVEL_NOT_PHI
} from "../constants";

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
    showHeaderFieldCount?: boolean
    showInferFromFile?: boolean
    appDomainHeaderRenderer?: HeaderRenderer
    panelCls?: string
    maxPhiLevel?: string  // Just for testing, only affects display
    containerTop?: number // This sets the top of the sticky header, default is 0
    modelDomains?: List<DomainDesign> //Set of domains that encompass the full protocol, that may impact validation or alerts
}

interface IDomainFormState {
    expandedRowIndex: number
    expandTransition: number
    showConfirm: boolean
    collapsed: boolean
    maxPhiLevel: string
    dragId?: number
    availableTypes: List<PropDescType>
    filtered: boolean
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
        helpURL: LK_DOMAIN_HELP_URL,
        showHeader: true,
        showHeaderFieldCount: true,
        initCollapsed: false
    };

    constructor(props) {
        super(props);

        this.state = {
            expandedRowIndex: undefined,
            expandTransition: EXPAND_TRANSITION,
            showConfirm: false,
            dragId: undefined,
            maxPhiLevel: props.maxPhiLevel || PHILEVEL_NOT_PHI,
            availableTypes: this.getAvailableTypes(),
            collapsed: props.initCollapsed,
            filtered: false
        };
    }

    componentDidMount(): void {
        if (!this.props.maxPhiLevel) {
            getMaxPhiLevel()
                .then((maxPhiLevel) => {
                    this.setState({maxPhiLevel: maxPhiLevel})
                })
                .catch((error) => {
                        console.error("Unable to retrieve max PHI level.")
                    }
                )
        }
    }

    getAvailableTypes = (): List<PropDescType>  => {
        const { domain } = this.props;

        return PROP_DESC_TYPES.filter((type) => {
            if (type === FLAG_TYPE && !domain.allowFlagProperties) {
                return false;
            }

            if (type === FILE_TYPE && !domain.allowFileLinkProperties) {
                return false;
            }

            if (type === ATTACHMENT_TYPE && !domain.allowAttachmentProperties) {
                return false;
            }

            return true;
        }) as List<PropDescType>
    };

    componentWillReceiveProps(nextProps: Readonly<IDomainFormInput>, nextContext: any): void {
        // if not collapsible, allow the prop change to update the collapsed state
        if (!this.props.collapsible && nextProps.initCollapsed !== this.props.initCollapsed) {
            this.togglePanel(null, nextProps.initCollapsed);
        }
    }

    onPanelHeaderClick = (evt: any) => {
        if (this.props.collapsible) {
            this.togglePanel(null);
        }
    };

    togglePanel = (evt: any, collapsed?: boolean): void => {
        this.setState((state) => ({
            expandedRowIndex: undefined,
            collapsed: collapsed !== undefined ? collapsed : !state.collapsed
        }), () => {
            // clear the search/filter state if collapsed
            if (this.state.collapsed) {
                this.updateFilteredFields();
            }
        });
    };

    collapseRow = (): void => {
        if (this.isExpanded()) {
            this.setState({
                expandedRowIndex: undefined,
                expandTransition: EXPAND_TRANSITION
            });
        }
    };

    expandRow = (index: number): void => {
        const { domain } = this.props;
        const { expandedRowIndex } = this.state;

        if (expandedRowIndex !== index && index < domain.fields.size) {
            this.setState({
                expandedRowIndex: index,
                expandTransition: EXPAND_TRANSITION
            })
        }
    };

    fastExpand = (index: number): void => {
        const { domain } = this.props;
        const { expandedRowIndex } = this.state;

        if (expandedRowIndex !== index && index < domain.fields.size) {
            this.setState({
                expandedRowIndex: index,
                expandTransition: EXPAND_TRANSITION_FAST
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

    onDomainChange(updatedDomain: DomainDesign, dirty?: boolean) {
        const { onChange } = this.props;

        if (onChange) {
            onChange(updatedDomain, dirty !== undefined ? dirty : true);
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
        this.applyAddField();
    };

    applyAddField = (config?: Partial<IDomainField>) => {
        this.onDomainChange(addDomainField(this.props.domain, config));
        this.collapseRow();
    };

    onFieldsChange = (changes: List<IFieldChange>, index: number, expand: boolean) => {
        this.onDomainChange(handleDomainUpdates(this.props.domain, changes));

        if (expand) {
            this.expandRow(index);
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

    onBeforeDragStart = (initial) => {
        const { domain, onChange } = this.props;
        const id = initial.draggableId;
        const idIndex = id ? getIndexFromId(id) : undefined;

        this.setState(() => ({dragId: idIndex}));

        this.onDomainChange(domain);
    };

    onDragEnd = (result) => {
        const { domain } = this.props;

        let destIndex = result.source.index;  // default behavior go back to original spot if out of bounds
        let srcIndex = result.source.index;
        const id = result.draggableId;
        let idIndex = id ? getIndexFromId(id) : undefined;

        this.setState(() => ({dragId: undefined}));

        if (result.destination) {
            destIndex = result.destination.index;
        }

        if (srcIndex === destIndex) {
            return;
        }

        let movedField = domain.fields.find((field, i) => i === idIndex);

        const newFields = List<DomainField>().asMutable();
        let fieldsWithNewIndexesOnErrors = domain.hasException() ? domain.domainException.errors : List<DomainFieldError>();

        let expanded = this.state.expandedRowIndex;

        domain.fields.forEach((field, i) => {
            // move down
            if (i !== idIndex && srcIndex < destIndex) {
                newFields.push(field);
                fieldsWithNewIndexesOnErrors = this.setNewIndexOnError(i, newFields.size - 1, fieldsWithNewIndexesOnErrors);
                if (i === this.state.expandedRowIndex) {
                    expanded = newFields.size - 1;
                }
            }

            if (i === destIndex) {
                newFields.push(movedField);
                fieldsWithNewIndexesOnErrors = this.setNewIndexOnError(idIndex, destIndex, fieldsWithNewIndexesOnErrors);
                if (idIndex === this.state.expandedRowIndex) {
                    expanded = destIndex;
                }
            }

            // move up
            if (i !== idIndex && srcIndex > destIndex) {
                newFields.push(field);
                fieldsWithNewIndexesOnErrors = this.setNewIndexOnError(i, newFields.size - 1, fieldsWithNewIndexesOnErrors);
                if (i === this.state.expandedRowIndex) {
                    expanded = newFields.size - 1;
                }
            }
        });

        //set existing error row indexes with new row indexes
        const fieldsWithMovedErrorsUpdated = fieldsWithNewIndexesOnErrors.map(error => {
            return error.merge({
                'rowIndexes': (error.newRowIndexes ? error.newRowIndexes : error.rowIndexes),
                'newRowIndexes': undefined //reset newRowIndexes
            });
        });

        let domainExceptionWithMovedErrors = undefined;
        if( domain.hasException()) {
            domainExceptionWithMovedErrors = domain.domainException.set('errors', fieldsWithMovedErrorsUpdated);
        }

        const newDomain = domain.merge({
            fields: newFields.asImmutable(),
            domainException: domainExceptionWithMovedErrors
        }) as DomainDesign;

        this.onDomainChange(newDomain);

        this.fastExpand(expanded);
    };

    setNewIndexOnError = (oldIndex: number, newIndex: number, fieldErrors: List<DomainFieldError>) => {

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
                <div className={'margin-top'}>
                    or&nbsp;
                    <span className={'domain-form-add-link'} onClick={this.onAddField}>
                        Start a New Design
                    </span>
                </div>
            )
        }
        else {
            return (
                <Row>
                    <Col xs={12}>
                        <AddEntityButton
                            entity="Field"
                            buttonClass="domain-form-add-btn"
                            onClick={this.onAddField}/>
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

    stickyStyle = (style: any, isSticky: boolean): any => {
        const { containerTop } = this.props;

        let newStyle = {...style, zIndex: 1000, top: (containerTop ? containerTop : 0)};

        // Sticking to top
        if (isSticky) {
            let newWidth = parseInt(style.width,10) + 30;  // Expand past panel padding
            const width = newWidth + 'px';

            return {...newStyle, width, marginLeft: '-15px', paddingLeft: '15px', boxShadow: '0 2px 4px 0 rgba(0,0,0,0.12), 0 2px 2px 0 rgba(0,0,0,0.24)'}
        }

        return newStyle;
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
            <div className='domain-floating-hdr'>
                <Row className='domain-form-hdr-row'>
                    <Col xs={6}>
                        <Col xs={6}>
                            <b>Field Name</b>
                        </Col>
                        <Col xs={4}>
                            <b>Data Type</b>
                        </Col>
                        <Col xs={2} className='domain-form-hdr-center'>
                            <b>Required</b>
                        </Col>
                    </Col>
                    <Col xs={6}>
                        <b>Details</b>
                    </Col>
                </Row>
            </div>
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
                        previewCount: 3,
                        skipPreviewGrid: true,
                        onPreviewLoad: this.handleFilePreviewLoad
                    }}
                />
            )
        }
        else {
            return (
                <Panel className='domain-form-no-field-panel'>
                    Start by adding some properties using the "Add Field" button.
                </Panel>
            );
        }
    }

    onSearch = (evt) => {
        const { value } = evt.target;
        this.updateFilteredFields(value);
    };

    updateFilteredFields(value?: string) {
        const { domain } = this.props;

        const filteredFields = domain.fields.map( field => {
            if (!value || (field.name && field.name.toLowerCase().indexOf(value.toLowerCase()) !== -1)) {
                return field.set('visible', true);
            }

            return field.set('visible', false);
        });

        this.setState(() => ({filtered: value !== undefined && value.length > 0}));
        this.onDomainChange(domain.set('fields', filteredFields) as DomainDesign, false);
    };

    readerPanelHeaderContent() {
        const { helpURL, children } = this.props;

        return(
            <Row className='domain-form-hdr-margins'>
                <Col xs={helpURL ? 9 : 12}>
                    {children ? children
                        : <div className='domain-field-float-left'>
                            Adjust fields and their properties that will be shown within this domain.
                            Click a row to access additional options. Drag and drop rows to reorder them.
                        </div>
                    }
                </Col>
                {helpURL &&
                    <Col xs={3}>
                        <a className='domain-field-float-right' target="_blank" href={helpURL}>Learn more about this tool</a>
                    </Col>
                }
            </Row>
        )
    }

    renderSearchField() {
        return (
            <Row>
                <Col xs={3}>
                    <FormControl id={"domain-search-name"} type="text" placeholder={'Search Fields'} onChange={this.onSearch}/>
                </Col>
            </Row>
        )
    }

    renderAppDomainHeader = () => {
        const {appDomainHeaderRenderer, modelDomains, domain} = this.props;
        const config = {
            domain,
            modelDomains,
            onChange: this.onFieldsChange,
            onAddField: this.applyAddField
        } as IAppDomainHeader;

        return appDomainHeaderRenderer(config);
    };

    renderForm() {
        const { domain, helpNoun, containerTop, appDomainHeaderRenderer } = this.props;
        const { expandedRowIndex, expandTransition, maxPhiLevel, dragId, availableTypes, filtered } = this.state;

        return (
            <>
                {this.readerPanelHeaderContent()}
                {appDomainHeaderRenderer && this.renderAppDomainHeader()}
                {domain.fields.size > 1 && this.renderSearchField()}
                {domain.fields.size > 0 ?
                    <DragDropContext onDragEnd={this.onDragEnd} onBeforeDragStart={this.onBeforeDragStart}>
                        <StickyContainer>
                            <Sticky topOffset={(containerTop ? ( -1 * containerTop) : 0)}>{({ style, isSticky }) =>
                                <div style={this.stickyStyle(style, isSticky)}>
                                    {this.renderRowHeaders()}
                                </div>}
                            </Sticky>
                        <Droppable droppableId='domain-form-droppable'>
                            {(provided) => (
                                <div ref={provided.innerRef}
                                     {...provided.droppableProps}>
                                    <Form>
                                        {(domain.fields.map((field, i) => {
                                            // Need to preserve index so don't filter, instead just use empty div
                                            if (!field.visible)
                                                return <div key={'domain-row-key-' + i} />;

                                            return <DomainRow
                                                domainId={domain.domainId}
                                                helpNoun={helpNoun}
                                                key={'domain-row-key-' + i}
                                                field={field}
                                                fieldError={this.getFieldError(domain, i)}
                                                index={i}
                                                expanded={expandedRowIndex === i}
                                                expandTransition={expandTransition}
                                                onChange={this.onFieldsChange}
                                                onExpand={this.onFieldExpandToggle}
                                                onDelete={this.onDeleteField}
                                                maxPhiLevel={maxPhiLevel}
                                                dragging={dragId === i}
                                                isDragDisabled={filtered}
                                                availableTypes={availableTypes}
                                                defaultDefaultValueType={domain.defaultDefaultValueType}
                                                defaultValueOptions={domain.defaultValueOptions}
                                            />
                                        }))}
                                        {provided.placeholder}
                                    </Form>
                                </div>
                            )}
                        </Droppable>
                        </StickyContainer>
                    </DragDropContext>
                    : this.renderEmptyDomain()
                }
                {this.renderAddFieldOption()}
            </>
        )
    }

    getHeaderName(): string {
        const { domain, headerPrefix, showHeaderFieldCount } = this.props;
        let name = domain.name ? domain.name : "Domain Properties";

        // optionally trim off a headerPrefix from the name display
        if (headerPrefix && name.indexOf(headerPrefix + ' ') === 0) {
            name = name.replace(headerPrefix + ' ', '');
        }

        // prefer to use the suffix "Properties" over "Fields" in panel heading
        if (name.endsWith(' Fields')) {
            name = name.substring(0, name.length - 7) + ' Properties';
        }

        // prefer "Results Properties" over "Data Properties"in assay case
        if (name.endsWith('Data Properties')) {
            name = name.replace('Data Properties', 'Results Properties');
        }

        // add the field count to the header, if not empty
        if (showHeaderFieldCount && domain.fields.size > 0) {
            name = name + ' (' + domain.fields.size + ')';
        }

        return name;
    }

    renderHeaderContent() {
        const { collapsible, markComplete } = this.props;
        const { collapsed } = this.state;

        return (
            <>
                <span>{this.getHeaderName()}</span>
                {collapsible && collapsed &&
                    <span className={'pull-right'}>
                        <FontAwesomeIcon icon={faPlusSquare} className={"domain-form-expand-btn"}/>
                    </span>
                }
                {collapsible && !collapsed &&
                    <span className={'pull-right'}>
                        <FontAwesomeIcon icon={faMinusSquare} className={"domain-form-expand-btn"}/>
                    </span>
                }
                {!collapsible && collapsed && markComplete &&
                    <span className={'pull-right'}>
                        <i className={'fa fa-check-square-o as-secondary-color'}/>
                    </span>
                }
            </>
        )
    }

    render() {
        const { domain, showHeader, panelCls, collapsible } = this.props;
        const { showConfirm, collapsed } = this.state;

        return (
            <>
                {showConfirm && this.renderFieldRemoveConfirm()}
                <Panel className={"domain-form-panel" + (panelCls ? ' ' + panelCls : '')}>
                    {showHeader &&
                        <Panel.Heading onClick={this.onPanelHeaderClick} className={collapsible ? 'domain-heading-collapsible' : ''}>
                            {this.renderHeaderContent()}
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