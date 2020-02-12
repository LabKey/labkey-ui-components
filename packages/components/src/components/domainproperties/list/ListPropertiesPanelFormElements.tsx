import React from "react";
import {Button, Col, FormControl, Panel, Row, Modal, FormGroup, Radio} from "react-bootstrap";
import classNames from "classnames";
import {faCheckCircle, faExclamationCircle, faMinusSquare, faPlusSquare} from "@fortawesome/free-solid-svg-icons";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faCheckSquare} from "@fortawesome/free-solid-svg-icons/faCheckSquare";
import {faSquare} from "@fortawesome/free-regular-svg-icons/faSquare";
import {LabelHelpTip} from "../../..";

class ListPropertiesHeader extends React.PureComponent<any, any> {
    render(){
        const { panelStatus, controlledCollapse, collapsible, collapsed, model, validProperties } = this.props;
        // console.log("ListPropertiesHeader", this.props);

        const isComplete = validProperties && panelStatus === 'COMPLETE';

        let headerIconClass = classNames('domain-panel-status-icon', {
            'domain-panel-list-header-expanded': !collapsed,
            'domain-panel-status-icon-green': isComplete && collapsed,
            'domain-panel-status-icon-blue': !isComplete && collapsed
        });

        let statusIcon = (!validProperties || panelStatus === 'TODO') ? faExclamationCircle : faCheckCircle;
        return(
            <>
                <span className={headerIconClass}>
                    <FontAwesomeIcon icon={statusIcon}/>
                </span>

                <span className={'domain-panel-title'}> {model.name && model.name + ' -'} List Properties </span>

                {(controlledCollapse || collapsible) &&
                <span className='pull-right'>
                    <FontAwesomeIcon
                        size={'lg'}
                        icon={collapsed ? faPlusSquare: faMinusSquare}
                        className={classNames({'domain-form-expand-btn': collapsed, 'domain-form-collapse-btn': !collapsed})}
                    />
                </span>
                }
            </>
        );
    }
}

export class Header extends React.PureComponent<any, any> {
    render(){
        const {togglePanel, collapsible, collapsed, panelStatus, model, validProperties} = this.props;

        return(
            <Panel.Heading
                onClick={togglePanel}
                className={classNames('domain-panel-header', {
                    'domain-heading-collapsible': collapsible,
                    'domain-panel-header-expanded': !collapsed,
                    'domain-panel-header-collapsed': collapsed,
                })}
                style={{backgroundColor: collapsed ? null :'#2980b9'}}
            >
                {panelStatus && panelStatus !== 'NONE' &&
                    <ListPropertiesHeader
                        panelStatus={panelStatus}
                        validProperties={validProperties}
                        collapsed={collapsed}
                        collapsible={true} //todo
                        model={model}
                    />
                }
            </Panel.Heading>
        );
    }
}

class BasicPropertiesTitle extends React.PureComponent<any, any> {
    render(){
        return(
            <Row>
                <Col xs={9} >
                    <b>{this.props.title}</b>
                </Col>
            </Row>
        );
    }
}

class NameInput extends React.PureComponent<any, any> {
    render(){
        let {model, onInputChange} = this.props;

        return(
            <Row style={{marginTop: "20px", height: "40px"}}>
                <Col xs={3} lg={4}>
                    Name
                    <LabelHelpTip
                        title={""}
                        body={() => {return (<> Text to be determined </>)}}
                        required={true}
                    />
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl
                        id='name'
                        type="text"
                        placeholder={'Enter a name for this list'}
                        value={model.name}
                        onChange={onInputChange}
                        disabled={false}
                    />
                </Col>
            </Row>
        );
    }
}

class DescriptionInput extends React.PureComponent<any, any> {
    render(){
        let {model, onInputChange} = this.props;
        let value = (model.description === null) ? "" : model.description;

        return(
            <Row style={{marginTop: "20px", height: "40px"}}>
                <Col xs={3} lg={4}>
                    Description
                </Col>

                <Col xs={9} lg={8}>
                    <FormControl
                        id='description'
                        type="text"
                        value={value}
                        onChange={onInputChange}
                        disabled={false}
                    />
                </Col>
            </Row>
        );
    }
}

export class BasicPropertiesFields extends React.PureComponent<any, any> {
    render() {
        const {model, onInputChange} = this.props;
        return(
            <Col xs={12} lg={6}>
                <BasicPropertiesTitle title={"Basic Properties"}/>

                <NameInput
                    model={model}
                    onInputChange={onInputChange}
                />

                <DescriptionInput
                    model={model}
                    onInputChange={onInputChange}
                />
            </Col>
        );
    }
}

export class CheckBox extends React.PureComponent<any, any> {
    render() {
        let {onClick, checked} = this.props;

        const checkedOrNot = checked ? (
            <FontAwesomeIcon size="lg" icon={faCheckSquare} color="#0073BB" />
        ) : (
            <FontAwesomeIcon size="lg" icon={faSquare} color="#adadad" />
        );

        return (
            <span style={{cursor: "pointer"}} onClick={onClick}>
                {checkedOrNot}
            </span>
        );
    }
}

class CheckBoxRow extends React.PureComponent<any, any> {
    render(){
        let {checked, onCheckBoxChange, name} = this.props;

        return(
            <div style={{marginTop:"10px"}}>
                <CheckBox checked={checked} onClick={() => {onCheckBoxChange(name, checked)}}/>
                <span style={{marginLeft: "10px"}}>
                    {this.props.text}
                </span>
            </div>
        );
    }
}

class AllowableActionContainer extends React.PureComponent<any, any> {
    render(){
        let {onCheckBoxChange} = this.props;
        let {allowDelete, allowUpload, allowExport} = this.props.model;
        return(
            <Row style={{marginTop:"10px"}}>
                <Col xs={3} lg={4}>
                    <CheckBoxRow
                        text={"Delete"}
                        checked={allowDelete}
                        onCheckBoxChange={onCheckBoxChange}
                        name="allowDelete"
                    />
                    <CheckBoxRow
                        text={"Upload"}
                        checked={allowUpload}
                        onCheckBoxChange={onCheckBoxChange}
                        name="allowUpload"
                    />
                    <CheckBoxRow
                        text={"Export & Print"}
                        checked={allowExport}
                        onCheckBoxChange={onCheckBoxChange}
                        name="allowExport"
                    />
                </Col>
            </Row>
        );
    }
}

export class AllowableActions extends React.PureComponent<any, any> {
    render(){
        return(
            <>
                <Col lg={1}/>
                <Col xs={12} lg={5}>
                    <BasicPropertiesTitle title={"Allow these Actions"}/>

                    <AllowableActionContainer model={this.props.model} onCheckBoxChange={this.props.onCheckBoxChange}/>
                </Col>
            </>
        );
    }
}
