import React from 'react';
import {ListPropertiesPanel} from "./ListPropertiesPanel";
import {DomainDesign, DomainPanelStatus, HeaderRenderer, IAppDomainHeader, IDomainField, ListModel} from "../models";
import DomainForm from "../DomainForm";
import {Alert, Button, Col, FormControl, Row} from "react-bootstrap";
import {saveListDesign} from "../actions";
import {LabelHelpTip} from "../../..";

class SetKeyFieldName extends React.PureComponent<IAppDomainHeader> {
    render() {
        let fieldNames= [];
        if (this.props.domain) {
            const fields = this.props.domain.fields;
            // console.log("SetKeyFieldName", fields);

            fieldNames = fields && fields.reduce(function(accum: String[], field: IDomainField) {
                const dataType = field.dataType.name;
                if ((dataType == 'string' || dataType == 'int') && (typeof field.name !== 'undefined') && (field.name.trim().length > 0)) {
                    accum.push(field.name);
                }
                return accum;
            }, []);
        }

        const {onChangeTemp, keyField} = this.props;
        console.log("SeKeyFieldNameProps", this.props);
        return(
            <Alert>
                <div>
                    Select a key value for this list which uniquely identifies the item. You can use "Auto integer key" to define your own below.
                </div>
                <Row style={{marginTop:"15px"}}>
                    <Col xs={3} style={{color: "black"}}>
                        Key Field Name
                        <LabelHelpTip
                            title={""}
                            body={() => {return (<> Only integer or text fields can be made the primary key. </>)}}
                        />
                        *
                    </Col>
                    <Col xs={3}>
                        <FormControl
                            componentClass="select"
                            name="keyField"
                            placeholder="select"
                            onChange={(e) => onChangeTemp(e)}
                            value={keyField}
                            style={{width: "200px"}}
                        >
                            <option value={-1}>
                                Auto integer key
                            </option>

                            {fieldNames.map((fieldName, index) => {
                                return(
                                    <option value={index} key={index + 1}>
                                        {fieldName}
                                    </option>
                                )
                            })}
                        </FormControl>
                    </Col>
                </Row>
            </Alert>
        );
    }
}

export class ListDesignerPanels extends React.PureComponent<any, any> {
    constructor(props) {
        super(props);

        this.state = {
            model: props.model, //TODO: this should eventually be props.initModel?
            keyField: -1,
            // firstState: true
        }
    }

    onPropertiesChange = (model: ListModel) => {
        console.log("onPropertiesChange, received Model", model);

        this.setState(() => ({
            model: model
        })
        , () => {console.log("onPropertiesChange", this.state)}
        )
    };

    onDomainChange = (domain) => {
        this.setState((state) => {
            const updatedModel = this.state.model.merge({domain}) as DomainForm;
            return {model: updatedModel};
        }, () => {
            // TODO: call dirty on Designer.tsx
            console.log("onDomainChange", this.state);
        });
    };

    onFinish = () => {
        // validate before submitting
        let isValid = true; // TODO

        if (isValid) {
            // TODO: set state 'Submitting' and, for some reason, the model?
        }

        // TODO: finalize upon receiving info
        saveListDesign(this.state.model)
            .then((response) => console.log("yay!:", response))
            .catch((model) => console.log("failure:", model));
    };

    onKeyFieldChange = (e) => {
        const {name, value} = e.target;
        const fields = this.state.model.domain.fields;

        const oldKeyField = fields.get(this.state.keyField);
        const updatedOldKeyField = oldKeyField.set('isPrimaryKey', false);

        const newKeyField = fields.get(value);
        const updatedNewKeyField = newKeyField.set('isPrimaryKey', true);


        const newFields = fields.set(value, updatedNewKeyField);

        console.log('ONKEYFIELDCHANGE', fields, "\n value", value,"\n newKeyField", newKeyField);


        this.setState({[name]: value});

    };

    getPanelStatus = (index: number): DomainPanelStatus => {
        const { currentPanelIndex, visitedPanels, firstState } = this.state;

        if (index === 0 && firstState) {
            return 'NONE';
        }

        // if (currentPanelIndex === index) {
        //     return 'INPROGRESS';
        // }
        //
        // if (visitedPanels.contains(index)) {
        //     return 'COMPLETE';
        // }

        return 'TODO';
    };

    render(){
        const {model} = this.state;
        const {onCancel} = this.props;
        // console.log("ListDesignerPanel", model);

        let config = {domain: model.domain} as IAppDomainHeader;


        return(
            <>
                <ListPropertiesPanel
                    panelStatus={model.isNew() ? this.getPanelStatus(0) : 'COMPLETE'}
                    model={model}
                    collapsible={true}
                    onChange={this.onPropertiesChange}
                />

                <DomainForm
                    domain={model.domain}
                    helpTopic={null}
                    onChange={(newDomain) => {
                        // console.log("the heck");
                        this.onDomainChange(newDomain);
                    }}
                    controlledCollapse={true}
                    initCollapsed={true}
                    headerTitle={"List Fields"}
                    panelStatus={model.isNew() ? this.getPanelStatus(1) : 'COMPLETE'}
                    showInferFromFile={true}
                    appDomainHeaderRenderer={(config: IAppDomainHeader) => {return (
                        <SetKeyFieldName onChangeTemp={this.onKeyFieldChange} keyField={this.state.keyField} {...config}/>
                    )}}
                />

                <div className='domain-form-panel domain-assay-buttons'>
                    <Button onClick={onCancel}> Cancel </Button>
                    <Button
                        className='pull-right'
                        bsStyle='success'
                        // disabled={this.state.submitting}
                        onClick={this.onFinish}
                    >
                        Save
                    </Button>
                </div>
            </>
        );
    }
}
