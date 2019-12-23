import React from 'react';
import { List, Map } from 'immutable';

import { AssayProtocolModel, DomainDesign, DomainPanelStatus, HeaderRenderer } from '../models';
import { saveAssayDesign } from '../actions';
import { AssayPropertiesPanel } from './AssayPropertiesPanel';
import DomainForm, { DomainFormImpl } from '../DomainForm';
import { Button, Col, Row } from 'react-bootstrap';
import { SEVERITY_LEVEL_ERROR } from '../constants';
import { Alert } from '../../base/Alert';

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
    appIsValidMsg?: (model: AssayProtocolModel) => string
    useTheme?: boolean
}

interface State {
    submitting: boolean
    currentPanelIndex: number
    protocolModel: AssayProtocolModel
    visitedPanels: List<number>
    validatePanel: number
    firstState: boolean
}

export class AssayDesignerPanels extends React.PureComponent<Props, State> {
    panelCount = 1;// start at 1 for the AssayPropertiesPanel, will updated count after domains are defined in constructor

    constructor(props: Props) {
        super(props);

        this.panelCount = this.panelCount + props.initModel.domains.size;

        this.state = {
            submitting: false,
            currentPanelIndex: 0,
            protocolModel: props.initModel,
            visitedPanels: List<number>([0]),
            validatePanel: undefined,
            firstState: true
        }
    }

    isLastStep(): boolean {
        return this.state.currentPanelIndex  + 1 ===  this.panelCount;
    }

