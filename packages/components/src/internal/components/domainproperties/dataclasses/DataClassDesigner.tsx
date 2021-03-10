import React, { PureComponent, ReactNode } from 'react';
import { Draft, produce } from 'immer';
import { List } from 'immutable';

import { DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS, resolveErrorMessage } from '../../../..';
import { DomainDesign, IDomainField, IDomainFormDisplayOptions } from '../models';
import DomainForm from '../DomainForm';
import { getDomainPanelStatus, saveDomain } from '../actions';
import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { DataClassPropertiesPanel } from './DataClassPropertiesPanel';
import { DataClassModel, DataClassModelConfig } from './models';

interface Props {
    nounSingular?: string;
    nounPlural?: string;
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;
    headerText?: string;
    helpTopic?: string;
    defaultNameFieldConfig?: Partial<IDomainField>;
    initModel?: DataClassModel;
    onChange?: (model: DataClassModel) => void;
    onCancel: () => void;
    onComplete: (model: DataClassModel) => void;
    beforeFinish?: (model: DataClassModel) => void;
    useTheme?: boolean;
    containerTop?: number; // This sets the top of the sticky header, default is 0
    appPropertiesOnly?: boolean;
    successBsStyle?: string;
    saveBtnText?: string;
    testMode?: boolean;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
}

interface State {
    model: DataClassModel;
}

class DataClassDesignerImpl extends PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    static defaultProps = {
        nounSingular: 'Data Class',
        nounPlural: 'Data Classes',
        domainFormDisplayOptions: { ...DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS, domainKindDisplayName: 'data class' },
    };

    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        this.state = produce(
            {
                model: props.initModel || DataClassModel.create({}),
            },
            () => {}
        );
    }

    onFinish = (): void => {
        const { defaultNameFieldConfig, setSubmitting, nounSingular } = this.props;
        const { model } = this.state;
        const isValid = model.isValid(defaultNameFieldConfig);

        this.props.onFinish(isValid, this.saveDomain);

        if (!isValid) {
            let exception: string;

            if (model.hasInvalidNameField(defaultNameFieldConfig)) {
                exception =
                    'The ' +
                    defaultNameFieldConfig.name +
                    ' field name is reserved for imported or generated ' +
                    nounSingular +
                    ' ids.';
            }

            setSubmitting(false, () => {
                this.saveModel({ exception });
            });
        }
    };

    saveDomain = (): void => {
        const { setSubmitting, beforeFinish } = this.props;
        const { model } = this.state;

        if (beforeFinish) {
            beforeFinish(model);
        }

        saveDomain(model.domain, 'DataClass', model.options, model.name)
            .then(response => {
                setSubmitting(false, () => {
                    this.saveModel({ domain: response, exception: undefined }, () => {
                        this.props.onComplete(this.state.model);
                    });
                });
            })
            .catch(response => {
                const exception = resolveErrorMessage(response);

                setSubmitting(false, () => {
                    if (exception) {
                        this.saveModel({ exception });
                    } else {
                        this.saveModel({ domain: response, exception: undefined });
                    }
                });
            });
    };

    saveModel = (modelOrProps: DataClassModel | Partial<DataClassModelConfig>, callback?: () => void): void => {
        this.setState(
            produce((draft: Draft<State>) => {
                if (modelOrProps instanceof DataClassModel) {
                    draft.model = modelOrProps;
                } else {
                    Object.assign(draft.model, modelOrProps);
                }
            }),
            callback
        );
    };

    onDomainChange = (domain: DomainDesign, dirty: boolean): void => {
        const { onChange } = this.props;

        this.saveModel({ domain }, () => {
            // Issue 39918: use the dirty property that DomainForm onChange passes
            if (onChange && dirty) {
                onChange(this.state.model);
            }
        });
    };

    onPropertiesChange = (model: DataClassModel): void => {
        const { onChange } = this.props;

        this.saveModel(model, () => {
            if (onChange) {
                onChange(this.state.model);
            }
        });
    };

    render(): ReactNode {
        const {
            onCancel,
            appPropertiesOnly,
            containerTop,
            useTheme,
            nounSingular,
            nounPlural,
            nameExpressionInfoUrl,
            nameExpressionPlaceholder,
            headerText,
            successBsStyle,
            onTogglePanel,
            submitting,
            saveBtnText,
            currentPanelIndex,
            visitedPanels,
            validatePanel,
            firstState,
            helpTopic,
            testMode,
            domainFormDisplayOptions,
        } = this.props;
        const { model } = this.state;

        return (
            <BaseDomainDesigner
                name={model.name}
                exception={model.exception}
                domains={List.of(model.domain)}
                hasValidProperties={model.hasValidProperties}
                visitedPanels={visitedPanels}
                submitting={submitting}
                onCancel={onCancel}
                onFinish={this.onFinish}
                saveBtnText={saveBtnText}
                successBsStyle={successBsStyle}
            >
                <DataClassPropertiesPanel
                    nounSingular={nounSingular}
                    nounPlural={nounPlural}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    headerText={headerText}
                    helpTopic={helpTopic}
                    model={model}
                    onChange={this.onPropertiesChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 0}
                    panelStatus={
                        model.isNew ? getDomainPanelStatus(0, currentPanelIndex, visitedPanels, firstState) : 'COMPLETE'
                    }
                    validate={validatePanel === 0}
                    appPropertiesOnly={appPropertiesOnly}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(0, collapsed, callback);
                    }}
                    useTheme={useTheme}
                />
                <DomainForm
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle="Fields"
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 1}
                    validate={validatePanel === 1}
                    panelStatus={
                        model.isNew ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState) : 'COMPLETE'
                    }
                    showInferFromFile={true}
                    containerTop={containerTop}
                    onChange={this.onDomainChange}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(1, collapsed, callback);
                    }}
                    appPropertiesOnly={appPropertiesOnly}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                    allowImportExport={true}
                    testMode={testMode}
                    domainFormDisplayOptions={domainFormDisplayOptions}
                />
            </BaseDomainDesigner>
        );
    }
}

export const DataClassDesigner = withBaseDomainDesigner<Props>(DataClassDesignerImpl);
