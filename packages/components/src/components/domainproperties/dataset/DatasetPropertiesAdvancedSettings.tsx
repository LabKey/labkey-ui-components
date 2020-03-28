import React from 'react';
import { Button, Col, FormControl, Modal, Row } from 'react-bootstrap';
import { helpLinkNode, LabelHelpTip, ListModel, SelectInput } from '../../..';
import { DatasetModel } from "./models";
import { BasicPropertiesTitle } from "../PropertiesPanelFormElements";
import { CheckBoxRow } from "../list/ListPropertiesPanelFormElements";
import { fetchCohorts, fetchVisitDateColumns } from "./actions";
import "../../../theme/dataset.scss";

interface DatasetSettingsSelectProps {
    name?: string;
    label: string;
    helpTip: JSX.Element;
    selectedValue?: any;
    selectOptions: any;
    onSelectChange: any;
}

class DatasetSettingsSelect extends React.PureComponent<DatasetSettingsSelectProps> {
    render() {
        const { name, label, helpTip, selectedValue, selectOptions, onSelectChange } = this.props;

        return(
            <Row className={'margin-top'}>

                <Col xs={5} >
                    {label}
                    <LabelHelpTip
                        title={label}
                        body={() => {
                            return <> {helpTip} </>;
                        }}
                    />
                </Col>

                <Col xs={7} >
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
                    />
                </Col>
            </Row>
        );
    }
}

interface DatasetSettingsInputProps {
    name?: string;
    label: string;
    helpTip: JSX.Element;
    value?: any;
    placeholder?: string;
    onValueChange: any;
    disabled: boolean;
}

class DatasetSettingsInput extends React.PureComponent<DatasetSettingsInputProps> {
    render() {
        const { name, label, helpTip, value, placeholder, onValueChange, disabled } = this.props;

        return (
            <Row className={'margin-top'}>
                <Col xs={4} >
                    {label}
                    <LabelHelpTip
                        title={label}
                        body={() => {
                            return <> {helpTip} </>;
                        }}
                    />
                </Col>
                <Col xs={1}/>

                <Col xs={7} >
                    <FormControl
                        id={name}
                        type="text"
                        placeholder={placeholder}
                        value={value}
                        onChange={onValueChange}
                        disabled={disabled}
                    />
                </Col>
            </Row>
        );
    }
}

interface AdvancedSettingsModalBottomProps {
    toggleModal: (isModalOpen: boolean) => void;
    applyChanges: () => void;
    successBsStyle?: string;
    helpText?: string;
    helpTopic?: string;
}

class AdvancedSettingsModalBottom extends React.PureComponent<AdvancedSettingsModalBottomProps> {
    render() {
        const { toggleModal, applyChanges, successBsStyle, helpTopic, helpText } = this.props;

        return (
            <>
                <Button onClick={() => toggleModal(false)} className='domain-adv-footer domain-adv-cancel-btn'>
                    Cancel
                </Button>
                {helpLinkNode(helpTopic, helpText, 'domain-adv-footer domain-adv-link')}
                <Button onClick={applyChanges} bsStyle={successBsStyle || 'success'} className='domain-adv-footer domain-adv-apply-btn'>
                    Apply
                </Button>
            </>
        );
    }
}

interface AdvancedSettingsProps {
    model: DatasetModel;
    title: string;
    newDataset: boolean;
}

