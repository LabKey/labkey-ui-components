import React from 'react';
import { Button } from "react-bootstrap";
import { List } from 'immutable';
import { DataClassModel } from "./models";
import { Alert } from "../../base/Alert";
import { DomainDesign, DomainPanelStatus } from "../models";
import { SEVERITY_LEVEL_ERROR } from "../constants";
import DomainForm, { DomainFormImpl } from "../DomainForm";
import { DataClassPropertiesPanel } from "./DataClassPropertiesPanel";

interface Props {
    noun?: string
    nameExpressionInfoUrl?: string
    nameExpressionPlaceholder?: string
    headerText?: string

    onChange?: (model: DataClassModel) => void
    onCancel: () => void
    beforeFinish?: (model: DataClassModel) => void
    onComplete: (model: DataClassModel) => void
    initModel: DataClassModel
    containerTop?: number // This sets the top of the sticky header, default is 0
    appPropertiesOnly?: boolean
    useTheme?: boolean
    successBsStyle?: string
}

interface State {
    submitting: boolean
    currentPanelIndex: number
    currentModel: DataClassModel
    visitedPanels: List<number>
    validatePanel: number
    firstState: boolean
}

export class DataClassDesigner extends React.PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            submitting: false,
            currentPanelIndex: 0,
            currentModel: props.initModel,
            visitedPanels: List<number>([0]),
            validatePanel: undefined,
            firstState: true
        }
    }

    // TODO good candidate to share with Assay
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
        const { currentModel } = this.state;
        const { beforeFinish } = this.props;

        // This first setState forces the current expanded panel to validate its fields and display and errors
        // the callback setState then sets that to undefined so it doesn't keep validating every render
        this.setState((state) => ({validatePanel: state.currentPanelIndex}), () => {
            this.setState((state) => ({validatePanel: undefined}), () => {
                if (this.isValid()) {
                    this.setState(() => ({submitting: true}));
                    if (beforeFinish) {
                        beforeFinish(currentModel);
                    }

                    console.log('TIME TO SAVE THE DATA CLASS MODEL');
                    // saveAssayDesign(protocolModel)
                    //     .then((response) => this.onFinishSuccess(response))
                    //     .catch((protocolModel) => this.onFinishFailure(protocolModel));
                }
                console.log('NOT VALID');
            })

        });

    };

    onFinishSuccess(currentModel: DataClassModel) {
        this.setState(() => ({currentModel, submitting: false}));
        this.props.onComplete(currentModel);
    }

    // TODO this could be done in a finally I believe
    onFinishFailure(currentModel: DataClassModel) {
        this.setState(() => ({currentModel, submitting: false}));
    }

    isValid(): boolean {
        return DataClassModel.isValid(this.state.currentModel);
    }

    onDomainChange = (domain: DomainDesign) => {
        const { onChange } = this.props;

        this.setState((state) => ({
            currentModel: state.currentModel.merge({domain}) as DataClassModel
        }), () => {
            if (onChange) {
                onChange(this.state.currentModel);
            }
        });
    };

    onPropertiesChange = (model: DataClassModel) => {
        const { onChange } = this.props;

        this.setState(() => ({
            currentModel: model
        }), () => {
            if (onChange) {
                onChange(model);
            }
        });
    };

    // TODO good candidate to share with Assay
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

    // TODO good candidate to share with Assay
    getBottomErrorBanner = (errorDomains: List<string>) => {
        const { visitedPanels, currentModel } = this.state;

        let message;
        // if (currentModel.exception) {
        //     message = currentModel.exception;
        // }
        if (errorDomains.size > 1 || (errorDomains.size > 0 && !currentModel.hasValidProperties())) {
            message = "Please correct errors above before saving.";
        }
        else if (visitedPanels.size > 1 && !currentModel.hasValidProperties()) {
            message = "Please correct errors in the Properties panel before saving.";
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
        const { onCancel, appPropertiesOnly, containerTop, useTheme, noun, nameExpressionInfoUrl, nameExpressionPlaceholder, headerText, successBsStyle } = this.props;
        const { currentModel, currentPanelIndex, validatePanel } = this.state;

        let errorDomains = List<string>();
        if (currentModel.domain.hasException() && currentModel.domain.domainException.severity === SEVERITY_LEVEL_ERROR) {
            errorDomains = errorDomains.push(DomainFormImpl.getHeaderName(currentModel.domain.name, undefined, currentModel.name));
        }

        return (
            <>
                <DataClassPropertiesPanel
                    noun={noun}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    headerText={headerText}
                    model={currentModel}
                    onChange={this.onPropertiesChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 0 }
                    panelStatus={currentModel.isNew() ? this.getPanelStatus(0) : "COMPLETE"}
                    validate={validatePanel === 0}
                    appPropertiesOnly={appPropertiesOnly}
                    onToggle={(collapsed, callback) => {this.onTogglePanel(0, collapsed, callback);}}
                    useTheme={useTheme}
                />
                <DomainForm
                    key={currentModel.domain.domainId || 0}
                    domainIndex={0}
                    domain={currentModel.domain}
                    headerPrefix={currentModel.name}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 1}
                    validate={validatePanel === 1}
                    panelStatus={currentModel.isNew() ? this.getPanelStatus(1) : "COMPLETE"}
                    showInferFromFile={true}
                    containerTop={containerTop}
                    onChange={this.onDomainChange}
                    onToggle={(collapsed, callback) => {this.onTogglePanel(1, collapsed, callback);}}
                    appPropertiesOnly={appPropertiesOnly}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                >
                    {currentModel.domain.description && <div>{currentModel.domain.description}</div>}
                </DomainForm>
                <div className={'domain-form-panel'}>
                    {this.getBottomErrorBanner(errorDomains)}
                </div>
                <div className={'domain-form-panel domain-assay-buttons'}>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button className='pull-right' bsStyle={successBsStyle || 'success'} disabled={this.state.submitting} onClick={this.onFinish}>Save</Button>
                </div>
            </>
        )
    }
}
