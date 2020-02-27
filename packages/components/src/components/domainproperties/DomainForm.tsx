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
import React from 'react';
import { List } from 'immutable';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Col, Form, FormControl, Panel, Row } from 'react-bootstrap';
import {
    ATTACHMENT_TYPE,
    DomainDesign,
    DomainException,
    DomainField,
    DomainFieldError,
    DomainPanelStatus,
    FILE_TYPE,
    FLAG_TYPE,
    HeaderRenderer,
    IAppDomainHeader,
    IDomainField,
    IFieldChange,
    PROP_DESC_TYPES,
    PropDescType,
} from './models';
import { Sticky, StickyContainer } from 'react-sticky';
import { DomainRow } from './DomainRow';
import {
    addDomainField,
    clearAllClientValidationErrors,
    getDomainAlertClasses,
    getDomainHeaderName,
    getDomainPanelClass,
    getDomainPanelHeaderId,
    getIndexFromId,
    getMaxPhiLevel,
    handleDomainUpdates,
    removeField,
    setDomainFields,
    updateDomainPanelClassList,
} from './actions';
import { LookupProvider } from './Lookup/Context';
import { EXPAND_TRANSITION, EXPAND_TRANSITION_FAST, PHILEVEL_NOT_PHI, SEVERITY_LEVEL_ERROR, } from './constants';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { ConfirmModal } from '../base/ConfirmModal';
import { InferDomainResponse } from '../base/models/model';
import { FileAttachmentForm } from '../files/FileAttachmentForm';
import { Alert } from '../base/Alert';
import { FIELD_EDITOR_TOPIC, helpLinkNode } from '../../util/helpLinks';
import { CollapsiblePanelHeader } from "./CollapsiblePanelHeader";
import { ImportDataFilePreview } from "./ImportDataFilePreview";

interface IDomainFormInput {
    domain: DomainDesign
    onChange: (newDomain: DomainDesign, dirty: boolean) => any
    onToggle?: (collapsed: boolean, callback?: () => any) => any
    helpTopic?: string
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
    appPropertiesOnly?: boolean //Flag to indicate if LKS specific types should be shown (false) or not (true)
    showFilePropertyType?: boolean //Flag to indicate if the File property type should be allowed
    domainIndex?: number
    successBsStyle?: string
    setFileImportData?: (file: File) => any // having this prop set is also an indicator that you want to show the file preview grid with the import data option
}

