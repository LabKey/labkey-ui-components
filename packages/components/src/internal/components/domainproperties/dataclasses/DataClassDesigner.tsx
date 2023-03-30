import React, { PureComponent, ReactNode } from 'react';
import { Draft, produce } from 'immer';
import {List, Map, OrderedMap} from 'immutable';

import { Domain } from '@labkey/api';

import { DomainDesign, IDomainField, IDomainFormDisplayOptions } from '../models';
import DomainForm from '../DomainForm';
import { getDomainPanelStatus, saveDomain } from '../actions';
import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { isSampleManagerEnabled } from '../../../app/utils';

import { NameExpressionValidationModal } from '../validation/NameExpressionValidationModal';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../../APIWrapper';

import { GENID_SYNTAX_STRING } from '../NameExpressionGenIdBanner';

import { loadNameExpressionOptions } from '../../settings/actions';
import { DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS } from '../constants';
import { resolveErrorMessage } from '../../../util/messaging';

import { DataClassModel, DataClassModelConfig } from './models';
import { DataClassPropertiesPanel } from './DataClassPropertiesPanel';
import {IParentAlias, IParentOption} from "../../entities/models";
import {SAMPLE_SET_DISPLAY_TEXT} from "../../../constants";
import {SCHEMAS} from "../../../schemas";
import {initParentOptionsSelects} from "../../../../entities/actions";
import {SampleTypeModel} from "../samples/models";
import {DATA_CLASS_IMPORT_PREFIX, SAMPLE_SET_IMPORT_PREFIX} from "../samples/SampleTypeDesigner";

interface Props {
    api?: ComponentsAPIWrapper;
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
    appPropertiesOnly?: boolean;
    successBsStyle?: string;
    saveBtnText?: string;
    testMode?: boolean;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    // loadNameExpressionOptions is a prop for testing purposes only, see default implementation below
    loadNameExpressionOptions?: (
        containerPath?: string
    ) => Promise<{ prefix: string; allowUserSpecifiedNames: boolean }>;
    validateNameExpressions?: boolean;
    showGenIdBanner?: boolean;
}

interface State {
    model: DataClassModel;
    nameExpressionWarnings: string[];
    namePreviews: string[];
    namePreviewsLoading: boolean;
    parentOptions: IParentOption[];
}

const NEW_DATA_CLASS_OPTION: IParentOption = {
    label: `(Current Data Class})`,
    value: '{{this_data_class}}',
    schema: SCHEMAS.DATA_CLASSES.SCHEMA,
} as IParentOption;

