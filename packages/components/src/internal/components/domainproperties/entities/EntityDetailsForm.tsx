import React from 'react';
import { Col, Form, FormControl, Row } from 'react-bootstrap';
import { Map } from 'immutable';

import classNames from 'classnames';

import { DomainFieldLabel } from '../DomainFieldLabel';

import { IEntityDetails } from './models';
import {
    getEntityDescriptionValue,
    getEntityNameExpressionValue,
    getEntityNameValue,
    isExistingEntity,
} from './actions';
import { ENTITY_FORM_IDS } from './constants';
import { NameExpressionPreview } from "../NameExpressionPreview";

export interface EntityDetailsProps {
    noun: string;
    onFormChange: (evt: any) => any;
    warning?: string;
    formValues?: IEntityDetails;
    data?: Map<string, any>;
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;
    nameReadOnly?: boolean;
    showPreviewName?: boolean;
    previewName?: string;
    namePreviewsLoading?: boolean;
    onNameFieldHover?: () => any;
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
            warning,
            showPreviewName,
            previewName,
            onNameFieldHover,
            namePreviewsLoading
        } = this.props;
        const moreInfoLink = nameExpressionInfoUrl ? (
            <p>
                <a target="_blank" href={nameExpressionInfoUrl} rel="noreferrer">
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
                            helpTipBody={`The name for this ${noun.toLowerCase()}. Note that this can\'t be changed after ${noun.toLowerCase()} creation.`}
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
                            helpTipBody={`A short description for this ${noun.toLowerCase()}.`}
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
                        <div onMouseEnter={() => onNameFieldHover?.()}>
                            <DomainFieldLabel
                                label="Naming Pattern"
                                helpTipBody={
                                    <>
                                        <p>Pattern used for generating unique IDs for this {noun.toLowerCase()}.</p>
                                        {
                                            showPreviewName &&
                                            <NameExpressionPreview
                                                previewName={previewName}
                                                isPreviewLoading={namePreviewsLoading}
                                            />
                                        }
                                        {moreInfoLink}
                                    </>
                                }
                            />
                        </div>
                    </Col>
                    <Col xs={10}>
                        <FormControl
                            className={classNames({
                                'naming-pattern-border-warning':
                                    warning !== undefined && !warning.startsWith('Aliquot'),
                            })}
                            id={ENTITY_FORM_IDS.NAME_EXPRESSION}
                            type="text"
                            placeholder={nameExpressionPlaceholder}
                            onChange={onFormChange}
                            defaultValue={getEntityNameExpressionValue(formValues, data)}
                        />
                    </Col>
                </Row>
            </Form>
        );
    }
}