interface IDomainFormState {
    expandedRowIndex: number
    expandTransition: number
    confirmDeleteRowIndex: number
    collapsed: boolean
    maxPhiLevel: string
    dragId?: number
    availableTypes: List<PropDescType>
    filtered: boolean
    filePreviewData: InferDomainResponse
    file: File
    filePreviewMsg: string
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
        helpTopic: FIELD_EDITOR_TOPIC,
        showHeader: true,
        initCollapsed: false,
        isNew: false,
        appPropertiesOnly: false,
        domainIndex: 0,
        successBsStyle: 'success'
    };

    constructor(props) {
        super(props);

        this.state = {
            expandedRowIndex: undefined,
            expandTransition: EXPAND_TRANSITION,
            confirmDeleteRowIndex: undefined,
            dragId: undefined,
            maxPhiLevel: props.maxPhiLevel || PHILEVEL_NOT_PHI,
            availableTypes: this.getAvailableTypes(),
            collapsed: props.initCollapsed,
            filtered: false,
            filePreviewData: undefined,
            file: undefined,
            filePreviewMsg: undefined
        };
    }

    componentDidMount(): void {
        if (!this.props.maxPhiLevel) {
            getMaxPhiLevel()
                .then((maxPhiLevel) => {
                    this.setState(() => ({maxPhiLevel}));
                })
                .catch((error) => {
                    console.error("Unable to retrieve max PHI level.")
                })
        }

        updateDomainPanelClassList(this.props.useTheme, this.props.domain);
    }

    componentDidUpdate(prevProps: Readonly<IDomainFormInput>, prevState: Readonly<IDomainFormState>, snapshot?: any): void {
        updateDomainPanelClassList(prevProps.useTheme, this.props.domain);
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

    setExpandedState(expandedRowIndex: number, expandTransition: number) {
        this.setState(() => ({expandedRowIndex, expandTransition}));
    }

    collapseRow = (): void => {
        if (this.isExpanded()) {
            this.setExpandedState(undefined, EXPAND_TRANSITION);
        }
    };

    expandRow = (index: number): void => {
        const { domain } = this.props;
        const { expandedRowIndex } = this.state;

        if (expandedRowIndex !== index && index < domain.fields.size) {
            this.setExpandedState(index, EXPAND_TRANSITION);
        }
    };

    fastExpand = (index: number): void => {
        const { domain } = this.props;
        const { expandedRowIndex } = this.state;

        if (expandedRowIndex !== index && index < domain.fields.size) {
            this.setExpandedState(index, EXPAND_TRANSITION_FAST);
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

    onDeleteConfirm(index: number) {
        let fieldCount = this.props.domain.fields.size;
        if (index !== undefined) {
            const updatedDomain = removeField(this.props.domain, index);
            fieldCount = updatedDomain.fields.size;

            this.onDomainChange(updatedDomain);
        }

        this.setState((state) => ({
            expandedRowIndex: undefined,
            confirmDeleteRowIndex: undefined,

            // if the last field was removed, clear any file preview data
            filePreviewData: fieldCount === 0 ? undefined : state.filePreviewData,
            file: fieldCount === 0 ? undefined : state.file,
            filePreviewMsg: undefined
        }));
    }

    initNewDesign = () => {
        const {domain} = this.props;
        const {newDesignFields} = domain;

        if (newDesignFields) {
             newDesignFields.forEach(this.applyAddField);
             this.setState(() => ({expandedRowIndex: 0}));
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
        const field = domain.fields.get(index);

        if (field) {
            // only show the confirm dialog for saved fields
            if (field.isSaved()) {
                this.setState(() => ({confirmDeleteRowIndex: index}));
            }
            else {
                this.onDeleteConfirm(index);
            }
        }
    };

    onConfirmCancel = () => {
        this.setState(() => ({confirmDeleteRowIndex: undefined}));
    };

    onBeforeDragStart = (initial) => {
        const { domain } = this.props;
        const id = initial.draggableId;
        const idIndex = id ? getIndexFromId(id) : undefined;

        this.setState(() => ({dragId: idIndex}));

        this.onDomainChange(domain);

        // remove focus for any current element so that it doesn't "jump" after drag end
        (document.activeElement as HTMLElement).blur();
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
                        manually define fields
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
        const { confirmDeleteRowIndex } = this.state;
        const field = this.props.domain.fields.get(confirmDeleteRowIndex);

        return (
            <ConfirmModal
                title='Confirm Remove Field'
                msg={<div>Are you sure you want to remove {field && field.name && field.name.trim().length > 0 ? <b>{field.name}</b> : 'this field'}? All of its data will be deleted as well.</div>}
                onConfirm={() => this.onDeleteConfirm(confirmDeleteRowIndex)}
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

    handleFilePreviewLoad = (response: InferDomainResponse, file: File) => {
        const { domain, setFileImportData } = this.props;

        // if the DomainForm usage wants to show the file preview and import data options, then set these state values
        if (response && response.fields.size > 0) {
            if (setFileImportData) {
                this.setState({filePreviewData: response, file: file, filePreviewMsg: undefined});
            }

            this.onDomainChange(setDomainFields(domain, response.fields));
        }
        else {
            this.setState({filePreviewMsg: 'The selected file does not have any data. Please remove it and try selecting another file.'});
        }
    };

    renderEmptyDomain() {
        if (this.shouldShowInferFromFile()) {
            return (
                <>
                    <FileAttachmentForm
                        acceptedFormats={".csv, .tsv, .txt, .xls, .xlsx"}
                        showAcceptedFormats={true}
                        allowDirectories={false}
                        allowMultiple={false}
                        label={'Infer fields from file'}
                        onFileRemoval={() => this.setState(() => ({filePreviewMsg: undefined}))}
                        previewGridProps={{
                            previewCount: 3,
                            skipPreviewGrid: true,
                            onPreviewLoad: this.handleFilePreviewLoad
                        }}
                    />
                    {this.state.filePreviewMsg && <Alert bsStyle={'info'}>{this.state.filePreviewMsg}</Alert>}
                </>
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
        const { helpTopic, controlledCollapse } = this.props;

        return(
            <Row className={helpTopic ? 'domain-form-hdr-margins' : ''}>
                <Col xs={helpTopic ? 9 : 12}>
                    {!controlledCollapse &&
                        'Adjust fields and their properties. Expand a row to set additional properties.'
                    }
                </Col>
                {helpTopic &&
                    <Col xs={3}>
                        {helpLinkNode(helpTopic, "Learn more about this tool", 'domain-field-float-right')}
                    </Col>
                }
            </Row>
        )
    }

    renderSearchField() {
        const { domain, domainIndex} = this.props;
        const { fields } = domain;

        return (
            <Row>
                <Col xs={3}>
                    <FormControl id={"domain-search-name-" + domainIndex} type="text" placeholder={'Search Fields'} onChange={this.onSearch}/>
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
        const {appDomainHeaderRenderer, modelDomains, domain, domainIndex} = this.props;
        const config = {
            domain,
            domainIndex,
            modelDomains,
            onChange: this.onFieldsChange,
            onAddField: this.applyAddField
        } as IAppDomainHeader;

        return appDomainHeaderRenderer(config);
    };

    renderForm() {
        const { domain, helpNoun, containerTop, appDomainHeaderRenderer, appPropertiesOnly, showFilePropertyType, domainIndex, successBsStyle } = this.props;
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
                                                domainIndex={domainIndex}
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
                                                appPropertiesOnly={appPropertiesOnly}
                                                showFilePropertyType={showFilePropertyType}
                                                successBsStyle={successBsStyle}
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

    render() {
        const { children, domain, showHeader, collapsible, controlledCollapse, headerTitle, headerPrefix, panelStatus, useTheme, helpNoun, setFileImportData } = this.props;
        const { collapsed, confirmDeleteRowIndex, filePreviewData, file } = this.state;
        const title = getDomainHeaderName(domain.name, headerTitle, headerPrefix);
        const headerDetails = domain.fields.size > 0 ? '' + domain.fields.size + ' Field' + (domain.fields.size > 1?'s':'') + ' Defined' : undefined;

        return (
            <>
                {confirmDeleteRowIndex !== undefined && this.renderFieldRemoveConfirm()}
                <Panel className={getDomainPanelClass(collapsed, controlledCollapse, useTheme)} expanded={this.isPanelExpanded()} onToggle={function(){}}>
                    {showHeader &&
                        <CollapsiblePanelHeader
                            id={getDomainPanelHeaderId(domain)}
                            title={title}
                            collapsed={!(this.isPanelExpanded() && controlledCollapse)}
                            collapsible={collapsible}
                            controlledCollapse={controlledCollapse}
                            headerDetails={headerDetails}
                            panelStatus={panelStatus}
                            togglePanel={this.togglePanel}
                            useTheme={useTheme}
                            isValid={!domain.hasException()}
                            iconHelpMsg={domain.hasException() ? domain.domainException.exception : undefined}
                        >
                            {children}
                        </CollapsiblePanelHeader>
                    }
                    <Panel.Body collapsible={collapsible || controlledCollapse}>
                        {this.domainExists(domain)
                            ? this.renderForm()
                            : <Alert>Invalid domain design.</Alert>
                        }

                        {filePreviewData &&
                            <ImportDataFilePreview
                                noun={helpNoun}
                                filePreviewData={filePreviewData}
                                setFileImportData={setFileImportData}
                                file={file}
                            />
                        }
                    </Panel.Body>

                </Panel>
                {domain.hasException() && domain.domainException.severity === SEVERITY_LEVEL_ERROR &&
                    <div onClick={this.togglePanel} className={getDomainAlertClasses(collapsed, controlledCollapse, useTheme)}>
                        <Alert bsStyle="danger">{domain.domainException.exception}</Alert>
                    </div>
                }
            </>
        );
    }
}
