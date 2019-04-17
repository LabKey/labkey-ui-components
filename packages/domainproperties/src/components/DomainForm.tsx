import * as React from "react";
import {Col, Form, FormControl, Panel, Row} from "react-bootstrap";
import {DomainRow} from "./DomainRow";
import {DomainDesign, DomainFormInput, IDomainFormInput} from "../models";

interface IDomainFormState {
    domainDesign: DomainDesign,
    id: string
}

/**
 * Form containing all properties of a domain
 */
export default class DomainForm extends React.Component<IDomainFormInput, IDomainFormState> {

    constructor(props: DomainFormInput) {
        super(props);

    }

    isValidDomain(domainDesign) {
        let valid = true;
        if (!domainDesign || !domainDesign.name) {
            valid = false;
        }

        return valid;
    }

    render() {
        const {domain, onChange} = this.props;

        return (
            <>
                {this.isValidDomain(domain) ? (
                    <Panel>
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
                                    <FormControl id={"dom-search-" + name} type="text" placeholder={'Filter Fields'}/>
                                </Col>
                                <Col xs={1}/>
                                <Col xs={8} md={6} lg={4}>
                                    <Col xs={5} className='domain-zero-padding'>
                                        <span>Show Fields Defined By: </span>
                                    </Col>
                                    <Col xs={7} className='domain-zero-padding'>
                                        <FormControl id={"dom-user-" + name} type="text" placeholder={'User'}/>
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
                                {domain.fields.map((field) => {
                                    return <DomainRow
                                        key={'domain-row-key-' + field.propertyId}
                                        onChange={onChange}
                                        field={field}
                                    />
                                })}
                            </Form>
                        </Panel.Body>
                    </Panel>
                ) : <b>Invalid domain</b>}
            </>
        );
    }
}