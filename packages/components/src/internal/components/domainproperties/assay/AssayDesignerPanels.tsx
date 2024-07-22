import React from 'react';
import { Map } from 'immutable';

import { getDefaultAPIWrapper } from '../../../APIWrapper';
import { DomainPropertiesAPIWrapper } from '../APIWrapper';

import { DomainDesign, HeaderRenderer, IDomainFormDisplayOptions } from '../models';

import { getDomainPanelStatus, scrollDomainErrorIntoView } from '../actions';

import DomainForm from '../DomainForm';
import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS } from '../constants';

import { GENERAL_ASSAY_PROVIDER_NAME } from '../../assay/constants';

import { DataTypeProjectsPanel } from '../DataTypeProjectsPanel';

import { AssayRunDataType } from '../../entities/constants';

import { ProjectConfigurableDataType } from '../../entities/models';

import { saveAssayDesign } from './actions';
import { AssayProtocolModel } from './models';
import { AssayPropertiesPanel } from './AssayPropertiesPanel';

const PROPERTIES_PANEL_INDEX = 0;
const DOMAIN_PANEL_INDEX = 1;

export interface AssayDesignerPanelsProps {
    allowProjectExclusion?: boolean;
    api?: DomainPropertiesAPIWrapper;
    appDomainHeaders?: Map<string, HeaderRenderer>;
    appIsValidMsg?: (model: AssayProtocolModel) => string;
    appPropertiesOnly?: boolean;
    beforeFinish?: (model: AssayProtocolModel) => void;
    containerTop?: number; // This sets the top of the sticky header, default is 0
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    hideAdvancedProperties?: boolean;
    hideEmptyBatchDomain?: boolean;
    initModel: AssayProtocolModel;
    onCancel: () => void;
    onChange?: (model: AssayProtocolModel) => void;
    onComplete: (model: AssayProtocolModel) => void;
    saveBtnText?: string;
}

type Props = AssayDesignerPanelsProps & InjectedBaseDomainDesignerProps;

interface State {
    protocolModel: AssayProtocolModel;
}

// Exported for testing
export class AssayDesignerPanelsImpl extends React.PureComponent<Props, State> {
    panelCount = 1; // start at 1 for the AssayPropertiesPanel, will updated count after domains are defined in constructor

    static defaultProps = {
        api: getDefaultAPIWrapper().domain,
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
                    : (textChoiceValidMsg ?? protocolModel.getFirstDomainFieldError());
            const updatedModel = protocolModel.set('exception', exception) as AssayProtocolModel;
            setSubmitting(false, () => {
                this.setState(
                    () => ({ protocolModel: updatedModel }),
                    () => {
                        scrollDomainErrorIntoView();
                    }
                );
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
            .catch(errorModel => {
                setSubmitting(false, () => {
                    this.setState(
                        () => ({ protocolModel: errorModel }),
                        () => {
                            scrollDomainErrorIntoView();
                        }
                    );
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

    onUpdateExcludedProjects = (_: ProjectConfigurableDataType, excludedContainerIds: string[]): void => {
        const { protocolModel } = this.state;
        const newModel = protocolModel.merge({ excludedContainerIds }) as AssayProtocolModel;
        this.onAssayPropertiesChange(newModel);
    };

    render() {
        const {
            allowProjectExclusion,
            initModel,
            api,
            appPropertiesOnly,
            hideAdvancedProperties,
            domainFormDisplayOptions,
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

        const isGpat = protocolModel.providerName === GENERAL_ASSAY_PROVIDER_NAME;
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
            >
                <AssayPropertiesPanel
                    model={protocolModel}
                    onChange={this.onAssayPropertiesChange}
                    controlledCollapse
                    initCollapsed={currentPanelIndex !== PROPERTIES_PANEL_INDEX}
                    panelStatus={
                        protocolModel.isNew()
                            ? getDomainPanelStatus(PROPERTIES_PANEL_INDEX, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    validate={validatePanel === PROPERTIES_PANEL_INDEX}
                    appPropertiesOnly={appPropertiesOnly}
                    hideAdvancedProperties={hideAdvancedProperties}
                    hideStudyProperties={!!domainFormDisplayOptions && domainFormDisplayOptions.hideStudyPropertyTypes}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(PROPERTIES_PANEL_INDEX, collapsed, callback);
                    }}
                    canRename={isGpat}
                />
                {protocolModel.domains.map((domain, i) => {
                    // optionally hide the Batch Fields domain from the UI
                    if (this.shouldSkipBatchDomain(domain)) {
                        return;
                    }

                    // allow empty domain to be inferred from a file for Data Fields in General assay
                    const hideInferFromFile = !isGpat || !domain.isNameSuffixMatch('Data');
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
                            api={api}
                            index={domain.domainId || i}
                            domainIndex={i}
                            domain={domain}
                            headerPrefix={initModel?.name}
                            controlledCollapse
                            initCollapsed={currentPanelIndex !== i + DOMAIN_PANEL_INDEX}
                            validate={validatePanel === i + DOMAIN_PANEL_INDEX}
                            panelStatus={
                                protocolModel.isNew()
                                    ? getDomainPanelStatus(
                                          i + DOMAIN_PANEL_INDEX,
                                          currentPanelIndex,
                                          visitedPanels,
                                          firstState
                                      )
                                    : 'COMPLETE'
                            }
                            helpTopic={null} // null so that we don't show the "learn more about this tool" link for these domains
                            onChange={(updatedDomain, dirty) => {
                                this.onDomainChange(i, updatedDomain, dirty);
                            }}
                            onToggle={(collapsed, callback) => {
                                onTogglePanel(i + DOMAIN_PANEL_INDEX, collapsed, callback);
                            }}
                            appDomainHeaderRenderer={appDomainHeaderRenderer}
                            modelDomains={protocolModel.domains}
                            appPropertiesOnly={hideAdvancedProperties}
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
                {appPropertiesOnly && allowProjectExclusion && (
                    <DataTypeProjectsPanel
                        controlledCollapse
                        dataTypeRowId={protocolModel?.protocolId}
                        dataTypeName={protocolModel?.name}
                        entityDataType={AssayRunDataType}
                        initCollapsed={currentPanelIndex !== protocolModel.domains.size + 1}
                        onToggle={(collapsed, callback) => {
                            onTogglePanel(protocolModel.domains.size + 1, collapsed, callback);
                        }}
                        onUpdateExcludedProjects={this.onUpdateExcludedProjects}
                    />
                )}
            </BaseDomainDesigner>
        );
    }
}

export const AssayDesignerPanels = withBaseDomainDesigner<AssayDesignerPanelsProps>(AssayDesignerPanelsImpl);
