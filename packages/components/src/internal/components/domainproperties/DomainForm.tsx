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

import { Sticky, StickyContainer } from 'react-sticky';

import { ActionButton } from '../buttons/ActionButton';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { ConfirmModal } from '../base/ConfirmModal';
import { InferDomainResponse } from '../base/models/model';
import { FileAttachmentForm } from '../files/FileAttachmentForm';
import { Alert } from '../base/Alert';
import { FIELD_EDITOR_TOPIC, helpLinkNode } from '../../util/helpLinks';

import { blurActiveElement } from '../../util/utils';

import {
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    DOMAIN_FIELD_PRIMARY_KEY_LOCKED,
    EXPAND_TRANSITION,
    EXPAND_TRANSITION_FAST,
    PHILEVEL_NOT_PHI,
    SEVERITY_LEVEL_ERROR,
} from './constants';
import { LookupProvider } from './Lookup/Context';
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
    mergeDomainFields,
    removeField,
    setDomainFields,
    updateDomainPanelClassList,
} from './actions';
import { DomainRow } from './DomainRow';
import {
    DomainDesign,
    DomainException,
    DomainField,
    DomainFieldError,
    DomainPanelStatus,
    HeaderRenderer,
    IAppDomainHeader,
    IDomainField,
    IDomainFormDisplayOptions,
    IFieldChange,
    DomainFieldIndexChange,
} from './models';
import { SimpleResponse } from "../files/models";
import { ATTACHMENT_TYPE, FILE_TYPE, FLAG_TYPE, PROP_DESC_TYPES, PropDescType } from './PropDescType';
import { CollapsiblePanelHeader } from './CollapsiblePanelHeader';
import { ImportDataFilePreview } from './ImportDataFilePreview';

interface IDomainFormInput {
    domain: DomainDesign;
    onChange: (newDomain: DomainDesign, dirty: boolean, rowIndexChange?: DomainFieldIndexChange) => any;
    onToggle?: (collapsed: boolean, callback?: () => any) => any;
    helpTopic?: string;
    helpNoun?: string;
    showHeader?: boolean;
    initCollapsed?: boolean;
    collapsible?: boolean;
    controlledCollapse?: boolean;
    validate?: boolean;
    isNew?: boolean;
    panelStatus?: DomainPanelStatus;
    headerPrefix?: string; // used as a string to remove from the heading when using the domain.name
    headerTitle?: string;
    allowImportExport?: boolean;
    todoIconHelpMsg?: string;
    showInferFromFile?: boolean;
    useTheme?: boolean;
    appDomainHeaderRenderer?: HeaderRenderer;
    maxPhiLevel?: string; // Just for testing, only affects display
    containerTop?: number; // This sets the top of the sticky header, default is 0
    modelDomains?: List<DomainDesign>; // Set of domains that encompass the full protocol, that may impact validation or alerts
    appPropertiesOnly?: boolean; // Flag to indicate if LKS specific types should be shown (false) or not (true)
    showFilePropertyType?: boolean; // Flag to indicate if the File property type should be allowed
    domainIndex?: number;
    successBsStyle?: string;
    setFileImportData?: (file: File, shouldImportData: boolean) => any; // having this prop set is also an indicator that you want to show the file preview grid with the import data option
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    fieldsAdditionalRenderer?: () => any;
}

interface IDomainFormState {
    expandedRowIndex: number;
    expandTransition: number;
    confirmDeleteRowIndex: number;
    collapsed: boolean;
    maxPhiLevel: string;
    dragId?: number;
    availableTypes: List<PropDescType>;
    filtered: boolean;
    filePreviewData: InferDomainResponse;
    file: File;
    filePreviewMsg: string;
}

