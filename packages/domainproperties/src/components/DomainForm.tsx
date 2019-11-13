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
    HeaderRenderer,
    DomainPanelStatus,
    DomainException
} from "../models";
import { StickyContainer, Sticky } from "react-sticky";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusSquare, faMinusSquare, faCheckCircle, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";
import {
    AddEntityButton,
    Alert,
    FileAttachmentForm,
    ConfirmModal,
    InferDomainResponse,
    LabelHelpTip
} from "@glass/base";

import { DomainRow } from "./DomainRow";
import {
    addDomainField,
    getIndexFromId,
    handleDomainUpdates,
    getMaxPhiLevel,
    removeField,
    setDomainFields, setDomainException, clearAllFieldErrors, createFormInputName, clearAllClientValidationErrors
} from "../actions/actions";

import { LookupProvider } from "./Lookup/Context";
import {
    EXPAND_TRANSITION,
    EXPAND_TRANSITION_FAST,
    LK_DOMAIN_HELP_URL,
    PHILEVEL_NOT_PHI, SEVERITY_LEVEL_ERROR
} from "../constants";

interface IDomainFormInput {
    domain: DomainDesign
    onChange: (newDomain: DomainDesign, dirty: boolean) => any
    onToggle?: (collapsed: boolean, callback?: () => any) => any
    helpURL?: string
    helpNoun?: string
    showHeader?: boolean
    initCollapsed?: boolean
    collapsible?: boolean
    controlledCollapse?: boolean
    validate?: boolean
    isNew?: boolean
    panelStatus?: DomainPanelStatus
    headerPrefix?: string // used as a string to remove from the heading when using the domain.name
    headerTitle?: string,
    showInferFromFile?: boolean
    useTheme?: boolean
    appDomainHeaderRenderer?: HeaderRenderer
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
        helpNoun: 'field designer',
        helpURL: LK_DOMAIN_HELP_URL,
        showHeader: true,
        initCollapsed: false,
        isNew: false
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

