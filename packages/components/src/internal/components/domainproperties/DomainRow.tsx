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
import { Button, Checkbox, Col, Collapse, FormControl, OverlayTrigger, Popover, Row } from 'react-bootstrap';
import { List } from 'immutable';
import { Draggable } from 'react-beautiful-dnd';

import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { DeleteIcon, DragDropHandle, FieldExpansionToggle, SCHEMAS } from '../../..';

import {
    ALL_SAMPLES_DISPLAY_TEXT,
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    DOMAIN_FIELD_ADV,
    DOMAIN_FIELD_CLIENT_SIDE_ERROR,
    DOMAIN_FIELD_DELETE,
    DOMAIN_FIELD_DETAILS,
    DOMAIN_FIELD_EXPAND,
    DOMAIN_FIELD_FULLY_LOCKED,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_ROW,
    DOMAIN_FIELD_TYPE,
    FIELD_NAME_CHAR_WARNING_INFO,
    FIELD_NAME_CHAR_WARNING_MSG,
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
} from './constants';
import {
    DomainField,
    DomainFieldError,
    IDomainFormDisplayOptions,
    IFieldChange,
    resolveAvailableTypes,
} from './models';
import { PropDescType } from './PropDescType';
import { createFormInputId, createFormInputName, getCheckedValue } from './actions';
import { isFieldFullyLocked, isFieldPartiallyLocked, isLegalName, isPrimaryKeyFieldLocked } from './propertiesUtil';
import { DomainRowExpandedOptions } from './DomainRowExpandedOptions';
import { AdvancedSettings } from './AdvancedSettings';

interface IDomainRowProps {
    domainId?: number;
    helpNoun: string;
    expanded: boolean;
    dragging: boolean;
    expandTransition: number;
    field: DomainField;
    index: number;
    maxPhiLevel: string;
    availableTypes: List<PropDescType>;
    onChange: (changes: List<IFieldChange>, index?: number, expand?: boolean) => any;
    fieldError?: DomainFieldError;
    onDelete: (any) => void;
    onExpand: (index?: number) => void;
    showDefaultValueSettings: boolean;
    defaultDefaultValueType: string;
    defaultValueOptions: List<string>;
    appPropertiesOnly?: boolean;
    showFilePropertyType?: boolean;
    domainIndex: number;
    successBsStyle?: string;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    getDomainFields?: () => List<DomainField>;
    fieldDetailsInfo?: {[key: string]: string}
}

interface IDomainRowState {
    showAdv: boolean;
    closing: boolean;
    showingModal: boolean;
    isDragDisabled: boolean;
}

/**
 * React component for one property in a domain
 */
export class DomainRow extends React.PureComponent<IDomainRowProps, IDomainRowState> {
    static defaultProps = {
        domainFormDisplayOptions: DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    };

    constructor(props) {
        super(props);

        this.state = {
            showAdv: false,
            closing: false,
            showingModal: false,
            isDragDisabled: props.domainFormDisplayOptions.isDragDisabled,
        };
    }

    UNSAFE_componentWillReceiveProps(nextProps: Readonly<IDomainRowProps>, nextContext: any): void {
        // if there was a prop change to isDragDisabled, need to call setDragDisabled
        if (nextProps.domainFormDisplayOptions.isDragDisabled !== this.props.domainFormDisplayOptions.isDragDisabled) {
            this.setDragDisabled(nextProps.domainFormDisplayOptions.isDragDisabled, false);
        }
    }

