import React from 'react';
import {SampleTypeModel} from './models';
import {SampleTypePropertiesPanel} from "./SampleTypePropertiesPanel";
import {
    Alert,
    DomainDesign,
    DomainDetails, generateId,
    IDomainField,
    KINDS,
    resolveErrorMessage,
    SAMPLE_TYPE,
    saveDomain,
    WizardNavButtons
} from "../../..";
import DomainForm from "../DomainForm";
import {IParentAlias, IParentOption,} from "../../entities/models";
import {addDomainField} from "../actions";
import {initSampleSetSelects} from "../../samples/actions";
import {SAMPLE_SET_DISPLAY_TEXT} from "../../../constants";
import {Map} from "immutable";

const DEFAULT_SAMPLE_FIELD_CONFIG = {
    required: true,
    dataType: SAMPLE_TYPE,
    conceptURI: SAMPLE_TYPE.conceptURI,
    rangeURI: SAMPLE_TYPE.rangeURI,
    lookupSchema: 'exp',
    lookupQuery: 'Materials',
    lookupType: {...SAMPLE_TYPE},
    name: 'SampleId',
} as Partial<IDomainField>;

const NEW_SAMPLE_SET_OPTION: IParentOption = {
    label: `(Current ${SAMPLE_SET_DISPLAY_TEXT})`, //TODO: this should use props.noun;
    value: "{{this_sample_set}}"
} as IParentOption;

const IMPORT_PREFIX :string = 'materialInputs/';

interface Props {
    onCancel: () => void
    onComplete: (response: any) => void
    beforeFinish?: (formValues: {}) => void
    initModel: DomainDetails
    defaultSampleFieldConfig?: Partial<IDomainField>

    //EntityDetailsForm props
    noun?: string
    nameExpressionInfoUrl?: string
    nameExpressionPlaceholder?: string
}

interface State {
    model: SampleTypeModel
    parentOptions: Array<IParentOption>
    invalidDomainField: string

    activePanelIndex: number

    submitting: boolean
    currentPanelIndex: number

    error: React.ReactNode
}

export class SampleTypeDesigner extends React.PureComponent<Props, State> {
    private _dirty = false;

