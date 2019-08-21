import * as React from 'react'
import { List } from 'immutable'
import { Alert, WizardNavButtons } from "@glass/base";

import { AssayProtocolModel, DomainDesign } from "../../models";
import { saveAssayDesign } from "../../actions/actions";
import { AssayPropertiesPanel } from "./AssayPropertiesPanel";
import DomainForm from "../DomainForm";

const UNKNOWN_ERROR = 'An unknown error occurred saving the assay design.';

interface Props {
    onCancel: () => void
    beforeFinish?: (model: AssayProtocolModel) => void
    onComplete: (model: AssayProtocolModel) => void
    initModel?: AssayProtocolModel
    hideEmptyBatchDomain?: boolean
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

        let protocolModel = props.initModel;
        if (!protocolModel) {
            protocolModel = new AssayProtocolModel({
                providerName: 'General',
                domains: List([
                    DomainDesign.init('Batch'),
                    DomainDesign.init('Run'),
                    DomainDesign.init('Data')
                ])
            });
        }

        this.panelCount = this.panelCount + protocolModel.domains.size;

        this.state = {
            submitting: false,
            currentPanelIndex: 0,
            protocolModel
        }
    }

    isNew(): boolean {
        return this.state.protocolModel.protocolId === undefined;
    }

    isLastStep(): boolean {
        return this.state.currentPanelIndex  + 1 ===  this.panelCount;
    }

    onDomainChange = (index: number, updatedDomain: DomainDesign) => {
        const { protocolModel } = this.state;
        const domains = protocolModel.domains.map((domain, i) => {
            return i === index ? updatedDomain : domain;
        });

        this.setState(() => ({
            protocolModel: protocolModel.merge({domains}) as AssayProtocolModel
        }));
    };

    shouldSkipStep(stepIndex: number): boolean {
        const { hideEmptyBatchDomain } = this.props;
        const { protocolModel } = this.state;
        const index = stepIndex - 1; // subtract 1 because the first step is not a domain step (i.e. Assay Properties panel)
        const domain = protocolModel.domains.get(index);

        if (hideEmptyBatchDomain && domain && domain.isNameSuffixMatch('Batch')) {
            return true;
        }

        return false;
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
        const { protocolModel } = this.state;
        return protocolModel.name !== undefined && protocolModel.name.length > 0;
    }

    onAssayPropertiesChange = (model: AssayProtocolModel) => {
        this.setState(() => ({protocolModel: model}));
    };

    renderDomainPanelHeading(domain: DomainDesign) {
        if (domain.name) {
            if (domain.isNameSuffixMatch('Batch')) {
                return (
                    <p>Define the batch properties that are set once for each batch of runs imported at the same time.</p>
                )
            }
            else if (domain.isNameSuffixMatch('Run')) {
                return (
                    <p>Define the run properties that are set once per run and apply to all rows in the run.</p>
                )
            }
            else if (domain.isNameSuffixMatch('Data')) {
                return (
                    <p>Define the data properties that are set for individual rows within the imported run.</p>
                )
            }
        }
    }

    render() {
        const { onCancel, hideEmptyBatchDomain } = this.props;
        const { submitting, error, protocolModel, currentPanelIndex } = this.state;
        const isNew = this.isNew();
        const finish = !isNew || this.isLastStep();

        return (
            <>
                <AssayPropertiesPanel
                    model={protocolModel}
                    onChange={this.onAssayPropertiesChange}
                    collapsible={!isNew}
                    initCollapsed={currentPanelIndex !== 0}
                    markComplete={currentPanelIndex > 0}
                />
                {protocolModel.domains.map((domain, i) => {
                    // optionally hide the Batch Fields domain from the UI (for sample management use case)
                    if (hideEmptyBatchDomain && domain.isNameSuffixMatch('Batch')) {
                        return;
                    }

                    // allow empty domain to be inferred from a file for Data Fields
                    const showInferFromFile = domain.isNameSuffixMatch('Data');

                    return (
                        <DomainForm
                            key={domain.domainId || i}
                            domain={domain}
                            headerPrefix={protocolModel.name}
                            collapsible={!isNew}
                            initCollapsed={!isNew || currentPanelIndex !== (i+1)}
                            markComplete={currentPanelIndex > (i+1)}
                            showInferFromFile={showInferFromFile}
                            onChange={(updatedDomain) => {
                                this.onDomainChange(i, updatedDomain);
                            }}
                        >
                            {this.renderDomainPanelHeading(domain)}
                        </DomainForm>
                    )
                })}
                {error && <Alert>{error}</Alert>}
                <WizardNavButtons
                    containerClassName=""
                    cancel={onCancel}
                    finish={true}
                    canFinish={this.isValid()}
                    isFinishing={submitting}
                    finishText={finish ? 'Finish' : 'Next'}
                    nextStep={finish ? this.onFinish : this.onNext}
                    canPreviousStep={!submitting && currentPanelIndex > 0}
                    previousStep={isNew ? this.onPrevious : undefined}
                />
            </>
        )
    }
}