    /**
     *  Details section of property row
     */
    getDetailsText = (): React.ReactNode => {
        const { field, index, fieldError, fieldDetailsInfo } = this.props;
        const details = [];
        let period = '';

        if (field.isNew()) {
            details.push('New Field');
            period = '. ';
        } else if (field.updatedField) {
            details.push('Updated');
            period = '. ';
        }

        if (field.dataType.isSample()) {
            const detailsText =
                field.lookupSchema === SCHEMAS.EXP_TABLES.MATERIALS.schemaName &&
                SCHEMAS.EXP_TABLES.MATERIALS.queryName.localeCompare(field.lookupQuery, 'en', {
                    sensitivity: 'accent',
                }) === 0
                    ? ALL_SAMPLES_DISPLAY_TEXT
                    : field.lookupQuery;
            details.push(period + detailsText);
            period = '. ';
        } else if (field.dataType.isLookup() && field.lookupSchema && field.lookupQuery) {
            details.push(
                period + [field.lookupContainer || 'Current Folder', field.lookupSchema, field.lookupQuery].join(' > ')
            );
            period = '. ';
        } else if (field.dataType.isOntologyLookup() && field.sourceOntology) {
            details.push(period + field.sourceOntology);
            period = '. ';
        }

        if (field.wrappedColumnName) {
            details.push(period + 'Wrapped column - ' + field.wrappedColumnName);
            period = '. ';
        }

        if (field.isPrimaryKey) {
            details.push(period + 'Primary Key');
            period = '. ';
        }

        if (field.lockType == DOMAIN_FIELD_FULLY_LOCKED) {
            details.push(period + 'Locked');
            period = '. ';
        }

        if (!field.hasInvalidName() && fieldDetailsInfo?.hasOwnProperty(field.name)) {
            details.push(period + fieldDetailsInfo[field.name]);
            period = '. ';
        }

        if (fieldError) {
            details.push(period);
            const msg = fieldError.severity + ': ' + fieldError.message;
            details.push(
                <>
                    <b key={field.name + '_' + index}>{msg}</b>&nbsp;
                    {fieldError.extraInfo && (
                        <OverlayTrigger
                            placement="bottom"
                            overlay={
                                <Popover bsClass="popover" id="domain-row-field-error-popover">
                                    {fieldError.extraInfo}
                                </Popover>
                            }
                        >
                            <FontAwesomeIcon icon={faExclamationCircle} className="domain-warning-icon" />
                        </OverlayTrigger>
                    )}
                </>
            );
        }

        return details;
    };

    getDetails() {
        const { index, expanded, domainIndex } = this.props;
        const { closing } = this.state;

        return (
            <div
                id={createFormInputId(DOMAIN_FIELD_DETAILS, domainIndex, index)}
                className={expanded || closing ? 'domain-field-details-expanded' : 'domain-field-details'}
            >
                {this.getDetailsText()}
            </div>
        );
    }

    getFieldErrorClass = (fieldError: DomainFieldError): string => {
        if (!fieldError) {
            return 'domain-row-border-default';
        } else if (fieldError.severity === SEVERITY_LEVEL_ERROR) {
            return 'domain-row-border-error';
        } else {
            return 'domain-row-border-warning';
        }
    };

    getRowCssClasses = (
        expanded: boolean,
        closing: boolean,
        dragging: boolean,
        fieldError: DomainFieldError
    ): string => {
        const classes = List<string>().asMutable();

        classes.push('domain-field-row');

        if (!dragging) {
            classes.push(this.getFieldErrorClass(fieldError));
        } else {
            classes.push('domain-row-border-dragging');
        }

        if (closing || expanded) {
            classes.push('domain-row-expanded');
        }

        return classes.join(' ');
    };

    onFieldChange = (evt: any, expand?: boolean) => {
        const { index } = this.props;

        let value = getCheckedValue(evt);
        if (value === undefined) {
            value = evt.target.value;
        }

        this.onSingleFieldChange(evt.target.id, value, index, expand);
    };

    onSingleFieldChange = (id: string, value: any, index?: number, expand?: boolean): void => {
        const { onChange } = this.props;

        if (onChange) {
            onChange(List([{ id, value } as IFieldChange]), index, expand === true);
        }
    };

    onMultiFieldChange = (changes: List<IFieldChange>): void => {
        const { onChange, index } = this.props;

        if (onChange) {
            onChange(changes, index, true);
        }
    };

