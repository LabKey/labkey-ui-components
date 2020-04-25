import React from 'react';
import { List } from 'immutable';
import produce, { Draft } from 'immer';

import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';
import { getDomainPanelStatus, saveDomain } from '../actions';
import { resolveErrorMessage } from '../../../util/messaging';
import DomainForm from '../DomainForm';
import { DomainDesign } from '../models';

import { IssuesPropertiesPanel } from './IssuesPropertiesPanel';
import { IssuesModel } from './models';

interface Props {
    initModel?: IssuesModel;
    onChange?: (model: IssuesModel) => void;
    onCancel: () => void;
    onComplete: (model: IssuesModel) => void;
    useTheme?: boolean;
    containerTop?: number; // This sets the top of the sticky header, default is 0
    successBsStyle?: string;
    saveBtnText?: string;
}

interface State {
    model: IssuesModel;
}

class IssuesDesignerPanelsImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        this.state = {
            model: props.initModel || IssuesModel.create({}),
        };
    }

    onPropertiesChange = (model: IssuesModel) => {
        const { onChange } = this.props;

        this.setState(
            () => ({ model }),
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
            state => ({
                model: state.model.merge({ domain }) as IssuesModel,
            }),
            () => {
                if (onChange && dirty) {
                    onChange(this.state.model);
                }
            }
        );
    };

    onFinish = () => {
        const { setSubmitting } = this.props;
        const { model } = this.state;
        const isValid = IssuesModel.isValid(model);

        this.props.onFinish(isValid, this.saveDomain);

        // TODO
        // if (!isValid) {
        //     const exception = !model.hasValidKeyType()
        //         ? 'You must specify a key field for your list in the fields panel to continue.'
        //         : undefined;
        //     const updatedModel = model.set('exception', exception) as IssuesModel;
        //     setSubmitting(false, () => {
        //         this.setState(() => ({ model: updatedModel }));
        //     });
        // }
    };

    saveDomain = () => {
        const { setSubmitting } = this.props;
        const { model } = this.state;

        saveDomain(model.domain, model.domainKindName, model.getOptions(), model.name)
            .then(response => {

                this.setState(
                    produce((draft: Draft<State>) => {
                        const updatedModel = draft.model;
                        updatedModel.exception = undefined;
                        updatedModel.domain = response;
                    }),
                    () => {
                        setSubmitting(false, () => {
                            const { model } = this.state;
                            this.props.onComplete(model);
                    })
                });
            })
            .catch(response => {
                const exception = resolveErrorMessage(response);

                this.setState(
                    produce((draft: Draft<State>) => {
                        const updatedModel = draft.model;
                        if (exception) {
                            updatedModel.exception = exception;
                        } else {
                            updatedModel.exception = undefined;
                            updatedModel.domain = Object.assign(updatedModel.domain, response);
                        }
                    })
                )
            });
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
                name={model.name}
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
                <IssuesPropertiesPanel
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
                    helpNoun="list"
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
                    showInferFromFile={true}
                    containerTop={containerTop}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(1, collapsed, callback);
                    }}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                />
            </BaseDomainDesigner>
        );
    }
}

export const IssuesDesignerPanels = withBaseDomainDesigner<Props>(IssuesDesignerPanelsImpl);
