import * as React from 'react'
import { Col, Form, FormControl, Panel, Row } from "react-bootstrap";
import { WizardNavButtons } from "@glass/base";

import { createSampleSet } from "./actions";
import { ICreateSampleSet } from "./models";
import { LabelOverlay } from "../../components/forms/LabelOverlay";

const FORM_IDS = {
    NAME: 'sample-set-create-name',
    NAME_EXPRESSION: 'sample-set-create-name-expression',
    DESCRIPTION: 'sample-set-create-description',
};

interface Props {
    onCancel: () => void
    onComplete: (name: string) => void
    nameExpressionInfoUrl?: string
}

interface State {
    formValues: {}
    submitting: boolean
}

export class SampleSetCreatePanel extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            formValues: undefined,
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
            } as ICreateSampleSet
        }));
    };

    onFinish = () => {
        const { formValues } = this.state;
        this.setSubmitting(true);

        const config = {
            name: formValues[FORM_IDS.NAME],
            nameExpression: formValues[FORM_IDS.NAME_EXPRESSION],
            description: formValues[FORM_IDS.DESCRIPTION]
        } as ICreateSampleSet;

        createSampleSet(config)
            .then((response) => {
                console.log(response);
                this.props.onComplete(config.name);
            })
            .catch((reason) => {
                console.log(reason);
                this.setSubmitting(false);
            });
    };

    setSubmitting(submitting: boolean) {
        this.setState(() => ({submitting}));
    }

    isFormValid(): boolean {
        const { formValues } = this.state;
        return formValues !== undefined && formValues[FORM_IDS.NAME] !== undefined && formValues[FORM_IDS.NAME].length > 0;
    }

    render() {
        const { onCancel, nameExpressionInfoUrl } = this.props;
        const { submitting } = this.state;

        return (
            <>
                <Panel>
                    <Panel.Body>
                        <Form>
                            <Row>
                                <Col xs={3}>
                                    <LabelOverlay
                                        label={'Name'}
                                        type={'Text (String)'}
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
                            </Row>
                            <Row className={'margin-top'}>
                                <Col xs={3}>
                                    <LabelOverlay
                                        label={'Name Expression'}
                                        type={'Text (String)'}
                                        description={'Used for generating unique sample IDs'}
                                    />
                                    {nameExpressionInfoUrl && <><br/>(<a target={'_blank'} href={nameExpressionInfoUrl}>more info</a>)</>}
                                </Col>
                                <Col xs={9}>
                                    <FormControl
                                        id={FORM_IDS.NAME_EXPRESSION}
                                        type="text"
                                        placeholder={'S-\${now:date}-\${batchRandomId}-\${randomId}'}
                                        onChange={this.onFormChange}
                                    />
                                </Col>
                            </Row>
                            <Row className={'margin-top'}>
                                <Col xs={3}>Description</Col>
                                <Col xs={9}>
                                    <textarea
                                        className="form-control"
                                        id={FORM_IDS.DESCRIPTION}
                                        onChange={this.onFormChange}
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
                    finishText={'Create'}
                    isFinishingText={'Creating...'}
                    canFinish={this.isFormValid()}
                    isFinishing={submitting}
                    nextStep={this.onFinish}
                />
            </>
        )
    }
}