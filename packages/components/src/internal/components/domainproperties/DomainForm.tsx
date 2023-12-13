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
import React, { FC, memo, ReactNode } from 'react';
import { List, Map } from 'immutable';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { Button, Checkbox, Col, Form, FormControl, Panel, Row } from 'react-bootstrap';
import classNames from 'classnames';

import { FIELD_EDITOR_TOPIC, HelpLink } from '../../util/helpLinks';

import { blurActiveElement, valueIsEmpty } from '../../util/utils';

import { SimpleResponse } from '../files/models';

import { generateNameWithTimestamp } from '../../util/Date';

import { ActionButton } from '../buttons/ActionButton';

import { ONTOLOGY_MODULE_NAME } from '../ontology/actions';

import { hasModule, isApp } from '../../app/utils';

import { ConfirmModal } from '../base/ConfirmModal';

import { AddEntityButton } from '../buttons/AddEntityButton';

import { Alert } from '../base/Alert';

import { QueryColumn } from '../../../public/QueryColumn';

import { InferDomainResponse } from '../../../public/InferDomainResponse';

import { FileAttachmentForm } from '../../../public/files/FileAttachmentForm';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { getDefaultAPIWrapper } from '../../APIWrapper';

import { ToggleButtons } from '../buttons/ToggleButtons';

import {
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    EXPAND_TRANSITION,
    EXPAND_TRANSITION_FAST,
    PHILEVEL_NOT_PHI,
    SEVERITY_LEVEL_ERROR,
} from './constants';
import { LookupProvider } from './Lookup/Context';
import {
    addDomainField,
    clearAllClientValidationErrors,
    downloadJsonFile,
    getAvailableTypes,
    getAvailableTypesForOntology,
    getDomainAlertClasses,
    getDomainHeaderName,
    getDomainPanelClass,
    getDomainPanelHeaderId,
    handleDomainUpdates,
    handleSystemFieldUpdates,
    mergeDomainFields,
    processJsonImport,
    removeFields,
    setDomainFields,
    updateOntologyFieldProperties,
} from './actions';
import { getIndexFromId, getNameFromId } from './utils';
import { DomainRow } from './DomainRow';
import {
    BulkDeleteConfirmInfo,
    DomainDesign,
    DomainException,
    DomainField,
    DomainFieldError,
    DomainFieldIndexChange,
    DomainPanelStatus,
    FieldDetails,
    HeaderRenderer,
    IDomainField,
    IDomainFormDisplayOptions,
    IFieldChange,
    SystemField,
} from './models';
import { PropDescType } from './PropDescType';
import { CollapsiblePanelHeader } from './CollapsiblePanelHeader';
import { ImportDataFilePreview } from './ImportDataFilePreview';
import {
    applySetOperation,
    generateBulkDeleteWarning,
    getVisibleFieldCount,
    getVisibleSelectedFieldIndexes,
    isFieldDeletable,
} from './propertiesUtil';
import { DomainPropertiesGrid } from './DomainPropertiesGrid';
import { SystemFields } from './SystemFields';
import { DomainPropertiesAPIWrapper } from './APIWrapper';

interface IDomainFormInput {
    api?: DomainPropertiesAPIWrapper;
    appDomainHeaderRenderer?: HeaderRenderer;
    appPropertiesOnly?: boolean; // Flag to indicate if LKS specific properties/features should be excluded, default to false
    collapsible?: boolean;
    controlledCollapse?: boolean;
    disabledSystemFields?: string[];
    domain: DomainDesign;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    domainIndex?: number;
    fieldsAdditionalRenderer?: () => ReactNode;
    headerPrefix?: string; // used as a string to remove from the heading when using the domain.name
    headerTitle?: string;
    helpNoun?: string;
    helpTopic?: string;
    // Used in AssayDesignerPanels for distinguishing FileAttachmentForms
    index?: number;
    initCollapsed?: boolean;
    isNew?: boolean;
    // Just for testing, only affects display
    maxPhiLevel?: string;
    // Set of domains that encompass the full protocol, that may impact validation or alerts
    modelDomains?: List<DomainDesign>;
    // used to initialize newly added fields
    newFieldConfig?: Partial<IDomainField>;
    onChange: (newDomain: DomainDesign, dirty: boolean, rowIndexChange?: DomainFieldIndexChange[]) => void;
    onToggle?: (collapsed: boolean, callback?: () => any) => void;
    panelStatus?: DomainPanelStatus;
    // the queryName to use for text choice distinct value query, overrides schema/query on domain prop
    queryName?: string;
    // the schemaName to use for text choice distinct value query, overrides schema/query on domain prop
    schemaName?: string;
    // having this prop set is also an indicator that you want to show the file preview grid with the import data option
    setFileImportData?: (file: File, shouldImportData: boolean) => void;
    showHeader?: boolean;
    systemFields?: SystemField[];
    testMode?: boolean;
    todoIconHelpMsg?: string;
    validate?: boolean;
}

