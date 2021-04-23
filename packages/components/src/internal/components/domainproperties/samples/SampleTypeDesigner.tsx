import React, { ReactNode } from 'react';
import { fromJS, List, Map, OrderedMap } from 'immutable';
import { Domain } from '@labkey/api';

import { DomainDesign, DomainDetails, IAppDomainHeader, IDomainField, IDomainFormDisplayOptions } from '../models';
import DomainForm from '../DomainForm';
import {
    Alert,
    ConfirmModal,
    generateId,
    getHelpLink,
    initQueryGridState,
    IParentOption,
    MetricUnitProps,
    naturalSort,
    resolveErrorMessage,
    SCHEMAS,
} from '../../../..';

import { DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS } from '../constants';
import { addDomainField, getDomainPanelStatus, saveDomain } from '../actions';
import { initSampleSetSelects } from '../../samples/actions';
import { SAMPLE_SET_DISPLAY_TEXT } from '../../../constants';
import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { SAMPLE_TYPE, UNIQUE_ID_TYPE } from '../PropDescType';

import { isCommunityDistribution } from '../../../app/utils';

import { IParentAlias, SampleTypeModel } from './models';
import { SampleTypePropertiesPanel } from './SampleTypePropertiesPanel';
import { UniqueIdBanner } from './UniqueIdBanner';

export const DEFAULT_SAMPLE_FIELD_CONFIG = {
    required: true,
    dataType: SAMPLE_TYPE,
    conceptURI: SAMPLE_TYPE.conceptURI,
    rangeURI: SAMPLE_TYPE.rangeURI,
    lookupSchema: 'exp',
    lookupQuery: 'Materials',
    lookupType: { ...SAMPLE_TYPE },
    name: 'SampleID',
} as Partial<IDomainField>;

const NEW_SAMPLE_SET_OPTION: IParentOption = {
    label: `(Current ${SAMPLE_SET_DISPLAY_TEXT})`,
    value: '{{this_sample_set}}',
    schema: SCHEMAS.SAMPLE_SETS.SCHEMA,
} as IParentOption;

const PROPERTIES_PANEL_INDEX = 0;
const DOMAIN_PANEL_INDEX = 1;

export const SAMPLE_SET_IMPORT_PREFIX = 'materialInputs/';
export const DATA_CLASS_IMPORT_PREFIX = 'dataInputs/';
const DATA_CLASS_SCHEMA_KEY = 'exp/dataclasses';
const SAMPLE_SET_NAME_EXPRESSION_TOPIC = 'sampleIDs#patterns';
const SAMPLE_SET_NAME_EXPRESSION_PLACEHOLDER = 'Enter a naming pattern (e.g., S-${now:date}-${dailySampleCount})';
const SAMPLE_SET_HELP_TOPIC = 'createSampleType';

interface Props {
    onChange?: (model: SampleTypeModel) => void;
    onCancel: () => void;
    onComplete: (response: DomainDesign) => void;
    beforeFinish?: (model: SampleTypeModel) => void;
    initModel: DomainDetails;
    defaultSampleFieldConfig?: Partial<IDomainField>;
    includeDataClasses?: boolean;
    headerText?: string;
    helpTopic?: string;
    useSeparateDataClassesAliasMenu?: boolean;
    sampleAliasCaption?: string;
    sampleTypeCaption?: string;
    dataClassAliasCaption?: string;
    dataClassTypeCaption?: string;
    dataClassParentageLabel?: string;
    showParentLabelPrefix?: boolean;
    isValidParentOptionFn?: (row: any, isDataClass: boolean) => boolean;
    testMode?: boolean;

    // EntityDetailsForm props
    nounSingular?: string;
    nounPlural?: string;
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;

    // DomainDesigner props
    containerTop?: number; // This sets the top of the sticky header, default is 0
    useTheme?: boolean;
    appPropertiesOnly?: boolean;
    successBsStyle?: string;
    saveBtnText?: string;

    metricUnitProps?: MetricUnitProps;

    validateProperties?: (designerDetails?: any) => Promise<any>;

    domainFormDisplayOptions?: IDomainFormDisplayOptions;
}