    onDomainChange = (index: number, updatedDomain: DomainDesign) => {
        const { onChange } = this.props;

        this.setState((state) => {
            const domains = state.protocolModel.domains.map((domain, i) => {
                return i === index ? updatedDomain : domain;
            });
            const updatedModel = state.protocolModel.merge({domains}) as AssayProtocolModel;

            return {
                protocolModel: updatedModel
            }
        }, () => {
            if (onChange) {
                onChange(this.state.protocolModel);
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

    onTogglePanel = (index: number, collapsed: boolean, callback: () => any) => {
        const { visitedPanels, currentPanelIndex } = this.state;

        if (!collapsed) {
            if (!visitedPanels.contains(index)) {
                this.setState(() => ({currentPanelIndex: index,
                    visitedPanels: visitedPanels.push(index),
                    firstState: false}), callback());
            }
            else {
                this.setState(() => ({currentPanelIndex: index, firstState: false}), callback());
            }
        }
        else {
            if (currentPanelIndex === index) {
                this.setState(() => ({currentPanelIndex: undefined, firstState: false}), callback());
            }
            else {
                callback();
            }
        }
    };

    onFinish = () => {
        const { protocolModel } = this.state;
        const { beforeFinish } = this.props;

        // This first setState forces the current expanded panel to validate its fields and display and errors
        // the callback setState then sets that to undefined so it doesn't keep validating every render
        this.setState((state) => ({validatePanel: state.currentPanelIndex}), () => {
            this.setState((state) => ({validatePanel: undefined}), () => {

                if (this.isValid()) {
                    this.setSubmitting(true, protocolModel);
                    if (beforeFinish) {
                        beforeFinish(protocolModel);
                    }

                    saveAssayDesign(protocolModel)
                        .then((response) => this.onFinishSuccess(response))
                        .catch((protocolModel) => this.onFinishFailure(protocolModel));
                }
                else if (this.getAppIsValidMsg() !== undefined) {
                    this.setState(() => ({protocolModel: protocolModel.set('exception', this.getAppIsValidMsg()) as AssayProtocolModel}));
                }
            })

        });

    };

    onFinishSuccess(protocolModel: AssayProtocolModel) {
        this.setSubmitting(false, protocolModel);
        this.props.onComplete(protocolModel);
    }

    onFinishFailure(protocolModel: AssayProtocolModel) {
        this.setSubmitting(false, protocolModel);
    }

    setSubmitting(submitting: boolean, protocolModel: AssayProtocolModel) {
        this.setState(() => ({
            protocolModel,
            submitting
        }));
    }

    isValid(): boolean {
        return AssayProtocolModel.isValid(this.state.protocolModel) && this.getAppIsValidMsg() === undefined;
    }

    getAppIsValidMsg(): string {
        const { appIsValidMsg } = this.props;
        const { protocolModel } = this.state;

        return !appIsValidMsg ? undefined : appIsValidMsg(protocolModel);
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

    getPanelStatus = (index: number): DomainPanelStatus => {
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

    getBottomErrorBanner = (errorDomains: List<string>) => {
        const { visitedPanels, protocolModel } = this.state;

        let message;
        if (protocolModel.exception) {
            message = protocolModel.exception;
        }
        else if (errorDomains.size > 1 || (errorDomains.size > 0 && !protocolModel.hasValidProperties())) {
            message = "Please correct errors above before saving.";
        }
        else if (visitedPanels.size > 1 && !protocolModel.hasValidProperties()) {
            message = "Please correct errors in Assay Properties before saving.";
        }
        else if (errorDomains.size == 1) {
            message = "Please correct errors in " + errorDomains.get(0) + " before saving.";
        }

        if (message) {
            return (
                <Alert bsStyle="danger">{message}</Alert>
            )
        }

        return undefined;
    };

    render() {
        const { onCancel, basePropertiesOnly, containerTop, useTheme } = this.props;
        const { protocolModel, currentPanelIndex, validatePanel } = this.state;

        let errorDomains = List<string>();

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
                    onToggle={(collapsed, callback) => {
                        this.onTogglePanel(0, collapsed, callback);
                    }}
                    useTheme={useTheme}
                />
                {protocolModel.domains.map((domain, i) => {
                    // optionally hide the Batch Fields domain from the UI (for sample management use case)
                    if (this.shouldSkipBatchDomain(domain)) {
                        return;
                    }

                    // allow empty domain to be inferred from a file for Data Fields in General assay
                    const showInferFromFile = protocolModel.providerName === 'General' && domain.isNameSuffixMatch('Data');
                    const appDomainHeaderRenderer = this.getAppDomainHeaderRenderer(domain);

                    if (domain.hasException() && domain.domainException.severity === SEVERITY_LEVEL_ERROR) {
                        errorDomains = errorDomains.push(DomainFormImpl.getHeaderName(domain.name, undefined, protocolModel.name));
                    }

                    return (
                        <DomainForm
                            key={domain.domainId || i}
                            domain={domain}
                            headerPrefix={protocolModel.name}
                            controlledCollapse={true}
                            initCollapsed={currentPanelIndex !== (i+1)}
                            validate={validatePanel === i + 1}
                            panelStatus={protocolModel.isNew() ? this.getPanelStatus(i + 1) : "COMPLETE"}
                            showInferFromFile={showInferFromFile}
                            containerTop={containerTop}
                            helpURL={null} // so we only show the helpURL link for the first assay domain
                            onChange={(updatedDomain, dirty) => {
                                this.onDomainChange(i, updatedDomain);
                            }}
                            onToggle={(collapsed, callback) => {
                                this.onTogglePanel((i + 1), collapsed, callback);
                            }}
                            appDomainHeaderRenderer={appDomainHeaderRenderer}
                            modelDomains={protocolModel.domains}
                            useTheme={useTheme}
                        >
                            <div>{domain.description}</div>
                        </DomainForm>
                    )
                })}
                <div className={'domain-form-panel'}>
                    {this.getBottomErrorBanner(errorDomains)}
                </div>
                <div className={'domain-form-panel domain-assay-buttons'}>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button className='pull-right' bsStyle='success' disabled={this.state.submitting} onClick={this.onFinish}>Save</Button>
                </div>
            </>
        )
    }
}
