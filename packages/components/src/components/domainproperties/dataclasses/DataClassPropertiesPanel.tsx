import React from 'react';
import { Col, Panel, Row } from 'react-bootstrap';
import { EntityDetailsForm } from "../entities/EntityDetailsForm";
import { LabelOverlay } from "../../forms/LabelOverlay";
import { QuerySelect } from "../../forms/QuerySelect";
import { SCHEMAS } from "../../base/models/schemas";
import { Alert } from "../../base/Alert";
import { DEFINE_DATA_CLASS_TOPIC } from "../../../util/helpLinks";
import { DomainPanelStatus } from "../models";
import { getDomainAlertClasses, getDomainPanelClass, updateDomainPanelClassList } from "../actions";
import { CollapsiblePanelHeader } from "../CollapsiblePanelHeader";
import { ENTITY_FORM_ID_PREFIX } from "../entities/constants";
import { getFormNameFromId } from "../entities/actions";
import { DataClassModel } from "./models";
import { HelpTopicURL } from "../HelpTopicURL";
import {
    DomainPropertiesPanelContext,
    DomainPropertiesPanelProvider,
    IDomainPropertiesPanelContext
} from "../DomainPropertiesPanelContext";

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
    isValid: boolean
}

export class DataClassPropertiesPanel extends React.PureComponent<Props> {
    render() {
        const { controlledCollapse, collapsible, initCollapsed, onToggle } = this.props;

        return (
            <DomainPropertiesPanelProvider
                controlledCollapse={controlledCollapse}
                collapsible={collapsible}
                initCollapsed={initCollapsed}
                onToggle={onToggle}
            >
                <DataClassPropertiesPanelImpl {...this.props} />
            </DomainPropertiesPanelProvider>
        )
    }
}

class DataClassPropertiesPanelImpl extends React.Component<Props, State> {

    static defaultProps = {
        noun: 'Data Class',
        appPropertiesOnly: false,
        initCollapsed: false,
        validate: false,
        helpTopic: DEFINE_DATA_CLASS_TOPIC
    };

    constructor(props) {
        super(props);

        this.state = {
            isValid: true
        };
    }

    componentWillReceiveProps(nextProps: Readonly<Props>, nextContext: any): void {
        const { validate } = this.props;
        if (nextProps.validate && validate !== nextProps.validate) {
            this.setIsValid();
        }
    }

    componentDidMount(): void {
        updateDomainPanelClassList(this.props.useTheme, undefined, 'dataclass-properties-hdr');
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        updateDomainPanelClassList(prevProps.useTheme, undefined, 'dataclass-properties-hdr');
    }

    setIsValid() {
        const { model, onChange } = this.props;
        const isValid = model && model.hasValidProperties();
        this.setState(() => ({isValid}), () => onChange(model));
    }

    toggleLocalPanel = (evt: any, context: IDomainPropertiesPanelContext): void => {
        this.setIsValid();
        context.togglePanel(evt, !context.collapsed);
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
                        // fireQSChangeOnInit={true} // TODO remove these props with final implementation if they are not needed
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
        const { isValid } = this.state;

        return (
            <DomainPropertiesPanelContext.Consumer>
                {(context) =>
                    <>
                        <Panel className={getDomainPanelClass(context.collapsed, true, useTheme)} expanded={!context.collapsed} onToggle={function(){}}>
                            <CollapsiblePanelHeader
                                id={'dataclass-properties-hdr'}
                                title={noun + ' Properties'}
                                titlePrefix={model.name}
                                togglePanel={(evt: any) => this.toggleLocalPanel(evt, context)}
                                collapsed={context.collapsed}
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
                            <div
                                onClick={(evt: any) => this.toggleLocalPanel(evt, context)}
                                className={getDomainAlertClasses(context.collapsed, true, useTheme)}
                            >
                                <Alert bsStyle="danger">{ERROR_MSG}</Alert>
                            </div>
                        }
                    </>
                }
            </DomainPropertiesPanelContext.Consumer>
        )
    }
}
