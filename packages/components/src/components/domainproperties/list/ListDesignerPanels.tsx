import React from 'react';
import {ListPropertiesPanel} from "./ListPropertiesPanel";
import {ListModel} from "../models";
import DomainForm from "../DomainForm";


export class ListDesignerPanels extends React.PureComponent<any, any> {
    constructor(props) {
        super(props);

        this.state = {
            model: props.model //TODO: this should eventually be props.initModel
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

    render(){
        const {model} = this.state;
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
                    onChange={() => {}}
                >
                </DomainForm>
            </>
        );
    }
}
