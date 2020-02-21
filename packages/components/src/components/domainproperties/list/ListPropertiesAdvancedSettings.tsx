import React from "react";
import {Button, Col, FormControl, FormGroup, Modal, Radio, Row} from "react-bootstrap";
import {LabelHelpTip, SelectInput} from "../../..";
import {faAngleRight, faAngleDown} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {CheckBox} from "./ListPropertiesPanelFormElements"

// TODO Must finalize
class DisplayTitle extends React.PureComponent<any, any> {
    render() {
        const fields = this.props.model.domain.fields;
        console.log("DisplayTitle", fields);
        console.log("length", fields.size);
        const disabled = !(fields.size > 0);
        let placeholder = disabled ? 'No fields have been defined yet' : 'Auto';

        return(
            <div className='list__advanced-settings-modal__display-title'>
                <SelectInput
                    name={'titleColumn'}
                    options={fields.toArray()}
                    placeholder={placeholder}
                    inputClass={''}
                    valueKey={'value'} //uh
                    labelKey={'name'}
                    formsy={false}
                    multiple={false}
                    required={false}
                    disabled={disabled}
                />
            </div>
        );
    }
}

class DiscussionLinks extends React.PureComponent<any, any> {
    render() {
        const {onRadioChange, discussionSetting} = this.props;
        const radioName = 'discussionSetting';

        return(
            <>
                <FormGroup>
                    <Radio
                        name={radioName}
                        value={0}
                        checked={0 == discussionSetting}
                        onChange={(e) => onRadioChange(e)}
                    >
                        Don't allow discussion links
                    </Radio>
                    <Radio
                        name={radioName}
                        value={1}
                        checked={1 == discussionSetting}
                        onChange={(e) => onRadioChange(e)}
                    >
                        Allow one discussion per item
                    </Radio>
                    <Radio
                        name={radioName}
                        checked={2 == discussionSetting}
                        value={2}
                        onChange={(e) => onRadioChange(e)}
                    >
                        Allow multiple discussions per item
                    </Radio>
                </FormGroup>
            </>
        );
    }
}

class TitleIndexField extends React.PureComponent<any, any> {
    render() {
        const {name, titleTemplate, titleSetting, onInputChange} = this.props;
        const title = (titleTemplate == null ) ? "" : titleTemplate;

        return(
            <div>
                Document title
                <LabelHelpTip
                    title={""}
                    body={() => {return (<> words to be written </>)}}
                />
                <span>
                    <FormControl
                        className='list__advanced-settings-modal__text-field'
                        id={name}
                        type="text"
                        placeholder={'Use default'}
                        value={title}
                        onChange={(e) => {onInputChange(e)}}
                    />
                </span>
            </div>
        );
    }
}

class MetadataIndexField extends React.PureComponent<any, any> {
    render() {
        const {indexSetting, name, onRadioChange} = this.props;

        return(
            <div>
                <FormGroup>
                    <Radio
                        name={name}
                        value={0}
                        checked={0 == indexSetting}
                        onChange={(e) => onRadioChange(e)}
                    >
                        Include both metadata and data
                    </Radio>
                    <Radio
                        name={name}
                        value={1}
                        checked={1 == indexSetting}
                        onChange={(e) => onRadioChange(e)}
                    >
                        Include data only
                    </Radio>
                    <Radio
                        name={name}
                        value={2}
                        checked={2 == indexSetting}
                        onChange={(e) => onRadioChange(e)}
                    >
                        Include metadata only (name and description of list and fields)
                    </Radio>
                </FormGroup>
            </div>
        );
    }
}

// Temp title. I have no idea what to call it. IndexIndexField??
class IndexField extends React.PureComponent<any, any> {
    render() {
        const {name, onRadioChange, bodySetting} = this.props;
        // console.log("indexField", name, bodySetting);

        return(
            <div>
                <FormGroup>
                    <Radio
                        name={name}
                        value={0}
                        checked={0 == bodySetting}
                        onChange={(e) => onRadioChange(e)}
                    >
                        Index all non-PHI text fields
                    </Radio>
                    <Radio
                        name={name}
                        value={1}
                        checked={1 == bodySetting}
                        onChange={(e) => onRadioChange(e)}
                    >
                        Index all non-PHI fields (text, number, date, and boolean)
                    </Radio>
                    <Radio
                        name={name}
                        value={2}
                        checked={2 == bodySetting}
                        onChange={(e) => onRadioChange(e)}
                    >
                        Index using custom template
                    </Radio>
                </FormGroup>
            </div>
        );
    }
}