interface IDomainFormState {
    availableTypes: List<PropDescType>;
    bulkDeleteConfirmInfo: BulkDeleteConfirmInfo;
    collapsed: boolean;
    confirmDeleteRowIndex: number;
    dragId?: number;
    expandTransition: number;
    expandedRowIndex: number;
    // used for quicker access to field information (i.e. details display info and if a field is an ontology)
    fieldDetails: FieldDetails;
    file: File;
    filePreviewData: InferDomainResponse;
    filePreviewMsg: string;
    isLoading?: boolean;
    maxPhiLevel: string;
    reservedFieldsMsg: ReactNode;
    search: string;
    selectAll: boolean;
    summaryViewMode: boolean;
    visibleFieldsCount: number;
    visibleSelection: Set<number>;
}

/**
 * Form containing all properties of a domain
 */
export class DomainFormImpl extends React.PureComponent<IDomainFormInput, IDomainFormState> {
    refsArray: DomainRow[];
    static defaultProps = {
        api: getDefaultAPIWrapper().domain,
        helpNoun: 'field designer',
        helpTopic: FIELD_EDITOR_TOPIC,
        showHeader: true,
        initCollapsed: false,
        isNew: false,
        appPropertiesOnly: false,
        domainIndex: 0,
        domainFormDisplayOptions: DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS, // add configurations options to DomainForm through this object
        testMode: false,
    };

    constructor(props: IDomainFormInput) {
        super(props);

        this.state = {
            expandedRowIndex: undefined,
            expandTransition: EXPAND_TRANSITION,
            confirmDeleteRowIndex: undefined,
            dragId: undefined,
            maxPhiLevel: props.maxPhiLevel || PHILEVEL_NOT_PHI,
            availableTypes: getAvailableTypes(props.domain),
            collapsed: props.initCollapsed,
            fieldDetails: props.domain?.getFieldDetails(),
            filePreviewData: undefined,
            file: undefined,
            filePreviewMsg: undefined,
            selectAll: false,
            bulkDeleteConfirmInfo: undefined,
            visibleSelection: new Set(),
            visibleFieldsCount: props.domain?.fields.size,
            summaryViewMode: false,
            search: undefined,
            reservedFieldsMsg: undefined,
        };

        this.refsArray = [];
    }

    componentDidMount = async (): Promise<void> => {
        const { domain, maxPhiLevel, onChange, api } = this.props;

        this.setState({ isLoading: true });

        if (!maxPhiLevel) {
            try {
                const nextMaxPhiLevel = await api.getMaxPhiLevel(domain.container);
                this.setState({ maxPhiLevel: nextMaxPhiLevel });
            } catch (error) {
                console.error('Unable to retrieve max PHI level.', error);
            }
        }

        // if the Ontology module is available, get the updated set of available data types
        if (hasModule(ONTOLOGY_MODULE_NAME)) {
            try {
                const availableTypes = await getAvailableTypesForOntology(api, domain);
                this.setState({ availableTypes });
            } catch (error) {
                console.error('Failed to retrieve available types for Ontology.', error);
            }
        }

        onChange?.(this.validateDomain(domain), false);

        this.setState({ isLoading: false });
    };

    UNSAFE_componentWillReceiveProps(nextProps: Readonly<IDomainFormInput>): void {
        const { controlledCollapse, initCollapsed, validate, onChange } = this.props;

        // if controlled collapsible, allow the prop change to update the collapsed state
        if (controlledCollapse && nextProps.initCollapsed !== initCollapsed) {
            this.toggleLocalPanel(nextProps.initCollapsed);
        }

        if (nextProps.validate && validate !== nextProps.validate) {
            onChange?.(this.validateDomain(nextProps.domain), false);
        }
    }

