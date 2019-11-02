import * as React from 'react'
import { Map, List } from 'immutable'
import { Alert, WizardNavButtons } from "@glass/base";

import {AssayPanelStatus, AssayProtocolModel, DomainDesign, HeaderRenderer} from "../../models";
import {saveAssayDesign} from "../../actions/actions";
import { AssayPropertiesPanel } from "./AssayPropertiesPanel";
import DomainForm from "../DomainForm";
import {Button, Col, Row} from "react-bootstrap";

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
    visitedPanels: List<number>
    errorPanels: List<number>
    validatePanel: number
    firstState: boolean
}

export class AssayDesignerPanels extends React.PureComponent<Props, State> {
    panelCount = 1;// start at 1 for the AssayPropertiesPanel, will updated count after domains are defined in constructor

    constructor(props: Props) {
        super(props);

        this.panelCount = this.panelCount + props.initModel.domains.size;

        const errors = List<number>();
        if (props.initModel.isNew()) {
            errors.push(0);
        }

        this.state = {
            submitting: false,
            currentPanelIndex: 0,
            protocolModel: props.initModel,
            visitedPanels: List<number>().push(0),
            errorPanels: errors,
            validatePanel: undefined,
            firstState: true
        }
    }

    isLastStep(): boolean {
        return this.state.currentPanelIndex  + 1 ===  this.panelCount;
    }

