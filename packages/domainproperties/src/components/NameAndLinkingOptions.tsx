

import * as React from 'react'
import {Col, FormControl, Row} from "react-bootstrap";
import {createFormInputId} from "../actions/actions";
import {DOMAIN_FIELD_DESCRIPTION, DOMAIN_FIELD_IMPORTALIASES, DOMAIN_FIELD_LABEL, DOMAIN_FIELD_URL} from "../constants";
import {LabelHelpTip} from "./LabelHelpTip";
import {Alert} from "@glass/base";
import {DomainField} from "../models";

interface NameAndLinkingProps {
    index: number,
    field: DomainField,
    onChange: (string, any) => any

}

export class NameAndLinkingOptions extends React.PureComponent<NameAndLinkingProps, any> {

    handleChange = (evt: any) => {
        const { onChange } = this.props;

        let value = evt.target.value;
        if (evt.target.type === "checkbox")
        {
            value = evt.target.checked;
        }

        if (onChange)
        {
            onChange(evt.target.id, value);
        }
    };

    render() {
        const { index, field } = this.props;

        return (
            <div>
                <Row className='domain-row-expanded'>
                    <Col xs={12}>
                        <div className={'domain-field-section-heading'}>Name and Linking Options</div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={5}>
                        <div className={'domain-field-label'}>Description</div>
                        <textarea className="form-control" rows={4} value={field.description ? field.description : ''}
                                  id={createFormInputId(DOMAIN_FIELD_DESCRIPTION, index)}
                                  key={createFormInputId(DOMAIN_FIELD_DESCRIPTION, index)}
                                  placeholder={'Add a description'}
                                  onChange={this.handleChange}/>
                    </Col>
                    <Col xs={3}>
                        <div className={'domain-field-label'}>Label</div>
                        <FormControl type="text" value={field.label ? field.label : ''}
                                     id={createFormInputId(DOMAIN_FIELD_LABEL, index)}
                                     key={createFormInputId(DOMAIN_FIELD_LABEL, index)}
                                     onChange={this.handleChange}/>

                        <div className={'domain-field-label'}>Import Aliases {LabelHelpTip({
                            title: 'Test Title',
                            body: 'Test body.'
                        })}</div>
                        <FormControl type="text" value={field.importAliases ? field.importAliases : ''}
                                     id={createFormInputId(DOMAIN_FIELD_IMPORTALIASES, index)}
                                     key={createFormInputId(DOMAIN_FIELD_IMPORTALIASES, index)}
                                     onChange={this.handleChange}/>
                    </Col>
                    <Col xs={4}>
                        <Alert bsStyle={'info'}>Default value options coming soon...</Alert>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={5}>
                        <div className={'domain-field-label'}>URL</div>
                        <FormControl type="text" value={field.URL ? field.URL : ''}
                                     id={createFormInputId(DOMAIN_FIELD_URL, index)}
                                     key={createFormInputId(DOMAIN_FIELD_URL, index)}
                                     onChange={this.handleChange}/>
                    </Col>
                </Row>
            </div>
        )
    }
}