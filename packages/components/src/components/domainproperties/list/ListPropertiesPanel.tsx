import React from 'react';
import { Panel, Form, Row, Col } from 'react-bootstrap';
import { Utils } from '@labkey/api';

import { Alert } from '../../base/Alert';
import { DomainDesign, DomainPanelStatus } from "../models";
import { AllowableActions, BasicPropertiesFields } from "./ListPropertiesPanelFormElements";
import { AdvancedSettings } from "./ListPropertiesAdvancedSettings";
import { CollapsiblePanelHeader } from "../CollapsiblePanelHeader";
import { DomainPropertiesPanelContext, DomainPropertiesPanelProvider, IDomainPropertiesPanelContext } from "../DomainPropertiesPanelContext";
import { getDomainAlertClasses, getDomainPanelClass, updateDomainPanelClassList } from "../actions";
import { DEFINE_LIST_TOPIC } from "../../../util/helpLinks";
import { HelpTopicURL } from "../HelpTopicURL";
import { ListModel } from "./models";

const PROPERTIES_HEADER_ID = 'list-properties-hdr';
const ERROR_MSG = 'Contains errors or is missing required values.';

interface Props {
    model: ListModel;
    panelStatus: DomainPanelStatus;
    onChange: (model: ListModel) => void;
    controlledCollapse?: boolean;
    initCollapsed?: boolean;
    collapsible?: boolean;
    onToggle?: (collapsed: boolean, callback: () => any) => any;
    validate?: boolean;
    useTheme?: boolean;
}

interface State {
    isValid: boolean;
}

export class ListPropertiesPanel extends React.PureComponent<Props> {
    render() {
        const { collapsible, controlledCollapse, initCollapsed, onToggle } = this.props;

        return (
            <DomainPropertiesPanelProvider
                controlledCollapse={controlledCollapse}
                collapsible={collapsible}
                initCollapsed={initCollapsed}
                onToggle={onToggle}>
                <ListPropertiesPanelImpl {...this.props} />
            </DomainPropertiesPanelProvider>
        );
    }
}

class ListPropertiesPanelImpl extends React.PureComponent<Props, State> {
    static contextType = DomainPropertiesPanelContext;
    context!: React.ContextType<typeof DomainPropertiesPanelContext>;

    static defaultProps = {
        initCollapsed: false,
        validate: false,
    };

    constructor(props) {
        super(props);

        this.state = {
            isValid: true,
        };
    }

    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
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

    setIsValid(): void {
        const { model, onChange } = this.props;
        const isValid = model && model.hasValidProperties();
        this.setState(
            () => ({ isValid }),
            () => onChange(model)
        );
    }

    toggleLocalPanel = (evt: any): void => {
        const { togglePanel, collapsed } = this.context;
        this.setIsValid();
        togglePanel(evt, !collapsed);
    };

    onChange = (identifier, value): void => {
        const { model, onChange } = this.props;

        // Name must be set on Domain as well
        let newDomain = model.domain; // to reviewer: is this improper immutability?
        if (identifier == 'name') {
            newDomain = model.domain.merge({ name: value }) as DomainDesign;
        }

        const newModel = model.merge({
            [identifier]: value,
            domain: newDomain,
        }) as ListModel;

        onChange(newModel);
    };

    onCheckBoxChange = (name, checked): void => {
        const { model, onChange } = this.props;
        const newModel = model.merge({
            [name]: !checked,
        }) as ListModel;
        // console.log("onCheckBoxChange", newModel);
        onChange(newModel); // TODO this should call this.onChange and centralize the call to onChange(newModel) there
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

    onRadioChange = e => {
        const name = e.currentTarget.name;
        const value = e.target.value;
        this.onChange(name, value);
    };

    saveAdvancedProperties = advancedSettingsForm => {
        const { model, onChange } = this.props;

        const newModel = model.merge(advancedSettingsForm) as ListModel;
        onChange(newModel);
    };

    render() {
        const { panelStatus, collapsible, controlledCollapse, model, useTheme } = this.props;
        const { isValid } = this.state;
        const { collapsed } = this.context;

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
                        iconHelpMsg={ERROR_MSG}
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
                                saveAdvancedProperties={this.saveAdvancedProperties}
                            />
                        </Form>
                    </Panel.Body>

                    {!isValid &&
                        <div
                            onClick={(evt: any) => this.toggleLocalPanel(evt)}
                            className={getDomainAlertClasses(collapsed, true, useTheme)}
                        >
                            <Alert bsStyle="danger">{ERROR_MSG}</Alert>
                        </div>
                    }
                </Panel>
            </>
        )
    }
}
