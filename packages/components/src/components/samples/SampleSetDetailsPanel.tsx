import React from 'react';
import { Col, Form, FormControl, Panel, Row } from 'react-bootstrap';
import { Map } from 'immutable';

import { createSampleSet, initSampleSetSelects, updateSampleSet } from './actions';
import { IParentAlias, IParentOption, IEntityTypeDetails } from '../entities/models';
import { LabelOverlay } from '../../components/forms/LabelOverlay';
import { SampleSetParentAliasRow } from '../../components/samples/SampleSetParentAliasRow';
import { PARENT_ALIAS_HELPER_TEXT, SAMPLE_SET_DISPLAY_TEXT } from '../../constants';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { WizardNavButtons } from '../buttons/WizardNavButtons';
import { generateId } from '../../util/utils';
import { Alert } from '../base/Alert';
import { getActionErrorMessage, resolveErrorMessage } from "../../util/messaging";
import { DERIVE_SAMPLES_ALIAS_TOPIC, helpLinkNode } from '../../util/helpLinks';

const CREATE_ERROR = getActionErrorMessage(`There was a problem creating the ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`, SAMPLE_SET_DISPLAY_TEXT.toLowerCase());
const UPDATE_ERROR = getActionErrorMessage(`There was a problem updating the ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`, SAMPLE_SET_DISPLAY_TEXT.toLowerCase());

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
    nameExpressionPlaceholder?: string
}

interface State {
    formValues: IEntityTypeDetails
    parentOptions: Array<IParentOption>
    parentAliases: Map<string, IParentAlias>
    error: React.ReactNode
    submitting: boolean
}

const NEW_SAMPLE_SET_OPTION : IParentOption = {
    label: `(Current ${SAMPLE_SET_DISPLAY_TEXT})`,
    value: "{{this_sample_set}}"
};

const IMPORT_PREFIX :string = 'materialInputs/';

export class SampleSetDetailsPanel extends React.Component<Props, State> {

    static defaultProps = {
        nameExpressionPlaceholder: 'S-\${now:date}-\${dailySampleCount}'
    };

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
        const isUpdate = this.isExistingSampleSet();
        const name = this.getSampleSetName();

