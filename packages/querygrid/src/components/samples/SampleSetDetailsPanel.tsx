import * as React from 'react'
import { Col, Form, FormControl, Panel, Row } from "react-bootstrap";
import { Map } from 'immutable'
import { Alert, WizardNavButtons } from "@glass/base";

import { createSampleSet, updateSampleSet } from "./actions";
import { ISampleSetDetails } from "./models";
import { LabelOverlay } from "../../components/forms/LabelOverlay";

const UNKNOWN_ERROR_CREATE = 'An unknown error occurred creating the sample set.';
const UNKNOWN_ERROR_UPDATE = 'An unknown error occurred updating the sample set.';

export const FORM_IDS = {
    NAME: 'sample-set-create-name',
    NAME_EXPRESSION: 'sample-set-create-name-expression',
    DESCRIPTION: 'sample-set-create-description',
};

interface Props {
    onCancel: () => void
    onComplete: (response: any) => void
    beforeFinish?: (formValues: {}) => void
    nameExpressionInfoUrl?: string
    data?: Map<string, any>
}

interface State {
    formValues: {}
    error: string
    submitting: boolean
}

export class SampleSetDetailsPanel extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            formValues: undefined,
            error: undefined,
            submitting: false
        }
    }

    onFormChange = (evt: any) => {
        const id = evt.target.id;
        const value = evt.target.value;
        this.setState((state) => ({
            formValues: {
                ...state.formValues,
                [id]: value
            } as ISampleSetDetails
        }));
    };

    onFinish = () => {
        const { beforeFinish, data } = this.props;
        const { formValues } = this.state;
        this.setSubmitting(true);

        if (beforeFinish) {
            beforeFinish(formValues);
        }

        if (this.isExistingSampleSet()) {
            const config = {
                rowId: data.getIn(['RowId', 'value']),
                nameExpression: this.getNameExpressionValue(),
                description: this.getDescriptionValue()
            } as ISampleSetDetails;

            updateSampleSet(config)
                .then((response) => this.onFinishSuccess(config))
                .catch((error) => this.onFinishFailure(error ? error.exception : UNKNOWN_ERROR_UPDATE));
        }
        else {
            const config = {
                name: formValues[FORM_IDS.NAME],
                nameExpression: this.getNameExpressionValue(),
                description: this.getDescriptionValue()
            } as ISampleSetDetails;

            createSampleSet(config)
                .then((response) => this.onFinishSuccess(config))
                .catch((error) => this.onFinishFailure(error ? error.exception : UNKNOWN_ERROR_CREATE));
        }
    };

    onFinishSuccess(response: any) {
        this.setSubmitting(false);
        this.props.onComplete(response);
    }

    onFinishFailure(error: string) {
        this.setState(() => ({
            error,
            submitting: false
        }));
    }

    setSubmitting(submitting: boolean) {
        this.setState(() => ({
            error: undefined,
            submitting
        }));
    }

    isFormValid(): boolean {
        const { formValues } = this.state;
        const hasValidName = formValues !== undefined && formValues[FORM_IDS.NAME] !== undefined && formValues[FORM_IDS.NAME].length > 0;
        return this.isExistingSampleSet() || hasValidName;
    }

    getDataValue(key: string, propName: string, defaultValue: any): any {
        const { data } = this.props;
        const { formValues } = this.state;

        if (key && formValues && formValues[key] !== undefined) {
            return formValues[key] || defaultValue;
        }
        else if (data) {
            return data.getIn([propName, 'value']) || defaultValue;
        }

        return defaultValue;
    }

    isExistingSampleSet(): boolean {
        return this.getDataValue(null, 'RowId', undefined) !== undefined;
    }

    getNameExpressionValue(): string {
        return this.getDataValue(FORM_IDS.NAME_EXPRESSION, 'NameExpression', '');
    }

    getDescriptionValue(): string {
        return this.getDataValue(FORM_IDS.DESCRIPTION, 'Description', '');
    }

    render() {
        const { onCancel, nameExpressionInfoUrl } = this.props;
        const { submitting, error } = this.state;

        return (
            <>
                {error && <Alert>{error}</Alert>}
                <Panel>
                    <Panel.Body>
                        <Form>
                            {!this.isExistingSampleSet() && <Row className={'margin-bottom'}>
                                <Col xs={3}>
                                    <LabelOverlay
                                        label={'Name *'}
                                        type={'Text (String)'}
                                        description={'The name for this sample set. Note that this can\'t be changed after sample set creation.'}
                                        required={true}
                                    />
                                </Col>
                                <Col xs={9}>
                                    <FormControl
                                        id={FORM_IDS.NAME}
                                        type="text"
                                        placeholder={'Enter a name for this sample set'}
                                        onChange={this.onFormChange}
                                    />
                                </Col>
                            </Row>}
                            <Row className={'margin-bottom'}>
                                <Col xs={3}>
                                    <LabelOverlay
                                        label={'Name Expression'}
                                        type={'Text (String)'}
                                        description={'Expression that will be used for generating unique sample IDs for this sample set.'}
                                    />
                                    {nameExpressionInfoUrl && <><br/>(<a target={'_blank'} href={nameExpressionInfoUrl}>more info</a>)</>}
                                </Col>
                                <Col xs={9}>
                                    <FormControl
                                        id={FORM_IDS.NAME_EXPRESSION}
                                        type="text"
                                        placeholder={'S-\${now:date}-\${batchRandomId}-\${randomId}'}
                                        onChange={this.onFormChange}
                                        value={this.getNameExpressionValue()}
                                    />
                                </Col>
                            </Row>
                            <Row>
                                <Col xs={3}>
                                    <LabelOverlay
                                        label={'Description'}
                                        type={'Text (String)'}
                                        description={'A short description for this sample set.'}
                                    />
                                </Col>
                                <Col xs={9}>
                                    <textarea
                                        className="form-control"
                                        id={FORM_IDS.DESCRIPTION}
                                        onChange={this.onFormChange}
                                        value={this.getDescriptionValue()}
                                    />
                                </Col>
                            </Row>
                        </Form>
                    </Panel.Body>
                </Panel>
                <WizardNavButtons
                    containerClassName=""
                    cancel={onCancel}
                    finish={true}
                    canFinish={this.isFormValid()}
                    isFinishing={submitting}
                    nextStep={this.onFinish}
                />
            </>
        )
    }
}