    componentDidUpdate(prevProps: Readonly<IDomainFormInput>, prevState: Readonly<IDomainFormState>, snapshot?: any): void {
        const {domain} = this.props;

        // This is kind of a hacky way to remove a class from core css so we can set the color of the panel hdr to match the theme
        if (prevProps.useTheme && domain && domain.name) {
            const el = document.getElementById(createFormInputName(domain.name.replace(/\s/g, '-') + '-hdr'));
            el.classList.remove("panel-heading");
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
        const { controlledCollapse, initCollapsed, domain, validate, onChange } = this.props;

        // if controlled collapsible, allow the prop change to update the collapsed state
        if (controlledCollapse && nextProps.initCollapsed !== initCollapsed) {
            this.toggleLocalPanel(nextProps.initCollapsed);
        }

        if (nextProps.validate && validate !== nextProps.validate) {
            const newDomain = this.validateDomain(nextProps.domain);
            if (onChange) {
                onChange(newDomain, false);
            }
        }
    }

    validateDomain = (domain: DomainDesign): DomainDesign => {
        const invalidFields = domain.getInvalidFields();
        let newDomain = domain;
        if (invalidFields.size > 0) {
            const exception = DomainException.clientValidationExceptions("Missing required field properties", "Missing required property", invalidFields);
            const exceptionWithAllErrors = DomainException.mergeWarnings(domain, exception);
            newDomain = domain.set('domainException', (exceptionWithAllErrors ? exceptionWithAllErrors : exception)) as DomainDesign;
        }
        else {
            newDomain = clearAllClientValidationErrors(domain);
        }

        return newDomain;
    };

    toggleLocalPanel = (collapsed?: boolean): void => {
        const { domain, onChange } = this.props;

        this.setState((state) => ({
            expandedRowIndex: undefined,
            collapsed: collapsed !== undefined ? collapsed : !state.collapsed
        }), () => {
            let newDomain = this.validateDomain(domain);

            // clear the search/filter state if collapsed
            if (this.state.collapsed) {
                newDomain = this.getFilteredFields(newDomain);
            }

            if (onChange) {
                onChange(newDomain, false);
            }
        });
    };

    togglePanel = (evt: any, collapsed?: boolean): void => {
        const { onToggle, collapsible, controlledCollapse} = this.props;

        if (collapsible || controlledCollapse) {
            if (onToggle) {
                onToggle((collapsed !== undefined ? collapsed : !this.state.collapsed), this.toggleLocalPanel);
            }
            else {
                this.toggleLocalPanel(collapsed)
            }
        }
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

    domainExists(domainDesign: DomainDesign): boolean {
        return !!(domainDesign);
    }

    onFieldExpandToggle = (index: number): void => {
        const { expandedRowIndex } = this.state;

        expandedRowIndex === index ? this.collapseRow() : this.expandRow(index);
    };

    onDomainChange(updatedDomain: DomainDesign, dirty?: boolean) {
        const { onChange, controlledCollapse } = this.props;

        // Check for cleared errors
        if (controlledCollapse && updatedDomain.hasErrors()) {
            const invalidFields = updatedDomain.getInvalidFields();
            const markedInvalid = updatedDomain.get("domainException").get("errors");

            if (markedInvalid.size > invalidFields.size) {
                updatedDomain = this.validateDomain(updatedDomain);
            }
        }

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

    initNewDesign = () => {
        const {domain} = this.props;
        const {newDesignFields} = domain;

        if (newDesignFields) {
             newDesignFields.forEach(this.applyAddField);
             this.setState({
                 expandedRowIndex: 0
             });
        }
        else
            this.applyAddField();
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
        const { domain } = this.props;
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
                    <span className={'domain-form-add-link'} onClick={this.initNewDesign}>
                        Start a New Design
                    </span>
                </div>
            )
        }
        else {
            // TODO remove domain-form-add-btn after use in 19.3
            return (
                <Row className='domain-add-field-row'>
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
    };

    renderFieldRemoveConfirm() {
        return (
            <ConfirmModal
                title='Confirm Field Deletion'
                msg='Are you sure you want to remove this field? All of its data will be deleted as well.'
                onConfirm={this.onDeleteConfirm}
                onCancel={this.onConfirmCancel}
                confirmVariant='danger'
                confirmButtonText='Yes, Remove Field'
                cancelButtonText='Cancel'
            />
        )
    }

    renderRowHeaders() {
        return (
            <div className='domain-floating-hdr'>
                <Row className='domain-form-hdr-row'>
                    <Col xs={6}>
                        <Col xs={6}>
                            <b>Name</b>
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
                    No fields created yet. Add some using the button below.
                </Panel>
            );
        }
    }

    onSearch = (evt) => {
        const { value } = evt.target;
        this.updateFilteredFields(value);
    };

    getFilteredFields = (domain: DomainDesign, value?: string): DomainDesign => {
        const filteredFields = domain.fields.map( field => {
            if (!value || (field.name && field.name.toLowerCase().indexOf(value.toLowerCase()) !== -1)) {
                return field.set('visible', true);
            }

            return field.set('visible', false);
        });

        return domain.set('fields', filteredFields) as DomainDesign;
    };

    updateFilteredFields = (value?: string) => {
        const { domain } = this.props;

        const filteredDomain = this.getFilteredFields(domain, value);

        this.setState(() => ({filtered: value !== undefined && value.length > 0}));
        this.onDomainChange(filteredDomain, false);
    };

    isPanelExpanded = (): boolean => {
        const { collapsible, controlledCollapse } = this.props;
        const { collapsed } = this.state;

        if (!collapsible && !controlledCollapse)
            return true;

        return !collapsed;
    };

    renderPanelHeaderContent() {
        const { helpURL, controlledCollapse } = this.props;

        return(
            <Row className={helpURL ? 'domain-form-hdr-margins' : ''}>
                <Col xs={helpURL ? 9 : 12}>
                    {!controlledCollapse &&
                        'Adjust fields and their properties. Expand a row to set additional properties.'
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
        const { fields } = this.props.domain;

        return (
            <Row>
                <Col xs={3}>
                    <FormControl id={"domain-search-name"} type="text" placeholder={'Search Fields'} onChange={this.onSearch}/>
                </Col>
                {this.state.filtered &&
                    <Col xs={9}>
                        <div className={"domain-search-text"}>
                            Showing {fields.filter(f => f.visible).size} of {fields.size} field{fields.size > 1 ? 's' : ''}.
                        </div>
                    </Col>
                }
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
                {this.renderPanelHeaderContent()}
                {appDomainHeaderRenderer && this.renderAppDomainHeader()}
                {(filtered || domain.fields.size > 1) && this.renderSearchField()}
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
                                                showDefaultValueSettings={domain.showDefaultValueSettings}
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

    static getHeaderName(name?: string, headerTitle?: string, headerPrefix?: string): string {
        let updatedName = headerTitle || (name ? name : "Fields");

        // optionally trim off a headerPrefix from the name display
        if (headerPrefix && updatedName.indexOf(headerPrefix + ' ') === 0) {
            updatedName = updatedName.replace(headerPrefix + ' ', '');
        }

        // prefer "Results Fields" over "Data Fields"in assay case
        if (updatedName.endsWith('Data Fields')) {
            updatedName = updatedName.replace('Data Fields', 'Results Fields');
        }

        return updatedName;
    }

    getPanelHeaderClass(): string {
        const { collapsible, controlledCollapse, useTheme } = this.props;

        let classes = 'domain-panel-header ' + ((collapsible || controlledCollapse) ? 'domain-heading-collapsible' : '');
        classes += ((this.isPanelExpanded() && controlledCollapse) ? ' domain-panel-header-expanded' : ' domain-panel-header-collapsed');
        if (this.isPanelExpanded() && controlledCollapse) {
            classes += (useTheme ? ' labkey-page-nav' : ' domain-panel-header-no-theme');
        }

        return classes;
    }

    getHeaderIconClass = () => {
        const { panelStatus, domain } = this.props;
        const { collapsed } = this.state;
        let classes = 'domain-panel-status-icon';

        if (collapsed) {
            if (!domain.hasException() && panelStatus === 'COMPLETE') {
                return classes + ' domain-panel-status-icon-green';
            }
            return (classes + ' domain-panel-status-icon-blue');
        }

        return classes;
    };

    getHeaderIcon = () => {
        const { domain, panelStatus } = this.props;

        if (domain.hasException() || panelStatus === 'TODO') {
            return faExclamationCircle;
        }

        return faCheckCircle;
    };

    getHeaderIconComponent = () => {

        return (
            <span className={this.getHeaderIconClass()}>
                <FontAwesomeIcon icon={this.getHeaderIcon()}/>
            </span>
        )
    };

    getHeaderIconHelpMsg = () => {
        const { panelStatus, domain } = this.props;

        if (domain.hasException()) {
            return domain.domainException.exception;
        }

        if (panelStatus === 'TODO') {
            return "This section does not contain any user defined fields.  You may want to review."
        }

        return undefined;
    };

    getPanelClass = () => {
        const { collapsed } = this.state;
        const { useTheme, controlledCollapse } = this.props;

        let classes = 'domain-form-panel';

        if (!collapsed && controlledCollapse) {
            if (useTheme) {
                classes += ' lk-border-theme-light';
            }
            else {
                classes += ' domain-panel-no-theme';
            }
        }

        return classes;
    };

    getAlertClasses = () => {
        const { collapsed } = this.state;
        const { useTheme, controlledCollapse } = this.props;
        let classes = 'domain-bottom-alert panel-default';

        if (!collapsed && controlledCollapse) {
            if (useTheme) {
                classes += ' lk-border-theme-light';
            }
            else {
                classes += ' domain-bottom-alert-expanded';
            }
        }
        else {
            classes += ' panel-default';
        }

        if (!collapsed)
            classes += ' domain-bottom-alert-top';

        return classes;
    };

    renderHeaderContent() {
        const { collapsible, controlledCollapse, panelStatus, children, domain, headerTitle, headerPrefix } = this.props;
        const { collapsed } = this.state;

        const iconHelpMsg = ((panelStatus && panelStatus !== 'NONE') ? this.getHeaderIconHelpMsg() : undefined);

        return (
            <>
                {/*Setup header help icon if applicable*/}
                {iconHelpMsg &&
                    <LabelHelpTip title={DomainFormImpl.getHeaderName(domain.name, headerTitle, headerPrefix)} body={() => (iconHelpMsg)} placement="top" iconComponent={this.getHeaderIconComponent}/>
                }
                {panelStatus && panelStatus !== 'NONE' && !iconHelpMsg && this.getHeaderIconComponent()}

                {/*Header name*/}
                <span>{DomainFormImpl.getHeaderName(domain.name, headerTitle, headerPrefix)}</span>

                {/*Expand/Collapse Icon*/}
                {(collapsible || controlledCollapse) && collapsed &&
                    <span className={'pull-right'}>
                        <FontAwesomeIcon size={'lg'} icon={faPlusSquare} className={"domain-form-expand-btn"}/>
                    </span>
                }
                {(collapsible || controlledCollapse) && !collapsed &&
                    <span className={'pull-right'}>
                        <FontAwesomeIcon size={'lg'} icon={faMinusSquare} className={"domain-form-collapse-btn"}/>
                    </span>
                }

                {/*Help tip*/}
                {children &&
                    <LabelHelpTip customStyle={{verticalAlign: 'top', marginLeft: '5px'}} placement={'top'} title={DomainFormImpl.getHeaderName(domain.name, headerTitle, headerPrefix)} body={() => (children)}/>
                }

                {/*Number of fields*/}
                {controlledCollapse && (domain.fields.size > 0) &&
                    <span className='domain-panel-header-fields-defined'>{'' + domain.fields.size + ' Field' + (domain.fields.size > 1?'s':'') + ' Defined'}</span>
                }
            </>
        )
    }

    render() {
        const { domain, showHeader, collapsible, controlledCollapse } = this.props;
        const { showConfirm } = this.state;

        return (
            <>
                {showConfirm && this.renderFieldRemoveConfirm()}
                <Panel className={this.getPanelClass()} expanded={this.isPanelExpanded()} onToggle={function(){}}>
                    {showHeader &&
                        <Panel.Heading onClick={this.togglePanel} className={this.getPanelHeaderClass()} id={domain && domain.name ? createFormInputName(domain.name.replace(/\s/g, '-') + '-hdr') : 'domain-header'}>
                            {this.renderHeaderContent()}
                        </Panel.Heading>
                    }
                    <Panel.Body collapsible={collapsible || controlledCollapse}>
                        {this.domainExists(domain)
                            ? this.renderForm()
                            : <Alert>Invalid domain design.</Alert>
                        }
                    </Panel.Body>
                </Panel>
                {domain.hasException() && domain.domainException.severity === SEVERITY_LEVEL_ERROR &&
                    <div onClick={this.togglePanel} className={this.getAlertClasses()}>
                        <Alert bsStyle="danger">{domain.domainException.exception}</Alert>
                    </div>
                }
            </>
        );
    }
}