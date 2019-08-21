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
import {Row, Col, FormControl, Checkbox, Button, Collapse} from "react-bootstrap";
import { List } from "immutable";
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
import {AdvancedSettings} from "./AdvancedSettings";

interface IDomainRowProps {
    expanded: boolean
    expandTransition: number
    field: DomainField
    index: number
    maxPhiLevel: string
    onChange: (changes: List<IFieldChange>, index?: number, expand?: boolean) => any
    fieldError?: DomainFieldError
    onDelete: (any) => void
    onExpand: (index?: number) => void
}

interface IDomainRowState {
    showAdv: boolean
    closing: boolean
}

/**
 * React component for one property in a domain
 */
export class DomainRow extends React.PureComponent<IDomainRowProps, IDomainRowState> {

    constructor(props) {
        super(props);

        this.state = {
            showAdv: false,
            closing: false
        };
    }

    /**
     *  Details section of property row
     */
    getDetailsText = (): React.ReactNode => {
        const { expanded, field, index } = this.props;
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
            details.push(<b key={field.name+"_"+index}>{msg}</b>);
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

        const { index, onChange } = this.props;

        let value = evt.target.value;
        let nameAndErrorList = List<IFieldChange>().asMutable();

        //set value for the field
        nameAndErrorList.push({id : createFormInputId(DOMAIN_FIELD_NAME, getIndexFromId(evt.target.id)), value: value});

        if (isLegalName(value) && !value.includes(' ')) {

            //set value to undefined for field error
            nameAndErrorList.push({id : createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, getIndexFromId(evt.target.id)), value: undefined});
        }
        else {

            let message = "SQL queries, R scripts, and other code are easiest to write when field names only contain combination of letters, numbers, and underscores, and start with a letter or underscore.";
            let fieldName = value;
            let severity = SEVERITY_LEVEL_WARN;
            let indexes = List<number>([index]);
            let domainFieldError = new DomainFieldError({message, fieldName, propertyId: undefined, severity, rowIndexes: indexes});

            //set value for field error
            nameAndErrorList.push({id : createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, getIndexFromId(evt.target.id)), value: domainFieldError});
        }

        if (onChange) {
            onChange(nameAndErrorList, index, true);
        }
    };

    onDataTypeChange = (evt: any): any => {
        this.onFieldChange(evt, PropDescType.isLookup(evt.target.value));
    };

    onShowAdvanced = (): any => {
        this.setState({showAdv: true});
    };

    onHideAdvanced = (): any => {
        this.setState({showAdv: false});
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
        this.setState({closing: false});
    };

    onCollapsing = () : void => {
        this.setState({closing: true})
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
                        disabled={isFieldFullyLocked(field.lockType)}
                        name={createFormInputName(DOMAIN_FIELD_ADV)}
                        id={createFormInputId(DOMAIN_FIELD_ADV, index)}
                        onClick={this.onShowAdvanced}
                        className="domain-row-button"
                    >
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
        const { closing } = this.state;
        const { index, field, expanded, expandTransition, fieldError, maxPhiLevel } = this.props;

        return (
            <Draggable draggableId={createFormInputId("domaindrag", index)} index={index}>
                {(provided) => (
                    <div className={(fieldError ? this.getFieldErrorClass(fieldError) : 'domain-field-row ') + (closing || expanded ? 'domain-row-expanded ': '') }
                         {...provided.draggableProps}
                         {...provided.dragHandleProps}
                         ref={provided.innerRef}
                         tabIndex={index}
                         draggable={true}
                    >
                        <Row key={createFormInputId("domainrow", index)}>
                            <AdvancedSettings index={index} maxPhiLevel={maxPhiLevel} field={field} onApply={this.onMultiFieldChange} show={this.state.showAdv} onHide={this.onHideAdvanced} label={field.name}/>
                            {this.renderBaseFields()}
                            <Col xs={6}>
                                {this.getDetails()}
                                {this.renderButtons()}
                            </Col>
                        </Row>
                            <Collapse in={expanded} timeout={expandTransition} onExited={this.onCollapsed} onExiting={this.onCollapsing}>
                                <div>
                                    <DomainRowExpandedOptions field={field} index={index} onMultiChange={this.onMultiFieldChange} onChange={this.onSingleFieldChange}/>
                                </div>
                            </Collapse>
                    </div>
                )}
            </Draggable>
        );
    }
}
