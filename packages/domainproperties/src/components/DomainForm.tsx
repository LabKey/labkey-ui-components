import * as React from "react";
import {Col, Form, FormControl, Panel, Row} from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import {DomainRow} from "./DomainRow";
import {DomainDesign, DomainField} from "../models";
import {updateDomainField} from "../actions/actions";

interface IDomainFormInput {
    domain: DomainDesign
    onChange: (newDomain: DomainDesign) => any
}

/**
 * Form containing all properties of a domain
 */
export default class DomainForm extends React.Component<IDomainFormInput, any> {

    isValidDomain(domainDesign: DomainDesign): boolean {
        return !!(domainDesign && domainDesign.name);
    }

    onAddField = () => {
        const {domain, onChange} = this.props;

        const newDomain = domain.merge({
            fields: domain.fields.push(new DomainField({
                newField: true,
                renderUpdate: true
            }))
        }) as DomainDesign;

        if (onChange) {
            onChange(newDomain);
        }
    };

    onFieldChange = (evt) => {
        const {domain, onChange} = this.props;

        let value = evt.target.value;
        if (evt.target.type === "checkbox") {
            value = evt.target.checked;
        }

        const newDomain = updateDomainField(domain, evt.target.id, value);

        if (onChange) {
            onChange(newDomain);
        }
    };

    render() {
        const {domain} = this.props;

        return (
            <>
                {this.isValidDomain(domain) ? (
                    <Panel className={"domain-form-panel"}>
                        <Panel.Heading>
                            <div className={"panel-title"}>{"Field Properties - " + domain.name}</div>
                        </Panel.Heading>
                        <Panel.Body>
                            <Row className='domain-form-hdr-row'>
                                <p>Adjust fields and their properties that will be shown within this domain. Click a row
                                    to
                                    access additional options. Drag and drop rows to re-order them.</p>
                            </Row>
                            <Row className='domain-form-search'>
                                <Col xs={3}>
                                    <FormControl id={"dom-search-" + name} type="text" placeholder={'Filter Fields'} disabled={true}/>
                                </Col>
                                <Col xs={1}/>
                                <Col xs={8} md={6} lg={4}>
                                    <Col xs={5} className='domain-zero-padding'>
                                        <span>Show Fields Defined By: </span>
                                    </Col>
                                    <Col xs={7} className='domain-zero-padding'>
                                        <FormControl id={"dom-user-" + name} type="text" placeholder={'User'} disabled={true}/>
                                    </Col>
                                </Col>
                            </Row>
                            <Row className='domain-form-hdr-row'>
                                <Col xs={3}>
                                    <b>Field Name</b>
                                </Col>
                                <Col xs={2}>
                                    <b>Date Type</b>
                                </Col>
                                <Col xs={1}>
                                    <b>Required?</b>
                                </Col>
                                <Col xs={6}>
                                    <b>Details</b>
                                </Col>
                            </Row>
                            <Form>
                                {domain.fields.map((field, index) => {
                                    return <DomainRow
                                        key={'domain-row-key-' + index}
                                        index={index}
                                        onChange={this.onFieldChange}
                                        field={field}
                                    />
                                })}
                            </Form>
                            <Row>
                                <Col xs={12}>
                                    <span className={"domain-form-add"} onClick={this.onAddField}>
                                        <FontAwesomeIcon icon={faPlusCircle} className={"domain-form-add-btn"}/> Add field
                                    </span>
                                </Col>
                            </Row>
                        </Panel.Body>
                    </Panel>
                ) :
                    <Panel className='domain-form-no-field-panel'>No fields have been defined for this list yet.
                        Start by using the “Add Field” button below. Learn more about
                        <a href='https://www.labkey.org/Documentation/wiki-page.view?name=listDefineFields'> creating list designs
                        </a> in our documentation.</Panel>
                }
            </>
        );
    }
}