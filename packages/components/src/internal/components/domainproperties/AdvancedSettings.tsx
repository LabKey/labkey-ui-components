import React from 'react';
import { List } from 'immutable';
import { ActionURL } from '@labkey/api';

import { Modal } from '../../Modal';
import { getSubmitButtonClass, isApp } from '../../app/utils';

import {
    ADVANCED_FIELD_EDITOR_TOPIC,
    CHART_MEASURES_AND_DIMENSIONS_TOPIC,
    HelpLink,
    MISSING_VALUES_TOPIC,
    PROPERTY_FIELDS_PHI_TOPIC,
} from '../../util/helpLinks';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { CheckboxLK } from '../../Checkbox';

import { DomainField, IDomainFormDisplayOptions, IFieldChange } from './models';
import { DATETIME_TYPE, PropDescType } from './PropDescType';
import { getCheckedValue } from './actions';
import { createFormInputId, createFormInputName, getNameFromId } from './utils';
import {
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    DOMAIN_DEFAULT_TYPES,
    DOMAIN_EDITABLE_DEFAULT,
    DOMAIN_FIELD_CONSTRAINT,
    DOMAIN_FIELD_DEFAULT_VALUE_TYPE,
    DOMAIN_FIELD_DIMENSION,
    DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING,
    DOMAIN_FIELD_HIDDEN,
    DOMAIN_FIELD_MEASURE,
    DOMAIN_FIELD_MVENABLED,
    DOMAIN_FIELD_NONUNIQUECONSTRAINT,
    DOMAIN_FIELD_PHI,
    DOMAIN_FIELD_RECOMMENDEDVARIABLE,
    DOMAIN_FIELD_SHOWNINDETAILSVIEW,
    DOMAIN_FIELD_SHOWNININSERTVIEW,
    DOMAIN_FIELD_SHOWNINUPDATESVIEW,
    DOMAIN_FIELD_UNIQUECONSTRAINT,
    DOMAIN_PHI_LEVELS,
} from './constants';

import { DomainFieldLabel } from './DomainFieldLabel';

interface AdvancedSettingsProps {
    allowUniqueConstraintProperties: boolean;
    defaultDefaultValueType: string;
    defaultValueOptions: List<string>;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    domainId?: number;
    domainIndex: number;
    field: DomainField;
    helpNoun: string;
    index: number;
    label: string;
    maxPhiLevel: string;
    onApply: (any) => any;
    onHide: () => any;
    showDefaultValueSettings: boolean;
}

