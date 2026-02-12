import React, { FC, memo, PureComponent } from 'react';
import classNames from 'classnames';
import { Filter, Query } from '@labkey/api';

import { getFormNameFromId } from '../entities/actions';
import { EntityDetailsForm } from '../entities/EntityDetailsForm';

import { PARENT_ALIAS_HELPER_TEXT, SAMPLE_SET_DISPLAY_TEXT } from '../../../constants';
import {
    DEFINE_SAMPLE_TYPE_TOPIC,
    DERIVE_SAMPLES_ALIAS_TOPIC,
    getHelpLink,
    HelpLink,
    UNIQUE_IDS_TOPIC,
} from '../../../util/helpLinks';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';
import { HelpTopicURL } from '../HelpTopicURL';

import { DomainFieldLabel } from '../DomainFieldLabel';
import { SectionHeading } from '../SectionHeading';

import { ENTITY_FORM_IDS } from '../entities/constants';

import { AutoLinkToStudyDropdown } from '../AutoLinkToStudyDropdown';

import { isSampleManagerEnabled } from '../../../app/products';
import { getCurrentProductName, isCommunityDistribution } from '../../../app/utils';

import { PREFIX_SUBSTITUTION_EXPRESSION, PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG } from '../constants';

import { NameExpressionPreview } from '../NameExpressionPreview';

import { NameExpressionGenIdProps } from '../NameExpressionGenIdBanner';

import { SCHEMAS } from '../../../schemas';
import { IParentAlias, IParentOption } from '../../entities/models';
import { Container } from '../../base/models/Container';
import { IDomainField } from '../models';
import { ColorPickerInput } from '../../forms/input/ColorPickerInput';
import { SelectInput, SelectInputOption } from '../../forms/input/SelectInput';

import { dataClassOptionFilterFn, DomainParentAliases } from '../DomainParentAliases';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../../APIWrapper';

import { UniqueIdBanner } from './UniqueIdBanner';
import { AliquotNamePatternProps, DEFAULT_ALIQUOT_NAMING_PATTERN, MetricUnitProps, SampleTypeModel } from './models';
import {
    getMeasurementUnit,
    getMetricUnitOptions,
    getMetricUnitOptionsFromKind,
    UNITS_KIND,
} from '../../../util/measurement';
import { Alert } from '../../base/Alert';

const PROPERTIES_HEADER_ID = 'sample-type-properties-hdr';
const ALIQUOT_HELP_LINK = getHelpLink('aliquotIDs');
const ALIQUOT_NAME_PLACEHOLDER = 'Enter a naming pattern for aliquots (e.g., ' + DEFAULT_ALIQUOT_NAMING_PATTERN + ')';

const AddEntityHelpTip: FC<{ parentageLabel?: string }> = memo(({ parentageLabel }) => {
    const msg = parentageLabel
        ? PARENT_ALIAS_HELPER_TEXT.replace(/parent(age)?/g, parentageLabel)
        : PARENT_ALIAS_HELPER_TEXT;
    return (
        <>
            <p>{msg}</p>
            <p>
                <HelpLink topic={DERIVE_SAMPLES_ALIAS_TOPIC}>More info</HelpLink>
            </p>
        </>
    );
});

export const UnitKinds: Record<UNITS_KIND, UnitKindType> = {
    [UNITS_KIND.NONE]: {
        value: UNITS_KIND.NONE,
        label: 'Any',
        hideSubSelect: true,
        msg: "Amounts can be entered in any unit and won't be converted when stored or displayed.",
    },
    [UNITS_KIND.MASS]: {
        value: UNITS_KIND.MASS,
        label: 'Mass',
    },
    [UNITS_KIND.VOLUME]: {
        value: UNITS_KIND.VOLUME,
        label: 'Volume',
    },
    [UNITS_KIND.COUNT]: {
        value: UNITS_KIND.COUNT,
        label: 'Other',
        hideSubSelect: true,
        msg: "Amounts can be entered as bottles, blocks, boxes, cells, kits, packs, pieces, slides, tests, or unit and won't be converted.",
    },
};

