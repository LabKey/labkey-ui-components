import * as React from 'react'
import {Col, Form, FormControl, Panel, Row} from "react-bootstrap";
import {Map} from 'immutable'
import { Alert, AddEntityButton, WizardNavButtons, generateId } from "@glass/base";

import { createSampleSet, updateSampleSet, initSampleSetSelects } from "./actions";
import {
    IParentOption,
    ISampleSetDetails,
    ParentAlias,
} from "./models";
import { LabelOverlay } from "../../components/forms/LabelOverlay";
import {SampleSetParentAliasRow} from "../../components/samples/SampleSetParentAliasRow";

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
    parentAliasInfoUrl?: string
    parentAliasHelperText?: string
    data?: Map<string, any>
}

interface State {
    formValues: ISampleSetDetails
    parentOptions: Array<IParentOption>
    parentAliases: Map<string, ParentAlias>
    error: string
    submitting: boolean
}

export class SampleSetDetailsPanel extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            formValues: undefined,
            parentOptions: undefined,
            parentAliases: undefined,
            error: undefined,
            submitting: false
        }
    }

    init(props: Props) {
        let {parentOptions} = this.state;

        if (!parentOptions) {
            initSampleSetSelects().then((results) => {
                const options = results.map(result => {
                    return {
                        label: result.query,
                        value: 'materialInputs/' + result.query,
                        query: result.query,
                        schema: result.schema,
                    } as IParentOption;
                }).toArray();
                this.setState(
                    (state) => ({
                    formValues: {
                        ...state.formValues
                    } as ISampleSetDetails,
                    parentOptions: options,
                }));
            });

            let parentAliases = Map() as Map<string, ParentAlias>;
            if (props.data && props.data.get('importAliases'))
            {
                let importAliases = Map(props.data.get('importAliases')) || Map() as Map<string,string>;
                importAliases.forEach((val, key) => {
                    const newId = this.generateAliasId();
                    parentAliases = parentAliases.set(newId, {
                        id: newId,
                        alias: key,
                        parentValue: val,
                    } as ParentAlias);
                });
            }

            this.setState(
                (state) => ({
                    formValues: {
                        ...state.formValues
                    } as ISampleSetDetails,
                    parentAliases,
                }));
        }
    }

    componentWillMount() {
        this.init(this.props)
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

        const importAliases = this.getImportAliases();

        if (this.isExistingSampleSet()) {
            const config = {
                isUpdate: true,
                rowId: data.get('rowId'),
                nameExpression: this.getNameExpressionValue(),
                description: this.getDescriptionValue(),
                importAliasJSON: JSON.stringify(importAliases),
            } as ISampleSetDetails;

            updateSampleSet(config)
                .then((response) => this.onFinishSuccess(config))
                .catch((error) => this.onFinishFailure(error ? error.exception : UNKNOWN_ERROR_UPDATE));
        }
        else {
            const config = {
                name: formValues[FORM_IDS.NAME],
                nameExpression: this.getNameExpressionValue(),
                description: this.getDescriptionValue(),
                importAliasJSON: JSON.stringify(importAliases),
            } as ISampleSetDetails;

            createSampleSet(config)
                .then((response) => this.onFinishSuccess(config))
                .catch((error) => this.onFinishFailure(error ? error.exception : UNKNOWN_ERROR_CREATE));
        }
    };

    getImportAliases()
    {
        const {parentAliases} = this.state;
        let aliases = {};
        parentAliases.map((alias: ParentAlias) => {
            aliases[alias.alias] = alias.parentValue;
        });

        return aliases;
    }


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
            return data.get(propName) || defaultValue;
        }

        return defaultValue;
    }

    isExistingSampleSet(): boolean {
        return this.getDataValue(null, 'rowId', undefined) !== undefined;
    }

    getNameExpressionValue(): string {
        return this.getDataValue(FORM_IDS.NAME_EXPRESSION, 'nameExpression', '');
    }

    getDescriptionValue(): string {
        return this.getDataValue(FORM_IDS.DESCRIPTION, 'description', '');
    }

    addParentAlias(): void {
        let {parentAliases} = this.state;

        const newId = this.generateAliasId();
        parentAliases = parentAliases.set(newId, {
            id: newId,
            alias:'',
            parentValue:''
        });

        this.setState({parentAliases});
    }

    //Generates a temporary id for add/delete of the import aliases
    generateAliasId() {
        return generateId("sampleset-parent-import-alias-");
    }

    parentAliasChanged(id:string, field: string, newValue: string) {

        let {parentAliases} = this.state;
        parentAliases.get(id)[field] = newValue;

        this.setState({parentAliases});
    }

    renderParentAliases() {
        const {parentAliases, parentOptions} = this.state;

        if (!parentAliases || !parentOptions)
            return [];

        return parentAliases.valueSeq().map((parentAlias) =>
            <SampleSetParentAliasRow key={parentAlias.id}
                                             id={parentAlias.id}
                                             parentAlias={parentAlias}
                                             parentOptions={parentOptions}
                                             onAliasChange={this.parentAliasChanged.bind(this)}
                                             onRemove={this.removeParentAlias.bind(this)}
            />);
    }

    removeParentAlias(id: string): void {
        let {parentAliases} = this.state;
        if (parentAliases.size === 0)
            return;

        parentAliases = parentAliases.remove(id);
        this.setState((state) => ({
            formValues: {
                ...state.formValues,
            } as ISampleSetDetails,
            parentAliases,
        }));
    }

    renderAddEntityHelper() {
        const {parentAliasHelperText, parentAliasInfoUrl} = this.props;

        return (
            <>
                <span>
                    {parentAliasHelperText}
                    <a href={parentAliasInfoUrl} target='_blank' />
                </span>
            </>
        );
    }

    render() {
        const { onCancel, nameExpressionInfoUrl, parentAliasInfoUrl } = this.props;
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
                            <Row className='margin-bottom'>
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
                            { this.renderParentAliases() }
                            <Row>
                                <Col xs={3}>
                                </Col>
                                <Col xs={9}>
                                    <span>
                                        <AddEntityButton entity="Parent Alias" onClick={this.addParentAlias.bind(this)} /> {/*helperBody={this.renderAddEntityHelper.bind(this)} />*/}
                                    </span>
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
