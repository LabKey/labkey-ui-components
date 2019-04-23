import * as React from "react";
import {Col, Form, FormControl, Panel, Row} from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import {DomainRow} from "./DomainRow";
import {DomainDesign, DomainField} from "../models";

interface IDomainFormInput {
    domain: DomainDesign
    onChange?: (evt: any) => any
    onSubmit?: () => any
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
        });

        if (onChange) {
            onChange(newDomain);
        }
    };

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
                                        onChange={onChange}
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
                ) : <b>Invalid domain</b>}
            </>
        );
    }
}