class DataClassDesignerImpl extends PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
        nounSingular: 'Data Class',
        nounPlural: 'Data Classes',
        domainFormDisplayOptions: { ...DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS, domainKindDisplayName: 'data class' },
        loadNameExpressionOptions,
        validateNameExpressions: true,
    };

    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        this.state = produce(
            {
                model: props.initModel || DataClassModel.create({}),
                nameExpressionWarnings: undefined,
                namePreviews: undefined,
                namePreviewsLoading: false,
                parentOptions: undefined,
            },
            () => {}
        );
    }

    componentDidMount = async (): Promise<void> => {
        const { model } = this.state;
        const { parentOptions, parentAliases } = await initParentOptionsSelects(false, true,
            model.containerPath, null, NEW_DATA_CLASS_OPTION, model.importAliases, 'dataclass-parent-import-alias-');

        this.setState(
            produce((draft: Draft<State>) => {
                draft.model.parentAliases = parentAliases;
                draft.parentOptions = parentOptions;
            })
        );

        if (this.state.model.isNew && isSampleManagerEnabled()) {
            const response = await this.props.loadNameExpressionOptions(this.state.model.containerPath);

            this.setState(
                produce((draft: Draft<State>) => {
                    draft.model.nameExpression =
                        response.prefix + (draft.model.nameExpression ? draft.model.nameExpression : '');
                })
            );
        }
    };

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

    getImportAliasesAsMap(model: DataClassModel): Map<string, string> {
        const { name, parentAliases } = model;
        const aliases = {};

        if (parentAliases) {
            parentAliases.forEach((alias: IParentAlias) => {
                const { parentValue } = alias;

                let value = parentValue && parentValue.value ? (parentValue.value as string) : '';
                if (parentValue === NEW_DATA_CLASS_OPTION) {
                    value = DATA_CLASS_IMPORT_PREFIX + name;
                }

                aliases[alias.alias] = value;
            });
        }

        return Map<string, string>(aliases);
    }

    saveDomain = async (hasConfirmedNameExpression?: boolean): Promise<void> => {
        const { api, beforeFinish, onComplete, setSubmitting, validateNameExpressions } = this.props;
        const { model } = this.state;
        const { name, domain } = model;

        beforeFinish?.(model);

        const domainDesign = domain.merge({
            name, // This will be the Data Class Name
        }) as DomainDesign;

        // Remove display-only option field
        const { systemFields, ...otherOptions } = model.options;
        let options = {...otherOptions};
        options.importAliases = this.getImportAliasesAsMap(model);

        if (validateNameExpressions && !hasConfirmedNameExpression) {
            try {
                const response = await api.domain.validateDomainNameExpressions(
                    domainDesign,
                    Domain.KINDS.DATA_CLASS,
                    options,
                    true
                );

                if (response.errors?.length > 0 || response.warnings?.length > 0) {
                    setSubmitting(false, () => {
                        this.saveModel({ exception: response.errors?.join('\n') });
                        this.setState({
                            nameExpressionWarnings: response.warnings,
                            namePreviews: response.previews,
                        });
                    });
                    return;
                }
            } catch (e) {
                const exception = resolveErrorMessage(e);

                setSubmitting(false, () => {
                    this.saveModel({ exception });
                });
                return;
            }
        }

        try {
            const savedDomain = await saveDomain(domainDesign, Domain.KINDS.DATA_CLASS, options, model.name);

            setSubmitting(false, () => {
                this.saveModel({ domain: savedDomain, exception: undefined }, () => {
                    onComplete(this.state.model);
                });
            });
        } catch (error) {
            const exception = resolveErrorMessage(error);

            setSubmitting(false, () => {
                if (exception) {
                    this.saveModel({ exception });
                } else {
                    this.saveModel({ domain: error, exception: undefined });
                }
            });
        }
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
            if (dirty) {
                onChange?.(this.state.model);
            }
        });
    };

    onPropertiesChange = (model: DataClassModel): void => {
        const { onChange } = this.props;

        this.saveModel(model, () => {
            onChange?.(this.state.model);
        });
    };

    onNameExpressionWarningCancel = (): void => {
        const { setSubmitting } = this.props;

        setSubmitting(false, () => {
            this.setState({
                nameExpressionWarnings: undefined,
            });
        });
    };

    onNameExpressionWarningConfirm = (): void => {
        this.setState(
            () => ({
                nameExpressionWarnings: undefined,
            }),
            () => this.saveDomain(true)
        );
    };

    onNameFieldHover = () => {
        const { api } = this.props;
        const { model, namePreviewsLoading } = this.state;

        if (namePreviewsLoading) return;

        if (this.props.validateNameExpressions) {
            api.domain
                .validateDomainNameExpressions(model.domain, Domain.KINDS.DATA_CLASS, model.options, true)
                .then(response => {
                    this.setState(() => ({
                        namePreviewsLoading: false,
                        namePreviews: response?.previews,
                    }));
                })
                .catch(response => {
                    console.error(response);
                    this.setState(() => ({
                        namePreviewsLoading: false,
                    }));
                });
        }
    };

    updateAliasValue = (id: string, field: string, newValue: any): IParentAlias => {
        const { model } = this.state;
        const { parentAliases } = model;
        return {
            ...parentAliases.get(id),
            isDupe: false, // Clear error because of change
            [field]: newValue,
        } as IParentAlias;
    };

    parentAliasChange = (id: string, field: string, newValue: any): void => {
        const { model } = this.state;
        const { parentAliases } = model;
        const changedAlias = this.updateAliasValue(id, field, newValue);

        const newAliases = parentAliases.set(id, changedAlias);
        const newModel = {
            ...model,
            parentAliases: newAliases
        };
        this.saveModel(newModel);
    };

    updateDupes = (id: string): void => {
        const { model } = this.state;
        if (!model) {
            return;
        }

        const { parentAliases } = model;
        const dupes = model.getDuplicateAlias();
        let newAliases = OrderedMap<string, IParentAlias>();
        parentAliases.forEach((alias: IParentAlias) => {
            const isDupe = dupes && dupes.has(alias.id);
            let changedAlias = alias;
            if (isDupe !== alias.isDupe) {
                changedAlias = this.updateAliasValue(alias.id, 'isDupe', isDupe);
            }

            if (alias.id === id) {
                changedAlias = {
                    ...changedAlias,
                    ignoreAliasError: false,
                    ignoreSelectError: false,
                };
            }

            newAliases = newAliases.set(alias.id, changedAlias);
        });

        const newModel = {
            ...model,
            parentAliases: newAliases
        };
        this.saveModel(newModel);
    };

    addParentAlias = (id: string, newAlias: IParentAlias): void => {
        const { model } = this.state;
        const { parentAliases } = model;
        const newModel = {
            ...model,
            parentAliases: parentAliases.set(id, newAlias)
        };
        this.saveModel(newModel);
    };

    removeParentAlias = (id: string): void => {
        const { model } = this.state;
        const { parentAliases } = model;
        const aliases = parentAliases.delete(id);
        const newModel = {
            ...model,
            parentAliases: aliases
        };
        this.saveModel(newModel);
    };
    render(): ReactNode {
        const {
            onCancel,
            appPropertiesOnly,
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
            showGenIdBanner,
        } = this.props;
        const { model, nameExpressionWarnings, namePreviews, namePreviewsLoading, parentOptions } = this.state;

        const hasGenIdInExpression = model.nameExpression?.indexOf(GENID_SYNTAX_STRING) > -1;

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
                    namePreviewsLoading={namePreviewsLoading}
                    previewName={namePreviews?.[0]}
                    onNameFieldHover={this.onNameFieldHover}
                    nameExpressionGenIdProps={
                        showGenIdBanner && hasGenIdInExpression
                            ? {
                                  containerPath: model.containerPath,
                                  dataTypeName: model.name,
                                  rowId: model.rowId,
                                  kindName: 'DataClass',
                              }
                            : undefined
                    }
                    parentOptions={parentOptions}
                    // dataClassAliasCaption={dataClassAliasCaption}
                    // dataClassTypeCaption={dataClassTypeCaption}
                    // dataClassParentageLabel={dataClassParentageLabel}
                    onParentAliasChange={this.parentAliasChange}
                    onAddParentAlias={this.addParentAlias}
                    onRemoveParentAlias={this.removeParentAlias}
                    updateDupeParentAliases={this.updateDupes}
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
                    onChange={this.onDomainChange}
                    onToggle={(collapsed, callback) => {
                        onTogglePanel(1, collapsed, callback);
                    }}
                    appPropertiesOnly={appPropertiesOnly}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                    testMode={testMode}
                    domainFormDisplayOptions={domainFormDisplayOptions}
                    systemFields={model.options.systemFields}
                />
                <NameExpressionValidationModal
                    onHide={this.onNameExpressionWarningCancel}
                    onConfirm={this.onNameExpressionWarningConfirm}
                    warnings={nameExpressionWarnings}
                    previews={namePreviews}
                    show={!!nameExpressionWarnings && !model.exception}
                />
            </BaseDomainDesigner>
        );
    }
}

export const DataClassDesigner = withBaseDomainDesigner<Props>(DataClassDesignerImpl);
