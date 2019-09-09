import * as React from 'react'
import {Col, Form, FormControl, Panel, Row} from "react-bootstrap";
import {Map} from 'immutable'
import {Alert, AddEntityButton, WizardNavButtons, generateId} from "@glass/base";

import { createSampleSet, updateSampleSet, initSampleSetSelects } from "./actions";
import {
    IParentOption,
    ISampleSetDetails,
    IParentAlias,
} from "./models";
import { LabelOverlay } from "../../components/forms/LabelOverlay";
import {SampleSetParentAliasRow} from "../../components/samples/SampleSetParentAliasRow";
import {PARENT_ALIAS_DOC_URL, PARENT_ALIAS_HELPER_TEXT, SAMPLE_SET_DISPLAY_TEXT} from "../../constants";

const UNKNOWN_ERROR_CREATE = `An unknown error occurred creating the ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`;
const UNKNOWN_ERROR_UPDATE = `An unknown error occurred updating the ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`;

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
    formValues: ISampleSetDetails
    parentOptions: Array<IParentOption>
    parentAliases: Map<string, IParentAlias>
    error: string
    submitting: boolean
}

const NEW_SAMPLE_SET_OPTION : IParentOption = {
    label: `(Current ${SAMPLE_SET_DISPLAY_TEXT})`,
    value: "<{{changeme}}>"
};
const IMPORT_PREFIX :string = 'materialInputs/';

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
                        } as IParentAlias);
                    });
                }

                this.setState(
                    (state) => ({
                    formValues: {
                        ...state.formValues
                    } as ISampleSetDetails,
                    parentOptions: options,
                    parentAliases,
                }));
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
        parentAliases.map((alias: IParentAlias) => {
            aliases[alias.alias] = alias.parentValue !== NEW_SAMPLE_SET_OPTION ?
                alias.parentValue.value:
                IMPORT_PREFIX + this.getSampleSetName();
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
            parentValue: undefined
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
            } as ISampleSetDetails,
            parentAliases,
        }));
    };

    renderAddEntityHelper = ():any => {
        return (
            <>
                <span>
                    {PARENT_ALIAS_HELPER_TEXT}
                    <p><a href={PARENT_ALIAS_DOC_URL} target='_blank' >More info</a></p>
                </span>
            </>
        );
    };

    render() {
        const { onCancel, nameExpressionInfoUrl } = this.props;
        const { submitting, error } = this.state;

        const moreInfoLink = nameExpressionInfoUrl ?
            <p><a target={'_blank'} href={nameExpressionInfoUrl}>More info</a></p> :
            '';

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
                                        description={`The name for this ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}. Note that this can\'t be changed after ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()} creation.`}
                                        required={true}
                                        // addLabelAsterisk={true}  //This causes weirdness, because default isFormsy and required and the form isn't a FormsyForm...
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
                            <Row className={'margin-bottom'}>
                                <Col xs={3}>
                                    <LabelOverlay
                                        label={'Name Expression'}
                                        type={'Text (String)'}
                                        description={`Expression that will be used for generating unique sample IDs for this ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`}
                                        content={moreInfoLink}
                                        canMouseOverTooltip={true}
                                    />
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
                            { this.renderParentAliases() }
                            <Row>
                                <Col xs={3}>
                                </Col>
                                <Col xs={9}>
                                    <span>
                                        <AddEntityButton entity="Parent Alias" onClick={this.addParentAlias} helperBody={this.renderAddEntityHelper} />
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