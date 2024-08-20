import React, { ReactNode } from 'react';

import { DomainDesignerCheckbox } from '../DomainDesignerCheckbox';

import { Modal } from '../../../Modal';
import { getSubmitButtonClass } from '../../../app/utils';

import { DATASET_PROPERTIES_TOPIC, HelpLink } from '../../../util/helpLinks';

import { SectionHeading } from '../SectionHeading';

import { DomainFieldLabel } from '../DomainFieldLabel';

import { SelectInput, SelectInputOption } from '../../forms/input/SelectInput';

import { LabelHelpTip } from '../../base/LabelHelpTip';

import { DatasetAdvancedSettingsForm, DatasetModel } from './models';
import { fetchCohorts, getHelpTip, getVisitDateColumns } from './actions';
import { StudyProperties } from './utils';
import { SHOW_IN_OVERVIEW } from './constants';

interface DatasetSettingsSelectProps {
    clearable?: boolean;
    disabled?: boolean;
    helpTip?: ReactNode;
    label: string;
    labelKey?: string;
    name: string;
    onSelectChange: (name, formValue, selected) => void;
    selectOptions: any;
    selectedValue?: any;
    valueKey?: string;
}

export class DatasetSettingsSelect extends React.PureComponent<DatasetSettingsSelectProps> {
    render() {
        const {
            name,
            label,
            helpTip,
            selectedValue,
            selectOptions,
            onSelectChange,
            labelKey,
            valueKey,
            disabled,
            clearable,
        } = this.props;

        return (
            <div className="row margin-top">
                <div className="col-xs-5">
                    <DomainFieldLabel label={label} helpTipBody={helpTip} />
                </div>

                <div className="col-xs-7">
                    <SelectInput
                        onChange={onSelectChange}
                        value={selectedValue}
                        options={selectOptions}
                        inputClass=""
                        containerClass=""
                        labelClass=""
                        name={name}
                        labelKey={labelKey}
                        valueKey={valueKey}
                        disabled={disabled}
                        clearable={clearable}
                    />
                </div>
            </div>
        );
    }
}

interface DatasetSettingsInputProps {
    disabled: boolean;
    helpTip: ReactNode;
    label: string;
    name: string;
    onValueChange: (evt: any) => any;
    placeholder?: string;
    required: boolean;
    showInAdvancedSettings: boolean;
    value?: any;
}

export class DatasetSettingsInput extends React.PureComponent<DatasetSettingsInputProps> {
    render() {
        const { name, label, helpTip, value, placeholder, onValueChange, disabled, showInAdvancedSettings, required } =
            this.props;

        return (
            <div className="row margin-top">
                <div className="col-xs-4">
                    <DomainFieldLabel label={label} required={required} helpTipBody={helpTip} />
                </div>

                {showInAdvancedSettings && <div className="col-xs-1" />}

                <div className="col-xs-7">
                    <input
                        className="form-control"
                        id={name}
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={onValueChange}
                        disabled={disabled}
                    />
                </div>

                {!showInAdvancedSettings && <div className="col-xs-1" />}
            </div>
        );
    }
}

interface AdvancedSettingsProps {
    applyAdvancedProperties: (datasetAdvancedSettingsForm: DatasetAdvancedSettingsForm) => void;
    model: DatasetModel;
    studyProperties: StudyProperties;
    title: string;
    visitDatePropertyIndex?: number;
}

