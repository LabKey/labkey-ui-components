import React from 'react';
import { Col, Panel, Row } from 'react-bootstrap';
import { Map } from 'immutable';

import { createSampleSet, initSampleSetSelects, updateSampleSet } from './actions';
import { IParentAlias, IParentOption, ISampleSetDetails } from './models';
import { SampleSetParentAliasRow } from '../../components/samples/SampleSetParentAliasRow';
import { PARENT_ALIAS_HELPER_TEXT, SAMPLE_SET_DISPLAY_TEXT } from '../../constants';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { WizardNavButtons } from '../buttons/WizardNavButtons';
import { generateId } from '../../util/utils';
import { Alert } from '../base/Alert';
import { getActionErrorMessage, resolveErrorMessage } from "../../util/messaging";
import { DERIVE_SAMPLES_ALIAS_TOPIC, helpLinkNode } from '../../util/helpLinks';
import { EntityDetailsForm } from "../domainproperties/entities/EntityDetailsForm";
import {
    getEntityDescriptionValue,
    getEntityNameExpressionValue,
    getEntityNameValue,
    isEntityFormValid,
    isExistingEntity
} from "../domainproperties/entities/actions";

const CREATE_ERROR = getActionErrorMessage(`There was a problem creating the ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`, SAMPLE_SET_DISPLAY_TEXT.toLowerCase());
const UPDATE_ERROR = getActionErrorMessage(`There was a problem updating the ${SAMPLE_SET_DISPLAY_TEXT.toLowerCase()}.`, SAMPLE_SET_DISPLAY_TEXT.toLowerCase());

interface Props {
    onCancel: () => void
    onComplete: (response: any) => void
    beforeFinish?: (formValues: {}) => void
    nameExpressionInfoUrl?: string
    data?: Map<string, any>
    nameExpressionPlaceholder?: string
}

interface State {
    formValues: ISampleSetDetails
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
        const { data } = this.props;
        const { parentOptions, formValues } = this.state;
        const isUpdate = isExistingEntity(formValues, data);
        const name = getEntityNameValue(formValues, data);

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
                    } as ISampleSetDetails,
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
            } as ISampleSetDetails
        }));
    };

    onFinish = () => {
        const { beforeFinish, data } = this.props;
        const { formValues } = this.state;
        const name = getEntityNameValue(formValues, data);
        const nameExpression = getEntityNameExpressionValue(formValues, data);
        const description = getEntityDescriptionValue(formValues, data);
        const { importAliasKeys, importAliasValues } = this.getImportAliases();

        this.setSubmitting(true);
        if (beforeFinish) {
            beforeFinish(formValues);
        }

        if (isExistingEntity(formValues, data)) {
            const config = {
                isUpdate: true,
                rowId: data.get('rowId'),
                nameExpression,
                description,
                importAliasKeys,
                importAliasValues,
            } as ISampleSetDetails;

            updateSampleSet(config)
                .then((response) => this.onFinishSuccess(config))
                .catch((error) => {
                    console.error(error);
                    this.onFinishFailure( resolveErrorMessage(error, "sample type", undefined, "update") || UPDATE_ERROR)
                });
        }
        else {
            const config = {
                name,
                nameExpression,
                description,
                importAliasKeys,
                importAliasValues,
            } as ISampleSetDetails;

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
        const { data } = this.props;
        const { formValues, parentAliases } = this.state;

        //Check if there are any parent aliases, and if any are invalid (either field blank)
        const hasInvalidAliases =
            parentAliases
            && parentAliases.size > 0
            && parentAliases.find(SampleSetDetailsPanel.parentAliasInvalid);

        return isEntityFormValid(formValues, data) && !hasInvalidAliases;
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
            } as ISampleSetDetails,
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
        const { onCancel, nameExpressionInfoUrl, nameExpressionPlaceholder, data } = this.props;
        const { submitting, error, parentOptions, formValues } = this.state;

        return (
            <>
                {error && <Alert>{error}</Alert>}
                <Panel>
                    <Panel.Body>
                        <div className={'entity-form--headerhelp'}>
                            Sample types help you organize samples in your lab and allow you to add properties for easy tracking of data.
                        </div>
                        <EntityDetailsForm
                            noun={'Sample Type'}
                            onFormChange={this.onFormChange}
                            data={data}
                            formValues={formValues}
                            nameExpressionInfoUrl={nameExpressionInfoUrl}
                            nameExpressionPlaceholder={nameExpressionPlaceholder}
                        />
                        {this.renderParentAliases()}
                        {parentOptions &&
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
