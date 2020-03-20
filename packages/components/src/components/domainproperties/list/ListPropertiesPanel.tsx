import React from 'react';
import { Panel, Form, Row, Col } from 'react-bootstrap';
import { Utils } from '@labkey/api';
import { Alert } from '../../base/Alert';
import { DomainDesign, DomainPanelStatus } from "../models";
import { AllowableActions, BasicPropertiesFields } from "./ListPropertiesPanelFormElements";
import { AdvancedSettings } from "./ListPropertiesAdvancedSettings";
import { CollapsiblePanelHeader } from "../CollapsiblePanelHeader";
import { getDomainAlertClasses, getDomainPanelClass, updateDomainPanelClassList } from "../actions";
import { DEFINE_LIST_TOPIC } from "../../../util/helpLinks";
import { HelpTopicURL } from "../HelpTopicURL";
import {AdvancedSettingsForm, ListModel} from "./models";
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse
} from "../DomainPropertiesPanelCollapse";
import { PROPERTIES_PANEL_ERROR_MSG } from "../constants";

const PROPERTIES_HEADER_ID = 'list-properties-hdr';

interface Props {
    model: ListModel;
    panelStatus: DomainPanelStatus;
    onChange: (model: ListModel) => void;
    validate?: boolean;
    useTheme?: boolean;
    successBsStyle?: string;
}

interface State {
    isValid: boolean;
}

//Note: exporting this class for jest test case
export class ListPropertiesPanelImpl extends React.PureComponent<Props & InjectedDomainPropertiesPanelCollapseProps, State> {

    static defaultProps = {
        validate: false,
    };

    constructor(props) {
        super(props);

        this.state = {
            isValid: true,
        };
    }

    componentWillReceiveProps(nextProps: Readonly<Props>): void {
        const { validate } = this.props;
        if (nextProps.validate && validate !== nextProps.validate) {
            this.setIsValid();
        }
    }

    componentDidMount(): void {
        updateDomainPanelClassList(this.props.useTheme, undefined, PROPERTIES_HEADER_ID);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        updateDomainPanelClassList(prevProps.useTheme, undefined, PROPERTIES_HEADER_ID);
    }

    setIsValid(newModel?: ListModel): void {
        const { model, onChange } = this.props;
        const updatedModel = newModel || model;
        const isValid = updatedModel && updatedModel.hasValidProperties();
        this.setState(() => ({isValid}),
            () => {
                // Issue 39918: only consider the model changed if there is a newModel param
                if (newModel) {
                    onChange(updatedModel)
                }
            });
    }

    toggleLocalPanel = (evt: any): void => {
        const { togglePanel, collapsed } = this.props;
        this.setIsValid();
        togglePanel(evt, !collapsed);
    };

    onChange = (identifier, value): void => {
        const { model } = this.props;

        // Name must be set on Domain as well
        let newDomain = model.domain;
        if (identifier == 'name') {
            newDomain = model.domain.merge({ name: value }) as DomainDesign;
        }

        const newModel = model.merge({
            [identifier]: value,
            domain: newDomain,
        }) as ListModel;

        this.setIsValid(newModel);
    };

    onCheckBoxChange = (name, checked): void => {
        this.onChange(name, !checked);
    };

    onInputChange = e => {
        const id = e.target.id;
        let value = e.target.value;

        // special case for empty string, set as null instead
        if (Utils.isString(value) && value.length === 0) {
            value = null;
        }

        this.onChange(id, value);
    };

    applyAdvancedProperties = (advancedSettingsForm: AdvancedSettingsForm) => {
        const { model } = this.props;
        const newModel = model.merge(advancedSettingsForm) as ListModel;
        this.setIsValid(newModel);
    };

    render() {
        const { collapsed, panelStatus, collapsible, controlledCollapse, model, useTheme, successBsStyle } = this.props;
        const { isValid } = this.state;

        return(
            <>
                <Panel
                    className={getDomainPanelClass(collapsed, true, useTheme)}
                    expanded={!collapsed}
                    onToggle={function(){}}
                >
                    <CollapsiblePanelHeader
                        id={PROPERTIES_HEADER_ID}
                        title={'List Properties'}
                        titlePrefix={model.name}
                        togglePanel={(evt: any) => this.toggleLocalPanel(evt)}
                        collapsed={collapsed}
                        collapsible={collapsible}
                        controlledCollapse={controlledCollapse}
                        panelStatus={panelStatus}
                        isValid={isValid}
                        iconHelpMsg={PROPERTIES_PANEL_ERROR_MSG}
                        useTheme={useTheme}
                    />

                    <Panel.Body collapsible={collapsible || controlledCollapse}>
                        <Row className={'margin-bottom'}>
                            <Col xs={12}>
                                <HelpTopicURL helpTopic={DEFINE_LIST_TOPIC} nounPlural={'lists'}/>
                            </Col>
                        </Row>
                        <Form>
                            <BasicPropertiesFields
                                model={model}
                                onInputChange={this.onInputChange}
                            />
                            <AllowableActions
                                model={model}
                                onCheckBoxChange={this.onCheckBoxChange}
                            />
                            <AdvancedSettings
                                title={"Advanced Settings"}
                                model={model}
                                applyAdvancedProperties={this.applyAdvancedProperties}
                                successBsStyle={successBsStyle}
                            />
                        </Form>
                    </Panel.Body>
                </Panel>

                {!isValid &&
                    <div
                        onClick={(evt: any) => this.toggleLocalPanel(evt)}
                        className={getDomainAlertClasses(collapsed, true, useTheme)}
                    >
                        <Alert bsStyle="danger">{PROPERTIES_PANEL_ERROR_MSG}</Alert>
                    </div>
                }
            </>
        )
    }
}

export const ListPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(ListPropertiesPanelImpl);
