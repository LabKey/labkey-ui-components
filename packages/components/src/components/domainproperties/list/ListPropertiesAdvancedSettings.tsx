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
        const radioName = 'titleColumn';

        return(
            <>
                <FormGroup>
                    <Radio name={radioName}>
                        Don't allow discussion links
                    </Radio>
                    <Radio name={radioName}>
                        Allow one discussion per item
                    </Radio>
                    <Radio name={radioName}>
                        Allow multiple discussions per item
                    </Radio>
                </FormGroup>
            </>
        );
    }
}

class SearchIndexing extends React.PureComponent<any, any> {
    render() {
        return(
            <>
                <FontAwesomeIcon icon={faAngleRight}/>
                <CheckBox checked={false}/>
                Index entire list as a single document
            </>
        );
    }
}

class SettingsContainer extends React.PureComponent<any, any> {
    render() {
        const {fieldComponent, title, tipBody} = this.props;

        return(
            <div className="list__advanced-settings-modal__section-container">
                <span className="list__bold-text"> {title} </span>
                <LabelHelpTip
                    title={""}
                    body={() => {return (<> {tipBody} </>)}}
                />

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

    saveChanges = () => {

    };

    render(){
        const {modalOpen} = this.state;

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
                                title='Field used for display title:'
                                tipBody='Text to be determined'
                                fieldComponent={<DisplayTitle/>}
                            />

                            <SettingsContainer
                                title='Discussion links'
                                tipBody='Text to be determined'
                                fieldComponent={<DiscussionLinks/>}
                            />

                            <SettingsContainer
                                title='Search indexing options'
                                tipBody='Text to be determined'
                                fieldComponent={<SearchIndexing/>}
                            />

                            <AdvancedSettingsModalBottom
                                toggleModal={this.toggleModal}
                                saveChanges={this.saveChanges}
                            />
                        </Modal.Body>
                    </Modal>
                </Col>
            </Row>
        );
    }
}