    validateDomain = (domain: DomainDesign): DomainDesign => {
        const invalidFields = domain.getInvalidFields();
        let newDomain;
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

                onChange?.(newDomain, false);
            }
        );
    };

    togglePanel = (): void => {
        const { onToggle, collapsible, controlledCollapse } = this.props;

        if (collapsible || controlledCollapse) {
            if (onToggle) {
                onToggle(!this.state.collapsed, this.toggleLocalPanel);
            } else {
                this.toggleLocalPanel();
            }
        }
    };

    setExpandedState = (expandedRowIndex: number, expandTransition: number): void => {
        this.setState({ expandedRowIndex, expandTransition });
    };

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

    onFieldExpandToggle = (index: number): void => {
        const { expandedRowIndex } = this.state;

        expandedRowIndex === index ? this.collapseRow() : this.expandRow(index);
    };

    onDomainChange(updatedDomain: DomainDesign, dirty?: boolean, rowIndexChanges?: DomainFieldIndexChange[]): void {
        const { controlledCollapse, domain, domainIndex } = this.props;
        const { ontologyLookupIndices } = this.state.fieldDetails;

        // Check for cleared errors
        if (controlledCollapse && updatedDomain.hasErrors()) {
            const invalidFields = updatedDomain.getInvalidFields();
            const markedInvalid = updatedDomain.get('domainException').get('errors');

            if (markedInvalid.size > invalidFields.size) {
                updatedDomain = this.validateDomain(updatedDomain);
            }
        }

        // if this domain has any Ontology Lookup field(s), check if we need to update the related field properties
        // based on the updated domain (i.e. check for any name changes to selected fields)
        if (rowIndexChanges === undefined && ontologyLookupIndices.length > 0) {
            ontologyLookupIndices.forEach(index => {
                updatedDomain = updateOntologyFieldProperties(
                    index,
                    domainIndex,
                    updatedDomain,
                    domain,
                    rowIndexChanges
                );
            });
        }
        // and check for index shifts as a result of bulk deletes
        if (rowIndexChanges) {
            ontologyLookupIndices.forEach(index => {
                for (let i = 0; i < rowIndexChanges.length; i++) {
                    const currentIndex = rowIndexChanges[i]?.originalIndex;

                    // we skip any rowIndexChange which has a newIndex as those are just reorder changes
                    if (rowIndexChanges[i]?.newIndex !== undefined) {
                        return;
                        // skip any ontology lookup fields if they were removed
                    } else if (currentIndex === index) {
                        continue;
                    } else if (i + 1 < rowIndexChanges.length && rowIndexChanges[i + 1].originalIndex < index) {
                        continue;
                    } else if (index > currentIndex) {
                        updatedDomain = updateOntologyFieldProperties(
                            index - (i + 1),
                            domainIndex,
                            updatedDomain,
                            domain,
                            rowIndexChanges
                        );
                        return;
                    }
                }
            });
        }

        this.setState({ reservedFieldsMsg: undefined, fieldDetails: updatedDomain.getFieldDetails() });

        // Issue 49199: onChange call to be made separate from setState callback, Field Editor name input fix for jumping cursor to end of input
        this.props.onChange?.(updatedDomain, dirty !== undefined ? dirty : true, rowIndexChanges);
    }

    clearFilePreviewData = (): void => {
        this.setState(state => {
            const fieldCount = this.props.domain.fields.size;
            return {
                filePreviewData: fieldCount === 0 ? undefined : state.filePreviewData,
                file: fieldCount === 0 ? undefined : state.file,
                filePreviewMsg: undefined,
            };
        });
    };

    onDeleteConfirm(index: number): void {
        const rowIndexChange: DomainFieldIndexChange = { newIndex: undefined, originalIndex: index };
        const updatedDomain = removeFields(this.props.domain, [index]);
        const visibleFieldsCount = getVisibleFieldCount(updatedDomain);
        const visibleSelection = getVisibleSelectedFieldIndexes(updatedDomain.fields);
        const selectAll = visibleFieldsCount !== 0 && visibleSelection.size === visibleFieldsCount;

        this.onDomainChange(updatedDomain, true, [rowIndexChange]);

        this.setState(
            {
                visibleSelection,
                visibleFieldsCount,
                selectAll,
                expandedRowIndex: undefined,
                confirmDeleteRowIndex: undefined,
            },
            this.clearFilePreviewData
        );
    }

    initNewDesign = (): void => {
        const { domain } = this.props;
        const { newDesignFields } = domain;

        if (newDesignFields) {
            newDesignFields.forEach(this.applyAddField);
            this.setState({ expandedRowIndex: 0 });
        } else {
            this.applyAddField();
        }
    };

    toggleSelectAll = (): void => {
        const { domain } = this.props;
        const { selectAll, visibleSelection } = this.state;

        let newVisibleSelection = new Set([...visibleSelection]);
        const toggledFields = domain.fields.map((field, index) => {
            if (field.visible) {
                newVisibleSelection = applySetOperation(newVisibleSelection, index, !selectAll);
                return field.set('selected', !selectAll);
            }

            return field;
        });

        const updatedDomain = domain.merge({ fields: toggledFields }) as DomainDesign;
        this.onDomainChange(updatedDomain, false);
        this.setState(state => ({ selectAll: !state.selectAll, visibleSelection: newVisibleSelection }));
    };

    clearAllSelection = (): void => {
        const { domain } = this.props;
        const fields = domain.fields.map(field => field.set('selected', false));
        const updatedDomain = domain.merge({ fields }) as DomainDesign;
        this.onDomainChange(updatedDomain, false);
        this.setState({ selectAll: false, visibleSelection: new Set() });
    };

    onExportFields = (): void => {
        const { domain } = this.props;
        const { visibleSelection } = this.state;
        let filteredFields = domain.fields.filter(f => f.visible);
        // Respect selection, if any selection exists
        filteredFields =
            visibleSelection.size > 0 ? filteredFields.filter((field: DomainField) => field.selected) : filteredFields;

        const fieldData = filteredFields.map(field => DomainField.serialize(field, false)).toArray();
        const fieldsJson = JSON.stringify(fieldData, null, 4);

        downloadJsonFile(fieldsJson, generateNameWithTimestamp('Fields') + '.fields.json');
    };

    renderBulkFieldDeleteConfirm = (): ReactNode => {
        const { domain } = this.props;
        const { bulkDeleteConfirmInfo } = this.state;
        const deletableSelectedFieldsCount = bulkDeleteConfirmInfo.deletableSelectedFields.length;

        if (deletableSelectedFieldsCount === 0) {
            return (
                <ConfirmModal
                    title="Cannot Delete Required Fields"
                    onCancel={this.onConfirmBulkCancel}
                    cancelButtonText="Close"
                >
                    <div>
                        <p> None of the selected fields can be deleted. </p>
                    </div>
                </ConfirmModal>
            );
        }

        const { howManyDeleted, undeletableWarning } = generateBulkDeleteWarning(
            bulkDeleteConfirmInfo,
            bulkDeleteConfirmInfo.undeletableFields.map(i => domain.fields.get(i).name)
        );

        return (
            <ConfirmModal
                title="Confirm Delete Selected Fields"
                onConfirm={this.onBulkDeleteConfirm}
                onCancel={this.onConfirmBulkCancel}
                confirmVariant="danger"
                confirmButtonText="Yes, Delete Fields"
                cancelButtonText="Cancel"
            >
                <div>
                    <p>{howManyDeleted} will be deleted.</p>
                    <p>{undeletableWarning}</p>
                    <p>
                        Are you sure you want to delete{' '}
                        {deletableSelectedFieldsCount > 1 ? 'these fields' : 'this field'}? All of the related field
                        data will also be deleted.
                    </p>
                </div>
            </ConfirmModal>
        );
    };

    onBulkDeleteClick = (): void => {
        this.setState(state => {
            const { fields } = this.props.domain;
            const { visibleSelection } = state;

            const undeletableFields: number[] = [];
            const deletableSelectedFields: number[] = [];

            visibleSelection.forEach(val => {
                const field = fields.get(val);

                if (field.isSaved() && !isFieldDeletable(field)) {
                    undeletableFields.push(val);
                } else {
                    deletableSelectedFields.push(val);
                }
            });

            return { bulkDeleteConfirmInfo: { deletableSelectedFields, undeletableFields } };
        });
    };

    onBulkDeleteConfirm = (): void => {
        const { domain } = this.props;
        const { deletableSelectedFields } = this.state.bulkDeleteConfirmInfo;
        const updatedDomain = removeFields(domain, deletableSelectedFields);
        const visibleFieldsCount = getVisibleFieldCount(updatedDomain);
        const visibleSelection = getVisibleSelectedFieldIndexes(updatedDomain.fields);
        const rowIndexChanges = deletableSelectedFields.map<DomainFieldIndexChange>(i => ({
            newIndex: undefined,
            originalIndex: i,
        }));

        this.onDomainChange(updatedDomain, true, rowIndexChanges);
        this.setState(
            {
                visibleSelection,
                visibleFieldsCount,
                expandedRowIndex: undefined,
                selectAll: visibleFieldsCount !== 0 && visibleSelection.size === visibleFieldsCount,
                bulkDeleteConfirmInfo: undefined,
            },
            this.clearFilePreviewData
        );
    };

    onAddField = (): void => {
        this.applyAddField();
    };

    onFileRemoval = (): void => {
        this.setState({ filePreviewMsg: undefined });
    };

    applyAddField = (config?: Partial<IDomainField>): void => {
        const { newFieldConfig } = this.props;
        const newConfig = config ? { ...config } : newFieldConfig;
        const newDomain = addDomainField(this.props.domain, newConfig);
        this.onDomainChange(newDomain, true);
        this.setState({ selectAll: false, visibleFieldsCount: getVisibleFieldCount(newDomain) }, this.collapseRow);
    };

    onSystemFieldEnable = (field: string, enable: boolean): void => {
        const { domain } = this.props;
        this.onDomainChange(handleSystemFieldUpdates(domain, field, enable));
    };

    onFieldsChange = (changes: List<IFieldChange>, index: number, expand: boolean): void => {
        const { domain } = this.props;
        const firstChange = changes.get(0);
        const rowSelectedChange = getNameFromId(firstChange?.id) === 'selected';

        this.onDomainChange(handleDomainUpdates(domain, changes), !rowSelectedChange);

        if (rowSelectedChange) {
            this.setState(
                state => {
                    const { visibleFieldsCount } = state;
                    const visibleSelection = applySetOperation(state.visibleSelection, index, firstChange.value);
                    return {
                        visibleSelection,
                        selectAll: visibleFieldsCount !== 0 && visibleSelection.size === visibleFieldsCount,
                    };
                },
                () => {
                    if (expand) {
                        this.expandRow(index);
                    }
                }
            );
        } else if (expand) {
            this.expandRow(index);
        }
    };

    onDeleteField = (index: number): void => {
        const { domain } = this.props;
        const field = domain.fields.get(index);

        if (field) {
            // only show the confirm dialog for saved fields
            if (field.isSaved()) {
                this.setState({ confirmDeleteRowIndex: index });
            } else {
                this.onDeleteConfirm(index);
            }
        }
    };

    onConfirmCancel = (): void => {
        this.setState({ confirmDeleteRowIndex: undefined });
    };

    onConfirmBulkCancel = (): void => {
        this.setState({ bulkDeleteConfirmInfo: undefined });
    };

    onBeforeDragStart = (initial): void => {
        const { domain } = this.props;
        const id = initial.draggableId;
        const idIndex = id ? getIndexFromId(id) : undefined;

        this.setState({ dragId: idIndex });

        this.onDomainChange(domain, false);

        // remove focus for any current element so that it doesn't "jump" after drag end
        blurActiveElement();
    };

    onDragEnd = (result): void => {
        const { domain } = this.props;

        let destIndex = result.source.index; // default behavior go back to original spot if out of bounds
        const srcIndex = result.source.index;
        const id = result.draggableId;
        const idIndex = id ? getIndexFromId(id) : undefined;

        this.setState({ dragId: undefined });

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

        let domainExceptionWithMovedErrors;
        if (domain.hasException()) {
            // set existing error row indexes with new row indexes
            const fieldsWithMovedErrorsUpdated = fieldsWithNewIndexesOnErrors
                .map(error =>
                    error.merge({
                        rowIndexes: error.newRowIndexes ? error.newRowIndexes : error.rowIndexes,
                        newRowIndexes: undefined, // reset newRowIndexes
                    })
                )
                .toList();

            domainExceptionWithMovedErrors = domain.domainException.set('errors', fieldsWithMovedErrorsUpdated);
        }

        const newDomain = domain.merge({
            fields: newFields.asImmutable(),
            domainException: domainExceptionWithMovedErrors,
        }) as DomainDesign;

        if (movedField.selected) {
            this.setState(state => {
                const oldVisibleSelection = applySetOperation(state.visibleSelection, srcIndex, false);
                return {
                    visibleSelection: applySetOperation(oldVisibleSelection, destIndex, true),
                };
            });
        }

        this.onDomainChange(newDomain, true, [{ originalIndex: srcIndex, newIndex: destIndex }]);

        this.fastExpand(expanded);
    };

    setNewIndexOnError = (
        oldIndex: number,
        newIndex: number,
        fieldErrors: List<DomainFieldError>
    ): List<DomainFieldError> => {
        return fieldErrors
            .map(fieldError => {
                let newRowIndexes: List<number>;
                if (fieldError.newRowIndexes === undefined) {
                    newRowIndexes = List<number>();
                } else {
                    newRowIndexes = fieldError.get('newRowIndexes');
                }

                fieldError.rowIndexes.forEach(val => {
                    if (val === oldIndex) {
                        newRowIndexes = newRowIndexes.push(newIndex);
                    }
                });

                return fieldError.set('newRowIndexes', newRowIndexes) as DomainFieldError;
            })
            .toList();
    };

    renderAddFieldOption(): ReactNode {
        const { domain, domainFormDisplayOptions } = this.props;
        const hasFields = domain.fields.size > 0;

        if (!domainFormDisplayOptions?.hideAddFieldsButton) {
            if (!hasFields && (this.shouldShowInferFromFile() || this.shouldShowImportExport())) {
                return (
                    <div className="margin-top domain-form-manual-section">
                        <p>Or</p>
                        <ActionButton buttonClass="domain-form-manual-btn" onClick={this.initNewDesign}>
                            Manually Define Fields
                        </ActionButton>
                    </div>
                );
            }

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

        return null;
    }

    getFieldError(domain: DomainDesign, index: number): DomainFieldError {
        if (domain.hasException()) {
            const fieldErrors = domain.domainException.errors;

            if (!fieldErrors.isEmpty()) {
                const errorsWithIndex = fieldErrors.filter(error => {
                    return error.rowIndexes.findIndex(idx => idx === index) >= 0;
                });
                return errorsWithIndex.get(0);
            }
        }

        return undefined;
    }

    renderFieldRemoveConfirm(): ReactNode {
        const { confirmDeleteRowIndex } = this.state;
        const field = this.props.domain.fields.get(confirmDeleteRowIndex);
        const fieldName = field && field.name && field.name.trim().length > 0 ? <b>{field.name}</b> : 'this field';
        return (
            <ConfirmModal
                title="Confirm Remove Field"
                onConfirm={() => this.onDeleteConfirm(confirmDeleteRowIndex)}
                onCancel={this.onConfirmCancel}
                confirmVariant="danger"
                confirmButtonText="Yes, Remove Field"
                cancelButtonText="Cancel"
            >
                <div>Are you sure you want to remove {fieldName}? All of its data will be deleted as well.</div>
            </ConfirmModal>
        );
    }

    shouldShowInferFromFile(): boolean {
        const { domain, domainFormDisplayOptions } = this.props;
        return !domainFormDisplayOptions?.hideInferFromFile && domain.fields.size === 0;
    }

    shouldShowImportExport(): boolean {
        return !this.props.domainFormDisplayOptions?.hideImportExport;
    }

    handleFilePreviewLoad = (response: InferDomainResponse, file: File): void => {
        const { domain, setFileImportData, domainFormDisplayOptions } = this.props;
        const retainReservedFields = domainFormDisplayOptions?.retainReservedFields;

        let fields = List<QueryColumn>();
        let reservedFields = response?.reservedFields || List<QueryColumn>();
        if (retainReservedFields) {
            fields = fields.merge(reservedFields);
        }
        if (response?.fields?.size) {
            response.fields.forEach(field => {
                if (domain.reservedFieldNames?.indexOf(field.name.toLowerCase()) < 0) {
                    fields = fields.push(field);
                } else {
                    reservedFields = reservedFields.push(field);
                }
            });
        }

        if (fields.size === 0) {
            this.setState({
                filePreviewMsg:
                    'The selected file contains only fields that will be created by default. Please remove the file and try uploading a new one.',
            });
        } else {
            // if the DomainForm usage wants to show the file preview and import data options, then set these state values
            if (setFileImportData) {
                this.setState({ filePreviewData: response, file, filePreviewMsg: undefined });
                setFileImportData(file, true);
            }

            this.onDomainChange(setDomainFields(domain, fields));
        }
        if (reservedFields.size && !retainReservedFields) {
            this.setState({
                reservedFieldsMsg:
                    'Fields with reserved names or prefixes found in your file are not shown below. ' +
                    'These fields are already used by LabKey' +
                    (domainFormDisplayOptions?.domainKindDisplayName
                        ? ' to support this ' + domainFormDisplayOptions.domainKindDisplayName
                        : '') +
                    ': ' +
                    reservedFields.map(field => field.name).join(', ') +
                    '.',
            });
        }
    };

    importFieldsFromJson = (file: File): Promise<SimpleResponse> => {
        const { domain, onChange } = this.props;

        return new Promise((resolve, reject) => {
            let content = '';
            const reader = new FileReader();

            // Waits until file is loaded
            reader.onloadend = async (e: any) => {
                // Catches malformed JSON
                try {
                    content = e.target.result;
                    const response = processJsonImport(content, domain);

                    if (!response.success) {
                        return resolve(response);
                    } else {
                        const tsFields = response.fields;
                        const mergedFields = await mergeDomainFields(domain, tsFields);
                        onChange?.(mergedFields, true);
                        resolve({ success: true });
                    }
                } catch (e) {
                    reject({ success: false, msg: e.toString() });
                }
            };

            reader.onerror = function (error: any) {
                reject({ success: false, msg: error.toString() });
            };

            reader.readAsText(file);
        });
    };

    renderEmptyDomain(): ReactNode {
        const { domain, index } = this.props;
        const shouldShowInferFromFile = this.shouldShowInferFromFile();
        const shouldShowImportExport = this.shouldShowImportExport();

        if (shouldShowInferFromFile || shouldShowImportExport) {
            let acceptedFormats = [];
            if (shouldShowInferFromFile) {
                acceptedFormats = acceptedFormats.concat(['.csv', '.tsv', '.txt', '.xls', '.xlsx']);
            }
            if (shouldShowImportExport) {
                acceptedFormats = acceptedFormats.concat(['.json']);
            }

            let label;
            if (shouldShowImportExport && shouldShowInferFromFile) {
                label = 'Import or infer fields from file';
            } else if (shouldShowImportExport) {
                label = 'Import fields from file';
            } else {
                label = 'Infer fields from file';
            }

            return (
                <>
                    <FileAttachmentForm
                        acceptedFormats={acceptedFormats.join(', ')}
                        showAcceptedFormats
                        allowDirectories={false}
                        allowMultiple={false}
                        label={label}
                        index={index}
                        onFileRemoval={this.onFileRemoval}
                        previewGridProps={
                            shouldShowInferFromFile && {
                                previewCount: 3,
                                skipPreviewGrid: true,
                                onPreviewLoad: this.handleFilePreviewLoad,
                                domainKindName: domain.domainKindName,
                            }
                        }
                        fileSpecificCallback={Map({ '.json': this.importFieldsFromJson })}
                    />
                    {shouldShowInferFromFile && this.state.filePreviewMsg && (
                        <Alert bsStyle="info">{this.state.filePreviewMsg}</Alert>
                    )}
                </>
            );
        }

        return (
            <Panel className="domain-form-no-field-panel">
                No fields created yet. Click the 'Add Field' button to get started.
            </Panel>
        );
    }

    onToggleSummaryView = (): void => {
        this.setState(state => ({ summaryViewMode: !state.summaryViewMode }));
    };

    onSearch = (evt): void => {
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

    updateFilteredFields = (value?: string): void => {
        const { domain } = this.props;
        const filteredDomain = this.getFilteredFields(domain, value);
        const visibleFieldsCount = getVisibleFieldCount(filteredDomain);
        const visibleSelection = getVisibleSelectedFieldIndexes(filteredDomain.fields);

        this.setState(
            {
                visibleSelection,
                visibleFieldsCount,
                search: value,
                selectAll: visibleFieldsCount !== 0 && visibleSelection.size === visibleFieldsCount,
            },
            () => {
                this.onDomainChange(filteredDomain, false);
            }
        );
    };

    isPanelExpanded = (): boolean => {
        const { collapsible, controlledCollapse } = this.props;
        const { collapsed } = this.state;

        if (!collapsible && !controlledCollapse) return true;

        return !collapsed;
    };

    getDomainFields = (): List<DomainField> => {
        return this.props.domain.fields;
    };

    scrollFunction = (i: number): void => {
        this.setState({ summaryViewMode: false, expandedRowIndex: i }, () => {
            this.refsArray[i].scrollIntoView();
        });
    };

    renderDetailedFieldView = (): ReactNode => {
        const { domain, helpNoun, appPropertiesOnly, domainIndex, domainFormDisplayOptions, schemaName, queryName } =
            this.props;
        const {
            expandedRowIndex,
            expandTransition,
            fieldDetails,
            maxPhiLevel,
            dragId,
            availableTypes,
            reservedFieldsMsg,
            search,
            selectAll,
            visibleFieldsCount,
            visibleSelection,
        } = this.state;
        const fieldPlural = visibleSelection.size !== 1 ? 'fields' : 'field';
        const clearText =
            visibleFieldsCount !== 0 && visibleSelection.size === visibleFieldsCount ? 'Clear All' : 'Clear';

        return (
            <DragDropContext onDragEnd={this.onDragEnd} onBeforeDragStart={this.onBeforeDragStart}>
                <div className="domain-field-row domain-row-border-default domain-floating-hdr">
                    <Alert bsStyle="info">{reservedFieldsMsg}</Alert>
                    <Row>
                        <div className="domain-field-header">
                            {visibleSelection.size} {fieldPlural} selected
                            <Button
                                className="domain-panel-header-clear-all"
                                disabled={visibleSelection.size === 0}
                                onClick={this.clearAllSelection}
                            >
                                {clearText}
                            </Button>
                        </div>
                    </Row>
                    <Row className="domain-row-container">
                        <div className="domain-row-handle" />
                        <div className="domain-row-action-section">
                            <Checkbox
                                className="domain-field-check-icon"
                                name="domain-select-all-checkbox"
                                id="domain-select-all-checkbox"
                                checked={selectAll}
                                onChange={this.toggleSelectAll}
                            />
                        </div>
                        <div>
                            <Col xs={6} className="domain-row-base-fields">
                                <Col xs={6}>
                                    <b>Name *</b>
                                </Col>
                                <Col xs={4}>
                                    <b>Data Type *</b>
                                </Col>
                                <Col xs={2}>{!domainFormDisplayOptions?.hideRequired && <b>Required</b>}</Col>
                            </Col>
                            <Col xs={6}>
                                <b>Details</b>
                            </Col>
                        </div>
                    </Row>
                </div>
                <Droppable droppableId="domain-form-droppable">
                    {provided => (
                        <div ref={provided.innerRef} {...provided.droppableProps}>
                            <Form className="domain-form">
                                {domain.fields.map((field, i) => {
                                    // Need to preserve index so don't filter, instead just use empty div
                                    if (!field.visible) return <div key={'domain-row-key-' + i} />;

                                    return (
                                        <DomainRow
                                            ref={ref => {
                                                this.refsArray[i] = ref;
                                            }}
                                            domainId={domain.domainId}
                                            helpNoun={helpNoun}
                                            key={'domain-row-key-' + i}
                                            field={field}
                                            fieldError={this.getFieldError(domain, i)}
                                            getDomainFields={this.getDomainFields}
                                            fieldDetailsInfo={fieldDetails.detailsInfo}
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
                                            allowUniqueConstraintProperties={domain.allowUniqueConstraintProperties}
                                            showDefaultValueSettings={domain.showDefaultValueSettings}
                                            defaultDefaultValueType={domain.defaultDefaultValueType}
                                            defaultValueOptions={domain.defaultValueOptions}
                                            appPropertiesOnly={appPropertiesOnly}
                                            isDragDisabled={
                                                !valueIsEmpty(search) || domainFormDisplayOptions.isDragDisabled
                                            }
                                            domainFormDisplayOptions={domainFormDisplayOptions}
                                            domainContainerPath={domain.container}
                                            schemaName={schemaName ?? domain.schemaName}
                                            queryName={queryName ?? domain.queryName}
                                        />
                                    );
                                })}
                                {provided.placeholder}
                            </Form>
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        );
    };

    render(): ReactNode {
        const {
            appDomainHeaderRenderer,
            appPropertiesOnly,
            children,
            domain,
            domainIndex,
            collapsible,
            controlledCollapse,
            domainFormDisplayOptions,
            fieldsAdditionalRenderer,
            headerTitle,
            headerPrefix,
            helpNoun,
            helpTopic,
            modelDomains,
            panelStatus,
            setFileImportData,
            showHeader,
            systemFields,
            testMode,
            todoIconHelpMsg,
        } = this.props;
        const {
            bulkDeleteConfirmInfo,
            collapsed,
            confirmDeleteRowIndex,
            filePreviewData,
            file,
            isLoading,
            search,
            selectAll,
            summaryViewMode,
            visibleSelection,
        } = this.state;
        const { fields } = domain;
        const headerDetails =
            fields.size > 0 ? '' + fields.size + ' Field' + (fields.size > 1 ? 's' : '') + ' Defined' : undefined;
        const hasFields = fields.size > 0;
        const styleToolbar =
            !hasFields && !systemFields && (this.shouldShowInferFromFile() || this.shouldShowImportExport());
        const disableExport = !hasFields || fields.filter(f => f.visible).size < 1;
        const hasException = domain.hasException();
        const isApp_ = isApp();

        return (
            <>
                {confirmDeleteRowIndex !== undefined && this.renderFieldRemoveConfirm()}
                {bulkDeleteConfirmInfo && this.renderBulkFieldDeleteConfirm()}
                <Panel
                    className={getDomainPanelClass(collapsed, controlledCollapse, isApp_)}
                    expanded={this.isPanelExpanded()}
                    onToggle={function () {}}
                >
                    {showHeader && (
                        <CollapsiblePanelHeader
                            id={getDomainPanelHeaderId(domain)}
                            title={getDomainHeaderName(domain.name, headerTitle, headerPrefix)}
                            collapsed={!(this.isPanelExpanded() && controlledCollapse)}
                            collapsible={collapsible}
                            controlledCollapse={controlledCollapse}
                            headerDetails={headerDetails}
                            todoIconHelpMsg={todoIconHelpMsg}
                            panelStatus={panelStatus}
                            togglePanel={this.togglePanel}
                            isValid={!hasException}
                            iconHelpMsg={hasException ? domain.domainException.exception : undefined}
                        >
                            {children}
                        </CollapsiblePanelHeader>
                    )}
                    <Panel.Body
                        className={classNames({ 'domain-field-top-noBuffer': !styleToolbar })}
                        collapsible={collapsible || controlledCollapse}
                    >
                        {isLoading && <LoadingSpinner />}

                        {!isLoading && (
                            <>
                                {systemFields && (
                                    <SystemFields
                                        fields={systemFields}
                                        disabledSystemFields={domain.disabledSystemFields}
                                        onSystemFieldEnable={this.onSystemFieldEnable}
                                    />
                                )}

                                {(hasFields || !(this.shouldShowInferFromFile() || this.shouldShowImportExport())) && (
                                    <Row className="domain-field-toolbar">
                                        <Col xs={4}>
                                            {!domainFormDisplayOptions?.hideAddFieldsButton && (
                                                <AddEntityButton
                                                    entity="Field"
                                                    containerClass="container--toolbar-button"
                                                    buttonClass="domain-toolbar-add-btn"
                                                    onClick={this.onAddField}
                                                />
                                            )}
                                            <ActionButton
                                                containerClass="container--toolbar-button"
                                                buttonClass="domain-toolbar-delete-btn"
                                                onClick={this.onBulkDeleteClick}
                                                disabled={visibleSelection.size === 0}
                                            >
                                                <i className="fa fa-trash domain-toolbar-export-btn-icon" /> Delete
                                            </ActionButton>

                                            {this.shouldShowImportExport() && (
                                                <ActionButton
                                                    containerClass="container--toolbar-button"
                                                    buttonClass="domain-toolbar-export-btn"
                                                    onClick={this.onExportFields}
                                                    disabled={disableExport}
                                                >
                                                    <i className="fa fa-download domain-toolbar-export-btn-icon" />{' '}
                                                    Export
                                                </ActionButton>
                                            )}
                                        </Col>
                                        <Col xs={8}>
                                            <div className="pull-right domain-field-toolbar-right-aligned">
                                                {!valueIsEmpty(search) && (
                                                    <span className="domain-search-text">
                                                        Showing {fields.filter(f => f.visible).size} of {fields.size}{' '}
                                                        field {fields.size > 1 ? 's' : ''}.
                                                    </span>
                                                )}
                                                <FormControl
                                                    id={'domain-search-name-' + domainIndex}
                                                    className="domain-search-input"
                                                    type="text"
                                                    placeholder="Search Fields"
                                                    onChange={this.onSearch}
                                                />

                                                {!testMode && (
                                                    <div className="domain-toolbar-toggle-summary">
                                                        <span>Mode: </span>
                                                        <ToggleButtons
                                                            className=""
                                                            first="Summary"
                                                            second="Detail"
                                                            active={summaryViewMode ? 'Summary' : 'Detail'}
                                                            onClick={this.onToggleSummaryView}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </Col>
                                    </Row>
                                )}

                                <Row className={helpTopic ? 'domain-form-hdr-margins' : ''}>
                                    <Col xs={helpTopic ? 9 : 12} />
                                    {helpTopic && (
                                        <Col xs={3}>
                                            <HelpLink topic={helpTopic} className="domain-field-float-right">
                                                Learn more about this tool
                                            </HelpLink>
                                        </Col>
                                    )}
                                </Row>

                                {!summaryViewMode &&
                                    appDomainHeaderRenderer &&
                                    appDomainHeaderRenderer({
                                        domain,
                                        domainIndex,
                                        modelDomains,
                                        onChange: this.onFieldsChange,
                                        onAddField: this.applyAddField,
                                    })}

                                {hasFields && summaryViewMode && (
                                    <div className="domain-form__summary-mode">
                                        <DomainPropertiesGrid
                                            domain={domain}
                                            search={search}
                                            selectAll={selectAll}
                                            actions={{
                                                toggleSelectAll: this.toggleSelectAll,
                                                scrollFunction: this.scrollFunction,
                                                onFieldsChange: this.onFieldsChange,
                                            }}
                                            appPropertiesOnly={appPropertiesOnly}
                                            hasOntologyModule={hasModule(ONTOLOGY_MODULE_NAME)}
                                        />
                                    </div>
                                )}

                                {hasFields && !summaryViewMode && this.renderDetailedFieldView()}

                                {!hasFields && this.renderEmptyDomain()}

                                {this.renderAddFieldOption()}
                            </>
                        )}

                        {fieldsAdditionalRenderer?.()}

                        {filePreviewData && !domainFormDisplayOptions?.hideImportData && (
                            <ImportDataFilePreview
                                noun={helpNoun}
                                filePreviewData={filePreviewData}
                                setFileImportData={setFileImportData}
                                file={file}
                            />
                        )}
                    </Panel.Body>
                </Panel>
                {hasException && domain.domainException.severity === SEVERITY_LEVEL_ERROR && (
                    <div
                        onClick={this.togglePanel}
                        className={getDomainAlertClasses(collapsed, controlledCollapse, isApp_)}
                    >
                        <Alert bsStyle="danger">{domain.domainException.exception}</Alert>
                    </div>
                )}
            </>
        );
    }
}

const DomainForm: FC<IDomainFormInput> = memo(props => (
    <LookupProvider>
        <DomainFormImpl {...props} />
    </LookupProvider>
));

DomainForm.displayName = 'DomainForm';

export default DomainForm;
