import * as React from "react";
import {Row, Col, FormControl, Checkbox, Button} from "react-bootstrap";
import {
    DOMAIN_FIELD_ADV, DOMAIN_FIELD_DELETE,
    DOMAIN_FIELD_DETAILS,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_REQ,
    DOMAIN_FIELD_TYPE
} from "../constants";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { Tip } from "@glass/base";
import { DomainField, PROP_DESC_TYPES } from "../models";
import { createFormInputId, getDataType } from "../actions/actions";
import {DomainRowExpandedOptions} from "./DomainRowExpandedOptions";

interface IDomainRowDisplay {
    index: number,
    field: DomainField,
    onExpand: (any) => void,
    onDelete: (any) => void,
    onChange: (any) => any,
    expanded: boolean
}

/**
 * React component for one property in a domain
 */
export class DomainRow extends React.Component<IDomainRowDisplay, any>
{

    /**
     *  Performance update to prevent unnecessary renders of domain rows on any state update
     */
    shouldComponentUpdate(nextProps: Readonly<IDomainRowDisplay>, nextState: Readonly<any>, nextContext: any): boolean
    {
        // Check first if this optimization is being used. See actions.updateDomainField for example where this is set.
        // Not optimizing, just update every time
        return (typeof nextProps.field.renderUpdate !== "undefined" ? nextProps.field.renderUpdate: true)
    }

    /**
     *  Details section of property row
     */
    getDetailsText = (): string =>
    {
        let details = '';

        // Hack for now to display primary key. Waiting for api update
        // if (this.props.field.name === 'Key') {
        //     details += 'Primary Key, Locked';
        // }

        if (this.props.field.newField)
        {
            if (details.length > 0)
                details += ', ';

            details += 'New Field';
        }

        if (this.props.field.updatedField && !this.props.field.newField)
        {
            if (details.length > 0)
                details += ', ';

            details += 'Updated';
        }

        return details;
    };

    getDetails(index, expanded) {
        return (
            <Col xs={expanded?3:5}>
                <span id={createFormInputId(DOMAIN_FIELD_DETAILS, index)} className='domain-field-details'>
                    {this.getDetailsText()}
                </span>
            </Col>
        )
    }

    render()
    {
        const {index, field, onChange, onDelete, onExpand, expanded} = this.props;

        return (
            <div className={'domain-field-row ' + (expanded?'domain-row-expanded ':'')}>
                <Row key={createFormInputId("domainrow", index)}>
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
                                    className={'form-control'} onChange={onChange} value={getDataType(field).name}>
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
                                          id={createFormInputId(DOMAIN_FIELD_REQ, index)}
                                          key={createFormInputId(DOMAIN_FIELD_REQ, index)}
                                          checked={field.required} onChange={onChange}/>
                            </Tip>
                        </div>
                    </Col>
                    {this.getDetails(index, expanded)}
                    {expanded &&
                        <>
                        <Col xs={1}>
                            <Button className='domain-row-button domain-row-remove-button'
                            onClick={onDelete} id={createFormInputId(DOMAIN_FIELD_DELETE, index)}>Remove Field</Button>
                        </Col>
                        <Col xs={1}>
                            <Button className='domain-row-button'>Advanced Settings</Button>
                        </Col>
                        </>
                    }
                    <Col xs={1}>
                        {/*<Tip caption={'Advanced Settings'}>*/}
                            <div className='domain-field-advanced-icon pull-right'>
                                <Button onClick={onExpand} id={createFormInputId(DOMAIN_FIELD_ADV, index)}>
                                    <FontAwesomeIcon title={createFormInputId(DOMAIN_FIELD_ADV, index)} icon={faPencilAlt} />
                                </Button>
                            </div>
                        {/*</Tip>*/}
                    </Col>
                </Row>
                {expanded &&
                    <DomainRowExpandedOptions fieldId={index} domainField={field}/>
                }
            </div>
        );
    }
}

