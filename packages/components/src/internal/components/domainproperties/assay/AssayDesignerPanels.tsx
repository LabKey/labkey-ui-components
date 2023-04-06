import React from 'react';
import { Map } from 'immutable';

import { DomainDesign, HeaderRenderer, IDomainFormDisplayOptions } from '../models';

import { getDomainPanelStatus } from '../actions';

import DomainForm from '../DomainForm';
import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS } from '../constants';

import { GENERAL_ASSAY_PROVIDER_NAME } from '../../assay/constants';

import { saveAssayDesign } from './actions';
import { AssayProtocolModel } from './models';
import { AssayPropertiesPanel } from './AssayPropertiesPanel';

export interface AssayDesignerPanelsProps {
    appDomainHeaders?: Map<string, HeaderRenderer>;
    appIsValidMsg?: (model: AssayProtocolModel) => string;
    appPropertiesOnly?: boolean;
    beforeFinish?: (model: AssayProtocolModel) => void;
    containerTop?: number; // This sets the top of the sticky header, default is 0
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    hideEmptyBatchDomain?: boolean;
    initModel: AssayProtocolModel;
    onCancel: () => void;
    onChange?: (model: AssayProtocolModel) => void;
    onComplete: (model: AssayProtocolModel) => void;
    saveBtnText?: string;
    successBsStyle?: string;
    testMode?: boolean;
    useTheme?: boolean;
}

type Props = AssayDesignerPanelsProps & InjectedBaseDomainDesignerProps;

interface State {
    protocolModel: AssayProtocolModel;
}

// Exported for testing
export class AssayDesignerPanelsImpl extends React.PureComponent<Props, State> {
    panelCount = 1; // start at 1 for the AssayPropertiesPanel, will updated count after domains are defined in constructor

    static defaultProps = {
        domainFormDisplayOptions: DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    };

    constructor(props: Props) {
        super(props);

        this.panelCount = this.panelCount + props.initModel.domains.size;

        this.state = {
            protocolModel: props.initModel,
        };
    }

    onDomainChange = (index: number, updatedDomain: DomainDesign, dirty: boolean): void => {
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
                if (dirty) {
                    onChange?.(this.state.protocolModel);
                }
            }
        );
    };

    shouldSkipBatchDomain(domain: DomainDesign): boolean {
        return (
            this.props.hideEmptyBatchDomain && domain && domain.isNameSuffixMatch('Batch') && domain.fields.size === 0
        );
    }

    onFinish = (): void => {
        const { setSubmitting } = this.props;
        const { protocolModel } = this.state;
        const appIsValidMsg = this.getAppIsValidMsg();
        const textChoiceValidMsg = this.getTextChoiceUpdatesValidMsg();
        const isValid = protocolModel.isValid() && textChoiceValidMsg === undefined && appIsValidMsg === undefined;

        this.props.onFinish(isValid, this.saveDomain);

        if (!isValid) {
            const exception =
                appIsValidMsg !== undefined
                    ? appIsValidMsg
                    : textChoiceValidMsg ?? protocolModel.getFirstDomainFieldError();
            const updatedModel = protocolModel.set('exception', exception) as AssayProtocolModel;
            setSubmitting(false, () => {
                this.setState(() => ({ protocolModel: updatedModel }));
            });
        }
    };

    saveDomain = (): void => {
        const { beforeFinish, setSubmitting } = this.props;
        const { protocolModel } = this.state;

        beforeFinish?.(protocolModel);

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

    getTextChoiceUpdatesValidMsg(): string {
        const { protocolModel } = this.state;

        const runDomain = protocolModel.getDomainByNameSuffix('Run');
        if (runDomain && !protocolModel.editableRuns && this.domainHasTextChoiceUpdates(runDomain)) {
            return 'Text choice value updates are not allowed when assay does not allow "Editable Runs".';
        }

        const dataDomain = protocolModel.getDomainByNameSuffix('Data');
        if (dataDomain && !protocolModel.editableResults && this.domainHasTextChoiceUpdates(dataDomain)) {
            return 'Text choice value updates are not allowed when assay does not allow "Editable Results".';
        }

        return undefined;
    }

    domainHasTextChoiceUpdates(domain: DomainDesign): boolean {
        return (
            domain.fields.find(field => {
                const valueUpdates = field.textChoiceValidator?.extraProperties?.valueUpdates ?? {};
                return Object.keys(valueUpdates).length > 0;
            }) !== undefined
        );
    }

    onAssayPropertiesChange = (protocolModel: AssayProtocolModel): void => {
        this.setState({ protocolModel }, () => {
            this.props.onChange?.(protocolModel);
        });
    };

    getAppDomainHeaderRenderer = (domain: DomainDesign): HeaderRenderer => {
        const { appDomainHeaders } = this.props;

        if (!appDomainHeaders) return undefined;

        return appDomainHeaders.filter((v, k) => domain.isNameSuffixMatch(k)).first();
    };

    render() {
        const {
            appPropertiesOnly,
            domainFormDisplayOptions,
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
            testMode,
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
                    hideStudyProperties={!!domainFormDisplayOptions && domainFormDisplayOptions.hideStudyPropertyTypes}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(0, collapsed, callback);
                    }}
                    useTheme={useTheme}
                />
                {protocolModel.domains.map((domain, i) => {
                    // optionally hide the Batch Fields domain from the UI
                    if (this.shouldSkipBatchDomain(domain)) {
                        return;
                    }

                    // allow empty domain to be inferred from a file for Data Fields in General assay
                    const hideInferFromFile =
                        protocolModel.providerName !== GENERAL_ASSAY_PROVIDER_NAME || !domain.isNameSuffixMatch('Data');
                    // The File property type should be hidden for Data domains if the display options indicate this.
                    // We will always allow file property types for the Batch and Run domains.
                    const hideFilePropertyType =
                        domainFormDisplayOptions.hideFilePropertyType &&
                        !domain.isNameSuffixMatch('Batch') &&
                        !domain.isNameSuffixMatch('Run');
                    const appDomainHeaderRenderer = this.getAppDomainHeaderRenderer(domain);
                    const textChoiceLockedForDomain = !(
                        (domain.isNameSuffixMatch('Run') && protocolModel.editableRuns) ||
                        (domain.isNameSuffixMatch('Data') && protocolModel.editableResults)
                    );

                    return (
                        <DomainForm
                            key={domain.domainId || i}
                            index={domain.domainId || i}
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
                            successBsStyle={successBsStyle}
                            testMode={testMode}
                            domainFormDisplayOptions={{
                                ...domainFormDisplayOptions,
                                domainKindDisplayName: 'assay design',
                                hideFilePropertyType,
                                hideInferFromFile,
                                textChoiceLockedForDomain,
                            }}
                        >
                            <div>{domain.description}</div>
                        </DomainForm>
                    );
                })}
            </BaseDomainDesigner>
        );
    }
}

export const AssayDesignerPanels = withBaseDomainDesigner<AssayDesignerPanelsProps>(AssayDesignerPanelsImpl);
