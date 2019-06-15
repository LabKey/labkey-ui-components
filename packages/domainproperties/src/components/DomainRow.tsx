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

import {
    DOMAIN_FIELD_DETAILS,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE
} from "../constants";
import { DomainField, PropDescType, PROP_DESC_TYPES } from "../models";
import { createFormInputId } from "../actions/actions";
import { DomainRowExpandedOptions } from "./DomainRowExpandedOptions";

interface IDomainRowProps {
    expanded: boolean
    field: DomainField
    index: number
    onChange: (fieldId: string, value: any, index?: number, expand?: boolean) => any
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
    getDetailsText = (): string => {
        const { expanded, field } = this.props;
        let details = [];

        if (!expanded) {
            if (field.getDataType().isLookup() && field.lookupSchema && field.lookupQuery) {
                details.push([
                    field.lookupContainer || 'Current Folder',
                    field.lookupSchema,
                    field.lookupQuery
                ].join(' > '));
            }
            else if (field.newField) {
                details.push('New field');
            }
            else if (field.updatedField) {
                details.push('Field was edited');
            }
        }

        return details.join(', ');
    };

    getDetails() {
        const { index } = this.props;

        return (
            <span id={createFormInputId(DOMAIN_FIELD_DETAILS, index)} className='domain-field-details'>
                {this.getDetailsText()}
            </span>
        )
    }

    onChange = (evt: any, expand?: boolean): any => {
        const { index, onChange } = this.props;

        if (onChange) {
            let value = evt.target.value;
            if (evt.target.type === 'checkbox') {
                value = evt.target.checked;
            }

            onChange(evt.target.id, value, index, expand === true);
        }
    };

    onDataTypeChange = (evt: any): any => {
        this.onChange(evt, PropDescType.isLookup(evt.target.value));
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
            <>
                <Col xs={3}>
                    <Tip caption={'Name'}>
                        <FormControl autoFocus
                                     id={createFormInputId(DOMAIN_FIELD_NAME, index)} type="text"
                                     key={createFormInputId(DOMAIN_FIELD_NAME, index)} value={field.name}
                                     onChange={this.onChange}/>
                    </Tip>
                </Col>
                <Col xs={2}>
                    <Tip caption={'Data Type'}>
                        <FormControl
                            componentClass="select"
                            disabled={!!field.propertyId}
                            id={createFormInputId(DOMAIN_FIELD_TYPE, index)}
                            key={createFormInputId(DOMAIN_FIELD_TYPE, index)}
                            onChange={this.onDataTypeChange}
                            value={field.getDataType().name}>
                            {
                                PROP_DESC_TYPES.map((type, i) => (
                                    <option key={i} value={type.name}>{type.display}</option>
                                ))
                            }
                        </FormControl>
                    </Tip>
                </Col>
                <Col xs={1}>
                    <div className='domain-field-checkbox'>
                        <Tip caption={'Required?'}>
                            <Checkbox className='domain-field-checkbox'
                                      id={createFormInputId(DOMAIN_FIELD_REQUIRED, index)}
                                      key={createFormInputId(DOMAIN_FIELD_REQUIRED, index)}
                                      checked={field.required}
                                      onChange={this.onChange}/>
                        </Tip>
                    </div>
                </Col>
            </>
        )
    }

    renderButtons() {
        const { expanded } = this.props;

        return (
            <div className="pull-right">
                {expanded && (
                <>
                    <Button
                        bsStyle="danger"
                        className="domain-row-button"
                        onClick={this.onDelete}>
                        Remove Field
                    </Button>
                    <Button
                        disabled={true}
                        className="domain-row-button">
                        Advanced Settings
                    </Button>
                </>
                )}
                <Tip caption="Additional Settings">
                    <div className="domain-field-icon" onClick={this.onExpand}>
                        <FontAwesomeIcon icon={faPencilAlt}/>
                    </div>
                </Tip>
            </div>
        )
    }

    render() {
        const { index, field, expanded } = this.props;

        return (
            <Draggable draggableId={createFormInputId("domaindrag", index)} index={index}>
                {(provided) => (
                    <div className={'domain-field-row ' + (expanded?'domain-row-expanded ':'')}
                         {...provided.draggableProps}
                         {...provided.dragHandleProps}
                         ref={provided.innerRef}
                    >
                        <Row key={createFormInputId("domainrow", index)}>
                            {this.renderBaseFields()}
                            <Col xs={6}>
                                {this.getDetails()}
                                {this.renderButtons()}
                            </Col>
                        </Row>
                        {expanded &&
                            <DomainRowExpandedOptions field={field} index={index} onChange={this.onChange}/>
                        }
                    </div>
                )}
            </Draggable>
        );
    }
}

