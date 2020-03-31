import React from 'react';
import { List } from "immutable";
import { DataClassModel } from "./models";
import { DomainDesign, IDomainField } from "../models";
import DomainForm from "../DomainForm";
import { DataClassPropertiesPanel } from "./DataClassPropertiesPanel";
import { getDomainPanelStatus, saveDomain } from "../actions";
import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from "../BaseDomainDesigner";
import { resolveErrorMessage } from "../../../util/messaging";

interface Props {
    nounSingular?: string
    nounPlural?: string
    nameExpressionInfoUrl?: string
    nameExpressionPlaceholder?: string
    headerText?: string
    defaultNameFieldConfig?: Partial<IDomainField>
    initModel?: DataClassModel
    onChange?: (model: DataClassModel) => void
    onCancel: () => void
    onComplete: (model: DataClassModel) => void
    beforeFinish?: (model: DataClassModel) => void
    useTheme?: boolean
    containerTop?: number // This sets the top of the sticky header, default is 0
    appPropertiesOnly?: boolean
    successBsStyle?: string
    saveBtnText?: string
}

interface State {
    model: DataClassModel
}

export class DataClassDesignerImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {

    static defaultProps = {
        nounSingular: 'Data Class',
        nounPlural: 'Data Classes'
    };

    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        this.state = {
            model: props.initModel || DataClassModel.create({})
        }
    }

    onFinish = () => {
        const { defaultNameFieldConfig, setSubmitting, nounSingular } = this.props;
        const { model } = this.state;
        const isValid = DataClassModel.isValid(model, defaultNameFieldConfig);

        this.props.onFinish(isValid, this.saveDomain);

        if (!isValid) {
            let exception;

            if (model.hasInvalidNameField(defaultNameFieldConfig)) {
                exception = 'The ' + defaultNameFieldConfig.name + ' field name is reserved for imported or generated ' + nounSingular + ' ids.'
            }

            const updatedModel = model.set('exception', exception) as DataClassModel;
            setSubmitting(false, () => {
                this.setState(() => ({model: updatedModel}));
            });
        }
    };

    saveDomain = () => {
        const { setSubmitting, beforeFinish } = this.props;
        const { model } = this.state;

        if (beforeFinish) {
            beforeFinish(model);
        }

        saveDomain(model.domain, 'DataClass', model.getOptions(), model.name)
            .then((response: DomainDesign) => {
                let updatedModel = model.set('exception', undefined) as DataClassModel;
                updatedModel = updatedModel.merge({domain: response}) as DataClassModel;

                setSubmitting(false, () => {
                    this.setState(() => ({model: updatedModel}));
                    this.props.onComplete(updatedModel);
                });
            })
            .catch((response) => {
                const exception = resolveErrorMessage(response);
                const updatedModel = exception
                    ? model.set('exception', exception) as DataClassModel
                    : model.merge({domain: response, exception: undefined}) as DataClassModel;

                setSubmitting(false, () => {
                    this.setState(() => ({model: updatedModel}));
                });
            });
    };

    onDomainChange = (domain: DomainDesign, dirty: boolean) => {
        const { onChange } = this.props;

        this.setState((state) => ({
            model: state.model.merge({domain}) as DataClassModel
        }), () => {
            // Issue 39918: use the dirty property that DomainForm onChange passes
            if (onChange && dirty) {
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
        const {
            onCancel, appPropertiesOnly, containerTop, useTheme, nounSingular, nounPlural, nameExpressionInfoUrl,
            nameExpressionPlaceholder, headerText, successBsStyle, onTogglePanel, submitting, saveBtnText,
            currentPanelIndex, visitedPanels, validatePanel, firstState
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
                <DataClassPropertiesPanel
                    nounSingular={nounSingular}
                    nounPlural={nounPlural}
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
                    onToggle={(collapsed, callback) => {onTogglePanel(0, collapsed, callback);}}
                    useTheme={useTheme}
                />
                <DomainForm
                    key={model.domain.domainId || 0}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle={'Fields'}
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== 1}
                    validate={validatePanel === 1}
                    panelStatus={model.isNew() ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState) : "COMPLETE"}
                    showInferFromFile={true}
                    containerTop={containerTop}
                    onChange={this.onDomainChange}
                    onToggle={(collapsed, callback) => {onTogglePanel(1, collapsed, callback);}}
                    appPropertiesOnly={appPropertiesOnly}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                />
            </BaseDomainDesigner>
        )
    }
}

export const DataClassDesigner = withBaseDomainDesigner<Props>(DataClassDesignerImpl);
