import React from 'react';
import {ListPropertiesPanel} from "./ListPropertiesPanel";
import {DomainPanelStatus, ListModel} from "../models";
import DomainForm, {DomainFormImpl} from "../DomainForm";
import {Button} from "react-bootstrap";
import {saveListDesign} from "../actions";

export class ListDesignerPanels extends React.PureComponent<any, any> {
    constructor(props) {
        super(props);

        this.state = {
            model: props.model, //TODO: this should eventually be props.initModel?
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
        console.log("ListDesignerPanel", model);


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
                        console.log("the heck");
                        this.onDomainChange(newDomain);
                    }}
                    controlledCollapse={true}
                    initCollapsed={true}
                    headerTitle={"List Fields"}
                    panelStatus={model.isNew() ? this.getPanelStatus(1) : 'COMPLETE'}
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
                        onClick={this.onFinish}
                    >
                        Save
                    </Button>
                </div>
            </>
        );
    }
}
