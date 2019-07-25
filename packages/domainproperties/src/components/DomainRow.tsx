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
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { Draggable } from "react-beautiful-dnd";
import { Tip } from "@glass/base";
import { SEVERITY_LEVEL_WARN } from "../constants";

import {
    DOMAIN_FIELD_ADV, DOMAIN_FIELD_DELETE,
    DOMAIN_FIELD_DETAILS,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE,
    DOMAIN_FIELD_FULLY_LOCKED,
} from "../constants";
import { DomainField, PROP_DESC_TYPES, DomainFieldError } from "../models";
import { createFormInputId, getCheckedValue, getDataType } from "../actions/actions";
import { isFieldFullyLocked, isFieldPartiallyLocked, isLegalName } from "../propertiesUtil";
import { DomainRowExpandedOptions } from "./DomainRowExpandedOptions";

interface IDomainRowProps {
    expanded: boolean
    field: DomainField
    index: number
    fieldError?: DomainFieldError
    onChange: (string, any) => any
    onDelete: (any) => void
    onExpand: (any) => void
}

interface IDomainRowState {
    fieldError?: DomainFieldError
}

/**
 * React component for one property in a domain
 */
export class DomainRow extends React.PureComponent<IDomainRowProps, IDomainRowState> {

    constructor(props) {
        super(props);

        this.state = {
            fieldError: props.fieldError
        };
    }
    /**
     *  Details section of property row
     */
    getDetailsText = (): string => {
        let details = '';

        if (this.props.field.isPrimaryKey) {
            if (details.length > 0) {
                details += ', ';
            }

            details += 'Key';
        }

        if (this.props.field.lockType == DOMAIN_FIELD_FULLY_LOCKED) {
            if (details.length > 0) {
                details += ', ';
            }

            details += 'Locked';
        }

        if (this.props.field.newField) {
            if (details.length > 0) {
                details += ', ';
            }

            details += 'New Field';
        }

        if (this.props.field.updatedField && !this.props.field.newField) {
            if (details.length > 0) {
                details += ', ';
            }

            details += 'Updated';
        }

        if (this.props.fieldError) {

            if (this.props.field.propertyId == this.props.fieldError.id || this.props.field.name == this.props.fieldError.field)
            {
                if (details.length > 0)
                {
                    details += ', ';
                }
                details += this.props.fieldError.message
            }
        }
        else if (this.state.fieldError) {

            if (details.length > 0)
            {
                details += ', ';
            }
            details += this.state.fieldError.message;
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

    onFieldChange = (evt) => {
        const { onChange } = this.props;

        let value = getCheckedValue(evt);
        if (value === undefined) {
            value = evt.target.value;
        }

        if (onChange) {
            onChange(evt.target.id, value);
        }
    }

    onNameChange  = (evt) => {

        const { onChange } = this.props;

        let value = evt.target.value;
        if (!isLegalName(value)) {

            let message = "SQL queries, R scripts, and other code are easiest to write when field names only contain combination of letters, numbers, and underscores, and start with a letter or underscore.";
            let field = null;
            let id = null;
            let severity = SEVERITY_LEVEL_WARN;
            let domainFieldError = new DomainFieldError({message, field, id, severity});

            this.setState({fieldError : domainFieldError});

        }
        else {
            this.setState({fieldError : undefined});
        }

        if (onChange) {
            onChange(evt.target.id, value);
        }
    }

    renderBaseFields() {
        const {index, field, onChange} = this.props;

        return (
            <>
                <Col xs={3}>
                    <Tip caption={'Name'}>
                        <FormControl id={createFormInputId(DOMAIN_FIELD_NAME, index)} type="text"
                                     key={createFormInputId(DOMAIN_FIELD_NAME, index)} value={field.name}
                                     onChange={this.onNameChange} disabled={(isFieldPartiallyLocked(field.lockType) || isFieldFullyLocked(field.lockType))}/>
                    </Tip>
                </Col>
                <Col xs={2}>
                    <Tip caption={'Data Type'}>
                        <select id={createFormInputId(DOMAIN_FIELD_TYPE, index)}
                                key={createFormInputId(DOMAIN_FIELD_TYPE, index)}
                                className={'form-control'} onChange={this.onFieldChange} value={getDataType(field).name}
                                disabled={!!field.propertyId || (isFieldPartiallyLocked(field.lockType) || isFieldFullyLocked(field.lockType))}>
                            {
                                PROP_DESC_TYPES.map(function (type) {
                                    if (type.display)
                                    {
                                        return <option
                                            key={createFormInputId(DOMAIN_FIELD_TYPE + 'option-' + type.name, index)}
                                            value={type.name}>{type.display}</option>
                                    }
                                    return ''
                                })
                            }
                        </select>
                    </Tip>
                </Col>
                <Col xs={1}>
                    <div className='domain-field-checkbox'>
                        <Tip caption={'Required?'}>
                            <Checkbox className='domain-field-checkbox'
                                      id={createFormInputId(DOMAIN_FIELD_REQUIRED, index)}
                                      key={createFormInputId(DOMAIN_FIELD_REQUIRED, index)}
                                      checked={field.required} onChange={this.onFieldChange} disabled={isFieldFullyLocked(field.lockType)}/>
                        </Tip>
                    </div>
                </Col>
            </>
        )
    }

    renderButtons() {
        const {index, field, onDelete, onExpand, expanded} = this.props;

        return (
            <div className={'pull-right'}>
                {expanded &&
                <>
                    <Button
                            bsClass='btn btn-danger'
                            className='domain-row-button'
                            onClick={onDelete}
                            id={createFormInputId(DOMAIN_FIELD_DELETE, index)}
                            disabled={isFieldFullyLocked(field.lockType) || isFieldPartiallyLocked(field.lockType)}
                    >
                        Remove Field
                    </Button>
                    <Button
                            disabled={true || isFieldFullyLocked(field.lockType)} //TODO: remove true once Advanced Settings are enabled.
                            bsClass='btn btn-light'
                            className='domain-row-button'
                    >
                        Advanced Settings
                    </Button>
                </>
                }
                <Tip caption={'Additional Settings'}>
                    <div onClick={onExpand} id={createFormInputId(DOMAIN_FIELD_ADV, index)} className={'domain-field-icon'}>

                        <FontAwesomeIcon icon={faPencilAlt}/>
                    </div>
                </Tip>
            </div>
        )
    }

    render() {
        const { index, field, expanded, onChange } = this.props;

        return (
            <Draggable draggableId={createFormInputId("domaindrag", index)} index={index}>
                {(provided) => (
                    <div className={'domain-field-row ' + (expanded?'domain-row-expanded ':'')}
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
                        <DomainRowExpandedOptions field={field} index={index} onChange={onChange}/>
                        }
                    </div>
                )}
            </Draggable>
        );
    }
}

