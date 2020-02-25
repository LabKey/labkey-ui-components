import React from 'react';
import {SampleTypeModel} from './models';
import {SampleTypePropertiesPanel} from "./SampleTypePropertiesPanel";
import {Alert, DomainDesign, DomainDetails, IDomainField, SAMPLE_TYPE, WizardNavButtons} from "../../..";
import DomainForm from "../DomainForm";
import {IParentAlias, IParentOption,} from "../../entities/models";

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
    };

    constructor(props: Props) {
        super(props);

        const domainDetails = props.initModel || DomainDetails.create();

        this.state = {
            submitting: false,
            currentPanelIndex: 0,
            model: SampleTypeModel.create(domainDetails),
            invalidDomainField: undefined,
            activePanelIndex: 0,
            parentOptions: undefined,
            error: undefined,
        };
    }

    // ############################# Properties Panel methods
    onFieldChange = (newModel: SampleTypeModel) => {
        this.setState(()=>({model:newModel}));
    };

    parentAliasChange = (id:string, field: string, newValue: IParentOption) => {
        const {model} = this.state;
        let {parentAliases} = model;
        parentAliases.get(id)[field] = newValue;
        model.set('parentAliases', parentAliases);
    };

    removeParentAlias = (id:string) => {
        const {model} = this.state;
        let {parentAliases} = model;
        parentAliases.delete(id);
        model.set('parentAliases', parentAliases);
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
                    onRemoveParentAlias={this.removeParentAlias}
                    noun={noun}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    updateModel={this.onFieldChange}
                />
            </>
        )
    };
    // ############################# END Properties Panel region

    // ############################# Domain Panel methods
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
                        helpNoun={'sample type'}
                    // containerTop={STICKY_HEADER_HEIGHT}
                        useTheme={false}
                        appPropertiesOnly={true}
                />
                }
            </>
        );
    };
// ############################ END Domain Panel region

    isFormValid = (): boolean => {
        return true;
    };

    onFinish = () => {

    };

    render() {
        // return (
        //     <>
        //         <SampleTypePropertiesPanel
        //             model={}
        //             parentOptions={}
        //             onChange={}
        //             onParentAliasChange={}
        //             onRemoveParentAlias={}
        //             noun={}
        //             onFormChange={}
        //         />
        //         {}
        //         <DomainForm
        //             />
        //         {bottomErrorMsg &&
        //         <div className={'domain-form-panel'}>
        //             <Alert bsStyle="danger">{bottomErrorMsg}</Alert>
        //         </div>
        //         }
        //         <div className={'domain-form-panel domain-designer-buttons'}>
        //             <Button onClick={onCancel}>Cancel</Button>
        //             <Button className='pull-right' bsStyle={successBsStyle || 'success'} disabled={this.state.submitting} onClick={this.onFinish}>Save</Button>
        //         </div>
        //     </>
        //
        //
        // );

        const { onCancel } = this.props;
        const { submitting, error, } = this.state;
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
