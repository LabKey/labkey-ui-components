import React from 'react';
import classNames from "classnames";
import {Button, Col, FormControl, FormGroup, Modal, Radio, Row} from 'react-bootstrap';
import { faAngleRight, faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { helpLinkNode, LabelHelpTip, ListModel, SelectInput } from '../../..';
import {CheckBox, SelectPropertyInput} from './DatasetPropertiesPanelFormElements';
import {AdvancedSettingsForm, DatasetModel} from "./models";
import {
    CUSTOM_TEMPLATE_TIP,
    DATA_INDEXING_TIP,
    DISCUSSION_LINKS_TIP,
    DOCUMENT_TITLE_TIP,
    SEARCH_INDEXING_TIP
} from "./constants";
import {BasicPropertiesTitle, TextInputWithLabel} from "../PropertiesPanelFormElements";
import {CheckBoxRow} from "../list/ListPropertiesPanelFormElements";
import {fetchCohorts} from "./actions";
import "../../../theme/dataset.scss";

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
}

interface AdvancedSettingsState {
    modalOpen?: boolean;
    cohortValue?: number;
    availableCohorts?: any;
    showInOverview?: boolean;
    visitDateColumn?: number;
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, AdvancedSettingsState> {
    constructor(props) {
        super(props);
        const initialState = this.setInitialState();

        this.state = {
            modalOpen: false,
            cohortValue: this.props.model.cohortId,
            ...initialState,
        } as AdvancedSettingsState;
    }

    componentDidMount() {
        const { model } = this.props;

        // Ajax call handling to get available categories
        fetchCohorts()
            .then((data) => {
                this.setState(() => ({
                    cohortValue: model.cohortId,
                    availableCohorts: data.cohorts
                }));
            })

    }

    setInitialState = () => {
        const model = this.props.model;

        return {
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

    onRadioChange = e => {
        const name = e.currentTarget.name;
        const value = e.target.value;
        this.setState({ [name]: parseInt(value) });
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
            availableCohorts,
            cohortValue,
            showInOverview
        } = this.state;

        const { title, model } = this.props;

        const tagTip =
            <>
                Adding a tag provides an additional, flexible way to categorize this dataset.
            </> as JSX.Element;

        let displayTitleTip =
            <>
                Choose a field to identify this list when other lists or datasets have lookups into this list.
                When “Auto” is enabled, LabKey will select the title field for you by using:
                <ul>
                    <li>The first non-lookup string column</li>
                    <li>The primary key, if there are no string fields</li>
                </ul>
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

                        <div className={'margin-top'}>
                            <CheckBoxRow
                                text="Show dataset in overview"
                                name="showInOverview"
                                onCheckBoxChange={this.onCheckboxChange}
                                checked={showInOverview}
                            />
                        </div>

                        <Row className={'margin-top'}>
                            <Col xs={4} >
                                Dataset ID
                                <LabelHelpTip
                                    title={title}
                                    body={() => {
                                        return <> {displayTitleTip} </>;
                                    }}
                                />
                            </Col>
                            <Col xs={1}/>

                            <Col xs={7} >
                                <FormControl
                                    id={name}
                                    type="text"
                                    placeholder="Auto Assign"
                                    value={model.datasetId}
                                    onChange={() => {}}
                                />
                            </Col>
                        </Row>

                        <Row className={'margin-top'}>

                            <Col xs={5} >
                                Visit Date Column
                                <LabelHelpTip
                                    title={title}
                                    body={() => {
                                        return <> {displayTitleTip} </>;
                                    }}
                                />
                            </Col>

                            <Col xs={7} >
                                <div className='dataset_advanced_settings_select'>
                                    <SelectInput
                                        onChange={(value) => {this.setState(()=> ({cohortValue: value}))}}
                                        value={cohortValue}
                                        options={availableCohorts}
                                        inputClass="dataset_advanced_settings_select"
                                        labelClass=""
                                        valueKey="name"
                                        labelKey="label"
                                        formsy={false}
                                        multiple={false}
                                        required={false}
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Row className={'margin-top'}>

                            <Col xs={5} >
                                Cohort Association
                                <LabelHelpTip
                                    title={title}
                                    body={() => {
                                        return <> {displayTitleTip} </>;
                                    }}
                                />
                            </Col>

                            <Col xs={7} >
                                <div className='dataset_advanced_settings_select'>
                                    <SelectInput
                                        onChange={(value) => {this.setState(()=> ({cohortValue: value}))}}
                                        value={cohortValue}
                                        options={availableCohorts}
                                        inputClass="dataset_advanced_settings_select"
                                        labelClass=""
                                        formsy={false}
                                        multiple={false}
                                        required={false}
                                    />
                                </div>
                            </Col>
                        </Row>

                        <Row className={'margin-top'}>
                            <Col xs={4} >
                                Tag
                                <LabelHelpTip
                                    title="Tag"
                                    body={() => {
                                        return <> {tagTip} </>;
                                    }}
                                />
                            </Col>

                            <Col xs={1}/>

                            <Col xs={7} >
                                <FormControl
                                    id="tag"
                                    type="text"
                                    value={model.tag}
                                    onChange={() => {}}
                                />
                            </Col>
                        </Row>

                        <BasicPropertiesTitle title="Dataspace Project Options" />

                        <Row className={'margin-top'}>

                            <Col xs={5} >
                                Share demographic data
                                <LabelHelpTip
                                    title={title}
                                    body={() => {
                                        return <> {displayTitleTip} </>;
                                    }}
                                />
                            </Col>

                            <Col xs={7} >
                                <div className='dataset_advanced_settings_select'>
                                    <SelectInput
                                        onChange={(value) => {this.setState(()=> ({cohortValue: value}))}}
                                        value={cohortValue}
                                        options={availableCohorts}
                                        inputClass="dataset_advanced_settings_select"
                                        labelClass=""
                                        valueKey="name"
                                        labelKey="label"
                                        formsy={false}
                                        multiple={false}
                                        required={false}
                                    />
                                </div>
                            </Col>
                        </Row>

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