    onNameChange = evt => {
        const { index, onChange, domainIndex } = this.props;

        const value = evt.target.value;
        const nameAndErrorList = List<IFieldChange>().asMutable();

        // set value for the field
        nameAndErrorList.push({ id: createFormInputId(DOMAIN_FIELD_NAME, domainIndex, index), value });

        if (isLegalName(value) && !value.includes(' ')) {
            // set value to undefined for field error
            nameAndErrorList.push({
                id: createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, domainIndex, index),
                value: undefined,
            });
        } else {
            const fieldName = value;
            const severity = SEVERITY_LEVEL_WARN;
            const indexes = List<number>([index]);
            const domainFieldError = new DomainFieldError({
                message: FIELD_NAME_CHAR_WARNING_MSG,
                extraInfo: FIELD_NAME_CHAR_WARNING_INFO,
                fieldName,
                propertyId: undefined,
                severity,
                rowIndexes: indexes,
            });

            // set value for field error
            nameAndErrorList.push({
                id: createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, domainIndex, index),
                value: domainFieldError,
            });
        }

        if (onChange) {
            onChange(nameAndErrorList, index, false);
        }
    };

    onDataTypeChange = (evt: any): any => {
        this.onFieldChange(evt, PropDescType.isLookup(evt.target.value));
    };

    onShowAdvanced = (): any => {
        this.setState(() => ({ showAdv: true }));

        this.setDragDisabled(this.props.domainFormDisplayOptions.isDragDisabled, true);
    };

    onHideAdvanced = (): any => {
        this.setState(() => ({ showAdv: false }));

        this.setDragDisabled(this.props.domainFormDisplayOptions.isDragDisabled, false);
    };

    onDelete = (): any => {
        const { index, onDelete } = this.props;

        if (onDelete) {
            onDelete(index);
        }
    };

    onExpand = (): any => {
        const { index, onExpand } = this.props;

        if (onExpand) {
            onExpand(index);
        }
    };

    onCollapsed = (): void => {
        this.setState(() => ({ closing: false }));
    };

    onCollapsing = (): void => {
        this.setState(() => ({ closing: true }));
    };

    setDragDisabled = (propDragDisabled: boolean, disabled: boolean) => {
        this.setState(() => ({ isDragDisabled: disabled || propDragDisabled }));
    };

    showingModal = (showing: boolean) => {
        this.setState(() => ({ showingModal: showing }));
    };

    disableNameInput(field: DomainField): boolean {
        const lockNameForPK = !field.isNew() && isPrimaryKeyFieldLocked(field.lockType);

        return (
            isFieldPartiallyLocked(field.lockType) ||
            isFieldFullyLocked(field.lockType) ||
            lockNameForPK ||
            field.lockExistingField // existingField defaults to false. used for query metadata editor
        );
    }

    renderBaseFields() {
        const {
            index,
            field,
            availableTypes,
            appPropertiesOnly,
            showFilePropertyType,
            domainIndex,
            domainFormDisplayOptions,
        } = this.props;

        return (
            <div id={createFormInputId(DOMAIN_FIELD_ROW, domainIndex, index)}>
                <Col xs={6}>
                    <FormControl
                        // autoFocus={field.isNew()}  // TODO: This is not working great with drag and drop, need to investigate
                        type="text"
                        value={field.name || ''}
                        name={createFormInputName(DOMAIN_FIELD_NAME)}
                        id={createFormInputId(DOMAIN_FIELD_NAME, domainIndex, index)}
                        onChange={this.onNameChange}
                        disabled={this.disableNameInput(field)}
                    />
                </Col>
                <Col xs={4}>
                    <FormControl
                        componentClass="select"
                        name={createFormInputName(DOMAIN_FIELD_TYPE)}
                        disabled={
                            (!field.isNew() && field.primaryKey) ||
                            isFieldPartiallyLocked(field.lockType) ||
                            isFieldFullyLocked(field.lockType) ||
                            isPrimaryKeyFieldLocked(field.lockType)
                        }
                        id={createFormInputId(DOMAIN_FIELD_TYPE, domainIndex, index)}
                        onChange={this.onDataTypeChange}
                        value={field.dataType.name}
                    >
                        {isPrimaryKeyFieldLocked(field.lockType) ? (
                            <option value={field.dataType.name}>{field.dataType.display}</option>
                        ) : (
                            resolveAvailableTypes(field, availableTypes, appPropertiesOnly, showFilePropertyType).map(
                                (type, i) => (
                                    <option key={i} value={type.name}>
                                        {type.display}
                                    </option>
                                )
                            )
                        )}
                    </FormControl>
                </Col>
                <Col xs={2}>
                    <div className="domain-field-checkbox-container">
                        {!domainFormDisplayOptions.hideRequired && (
                            <Checkbox
                                className="domain-field-checkbox"
                                name={createFormInputName(DOMAIN_FIELD_REQUIRED)}
                                id={createFormInputId(DOMAIN_FIELD_REQUIRED, domainIndex, index)}
                                checked={field.required}
                                onChange={this.onFieldChange}
                                disabled={isFieldFullyLocked(field.lockType) || isPrimaryKeyFieldLocked(field.lockType)}
                            />
                        )}
                    </div>
                </Col>
            </div>
        );
    }

    showDeleteIcon(field: DomainField): boolean {
        return (
            !isFieldFullyLocked(field.lockType) &&
            !isFieldPartiallyLocked(field.lockType) &&
            !isPrimaryKeyFieldLocked(field.lockType) &&
            !field.lockExistingField // existingField defaults to false. used for query metadata editor
        );
    }

    renderButtons() {
        const { expanded, index, field, appPropertiesOnly, domainIndex, domainFormDisplayOptions } = this.props;
        const { closing } = this.state;

        return (
            <div className={expanded ? 'domain-field-buttons-expanded' : 'domain-field-buttons'}>
                {(expanded || closing) && !isFieldFullyLocked(field.lockType) && !appPropertiesOnly && (
                    <Button
                        disabled={isFieldFullyLocked(field.lockType)}
                        name={createFormInputName(DOMAIN_FIELD_ADV)}
                        id={createFormInputId(DOMAIN_FIELD_ADV, domainIndex, index)}
                        onClick={this.onShowAdvanced}
                        className="domain-row-button"
                    >
                        Advanced Settings
                    </Button>
                )}
                {this.showDeleteIcon(field) && (
                    <DeleteIcon
                        id={createFormInputId(DOMAIN_FIELD_DELETE, domainIndex, index)}
                        title="Remove field"
                        iconCls="domain-field-delete-icon"
                        onDelete={this.onDelete}
                    />
                )}
                <FieldExpansionToggle
                    cls="domain-field-expand-icon"
                    expanded={expanded}
                    expandedTitle="Hide additional field properties"
                    collapsedTitle="Show additional field properties"
                    id={createFormInputId(DOMAIN_FIELD_EXPAND, domainIndex, index)}
                    onClick={this.onExpand}
                />
            </div>
        );
    }

    render() {
        const { closing, isDragDisabled, showAdv, showingModal } = this.state;
        const {
            index,
            field,
            expanded,
            expandTransition,
            fieldError,
            maxPhiLevel,
            dragging,
            domainId,
            domainIndex,
            helpNoun,
            showDefaultValueSettings,
            defaultDefaultValueType,
            defaultValueOptions,
            appPropertiesOnly,
            successBsStyle,
            domainFormDisplayOptions,
            getDomainFields,
        } = this.props;

        return (
            <Draggable
                draggableId={createFormInputId('domaindrag', domainIndex, index)}
                index={index}
                isDragDisabled={showingModal || isDragDisabled}
            >
                {provided => (
                    <div
                        className={this.getRowCssClasses(expanded, closing, dragging, fieldError)}
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                        tabIndex={index}
                    >
                        <Row key={createFormInputId('domainrow', domainIndex, index)} className="domain-row-container">
                            <AdvancedSettings
                                domainIndex={domainIndex}
                                domainId={domainId}
                                helpNoun={helpNoun}
                                index={index}
                                maxPhiLevel={maxPhiLevel}
                                field={field}
                                onApply={this.onMultiFieldChange}
                                show={showAdv}
                                onHide={this.onHideAdvanced}
                                label={field.name}
                                showDefaultValueSettings={showDefaultValueSettings}
                                defaultDefaultValueType={defaultDefaultValueType}
                                defaultValueOptions={defaultValueOptions}
                                successBsStyle={successBsStyle}
                                domainFormDisplayOptions={domainFormDisplayOptions}
                            />
                            <div className="domain-row-handle" {...provided.dragHandleProps}>
                                <DragDropHandle
                                    highlighted={
                                        dragging
                                            ? true
                                            : isDragDisabled
                                            ? false
                                            : undefined /* use undefined instead of false to allow for css to handle the highlight color for hover*/
                                    }
                                />
                            </div>
                            <div className="domain-row-main">
                                <Col xs={6} className="domain-row-base-fields">
                                    {this.renderBaseFields()}
                                </Col>
                                <Col xs={6} className="field-details-container">
                                    {this.getDetails()}
                                    {this.renderButtons()}
                                </Col>
                            </div>
                        </Row>
                        <Collapse
                            in={expanded}
                            timeout={expandTransition}
                            onExited={this.onCollapsed}
                            onExiting={this.onCollapsing}
                        >
                            <div>
                                <DomainRowExpandedOptions
                                    field={field}
                                    index={index}
                                    domainIndex={domainIndex}
                                    getDomainFields={getDomainFields}
                                    onMultiChange={this.onMultiFieldChange}
                                    onChange={this.onSingleFieldChange}
                                    showingModal={this.showingModal}
                                    appPropertiesOnly={appPropertiesOnly}
                                    successBsStyle={successBsStyle}
                                    domainFormDisplayOptions={domainFormDisplayOptions}
                                />
                            </div>
                        </Collapse>
                    </div>
                )}
            </Draggable>
        );
    }
}