export const getValidUnitKinds = (lockUnitKind?: boolean, metricUnit?: string): UnitKindType[] => {
    if (!lockUnitKind || !metricUnit) return Object.values(UnitKinds);

    const validOptions = [UnitKinds[UNITS_KIND.NONE]]; // any unit can switch to no unit type

    const unitKind = getMeasurementUnit(metricUnit)?.kind;
    if (unitKind) validOptions.push(UnitKinds[unitKind]);

    return validOptions;
};

AddEntityHelpTip.displayName = 'AddEntityHelpTip';

const AutoLinkDataToStudyHelpTip: FC = () => (
    <>
        <p>
            Automatically link Sample Type data rows to the specified target study. Only rows that include subject and
            visit/date information will be linked.
        </p>
        <p>
            The user performing the import must have insert permission in the target study and the corresponding
            dataset.
        </p>
    </>
);
AutoLinkDataToStudyHelpTip.displayName = 'AutoLinkDataToStudyHelpTip';

const LinkedDatasetCategoryHelpTip: FC = () => (
    <>
        <p>
            Specify the desired category for the Sample Type Dataset that will be created (or appended to) in the target
            study when rows are linked. If the category you specify does not exist, it will be created.
        </p>
        <p>
            If the Sample Type Dataset already exists, this setting will not overwrite a previously assigned category.
            Leave blank to use the default category of "Uncategorized".
        </p>
    </>
);
LinkedDatasetCategoryHelpTip.displayName = 'LinkedDatasetCategoryHelpTip';

const UniqueIdHelpTip: FC = () => (
    <>
        <p>Use a Unique ID field to represent barcodes or other ID fields in use in your lab.</p>
        <p>
            Learn more about using <HelpLink topic={UNIQUE_IDS_TOPIC}>barcodes and unique IDs</HelpLink> in{' '}
            {getCurrentProductName()}.
        </p>
    </>
);
UniqueIdHelpTip.displayName = 'UniqueIdHelpTip';

// Splitting these out to clarify where they end-up
interface OwnProps {
    aliquotNamePatternProps?: AliquotNamePatternProps;
    api?: ComponentsAPIWrapper;
    appPropertiesOnly?: boolean;
    dataClassAliasCaption?: string;
    dataClassParentageLabel?: string;
    dataClassTypeCaption?: string;
    headerText?: string;
    helpTopic?: string;
    includeDataClasses?: boolean;
    metricUnitProps?: MetricUnitProps;
    model: SampleTypeModel;
    nameExpressionChatResponse?: string;
    nameExpressionErrors?: string[];
    nameExpressionGenIdProps?: NameExpressionGenIdProps;
    namePreviews?: string[];
    namePreviewsLoading?: boolean;
    onAddParentAlias: (id: string, newAlias: IParentAlias) => void;
    onAddUniqueIdField: (fieldConfig: Partial<IDomainField>) => void;
    onNameFieldHover?: () => void;
    onParentAliasChange: (id: string, field: string, newValue: any) => void;
    onRemoveParentAlias: (id: string) => void;
    parentAliasHelpText?: string;
    parentOptions: IParentOption[];
    sampleAliasCaption?: string;
    sampleTypeCaption?: string;
    showLinkToStudy?: boolean;
    updateDupeParentAliases?: (id: string) => void;
    updateModel: (newModel: SampleTypeModel) => void;
    useSeparateDataClassesAliasMenu?: boolean;
}

// Splitting these out to clarify where they end-up
interface EntityProps {
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;
    nounPlural?: string;
    nounSingular?: string;
}

interface UnitKindType {
    hideSubSelect?: boolean;
    label: string;
    msg?: string;
    value: string;
}

interface State {
    containers: Container[];
    isValid: boolean;
    loadingError: string;
    metricUnitKind: UnitKindType;
    originalUnit: string;
    prefix: string;
    sampleTypeCategory: string;
    unitChangeWarning: string;
    validMetricUnitOptions: UnitKindType[];
    validUnitKinds: UnitKindType[];
}

type Props = BasePropertiesPanelProps & EntityProps & OwnProps;

