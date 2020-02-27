import React from 'react';
import { List, Map } from 'immutable';
import { DomainDesign, HeaderRenderer } from '../models';
import { AssayProtocolModel } from '../assay/models';
import { saveAssayDesign } from '../assay/actions';
import {
    getDomainBottomErrorMessage,
    getDomainHeaderName,
    getDomainPanelStatus,
    getUpdatedVisitedPanelsList
} from '../actions';
import { AssayPropertiesPanel } from './AssayPropertiesPanel';
import DomainForm from '../DomainForm';
import { Button } from 'react-bootstrap';
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
    appPropertiesOnly?: boolean
    appDomainHeaders?: Map<string, HeaderRenderer>
    appIsValidMsg?: (model: AssayProtocolModel) => string
    useTheme?: boolean
    successBsStyle?: string
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
            visitedPanels: List<number>(),
            validatePanel: undefined,
            firstState: true
        }
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

    shouldSkipBatchDomain(domain: DomainDesign): boolean {
        return this.props.hideEmptyBatchDomain && domain && domain.isNameSuffixMatch('Batch') && domain.fields.size === 0;
    }

    onTogglePanel = (index: number, collapsed: boolean, callback: () => any) => {
        const { visitedPanels, currentPanelIndex } = this.state;
        const updatedVisitedPanels = getUpdatedVisitedPanelsList(visitedPanels, index);

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
        const { protocolModel, visitedPanels, currentPanelIndex } = this.state;
        const { beforeFinish } = this.props;
        const updatedVisitedPanels = getUpdatedVisitedPanelsList(visitedPanels, currentPanelIndex);

        // This first setState forces the current expanded panel to validate its fields and display and errors
        // the callback setState then sets that to undefined so it doesn't keep validating every render
        this.setState((state) => ({validatePanel: state.currentPanelIndex, visitedPanels: updatedVisitedPanels}), () => {
            this.setState((state) => ({validatePanel: undefined}), () => {
                if (this.isValid()) {
                    this.setState(() => ({submitting: true}));
                    if (beforeFinish) {
                        beforeFinish(protocolModel);
                    }

                    saveAssayDesign(protocolModel)
                        .then((response) => {
                            this.setState(() => ({protocolModel, submitting: false}));
                            this.props.onComplete(response);
                        })
                        .catch((protocolModel) => {
                            this.setState(() => ({protocolModel, submitting: false}));
                        });
                }
                else if (this.getAppIsValidMsg() !== undefined) {
                    this.setState(() => ({protocolModel: protocolModel.set('exception', this.getAppIsValidMsg()) as AssayProtocolModel}));
                }
            });
        });
    };

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

    getAppDomainHeaderRenderer = (domain: DomainDesign): HeaderRenderer =>  {
        const {appDomainHeaders} = this.props;

        if (!appDomainHeaders)
            return undefined;

        return appDomainHeaders.filter((v,k) => domain.isNameSuffixMatch(k)).first();
    };

    render() {
        const { onCancel, appPropertiesOnly, containerTop, useTheme, successBsStyle } = this.props;
        const { protocolModel, currentPanelIndex, validatePanel, visitedPanels, firstState } = this.state;

        // get a list of the domain names that have errors
        const errorDomains = protocolModel.domains.filter((domain) => {
                return domain.hasException() && domain.domainException.severity === SEVERITY_LEVEL_ERROR
            })
            .map((domain) => {
                return getDomainHeaderName(domain.name, undefined, protocolModel.name)
            })
            .toList();

        const bottomErrorMsg = getDomainBottomErrorMessage(protocolModel.exception, errorDomains, protocolModel.hasValidProperties(), visitedPanels);

        return (
            <>
                <AssayPropertiesPanel
                    model={protocolModel}
                    onChange={this.onAssayPropertiesChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 0 }
                    panelStatus={protocolModel.isNew() ? getDomainPanelStatus(0, currentPanelIndex, visitedPanels, firstState) : "COMPLETE"}
                    validate={validatePanel === 0}
                    appPropertiesOnly={appPropertiesOnly}
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
                    const showFilePropertyType = domain.isNameSuffixMatch('Batch') || domain.isNameSuffixMatch('Run');
                    const appDomainHeaderRenderer = this.getAppDomainHeaderRenderer(domain);

                    return (
                        <DomainForm
                            key={domain.domainId || i}
                            domainIndex={i}
                            domain={domain}
                            headerPrefix={protocolModel.name}
                            controlledCollapse={true}
                            initCollapsed={currentPanelIndex !== (i+1)}
                            validate={validatePanel === i + 1}
                            panelStatus={protocolModel.isNew() ? getDomainPanelStatus((i + 1), currentPanelIndex, visitedPanels, firstState) : "COMPLETE"}
                            showInferFromFile={showInferFromFile}
                            containerTop={containerTop}
                            helpTopic={null} // null so that we don't show the "learn more about this tool" link for these domains
                            onChange={(updatedDomain, dirty) => {
                                this.onDomainChange(i, updatedDomain);
                            }}
                            onToggle={(collapsed, callback) => {
                                this.onTogglePanel((i + 1), collapsed, callback);
                            }}
                            appDomainHeaderRenderer={appDomainHeaderRenderer}
                            modelDomains={protocolModel.domains}
                            useTheme={useTheme}
                            appPropertiesOnly={appPropertiesOnly}
                            showFilePropertyType={showFilePropertyType}
                            successBsStyle={successBsStyle}
                        >
                            <div>{domain.description}</div>
                        </DomainForm>
                    )
                })}
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
