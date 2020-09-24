import React from 'react';
import { List } from 'immutable';
import produce, { Draft } from 'immer';

import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';
import { getDomainPanelStatus, saveDomain } from '../actions';
import { resolveErrorMessage } from '../../../util/messaging';
import DomainForm from '../DomainForm';
import { DomainDesign } from '../models';

import { IssuesListDefPropertiesPanel } from './IssuesListDefPropertiesPanel';
import { IssuesListDefModel } from './models';
import { saveIssueListDefOptions } from './actions';

interface Props {
    initModel?: IssuesListDefModel;
    onChange?: (model: IssuesListDefModel) => void;
    onCancel: () => void;
    onComplete: (model: IssuesListDefModel) => void;
    useTheme?: boolean;
    containerTop?: number; // This sets the top of the sticky header, default is 0
    successBsStyle?: string;
    saveBtnText?: string;
}

interface State {
    model: IssuesListDefModel;
}

class IssuesDesignerPanelsImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
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
        const { setSubmitting } = this.props;
        const { model } = this.state;

        saveIssueListDefOptions(model.getOptions())
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

        saveDomain(model.domain, model.domainKindName, model.getOptions(), model.issueDefName)
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
            onCancel,
            useTheme,
            containerTop,
            successBsStyle,
            visitedPanels,
            currentPanelIndex,
            firstState,
            validatePanel,
            submitting,
            onTogglePanel,
            saveBtnText,
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
                successBsStyle={successBsStyle}
            >
                <IssuesListDefPropertiesPanel
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
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
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
                    containerTop={containerTop}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(1, collapsed, callback);
                    }}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                    domainFormDisplayOptions={{
                        isDragDisabled: model.domain.isSharedDomain(),
                        hideAddFieldsButton: model.domain.isSharedDomain(),
                    }}
                />
            </BaseDomainDesigner>
        );
    }
}

export const IssuesListDefDesignerPanels = withBaseDomainDesigner<Props>(IssuesDesignerPanelsImpl);
