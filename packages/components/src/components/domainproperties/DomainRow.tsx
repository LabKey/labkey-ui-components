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
import {
    ALL_SAMPLES_DISPLAY_TEXT,
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
    FieldErrors,
    IFieldChange,
    PropDescType,
    resolveAvailableTypes,
} from './models';
import { createFormInputId, createFormInputName, getCheckedValue } from './actions';
import { isFieldFullyLocked, isFieldPartiallyLocked, isLegalName } from './propertiesUtil';
import { DomainRowExpandedOptions } from './DomainRowExpandedOptions';
import { AdvancedSettings } from './AdvancedSettings';
import { FieldExpansionToggle } from "../base/FieldExpansionToggle";
import { DeleteIcon } from "../base/DeleteIcon";
import { DragDropHandle } from "../base/DragDropHandle";
import { SCHEMAS } from '../base/models/schemas';
import { faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface IDomainRowProps {
    domainId?: number
    helpNoun: string
    expanded: boolean
    dragging: boolean
    expandTransition: number
    field: DomainField
    index: number
    maxPhiLevel: string
    availableTypes: List<PropDescType>
    onChange: (changes: List<IFieldChange>, index?: number, expand?: boolean) => any
    fieldError?: DomainFieldError
    onDelete: (any) => void
    onExpand: (index?: number) => void
    isDragDisabled: boolean
    showDefaultValueSettings: boolean
    defaultDefaultValueType: string
    defaultValueOptions: List<string>
    appPropertiesOnly?: boolean
    showFilePropertyType?: boolean
    domainIndex: number
    successBsStyle?: string
}

interface IDomainRowState {
    showAdv: boolean
    closing: boolean
    showingModal: boolean
    isDragDisabled: boolean
}

/**
 * React component for one property in a domain
 */
export class DomainRow extends React.PureComponent<IDomainRowProps, IDomainRowState> {

    constructor(props) {
        super(props);

        this.state = {
            showAdv: false,
            closing: false,
            showingModal: false,
            isDragDisabled: props.isDragDisabled
        };
    }

    componentWillReceiveProps(nextProps: Readonly<IDomainRowProps>, nextContext: any): void {
        // if there was a prop change to isDragDisabled, need to call setDragDisabled
        if (nextProps.isDragDisabled !== this.props.isDragDisabled) {
            this.setDragDisabled(nextProps.isDragDisabled, false);
        }
    }

    /**
     *  Details section of property row
     */
    getDetailsText = (): React.ReactNode => {
        const { field, index, fieldError } = this.props;
        let details = [];

        if (field.hasErrors()) {
            switch (field.getErrors()) {
                case FieldErrors.MISSING_SCHEMA_QUERY:
                    details.push(
                        <span key={details.length} style={{color: 'red'}}>
                            Missing required lookup target schema/table properties.
                        </span>
                    );
                    break;
                default:
                    break;
            }
        }
        else if (field.dataType.isSample()) {
            let detailsText = field.lookupSchema === SCHEMAS.EXP_TABLES.MATERIALS.schemaName && SCHEMAS.EXP_TABLES.MATERIALS.queryName.localeCompare(field.lookupQuery, 'en', {sensitivity: 'accent'}) === 0 ?
                ALL_SAMPLES_DISPLAY_TEXT:
                field.lookupQuery;
            details.push(detailsText);
        }
        else if (field.dataType.isLookup() && field.lookupSchema && field.lookupQuery) {
            details.push([
                field.lookupContainer || 'Current Folder',
                field.lookupSchema,
                field.lookupQuery
            ].join(' > '));
        }
        else if (field.isNew()) {
            details.push('New field');
        }
        else if (field.updatedField) {
            details.push('Updated');
        }
        else if (field.isPrimaryKey) {
            details.push('Primary Key');
        }

        let period = '';
        if (details.length > 0) {
            period = '. ';
        }

        if (field.lockType == DOMAIN_FIELD_FULLY_LOCKED) {
            details.push(period + 'Locked');
        }

        if (details.length > 0) {
            period = '. ';
        }

        if (fieldError) {
            details.push(period);
            const msg = fieldError.severity + ': ' + fieldError.message;
            details.push(
                <>
                    <b key={field.name + "_" + index}>{msg}</b>&nbsp;
                    {fieldError.extraInfo && <OverlayTrigger
                        placement={'bottom'}
                        overlay={<Popover bsClass="popover">{fieldError.extraInfo}</Popover>}
                    >
                        <FontAwesomeIcon icon={faExclamationCircle} className={'domain-warning-icon'}/>
                    </OverlayTrigger>}
                </>
            );
        }

        return details;
    };

    getDetails() {
        const { index, expanded, domainIndex } = this.props;
        const { closing } = this.state;

        return (
            <div id={createFormInputId(DOMAIN_FIELD_DETAILS, domainIndex, index)}
                 className={(expanded || closing) ? 'domain-field-details-expanded' : 'domain-field-details'}>
                {this.getDetailsText()}
            </div>
        )
    }

    getFieldErrorClass = (fieldError: DomainFieldError): string => {
        if (!fieldError) {
            return 'domain-row-border-default'
        }
        else if (fieldError.severity === SEVERITY_LEVEL_ERROR) {
            return 'domain-row-border-error'
        }
        else {
            return 'domain-row-border-warning';
        }
    };

    getRowCssClasses = (expanded: boolean, closing: boolean, dragging: boolean, fieldError: DomainFieldError): string => {
        let classes = List<string>().asMutable();

        classes.push('domain-field-row');

        if (!dragging) {
            classes.push(this.getFieldErrorClass(fieldError));
        }
        else {
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
            onChange(List([{id, value} as IFieldChange]), index, expand === true);
        }
    };

    onMultiFieldChange = (changes: List<IFieldChange>): void => {
        const { onChange, index } = this.props;

        if (onChange) {
            onChange(changes, index, true);
        }
    };

    onNameChange  = (evt) => {
        const { index, onChange, domainIndex } = this.props;

        let value = evt.target.value;
        let nameAndErrorList = List<IFieldChange>().asMutable();

        //set value for the field
        nameAndErrorList.push({id : createFormInputId(DOMAIN_FIELD_NAME, domainIndex, index), value: value});

        if (isLegalName(value) && !value.includes(' ')) {
            //set value to undefined for field error
            nameAndErrorList.push({id : createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, domainIndex, index), value: undefined});
        }
        else {
            let fieldName = value;
            let severity = SEVERITY_LEVEL_WARN;
            let indexes = List<number>([index]);
            let domainFieldError = new DomainFieldError({
                message: FIELD_NAME_CHAR_WARNING_MSG,
                extraInfo: FIELD_NAME_CHAR_WARNING_INFO,
                fieldName,
                propertyId: undefined,
                severity,
                rowIndexes: indexes
            });

            //set value for field error
            nameAndErrorList.push({id : createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, domainIndex, index), value: domainFieldError});
        }

        if (onChange) {
            onChange(nameAndErrorList, index, false);
        }
    };

    onDataTypeChange = (evt: any): any => {
        this.onFieldChange(evt, PropDescType.isLookup(evt.target.value));
    };

    onShowAdvanced = (): any => {
        this.setState(() => ({showAdv: true}));

        this.setDragDisabled(this.props.isDragDisabled, true);
    };

    onHideAdvanced = (): any => {
        this.setState(() => ({showAdv: false}));

        this.setDragDisabled(this.props.isDragDisabled, false);
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

    onCollapsed = () : void => {
        this.setState(() =>({closing: false}));
    };

    onCollapsing = () : void => {
        this.setState(() => ({closing: true}));
    };

    setDragDisabled = (propDragDisabled: boolean, disabled: boolean) => {
        this.setState(() => ({isDragDisabled: (disabled || propDragDisabled)}));
    };

    showingModal = (showing: boolean) => {
        this.setState(() => ({showingModal: showing}));
    };

    renderBaseFields() {
        const { index, field, availableTypes, appPropertiesOnly, showFilePropertyType, domainIndex } = this.props;

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
                        disabled={(isFieldPartiallyLocked(field.lockType) || isFieldFullyLocked(field.lockType))}
                    />
                </Col>
                <Col xs={4}>
                    <FormControl
                        componentClass="select"
                        name={createFormInputName(DOMAIN_FIELD_TYPE)}
                        disabled={(!field.isNew() && field.primaryKey) || isFieldPartiallyLocked(field.lockType) || isFieldFullyLocked(field.lockType)}
                        id={createFormInputId(DOMAIN_FIELD_TYPE, domainIndex, index)}
                        onChange={this.onDataTypeChange}
                        value={field.dataType.name}
                    >
                        {
                            resolveAvailableTypes(field, availableTypes, appPropertiesOnly, showFilePropertyType).map(
                                (type, i) => (<option key={i} value={type.name}>{type.display}</option>
                            ))
                        }
                    </FormControl>
                </Col>
                <Col xs={2}>
                    <div className='domain-field-checkbox-container'>
                        <Checkbox
                            className='domain-field-checkbox'
                            name={createFormInputName(DOMAIN_FIELD_REQUIRED)}
                            id={createFormInputId(DOMAIN_FIELD_REQUIRED, domainIndex, index)}
                            checked={field.required}
                            onChange={this.onFieldChange}
                            disabled={isFieldFullyLocked(field.lockType)}
                        />
                    </div>
                </Col>
            </div>
        )
    }

    renderButtons() {
        const { expanded, index, field, appPropertiesOnly, domainIndex } = this.props;
        const { closing } = this.state;

        return (
            <div className={expanded ? "domain-field-buttons-expanded" : "domain-field-buttons"}>
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
                {!(isFieldFullyLocked(field.lockType) || isFieldPartiallyLocked(field.lockType)) &&
                    <DeleteIcon
                        id={createFormInputId(DOMAIN_FIELD_DELETE, domainIndex, index)}
                        title={'Remove field'}
                        iconCls={'domain-field-delete-icon'}
                        onDelete={this.onDelete}
                    />
                }
                <FieldExpansionToggle
                    cls={'domain-field-expand-icon'}
                    expanded={expanded}
                    expandedTitle={"Hide additional field properties"}
                    collapsedTitle={"Show additional field properties"}
                    id={createFormInputId(DOMAIN_FIELD_EXPAND, domainIndex, index)}
                    onClick={this.onExpand}
                />
            </div>
        )
    }

    render() {
        const { closing, isDragDisabled, showAdv, showingModal } = this.state;
        const { index, field, expanded, expandTransition, fieldError, maxPhiLevel, dragging, domainId, domainIndex,
            helpNoun, showDefaultValueSettings, defaultDefaultValueType, defaultValueOptions, appPropertiesOnly, successBsStyle } = this.props;

        return (
            <Draggable draggableId={createFormInputId("domaindrag", domainIndex, index)} index={index} isDragDisabled={showingModal || isDragDisabled}>
                {(provided) => (
                    <div className={this.getRowCssClasses(expanded, closing, dragging, fieldError)}
                         {...provided.draggableProps}
                         ref={provided.innerRef}
                         tabIndex={index}
                    >
                        <Row key={createFormInputId("domainrow", domainIndex, index)} className={'domain-row-container'}>
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
                            />
                            <div className='domain-row-handle' {...provided.dragHandleProps}>
                                {<DragDropHandle highlighted={dragging ? true : isDragDisabled ? false: undefined /* use undefined instead of false to allow for css to handle the highlight color for hover*/}/>}
                            </div>
                            <div className='domain-row-main'>
                                <Col xs={6} className='domain-row-base-fields'>
                                    {this.renderBaseFields()}
                                </Col>
                                <Col xs={6} className='field-details-container'>
                                    {this.getDetails()}
                                    {this.renderButtons()}
                                </Col>
                            </div>
                        </Row>
                            <Collapse in={expanded} timeout={expandTransition} onExited={this.onCollapsed} onExiting={this.onCollapsing}>
                                <div>
                                    <DomainRowExpandedOptions
                                        field={field}
                                        index={index}
                                        domainIndex={domainIndex}
                                        onMultiChange={this.onMultiFieldChange}
                                        onChange={this.onSingleFieldChange}
                                        showingModal={this.showingModal}
                                        appPropertiesOnly={appPropertiesOnly}
                                        successBsStyle={successBsStyle}
                                    />
                                </div>
                            </Collapse>
                    </div>
                )}
            </Draggable>
        );
    }
}
