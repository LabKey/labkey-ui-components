import React from 'react';
import {FormControl, Panel, Form, Col, Button, Row} from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert } from '../../base/Alert';
import classNames from 'classnames';
import {DomainPanelStatus, ListModel} from "../models";
import {
    AllowableActions,
    Header,
    BasicPropertiesFields,
} from "./ListPropertiesPanelFormElements";
import {AdvancedSettings} from "./ListPropertiesAdvancedSettings";
import {Utils} from "@labkey/api";

interface Props {
    model: ListModel
    panelStatus: DomainPanelStatus
    collapsible: boolean
    onChange: (model: any) => any
}

interface State {
    collapsed: boolean
    validProperties: boolean
}

export class ListPropertiesPanel extends React.PureComponent<Props, State> {

    static defaultProps = {
        // ToDo
    };

    constructor(props) {
        super(props);
        this.state = {
            // collapsed: props.initCollapsed, todo
            collapsed: false,
            validProperties: true
        }
    }

    toggleLocalPanel = (): void => {
        this.setState((state) => ({
            collapsed: !state.collapsed,
            // validProperties: model && model.hasValidProperties()
        })
        // ,() => {console.log("collapsed:", this.state.collapsed)}
        );
    };

    // oh no, we already get a 'onChange' from props. Rename this
    onChange = (identifier, value) => {
        const {model, onChange} = this.props;

        const newModel = model.merge({
            [identifier]: value
        }) as ListModel;

        console.log("onChange", identifier, value);
        console.log("onChange newModel", newModel);

        // TODO: Check for validity of new model properties. Set validity state, then call
        // model change on callback.

        onChange(newModel);
    };

    onInputChange = (e) => {
        const id = e.target.id;
        let value = e.target.value;

        // special case for empty string, set as null instead
        if (Utils.isString(value) && value.length === 0) {
            value = null;
        }

        this.onChange(id, value);
    };

    onCheckBoxChange = (name, checked) => {
        const {model, onChange} = this.props;
        const newModel = model.merge({
            [name]: !checked
        }) as ListModel;

        onChange(newModel);
    };

    onRadioChange = (e) => {
        const name = e.currentTarget.name;
        let value = e.target.value;
        this.onChange(name, value);
    };

    saveAdvancedProperties = (advancedSettingsForm) => {
        const {model, onChange} = this.props;

        const newModel = model.merge(advancedSettingsForm);
        onChange(newModel);
    };
    
    render() {
        let { panelStatus, collapsible, model } = this.props;
        let { validProperties, collapsed } = this.state;

        // Style todo: AssayPropertiesPanel pulls labkey-page-nav from _navigation.scss
        return(
            <>
                <Panel
                    className={classNames('domain-form-panel', {'domain-panel-no-theme': !collapsed})}
                    expanded={!collapsed}
                    onToggle={() => {}}
                >
                    <Header
                        togglePanel={this.toggleLocalPanel}
                        collapsible={collapsible}
                        collapsed={collapsed}
                        panelStatus={panelStatus}
                        model={model}
                    />

                    <Panel.Body collapsible={collapsible}>
                        <AdvancedSettings
                            title={"Advanced Settings"}
                            model={model}
                            saveAdvancedProperties={this.saveAdvancedProperties}
                        />
                        <Form>
                            <BasicPropertiesFields
                                model={model}
                                onInputChange={this.onInputChange}
                            />
                            <AllowableActions
                                model={model}
                                onCheckBoxChange={this.onCheckBoxChange}
                            />

                        </Form>
                    </Panel.Body>

                    {false &&
                        <div>
                            <Alert bsStyle={"danger"}> Contains errors or is missing required values. </Alert>
                        </div>
                    }
                </Panel>
            </>
        );
    }
}