class SingleDocumentIndexFields extends React.PureComponent<any, any> {
    render() {
        const {onRadioChange, onInputChange, entireListTitleSetting, entireListTitleTemplate, entireListIndexSetting, entireListBodySetting} = this.props;

        return (
            <div className='list__advanced-settings-modal__single-doc-fields'>
                <TitleIndexField
                    titleSetting={entireListTitleSetting}
                    titleTemplate={entireListTitleTemplate}
                    name={'entireListTitleTemplate'}
                    onInputChange={onInputChange}
                />

                <MetadataIndexField
                    name="entireListIndexSetting"
                    onRadioChange={onRadioChange}
                    indexSetting={entireListIndexSetting}
                />

                <IndexField
                    name="entireListBodySetting"
                    onRadioChange={onRadioChange}
                    bodySetting={entireListBodySetting}
                />
            </div>
        );
    }
}

class SeparateDocumentIndexFields extends React.PureComponent<any, any> {
    render() {
        const {onRadioChange, onInputChange, eachItemTitleSetting, eachItemTitleTemplate, eachItemBodySetting} = this.props;

        return (
            <div className='list__advanced-settings-modal__single-doc-fields'>
                <TitleIndexField
                    titleSetting={eachItemTitleSetting}
                    titleTemplate={eachItemTitleTemplate}
                    name={'eachItemTitleTemplate'}
                    onInputChange={onInputChange}
                />

                <IndexField
                    name="eachItemBodySetting"
                    onRadioChange={onRadioChange}
                    bodySetting={eachItemBodySetting}
                />
            </div>
        );
    }
}

class CollapsibleFields extends React.PureComponent<any, any> {
    render() {
        const {expanded, fields, title, expandFields, identifier, checked, onCheckboxChange} = this.props;
        const icon = expanded ? faAngleDown : faAngleRight;
        const set = expanded ? "" : identifier;

        return (
            <div>
                <span onClick={() => expandFields(set)}>
                    <FontAwesomeIcon icon={icon} size='lg' color='#333333'/>
                </span>
                <span className='list__advanced-settings-modal__index-checkbox'>
                    <CheckBox checked={checked} onClick={() => onCheckboxChange(identifier, checked)}/>
                    <span className='list__advanced-settings-modal__index-text'>
                        {title}
                        {expanded && fields}
                    </span>
                </span>
            </div>
        );
    }
}

class SearchIndexing extends React.PureComponent<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            expanded: "" // Neither section initially expanded
        }
    }

    expandFields = (expandedSection) => {
        this.setState({expanded: expandedSection});
    };

    render() {
        let {
            onRadioChange,
            onCheckboxChange,
            onInputChange,
            entireListIndexSettings,
            eachItemIndexSettings,
            fileAttachmentIndex } = this.props;


        const {expanded} = this.state;

        const singleDocTitle = "Index entire list as a single document";
        const separateDocTitle = "Index each item as a separate document";


        return(
            <div>
                <CollapsibleFields
                    expanded={expanded == "entireListIndex"}
                    fields={
                        <SingleDocumentIndexFields
                            onRadioChange={onRadioChange}
                            onInputChange={onInputChange}
                            {...entireListIndexSettings}
                        />}
                    title={singleDocTitle}
                    identifier="entireListIndex"
                    expandFields={this.expandFields}
                    checked={entireListIndexSettings.entireListIndex}
                    onCheckboxChange={onCheckboxChange}
                />

                <CollapsibleFields
                    expanded={expanded == "eachItemIndex"}
                    fields={
                        <SeparateDocumentIndexFields
                            onRadioChange={onRadioChange}
                            onInputChange={onInputChange}
                            {...eachItemIndexSettings}
                        />}
                    title={separateDocTitle}
                    identifier="eachItemIndex"
                    expandFields={this.expandFields}
                    checked={eachItemIndexSettings.eachItemIndex}
                    onCheckboxChange={onCheckboxChange}
                />

                <span style={{marginLeft: "16px"}}>
                    <CheckBox
                        checked={fileAttachmentIndex}
                        onClick={() => onCheckboxChange("fileAttachmentIndex", fileAttachmentIndex)}
                    />
                    <span className='list__advanced-settings-modal__index-text'>
                        Index file attachments
                    </span>
                </span>
            </div>
        );
    }
}

class SettingsContainer extends React.PureComponent<any, any> {
    render() {
        const {fieldComponent, title, tipBody} = this.props;

        return(
            <div className="list__advanced-settings-modal__section-container">
                <div className='list__advanced-settings-modal__heading'>
                    <span className="list__bold-text"> {title} </span>
                    <LabelHelpTip
                        title={""}
                        body={() => {return (<> {tipBody} </>)}}
                    />
                </div>

                {fieldComponent}
            </div>
        );
    }
}

