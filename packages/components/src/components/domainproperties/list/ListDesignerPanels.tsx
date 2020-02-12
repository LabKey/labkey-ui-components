import React from 'react';
import {ListPropertiesPanel} from "./ListPropertiesPanel";
import {ListModel} from "../models";
import DomainForm, {DomainFormImpl} from "../DomainForm";
import {Button} from "react-bootstrap";

export class ListDesignerPanels extends React.PureComponent<any, any> {
    constructor(props) {
        super(props);

        this.state = {
            model: props.model //TODO: this should eventually be props.initModel?
        }
    }

    onPropertiesChange = (model: ListModel) => {
        console.log("onPropertiesChange, recieved Model", model);

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



    };

    render(){
        const {model} = this.state;
        const {onCancel} = this.props;
        console.log("ListDesignerPanel", model);


        return(
            <>
                <ListPropertiesPanel
                    panelStatus={'COMPLETE'}
                    model={model}
                    collapsible={true}
                    onChange={this.onPropertiesChange}
                />

                <DomainForm
                    domain={model.domain}
                    helpTopic={null}
                    onChange={(newDomain) => {
                        console.log("the heck");
                        this.onDomainChange(newDomain);
                    }}
                    controlledCollapse={true}
                    initCollapsed={true}
                    headerTitle={"List Fields"}
                    panelStatus={"TODO"} //TODO
                    showInferFromFile={true}
                />

                {/*<DomainFormImpl*/}
                {/*    domain={undefined}*/}
                {/*    showInferFromFile={true}*/}
                {/*    onChange={() => {}}*/}
                {/*/>*/}

                <div className='domain-form-panel domain-assay-buttons'>
                    <Button onClick={onCancel}> Cancel </Button>
                    <Button
                        className='pull-right'
                        bsStyle='success'
                        // disabled={this.state.submitting}
                        // onClick={this.onFinish}
                    >
                        Save
                    </Button>
                </div>

            </>
        );
    }
}
