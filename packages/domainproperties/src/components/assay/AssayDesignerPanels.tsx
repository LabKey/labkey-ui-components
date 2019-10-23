import * as React from 'react'
import { Map } from 'immutable'
import { Alert, WizardNavButtons } from "@glass/base";

import {AssayProtocolModel, DomainDesign, HeaderRenderer} from "../../models";
import {saveAssayDesign} from "../../actions/actions";
import { AssayPropertiesPanel } from "./AssayPropertiesPanel";
import DomainForm from "../DomainForm";

const UNKNOWN_ERROR = 'An unknown error occurred saving the assay design.';

interface Props {
    onChange?: (model: AssayProtocolModel) => void
    onCancel: () => void
    beforeFinish?: (model: AssayProtocolModel) => void
    onComplete: (model: AssayProtocolModel) => void
    initModel: AssayProtocolModel
    hideEmptyBatchDomain?: boolean
    containerTop?: number // This sets the top of the sticky header, default is 0
    basePropertiesOnly?: boolean
    appDomainHeaders?: Map<string, HeaderRenderer>
    appIsValid?: (model: AssayProtocolModel) => boolean
}

interface State {
    error?: string
    submitting: boolean
    currentPanelIndex: number
    protocolModel: AssayProtocolModel
}

export class AssayDesignerPanels extends React.Component<Props, State> {
    panelCount = 1;// start at 1 for the AssayPropertiesPanel, will updated count after domains are defined in constructor

    constructor(props: Props) {
        super(props);

        this.panelCount = this.panelCount + props.initModel.domains.size;

        this.state = {
            submitting: false,
            currentPanelIndex: 0,
            protocolModel: props.initModel
        }
    }

    isLastStep(): boolean {
        return this.state.currentPanelIndex  + 1 ===  this.panelCount;
    }

    onDomainChange = (index: number, updatedDomain: DomainDesign) => {
        const { onChange } = this.props;
        const { protocolModel } = this.state;

        const domains = protocolModel.domains.map((domain, i) => {
            return i === index ? updatedDomain : domain;
        });
        const updatedModel = protocolModel.merge({domains}) as AssayProtocolModel;

        this.setState(() => ({
            protocolModel: updatedModel
        }), () => {
            if (onChange) {
                onChange(updatedModel);
            }
        });
    };

    shouldSkipStep(stepIndex: number): boolean {
        const { protocolModel } = this.state;
        const index = stepIndex - 1; // subtract 1 because the first step is not a domain step (i.e. Assay Properties panel)
        const domain = protocolModel.domains.get(index);

        return this.shouldSkipBatchDomain(domain);
    }

    shouldSkipBatchDomain(domain: DomainDesign): boolean {
        return this.props.hideEmptyBatchDomain && domain && domain.isNameSuffixMatch('Batch') && domain.fields.size === 0;
    }

    onPrevious = () => {
        if (this.state.currentPanelIndex !== 0) {
            const step = this.shouldSkipStep(this.state.currentPanelIndex - 1) ? 2 : 1;
            const nextStepIndex = this.state.currentPanelIndex - step;
            this.setState(() => ({currentPanelIndex: nextStepIndex}));
        }
    };

    onNext = () => {
        if (!this.isLastStep()) {
            const step = this.shouldSkipStep(this.state.currentPanelIndex + 1) ? 2 : 1;
            const nextStepIndex = this.state.currentPanelIndex + step;
            this.setState(() => ({currentPanelIndex: nextStepIndex}));
        }
    };

    onFinish = () => {
        const { protocolModel } = this.state;
        const { beforeFinish } = this.props;

        this.setSubmitting(true);
        if (beforeFinish) {
            beforeFinish(protocolModel);
        }

        saveAssayDesign(protocolModel)
            .then((response) => this.onFinishSuccess(response))
            .catch((error) => this.onFinishFailure(error));
    };