class AdvancedSettingsModalBottom extends React.PureComponent<any, any> {
    render() {
        const {toggleModal, saveChanges} = this.props;

        return(
            <div className="list__advanced-settings-modal__bottom">

                <Button className="" onClick={() => toggleModal(false)}>
                    Cancel
                </Button>

                <span style={{float: "right"}}>
                    <a target="_blank" href="https://www.labkey.org/Documentation/wiki-page.view?name=lists" className="list__advanced-settings-modal__help-link">
                        Learn more about using lists
                    </a>

                    <Button className="btn-primary" onClick={saveChanges}>
                        Apply
                    </Button>
                </span>

            </div>
        );
    }
}

export class AdvancedSettings extends React.PureComponent<any, any> {
    constructor(props) {
        super(props);
        const initialState = this.setInitialState();

        this.state = {
            modalOpen: false,
            ...initialState
        }
    }

    setInitialState = () => {
        const model = this.props.model;

        return {
            titleColumn: model.titleColumn,
            discussionSetting: model.discussionSetting,
            fileAttachmentIndex: model.fileAttachmentIndex,
            // entire list
            entireListIndex: model.entireListIndex,
            //document title
            entireListTitleSetting: model.entireListTitleSetting, // may not need this?
            entireListTitleTemplate: model.entireListTitleTemplate,
            //metadata/data
            entireListIndexSetting: model.entireListIndexSetting,
            //index
            entireListBodySetting: model.entireListBodySetting,

            // each item
            eachItemIndex: model.eachItemIndex,
            // document title
            eachItemTitleSetting: model.eachItemTitleSetting, // may not need this?
            eachItemTitleTemplate: model.eachItemTitleTemplate,
            //index
            eachItemBodySetting: model.entireListBodySetting,
        }
    };

    toggleModal = (isModalOpen: boolean) => {
        this.setState({modalOpen: isModalOpen});

        // If modal is re-opened, reset unsaved values
        if (isModalOpen) {
            this.setState(this.setInitialState());
        }
    };

    onRadioChange = (e) => {
        const name = e.currentTarget.name;
        let value = e.target.value;
        // console.log("onRadioChange", name, value);
        this.setState({[name]: parseInt(value)});
    };

    onCheckboxChange = (name, checked) => {
        // console.log("oncheckboxChnage", name, !checked);
        this.setState({[name]: !checked});
    };

    onInputChange = (e) => {
        const id = e.target.id;
        let value = e.target.value;

        this.setState({[id]: value});
    };

    applyChanges = () => {
        const {modalOpen, ...advancedSettingsForm} = this.state;

        this.props.saveAdvancedProperties(advancedSettingsForm);
        this.toggleModal(false);
    };

    render() {
        const {modalOpen, discussionSetting, fileAttachmentIndex } = this.state;
        const {entireListIndex, entireListTitleSetting, entireListTitleTemplate, entireListIndexSetting, entireListBodySetting} = this.state;
        const {eachItemIndex, eachItemTitleSetting, eachItemTitleTemplate, eachItemBodySetting} = this.state;
        const {title, model} = this.props;

        const entireListIndexSettings = {
            entireListIndex,
            entireListTitleSetting,
            entireListTitleTemplate,
            entireListIndexSetting,
            entireListBodySetting
        };

        const eachItemIndexSettings = {
            eachItemIndex,
            eachItemTitleSetting,
            eachItemTitleTemplate,
            eachItemBodySetting};

        // console.log("AdvSettings", this.state);

        // For reviewer: would it be overzealous to pull this into separate <AdvancedSettingsButton/> and <AdvancedSettingsModal/> components?
        return(
            <Col xs={12} md={2}>
                <Button className={'domain-field-float-right'} onClick={() => this.toggleModal(true)}>
                    {title}
                </Button>

                <Modal show={modalOpen} onHide={() => this.toggleModal(false)}>
                    <Modal.Header>
                        <Modal.Title> Advanced List Settings </Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        <SettingsContainer
                            title='Field used for display title:'
                            tipBody='Text to be determined'
                            fieldComponent={<DisplayTitle model={model}/>}
                        />

                        <SettingsContainer
                            title='Discussion links'
                            tipBody='Text to be determined'
                            fieldComponent={<DiscussionLinks onRadioChange={this.onRadioChange} discussionSetting={discussionSetting}/>}
                        />

                        <SettingsContainer
                            title='Search indexing options'
                            tipBody='Text to be determined'
                            fieldComponent={
                                <SearchIndexing
                                    onRadioChange={this.onRadioChange}
                                    onCheckboxChange={this.onCheckboxChange}
                                    onInputChange={this.onInputChange}
                                    entireListIndexSettings={entireListIndexSettings}
                                    eachItemIndexSettings={eachItemIndexSettings}
                                    fileAttachmentIndex={fileAttachmentIndex}
                                />}
                        />

                        <AdvancedSettingsModalBottom
                            toggleModal={this.toggleModal}
                            saveChanges={this.applyChanges}
                        />
                    </Modal.Body>
                </Modal>
            </Col>
        );
    }
}
