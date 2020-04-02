import React from 'react';
import { Button, Col, FormControl, Modal, Row } from 'react-bootstrap';
import { helpLinkNode, LabelHelpTip, SelectInput } from '../../..';
import {DatasetAdvancedSettingsForm, DatasetModel} from "./models";
import { CheckBoxRow } from "../list/ListPropertiesPanelFormElements";
import {fetchCohorts, fetchVisitDateColumns, getHelpTip} from "./actions";
import "../../../theme/dataset.scss";
import {DomainFieldLabel} from "../DomainFieldLabel";
import {COHORT_TIP, DATASET_ID_TIP, DATASPACE_TIP, TAG_TIP, VISIT_DATE_TIP} from "./constants";
import {SectionHeading} from "../SectionHeading";
import {AdvancedSettingsForm} from "../list/models";

interface DatasetSettingsSelectProps {
    name: string;
    label: string;
    helpTip: JSX.Element;
    selectedValue?: any;
    selectOptions: any;
    onSelectChange: Function;
}

export class DatasetSettingsSelect extends React.PureComponent<DatasetSettingsSelectProps> {
    render() {
        const { name, label, helpTip, selectedValue, selectOptions, onSelectChange } = this.props;

        return(
            <Row className={'margin-top'}>

                <Col xs={5} >
                    { label }
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
    name: string;
    label: string;
    helpTip: JSX.Element;
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
            required
        } = this.props;

        return (
            <Row className={'margin-top'}>
                <Col xs={4} >
                    <DomainFieldLabel
                        label={label}
                        required={required}
                        helpTipBody={() => helpTip}
                    />
                </Col>

                { showInAdvancedSettings && < Col xs={1}/> }

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

                { !showInAdvancedSettings && < Col xs={1}/> }
            </Row>
        );
    }
}

interface AdvancedSettingsProps {
    model: DatasetModel;
    title: string;
    applyAdvancedProperties: (advancedSettingsForm: DatasetAdvancedSettingsForm) => void;
    showDataspace: boolean;
}

interface AdvancedSettingsState extends DatasetAdvancedSettingsForm {
    modalOpen?: boolean;
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, AdvancedSettingsState> {
    constructor(props) {
        super(props);
        const initialState = this.setInitialState();

        this.state = {
            modalOpen: false,
            ...initialState,
        } as AdvancedSettingsState;
    }

    componentDidMount() {
        const { model } = this.props;

        fetchCohorts()
            .then((data) => {
                this.setState(() => ({
                    availableCohorts: data.cohorts
                }));
            });

        fetchVisitDateColumns()
            .then((data) => {
                this.setState(() => ({
                    visitDateColumns: data.visitDateColumns
                }));
            })
    }

    setInitialState = () => {
        const model = this.props.model;

        return {
            datasetId: model.datasetId,
            tag: model.tag,
            showInOverview: model.showInOverview,
            cohort: model.cohortId,
            visitDateColumn: model.visitDatePropertyName,
        };
    };

    toggleModal = (isModalOpen: boolean): void => {
        this.setState({ modalOpen: isModalOpen });

        // If modal is re-opened, reset unsaved values
        if (isModalOpen) {
            this.setState(this.setInitialState());
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
        const value = selected ? selected.name : undefined;
        this.setState({ [name]: value });
    };

    isNewDataset () {
        const { model } = this.props;
        return !model.datasetId;
    };

    getHelpTipElement(field: string) : JSX.Element {
        return <> {getHelpTip(field)} </> as JSX.Element;
    }

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

        const {
            title,
            showDataspace
        } = this.props;

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

                        <SectionHeading title="Miscellaneous Options" />

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
                            helpTip={this.getHelpTipElement("datasetId")}
                            value={datasetId}
                            placeholder="Auto Assign"
                            disabled={!this.isNewDataset()}
                            onValueChange={this.onInputChange}
                            showInAdvancedSettings={true}
                            required={true}
                        />

                        <DatasetSettingsSelect
                            name="visitDateColumn"
                            label="Visit Date Column"
                            helpTip={this.getHelpTipElement("visitDateColumn")}
                            selectOptions={visitDateColumns}
                            selectedValue={visitDateColumn}
                            onSelectChange={this.onSelectChange}
                        />

                        <DatasetSettingsSelect
                            name="cohort"
                            label="Cohort Association"
                            helpTip={this.getHelpTipElement("cohort")}
                            selectOptions={availableCohorts}
                            selectedValue={cohort}
                            onSelectChange={this.onSelectChange}
                        />

                        <DatasetSettingsInput
                            name="tag"
                            label="Tag"
                            helpTip={this.getHelpTipElement("tag")}
                            value={tag}
                            disabled={false}
                            onValueChange={this.onInputChange}
                            showInAdvancedSettings={true}
                            required={false}
                        />

                        {
                            showDataspace &&
                            <>
                                <div className='margin-top'>
                                    <SectionHeading title="Dataspace Project Options" />
                                </div>

                                <DatasetSettingsSelect
                                    name="dataspace"
                                    label="Share demographic data"
                                    helpTip={this.getHelpTipElement("dataspace")}
                                    selectOptions={dataspaceOptions}
                                    selectedValue={dataspace}
                                    onSelectChange={this.onSelectChange}
                                 />
                            </>
                        }

                    </Modal.Body>

                    <Modal.Footer>
                        <>
                            <Button
                                onClick={() => this.toggleModal(false)}
                                className='domain-adv-footer domain-adv-cancel-btn'
                            >
                                Cancel
                            </Button>

                            { helpLinkNode("datasetProperties", "Learn more about using datasets", 'domain-adv-footer domain-adv-link') }

                            <Button
                                onClick={() => {}}
                                bsStyle={'success'}
                                className='domain-adv-footer domain-adv-apply-btn'
                            >
                                Apply
                            </Button>
                        </>
                    </Modal.Footer>
                </Modal>
            </Col>
        );
    }
}
