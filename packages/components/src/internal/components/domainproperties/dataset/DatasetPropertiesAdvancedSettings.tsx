import React, { ReactNode } from 'react';
import { Button, Checkbox, Col, FormControl, Modal, Row } from 'react-bootstrap';

import { getServerContext } from '@labkey/api';

// import { Option } from 'react-select';

import { helpLinkNode, initQueryGridState, LabelHelpTip, SelectInput } from '../../../..';

import { DATASET_PROPERTIES_TOPIC } from '../../../util/helpLinks';

import { SectionHeading } from '../SectionHeading';

import { DomainFieldLabel } from '../DomainFieldLabel';

import { DatasetAdvancedSettingsForm, DatasetModel } from './models';
import { fetchCohorts, getVisitDateColumns, getHelpTip, getStudySubjectProp } from './actions';
import { SHOW_IN_OVERVIEW } from './constants';

import '../../../../theme/dataset.scss';

type Option = any;

interface DatasetSettingsSelectProps {
    name: string;
    label: string;
    helpTip?: ReactNode;
    selectedValue?: any;
    selectOptions: any;
    onSelectChange: (name, formValue, selected) => void;
    labelKey?: string;
    valueKey?: string;
    disabled?: boolean;
    clearable?: boolean;
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
            <Row className="margin-top">
                <Col xs={5}>
                    <DomainFieldLabel label={label} helpTipBody={helpTip} />
                </Col>

                <Col xs={7}>
                    <SelectInput
                        onChange={onSelectChange}
                        value={selectedValue}
                        options={selectOptions}
                        inputClass=""
                        containerClass=""
                        labelClass=""
                        formsy={false}
                        multiple={false}
                        required={false}
                        name={name}
                        labelKey={labelKey}
                        valueKey={valueKey}
                        disabled={disabled}
                        isClearable={clearable}
                    />
                </Col>
            </Row>
        );
    }
}

interface DatasetSettingsInputProps {
    name: string;
    label: string;
    helpTip: ReactNode;
    value?: any;
    placeholder?: string;
    onValueChange: (evt: any) => any;
    disabled: boolean;
    required: boolean;
    showInAdvancedSettings: boolean;
}

export class DatasetSettingsInput extends React.PureComponent<DatasetSettingsInputProps> {
    render() {
        const {
            name,
            label,
            helpTip,
            value,
            placeholder,
            onValueChange,
            disabled,
            showInAdvancedSettings,
            required,
        } = this.props;

        return (
            <Row className="margin-top">
                <Col xs={4}>
                    <DomainFieldLabel label={label} required={required} helpTipBody={helpTip} />
                </Col>

                {showInAdvancedSettings && <Col xs={1} />}

                <Col xs={7}>
                    <FormControl
                        id={name}
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={onValueChange}
                        disabled={disabled}
                    />
                </Col>

                {!showInAdvancedSettings && <Col xs={1} />}
            </Row>
        );
    }
}

interface AdvancedSettingsProps {
    model: DatasetModel;
    title: string;
    applyAdvancedProperties: (datasetAdvancedSettingsForm: DatasetAdvancedSettingsForm) => void;
    visitDatePropertyIndex?: number;
    successBsStyle?: string;
}

interface AdvancedSettingsState extends DatasetAdvancedSettingsForm {
    modalOpen?: boolean;
    availableCohorts?: Option | Option[];
    visitDateColumns?: Option | Option[];
    dataSharing?: string;
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, AdvancedSettingsState> {
    constructor(props) {
        super(props);
        const initialState = this.getInitialState();

        initQueryGridState(); // needed for selectRows usage

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

    onCheckboxChange = (name, checked) => {
        this.setState(() => ({ showByDefault: !checked }));
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
        return (<> {getHelpTip(field)} </>) as JSX.Element;
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

        const { model, title, successBsStyle } = this.props;

        const showDataspace = model.definitionIsShared && model.getDataRowSetting() === 0;
        const showDataspaceCls = showDataspace ? 'dataset_data_row_element_show' : 'dataset_data_row_element_hide';
        const showInOverviewLabel = 'Show dataset in overview';
        const visitDateColumns = getVisitDateColumns(model.domain).toArray();
        const visitDateProperty = this.getVisitDatePropertyName();

        return (
            <>
                <Button className="domain-field-float-right" onClick={() => this.toggleModal(true)}>
                    {title}
                </Button>

                <Modal show={modalOpen} onHide={() => this.toggleModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title> Advanced Dataset Settings </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <SectionHeading title="Miscellaneous Options" />

                        <Row className="margin-top">
                            <Col xs={5}>
                                {showInOverviewLabel}
                                <LabelHelpTip title={showInOverviewLabel}>{SHOW_IN_OVERVIEW}</LabelHelpTip>
                            </Col>
                            <Col xs={7}>
                                <Checkbox
                                    checked={showByDefault}
                                    onChange={this.onInputChange}
                                    id="showByDefault"
                                    className="domain-field-checkbox"
                                />
                            </Col>
                        </Row>

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
                        {getServerContext().moduleContext.study.timepointType === 'VISIT' && (
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
                                            { label: 'Share by ' + getStudySubjectProp('columnName'), value: 'PTID' },
                                        ]}
                                        selectedValue={dataSharing}
                                        onSelectChange={this.onSelectChange}
                                        disabled={model.getDataRowSetting() !== 0}
                                    />
                                </div>
                            </>
                        )}
                    </Modal.Body>

                    <Modal.Footer>
                        <>
                            <Button
                                onClick={() => this.toggleModal(false)}
                                className="domain-adv-footer domain-adv-cancel-btn"
                            >
                                Cancel
                            </Button>

                            {helpLinkNode(
                                DATASET_PROPERTIES_TOPIC,
                                'Get help with dataset settings',
                                'domain-adv-footer domain-adv-link'
                            )}

                            <Button
                                onClick={this.applyChanges}
                                bsStyle={successBsStyle || 'success'}
                                className="domain-adv-footer domain-adv-apply-btn"
                            >
                                Apply
                            </Button>
                        </>
                    </Modal.Footer>
                </Modal>
            </>
        );
    }
}
