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
import { Row, Col, FormControl, Checkbox, Button } from "react-bootstrap";
import {List} from "immutable";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { Draggable } from "react-beautiful-dnd";
import { Tip } from "@glass/base";
import { DOMAIN_FIELD_CLIENT_SIDE_ERROR, SEVERITY_LEVEL_WARN, SEVERITY_LEVEL_ERROR } from "../constants";

import {
    DOMAIN_FIELD_ADV,
    DOMAIN_FIELD_DELETE,
    DOMAIN_FIELD_DETAILS, DOMAIN_FIELD_EXPAND,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_REQUIRED, DOMAIN_FIELD_ROW,
    DOMAIN_FIELD_TYPE,
    DOMAIN_FIELD_FULLY_LOCKED,
} from "../constants";
import { DomainField, IFieldChange, FieldErrors, DomainFieldError, PropDescType, resolveAvailableTypes } from "../models";
import { createFormInputId, createFormInputName, getCheckedValue, getIndexFromId } from "../actions/actions";
import { isFieldFullyLocked, isFieldPartiallyLocked, isLegalName } from "../propertiesUtil";
import { DomainRowExpandedOptions } from "./DomainRowExpandedOptions";

interface IDomainRowProps {
    expanded: boolean
    field: DomainField
    index: number
    onChange: (changes: List<IFieldChange>, index?: number, expand?: boolean) => any
    fieldError?: DomainFieldError
    onDelete: (any) => void
    onExpand: (index?: number) => void
}

/**
 * React component for one property in a domain
 */
export class DomainRow extends React.PureComponent<IDomainRowProps, any> {

    /**
     *  Details section of property row
     */
    getDetailsText = (): React.ReactNode => {
        const { expanded, field } = this.props;
        let details = [];

        if (!expanded) {
            if (field.hasErrors()) {
                switch (field.getErrors()) {
                    case FieldErrors.MISSING_SCHEMA_QUERY:
                        details.push(
                            <span key={details.length} style={{color: 'red'}}>
                                A lookup requires a schema and table!
                            </span>);
                        break;
                    default:
                        break;
                }
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
        }

        let period = '';
        if (details.length > 0) {
            period = '. ';
        }

        if (this.props.field.lockType == DOMAIN_FIELD_FULLY_LOCKED) {
           details.push(period + 'Locked');
        }

        if (details.length > 0) {
            period = '. ';
        }

        if (this.props.fieldError) {
            details.push(period);
            const msg = this.props.fieldError.severity + ": " + this.props.fieldError.message;
            details.push(<b>{msg}</b>);
        }

        return details;
    };

    getDetails() {
        const { index } = this.props;

        return (
            <span id={createFormInputId(DOMAIN_FIELD_DETAILS, index)} className='domain-field-details'>
                {this.getDetailsText()}
            </span>
        )
    }

    getFieldErrorClass = (fieldError: DomainFieldError) => {
        if (fieldError.severity === SEVERITY_LEVEL_ERROR) {
            return 'domain-field-row-error '
        }
        else {
            return 'domain-field-row-warning ';
        }
    };

    onFieldChange = (evt: any, expand?: boolean) => {
        const { index } = this.props;

        let value = getCheckedValue(evt);
        if (value === undefined) {
            value = evt.target.value;
        }

        this.onSingleFieldChange(evt.target.id, value, index, expand);
    };

    onSingleFieldChange = (id: string, value: any, index?: number, expand?: boolean) => {
        const { onChange } = this.props;

        if (onChange) {
            onChange(List([{id, value} as IFieldChange]), index, expand === true);
        }
    };

    onNameChange  = (evt) => {

        const { index, onChange } = this.props;

        let value = evt.target.value;
        let nameAndErrorList = List<IFieldChange>().asMutable();

        //add evt.target.id and evt.target.value
        nameAndErrorList.push({id : createFormInputId(DOMAIN_FIELD_NAME, getIndexFromId(evt.target.id)), value: value});

        if (!isLegalName(value) || (value !== undefined && value.trim().indexOf(' ') >= 0)) {

            let message = "SQL queries, R scripts, and other code are easiest to write when field names only contain combination of letters, numbers, and underscores, and start with a letter or underscore.";
            let fieldName = value;
            let severity = SEVERITY_LEVEL_WARN;
            let indexes = List<number>([index]);
            let domainFieldError = new DomainFieldError({message, fieldName, propertyId: undefined, severity, rowIndexes: indexes});

            //set error obj
            nameAndErrorList.push({id : createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, getIndexFromId(evt.target.id)), value: domainFieldError});
        }
        else {
            //set error to undefined
            nameAndErrorList.push({id : createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, getIndexFromId(evt.target.id)), value: undefined});
        }