interface State {
    model: SampleTypeModel;
    parentOptions: IParentOption[];
    error: React.ReactNode;
    showUniqueIdConfirmation: boolean;
    uniqueIdsConfirmed: boolean;
}

class SampleTypeDesignerImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    static defaultProps = {
        defaultSampleFieldConfig: DEFAULT_SAMPLE_FIELD_CONFIG,
        includeDataClasses: false,
        useSeparateDataClassesAliasMenu: false,
        nameExpressionInfoUrl: getHelpLink(SAMPLE_SET_NAME_EXPRESSION_TOPIC),
        nameExpressionPlaceholder: SAMPLE_SET_NAME_EXPRESSION_PLACEHOLDER,
        helpTopic: SAMPLE_SET_HELP_TOPIC,
        showParentLabelPrefix: true,
        useTheme: false,
        appPropertiesOnly: true,
        domainFormDisplayOptions: { ...DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS, domainKindDisplayName: 'sample type' },
    };

    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        initQueryGridState();
        let domainDetails = this.props.initModel || DomainDetails.create();
        if (props.defaultSampleFieldConfig) {
            const domainDesign = domainDetails.domainDesign.merge({
                reservedFieldNames: List<string>([props.defaultSampleFieldConfig?.name.toLowerCase()]),
            });
            domainDetails = domainDetails.set('domainDesign', domainDesign) as DomainDetails;
        }

        const model = SampleTypeModel.create(
            domainDetails,
            domainDetails.domainDesign ? domainDetails.domainDesign.name : undefined
        );

        this.state = {
            model,
            parentOptions: undefined,
            error: undefined,
            showUniqueIdConfirmation: false,
            uniqueIdsConfirmed: undefined,
        };
    }

    componentDidMount = (): void => {
        const { includeDataClasses, setSubmitting } = this.props;
        const { model } = this.state;

        initSampleSetSelects(!model.isNew(), model.name, includeDataClasses)
            .then(results => {
                this.initParentOptions(model, results);
            })
            .catch(error => {
                setSubmitting(false, () => {
                    this.setState(() => ({ error: resolveErrorMessage(error) }));
                });
            });
    };

    formatLabel = (name: string, prefix: string, containerPath?: string): string => {
        const { includeDataClasses, useSeparateDataClassesAliasMenu, showParentLabelPrefix } = this.props;
        return includeDataClasses && !useSeparateDataClassesAliasMenu && showParentLabelPrefix
            ? `${prefix}: ${name} (${containerPath})`
            : name;
    };

    initParentOptions = (model: SampleTypeModel, responses: any[]): void => {
        const { isValidParentOptionFn } = this.props;
        let sets = List<IParentOption>();
        responses.forEach(results => {
            const domain = fromJS(results.models[results.key]);

            const isDataClass = results.key === DATA_CLASS_SCHEMA_KEY;

            const prefix = isDataClass ? DATA_CLASS_IMPORT_PREFIX : SAMPLE_SET_IMPORT_PREFIX;
            const labelPrefix = isDataClass ? 'Data Class' : 'Sample Type';

            domain.forEach(row => {
                if (isValidParentOptionFn) {
                    if (!isValidParentOptionFn(row, isDataClass)) return;
                }
                const name = row.getIn(['Name', 'value']);
                const containerPath = row.getIn(['Folder', 'displayValue']);
                const label =
                    name === model.name && !isDataClass
                        ? NEW_SAMPLE_SET_OPTION.label
                        : this.formatLabel(name, labelPrefix, containerPath);
                sets = sets.push({
                    value: prefix + name,
                    label,
                    schema: isDataClass ? SCHEMAS.DATA_CLASSES.SCHEMA : SCHEMAS.SAMPLE_SETS.SCHEMA,
                    query: name, // Issue 33653: query name is case-sensitive for some data inputs (sample parents)
                });
            });
        });

        if (model.isNew()) {
            sets = sets.push(NEW_SAMPLE_SET_OPTION);
        }

        this.mapParentAliasOptions(model, sets.sortBy(p => p.label, naturalSort) as List<IParentOption>);
    };

    mapParentAliasOptions = (model: SampleTypeModel, results: List<IParentOption>): void => {
        const options = results.toArray();

        let parentAliases = Map<string, IParentAlias>();

        if (model && model.importAliases) {
            const initialAlias = Map<string, string>(model.importAliases);
            initialAlias.forEach((val, key) => {
                const newId = generateId('sampleset-parent-import-alias-');
                const parentValue = options.find(opt => opt.value === val);
                if (!parentValue)
                    // parent option might have been filtered out by isValidParentOptionFn
                    return;

                parentAliases = parentAliases.set(newId, {
                    id: newId,
                    alias: key,
                    parentValue,
                    ignoreAliasError: false,
                    ignoreSelectError: false,
                } as IParentAlias);
            });
        }

        this.setState(() => ({
            parentOptions: options,
            model: model.merge({ parentAliases }) as SampleTypeModel,
        }));
    };

    getImportAliasesAsMap(model: SampleTypeModel): Map<string, string> {
        const { name, parentAliases } = model;
        const aliases = {};

        if (parentAliases) {
            parentAliases.forEach((alias: IParentAlias) => {
                const { parentValue } = alias;

                let value = parentValue && parentValue.value ? (parentValue.value as string) : '';
                if (parentValue === NEW_SAMPLE_SET_OPTION) {
                    value = SAMPLE_SET_IMPORT_PREFIX + name;
                }

                aliases[alias.alias] = value;
            });
        }

        return Map<string, string>(aliases);
    }

    onFieldChange = (model: SampleTypeModel): void => {
        const { onChange } = this.props;

        this.setState(
            () => ({ model, uniqueIdsConfirmed: undefined }),
            () => {
                if (onChange) {
                    onChange(model);
                }
            }
        );
    };

    propertiesToggle = (collapsed, callback) => {
        const { onTogglePanel } = this.props;

        onTogglePanel(PROPERTIES_PANEL_INDEX, collapsed, callback);
    };

    formToggle = (collapsed, callback) => {
        const { onTogglePanel } = this.props;

        onTogglePanel(DOMAIN_PANEL_INDEX, collapsed, callback);
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
        const newModel = model.merge({ parentAliases: newAliases }) as SampleTypeModel;
        this.onFieldChange(newModel);
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

        const newModel = model.merge({ parentAliases: newAliases }) as SampleTypeModel;
        this.onFieldChange(newModel);
    };

    addParentAlias = (id: string, newAlias: IParentAlias): void => {
        const { model } = this.state;
        const { parentAliases } = model;
        const newModel = model.merge({ parentAliases: parentAliases.set(id, newAlias) }) as SampleTypeModel;
        this.onFieldChange(newModel);
    };

    removeParentAlias = (id: string): void => {
        const { model } = this.state;
        const { parentAliases } = model;
        const aliases = parentAliases.delete(id);
        const newModel = model.set('parentAliases', aliases) as SampleTypeModel;
        this.onFieldChange(newModel);
    };

    domainChangeHandler = (domain: DomainDesign, dirty: boolean): void => {
        const { onChange } = this.props;
        const { model } = this.state;

        this.setState(
            () => ({
                model: model.merge({ domain }) as SampleTypeModel,
            }),
            () => {
                // Issue 39918: use the dirty property that DomainForm onChange passes
                if (onChange && dirty) {
                    onChange(model);
                }
            }
        );
    };

    onUniqueIdCancel = () => {
        this.setState({
            showUniqueIdConfirmation: false,
            uniqueIdsConfirmed: false,
        });
    };

    onUniqueIdConfirm = () => {
        this.setState(
            () => ({
                showUniqueIdConfirmation: false,
                uniqueIdsConfirmed: true,
            }),
            () => this.onFinish()
        );
    };

    onFinish = (): void => {
        const { defaultSampleFieldConfig, setSubmitting, metricUnitProps } = this.props;
        const { model, uniqueIdsConfirmed } = this.state;

        if (!model.isNew() && this.getNumNewUniqueIdFields() > 0 && !uniqueIdsConfirmed) {
            this.setState({
                showUniqueIdConfirmation: true,
            });
            return;
        }

        const metricUnitLabel = metricUnitProps?.metricUnitLabel;
        const metricUnitRequired = metricUnitProps?.metricUnitRequired;
        const isValid = model.isValid(defaultSampleFieldConfig, metricUnitRequired);

        this.props.onFinish(isValid, this.saveDomain);

        if (!isValid) {
            let exception: string;

            if (model.hasInvalidNameField(defaultSampleFieldConfig)) {
                exception =
                    'The ' +
                    defaultSampleFieldConfig.name +
                    ' field name is reserved for imported or generated sample ids.';
            } else if (model.getDuplicateAlias(true).size > 0) {
                exception = 'Duplicate parent alias header found: ' + model.getDuplicateAlias(true).join(', ');
            } else if (!model.isMetricUnitValid(metricUnitRequired)) {
                exception = metricUnitLabel + ' field is required.';
            } else {
                exception = model.domain.getFirstFieldError();
            }

            const updatedModel = model.set('exception', exception) as SampleTypeModel;
            setSubmitting(false, () => {
                this.setState(() => ({ model: updatedModel }));
            });
        }
    };

    saveDomain = async () => {
        const { beforeFinish, setSubmitting } = this.props;
        const { model } = this.state;
        const { name, domain, description, nameExpression, labelColor, metricUnit, autoLinkTargetContainerId } = model;

        if (beforeFinish) {
            beforeFinish(model);
        }

        let domainDesign = domain.merge({
            name, // This will be the Sample Type Name
            description,
        }) as DomainDesign;

        const details = {
            name,
            nameExpression,
            labelColor,
            metricUnit,
            autoLinkTargetContainerId,
            importAliases: this.getImportAliasesAsMap(model).toJS(),
        };

        if (model.isNew()) {
            // Initialize a sampleId column, this is not displayed as part of the designer.
            const nameCol = {
                name: 'Name',
            };

            domainDesign = addDomainField(domainDesign, nameCol);
        }

        try {
            if (this.props.validateProperties) {
                const response = await this.props.validateProperties(details);
                if (response.error) {
                    const updatedModel = model.set('exception', response.error) as SampleTypeModel;
                    setSubmitting(false, () => {
                        this.setState(() => ({ model: updatedModel }));
                    });
                    return;
                }
            }
        } catch (error) {
            console.error(error);
            const exception = resolveErrorMessage(error);
            setSubmitting(false, () => {
                this.setState(() => ({ model: model.set('exception', exception) as SampleTypeModel }));
            });
            return;
        }

        try {
            const response: DomainDesign = await saveDomain(domainDesign, Domain.KINDS.SAMPLE_TYPE, details, name);
            setSubmitting(false, () => {
                this.props.onComplete(response);
            });
        } catch (response) {
            const exception = resolveErrorMessage(response);
            const updatedModel = exception
                ? (model.set('exception', exception) as SampleTypeModel)
                : (model.merge({
                      // since the isNew case adds in the Name column, we need to go back to the state model's domain to merge in the error info
                      domain: domain.merge({ domainException: response.domainException }) as DomainDesign,
                      exception: undefined,
                  }) as SampleTypeModel);

            setSubmitting(false, () => {
                this.setState(() => ({ model: updatedModel }));
            });
        }
    };

    onAddUniqueIdField = (fieldConfig: Partial<IDomainField>): void => {
        this.setState(state => ({
            model: state.model.set('domain', addDomainField(this.state.model.domain, fieldConfig)) as SampleTypeModel,
        }));
    };

    uniqueIdBannerRenderer = (config: IAppDomainHeader): ReactNode => {
        const { model } = this.state;
        if (isCommunityDistribution() || !model.isNew() || model.domain?.fields?.isEmpty()) {
            return null;
        }
        return <UniqueIdBanner model={this.state.model} isFieldsPanel={true} onAddField={config.onAddField} />;
    };

    getNumNewUniqueIdFields(): number {
        const { model } = this.state;
        return model.domain.fields.filter(field => field.isNew() && field.isUniqueIdField()).count();
    }

    render() {
        const {
            containerTop,
            useTheme,
            appPropertiesOnly,
            successBsStyle,
            currentPanelIndex,
            visitedPanels,
            firstState,
            validatePanel,
            submitting,
            onCancel,
            nameExpressionPlaceholder,
            nameExpressionInfoUrl,
            nounSingular,
            nounPlural,
            headerText,
            saveBtnText,
            helpTopic,
            includeDataClasses,
            useSeparateDataClassesAliasMenu,
            sampleAliasCaption,
            sampleTypeCaption,
            dataClassAliasCaption,
            dataClassTypeCaption,
            dataClassParentageLabel,
            metricUnitProps,
            testMode,
            domainFormDisplayOptions,
        } = this.props;
        const { error, model, parentOptions, showUniqueIdConfirmation } = this.state;
        const numNewUniqueIdFields = this.getNumNewUniqueIdFields();

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
                <SampleTypePropertiesPanel
                    nounSingular={nounSingular}
                    nounPlural={nounPlural}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    headerText={headerText}
                    helpTopic={helpTopic}
                    model={model}
                    parentOptions={parentOptions}
                    includeDataClasses={includeDataClasses}
                    useSeparateDataClassesAliasMenu={useSeparateDataClassesAliasMenu}
                    sampleAliasCaption={sampleAliasCaption}
                    sampleTypeCaption={sampleTypeCaption}
                    dataClassAliasCaption={dataClassAliasCaption}
                    dataClassTypeCaption={dataClassTypeCaption}
                    dataClassParentageLabel={dataClassParentageLabel}
                    onParentAliasChange={this.parentAliasChange}
                    onAddParentAlias={this.addParentAlias}
                    onRemoveParentAlias={this.removeParentAlias}
                    updateDupeParentAliases={this.updateDupes}
                    updateModel={this.onFieldChange}
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== PROPERTIES_PANEL_INDEX}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(PROPERTIES_PANEL_INDEX, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    validate={validatePanel === PROPERTIES_PANEL_INDEX}
                    onToggle={this.propertiesToggle}
                    appPropertiesOnly={appPropertiesOnly}
                    useTheme={useTheme}
                    metricUnitProps={metricUnitProps}
                    onAddUniqueIdField={this.onAddUniqueIdField}
                />
                <DomainForm
                    key={model.domain.domainId || 0}
                    appDomainHeaderRenderer={this.uniqueIdBannerRenderer}
                    domainIndex={0}
                    domain={model.domain}
                    headerTitle="Fields"
                    helpTopic={null} // null so that we don't show the "learn more about this tool" link for this domains
                    controlledCollapse={true}
                    initCollapsed={currentPanelIndex !== DOMAIN_PANEL_INDEX}
                    validate={validatePanel === DOMAIN_PANEL_INDEX}
                    panelStatus={
                        model.isNew()
                            ? getDomainPanelStatus(1, currentPanelIndex, visitedPanels, firstState)
                            : 'COMPLETE'
                    }
                    showInferFromFile={true}
                    containerTop={containerTop}
                    onChange={this.domainChangeHandler}
                    onToggle={this.formToggle}
                    appPropertiesOnly={appPropertiesOnly}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                    allowImportExport={true}
                    testMode={testMode}
                    domainFormDisplayOptions={domainFormDisplayOptions}
                />
                {error && <div className="domain-form-panel">{error && <Alert bsStyle="danger">{error}</Alert>}</div>}
                {showUniqueIdConfirmation && (
                    <ConfirmModal
                        title={'Updating Sample Type with Unique ID field' + (numNewUniqueIdFields !== 1 ? 's' : '')}
                        msg={
                            'You have added ' +
                            numNewUniqueIdFields +
                            ' ' +
                            UNIQUE_ID_TYPE.display +
                            ' field' +
                            (numNewUniqueIdFields !== 1 ? 's' : '') +
                            ' to this Sample Type. ' +
                            'Values for ' +
                            (numNewUniqueIdFields !== 1 ? 'these fields' : 'this field') +
                            ' will be created for all existing samples.'
                        }
                        onCancel={this.onUniqueIdCancel}
                        onConfirm={this.onUniqueIdConfirm}
                        confirmButtonText="Finish Updating Sample Type"
                        confirmVariant="success"
                        cancelButtonText="Cancel"
                    />
                )}
            </BaseDomainDesigner>
        );
    }
}

export const SampleTypeDesigner = withBaseDomainDesigner<Props>(SampleTypeDesignerImpl);
