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
    DOMAIN_FIELD_ADV, DOMAIN_FIELD_DELETE,
    DOMAIN_FIELD_DETAILS,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_TYPE
} from "../constants";
import { DomainField, PROP_DESC_TYPES } from "../models";
import { createFormInputId, getDataType } from "../actions/actions";
import { DomainRowExpandedOptions } from "./DomainRowExpandedOptions";

interface IDomainRowProps {
    expanded: boolean
    field: DomainField
    index: number
    onChange: (any) => any
    onDelete: (any) => void
    onExpand: (any) => void
}

/**
 * React component for one property in a domain
 */
export class DomainRow extends React.PureComponent<IDomainRowProps, any> {

    /**
     *  Details section of property row
     */
    getDetailsText = (): string => {
        let details = '';

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

    renderBaseFields() {
        const {index, field, onChange} = this.props;

        return (
            <>
                <Col xs={3}>
                    <Tip caption={'Name'}>
                        <FormControl id={createFormInputId(DOMAIN_FIELD_NAME, index)} type="text"
                                     key={createFormInputId(DOMAIN_FIELD_NAME, index)} value={field.name}
                                     onChange={onChange}/>
                    </Tip>
                </Col>
                <Col xs={2}>
                    <Tip caption={'Data Type'}>
                        <select id={createFormInputId(DOMAIN_FIELD_TYPE, index)}
                                key={createFormInputId(DOMAIN_FIELD_TYPE, index)}
                                className={'form-control'} onChange={onChange} value={getDataType(field).name}
                                disabled={!!field.propertyId}>
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
                                      checked={field.required} onChange={onChange}/>
                        </Tip>
                    </div>
                </Col>
            </>
        )
    }

    renderButtons() {
        const {index, onDelete, onExpand, expanded} = this.props;

        return (
            <div className={'pull-right'}>
                {expanded &&
                <>
                    <Button
                        bsClass='btn btn-danger'
                        className='domain-row-button'
                        onClick={onDelete}
                        id={createFormInputId(DOMAIN_FIELD_DELETE, index)}
                    >
                        Remove Field
                    </Button>
                    <Button
                        disabled={true}
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

