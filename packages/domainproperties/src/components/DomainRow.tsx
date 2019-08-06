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
import { CSSTransition } from 'react-transition-group';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { Draggable } from "react-beautiful-dnd";
import { Tip } from "@glass/base";

import {
    DOMAIN_FIELD_ADV,
    DOMAIN_FIELD_DELETE,
    DOMAIN_FIELD_DETAILS, DOMAIN_FIELD_EXPAND,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_REQUIRED, DOMAIN_FIELD_ROW,
    DOMAIN_FIELD_TYPE
} from "../constants";
import { DomainField, IFieldChange, FieldErrors, PropDescType, resolveAvailableTypes } from "../models";
import {createFormInputId, createFormInputName, getCheckedValue} from "../actions/actions";
import { DomainRowExpandedOptions } from "./DomainRowExpandedOptions";
import {AdvancedSettings} from "./AdvancedSettings";

interface IDomainRowProps {
    expanded: boolean
    field: DomainField
    index: number
    maxPhiLevel: string
    onChange: (changes: List<IFieldChange>, index?: number, expand?: boolean) => any
    onDelete: (any) => void
    onExpand: (index?: number) => void
}

interface IDomainRowState {
    showAdv: boolean
    closed: boolean
}

/**
 * React component for one property in a domain
 */
export class DomainRow extends React.PureComponent<IDomainRowProps, IDomainRowState> {

    constructor(props) {
        super(props);

        this.state = {
            showAdv: false,
            closed: true
        };
    }

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
                details.push('Field was edited');
            }
            else if (field.primaryKey) {
                details.push('Primary Key');
            }
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

        this.setState({closed: false});

        if (onExpand) {
            onExpand(index);
        }
    };

    onCollapsed = () : void => {
        this.setState({closed: true});
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
                            onChange={this.onFieldChange}
                        />
                    </Tip>
                </Col>
                <Col xs={2}>
                    <Tip caption={'Data Type'}>
                        <FormControl
                            componentClass="select"
                            name={createFormInputName(DOMAIN_FIELD_TYPE)}
                            disabled={!field.isNew() && field.primaryKey}
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
                            />
                        </Tip>
                    </div>
                </Col>
            </div>
        )
    }

    renderButtons() {
        const { expanded, index } = this.props;

        return (
            <div className="pull-right">
                {expanded && (
                <>
                    <Button
                        bsStyle="danger"
                        className="domain-row-button"
                        name={createFormInputName(DOMAIN_FIELD_DELETE)}
                        id={createFormInputId(DOMAIN_FIELD_DELETE, index)}
                        onClick={this.onDelete}
                    >
                        Remove Field
                    </Button>
                    <Button
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
        const { index, field, expanded, maxPhiLevel } = this.props;
        const { closed } = this.state;

        return (
            <Draggable draggableId={createFormInputId("domaindrag", index)} index={index}>
                {(provided) => (
                    <div className={'domain-field-row ' + (closed?'':'domain-row-expanded ')}
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
                            <Collapse in={expanded} onExited={this.onCollapsed}>
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

