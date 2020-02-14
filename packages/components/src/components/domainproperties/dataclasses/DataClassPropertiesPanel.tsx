import React from 'react';
import { Col, Panel, Row } from 'react-bootstrap';
import { EntityDetailsForm } from "../entities/EntityDetailsForm";
import { LabelOverlay } from "../../forms/LabelOverlay";
import { QuerySelect } from "../../forms/QuerySelect";
import { SCHEMAS } from "../../base/models/schemas";
import { Alert } from "../../base/Alert";
import { DEFINE_DATA_CLASS_TOPIC } from "../../../util/helpLinks";
import { DomainPanelStatus } from "../models";
import { updateDomainPanelClassList } from "../actions";
import { CollapsiblePanelHeader } from "../CollapsiblePanelHeader";
import { ENTITY_FORM_ID_PREFIX } from "../entities/constants";
import { getFormNameFromId } from "../entities/actions";
import { DataClassModel } from "./models";
import { HelpTopicURL } from "../HelpTopicURL";

const ERROR_MSG = 'Contains errors or is missing required values.';

const FORM_IDS = {
    MATERIAL_SOURCE_ID: ENTITY_FORM_ID_PREFIX + 'materialSourceId'
};

interface Props {
    noun?: string
    nameExpressionInfoUrl?: string
    nameExpressionPlaceholder?: string
    headerText?: string

    model: DataClassModel
    onChange: (model: DataClassModel) => any
    appPropertiesOnly?: boolean
    initCollapsed?: boolean
    collapsible?: boolean
    controlledCollapse?: boolean
    validate?: boolean
    useTheme?: boolean
    panelStatus?: DomainPanelStatus
    helpTopic?: string
    onToggle?: (collapsed: boolean, callback: () => any) => any
}

interface State {
    collapsed: boolean
    isValid: boolean
}

export class DataClassPropertiesPanel extends React.Component<Props, State> {

    static defaultProps = {
        noun: 'Data Class',
        appPropertiesOnly: false,
        initCollapsed: false,
        validate: false,
        helpTopic: DEFINE_DATA_CLASS_TOPIC
        // nameExpressionPlaceholder: 'S-\${now:date}-\${dailySampleCount}'
    };

    constructor(props) {
        super(props);

        this.state = {
            collapsed: props.initCollapsed,
            isValid: true
        };
    }

    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        const { controlledCollapse, initCollapsed, validate, model, onChange } = this.props;

        // if controlled collapse, allow the prop change to update the collapsed state
        if (controlledCollapse && nextProps.initCollapsed !== initCollapsed) {
            this.toggleLocalPanel(nextProps.initCollapsed);
        }

        if (nextProps.validate && validate !== nextProps.validate) {
            const valid = model.hasValidProperties();
            this.setState(() => ({isValid: (model && valid)}), () => {
                onChange(model);
            });
        }
    }

    componentDidMount(): void {
        updateDomainPanelClassList(this.props.useTheme, undefined, 'dataclass-properties-hdr');
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        updateDomainPanelClassList(prevProps.useTheme, undefined, 'dataclass-properties-hdr');
    }

    toggleLocalPanel = (collapsed?: boolean): void => {
        const { model } = this.props;

        this.setState((state) => ({
            collapsed: collapsed !== undefined ? collapsed : !state.collapsed,
            isValid: model && model.hasValidProperties()
        }));
    };

    togglePanel = (evt: any, collapsed?: boolean): void => {
        const { onToggle, collapsible, controlledCollapse } = this.props;

        if (collapsible || controlledCollapse) {
            if (onToggle) {
                onToggle((collapsed !== undefined ? collapsed : !this.state.collapsed), this.toggleLocalPanel);
            }
            else {
                this.toggleLocalPanel(collapsed)
            }
        }
    };

    getPanelClass = () => {
        const { collapsed } = this.state;
        const { useTheme } = this.props;

        let classes = 'domain-form-panel';

        if (!collapsed) {
            if (useTheme) {
                classes += ' lk-border-theme-light';
            }
            else {
                classes += ' domain-panel-no-theme';
            }
        }

        return classes;
    };

    getAlertClasses = () => {
        const { collapsed } = this.state;
        const { useTheme } = this.props;

        let classes = 'domain-bottom-alert panel-default';

        if (!collapsed) {
            if (useTheme) {
                classes += ' lk-border-theme-light';
            }
            else {
                classes += ' domain-bottom-alert-expanded';
            }
        }
        else {
            classes += ' panel-default';
        }

        if (!collapsed)
            classes += ' domain-bottom-alert-top';

        return classes;
    };

    onFormChange = (evt: any) => {
        const id = evt.target.id;
        const value = evt.target.value;
        this.onChange(id, value);
    };

    onChange = (id: string, value: any) => {
        const { model, onChange } = this.props;
        onChange(model.set(getFormNameFromId(id), value) as DataClassModel);
    };

    renderSampleSetSelect() {
        const { model, noun } = this.props;

        return (
            <Row>
                <Col xs={3}>
                    <LabelOverlay
                        label={'Sample Set'}
                        description={`The default Sample Set where new samples will be created for this ${noun.toLowerCase()}.`}
                        canMouseOverTooltip={true}
                    />
                </Col>
                <Col xs={9}>
                    <QuerySelect
                        componentId={FORM_IDS.MATERIAL_SOURCE_ID}
                        name={FORM_IDS.MATERIAL_SOURCE_ID}
                        schemaQuery={SCHEMAS.EXP_TABLES.SAMPLE_SETS}
                        formsy={false}
                        showLabel={false}
                        preLoad={true}
                        // fireQSChangeOnInit={true}
                        // loadOnChange={true}
                        // loadOnFocus={true}
                        onQSChange={this.onChange}
                        value={model.materialSourceId} // TODO this isn't loading with initial value selected in update case (at least not in storybook)
                    />
                </Col>
            </Row>
        )
    }

    render() {
        const { collapsible, controlledCollapse, panelStatus, model, useTheme, headerText, appPropertiesOnly, noun, nameExpressionInfoUrl, nameExpressionPlaceholder, helpTopic } = this.props;
        const { collapsed, isValid } = this.state;

        return (
            <>
                <Panel className={this.getPanelClass()} expanded={!collapsed} onToggle={function(){}}>
                    <CollapsiblePanelHeader
                        id={'dataclass-properties-hdr'}
                        title={noun + ' Properties'}
                        titlePrefix={model.name}
                        togglePanel={this.togglePanel}
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
                            <Col xs={9}>
                                {headerText && <div className={'entity-form--headerhelp'}>{headerText}</div>}
                            </Col>
                            <Col xs={3}>
                                {helpTopic && <HelpTopicURL helpTopic={helpTopic}/>}
                            </Col>
                        </Row>
                        <EntityDetailsForm
                            noun={noun}
                            onFormChange={this.onFormChange}
                            data={model}
                            nameExpressionInfoUrl={nameExpressionInfoUrl}
                            nameExpressionPlaceholder={nameExpressionPlaceholder}
                        />
                        {!appPropertiesOnly && this.renderSampleSetSelect()}
                    </Panel.Body>
                </Panel>
                {!isValid &&
                    <div onClick={this.togglePanel} className={this.getAlertClasses()}>
                        <Alert bsStyle="danger">{ERROR_MSG}</Alert>
                    </div>
                }
            </>
        )
    }
}