export default class DomainForm extends React.PureComponent<IDomainFormInput> {
    render() {
        return (
            <LookupProvider>
                <DomainFormImpl {...this.props} />
            </LookupProvider>
        );
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
        appPropertiesOnly: false, // TODO: convert them into more options in the IDomainFormDisplayOptions interface
        domainIndex: 0,
        successBsStyle: 'success',
        domainFormDisplayOptions: DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS, // add configurations options to DomainForm through this object
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
            filePreviewMsg: undefined,
        };
    }

    componentDidMount(): void {
        if (!this.props.maxPhiLevel) {
            getMaxPhiLevel()
                .then(maxPhiLevel => {
                    this.setState(() => ({ maxPhiLevel }));
                })
                .catch(error => {
                    console.error('Unable to retrieve max PHI level.');
                });
        }

        updateDomainPanelClassList(this.props.useTheme, this.props.domain);
    }

    componentDidUpdate(
        prevProps: Readonly<IDomainFormInput>,
        prevState: Readonly<IDomainFormState>,
        snapshot?: any
    ): void {
        updateDomainPanelClassList(prevProps.useTheme, this.props.domain);
    }

    getAvailableTypes = (): List<PropDescType> => {
        const { domain } = this.props;

        return PROP_DESC_TYPES.filter(type => {
            if (type === FLAG_TYPE && !domain.allowFlagProperties) {
                return false;
            }

            if (type === FILE_TYPE && !domain.allowFileLinkProperties) {
                return false;
            }

            return !(type === ATTACHMENT_TYPE && !domain.allowAttachmentProperties);
        }) as List<PropDescType>;
    };

    UNSAFE_componentWillReceiveProps(nextProps: Readonly<IDomainFormInput>, nextContext: any): void {
        const { controlledCollapse, initCollapsed, validate, onChange } = this.props;

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
            const exception = DomainException.clientValidationExceptions(
                'Missing required field properties.',
                invalidFields
            );
            const exceptionWithAllErrors = DomainException.mergeWarnings(domain, exception);
            newDomain = domain.set(
                'domainException',
                exceptionWithAllErrors ? exceptionWithAllErrors : exception
            ) as DomainDesign;
        } else {
            newDomain = clearAllClientValidationErrors(domain);
        }

        return newDomain;
    };

    toggleLocalPanel = (collapsed?: boolean): void => {
        const { domain, onChange } = this.props;

        this.setState(
            state => ({
                expandedRowIndex: undefined,
                collapsed: collapsed !== undefined ? collapsed : !state.collapsed,
            }),
            () => {
                let newDomain = this.validateDomain(domain);

                // clear the search/filter state if collapsed
                if (this.state.collapsed) {
                    newDomain = this.getFilteredFields(newDomain);
                }

                if (onChange) {
                    onChange(newDomain, false);
                }
            }
        );
    };

    togglePanel = (evt: any, collapsed?: boolean): void => {
        const { onToggle, collapsible, controlledCollapse } = this.props;

        if (collapsible || controlledCollapse) {
            if (onToggle) {
                onToggle(collapsed !== undefined ? collapsed : !this.state.collapsed, this.toggleLocalPanel);
            } else {
                this.toggleLocalPanel(collapsed);
            }
        }
    };

    setExpandedState(expandedRowIndex: number, expandTransition: number) {
        this.setState(() => ({ expandedRowIndex, expandTransition }));
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
        return !!domainDesign;
    }

    onFieldExpandToggle = (index: number): void => {
        const { expandedRowIndex } = this.state;

        expandedRowIndex === index ? this.collapseRow() : this.expandRow(index);
    };

    onDomainChange(updatedDomain: DomainDesign, dirty?: boolean, rowIndexChange?: DomainFieldIndexChange) {
        const { onChange, controlledCollapse } = this.props;

        // Check for cleared errors
        if (controlledCollapse && updatedDomain.hasErrors()) {
            const invalidFields = updatedDomain.getInvalidFields();
            const markedInvalid = updatedDomain.get('domainException').get('errors');

            if (markedInvalid.size > invalidFields.size) {
                updatedDomain = this.validateDomain(updatedDomain);
            }
        }

        if (onChange) {
            onChange(updatedDomain, dirty !== undefined ? dirty : true, rowIndexChange);
        }
    }

    onDeleteConfirm(index: number) {
        let fieldCount = this.props.domain.fields.size;
        if (index !== undefined) {
            const rowIndexChange = { originalIndex: index, newIndex: undefined } as DomainFieldIndexChange;
            const updatedDomain = removeField(this.props.domain, index);
            fieldCount = updatedDomain.fields.size;

            this.onDomainChange(updatedDomain, true, rowIndexChange);
        }

        this.setState(state => ({
            expandedRowIndex: undefined,
            confirmDeleteRowIndex: undefined,

            // if the last field was removed, clear any file preview data
            filePreviewData: fieldCount === 0 ? undefined : state.filePreviewData,
            file: fieldCount === 0 ? undefined : state.file,
            filePreviewMsg: undefined,
        }));
    }

    initNewDesign = () => {
        const { domain } = this.props;
        const { newDesignFields } = domain;

        if (newDesignFields) {
            newDesignFields.forEach(this.applyAddField);
            this.setState(() => ({ expandedRowIndex: 0 }));
        } else this.applyAddField();
    };

    onExportFields = () => {
        const { domain } = this.props;
        let fields = domain.fields;
        let filteredFields = fields.filter((field: DomainField) => field.visible);
        let fieldData = filteredFields.map(DomainField.serialize).toArray();
        const fieldsJson = JSON.stringify(fieldData, null, 4);

        // This looks hacky, but it's actually the recommended way to download a file using raw JS
        let downloadLink = document.createElement('a');
        downloadLink.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(fieldsJson);
        downloadLink.download = 'Fields';
        downloadLink.style.display = 'none';

        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
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
                this.setState(() => ({ confirmDeleteRowIndex: index }));
            } else {
                this.onDeleteConfirm(index);
            }
        }
    };

    onConfirmCancel = () => {
        this.setState(() => ({ confirmDeleteRowIndex: undefined }));
    };

    onBeforeDragStart = initial => {
        const { domain } = this.props;
        const id = initial.draggableId;
        const idIndex = id ? getIndexFromId(id) : undefined;

        this.setState(() => ({ dragId: idIndex }));

        this.onDomainChange(domain);

        // remove focus for any current element so that it doesn't "jump" after drag end
        blurActiveElement();
    };

    onDragEnd = result => {
        const { domain } = this.props;

        let destIndex = result.source.index; // default behavior go back to original spot if out of bounds
        const srcIndex = result.source.index;
        const id = result.draggableId;
        const idIndex = id ? getIndexFromId(id) : undefined;

        this.setState(() => ({ dragId: undefined }));

        if (result.destination) {
            destIndex = result.destination.index;
        }

        if (srcIndex === destIndex) {
            return;
        }

        const movedField = domain.fields.find((field, i) => i === idIndex);

        const newFields = List<DomainField>().asMutable();
        let fieldsWithNewIndexesOnErrors = domain.hasException()
            ? domain.domainException.errors
            : List<DomainFieldError>();

        let expanded = this.state.expandedRowIndex;

        domain.fields.forEach((field, i) => {
            // move down
            if (i !== idIndex && srcIndex < destIndex) {
                newFields.push(field);
                fieldsWithNewIndexesOnErrors = this.setNewIndexOnError(
                    i,
                    newFields.size - 1,
                    fieldsWithNewIndexesOnErrors
                );
                if (i === this.state.expandedRowIndex) {
                    expanded = newFields.size - 1;
                }
            }

            if (i === destIndex) {
                newFields.push(movedField);
                fieldsWithNewIndexesOnErrors = this.setNewIndexOnError(
                    idIndex,
                    destIndex,
                    fieldsWithNewIndexesOnErrors
                );
                if (idIndex === this.state.expandedRowIndex) {
                    expanded = destIndex;
                }
            }

            // move up
            if (i !== idIndex && srcIndex > destIndex) {
                newFields.push(field);
                fieldsWithNewIndexesOnErrors = this.setNewIndexOnError(
                    i,
                    newFields.size - 1,
                    fieldsWithNewIndexesOnErrors
                );
                if (i === this.state.expandedRowIndex) {
                    expanded = newFields.size - 1;
                }
            }
        });

        // set existing error row indexes with new row indexes
        const fieldsWithMovedErrorsUpdated = fieldsWithNewIndexesOnErrors.map(error => {
            return error.merge({
                rowIndexes: error.newRowIndexes ? error.newRowIndexes : error.rowIndexes,
                newRowIndexes: undefined, // reset newRowIndexes
            });
        });

        let domainExceptionWithMovedErrors;
        if (domain.hasException()) {
            domainExceptionWithMovedErrors = domain.domainException.set('errors', fieldsWithMovedErrorsUpdated);
        }

        const newDomain = domain.merge({
            fields: newFields.asImmutable(),
            domainException: domainExceptionWithMovedErrors,
        }) as DomainDesign;

        const rowIndexChange = { originalIndex: srcIndex, newIndex: destIndex } as DomainFieldIndexChange;

        this.onDomainChange(newDomain, true, rowIndexChange);

        this.fastExpand(expanded);
    };

    setNewIndexOnError = (oldIndex: number, newIndex: number, fieldErrors: List<DomainFieldError>) => {
        const updatedErrorList = fieldErrors.map(fieldError => {
            let newRowIndexes;
            if (fieldError.newRowIndexes === undefined) {
                newRowIndexes = List<number>().asMutable();
            } else {
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
        const { domainFormDisplayOptions } = this.props;

        if (!domainFormDisplayOptions.hideAddFieldsButton) {
            if (this.shouldShowInferFromFile()) {
                return (
                    <div className="margin-top domain-form-manual-section">
                        <p>Or</p>
                        <ActionButton buttonClass="domain-form-manual-btn" onClick={this.initNewDesign}>
                            Manually Define Fields
                        </ActionButton>
                    </div>
                );
            } else {
                return (
                    <Row className="domain-add-field-row">
                        <Col xs={12}>
                            <AddEntityButton
                                entity="Field"
                                buttonClass="domain-form-add-btn"
                                containerClass="pull-right"
                                onClick={this.onAddField}
                            />
                        </Col>
                    </Row>
                );
            }
        }
    }

    getFieldError(domain: DomainDesign, index: number): DomainFieldError {
        if (domain.hasException()) {
            const fieldErrors = domain.domainException.errors;

            if (!fieldErrors.isEmpty()) {
                const errorsWithIndex = fieldErrors.filter(error => {
                    return (
                        error.rowIndexes.findIndex(idx => {
                            return idx === index;
                        }) >= 0
                    );
                });
                return errorsWithIndex.get(0);
            }
        }

        return undefined;
    }

    stickyStyle = (style: any, isSticky: boolean): any => {
        const { containerTop } = this.props;

        const newStyle = { ...style, zIndex: 1000, top: containerTop ? containerTop : 0 };

        // Sticking to top
        if (isSticky) {
            const newWidth = parseInt(style.width, 10) + 30; // Expand past panel padding
            const width = newWidth + 'px';

            return {
                ...newStyle,
                width,
                marginLeft: '-15px',
                paddingLeft: '15px',
                boxShadow: '0 2px 4px 0 rgba(0,0,0,0.12), 0 2px 2px 0 rgba(0,0,0,0.24)',
            };
        }

        return newStyle;
    };

    renderFieldRemoveConfirm() {
        const { confirmDeleteRowIndex } = this.state;
        const field = this.props.domain.fields.get(confirmDeleteRowIndex);

        return (
            <ConfirmModal
                title="Confirm Remove Field"
                msg={
                    <div>
                        Are you sure you want to remove{' '}
                        {field && field.name && field.name.trim().length > 0 ? <b>{field.name}</b> : 'this field'}? All
                        of its data will be deleted as well.
                    </div>
                }
                onConfirm={() => this.onDeleteConfirm(confirmDeleteRowIndex)}
                onCancel={this.onConfirmCancel}
                confirmVariant="danger"
                confirmButtonText="Yes, Remove Field"
                cancelButtonText="Cancel"
            />
        );
    }

    renderRowHeaders() {
        const { domainFormDisplayOptions } = this.props;

        return (
            <div className="domain-floating-hdr">
                <Row className="domain-form-hdr-row">
                    <Col xs={6}>
                        <Col xs={6}>
                            <b>Name</b>
                        </Col>
                        <Col xs={4}>
                            <b>Data Type</b>
                        </Col>
                        {!domainFormDisplayOptions.hideRequired && (
                            <Col xs={2} className="domain-form-hdr-center">
                                <b>Required</b>
                            </Col>
                        )}
                    </Col>
                    <Col xs={6}>
                        <b>Details</b>
                    </Col>
                </Row>
            </div>
        );
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
                this.setState({ filePreviewData: response, file, filePreviewMsg: undefined });
                setFileImportData(file, true);
            }

            this.onDomainChange(setDomainFields(domain, response.fields));
        } else {
            this.setState({
                filePreviewMsg:
                    'The selected file does not have any data. Please remove it and try selecting another file.',
            });
        }
    };

    importFieldsFromJson = (file: File): Promise<SimpleResponse> => {
        const { domain, onChange } = this.props;

        return file.text()
            .then(text => {
                const domainType = domain.domainType;
                const jsFields = JSON.parse(text);
                if (jsFields.length < 1) return {success: false, msg: 'No fields found.'};

                for (let i=0; i < jsFields.length; i++){
                    let field = jsFields[i];

                    if (field.defaultValueType && !domain.hasDefaultValueOption(field.defaultValueType)) {
                        return {success: false, msg: `Error on importing field '${field.name}': Default value '${field.defaultValueType}' is invalid.`};
                    }

                    if (domainType !== 'list' && field.lockType === DOMAIN_FIELD_PRIMARY_KEY_LOCKED) {
                        return {success: false, msg: `Error on importing field '${field.name}': Domain type '${domainType}' does not support fields with an externally defined Primary Key.`};
                    }
                }

                // Convert to TS and merge entire List
                const tsFields: List<DomainField> = List(jsFields.map(field => DomainField.create(field, true)));
                if (onChange) {
                    onChange(mergeDomainFields(domain, tsFields), true);
                }
                return {success: true};
            })
            .catch(error => {
                return {success: false, msg: error.toString()};
            });
    }

    renderEmptyDomain() {
        const { allowImportExport } = this.props;
        if (this.shouldShowInferFromFile()) {
            return (
                <>
                    <FileAttachmentForm
                        acceptedFormats={".csv, .tsv, .txt, .xls, .xlsx" + (allowImportExport ? ", .json" : "")}
                        showAcceptedFormats={true}
                        allowDirectories={false}
                        allowMultiple={false}
                        label="Infer fields from file"
                        onFileRemoval={() => this.setState(() => ({ filePreviewMsg: undefined }))}
                        previewGridProps={{
                            previewCount: 3,
                            skipPreviewGrid: true,
                            onPreviewLoad: this.handleFilePreviewLoad,
                        }}
                        importFieldsFromJson={this.importFieldsFromJson}
                    />
                    {this.state.filePreviewMsg && <Alert bsStyle="info">{this.state.filePreviewMsg}</Alert>}
                </>
            );
        } else {
            return (
                <Panel className="domain-form-no-field-panel">
                    No fields created yet. Click the 'Add Field' button to get started.
                </Panel>
            );
        }
    }

    onSearch = evt => {
        const { value } = evt.target;
        this.updateFilteredFields(value);
    };

    getFilteredFields = (domain: DomainDesign, value?: string): DomainDesign => {
        const filteredFields = domain.fields.map(field => {
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

        this.setState(() => ({ filtered: value !== undefined && value.length > 0 }));
        this.onDomainChange(filteredDomain, false);
    };

    isPanelExpanded = (): boolean => {
        const { collapsible, controlledCollapse } = this.props;
        const { collapsed } = this.state;

        if (!collapsible && !controlledCollapse) return true;

        return !collapsed;
    };

    renderPanelHeaderContent() {
        const { helpTopic, controlledCollapse } = this.props;

        return (
            <Row className={helpTopic ? 'domain-form-hdr-margins' : ''}>
                <Col xs={helpTopic ? 9 : 12}>
                    {!controlledCollapse &&
                        'Adjust fields and their properties. Expand a row to set additional properties.'}
                </Col>
                {helpTopic && (
                    <Col xs={3}>
                        {helpLinkNode(helpTopic, 'Learn more about this tool', 'domain-field-float-right')}
                    </Col>
                )}
            </Row>
        );
    }

    renderToolbar() {
        const { domain, domainIndex, allowImportExport } = this.props;
        const { fields } = domain;
        const disableExport = fields.size < 1 || fields.filter((field: DomainField) => field.visible).size < 1;

        return (
            <Row className="domain-field-toolbar">
                <Col xs={4}>
                    <AddEntityButton
                        entity="Field"
                        containerClass="container--toolbar-button"
                        buttonClass="domain-toolbar-add-btn"
                        onClick={this.onAddField}
                    />
                    {allowImportExport &&
                        <ActionButton
                            containerClass="container--toolbar-button"
                            buttonClass="domain-toolbar-export-btn"
                            onClick={this.onExportFields}
                            disabled={disableExport}
                        >
                            <i className="fa fa-download domain-toolbar-export-btn-icon" /> Export
                        </ActionButton>
                    }
                </Col>
                <Col xs={8}>
                    <div className="pull-right">
                        {this.state.filtered && (
                            <span className="domain-search-text">
                                Showing {fields.filter(f => f.visible).size} of {fields.size} field
                                {fields.size > 1 ? 's' : ''}.
                            </span>
                        )}
                        <FormControl
                            id={'domain-search-name-' + domainIndex}
                            className="domain-search-input"
                            type="text"
                            placeholder="Search Fields"
                            onChange={this.onSearch}
                        />
                    </div>
                </Col>
            </Row>
        );
    }

    renderAppDomainHeader = () => {
        const { appDomainHeaderRenderer, modelDomains, domain, domainIndex } = this.props;
        const config = {
            domain,
            domainIndex,
            modelDomains,
            onChange: this.onFieldsChange,
            onAddField: this.applyAddField,
        } as IAppDomainHeader;

        return appDomainHeaderRenderer(config);
    };

    renderForm() {
        const {
            domain,
            helpNoun,
            containerTop,
            appDomainHeaderRenderer,
            appPropertiesOnly,
            showFilePropertyType,
            domainIndex,
            successBsStyle,
            domainFormDisplayOptions,
        } = this.props;
        const { expandedRowIndex, expandTransition, maxPhiLevel, dragId, availableTypes, filtered } = this.state;

        return (
            <>
                {!this.shouldShowInferFromFile() && this.renderToolbar()}
                {this.renderPanelHeaderContent()}
                {appDomainHeaderRenderer && this.renderAppDomainHeader()}
                {domain.fields.size > 0 ? (
                    <DragDropContext onDragEnd={this.onDragEnd} onBeforeDragStart={this.onBeforeDragStart}>
                        <StickyContainer>
                            <Sticky topOffset={containerTop ? -1 * containerTop : 0}>
                                {({ style, isSticky }) => (
                                    <div style={this.stickyStyle(style, isSticky)}>{this.renderRowHeaders()}</div>
                                )}
                            </Sticky>
                            <Droppable droppableId="domain-form-droppable">
                                {provided => (
                                    <div ref={provided.innerRef} {...provided.droppableProps}>
                                        <Form>
                                            {domain.fields.map((field, i) => {
                                                // Need to preserve index so don't filter, instead just use empty div
                                                if (!field.visible) return <div key={'domain-row-key-' + i} />;

                                                return (
                                                    <DomainRow
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
                                                        availableTypes={availableTypes}
                                                        showDefaultValueSettings={domain.showDefaultValueSettings}
                                                        defaultDefaultValueType={domain.defaultDefaultValueType}
                                                        defaultValueOptions={domain.defaultValueOptions}
                                                        appPropertiesOnly={appPropertiesOnly}
                                                        showFilePropertyType={showFilePropertyType}
                                                        successBsStyle={successBsStyle}
                                                        domainFormDisplayOptions={{
                                                            ...domainFormDisplayOptions,
                                                            isDragDisabled:
                                                                filtered || domainFormDisplayOptions.isDragDisabled,
                                                        }}
                                                    />
                                                );
                                            })}
                                            {provided.placeholder}
                                        </Form>
                                    </div>
                                )}
                            </Droppable>
                        </StickyContainer>
                    </DragDropContext>
                ) : (
                    this.renderEmptyDomain()
                )}
                {this.renderAddFieldOption()}
            </>
        );
    }

    render() {
        const {
            children,
            domain,
            showHeader,
            collapsible,
            controlledCollapse,
            headerTitle,
            headerPrefix,
            panelStatus,
            useTheme,
            helpNoun,
            setFileImportData,
            fieldsAdditionalRenderer,
            domainFormDisplayOptions,
            todoIconHelpMsg,
        } = this.props;
        const { collapsed, confirmDeleteRowIndex, filePreviewData, file } = this.state;
        const title = getDomainHeaderName(domain.name, headerTitle, headerPrefix);
        const headerDetails =
            domain.fields.size > 0
                ? '' + domain.fields.size + ' Field' + (domain.fields.size > 1 ? 's' : '') + ' Defined'
                : undefined;

        return (
            <>
                {confirmDeleteRowIndex !== undefined && this.renderFieldRemoveConfirm()}
                <Panel
                    className={getDomainPanelClass(collapsed, controlledCollapse, useTheme)}
                    expanded={this.isPanelExpanded()}
                    onToggle={function () {}}
                >
                    {showHeader && (
                        <CollapsiblePanelHeader
                            id={getDomainPanelHeaderId(domain)}
                            title={title}
                            collapsed={!(this.isPanelExpanded() && controlledCollapse)}
                            collapsible={collapsible}
                            controlledCollapse={controlledCollapse}
                            headerDetails={headerDetails}
                            todoIconHelpMsg={todoIconHelpMsg}
                            panelStatus={panelStatus}
                            togglePanel={this.togglePanel}
                            useTheme={useTheme}
                            isValid={!domain.hasException()}
                            iconHelpMsg={domain.hasException() ? domain.domainException.exception : undefined}
                        >
                            {children}
                        </CollapsiblePanelHeader>
                    )}
                    <Panel.Body id={!this.shouldShowInferFromFile() && 'domain-field-top-noBuffer'} collapsible={collapsible || controlledCollapse}>
                        {this.domainExists(domain) ? this.renderForm() : <Alert>Invalid domain design.</Alert>}

                        {fieldsAdditionalRenderer && fieldsAdditionalRenderer()}

                        {filePreviewData && !domainFormDisplayOptions.hideImportData && (
                            <ImportDataFilePreview
                                noun={helpNoun}
                                filePreviewData={filePreviewData}
                                setFileImportData={setFileImportData}
                                file={file}
                            />
                        )}
                    </Panel.Body>
                </Panel>
                {domain.hasException() && domain.domainException.severity === SEVERITY_LEVEL_ERROR && (
                    <div
                        onClick={this.togglePanel}
                        className={getDomainAlertClasses(collapsed, controlledCollapse, useTheme)}
                    >
                        <Alert bsStyle="danger">{domain.domainException.exception}</Alert>
                    </div>
                )}
            </>
        );
    }
}
