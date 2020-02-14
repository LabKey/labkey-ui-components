import React from 'react';
import { Button } from "react-bootstrap";
import { List } from 'immutable';
import { DataClassModel } from "./models";
import { Alert } from "../../base/Alert";
import { DomainDesign } from "../models";
import { SEVERITY_LEVEL_ERROR } from "../constants";
import DomainForm, { DomainFormImpl } from "../DomainForm";
import { DataClassPropertiesPanel } from "./DataClassPropertiesPanel";
import { getDomainBottomErrorMessage, getDomainPanelStatus } from "../actions";

interface Props {
    noun?: string
    nameExpressionInfoUrl?: string
    nameExpressionPlaceholder?: string
    headerText?: string

    onChange?: (model: DataClassModel) => void
    onCancel: () => void
    beforeFinish?: (model: DataClassModel) => void
    onComplete: (model: DataClassModel) => void
    initModel?: DataClassModel
    containerTop?: number // This sets the top of the sticky header, default is 0
    appPropertiesOnly?: boolean
    useTheme?: boolean
    successBsStyle?: string
}

interface State {
    submitting: boolean
    currentPanelIndex: number
    model: DataClassModel
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
            model: props.initModel || DataClassModel.create({}),
            visitedPanels: List<number>(),
            validatePanel: undefined,
            firstState: true
        }
    }

    // TODO factor this out to remove duplicate code from AssayDesignerPanels.tsx
    onTogglePanel = (index: number, collapsed: boolean, callback: () => any) => {
        const { visitedPanels, currentPanelIndex } = this.state;

        let updatedVisitedPanels = visitedPanels;
        if (!visitedPanels.contains(index)) {
            updatedVisitedPanels = visitedPanels.push(index);
        }

        if (!collapsed) {
            this.setState(() => ({
                visitedPanels: updatedVisitedPanels,
                currentPanelIndex: index,
                firstState: false,
                validatePanel: currentPanelIndex
            }), callback());
        }
        else {
            if (currentPanelIndex === index) {
                this.setState(() => ({
                    visitedPanels: updatedVisitedPanels,
                    currentPanelIndex: undefined,
                    firstState: false,
                    validatePanel: currentPanelIndex
                }), callback());
            }
            else {
                callback();
            }
        }
    };

    onFinish = () => {
        const { model, visitedPanels, currentPanelIndex } = this.state;
        const { beforeFinish } = this.props;

        let updatedVisitedPanels = visitedPanels;
        if (!visitedPanels.contains(currentPanelIndex)) {
            updatedVisitedPanels = visitedPanels.push(currentPanelIndex);
        }

        // This first setState forces the current expanded panel to validate its fields and display and errors
        // the callback setState then sets that to undefined so it doesn't keep validating every render
        this.setState((state) => ({validatePanel: state.currentPanelIndex, visitedPanels: updatedVisitedPanels}), () => {
            this.setState(() => ({validatePanel: undefined}), () => {
                if (this.isValid()) {
                    this.setState(() => ({submitting: true}));
                    if (beforeFinish) {
                        beforeFinish(model);
                    }

                    console.log('TIME TO SAVE THE DATA CLASS MODEL');
                    // saveAssayDesign(protocolModel)
                    //     .then((response) => {
                    //         this.setState(() => ({protocolModel, submitting: false}));
                    //         this.props.onComplete(response);
                    //     })
                    //     .catch((protocolModel) => {
                    //         this.setState(() => ({protocolModel, submitting: false}));
                    //     });
                }
            });
        });
    };

    isValid(): boolean {
        return DataClassModel.isValid(this.state.model);
    }

    onDomainChange = (domain: DomainDesign) => {
        const { onChange } = this.props;

        this.setState((state) => ({
            model: state.model.merge({domain}) as DataClassModel
        }), () => {
            if (onChange) {
                onChange(this.state.model);
            }
        });
    };

    onPropertiesChange = (model: DataClassModel) => {
        const { onChange } = this.props;

        this.setState(() => ({model}), () => {
            if (onChange) {
                onChange(model);
            }
        });
    };

    render() {
        const { onCancel, appPropertiesOnly, containerTop, useTheme, noun, nameExpressionInfoUrl, nameExpressionPlaceholder, headerText, successBsStyle } = this.props;
        const { model, currentPanelIndex, validatePanel, visitedPanels, firstState } = this.state;

        let errorDomains = List<string>();
        if (model.domain.hasException() && model.domain.domainException.severity === SEVERITY_LEVEL_ERROR) {
            errorDomains = errorDomains.push(DomainFormImpl.getHeaderName(model.domain.name, undefined, model.name));
        }

        const bottomErrorMsg = getDomainBottomErrorMessage(undefined, errorDomains, model.hasValidProperties(), visitedPanels);

        return (
            <>
                <DataClassPropertiesPanel
                    noun={noun}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    headerText={headerText}
                    model={model}
                    onChange={this.onPropertiesChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 0 }
                    panelStatus={model.isNew() ? getDomainPanelStatus(0, currentPanelIndex, visitedPanels, firstState) : "COMPLETE"}
                    validate={validatePanel === 0}
                    appPropertiesOnly={appPropertiesOnly}
                    onToggle={(collapsed, callback) => {this.onTogglePanel(0, collapsed, callback);}}
                    useTheme={useTheme}
                />
                <DomainForm
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerPrefix={model.name}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 1}
                    validate={validatePanel === 1}
                    panelStatus={model.isNew() ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState) : "COMPLETE"}
                    showInferFromFile={true}
                    containerTop={containerTop}
                    onChange={this.onDomainChange}
                    onToggle={(collapsed, callback) => {this.onTogglePanel(1, collapsed, callback);}}
                    appPropertiesOnly={appPropertiesOnly}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                />
                {bottomErrorMsg &&
                    <div className={'domain-form-panel'}>
                        <Alert bsStyle="danger">{bottomErrorMsg}</Alert>
                    </div>
                }
                <div className={'domain-form-panel domain-designer-buttons'}>
                    <Button onClick={onCancel}>Cancel</Button>
                    <Button className='pull-right' bsStyle={successBsStyle || 'success'} disabled={this.state.submitting} onClick={this.onFinish}>Save</Button>
                </div>
            </>
        )
    }
}