interface AdvancedSettingsState {
    defaultDisplayValue?: string;
    defaultValueType?: string;
    dimension?: boolean;
    excludeFromShifting?: boolean;
    hidden?: boolean;
    measure?: boolean;
    mvEnabled?: boolean;
    nonUniqueConstraint?: boolean;
    PHI?: string;
    phiLevels?: { label: string; value: string }[];
    recommendedVariable?: boolean;
    shownInDetailsView?: boolean;
    shownInInsertView?: boolean;
    shownInUpdateView?: boolean;
    uniqueConstraint?: boolean;
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, AdvancedSettingsState> {
    static defaultProps = {
        domainFormDisplayOptions: DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    };

    constructor(props) {
        super(props);

        this.state = this.getInitialState(this.props.field, this.props.domainId, this.props.defaultDefaultValueType);
    }

    initializeState = () => {
        this.setState(this.getInitialState(this.props.field, this.props.domainId, this.props.defaultDefaultValueType));
    };

    getInitialState = (field: DomainField, domainId: number, defaultDefaultValueType: string) => {
        const { maxPhiLevel } = this.props;

        // Filter phi levels available
        const phiIndex = this.getPhiLevelIndex(maxPhiLevel);
        const phiLevels = DOMAIN_PHI_LEVELS.filter((value, index) => {
            return index <= phiIndex;
        });

        return {
            hidden: field.hidden,
            shownInDetailsView: field.shownInDetailsView,
            shownInInsertView: field.shownInInsertView,
            shownInUpdateView: field.shownInUpdateView,
            defaultValueType: field.defaultValueType
                ? field.defaultValueType
                : defaultDefaultValueType
                  ? defaultDefaultValueType
                  : DOMAIN_EDITABLE_DEFAULT,
            defaultDisplayValue: field.defaultDisplayValue || '[none]',
            dimension: field.dimension,
            measure: field.measure,
            mvEnabled: field.mvEnabled,
            recommendedVariable: field.recommendedVariable,
            excludeFromShifting: field.excludeFromShifting,
            uniqueConstraint: field.uniqueConstraint,
            nonUniqueConstraint: field.nonUniqueConstraint,
            PHI: field.PHI,
            phiLevels,
        };
    };

    componentDidMount() {
        this.initializeState();
    }

    handleClose = () => {
        const { onHide } = this.props;

        onHide();
    };

    handleApply = () => {
        const { index, onApply, onHide, domainIndex } = this.props;

        if (onApply) {
            const changes = List<IFieldChange>().asMutable();

            // Iterate over state values and put into list of changes
            Object.keys(this.state).forEach(function (key, i) {
                if (key !== 'phiLevels') {
                    changes.push({
                        id: createFormInputId(key, domainIndex, index),
                        value: this.state[key],
                    } as IFieldChange);
                }
            }, this);

            onApply(changes.asImmutable());
        }

        if (onHide) {
            onHide();
        }
    };

    handleCheckbox = evt => {
        let value = getCheckedValue(evt);
        const fieldName = getNameFromId(evt.target.id);

        // Show in default view
        if (fieldName === DOMAIN_FIELD_HIDDEN) {
            value = !value;
        }

        this.setState({
            [fieldName]: value,
        });
    };

    handleChange = evt => {
        const fieldName = getNameFromId(evt.target.id);

        this.setState({
            [fieldName]: evt.target.value,
        });
    };

    handleSingleFieldIndexChange = evt => {
        // only one of uniqueConstraint or nonUniqueConstraint can be true at a time
        const value = evt.target.value;
        if (value === DOMAIN_FIELD_UNIQUECONSTRAINT) {
            this.setState({
                uniqueConstraint: true,
                nonUniqueConstraint: false,
            });
        } else if (value === DOMAIN_FIELD_NONUNIQUECONSTRAINT) {
            this.setState({
                uniqueConstraint: false,
                nonUniqueConstraint: true,
            });
        } else {
            this.setState({
                uniqueConstraint: false,
                nonUniqueConstraint: false,
            });
        }
    };

    hasValidDomainId(): boolean {
        const { domainId } = this.props;
        return !(domainId === undefined || domainId === null || domainId === 0);
    }

    handleSetDefaultValues = evt => {
        const { domainId, helpNoun } = this.props;

        if (!this.hasValidDomainId()) {
            alert('Must save ' + helpNoun + ' before you can set default values.');
        } else {
            const params = {
                domainId,
                returnUrl: window.location,
            };

            let controller = 'list';
            let action = 'setDefaultValuesList';
            if (ActionURL.getController() === 'assay') {
                controller = 'assay';
                action = 'setDefaultValuesAssay';
                params['providerName'] = ActionURL.getParameter('providerName');
            }

            window.location.href = ActionURL.buildURL(controller, action, undefined, params);
        }
    };

    getPhiHelpText = () => {
        return (
            <div>
                <p>Sets Protected Health Information (PHI) level for this field.</p>
                <p>
                    Learn more about <HelpLink topic={PROPERTY_FIELDS_PHI_TOPIC}>protecting PHI</HelpLink> in LabKey.
                </p>
            </div>
        );
    };

    getSingleFieldIndexHelpText = () => {
        return (
            <div>
                <p>Add a single-field database index for this field.</p>
                <p>Optionally, also require all values to be unique for this field.</p>
            </div>
        );
    };

    getDefaultTypeHelpText = () => {
        return (
            <div>
                <p>Editable default: Provides the same default value for every user, which allows editing.</p>
                <p>Fixed value: Provides fixed data with each inserted data row that cannot be edited.</p>
                <p>
                    Last entered: An editable default value is provided on first use. The last value entered will be
                    provided on later imports.
                </p>
                <p>
                    Learn more about using <HelpLink topic={ADVANCED_FIELD_EDITOR_TOPIC}>Default Type</HelpLink>{' '}
                    settings.
                </p>
            </div>
        );
    };

    getPhiLevelIndex = (phi: string): number => {
        return DOMAIN_PHI_LEVELS.findIndex(level => {
            return level.value === phi;
        });
    };

    showDefaultValues = () => {
        const { field, showDefaultValueSettings } = this.props;

        // GitHub Issue #298: we don't yet support default values in the App
        if (isApp()) return false;

        // some domains just don't support default values
        if (!showDefaultValueSettings) return false;

        // Not shown for file types or calculated fields
        if (field.dataType.isFileType() || field.isCalculatedField()) return false;

        return !this.props.defaultValueOptions.isEmpty();
    };

    renderDisplayOptions = () => {
        const { hidden, shownInDetailsView, shownInInsertView, shownInUpdateView } = this.state;
        const { index, domainIndex, field } = this.props;

        return (
            <>
                <div className="domain-adv-display-options">Display Options</div>
                <div>These options configure how and in which views this field will be visible.</div>
                <CheckboxLK
                    checked={hidden === false}
                    id={createFormInputId(DOMAIN_FIELD_HIDDEN, domainIndex, index)}
                    name={createFormInputName(DOMAIN_FIELD_HIDDEN)}
                    onChange={this.handleCheckbox}
                >
                    Show field on default view of the grid
                </CheckboxLK>
                {!field.isCalculatedField() && (
                    <>
                        <CheckboxLK
                            checked={shownInUpdateView === true}
                            id={createFormInputId(DOMAIN_FIELD_SHOWNINUPDATESVIEW, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_SHOWNINUPDATESVIEW)}
                            onChange={this.handleCheckbox}
                        >
                            Show on update form when updating a single row of data
                        </CheckboxLK>
                        <CheckboxLK
                            checked={shownInInsertView === true}
                            id={createFormInputId(DOMAIN_FIELD_SHOWNININSERTVIEW, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_SHOWNININSERTVIEW)}
                            onChange={this.handleCheckbox}
                        >
                            Show on insert form when updating a single row of data
                        </CheckboxLK>
                    </>
                )}
                <CheckboxLK
                    checked={shownInDetailsView === true}
                    id={createFormInputId(DOMAIN_FIELD_SHOWNINDETAILSVIEW, domainIndex, index)}
                    name={createFormInputName(DOMAIN_FIELD_SHOWNINDETAILSVIEW)}
                    onChange={this.handleCheckbox}
                >
                    Show on details page for a single row
                </CheckboxLK>
            </>
        );
    };

    renderDefaultValues = () => {
        const { index, defaultValueOptions, domainIndex } = this.props;
        const { defaultValueType, defaultDisplayValue } = this.state;

        return (
            <>
                <div className="domain-adv-misc-options">Default Value Options</div>
                <div className="row domain-adv-thick-row">
                    <div className="col-xs-3">
                        <DomainFieldLabel helpTipBody={this.getDefaultTypeHelpText()} label="Default Type" />
                    </div>
                    <div className="col-xs-6">
                        <select
                            className="form-control"
                            id={createFormInputId(DOMAIN_FIELD_DEFAULT_VALUE_TYPE, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_DEFAULT_VALUE_TYPE)}
                            onChange={this.handleChange}
                            value={defaultValueType}
                        >
                            {defaultValueOptions
                                .map(level => (
                                    <option key={level} value={level}>
                                        {DOMAIN_DEFAULT_TYPES[level]}
                                    </option>
                                ))
                                .toArray()}
                        </select>
                    </div>
                    <div className="col-xs-3" />
                </div>
                <div className="row">
                    <div className="col-xs-3">
                        <span>Default Value</span>
                    </div>
                    <div className="col-xs-9">
                        <span>
                            {defaultDisplayValue !== undefined && defaultDisplayValue !== null
                                ? defaultDisplayValue
                                : ''}
                        </span>
                        <a
                            className="domain-adv-link"
                            onClick={this.handleSetDefaultValues}
                            style={{ marginLeft: '20px' }}
                        >
                            Set Default Values
                        </a>
                    </div>
                </div>
            </>
        );
    };

    renderMiscOptions = () => {
        const { index, field, domainIndex, domainFormDisplayOptions, allowUniqueConstraintProperties } = this.props;
        const {
            measure,
            dimension,
            mvEnabled,
            recommendedVariable,
            uniqueConstraint,
            nonUniqueConstraint,
            PHI,
            excludeFromShifting,
            phiLevels,
        } = this.state;
        const singleFieldConstraintType =
            uniqueConstraint || field.isPrimaryKey
                ? DOMAIN_FIELD_UNIQUECONSTRAINT
                : nonUniqueConstraint
                  ? DOMAIN_FIELD_NONUNIQUECONSTRAINT
                  : '';
        const currentValueExists = phiLevels?.find(level => level.value === PHI) !== undefined;
        const disablePhiSelect =
            domainFormDisplayOptions.phiLevelDisabled ||
            field.disablePhiLevel ||
            (PHI !== undefined && !currentValueExists);

        return (
            <>
                <div className="domain-adv-misc-options">Miscellaneous Options</div>
                {!field.isCalculatedField() && (
                    <div className="row domain-adv-thick-row">
                        <div className="col-xs-4">
                            <DomainFieldLabel helpTipBody={this.getPhiHelpText()} label="PHI Level" />
                        </div>
                        <div className="col-xs-6">
                            <select
                                className="form-control"
                                disabled={disablePhiSelect}
                                id={createFormInputId(DOMAIN_FIELD_PHI, domainIndex, index)}
                                name={createFormInputName(DOMAIN_FIELD_PHI)}
                                onChange={this.handleChange}
                                value={PHI}
                            >
                                {!currentValueExists && (
                                    <option key={PHI} value={PHI}>
                                        {DOMAIN_PHI_LEVELS.find(level => level.value === PHI)?.label ?? PHI}
                                    </option>
                                )}
                                {phiLevels.map(level => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-xs-2" />
                    </div>
                )}

                {allowUniqueConstraintProperties && !field.isCalculatedField() && !field.isMultiChoiceField() && (
                    <div className="row">
                        <div className="col-xs-4">
                            <DomainFieldLabel
                                helpTipBody={this.getSingleFieldIndexHelpText()}
                                label="Uniqueness & Index"
                            />
                        </div>
                        <div className="col-xs-6">
                            <select
                                className="form-control"
                                disabled={field.isPrimaryKey}
                                id={createFormInputId(DOMAIN_FIELD_CONSTRAINT, domainIndex, index)}
                                name={createFormInputName(DOMAIN_FIELD_CONSTRAINT)}
                                onChange={this.handleSingleFieldIndexChange}
                                value={singleFieldConstraintType}
                            >
                                <option key="None" value="">
                                    No Index
                                </option>
                                <option key="Non-Unique" value={DOMAIN_FIELD_NONUNIQUECONSTRAINT}>
                                    Index
                                </option>
                                <option key="Unique" value={DOMAIN_FIELD_UNIQUECONSTRAINT}>
                                    Index and require unique values
                                </option>
                            </select>
                        </div>
                        <div className="col-xs-2" />
                    </div>
                )}
                {field.dataType === DATETIME_TYPE && (
                    <CheckboxLK
                        checked={excludeFromShifting}
                        id={createFormInputId(DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING, domainIndex, index)}
                        name={createFormInputName(DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING)}
                        onChange={this.handleCheckbox}
                    >
                        Exclude from "Participant Date Shifting" on export/publication
                        <LabelHelpTip title="Exclude from Date Shifting">
                            Participant date fields with this property checked will not be shifted on export/publication
                            when the "Shift Participant Dates" option is selected.
                        </LabelHelpTip>
                    </CheckboxLK>
                )}
                {PropDescType.isMeasure(field.dataType.rangeURI) && (
                    <CheckboxLK
                        checked={measure}
                        id={createFormInputId(DOMAIN_FIELD_MEASURE, domainIndex, index)}
                        name={createFormInputName(DOMAIN_FIELD_MEASURE)}
                        onChange={this.handleCheckbox}
                    >
                        Make this field available as a measure
                        <LabelHelpTip title="Measure">
                            <div>
                                <p>
                                    Indicates fields that contain data subject to charting and other analysis. These are
                                    typically numeric results.
                                </p>
                                <p>
                                    Learn more about using{' '}
                                    <HelpLink topic={CHART_MEASURES_AND_DIMENSIONS_TOPIC}>
                                        Measures and Dimensions
                                    </HelpLink>{' '}
                                    for analysis.
                                </p>
                            </div>
                        </LabelHelpTip>
                    </CheckboxLK>
                )}
                {PropDescType.isDimension(field.dataType.rangeURI) && (
                    <CheckboxLK
                        checked={dimension}
                        id={createFormInputId(DOMAIN_FIELD_DIMENSION, domainIndex, index)}
                        name={createFormInputName(DOMAIN_FIELD_DIMENSION)}
                        onChange={this.handleCheckbox}
                    >
                        Make this field available as a dimension
                        <LabelHelpTip title="Data Dimension">
                            <div>
                                <p>
                                    Indicates a field of non-numerical categories that can be included in a chart.
                                    Dimensions define logical groupings of measures.
                                </p>
                                <p>
                                    Learn more about using{' '}
                                    <HelpLink topic={CHART_MEASURES_AND_DIMENSIONS_TOPIC}>
                                        Measures and Dimensions
                                    </HelpLink>{' '}
                                    for analysis.
                                </p>
                            </div>
                        </LabelHelpTip>
                    </CheckboxLK>
                )}
                {!field.isMultiChoiceField() && (
                    <CheckboxLK
                        checked={recommendedVariable}
                        id={createFormInputId(DOMAIN_FIELD_RECOMMENDEDVARIABLE, domainIndex, index)}
                        name={createFormInputName(DOMAIN_FIELD_RECOMMENDEDVARIABLE)}
                        onChange={this.handleCheckbox}
                    >
                        Make this field a recommended variable
                        <LabelHelpTip title="Recommended Variable">
                            <div>
                                Indicates that this is an important variable. These variables will be displayed as
                                recommended when creating new charts or reports.
                            </div>
                        </LabelHelpTip>
                    </CheckboxLK>
                )}
                {PropDescType.isMvEnableable(field.dataType.rangeURI) && !field.isCalculatedField() && !isApp() && (
                    <CheckboxLK
                        checked={mvEnabled}
                        disabled={domainFormDisplayOptions.disableMvEnabled}
                        id={createFormInputId(DOMAIN_FIELD_MVENABLED, domainIndex, index)}
                        name={createFormInputName(DOMAIN_FIELD_MVENABLED)}
                        onChange={this.handleCheckbox}
                    >
                        Track reason for missing data values
                        <LabelHelpTip title="Missing Value Indicators">
                            <div>
                                <p>
                                    Fields using this can hold special values to indicate data that has failed review or
                                    was originally missing. Administrators can set custom Missing Value indicators at
                                    the site and folder levels.
                                </p>
                                <p>
                                    Learn more about using{' '}
                                    <HelpLink topic={MISSING_VALUES_TOPIC}>Missing Value Indicators</HelpLink>
                                </p>
                            </div>
                        </LabelHelpTip>
                    </CheckboxLK>
                )}
            </>
        );
    };

    render() {
        const { label } = this.props;
        const title = 'Advanced Settings and Properties' + (label ? ' for ' + label : '');
        const footer = (
            <>
                <button
                    className="domain-adv-footer domain-adv-cancel-btn btn btn-default"
                    onClick={this.handleClose}
                    type="button"
                >
                    Cancel
                </button>
                <HelpLink className="domain-adv-footer domain-adv-link" topic={ADVANCED_FIELD_EDITOR_TOPIC}>
                    Get help with field designer settings
                </HelpLink>
                <button
                    className={`domain-adv-footer domain-adv-apply-btn btn btn-${getSubmitButtonClass()}`}
                    onClick={this.handleApply}
                    type="button"
                >
                    Apply
                </button>
            </>
        );

        return (
            <Modal footer={footer} onCancel={this.handleClose} title={title}>
                <div className="domain-modal">
                    {this.renderDisplayOptions()}
                    {this.showDefaultValues() && this.renderDefaultValues()}
                    {this.renderMiscOptions()}
                </div>
            </Modal>
        );
    }
}