        if (!parentOptions) {
            initSampleSetSelects(isUpdate, name, NEW_SAMPLE_SET_OPTION, IMPORT_PREFIX).then((results) => {
                const options = results.toArray();

                let parentAliases = Map<string, IParentAlias>();
                if (props.data && props.data.get('importAliases'))
                {
                    let importAliases = Map<string,string>(props.data.get('importAliases'));
                    importAliases.forEach((val, key) => {
                        const newId = SampleSetDetailsPanel.generateAliasId();
                        parentAliases = parentAliases.set(newId, {
                            id: newId,
                            alias: key,
                            parentValue: options.find(opt => opt.value === val),
                            ignoreAliasError: false,
                            ignoreSelectError: false,
                        } as IParentAlias);
                    });
                }

                this.setState((state) => ({
                    formValues: {
                        ...state.formValues
                    } as IEntityTypeDetails,
                    parentOptions: options,
                    parentAliases
                }));
            }).catch((reason) => {
                console.error(reason);
                this.setState(() => ({
                    parentOptions: [NEW_SAMPLE_SET_OPTION]
                }))
            });
        }
    }

    componentWillMount() {
        this.init(this.props);
    }

    onFormChange = (evt: any) => {
        const id = evt.target.id;
        const value = evt.target.value;
        this.setState((state) => ({
            formValues: {
                ...state.formValues,
                [id]: value
            } as IEntityTypeDetails
        }));
    };

    onFinish = () => {
        const { beforeFinish, data } = this.props;
        const { formValues } = this.state;
        this.setSubmitting(true);

        if (beforeFinish) {
            beforeFinish(formValues);
        }

        const { importAliasKeys, importAliasValues } = this.getImportAliases();

        if (this.isExistingSampleSet()) {
            const config = {
                isUpdate: true,
                rowId: data.get('rowId'),
                nameExpression: this.getNameExpressionValue(),
                description: this.getDescriptionValue(),
                importAliasKeys,
                importAliasValues,
            } as IEntityTypeDetails;

            updateSampleSet(config)
                .then((response) => this.onFinishSuccess(config))
                .catch((error) => {
                    console.error(error);
                    this.onFinishFailure( resolveErrorMessage(error, "sample type", undefined, "update") || UPDATE_ERROR)
                });
        }
        else {
            const config = {
                name: formValues[FORM_IDS.NAME],
                nameExpression: this.getNameExpressionValue(),
                description: this.getDescriptionValue(),
                importAliasKeys,
                importAliasValues,
            } as IEntityTypeDetails;

            createSampleSet(config)
                .then((response) => this.onFinishSuccess(config))
                .catch((error) => {
                    console.error(error);
                    this.onFinishFailure( resolveErrorMessage(error, "sample type") ||  CREATE_ERROR);
                });
        }
    };

    getImportAliases() {
        const { parentAliases } = this.state;

        let importAliasKeys = [];
        let importAliasValues = [];

        if (parentAliases) {
            parentAliases.map((alias: IParentAlias) => {
                importAliasKeys.push(alias.alias);
                importAliasValues.push(alias.parentValue.value);
            });
        }

        return {importAliasKeys, importAliasValues};
    }


    onFinishSuccess(response: any) {
        this.setSubmitting(false);
        this.props.onComplete(response);
    }

    onFinishFailure(error: React.ReactNode) {
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

    /**
     * Check if IParentAlias is invalid
     * @param alias
     */
    static parentAliasInvalid(alias: IParentAlias): boolean {
        if (!alias)
            return true;

        //return true if alias is null or blank; or if parentValue option is not set
        return !alias.alias || alias.alias.trim() === '' || !alias.parentValue;
    }

    isFormValid(): boolean {
        const { formValues, parentAliases } = this.state;
        const hasValidName = formValues !== undefined && formValues[FORM_IDS.NAME] !== undefined && formValues[FORM_IDS.NAME].length > 0;

        //Check if there are any parent aliases, and if any are invalid (either field blank)
        const hasInvalidAliases =
            parentAliases
            && parentAliases.size > 0
            && parentAliases.find(SampleSetDetailsPanel.parentAliasInvalid);

        return (this.isExistingSampleSet() || hasValidName) && !hasInvalidAliases;
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

    getSampleSetName(): string {
        return this.getDataValue(FORM_IDS.NAME, 'name', '');
    }

    getNameExpressionValue(): string {
        return this.getDataValue(FORM_IDS.NAME_EXPRESSION, 'nameExpression', '');
    }

    getDescriptionValue(): string {
        return this.getDataValue(FORM_IDS.DESCRIPTION, 'description', '');
    }

    addParentAlias = (): void => {
        let {parentAliases} = this.state;
        parentAliases = parentAliases || Map<string, IParentAlias>();

        const newId = SampleSetDetailsPanel.generateAliasId();
        parentAliases = parentAliases.set(newId, {
            id: newId,
            alias:'',
            parentValue: undefined,
            ignoreAliasError: true,
            ignoreSelectError: true,
        });

        this.setState({parentAliases});
    };

    //Generates a temporary id for add/delete of the import aliases
    static generateAliasId() {
        return generateId("sampleset-parent-import-alias-");
    }

    parentAliasChanges = (id:string, field: string, newValue: any): void => {

        let {parentAliases} = this.state;
        parentAliases.get(id)[field] = newValue;

        this.setState({parentAliases});
    };

    renderParentAliases() {
        const {parentAliases, parentOptions} = this.state;

        if (!parentAliases || !parentOptions)
            return [];

        return parentAliases.valueSeq().map((parentAlias) =>
            <SampleSetParentAliasRow
                key={parentAlias.id}
                id={parentAlias.id}
                parentAlias={parentAlias}
                parentOptions={parentOptions}
                onAliasChange={this.parentAliasChanges}
                onRemove={this.removeParentAlias}
            />
        );
    }

    removeParentAlias = (id: string): void => {
        let {parentAliases} = this.state;
        if (parentAliases.size === 0)
            return;

        parentAliases = parentAliases.remove(id);
        this.setState((state) => ({
            formValues: {
                ...state.formValues,
            } as IEntityTypeDetails,
            parentAliases,
        }));
    };

    renderAddEntityHelper = ():any => {
        return (
            <>
                <span>
                    {PARENT_ALIAS_HELPER_TEXT}
                    <p>{helpLinkNode(DERIVE_SAMPLES_ALIAS_TOPIC, "More info")}</p>
                </span>
            </>
        );
    };

    render() {
        const { onCancel, nameExpressionInfoUrl, nameExpressionPlaceholder } = this.props;
        const { submitting, error, parentOptions } = this.state;

        const moreInfoLink = nameExpressionInfoUrl ?
            <p><a target={'_blank'} href={nameExpressionInfoUrl}>More info</a></p> :
            '';

        return (
            <>
                {error && <Alert>{error}</Alert>}
                <Panel>
                    <Panel.Body>
                        <div className={'sample-insert--headerhelp'}>
                            Sample types help you organize samples in your lab and allow you to add properties for easy tracking of data.
                        </div>
                        <Form>
                            {!this.isExistingSampleSet() && <Row className={'margin-bottom'}>
                                <Col xs={3}>
                                    <LabelOverlay
                                        isFormsy={false}
                                        labelClass={'sample-insert--overlaylabel'}
                                        label={'Name'}
                                        type={'Text (String)'}
                                        description={`The name for this ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}. Note that this can\'t be changed after ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()} creation.`}
                                        required={true}
                                        canMouseOverTooltip={true}
                                    />
                                </Col>
                                <Col xs={9}>
                                    <FormControl
                                        id={FORM_IDS.NAME}
                                        type="text"
                                        placeholder={`Enter a name for this ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}`}
                                        onChange={this.onFormChange}
                                    />
                                </Col>
                            </Row>}
                            <Row className='margin-bottom'>
                                <Col xs={3}>
                                    <LabelOverlay
                                        label={'Description'}
                                        type={'Text (String)'}
                                        description={`A short description for this ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`}
                                        canMouseOverTooltip={true}
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
                            <Row className={'margin-bottom'}>
                                <Col xs={3}>
                                    <LabelOverlay
                                        label={'Naming Pattern'}
                                        type={'Text (String)'}
                                        description={`Pattern used for generating unique sample IDs for this ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`}
                                        content={moreInfoLink}
                                        canMouseOverTooltip={true}
                                    />
                                </Col>
                                <Col xs={9}>
                                    <FormControl
                                        id={FORM_IDS.NAME_EXPRESSION}
                                        type="text"
                                        placeholder={nameExpressionPlaceholder}
                                        onChange={this.onFormChange}
                                        value={this.getNameExpressionValue()}
                                    />
                                </Col>
                            </Row>
                            { this.renderParentAliases() }
                            { parentOptions &&
                                <Row>
                                    <Col xs={3}>
                                    </Col>
                                    <Col xs={9}>
                                        <span>
                                            <AddEntityButton entity="Parent Alias" onClick={this.addParentAlias} helperBody={this.renderAddEntityHelper} />
                                        </span>
                                    </Col>
                                </Row>
                            }
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
                    finishText={"Save"}
                    isFinishingText={"Saving..."}
                />
            </>
        )
    }
}
