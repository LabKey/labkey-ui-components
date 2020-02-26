import React from 'react';
import { Alert, Button } from "react-bootstrap";
import { List } from "immutable";
import { ActionURL } from "@labkey/api";
import { ListPropertiesPanel } from "./ListPropertiesPanel";
import { DomainDesign, IAppDomainHeader } from "../models";
import DomainForm from "../DomainForm";
import { getDomainBottomErrorMessage, getDomainHeaderName, getDomainPanelStatus, saveDomain } from "../actions";
import { importData } from "../../../query/api";
import { SEVERITY_LEVEL_ERROR } from "../constants";
import { ListModel } from "./models";
import { SetKeyFieldNamePanel } from './SetKeyFieldNamePanel';

interface Props {
    initModel: ListModel
    onChange?: (model: ListModel) => void
    onCancel: () => void
    onComplete: (model: ListModel) => void
    useTheme?: boolean
    containerTop?: number
    successBsStyle?: string
}

interface State {
    model?: ListModel;
    submitting?: boolean;
    currentPanelIndex?: number;
    visitedPanels?: List<number>;
    validatePanel?: number;
    firstState?: boolean;
    fileImportData?: any;
}

export class ListDesignerPanels extends React.PureComponent<Props, State> {
    constructor(props) {
        super(props);

        this.state = {
            model: props.initModel || ListModel.create({}),
            submitting: false,
            currentPanelIndex: 0,
            visitedPanels: List<number>(),
            validatePanel: undefined,
            firstState: true,
        };
    }

    onTogglePanel = (index: number, collapsed: boolean, callback: () => any) => {
        const { visitedPanels, currentPanelIndex } = this.state;

        let updatedVisitedPanels = visitedPanels;
        if (!visitedPanels.contains(index)) {
            updatedVisitedPanels = visitedPanels.push(index);
        }

        if (!collapsed) {
            this.setState(
                () => ({
                    visitedPanels: updatedVisitedPanels,
                    currentPanelIndex: index,
                    firstState: false,
                    validatePanel: currentPanelIndex,
                }), callback());
        } else {
            if (currentPanelIndex === index) {
                this.setState(
                    () => ({
                        visitedPanels: updatedVisitedPanels,
                        currentPanelIndex: undefined,
                        firstState: false,
                        validatePanel: currentPanelIndex,
                    }), callback());
            } else {
                callback();
            }
        }
    };

    onPropertiesChange = (model: ListModel) => {
        const { onChange } = this.props;

        this.setState(() => ({model}), () => {
            if (onChange) {
                onChange(model);
            }
        });
    };

    onDomainChange = (domain: DomainDesign): void => {
        const { onChange } = this.props;

        this.setState((state) => ({
            model: state.model.merge({domain}) as ListModel
        }), () => {
            if (onChange) {
                onChange(this.state.model);
            }
        });
    };

    setFileImportData = fileImportData => {
        this.setState({ fileImportData });
    };

    handleFileImport() {
        const { fileImportData, model } = this.state;

        importData({
            schemaName: 'lists',
            queryName: model.name,
            file: fileImportData,
            importUrl: ActionURL.buildURL(
                'list',
                'UploadListItems',
                LABKEY.container.path,
                {'name': model.name})
        })
        .then((response) => {
            this.setState(() => ({submitting: false}));
            this.props.onComplete(model);
        })
        .catch((error) => {
            console.error(error);
            // TODO
        });
    }

    onFinish = () => {
        const { model, visitedPanels, currentPanelIndex, fileImportData } = this.state;

        let updatedVisitedPanels = visitedPanels;
        if (!visitedPanels.contains(currentPanelIndex)) {
            updatedVisitedPanels = visitedPanels.push(currentPanelIndex);
        }

        // This first setState forces the current expanded panel to validate its fields and display and errors
        // the callback setState then sets that to undefined so it doesn't keep validating every render
        this.setState(
            state => ({ validatePanel: state.currentPanelIndex, visitedPanels: updatedVisitedPanels }),
            () => {
                this.setState(
                    () => ({ validatePanel: undefined }),
                    () => {
                    if (this.isValid()) {
                        this.setState(() => ({ submitting: true }));

                        saveDomain(model.domain, model.getDomainKind(), model.getOptions(), model.name)
                            .then((response) => {
                                let updatedModel = model.set('exception', undefined) as ListModel;
                                updatedModel = updatedModel.merge({domain: response}) as ListModel;
                                this.setState(() => ({model: updatedModel}));

                                // If we're importing List file data, import file contents
                                if (fileImportData) {
                                    this.handleFileImport();
                                }
                                else {
                                    this.setState(() => ({submitting: false}));
                                    this.props.onComplete(updatedModel);
                                }
                            })
                            .catch((response) => {
                                const updatedModel = response.exception
                                    ? model.set('exception', response.exception) as ListModel
                                    : model.merge({domain: response, exception: undefined}) as ListModel;
                                this.setState(() => ({model: updatedModel, submitting: false}));
                            });
                    }
                    else if (!model.hasValidKeyType()) {
                        const updatedModel = model.set('exception', 'You must specify a key field for your list in the fields panel to continue.') as ListModel;
                        this.setState(() => ({model: updatedModel, submitting: false}));
                    }
            });
        });
    };

    isValid(): boolean {
        return ListModel.isValid(this.state.model);
    }

    headerRenderer = (config: IAppDomainHeader) => {
        return (
            <SetKeyFieldNamePanel
                model={this.state.model}
                onModelChange={this.onPropertiesChange}
                {...config}
            />
        );
    };

    render() {
        const { onCancel, useTheme, containerTop, successBsStyle } = this.props;
        const { model, visitedPanels, currentPanelIndex, firstState, validatePanel } = this.state;

        let errorDomains = List<string>();
        if (model.domain.hasException() && model.domain.domainException.severity === SEVERITY_LEVEL_ERROR) {
            errorDomains = errorDomains.push(getDomainHeaderName(model.domain.name, undefined, model.name));
        }

        const bottomErrorMsg = getDomainBottomErrorMessage(model.exception, errorDomains, model.hasValidProperties(), visitedPanels);

        return (
            <>
                <ListPropertiesPanel
                    model={model}
                    onChange={this.onPropertiesChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 0}
                    panelStatus={model.isNew() ? getDomainPanelStatus(0, currentPanelIndex, visitedPanels, firstState) : 'COMPLETE'}
                    validate={validatePanel === 0}
                    onToggle={(collapsed, callback) => {this.onTogglePanel(0, collapsed, callback);}}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                />

                <DomainForm
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle={'Fields'}
                    helpNoun={'list'}
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    onChange={this.onDomainChange}
                    setFileImportData={this.setFileImportData}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 1}
                    validate={validatePanel === 1}
                    panelStatus={model.isNew() ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState) : 'COMPLETE'}
                    showInferFromFile={true}
                    containerTop={containerTop}
                    onToggle={(collapsed, callback) => {this.onTogglePanel(1, collapsed, callback);}}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                    appDomainHeaderRenderer={model.isNew() && model.domain.fields.size > 0 && this.headerRenderer}
                />

                {bottomErrorMsg && (
                    <div className="domain-form-panel">
                        <Alert bsStyle="danger">{bottomErrorMsg}</Alert>
                    </div>
                )}

                <div className='domain-form-panel domain-assay-buttons'>
                    <Button onClick={onCancel}>
                        Cancel
                    </Button>
                    <Button
                        className="pull-right"
                        bsStyle={successBsStyle || 'success'}
                        disabled={this.state.submitting}
                        onClick={this.onFinish}>
                        Save
                    </Button>
                </div>
            </>
        );
    }
}