    static defaultProps = {
        nameExpressionPlaceholder: 'S-\${now:date}-\${dailySampleCount}',
        defaultSampleFieldConfig: DEFAULT_SAMPLE_FIELD_CONFIG,
        noun: SAMPLE_SET_DISPLAY_TEXT,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            submitting: false,
            currentPanelIndex: 0,
            model: undefined,
            invalidDomainField: undefined,
            activePanelIndex: 0,
            parentOptions: undefined,
            error: undefined,
        };
    }

    componentDidMount = (): void => {
        const domainDetails = this.props.initModel || DomainDetails.create();
        const model = SampleTypeModel.create(domainDetails);
        this.initParentOptions(model);
    };

    initParentOptions = (model: SampleTypeModel) => {
        initSampleSetSelects(!model.isNew(), model.name, NEW_SAMPLE_SET_OPTION, IMPORT_PREFIX).then(results => {
            const options = results.toArray();
            let importAliases = Map<string, IParentAlias>();

            if (model && model.parentAliases)
            {
                let parentAliases = Map<string,string>(model.parentAliases);
                parentAliases.forEach((val, key) => {
                    const newId = SampleTypeDesigner.generateAliasId();
                    importAliases = importAliases.set(newId, {
                        id: newId,
                        alias: key,
                        parentValue: options.find(opt => opt.value === val),
                        ignoreAliasError: false,
                        ignoreSelectError: false,
                    } as IParentAlias);
                });
            }

            this.setState(() => ({
                parentOptions: options,
                model: model.merge({importAliases}) as SampleTypeModel
            }));
        });
    };

    //Generates a temporary id for add/delete of the import aliases
    static generateAliasId() {
        return generateId("sampleset-parent-import-alias-");
    }

    onFieldChange = (newModel: SampleTypeModel) => {
        this.setState(()=>({model:newModel}));
    };

    parentAliasChange = (id:string, field: string, newValue: any) => {
        const {model} = this.state;
        const {importAliases} = model;
        const parentAlias = {
            ...importAliases.get(id),
            [field]: newValue,
        };

        const newAliases = importAliases.set(id, parentAlias);
        const newModel = model.merge({importAliases: newAliases}) as SampleTypeModel;
        this.setState(() => ({model: newModel}));
    };

    addParentAlias = (id:string, newAlias: IParentAlias): void => {
        const {model} = this.state;
        let {importAliases} = model;
        const newModel = model.merge({importAliases:importAliases.set(id, newAlias)}) as SampleTypeModel;
        this.setState(() => ({model: newModel}));
    };

    removeParentAlias = (id:string) => {
        const {model} = this.state;
        let {importAliases} = model;
        const aliases = importAliases.delete(id);
        const newModel = model.set('importAliases', aliases) as SampleTypeModel;
        this.setState(() => ({model: newModel}));
    };

    renderDetailsPanel = () => {
        const {noun = 'Sample Type', nameExpressionInfoUrl, nameExpressionPlaceholder } = this.props;
        const {model, parentOptions,} = this.state;
        return (
            <>
                <SampleTypePropertiesPanel
                    model={model}
                    parentOptions={parentOptions}
                    onParentAliasChange={this.parentAliasChange}
                    onAddParentAlias={this.addParentAlias}
                    onRemoveParentAlias={this.removeParentAlias}
                    noun={noun}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    updateModel={this.onFieldChange}
                />
            </>
        )
    };

    domainChangeHandler = (newDomain: DomainDesign): void => {
        const {defaultSampleFieldConfig} = this.props;
        let {model} = this.state;
        let invalidDomainField = undefined;
        if (newDomain && newDomain.fields) {
            newDomain.fields.forEach(field => {
                if (field && field.name && field.name.toLowerCase() === defaultSampleFieldConfig.name.toLowerCase()) {
                    invalidDomainField = field.name
                }
            });
        }

        this._dirty = true;
        model = model.merge({domain:newDomain}) as SampleTypeModel;
        this.setState(() => ({
            model,
            invalidDomainField
        }));
    };

    renderDomainPanel = () => {
        const {noun} = this.props;
        const {model} = this.state;
        const {domain} = model;

        return (
            <>
                {domain &&
                <DomainForm
                        domain={domain}
                        onChange={this.domainChangeHandler}
                        showHeader={true}
                        initCollapsed={true}
                        collapsible={true}
                        helpNoun={noun.toLowerCase()}
                        useTheme={false}
                        appPropertiesOnly={true}
                />
                }
            </>
        );
    };

    isFormValid = (): boolean => {
        return SampleTypeModel.isValid(this.state.model);
    };

    onFinish = () => {
        const { beforeFinish } = this.props;
        const { model } = this.state;

        this.setSubmitting(true);

        if (beforeFinish) {
            beforeFinish(model);
        }

        const {name, domain, description, nameExpression } = model;

        let domainDesign = domain.merge({
            name: name, //This will be the Sample Type Name
            description: description,
        }) as DomainDesign;

        const details = {
            name,
            nameExpression,
            importAliases: model.getImportAliasesAsMap().toJS(),
        };

        if (model.isNew())
        {
            //Initialize a sampleId column, this is not displayed as part of the designer.
            const nameCol = {
                name: 'Name'
            };

            domainDesign = addDomainField(domainDesign, nameCol);
        }

        saveDomain(domainDesign, KINDS.SAMPLE_TYPE, details, name)
            .then((savedDomain) => {
                this.onFinishSuccess(savedDomain);
            })
            .catch((errorDomain) => {
                this.onFinishFailure(resolveErrorMessage(errorDomain));
            });

    };

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

    render() {
        const { onCancel } = this.props;
        const { submitting, error, model } = this.state;
        if (!model)
            return null;

        return (
            <>
                {error && <Alert>{error}</Alert>}
                {this.renderDetailsPanel()}
                {this.renderDomainPanel()}
                <WizardNavButtons
                    containerClassName="margin-top"
                    cancel={onCancel}
                    finish={true}
                    canFinish={this.isFormValid()}
                    isFinishing={submitting}
                    nextStep={this.onFinish}
                    finishText={"Save"}
                    isFinishingText={"Saving..."}
                />
            </>
        );
    }
}
