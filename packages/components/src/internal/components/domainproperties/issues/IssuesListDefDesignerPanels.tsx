import React from 'react';
import { List } from 'immutable';
import { Draft, produce } from 'immer';

import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';
import { getDomainPanelStatus, saveDomain } from '../actions';
import DomainForm from '../DomainForm';
import { DomainDesign } from '../models';

import { resolveErrorMessage } from '../../../util/messaging';

import { IssuesListDefPropertiesPanel } from './IssuesListDefPropertiesPanel';
import { IssuesListDefModel } from './models';
import { getDefaultIssuesAPIWrapper, IssuesAPIWrapper } from './actions';

interface Props {
    api?: IssuesAPIWrapper;
    initModel?: IssuesListDefModel;
    onCancel: () => void;
    onChange?: (model: IssuesListDefModel) => void;
    onComplete: (model: IssuesListDefModel) => void;
    saveBtnText?: string;
    testMode?: boolean;
}

interface State {
    model: IssuesListDefModel;
}

// exported for testing
export class IssuesDesignerPanelsImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    static defaultProps = {
        api: getDefaultIssuesAPIWrapper(),
    };

    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);
        this.state = produce(
            {
                model: props.initModel || IssuesListDefModel.create({}),
            },
            () => {}
        );
    }

    onPropertiesChange = (model: IssuesListDefModel) => {
        const { onChange } = this.props;

        this.setState(
            produce((draft: Draft<State>) => {
                draft.model = model;
            }),
            () => {
                if (onChange) {
                    onChange(model);
                }
            }
        );
    };

    onDomainChange = (domain: DomainDesign, dirty: boolean) => {
        const { onChange } = this.props;

        this.setState(
            produce((draft: Draft<State>) => {
                draft.model.domain = domain;
            }),
            () => {
                if (onChange && dirty) {
                    onChange(this.state.model);
                }
            }
        );
    };

    onFinish = () => {
        const { model } = this.state;
        this.props.onFinish(model.isValid(), model.domain.isSharedDomain() ? this.saveOptions : this.saveDomain);
    };

    saveOptions = () => {
        const { api, setSubmitting } = this.props;
        const { model } = this.state;

        api.saveIssueListDefOptions(model.getOptions())
            .then(() => this.onSaveComplete())
            .catch(response => {
                setSubmitting(false, () => {
                    this.setState(
                        produce((draft: Draft<State>) => {
                            draft.model.exception = response.exception;
                        })
                    );
                });
            });
    };

    saveDomain = () => {
        const { setSubmitting } = this.props;
        const { model } = this.state;

        saveDomain({
            domain: model.domain,
            kind: model.domainKindName,
            options: model.getOptions(),
            name: model.issueDefName,
        })
            .then(response => this.onSaveComplete(response))
            .catch(response => {
                const exception = resolveErrorMessage(response);

                setSubmitting(false, () => {
                    this.setState(
                        produce((draft: Draft<State>) => {
                            if (exception) {
                                draft.model.exception = exception;
                            } else {
                                draft.model.exception = undefined;
                                draft.model.domain = response;
                            }
                        })
                    );
                });
            });
    };

    onSaveComplete = (response?: any) => {
        const { setSubmitting } = this.props;

        this.setState(
            produce((draft: Draft<State>) => {
                draft.model.exception = undefined;
                if (response) {
                    draft.model.domain = response;
                }
            }),
            () => {
                setSubmitting(false, () => {
                    const { model } = this.state;
                    this.props.onComplete(model);
                });
            }
        );
    };

    render() {
        const {
            api,
            onCancel,
            visitedPanels,
            currentPanelIndex,
            firstState,
            validatePanel,
            submitting,
            onTogglePanel,
            saveBtnText,
            testMode,
        } = this.props;
        const { model } = this.state;

        return (
            <BaseDomainDesigner
                name={model.issueDefName}
                exception={model.exception}
                domains={List.of(model.domain)}
                hasValidProperties={model.hasValidProperties()}
                visitedPanels={visitedPanels}
                submitting={submitting}
                onCancel={onCancel}
                onFinish={this.onFinish}
                saveBtnText={saveBtnText}
            >
                <IssuesListDefPropertiesPanel
                    api={api}
                    model={model}
                    onChange={this.onPropertiesChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 0}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(0, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    validate={validatePanel === 0}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(0, collapsed, callback);
                    }}
                />
                <DomainForm
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle="Fields"
                    helpNoun="issues list"
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    onChange={this.onDomainChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 1}
                    validate={validatePanel === 1}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(1, collapsed, callback);
                    }}
                    domainFormDisplayOptions={{
                        isDragDisabled: model.domain.isSharedDomain(),
                        hideAddFieldsButton: model.domain.isSharedDomain(),
                        hideImportExport: true,
                        hideInferFromFile: true,
                    }}
                    testMode={testMode}
                />
            </BaseDomainDesigner>
        );
    }
}

export const IssuesListDefDesignerPanels = withBaseDomainDesigner<Props>(IssuesDesignerPanelsImpl);
