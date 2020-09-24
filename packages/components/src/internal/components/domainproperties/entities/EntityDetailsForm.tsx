import React from 'react';
import { Col, Form, FormControl, Row } from 'react-bootstrap';
import { Map } from 'immutable';

import { DomainFieldLabel } from '../DomainFieldLabel';

import { IEntityDetails } from './models';
import {
    getEntityDescriptionValue,
    getEntityNameExpressionValue,
    getEntityNameValue,
    isExistingEntity,
} from './actions';
import { ENTITY_FORM_IDS } from './constants';

export interface EntityDetailsProps {
    noun: string;
    onFormChange: (evt: any) => any;
    formValues?: IEntityDetails;
    data?: Map<string, any>;
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;
    nameReadOnly?: boolean;
}

export class EntityDetailsForm extends React.PureComponent<EntityDetailsProps, any> {
    render() {
        const {
            nameExpressionInfoUrl,
            nameExpressionPlaceholder,
            noun,
            onFormChange,
            formValues,
            data,
            nameReadOnly,
        } = this.props;
        const moreInfoLink = nameExpressionInfoUrl ? (
            <p>
                <a target="_blank" href={nameExpressionInfoUrl}>
                    More info
                </a>
            </p>
        ) : (
            ''
        );

        return (
            <Form>
                <Row className="margin-bottom margin-top">
                    <Col xs={2}>
                        <DomainFieldLabel
                            label="Name"
                            required={true}
                            helpTipBody={() =>
                                `The name for this ${noun.toLowerCase()}. Note that this can\'t be changed after ${noun.toLowerCase()} creation.`
                            }
                        />
                    </Col>
                    <Col xs={10}>
                        <FormControl
                            id={ENTITY_FORM_IDS.NAME}
                            type="text"
                            placeholder={`Enter a name for this ${noun.toLowerCase()}`}
                            onChange={onFormChange}
                            value={getEntityNameValue(formValues, data)}
                            disabled={isExistingEntity(formValues, data) || nameReadOnly}
                        />
                    </Col>
                </Row>
                <Row className="margin-bottom">
                    <Col xs={2}>
                        <DomainFieldLabel
                            label="Description"
                            helpTipBody={() => `A short description for this ${noun.toLowerCase()}.`}
                        />
                    </Col>
                    <Col xs={10}>
                        <textarea
                            className="form-control textarea-noresize"
                            id={ENTITY_FORM_IDS.DESCRIPTION}
                            onChange={onFormChange}
                            value={getEntityDescriptionValue(formValues, data)}
                        />
                    </Col>
                </Row>
                <Row className="margin-bottom">
                    <Col xs={2}>
                        <DomainFieldLabel
                            label="Naming Pattern"
                            helpTipBody={() => (
                                <>
                                    <p>Pattern used for generating unique IDs for this {noun.toLowerCase()}.</p>
                                    {moreInfoLink}
                                </>
                            )}
                        />
                    </Col>
                    <Col xs={10}>
                        <FormControl
                            id={ENTITY_FORM_IDS.NAME_EXPRESSION}
                            type="text"
                            placeholder={nameExpressionPlaceholder}
                            onChange={onFormChange}
                            value={getEntityNameExpressionValue(formValues, data)}
                        />
                    </Col>
                </Row>
            </Form>
        );
    }
}