class SampleTypePropertiesPanelImpl extends PureComponent<InjectedDomainPropertiesPanelCollapseProps & Props, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
        nounSingular: SAMPLE_SET_DISPLAY_TEXT,
        nounPlural: SAMPLE_SET_DISPLAY_TEXT + 's',
        nameExpressionInfoUrl: getHelpLink('sampleIDs'),

        nameExpressionPlaceholder: 'Enter a naming pattern (e.g., S-${now:date}-${dailySampleCount})',
        appPropertiesOnly: false,
        showLinkToStudy: true,
        helpTopic: DEFINE_SAMPLE_TYPE_TOPIC,
        sampleAliasCaption: 'Sample',
        sampleTypeCaption: 'Sample Type',
        dataClassAliasCaption: 'Data Class',
        dataClassTypeCaption: 'Data Class',
        dataClassParentageLabel: 'data class',
        metricUnitProps: {
            metricUnitLabel: 'Metric Unit',
            metricUnitHelpMsg: 'The unit of measurement used for the sample type.',
        },
        parentAliasHelpText: PARENT_ALIAS_HELPER_TEXT,
    };

    state: Readonly<State> = {
        containers: undefined,
        isValid: true,
        loadingError: undefined,
        prefix: undefined,
        sampleTypeCategory: undefined,
        metricUnitKind: undefined,
        validUnitKinds: [],
        validMetricUnitOptions: [],
        originalUnit: undefined,
        unitChangeWarning: undefined,
    };

    componentDidMount = async (): Promise<void> => {
        const { api, model, metricUnitProps } = this.props;

        try {
            const result = await api.query.selectRows({
                columns: ['Category'],
                containerFilter: Query.ContainerFilter.currentPlusProjectAndShared,
                filterArray: [Filter.create('RowId', model.rowId)],
                schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
            });

            const validUnitKinds = metricUnitProps?.includeMetricUnitProperty
                ? getValidUnitKinds(metricUnitProps?.lockUnitKind, model?.metricUnit)
                : null;

            const unitKind = getMeasurementUnit(model?.metricUnit)?.kind ?? (model.isNew() ? null : UNITS_KIND.NONE);
            this.setState({
                sampleTypeCategory: result.rows[0]?.Category.value,
                metricUnitKind: unitKind ? UnitKinds[unitKind] : null,
                validUnitKinds: validUnitKinds,
                validMetricUnitOptions: metricUnitProps?.metricUnitOptions,
                originalUnit: model?.metricUnit,
            });
        } catch (e) {
            this.setState({ loadingError: 'There was a problem retrieving the Sample Type category.' });
        }

        try {
            const containers = await api.domain.getValidPublishTargets(model.containerPath);
            this.setState({ containers });
        } catch (e) {
            this.setState({ containers: [] });
        }

        if (isSampleManagerEnabled()) {
            try {
                const response = await api.entity.loadNameExpressionOptions(model.containerPath);
                this.setState({ prefix: response.prefix ?? null });
            } catch (error) {
                this.setState({ loadingError: 'There was a problem retrieving the Naming Pattern prefix.' });
            }
        }
    };

    updateValidStatus = (newModel?: SampleTypeModel): void => {
        const { metricUnitProps, model, updateModel } = this.props;
        const updatedModel = newModel ?? model;
        const isValid = updatedModel.hasValidProperties() && updatedModel.isMetricUnitValid(metricUnitProps);

        this.setState({ isValid }, () => {
            // Issue 39918: only consider the model changed if there is a newModel param
            if (newModel) {
                updateModel(newModel);
            }
        });
    };

    onFormChange = (evt: any): void => {
        const id = evt.target.id;
        const value = evt.target.value;
        this.onFieldChange(getFormNameFromId(id), value?.trimStart());
    };

    onFieldChange = (key: string, value: any): void => {
        this.updateValidStatus(this.props.model.set(key, value) as SampleTypeModel);
    };

    onMetricUnitKindChange = (key: string, value: any): void => {
        const { originalUnit } = this.state;
        const unitKind = value ? UnitKinds[value] : null;
        const unitOptions = getMetricUnitOptionsFromKind(unitKind?.value, true);
        let unitToSelect = value === UNITS_KIND.COUNT ? 'unit' : value === UNITS_KIND.NONE ? '' : null;
        let unitChangeWarning = null;
        if (originalUnit && value === UNITS_KIND.NONE)
            unitChangeWarning =
                "Once switched to 'Any' amount type, you may not be able to switch back to '" +
                getMeasurementUnit(originalUnit)?.kind +
                "' amount type.";

        if (originalUnit && getMeasurementUnit(originalUnit)?.kind === value) {
            unitToSelect = originalUnit;
        }
        this.updateValidStatus(this.props.model.set('metricUnit', unitToSelect) as SampleTypeModel);
        this.setState({ metricUnitKind: unitKind, validMetricUnitOptions: unitOptions, unitChangeWarning });
    };

    onUnitChange = (key: string, value: any): void => {
        const { model } = this.props;
        const { metricUnitKind } = this.state;
        if (value) {
            const unitOptions = getMetricUnitOptions(value, true);
            const unitKind = getMeasurementUnit(value)?.kind ?? (model.isNew() ? null : UNITS_KIND.NONE);
            if (unitKind && unitKind !== metricUnitKind?.value) {
                this.setState({ metricUnitKind: UnitKinds[unitKind], validMetricUnitOptions: unitOptions });
            }
        }
        this.updateValidStatus(this.props.model.set('metricUnit', value) as SampleTypeModel);
    };

    onNameFieldHover = (): void => {
        this.props.onNameFieldHover?.();
    };

    containsDataClassOptions(): boolean {
        return this.props.parentOptions?.filter(dataClassOptionFilterFn).length > 0;
    }

    render() {
        const {
            model,
            onAddUniqueIdField,
            parentOptions,
            nameExpressionInfoUrl,
            nameExpressionPlaceholder,
            aliquotNamePatternProps,
            nounSingular,
            nounPlural,
            headerText,
            helpTopic,
            includeDataClasses,
            useSeparateDataClassesAliasMenu,
            dataClassParentageLabel,
            appPropertiesOnly,
            showLinkToStudy,
            metricUnitProps,
            nameExpressionChatResponse,
            nameExpressionErrors,
            namePreviews,
            namePreviewsLoading,
            nameExpressionGenIdProps,
        } = this.props;
        const {
            isValid,
            containers,
            prefix,
            loadingError,
            sampleTypeCategory,
            validMetricUnitOptions,
            metricUnitKind,
            validUnitKinds,
            unitChangeWarning,
        } = this.state;

        const showAliquotNameExpression = aliquotNamePatternProps?.showAliquotNameExpression;
        const aliquotNameExpressionInfoUrl = aliquotNamePatternProps?.aliquotNameExpressionInfoUrl;
        const aliquotNameExpressionPlaceholder = aliquotNamePatternProps?.aliquotNameExpressionPlaceholder;

        const includeMetricUnitProperty = metricUnitProps?.includeMetricUnitProperty;
        const metricUnitLabel = metricUnitProps?.metricUnitLabel || 'Metric Unit';
        const metricUnitHelpMsg =
            metricUnitProps?.metricUnitHelpMsg || 'The unit of measurement used for the sample type.';
        const allowTimepointProperties = model.domain.get('allowTimepointProperties');

        // Issue 48776: Suppress import parent aliasing for media Mixture Batches
        const showAddParentAlias =
            !!parentOptions &&
            (model.name !== SCHEMAS.SAMPLE_SETS.MIXTURE_BATCHES.queryName || sampleTypeCategory !== 'media');
        const showDataClass = includeDataClasses && useSeparateDataClassesAliasMenu && this.containsDataClassOptions();

        let warning: string;
        if (
            prefix &&
            !model.isNew() &&
            model.nameExpression &&
            !model.nameExpression.includes(PREFIX_SUBSTITUTION_EXPRESSION)
        ) {
            warning = `${PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG}: "${prefix}".`;
        } else if (
            prefix &&
            showAliquotNameExpression &&
            model.aliquotNameExpression &&
            !model.aliquotNameExpression.includes(PREFIX_SUBSTITUTION_EXPRESSION)
        ) {
            warning = `Aliquot ${PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG}: "${prefix}".`;
        } else if (loadingError !== undefined) {
            warning = loadingError;
        }

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                isValid={isValid}
                title="Sample Type Properties"
                updateValidStatus={this.updateValidStatus}
                warning={warning}
            >
                <div className="row margin-bottom">
                    {headerText && (
                        <div className="col-xs-9">
                            <div className="entity-form--headerhelp">{headerText}</div>
                        </div>
                    )}
                    <div className={`col-xs-${headerText ? 3 : 12}`}>
                        <HelpTopicURL helpTopic={helpTopic} nounPlural={nounPlural} />
                    </div>
                </div>
                {appPropertiesOnly && <SectionHeading title="General Properties" />}
                <EntityDetailsForm
                    data={model}
                    nameExpressionChatResponse={nameExpressionChatResponse}
                    nameExpressionErrors={nameExpressionErrors}
                    nameExpressionGenIdProps={nameExpressionGenIdProps}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    namePreviewsLoading={namePreviewsLoading}
                    nameReadOnly={model.nameReadOnly}
                    noun={nounSingular}
                    onFormChange={this.onFormChange}
                    onNameFieldHover={this.onNameFieldHover}
                    previewName={namePreviews?.[0]}
                    showPreviewName={!!model.nameExpression}
                    warning={warning}
                />
                {showAliquotNameExpression && (
                    <div className="row margin-bottom">
                        <div className="col-xs-2">
                            <div onMouseEnter={this.onNameFieldHover}>
                                <DomainFieldLabel
                                    helpTipBody={
                                        <>
                                            <p>Pattern used for generating unique Ids for Aliquots.</p>
                                            <p>
                                                By default, the name of the aliquot will use the name of its parent
                                                followed by a dash and a counter for that parent's aliquots.
                                            </p>
                                            <p>
                                                For example, if the original sample is S1, aliquots of that sample will
                                                be named S1-1, S1-2, etc.
                                            </p>
                                            {model.aliquotNameExpression && (
                                                <NameExpressionPreview
                                                    isPreviewLoading={namePreviewsLoading}
                                                    previewName={namePreviews?.[1]}
                                                />
                                            )}
                                            <p>
                                                <a
                                                    href={aliquotNameExpressionInfoUrl ?? ALIQUOT_HELP_LINK}
                                                    rel="noopener noreferrer"
                                                    target="_blank"
                                                >
                                                    More info
                                                </a>
                                            </p>
                                        </>
                                    }
                                    label="Aliquot Naming Pattern"
                                />
                            </div>
                        </div>
                        <div className="col-xs-10">
                            <input
                                className={classNames('form-control', {
                                    'naming-pattern-border-warning': warning?.startsWith('Aliquot'),
                                })}
                                name="aliquotNameExpression"
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    this.onFieldChange(e.target.name, e.target.value);
                                }}
                                placeholder={aliquotNameExpressionPlaceholder ?? ALIQUOT_NAME_PLACEHOLDER}
                                type="text"
                                value={model.aliquotNameExpression}
                            />
                        </div>
                    </div>
                )}
                {showAddParentAlias && (
                    <>
                        <SectionHeading cls="top-padding bottom-padding" title="Lineage Settings" />
                        <DomainParentAliases
                            {...this.props}
                            addEntityHelp={<AddEntityHelpTip />}
                            hideRequiredCheck={!appPropertiesOnly}
                            idPrefix="sampletype-parent-import-alias-"
                            includeDataClass={includeDataClasses && !useSeparateDataClassesAliasMenu}
                            includeSampleSet
                            parentAliases={model.parentAliases}
                            schema={SCHEMAS.SAMPLE_SETS.SCHEMA}
                            showAddBtn={showAddParentAlias}
                        />
                    </>
                )}
                {showDataClass && (
                    <DomainParentAliases
                        {...this.props}
                        addEntityHelp={<AddEntityHelpTip parentageLabel={dataClassParentageLabel} />}
                        idPrefix="sampletype-parent-import-alias-"
                        includeDataClass
                        includeSampleSet={false}
                        parentAliases={model.parentAliases}
                        schema={SCHEMAS.DATA_CLASSES.SCHEMA}
                        showAddBtn
                    />
                )}
                {allowTimepointProperties && showLinkToStudy && (
                    <>
                        <div className="row margin-top">
                            <div className="col-xs-2">
                                <DomainFieldLabel
                                    helpTipBody={<AutoLinkDataToStudyHelpTip />}
                                    label="Auto-Link Data to Study"
                                />
                            </div>
                            <div className="col-xs-5">
                                <AutoLinkToStudyDropdown
                                    autoLinkTarget={ENTITY_FORM_IDS.AUTO_LINK_TARGET}
                                    containers={containers}
                                    onChange={this.onFormChange}
                                    value={model.autoLinkTargetContainerId}
                                />
                            </div>
                        </div>
                        <div className="row margin-top">
                            <div className="col-xs-2">
                                <DomainFieldLabel
                                    helpTipBody={<LinkedDatasetCategoryHelpTip />}
                                    label="Linked Dataset Category"
                                />
                            </div>

                            <div className="col-xs-5">
                                <input
                                    className="form-control"
                                    id={ENTITY_FORM_IDS.AUTO_LINK_CATEGORY}
                                    onChange={this.onFormChange}
                                    type="text"
                                    value={model.autoLinkCategory || ''}
                                />
                            </div>
                        </div>
                    </>
                )}

                {(appPropertiesOnly || !isCommunityDistribution()) && (
                    <SectionHeading cls="top-padding" title="Storage Settings" />
                )}
                {appPropertiesOnly && (
                    <>
                        <div className="row margin-top">
                            <div className="col-xs-2">
                                <DomainFieldLabel
                                    helpTipBody="The label color will be used to distinguish this sample type in various views in the application."
                                    label="Label Color"
                                />
                            </div>
                            <div className="col-xs-10">
                                <ColorPickerInput
                                    allowRemove
                                    name="labelColor"
                                    onChange={this.onFieldChange}
                                    value={model.labelColor}
                                />
                            </div>
                        </div>
                        {includeMetricUnitProperty && (
                            <>
                                <div className="row margin-top">
                                    <div className="col-xs-2">
                                        <DomainFieldLabel label="Amount Type" required />
                                    </div>
                                    <div className="col-xs-3">
                                        <SelectInput
                                            clearable={false}
                                            containerClass="sampleset-unit-type-select-container"
                                            disabled={metricUnitProps?.lockUnitKind && validUnitKinds?.length <= 1}
                                            inputClass="sampleset-unit-type-select"
                                            name="metricUnitKind"
                                            onChange={(name, formValue, option: SelectInputOption) => {
                                                this.onMetricUnitKindChange(
                                                    name,
                                                    formValue === undefined && option ? option.id : formValue
                                                );
                                            }}
                                            options={validUnitKinds}
                                            placeholder="Select a type..."
                                            required
                                            value={metricUnitKind}
                                        />
                                    </div>
                                </div>
                                {!metricUnitKind?.hideSubSelect && (
                                    <div className="row margin-top">
                                        <div className="col-xs-2">
                                            <DomainFieldLabel
                                                helpTipBody={metricUnitHelpMsg}
                                                label={metricUnitLabel}
                                                required
                                            />
                                        </div>
                                        <div className="col-xs-3">
                                            <SelectInput
                                                clearable={false}
                                                containerClass="sampleset-metric-unit-select-container"
                                                inputClass="sampleset-metric-unit-select"
                                                name="metricUnit"
                                                onChange={(name, formValue, option: SelectInputOption) => {
                                                    this.onUnitChange(
                                                        name,
                                                        formValue === undefined && option ? option.id : formValue
                                                    );
                                                }}
                                                options={validMetricUnitOptions}
                                                placeholder="Select a unit..."
                                                required
                                                value={model.metricUnit}
                                            />
                                        </div>
                                    </div>
                                )}
                                {metricUnitKind?.msg && (
                                    <div className="row margin-top">
                                        <div className="col-xs-2" />
                                        <div className="col-xs-10">
                                            <em>{metricUnitKind.msg}</em>
                                        </div>
                                    </div>
                                )}
                                {unitChangeWarning && (
                                    <div className="row margin-top">
                                        <div className="col-xs-2" />
                                        <div className="col-xs-10">
                                            <Alert bsStyle="warning">{unitChangeWarning}</Alert>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
                {!isCommunityDistribution() && (
                    <div className="row margin-top">
                        <div className="col-xs-2">
                            <DomainFieldLabel helpTipBody={<UniqueIdHelpTip />} label="Barcodes" />
                        </div>
                        <div className="col-xs-10">
                            <UniqueIdBanner isFieldsPanel={false} model={model} onAddField={onAddUniqueIdField} />
                        </div>
                    </div>
                )}
            </BasePropertiesPanel>
        );
    }
}

export const SampleTypePropertiesPanel = withDomainPropertiesPanelCollapse<Props>(SampleTypePropertiesPanelImpl);