interface AdvancedSettingsState {
    modalOpen?: boolean;
    datasetId?: number;
    cohort?: number;
    tag?: string;
    availableCohorts?: any;
    showInOverview?: boolean;
    visitDateColumn?: string;
    visitDateColumns?: any;
    dataspace?: string;
    dataspaceOptions?: any
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, AdvancedSettingsState> {
    constructor(props) {
        super(props);
        const initialState = this.setInitialState();

        this.state = {
            modalOpen: false,
            // cohort: this.props.model.cohortId,
            ...initialState,
        } as AdvancedSettingsState;
    }

    componentDidMount() {
        const { model } = this.props;

        // Ajax call handling to get available categories
        fetchCohorts()
            .then((data) => {
                this.setState(() => ({
                    cohort: model.cohortId,
                    availableCohorts: data.cohorts
                }));
            });

        fetchVisitDateColumns()
            .then((data) => {
                this.setState(() => ({
                    visitDateColumn: model.visitDatePropertyName,
                    visitDateColumns: data.visitDateColumns
                }));
            })

    }

    setInitialState = () => {
        const model = this.props.model;

        return {
            datasetId: model.datasetId,
            tag: model.tag,
            showInOverview: model.showInOverview
        };
    };

    toggleModal = (isModalOpen: boolean): void => {
        this.setState({ modalOpen: isModalOpen });

        // If modal is re-opened, reset unsaved values
        if (isModalOpen) {
            //this.setState(this.setInitialState());
        }
    };

    onCheckboxChange = (name, checked) => {
        this.setState(() => ({ showInOverview: !checked }));
    };

    onInputChange = e => {
        const id = e.target.id;
        const value = e.target.value;

        this.setState({ [id]: value });
    };

    onSelectChange = (name, formValue, selected): void => {
        const value = (selected) ? selected.name : '<AUTO>';
        this.setState({ [name]: value });
    };

    applyChanges = (): void => {
        const { modalOpen, ...advancedSettingsForm } = this.state;
    };

    render() {
        const {
            modalOpen,
            datasetId,
            availableCohorts,
            cohort,
            tag,
            showInOverview,
            visitDateColumn,
            visitDateColumns,
            dataspace,
            dataspaceOptions
        } = this.state;

        const { title, model, newDataset } = this.props;

        const datasetIdTip =
            <>
                Required. The unique, numerical identifier for your dataset. It is defined during dataset creation and cannot be modified.
            </> as JSX.Element;

        const visitDateTip =
            <>
                If the official 'Visit Date' for a visit can come from this dataset, choose the date column to represent it.
                Note that since datasets can include data from many visits, each visit must also indicate the official 'VisitDate' dataset.
            </> as JSX.Element;

        const cohortTip =
            <>
                Datasets may be cohort specific, or associated with all cohorts.
            </> as JSX.Element;

        const tagTip =
            <>
                Adding a tag provides an additional, flexible way to categorize this dataset.
            </> as JSX.Element;

        const dataspaceTip =
            <>
                Coming soon...
            </> as JSX.Element;

        return (
            <Col xs={12} md={2}>
                <Button className="domain-field-float-right" onClick={() => this.toggleModal(true)}>
                    {title}
                </Button>

                <Modal show={modalOpen} onHide={() => this.toggleModal(false)}>
                    <Modal.Header closeButton>
                        <Modal.Title> Advanced Dataset Settings </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>

                        <BasicPropertiesTitle title="Miscellaneous Options" />

                        <div className='margin-top'>
                            <CheckBoxRow
                                text="Show dataset in overview"
                                name="showInOverview"
                                onCheckBoxChange={this.onCheckboxChange}
                                checked={showInOverview}
                            />
                        </div>

                        <DatasetSettingsInput
                            name="datasetId"
                            label="Dataset ID"
                            helpTip={datasetIdTip}
                            value={datasetId}
                            placeholder="Auto Assign"
                            disabled={!newDataset}
                            onValueChange={this.onInputChange}
                        />

                        <DatasetSettingsSelect
                            name="visitDateColumn"
                            label="Visit Date Column"
                            helpTip={visitDateTip}
                            selectOptions={visitDateColumns}
                            selectedValue={visitDateColumn}
                            onSelectChange={this.onSelectChange}
                        />

                        <DatasetSettingsSelect
                            name="cohort"
                            label="Cohort Association"
                            helpTip={cohortTip}
                            selectOptions={availableCohorts}
                            selectedValue={cohort}
                            onSelectChange={this.onSelectChange}
                        />

                        <DatasetSettingsInput
                            name="tag"
                            label="Tag"
                            helpTip={tagTip}
                            value={tag}
                            disabled={false}
                            onValueChange={this.onInputChange}
                        />

                        <div className='margin-top'>
                            <BasicPropertiesTitle title="Dataspace Project Options" />
                        </div>

                        <DatasetSettingsSelect
                            name="dataspace"
                            label="Share demographic data"
                            helpTip={dataspaceTip}
                            selectOptions={dataspaceOptions}
                            selectedValue={dataspace}
                            onSelectChange={this.onSelectChange}
                        />

                    </Modal.Body>

                    <Modal.Footer>
                        <AdvancedSettingsModalBottom
                            toggleModal={this.toggleModal}
                            applyChanges={this.applyChanges}
                            helpTopic="createDataset"
                            helpText="Learn more about datasets"
                        />
                    </Modal.Footer>
                </Modal>
            </Col>
        );
    }
}
