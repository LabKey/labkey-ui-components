import React from 'react';
import { fromJS, List, Map, OrderedMap } from 'immutable';
import { Domain } from '@labkey/api';

import {
    Alert,
    DomainDesign,
    DomainDetails,
    generateId,
    IDomainField,
    initQueryGridState,
    naturalSort,
    resolveErrorMessage,
    SAMPLE_TYPE,
    saveDomain,
    SCHEMAS,
} from '../../..';
import DomainForm from '../DomainForm';
import { IParentOption } from '../../entities/models';

import { addDomainField, getDomainPanelStatus } from '../actions';
import { initSampleSetSelects } from '../../samples/actions';
import { SAMPLE_SET_DISPLAY_TEXT } from '../../../constants';
import { BaseDomainDesigner, InjectedBaseDomainDesignerProps, withBaseDomainDesigner } from '../BaseDomainDesigner';

import { IParentAlias, SampleTypeModel } from './models';
import { SampleTypePropertiesPanel } from './SampleTypePropertiesPanel';

const DEFAULT_SAMPLE_FIELD_CONFIG = {
    required: true,
    dataType: SAMPLE_TYPE,
    conceptURI: SAMPLE_TYPE.conceptURI,
    rangeURI: SAMPLE_TYPE.rangeURI,
    lookupSchema: 'exp',
    lookupQuery: 'Materials',
    lookupType: { ...SAMPLE_TYPE },
    name: 'SampleId',
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
    isValidParentOptionFn?: (row: any, isDataClass: boolean) => boolean;

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
}

interface State {
    model: SampleTypeModel;
    parentOptions: IParentOption[];
    error: React.ReactNode;
}

class SampleTypeDesignerImpl extends React.PureComponent<Props & InjectedBaseDomainDesignerProps, State> {
    static defaultProps = {
        defaultSampleFieldConfig: DEFAULT_SAMPLE_FIELD_CONFIG,
        includeDataClasses: false,
        useSeparateDataClassesAliasMenu: false,

        useTheme: false,
        appPropertiesOnly: true,
    };

    constructor(props: Props & InjectedBaseDomainDesignerProps) {
        super(props);

        initQueryGridState();
        const domainDetails = this.props.initModel || DomainDetails.create();
        const model = SampleTypeModel.create(
            domainDetails,
            domainDetails.domainDesign ? domainDetails.domainDesign.name : undefined
        );

        this.state = {
            model,
            parentOptions: undefined,
            error: undefined,
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
        const { includeDataClasses, useSeparateDataClassesAliasMenu } = this.props;
        return includeDataClasses && !useSeparateDataClassesAliasMenu ? `${prefix}: ${name} (${containerPath})` : name;
    };

    initParentOptions = (model: SampleTypeModel, responses: any[]) => {
        const { isValidParentOptionFn } = this.props;
        let sets = List<IParentOption>();
        responses.forEach(results => {
            const domain = fromJS(results.models[results.key]);

            const isDataClass = results.key === DATA_CLASS_SCHEMA_KEY;

            const prefix = isDataClass ? DATA_CLASS_IMPORT_PREFIX : SAMPLE_SET_IMPORT_PREFIX;
            const labelPrefix = isDataClass ? 'Data Class' : 'Sample Set';

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
            parentAliases.map((alias: IParentAlias) => {
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

    onFieldChange = (model: SampleTypeModel) => {
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

    updateAliasValue = (id: string, field: string, newValue: any): IParentAlias => {
        const { model } = this.state;
        const { parentAliases } = model;
        return {
            ...parentAliases.get(id),
            isDupe: false, // Clear error because of change
            [field]: newValue,
        } as IParentAlias;
    };

    parentAliasChange = (id: string, field: string, newValue: any) => {
        const { model } = this.state;
        const { parentAliases } = model;
        const changedAlias = this.updateAliasValue(id, field, newValue);

        const newAliases = parentAliases.set(id, changedAlias);
        const newModel = model.merge({ parentAliases: newAliases }) as SampleTypeModel;
        this.setState(() => ({ model: newModel }));
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
                };
            }

            newAliases = newAliases.set(alias.id, changedAlias);
        });

        const newModel = model.merge({ parentAliases: newAliases }) as SampleTypeModel;
        this.setState(() => ({ model: newModel }));
    };

    addParentAlias = (id: string, newAlias: IParentAlias): void => {
        const { model } = this.state;
        const { parentAliases } = model;
        const newModel = model.merge({ parentAliases: parentAliases.set(id, newAlias) }) as SampleTypeModel;
        this.setState(() => ({ model: newModel }));
    };

    removeParentAlias = (id: string) => {
        const { model } = this.state;
        const { parentAliases } = model;
        const aliases = parentAliases.delete(id);
        const newModel = model.set('parentAliases', aliases) as SampleTypeModel;
        this.setState(() => ({ model: newModel }));
    };

    domainChangeHandler = (domain: DomainDesign, dirty: boolean) => {
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

    onFinish = (): void => {
        const { defaultSampleFieldConfig, setSubmitting } = this.props;
        const { model } = this.state;
        const isValid = SampleTypeModel.isValid(model, defaultSampleFieldConfig);

        this.props.onFinish(isValid, this.saveDomain);

        if (!isValid) {
            let exception;

            if (model.hasInvalidNameField(defaultSampleFieldConfig)) {
                exception =
                    'The ' +
                    defaultSampleFieldConfig.name +
                    ' field name is reserved for imported or generated sample ids.';
            } else if (model.getDuplicateAlias(true).size > 0) {
                exception = 'Duplicate parent alias header found: ' + model.getDuplicateAlias(true).join(', ');
            }

            const updatedModel = model.set('exception', exception) as SampleTypeModel;
            setSubmitting(false, () => {
                this.setState(() => ({ model: updatedModel }));
            });
        }
    };

    saveDomain = () => {
        const { beforeFinish, setSubmitting } = this.props;
        const { model } = this.state;
        const { name, domain, description, nameExpression } = model;

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
            importAliases: this.getImportAliasesAsMap(model).toJS(),
        };

        if (model.isNew()) {
            // Initialize a sampleId column, this is not displayed as part of the designer.
            const nameCol = {
                name: 'Name',
            };

            domainDesign = addDomainField(domainDesign, nameCol);
        }

        saveDomain(domainDesign, Domain.KINDS.SAMPLE_TYPE, details, name)
            .then((response: DomainDesign) => {
                setSubmitting(false, () => {
                    this.props.onComplete(response);
                });
            })
            .catch(response => {
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
            });
    };

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
            onTogglePanel,
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
        } = this.props;
        const { error, model, parentOptions } = this.state;

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
                    onToggle={(collapsed, callback) => onTogglePanel(PROPERTIES_PANEL_INDEX, collapsed, callback)}
                    useTheme={useTheme}
                />
                <DomainForm
                    key={model.domain.domainId || 0}
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
                    onToggle={(collapsed, callback) => onTogglePanel(DOMAIN_PANEL_INDEX, collapsed, callback)}
                    appPropertiesOnly={appPropertiesOnly}
                    useTheme={useTheme}
                    successBsStyle={successBsStyle}
                />
                {error && <div className="domain-form-panel">{error && <Alert bsStyle="danger">{error}</Alert>}</div>}
            </BaseDomainDesigner>
        );
    }
}

export const SampleTypeDesigner = withBaseDomainDesigner<Props>(SampleTypeDesignerImpl);
