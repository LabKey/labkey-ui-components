import React from 'react';
import { Col, Form, FormControl, Row } from 'react-bootstrap';
import { Map } from 'immutable';
import { IEntityDetails } from './models';
import { LabelOverlay } from '../../../components/forms/LabelOverlay';
import {
    getEntityDescriptionValue,
    getEntityNameExpressionValue,
    getEntityNameValue,
    isExistingEntity
} from "./actions";
import { ENTITY_FORM_IDS } from "./constants";

export interface EntityDetailsProps {
    noun: string
    onFormChange: (evt: any) => any
    formValues?: IEntityDetails
    data?: Map<string, any>
    nameExpressionInfoUrl?: string
    nameExpressionPlaceholder?: string
}

export class EntityDetailsForm extends React.PureComponent<EntityDetailsProps, any> {

    render() {
        const { nameExpressionInfoUrl, nameExpressionPlaceholder, noun, onFormChange, formValues, data } = this.props;
        const moreInfoLink = nameExpressionInfoUrl ? <p><a target={'_blank'} href={nameExpressionInfoUrl}>More info</a></p> : '';

        return (
            <Form>
                <Row className={'margin-bottom'}>
                    <Col xs={3}>
                        <LabelOverlay
                            isFormsy={false}
                            labelClass={'entity-form--overlaylabel'}
                            label={'Name'}
                            type={'Text (String)'}
                            description={`The name for this ${noun.toLowerCase()}. Note that this can\'t be changed after ${noun.toLowerCase()} creation.`}
                            required={true}
                            canMouseOverTooltip={true}
                        />
                    </Col>
                    <Col xs={9}>
                        <FormControl
                            id={ENTITY_FORM_IDS.NAME}
                            type="text"
                            placeholder={`Enter a name for this ${noun.toLowerCase()}`}
                            onChange={onFormChange}
                            value={getEntityNameValue(formValues, data)}
                            disabled={isExistingEntity(formValues, data)}
                        />
                    </Col>
                </Row>
                <Row className='margin-bottom'>
                    <Col xs={3}>
                        <LabelOverlay
                            label={'Description'}
                            type={'Text (String)'}
                            description={`A short description for this ${noun.toLowerCase()}.`}
                            canMouseOverTooltip={true}
                        />
                    </Col>
                    <Col xs={9}>
                        <textarea
                            className="form-control textarea-noresize"
                            id={ENTITY_FORM_IDS.DESCRIPTION}
                            onChange={onFormChange}
                            value={getEntityDescriptionValue(formValues, data)}
                        />
                    </Col>
                </Row>
                <Row className={'margin-bottom'}>
                    <Col xs={3}>
                        <LabelOverlay
                            label={'Naming Pattern'}
                            type={'Text (String)'}
                            description={`Pattern used for generating unique IDs for this ${noun.toLowerCase()}.`}
                            content={moreInfoLink}
                            canMouseOverTooltip={true}
                        />
                    </Col>
                    <Col xs={9}>
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
        )
    }
}
