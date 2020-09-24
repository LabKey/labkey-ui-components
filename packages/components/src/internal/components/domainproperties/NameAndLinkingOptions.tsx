import React from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';

import { helpLinkNode, URL_ENCODING_TOPIC } from '../../util/helpLinks';

import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, createFormInputName } from './actions';
import {
    DOMAIN_FIELD_DESCRIPTION,
    DOMAIN_FIELD_IMPORTALIASES,
    DOMAIN_FIELD_LABEL,
    DOMAIN_FIELD_URL,
} from './constants';
import { DomainField } from './models';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

interface NameAndLinkingProps {
    index: number;
    domainIndex: number;
    field: DomainField;
    onChange: (string, any) => any;
}

export class NameAndLinkingOptions extends React.PureComponent<NameAndLinkingProps, any> {
    handleChange = (evt: any) => {
        const { onChange } = this.props;

        if (onChange) {
            onChange(evt.target.id, evt.target.value);
        }
    };

    getImportAliasHelpText = () => {
        return (
            <>
                Define alternate field names to be used when importing from a file.
                <br />
                <br />
                Multiple aliases may be separated by spaces or commas. To define an alias that contains spaces, use
                double-quotes (") around it.
            </>
        );
    };

    getURLHelpText = () => {
        return (
            <>
                Use this to change the display of the field value within a data grid into a link. Multiple formats are
                supported, which allows ways to easily substitute and link to other locations in LabKey.
                <br />
                <br />
                Learn more about using {helpLinkNode(URL_ENCODING_TOPIC, 'URL Formatting Options')}.
            </>
        );
    };

    render() {
        const { index, field, domainIndex } = this.props;

        return (
            <div>
                <Row className="domain-row-expanded">
                    <Col xs={12}>
                        <SectionHeading title="Name and Linking Options" cls="domain-field-section-hdr" />
                    </Col>
                </Row>
                <Row className="domain-row-expanded">
                    <div>
                        <Col xs={5}>
                            <div className="domain-field-label">Description</div>
                            <FormControl
                                componentClass="textarea"
                                className="form-control textarea-noresize"
                                rows={4}
                                value={field.description || ''}
                                id={createFormInputId(DOMAIN_FIELD_DESCRIPTION, domainIndex, index)}
                                name={createFormInputName(DOMAIN_FIELD_DESCRIPTION)}
                                onChange={this.handleChange}
                                disabled={isFieldFullyLocked(field.lockType)}
                            />
                        </Col>
                        <Col xs={3}>
                            <div className="domain-field-label">Label</div>
                            <FormControl
                                type="text"
                                value={field.label || ''}
                                id={createFormInputId(DOMAIN_FIELD_LABEL, domainIndex, index)}
                                name={createFormInputName(DOMAIN_FIELD_LABEL)}
                                onChange={this.handleChange}
                                disabled={isFieldFullyLocked(field.lockType)}
                            />
                            <div className="domain-field-label">
                                <DomainFieldLabel label="Import Aliases" helpTipBody={this.getImportAliasHelpText} />
                            </div>
                            <FormControl
                                type="text"
                                value={field.importAliases || ''}
                                id={createFormInputId(DOMAIN_FIELD_IMPORTALIASES, domainIndex, index)}
                                name={createFormInputName(DOMAIN_FIELD_IMPORTALIASES)}
                                onChange={this.handleChange}
                                disabled={isFieldFullyLocked(field.lockType)}
                            />
                        </Col>
                        <Col xs={4}>
                            <div className="domain-field-label">
                                <DomainFieldLabel label="URL" helpTipBody={this.getURLHelpText} />
                            </div>
                            <FormControl
                                type="text"
                                value={field.URL || ''}
                                id={createFormInputId(DOMAIN_FIELD_URL, domainIndex, index)}
                                name={createFormInputName(DOMAIN_FIELD_URL)}
                                onChange={this.handleChange}
                                disabled={isFieldFullyLocked(field.lockType)}
                            />
                        </Col>
                    </div>
                </Row>
            </div>
        );
    }
}
