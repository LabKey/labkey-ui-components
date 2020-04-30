import React from 'react';
import { Map } from 'immutable';

import { DomainDesign, HeaderRenderer } from '../models';

import { getDomainPanelStatus } from '../actions';

import DomainForm from '../DomainForm';
import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { saveAssayDesign } from './actions';
import { AssayProtocolModel } from './models';
import { AssayPropertiesPanel } from './AssayPropertiesPanel';

interface Props {
    onChange?: (model: AssayProtocolModel) => void;
    onCancel: () => void;
    beforeFinish?: (model: AssayProtocolModel) => void;
    onComplete: (model: AssayProtocolModel) => void;
    initModel: AssayProtocolModel;
    hideEmptyBatchDomain?: boolean;
    containerTop?: number; // This sets the top of the sticky header, default is 0
    appPropertiesOnly?: boolean;
    appDomainHeaders?: Map<string, HeaderRenderer>;
    appIsValidMsg?: (model: AssayProtocolModel) => string;
    useTheme?: boolean;
    successBsStyle?: string;
    saveBtnText?: string;
}

interface State {
    protocolModel: AssayProtocolModel;
}

class AssayDesignerPanelsImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    panelCount = 1; // start at 1 for the AssayPropertiesPanel, will updated count after domains are defined in constructor

    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        this.panelCount = this.panelCount + props.initModel.domains.size;

        this.state = {
            protocolModel: props.initModel,
        };
    }

    onDomainChange = (index: number, updatedDomain: DomainDesign, dirty: boolean) => {
        const { onChange } = this.props;

        this.setState(
            state => {
                const domains = state.protocolModel.domains.map((domain, i) => {
                    return i === index ? updatedDomain : domain;
                });
                const updatedModel = state.protocolModel.merge({ domains }) as AssayProtocolModel;

                return {
                    protocolModel: updatedModel,
                };
            },
            () => {
                // Issue 39918: use the dirty property that DomainForm onChange passes
                if (onChange && dirty) {
                    onChange(this.state.protocolModel);
                }
            }
        );
    };

    shouldSkipBatchDomain(domain: DomainDesign): boolean {
        return (
            this.props.hideEmptyBatchDomain && domain && domain.isNameSuffixMatch('Batch') && domain.fields.size === 0
        );
    }

    onFinish = () => {
        const { setSubmitting } = this.props;
        const { protocolModel } = this.state;
        const appIsValidMsg = this.getAppIsValidMsg();
        const isValid = AssayProtocolModel.isValid(protocolModel) && appIsValidMsg === undefined;

        this.props.onFinish(isValid, this.saveDomain);

        if (!isValid) {
            const exception = appIsValidMsg !== undefined ? appIsValidMsg : undefined;
            const updatedModel = protocolModel.set('exception', exception) as AssayProtocolModel;
            setSubmitting(false, () => {
                this.setState(() => ({ protocolModel: updatedModel }));
            });
        }
    };

    saveDomain = () => {
        const { beforeFinish, setSubmitting } = this.props;
        const { protocolModel } = this.state;

        if (beforeFinish) {
            beforeFinish(protocolModel);
        }

        saveAssayDesign(protocolModel)
            .then(response => {
                this.setState(() => ({ protocolModel }));
                setSubmitting(false, () => {
                    this.props.onComplete(response);
                });
            })
            .catch(protocolModel => {
                setSubmitting(false, () => {
                    this.setState(() => ({ protocolModel }));
                });
            });
    };

    getAppIsValidMsg(): string {
        const { appIsValidMsg } = this.props;
        const { protocolModel } = this.state;

        return !appIsValidMsg ? undefined : appIsValidMsg(protocolModel);
    }

    onAssayPropertiesChange = (model: AssayProtocolModel) => {
        const { onChange } = this.props;

        this.setState(
            () => ({
                protocolModel: model,
            }),
            () => {
                if (onChange) {
                    onChange(model);
                }
            }
        );
    };

    getAppDomainHeaderRenderer = (domain: DomainDesign): HeaderRenderer => {
        const { appDomainHeaders } = this.props;

        if (!appDomainHeaders) return undefined;

        return appDomainHeaders.filter((v, k) => domain.isNameSuffixMatch(k)).first();
    };

    render() {
        const {
            appPropertiesOnly,
            containerTop,
            useTheme,
            successBsStyle,
            currentPanelIndex,
            validatePanel,
            visitedPanels,
            firstState,
            onTogglePanel,
            submitting,
            onCancel,
            saveBtnText,
        } = this.props;
        const { protocolModel } = this.state;

        return (
            <BaseDomainDesigner
                name={protocolModel.name}
                exception={protocolModel.exception}
                domains={protocolModel.domains}
                hasValidProperties={protocolModel.hasValidProperties()}
                visitedPanels={visitedPanels}
                submitting={submitting}
                onCancel={onCancel}
                onFinish={this.onFinish}
                saveBtnText={saveBtnText}
                successBsStyle={successBsStyle}
            >
                <AssayPropertiesPanel
                    model={protocolModel}
                    onChange={this.onAssayPropertiesChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 0}
                    panelStatus={
                        protocolModel.isNew()
                            ? getDomainPanelStatus(0, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    validate={validatePanel === 0}
                    appPropertiesOnly={appPropertiesOnly}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(0, collapsed, callback);
                    }}
                    useTheme={useTheme}
                />
                {protocolModel.domains.map((domain, i) => {
                    // optionally hide the Batch Fields domain from the UI (for sample management use case)
                    if (this.shouldSkipBatchDomain(domain)) {
                        return;
                    }

                    // allow empty domain to be inferred from a file for Data Fields in General assay
                    const showInferFromFile =
                        protocolModel.providerName === 'General' && domain.isNameSuffixMatch('Data');
                    const showFilePropertyType = domain.isNameSuffixMatch('Batch') || domain.isNameSuffixMatch('Run');
                    const appDomainHeaderRenderer = this.getAppDomainHeaderRenderer(domain);

                    return (
                        <DomainForm
                            key={domain.domainId || i}
                            domainIndex={i}
                            domain={domain}
                            headerPrefix={protocolModel.name}
                            controlledCollapse={true}
                            initCollapsed={currentPanelIndex !== i + 1}
                            validate={validatePanel === i + 1}
                            panelStatus={
                                protocolModel.isNew()
                                    ? getDomainPanelStatus(i + 1, currentPanelIndex, visitedPanels, firstState)
                                    : 'COMPLETE'
                            }
                            showInferFromFile={showInferFromFile}
                            containerTop={containerTop}
                            helpTopic={null} // null so that we don't show the "learn more about this tool" link for these domains
                            onChange={(updatedDomain, dirty) => {
                                this.onDomainChange(i, updatedDomain, dirty);
                            }}
                            onToggle={(collapsed, callback) => {
                                onTogglePanel(i + 1, collapsed, callback);
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
                    );
                })}
            </BaseDomainDesigner>
        );
    }
}

export const AssayDesignerPanels = withBaseDomainDesigner<Props>(AssayDesignerPanelsImpl);