    onDomainChange = (index: number, updatedDomain: DomainDesign, error: boolean) => {
        const { onChange } = this.props;
        const { protocolModel } = this.state;

        const domains = protocolModel.domains.map((domain, i) => {
            return i === index ? updatedDomain : domain;
        });
        const updatedModel = protocolModel.merge({domains}) as AssayProtocolModel;
        const newErrorPanels = this.getUpdatedErrorPanels(index + 1, error);

        this.setState(() => ({
            protocolModel: updatedModel,
            errorPanels: newErrorPanels
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

    getUpdatedErrorPanels = (index: number, error: boolean) => {
        const { errorPanels } = this.state;

        let newErrorPanels = errorPanels;
        if (!error && newErrorPanels.contains(index)) {
            newErrorPanels = newErrorPanels.remove(newErrorPanels.indexOf(index));
        }
        else if (error && !newErrorPanels.contains(index)) {
            newErrorPanels = newErrorPanels.push(index);
        }

        return newErrorPanels;
    };

    onTogglePanel = (index: number, collapsed: boolean, error: boolean, callback: () => any) => {
        const { visitedPanels, currentPanelIndex } = this.state;

        const newErrorPanels = this.getUpdatedErrorPanels(index, error);

        if (!collapsed) {
            if (!visitedPanels.contains(index)) {
                this.setState(() => ({currentPanelIndex: index,
                    errorPanels: newErrorPanels,
                    visitedPanels: visitedPanels.push(index),
                    firstState: false}), callback());
            }
            else {
                this.setState(() => ({currentPanelIndex: index, errorPanels: newErrorPanels, firstState: false}), callback());
            }
        }
        else {
            if (collapsed && currentPanelIndex === index) {
                this.setState(() => ({currentPanelIndex: undefined, errorPanels: newErrorPanels, firstState: false}), callback());
            }
            else {
                callback();
            }
        }
    };

    onFinish = () => {
        const { protocolModel } = this.state;
        const { beforeFinish } = this.props;

        this.setState((state) => ({validatePanel: state.currentPanelIndex}), () => {
            this.setState((state) => ({validatePanel: undefined}), () => {

                if (this.state.errorPanels.isEmpty()) {
                    this.setSubmitting(true);
                    if (beforeFinish)
                    {
                        beforeFinish(protocolModel);
                    }

                    saveAssayDesign(protocolModel)
                        .then((response) => this.onFinishSuccess(response))
                        .catch((error) => this.onFinishFailure(error));
                }
            })

        });

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
        const { protocolModel, errorPanels } = this.state;

        return (appIsValid ? errorPanels.isEmpty() && appIsValid(protocolModel) : errorPanels.isEmpty());
    }

    onAssayPropertiesChange = (model: AssayProtocolModel, error: boolean) => {
        const { onChange } = this.props;

        const newErrorPanels = this.getUpdatedErrorPanels(0, error);

        this.setState(() => ({
            protocolModel: model,
            errorPanels: newErrorPanels
        }), () => {
            if (onChange) {
                onChange(model);
            }
        });
    };

    getPanelStatus = (index: number): AssayPanelStatus => {
        const { currentPanelIndex, visitedPanels, firstState } = this.state;

        if (index === 0 && firstState) {
            return 'NONE';
        }

        if (currentPanelIndex === index) {
            return 'INPROGRESS';
        }

        if (visitedPanels.contains(index)) {
            return 'COMPLETE';
        }

        return 'TODO';
    };

    getAppDomainHeaderRenderer = (domain: DomainDesign): HeaderRenderer =>  {
        const {appDomainHeaders} = this.props;

        if (!appDomainHeaders)
            return undefined;

        return appDomainHeaders.filter((v,k) => domain.isNameSuffixMatch(k)).first();
    };

    render() {
        const { onCancel, basePropertiesOnly, containerTop } = this.props;
        const { error, protocolModel, currentPanelIndex, validatePanel } = this.state;

        return (
            <>
                <AssayPropertiesPanel
                    model={protocolModel}
                    onChange={this.onAssayPropertiesChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 0 }
                    panelStatus={protocolModel.isNew() ? this.getPanelStatus(0) : "COMPLETE"}
                    validate={validatePanel === 0}
                    basePropertiesOnly={basePropertiesOnly}
                    onToggle={(collapsed, error, callback) => {
                        this.onTogglePanel(0, collapsed, error, callback);
                    }}
                />
                {protocolModel.domains.map((domain, i) => {
                    // optionally hide the Batch Fields domain from the UI (for sample management use case)
                    if (this.shouldSkipBatchDomain(domain)) {
                        return;
                    }

                    // allow empty domain to be inferred from a file for Data Fields in General assay
                    const showInferFromFile = protocolModel.providerName === 'General' && domain.isNameSuffixMatch('Data');
                    const appDomainHeaderRenderer = this.getAppDomainHeaderRenderer(domain);

                    // collapse domain panel for new assays (unless it is the active step)
                    // for existing assays, collapse unless the assay is invalidate and the domain has appDomainHeaderRenderer
                    let initCollapsed = currentPanelIndex !== (i+1);
                    if (!this.isValid() && appDomainHeaderRenderer !== undefined) {
                        initCollapsed = false;
                    }

                    return (
                        <DomainForm
                            key={domain.domainId || i}
                            domain={domain}
                            headerPrefix={protocolModel.name}
                            controlledCollapse={true}
                            initCollapsed={initCollapsed}
                            validate={validatePanel === i + 1}
                            panelStatus={protocolModel.isNew() ? this.getPanelStatus(i + 1) : "COMPLETE"}
                            showInferFromFile={showInferFromFile}
                            containerTop={containerTop}
                            helpURL={null} // so we only show the helpURL link for the first assay domain
                            onChange={(updatedDomain, dirty, error) => {
                                this.onDomainChange(i, updatedDomain, error);
                            }}
                            onToggle={(collapsed, error, callback) => {
                                this.onTogglePanel((i + 1), collapsed, error, callback);
                            }}
                            appDomainHeaderRenderer={appDomainHeaderRenderer}
                            modelDomains={protocolModel.domains}
                        >
                            <div>{domain.description}</div>
                        </DomainForm>
                    )
                })}
                {error &&
                    <span className="domain-main-alert">
                        <Alert>{error}</Alert>
                    </span>
                }
                <Row className='domain-field-padding-top'>
                    <Col xs={6}>
                        <Button onClick={onCancel}>Cancel</Button>
                    </Col>
                    <Col xs={6}>
                        <Button className='pull-right' bsStyle='success' disabled={!this.isValid()} onClick={this.onFinish}>Finish</Button>
                    </Col>
                </Row>
            </>
        )
    }
}