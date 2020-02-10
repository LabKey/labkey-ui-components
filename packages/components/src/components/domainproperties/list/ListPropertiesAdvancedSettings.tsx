import React from "react";
import {Button, Col, FormControl, FormGroup, Modal, Radio, Row} from "react-bootstrap";
import {LabelHelpTip} from "../../..";
import {faAngleRight, faAngleDown} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {CheckBox} from "./ListPropertiesPanelFormElements"

class DisplayTitle extends React.PureComponent<any, any> {
    render() {
        return(
            <>
                <FormControl
                    className='list__advanced-settings-modal__display-title-input'
                    id='titleColumn'
                    type="text"
                    placeholder={'No fields have been defined yet'}
                    value={''}
                    onChange={() => {}}
                    disabled={false}
                />
            </>
        );
    }
}

class DiscussionLinks extends React.PureComponent<any, any> {
    render() {
        const {onRadioChange} = this.props;
        const radioName = 'discussionSettingEnum';

        return(
            <>
                <FormGroup>
                    <Radio
                        name={radioName}
                        value={"None"}
                        checked={true}
                        onChange={(e) => onRadioChange(e)}
                    >
                        Don't allow discussion links
                    </Radio>
                    <Radio
                        name={radioName}
                        value={"OnePerItem"}
                        onChange={(e) => onRadioChange(e)}
                    >
                        Allow one discussion per item
                    </Radio>
                    <Radio
                        name={radioName}
                        value={"ManyPerItem"}
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
                            id='TODO'
                            type="text"
                            placeholder={'Use default'}
                            value={''}
                            onChange={() => {}}
                        />
                    </span>
            </div>
        );
    }
}

class MetadataIndexField extends React.PureComponent<any, any> {
    render() {
        const metadataName = this.props;

        return(
            <div>
                <FormGroup>
                    <Radio >
                        Include both metadata and data
                    </Radio>
                    <Radio >
                        Include data only
                    </Radio>
                    <Radio >
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
        const indexName = this.props;

        return(
            <div>
                <FormGroup>
                    <Radio >
                        Index all non-PHI text fields
                    </Radio>
                    <Radio >
                        Index all non-PHI fields (text, number, date, and boolean)
                    </Radio>
                    <Radio >
                        Index using custom template
                    </Radio>
                </FormGroup>
            </div>
        );
    }
}

class SingleDocumentIndexFields extends React.PureComponent<any, any> {
    render() {
        const {metadataName, indexName} = this.props;

        return (
            <div className='list__advanced-settings-modal__single-doc-fields'>
                <TitleIndexField/>

                <MetadataIndexField metadataName={metadataName}/>

                <IndexField/>
            </div>
        );
    }
}

class SeparateDocumentIndexFields extends React.PureComponent<any, any> {
    render() {
        const {metadataName, indexName} = this.props;

        return (
            <div className='list__advanced-settings-modal__single-doc-fields'>
                <TitleIndexField/>

                <IndexField/>
            </div>
        );
    }
}

class CollapsibleFields extends React.PureComponent<any, any> {
    render() {
        const {expanded, fields, title, expandFields} = this.props;

        return (
            <div>
                <FontAwesomeIcon icon={faAngleRight} size='lg' color='#333333'/>
                <span className='list__advanced-settings-modal__index-checkbox'>
                    <CheckBox checked={false} onClick={() => expandFields(title)}/>
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
            expanded: ""
        }
    }

    expandFields = (expandedSection) => {
        this.setState({expanded: expandedSection});
    };

    render() {
        const {expanded} = this.state;
        const singleDocument = <SingleDocumentIndexFields metadataName="nametodo" indexName="name2todo"/>;
        const separateDocument = <SeparateDocumentIndexFields metadataName="nametodo" indexName="name2todo"/>;
        const singleDocTitle = "Index entire list as a single document";
        const separateDocTitle = "Index each item as a separate document";

        return(
            <div>
                <CollapsibleFields
                    expanded={expanded == singleDocTitle}
                    fields={singleDocument}
                    title={singleDocTitle}
                    expandFields={this.expandFields}
                />

                <CollapsibleFields
                    expanded={expanded == separateDocTitle}
                    fields={separateDocument}
                    title={separateDocTitle}
                    expandFields={this.expandFields}
                />

                <span style={{marginLeft: "16px"}}>
                    <CheckBox checked={false}/>
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
                    <a target="_blank" href="" className="list__advanced-settings-modal__help-link">
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

export class AdvancedSettingsButton extends React.PureComponent<any, any> {
    constructor(props) {
        super(props);
        this.state = {
            modalOpen: false
        }
    }

    toggleModal = (isModalOpen: boolean) => {
        this.setState({modalOpen: isModalOpen});
    };

    applyChanges = () => {

    };

    render(){
        const {modalOpen} = this.state;
        const {model, onRadioChange} = this.props;

        return(
            <Row>
                <Col xs={12}>
                    <Button style={{float: "right"}} onClick={() => this.toggleModal(true)}>
                        {this.props.title}
                    </Button>

                    <Modal show={modalOpen} onHide={() => this.toggleModal(false)}>
                        <Modal.Header>
                            <Modal.Title> Advanced List Settings </Modal.Title>
                        </Modal.Header>

                        <Modal.Body>
                            <SettingsContainer
                                model={model}
                                title='Field used for display title:'
                                tipBody='Text to be determined'
                                fieldComponent={<DisplayTitle/>}
                            />

                            <SettingsContainer
                                model={model}
                                title='Discussion links'
                                tipBody='Text to be determined'
                                fieldComponent={<DiscussionLinks onRadioChange={onRadioChange}/>}
                            />

                            <SettingsContainer
                                model={model}
                                title='Search indexing options'
                                tipBody='Text to be determined'
                                fieldComponent={<SearchIndexing/>}
                            />

                            <AdvancedSettingsModalBottom
                                toggleModal={this.toggleModal}
                                saveChanges={this.applyChanges}
                            />
                        </Modal.Body>
                    </Modal>
                </Col>
            </Row>
        );
    }
}