        if (onChange) {
            onChange(nameAndErrorList, index, true);
        }

    };

    onDataTypeChange = (evt: any): any => {
        this.onFieldChange(evt, PropDescType.isLookup(evt.target.value));
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

    renderBaseFields() {
        const { index, field } = this.props;

        return (
            <div id={createFormInputId(DOMAIN_FIELD_ROW, index)}>
                <Col xs={3}>
                    <Tip caption={'Name'}>
                        <FormControl
                            // autoFocus={field.isNew()}  // TODO: This is not working great with drag and drop, need to investigate
                            type="text"
                            value={field.name || ''}
                            name={createFormInputName(DOMAIN_FIELD_NAME)}
                            id={createFormInputId(DOMAIN_FIELD_NAME, index)}
                            onChange={this.onNameChange}
                            disabled={(isFieldPartiallyLocked(field.lockType) || isFieldFullyLocked(field.lockType))}
                        />
                    </Tip>
                </Col>
                <Col xs={2}>
                    <Tip caption={'Data Type'}>
                        <FormControl
                            componentClass="select"
                            name={createFormInputName(DOMAIN_FIELD_TYPE)}
                            disabled={!field.isNew() && field.primaryKey || (isFieldPartiallyLocked(field.lockType) || isFieldFullyLocked(field.lockType))}
                            id={createFormInputId(DOMAIN_FIELD_TYPE, index)}
                            onChange={this.onDataTypeChange}
                            value={field.dataType.name}
                        >
                            {
                                resolveAvailableTypes(field).map((type, i) => (
                                    <option key={i} value={type.name}>{type.display}</option>
                                ))
                            }
                        </FormControl>
                    </Tip>
                </Col>
                <Col xs={1}>
                    <div className='domain-field-checkbox'>
                        <Tip caption={'Required?'}>
                            <Checkbox
                                className='domain-field-checkbox'
                                name={createFormInputName(DOMAIN_FIELD_REQUIRED)}
                                id={createFormInputId(DOMAIN_FIELD_REQUIRED, index)}
                                checked={field.required}
                                onChange={this.onFieldChange}
                                disabled={isFieldFullyLocked(field.lockType)}
                            />
                        </Tip>
                    </div>
                </Col>
            </div>
        )
    }

    renderButtons() {
        const { expanded, index, field } = this.props;

        return (
            <div className="pull-right">
                {expanded && (
                <>
                    <Button
                        bsStyle="danger"
                        className="domain-row-button"
                        name={createFormInputName(DOMAIN_FIELD_DELETE)}
                        id={createFormInputId(DOMAIN_FIELD_DELETE, index)}
                        disabled={isFieldFullyLocked(field.lockType) || isFieldPartiallyLocked(field.lockType)}
                        onClick={this.onDelete}>
                        Remove Field
                    </Button>
                    <Button
                        disabled={true || isFieldFullyLocked(field.lockType)} //TODO: remove true once Advanced Settings are enabled.
                        name={createFormInputName(DOMAIN_FIELD_ADV)}
                        id={createFormInputId(DOMAIN_FIELD_ADV, index)}
                        className="domain-row-button">
                        Advanced Settings
                    </Button>
                </>
                )}
                <Tip caption="Additional Settings">
                    <div className="domain-field-icon" id={createFormInputId(DOMAIN_FIELD_EXPAND, index)} onClick={this.onExpand}>
                        <FontAwesomeIcon icon={faPencilAlt}/>
                    </div>
                </Tip>
            </div>
        )
    }

    render() {
        const { index, field, expanded, fieldError } = this.props;

        return (
            <Draggable draggableId={createFormInputId("domaindrag", index)} index={index}>
                {(provided) => (
                    <div className={(fieldError ? this.getFieldErrorClass(fieldError) : 'domain-field-row ') + (expanded ? 'domain-row-expanded ': '') }
                         {...provided.draggableProps}
                         {...provided.dragHandleProps}
                         ref={provided.innerRef}
                         tabIndex={index}
                         draggable={true}
                    >
                        <Row key={createFormInputId("domainrow", index)}>
                            {this.renderBaseFields()}
                            <Col xs={6}>
                                {this.getDetails()}
                                {this.renderButtons()}
                            </Col>
                        </Row>
                        {expanded &&
                            <DomainRowExpandedOptions field={field} index={index} onChange={this.onSingleFieldChange}/>
                        }
                    </div>
                )}
            </Draggable>
        );
    }
}
