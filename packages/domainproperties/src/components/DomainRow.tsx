import * as React from "react";
import { Row, Col, FormControl, Checkbox } from "react-bootstrap";
import {
    DOMAIN_FIELD_ADV,
    DOMAIN_FIELD_DETAILS,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_REQ,
    DOMAIN_FIELD_TYPE,
    PROP_DESC_TYPES
} from "../constants";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { Tip } from "@glass/base";
import { DomainField } from "../models";
import { createFormInputId, getDataType } from "../actions/actions";

interface IDomainRowDisplay {
    index: number,
    field: DomainField,
    onChange: (any) => any
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
    getDetails = (): string =>
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

    render()
    {
        const {index, field, onChange} = this.props;

        return (

            <Row className='domain-field-row' key={createFormInputId("domainrow", index)}>
                <Col xs={3}>
                    <Tip caption={'Name'}>
                        <FormControl id={createFormInputId(DOMAIN_FIELD_NAME, index)} type="text"
                                     value={field.name} onChange={onChange}/>
                    </Tip>
                </Col>
                <Col xs={2}>
                    <Tip caption={'Data Type'}>
                        <select id={createFormInputId(DOMAIN_FIELD_TYPE, index)}
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
                                      checked={field.required} onChange={onChange}/>
                        </Tip>
                    </div>
                </Col>
                <Col xs={5}>
                <span id={createFormInputId(DOMAIN_FIELD_DETAILS, index)} className='domain-field-details'>
                    {this.getDetails()}
                </span>
                </Col>
                <Col xs={1}>
                    <Tip caption={'Advanced Settings'}>
                        <div className='domain-field-advanced-icon pull-right' id={createFormInputId(DOMAIN_FIELD_ADV, index)}>
                            <FontAwesomeIcon icon={faPencilAlt}/>
                        </div>
                    </Tip>
                </Col>
            </Row>
        );
    }
}

