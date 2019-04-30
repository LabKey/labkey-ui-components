import * as React from "react";
import {Col, Form, FormControl, Panel, Row} from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlusCircle } from '@fortawesome/free-solid-svg-icons';
import {DomainRow} from "./DomainRow";
import {DomainDesign, DomainField} from "../models";
import {getIndexFromId, updateDomainField} from "../actions/actions";

interface IDomainFormInput {
    domain: DomainDesign
    onChange: (newDomain: DomainDesign) => any
    helpURL: string
    helpNoun: string
}

interface IDomainFormState {
    idCount: number,
    expanded: number
}

/**
 * Form containing all properties of a domain
 */
export default class DomainForm extends React.Component<IDomainFormInput, IDomainFormState> {

    constructor(props)
    {
        super(props);

        this.state = {
            idCount: 0,
            expanded: undefined
        };

    }

    isValidDomain(domainDesign: DomainDesign): boolean {
        return !!(domainDesign);
    }

    onFieldExpand = (evt: any) => {
        const { domain, onChange } = this.props;
        const prevExpanded = this.state.expanded;

        // Bit of a hack to work with fontawesome svg icon
        const id = evt.target.id || evt.target.parentElement.id || evt.target.parentElement.parentElement.id;
        let index = -1;
        if (!!id) {
            index = parseInt(getIndexFromId(id));
        }

        this.setState(() => ({
            expanded: (this.state.expanded === index ? null : index)
        }));

        const newFields = domain.fields.map((field) => {
            if (field.displayId === index || field.displayId === prevExpanded) {
                return field.set("renderUpdate", true);
            }
            return field.set("renderUpdate", false);
        });

        const newDomain = domain.merge({
            fields: newFields
        }) as DomainDesign;

        if (onChange) {
            onChange(newDomain);
        }
    };

    onDeleteField = (evt) => {
        const {domain, onChange} = this.props;
        const index = parseInt(getIndexFromId(evt.target.id));

        const newFields = domain.fields.filter((field) => {
            return field.displayId !== index;
        });

        const newDomain = domain.merge({
            fields: newFields
        }) as DomainDesign;

        if (onChange) {
            onChange(newDomain);
        }
    };

    onAddField = () => {
        const {domain, onChange} = this.props;
        let alreadyTaken;
        let index = this.state.idCount;

        // Loop through and find next not taken displayId integer
        do {
            index++;
            alreadyTaken = domain.fields.reduce((accum, field) => {
                return accum || (field.displayId === index)
            }, false)
        } while(alreadyTaken);

        this.setState({idCount: index});

        const newDomain = domain.merge({
            fields: domain.fields.push(new DomainField({
                newField: true,
                renderUpdate: true,
                displayId: index
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

    getAddFieldButton() {
        return (
            <Row>
                <Col xs={12}>
                    <span className={"domain-form-add"} onClick={this.onAddField}>
                        <FontAwesomeIcon icon={faPlusCircle} className={"domain-form-add-btn"}/> Add field
                    </span>
                </Col>
            </Row>
        )
    }

    render() {
        const {domain, helpURL, helpNoun} = this.props;

        return (
            <>
                {this.isValidDomain(domain) ? (
                    <Panel className={"domain-form-panel"}>
                        <Panel.Heading>
                            <div className={"panel-title"}>{"Field Properties" + (domain.name ? " - " + domain.name : '')}</div>
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
                            {domain.fields.size > 0 ?
                                <>
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
                                            let index = typeof field.displayId !== 'undefined' ? field.displayId : field.propertyId;
                                            return <DomainRow
                                                key={'domain-row-key-' + index}
                                                onChange={this.onFieldChange}
                                                field={field}
                                                onExpand={this.onFieldExpand}
                                                onDelete={this.onDeleteField}
                                                expanded={this.state.expanded === index}
                                                index={index}
                                            />
                                        })}
                                    </Form>
                                </>
                                :
                                <>
                                    <Panel className='domain-form-no-field-panel'>{'No fields have been defined for this '
                                        + helpNoun + ' yet. Start by using the “Add Field” button below. Learn more about '}
                                        <a href={helpURL}>{' creating ' + helpNoun + ' designs '}
                                        </a> in our documentation.
                                    </Panel>
                                </>
                            }
                            {this.getAddFieldButton()}
                        </Panel.Body>
                    </Panel>
                ) :
                    <Panel className='.domain-form-panel'>
                        <Panel.Body>
                            <Panel className='domain-form-no-field-panel'>Invalid domain design.</Panel>
                            {this.getAddFieldButton()}
                        </Panel.Body>
                    </Panel>
                }
            </>
        );
    }
}