interface AdvancedSettingsState extends DatasetAdvancedSettingsForm {
    availableCohorts?: SelectInputOption | SelectInputOption[];
    dataSharing?: string;
    modalOpen?: boolean;
    visitDateColumns?: SelectInputOption | SelectInputOption[];
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, AdvancedSettingsState> {
    constructor(props) {
        super(props);
        const initialState = this.getInitialState();

        this.state = {
            modalOpen: false,
            ...initialState,
        } as AdvancedSettingsState;
    }

    componentDidMount(): void {
        fetchCohorts()
            .then(data => {
                this.setState({
                    availableCohorts: data.toArray(),
                });
            })
            .catch(error => {
                console.error('Failed to retrieve available cohorts.', error);
            });
    }

    getInitialState = () => {
        const model = this.props.model;

        return {
            datasetId: model.datasetId,
            tag: model.tag,
            showByDefault: model.showByDefault,
            cohortId: model.cohortId,
            dataSharing: model.dataSharing,
            visitDatePropertyName: this.getVisitDatePropertyName(),
        };
    };

    getVisitDatePropertyName(): string {
        const { model, visitDatePropertyIndex } = this.props;
        return visitDatePropertyIndex !== undefined
            ? model.domain.fields.get(visitDatePropertyIndex).name
            : model.visitDatePropertyName;
    }

    toggleModal = (isModalOpen: boolean): void => {
        this.setState({ modalOpen: isModalOpen });

        // If modal is re-opened, reset unsaved values
        if (isModalOpen) {
            this.setState(this.getInitialState());
        }
    };

    closeModal = () => {
        this.toggleModal(false);
    };

    onInputChange = e => {
        const id = e.target.id;
        let value = e.target.value;

        if (e.target.type === 'checkbox') {
            value = e.target.checked;
        }

        this.setState({ [id]: value });
    };

    onSelectChange = (id: string, value: any): void => {
        this.setState({ [id]: value });
    };

    getHelpTipElement(field: string): JSX.Element {
        return (<> {getHelpTip(field, this.props.studyProperties)} </>) as JSX.Element;
    }

    applyChanges = (): void => {
        const { datasetId, cohortId, visitDatePropertyName, showByDefault, tag, dataSharing } = this.state;

        const datasetAdvancedSettingsForm = {
            showByDefault,
            datasetId,
            cohortId,
            visitDatePropertyName,
            tag,
            dataSharing,
        };

        const { applyAdvancedProperties } = this.props;

        applyAdvancedProperties(datasetAdvancedSettingsForm as DatasetAdvancedSettingsForm);
        this.toggleModal(false);
    };

    render() {
        const { modalOpen, datasetId, cohortId, tag, showByDefault, dataSharing, availableCohorts } = this.state;
        const { model, title, studyProperties } = this.props;

        const showDataspace = model.definitionIsShared && model.getDataRowSetting() === 0;
        const showDataspaceCls = showDataspace ? 'dataset_data_row_element_show' : 'dataset_data_row_element_hide';
        const showInOverviewLabel = 'Show dataset in overview';
        const visitDateColumns = getVisitDateColumns(model.domain).toArray();
        const visitDateProperty = this.getVisitDatePropertyName();
        const footer = (
            <>
                <button
                    className="domain-adv-footer domain-adv-cancel-btn btn btn-default"
                    onClick={this.closeModal}
                    type="button"
                >
                    Cancel
                </button>

                <HelpLink topic={DATASET_PROPERTIES_TOPIC} className="domain-adv-footer domain-adv-link">
                    Get help with dataset settings
                </HelpLink>

                <button
                    className={`domain-adv-footer domain-adv-apply-btn btn btn-${getSubmitButtonClass()}`}
                    onClick={this.applyChanges}
                    type="button"
                >
                    Apply
                </button>
            </>
        );

        return (
            <>
                <button
                    className="domain-field-float-right btn btn-default"
                    onClick={() => this.toggleModal(true)}
                    type="button"
                >
                    {title}
                </button>

                {modalOpen && (
                    <Modal footer={footer} onCancel={this.closeModal} title="Advanced Dataset Settings">
                        <SectionHeading title="Miscellaneous Options" />

                        <div className="row margin-top">
                            <div className="col-xs-5">
                                {showInOverviewLabel}
                                <LabelHelpTip title={showInOverviewLabel}>{SHOW_IN_OVERVIEW}</LabelHelpTip>
                            </div>
                            <div className="col-xs-7">
                                <DomainDesignerCheckbox
                                    checked={showByDefault}
                                    onChange={this.onInputChange}
                                    id="showByDefault"
                                    className="domain-field-checkbox"
                                />
                            </div>
                        </div>

                        <DatasetSettingsInput
                            name="datasetId"
                            label="Dataset ID"
                            helpTip={this.getHelpTipElement('datasetId')}
                            value={datasetId}
                            placeholder="Auto Assign"
                            disabled={!model.isNew()}
                            onValueChange={this.onInputChange}
                            showInAdvancedSettings={true}
                            required={true}
                        />
                        {studyProperties.TimepointType === 'VISIT' && (
                            <DatasetSettingsSelect
                                name="visitDatePropertyName"
                                label="Visit Date Column"
                                helpTip={this.getHelpTipElement('visitDateColumn')}
                                selectOptions={visitDateColumns}
                                selectedValue={visitDateProperty}
                                onSelectChange={this.onSelectChange}
                            />
                        )}
                        {/** * TODO: Look into - Cohort- Query Select didn't work  ***/}
                        <DatasetSettingsSelect
                            name="cohortId"
                            label="Cohort Association"
                            helpTip={this.getHelpTipElement('cohort')}
                            selectOptions={availableCohorts}
                            selectedValue={cohortId}
                            onSelectChange={this.onSelectChange}
                        />

                        <DatasetSettingsInput
                            name="tag"
                            label="Tag"
                            helpTip={this.getHelpTipElement('tag')}
                            value={tag}
                            disabled={false}
                            onValueChange={this.onInputChange}
                            showInAdvancedSettings={true}
                            required={false}
                        />

                        {model.definitionIsShared && (
                            <>
                                <div className={showDataspaceCls}>
                                    <div className="margin-top">
                                        <SectionHeading title="Dataspace Project Options" />
                                    </div>

                                    <DatasetSettingsSelect
                                        name="dataSharing"
                                        label="Share demographic data"
                                        helpTip={this.getHelpTipElement('dataspace')}
                                        selectOptions={[
                                            { label: 'No', value: 'NONE' },
                                            { label: 'Share by ' + studyProperties.SubjectColumnName, value: 'PTID' },
                                        ]}
                                        selectedValue={dataSharing}
                                        onSelectChange={this.onSelectChange}
                                        disabled={model.getDataRowSetting() !== 0}
                                    />
                                </div>
                            </>
                        )}
                    </Modal>
                )}
            </>
        );
    }
}