    onFinishSuccess(response: AssayProtocolModel) {
        this.setSubmitting(false);
        this.props.onComplete(response);
    }

    onFinishFailure(error: any) {
        this.setSubmitting(false, error || UNKNOWN_ERROR);
    }

    setSubmitting(submitting: boolean, error?: string) {
        this.setState(() => ({
            error,
            submitting
        }));
    }

    isValid(): boolean {
        const { appIsValid } = this.props;
        const { protocolModel } = this.state;
        return appIsValid ? protocolModel.isValid() && appIsValid(protocolModel) : protocolModel.isValid();
    }

    onAssayPropertiesChange = (model: AssayProtocolModel) => {
        const { onChange } = this.props;

        this.setState(() => ({
            protocolModel: model
        }), () => {
            if (onChange) {
                onChange(model);
            }
        });
    };

    getAppDomainHeaderRenderer = (domain: DomainDesign): HeaderRenderer =>  {
        const {appDomainHeaders} = this.props;

        if (!appDomainHeaders)
            return undefined;

        return appDomainHeaders.filter((v,k) => domain.isNameSuffixMatch(k)).first();
    };

    render() {
        const { onCancel, basePropertiesOnly, containerTop } = this.props;
        const { submitting, error, protocolModel, currentPanelIndex } = this.state;
        const isNew = protocolModel.isNew();
        const finish = !isNew || this.isLastStep();
        const transformScriptError = protocolModel.validateTransformScripts();

        return (
            <>
                <AssayPropertiesPanel
                    model={protocolModel}
                    onChange={this.onAssayPropertiesChange}
                    collapsible={!isNew}
                    initCollapsed={currentPanelIndex !== 0}
                    markComplete={currentPanelIndex > 0}
                    basePropertiesOnly={basePropertiesOnly}
                    panelCls={isNew && currentPanelIndex === 0 ? 'panel-active' : ''}
                />
                {protocolModel.domains.map((domain, i) => {
                    // optionally hide the Batch Fields domain from the UI (for sample management use case)
                    if (this.shouldSkipBatchDomain(domain)) {
                        return;
                    }

                    // allow empty domain to be inferred from a file for Data Fields in General assay
                    const showInferFromFile = protocolModel.providerName === 'General' && domain.isNameSuffixMatch('Data');
                    const appDomainHeaderRenderer = this.getAppDomainHeaderRenderer(domain);

                    return (
                        <DomainForm
                            key={domain.domainId || i}
                            domain={domain}
                            headerPrefix={protocolModel.name}
                            collapsible={!isNew}
                            initCollapsed={!isNew || currentPanelIndex !== (i+1)}
                            markComplete={currentPanelIndex > (i+1)}
                            panelCls={isNew && currentPanelIndex === (i+1) ? 'panel-active' : ''}
                            showInferFromFile={showInferFromFile}
                            containerTop={containerTop}
                            helpURL={i > 0 ? null : undefined} // so we only show the helpURL link for the first assay domain
                            onChange={(updatedDomain) => {
                                this.onDomainChange(i, updatedDomain);
                            }}
                            appDomainHeaderRenderer={appDomainHeaderRenderer}
                            modelDomains={protocolModel.domains}
                        >
                            <p>{domain.description}</p>
                        </DomainForm>
                    )
                })}
                {error && <Alert>{error}</Alert>}
                {transformScriptError && <Alert>{transformScriptError}</Alert>}
                <WizardNavButtons
                    cancel={onCancel}
                    canFinish={this.isValid()}  //if finished call isValid, otherwise isNameSet
                    canNextStep={protocolModel.isValid()}
                    canPreviousStep={!submitting && currentPanelIndex > 0}
                    containerClassName=""
                    finish={finish}
                    includeNext={!finish}
                    isFinishing={submitting}
                    nextStep={finish ? this.onFinish : this.onNext}
                    nextStyle={'success'}
                    previousStep={isNew ? this.onPrevious : undefined}
                />
            </>
        )
    }
}