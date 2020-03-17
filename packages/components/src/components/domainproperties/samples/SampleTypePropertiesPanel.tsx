import React from 'react';
import {SampleTypeModel} from './models';
import {EntityDetailsForm,} from "../entities/EntityDetailsForm";

import {IParentOption} from "../../entities/models";
import {IParentAlias} from "./models";
import {DomainPanelStatus} from "../models";
import {DomainPropertiesPanelContext, DomainPropertiesPanelProvider} from "../DomainPropertiesPanelContext";
import {getFormNameFromId,} from "../entities/actions";
import {Col, Panel, Row} from "react-bootstrap";
import {AddEntityButton, Alert, generateId, helpLinkNode} from "../../..";
import {PARENT_ALIAS_HELPER_TEXT} from "../../../constants";
import {DERIVE_SAMPLES_ALIAS_TOPIC} from "../../../util/helpLinks";
import {SampleSetParentAliasRow} from "../../samples/SampleSetParentAliasRow";
import {CollapsiblePanelHeader} from "../CollapsiblePanelHeader";
import {getDomainAlertClasses, getDomainPanelClass, updateDomainPanelClassList,} from "../actions";

const PROPERTIES_HEADER_ID = 'sample-type-properties-hdr';
const ERROR_MSG = 'Contains errors or is missing required values.';

//Splitting these out to clarify where they end-up
interface OwnProps {
    model: SampleTypeModel
    parentOptions: Array<IParentOption>
    updateModel: (newModel: SampleTypeModel) => void
    onParentAliasChange: (id:string, field: string, newValue: any) => void
    onAddParentAlias: (id:string, newAlias: IParentAlias ) => void
    onRemoveParentAlias: (id:string) => void
    updateDupeParentAliases?: (id:string) => void
}

//Splitting these out to clarify where they end-up
interface EntityProps {
    noun?: string
    nameExpressionInfoUrl?: string
    nameExpressionPlaceholder?: string
}

//Splitting these out to clarify where they end-up
interface CollapsiblePanelProps {
    initCollapsed?: boolean
    collapsible?: boolean
    controlledCollapse?: boolean
    appPropertiesOnly?: boolean
    validate?: boolean
    useTheme?: boolean
    panelStatus?: DomainPanelStatus
    helpTopic?: string
    onToggle?: (collapsed:boolean, callback: () => any) => any
}

interface State {
    isValid: boolean
}

type Props = OwnProps & EntityProps & CollapsiblePanelProps;

export class SampleTypePropertiesPanel extends React.PureComponent<Props, State> {
    render() {
        const {controlledCollapse, collapsible, initCollapsed, onToggle} = this.props;

        return (
            <DomainPropertiesPanelProvider
                controlledCollapse={controlledCollapse}
                collapsible={collapsible}
                initCollapsed={initCollapsed}
                onToggle={onToggle}
            >
                <SampleTypePropertiesPanelImpl {...this.props} />
            </DomainPropertiesPanelProvider>
        );
    }
}

class SampleTypePropertiesPanelImpl extends React.Component<Props, State> {
    static defaultProps = {
        noun: 'Sample Type',
        nameExpressionInfoUrl: '',
        nameExpressionPlaceholder: 'S-\${now:date}-\${dailySampleCount}',
        initCollapsed: false,
        validate: false,
        appPropertiesOnly: false,
    };

    constructor(props) {
        super(props);

        this.state = {
            isValid: true,
        };
    }

    componentDidMount(): void {
        updateDomainPanelClassList(this.props.useTheme, undefined, PROPERTIES_HEADER_ID);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        updateDomainPanelClassList(prevProps.useTheme, undefined, PROPERTIES_HEADER_ID);
    }

    //Generates a temporary id for add/delete of the import aliases
    static generateAliasId() {
        return generateId("sampletype-parent-import-alias-");
    }

    //#################### Header methods --- TODO migrate these to HOC?
    static contextType = DomainPropertiesPanelContext;
    context!: React.ContextType<typeof DomainPropertiesPanelContext>;
    setIsValid(): void {
        const { model } = this.props;
        const isValid = model && model.hasValidProperties();
        this.setState(() => ({isValid}));
    }

    toggleLocalPanel = (evt: any): void => {
        const { togglePanel, collapsed } = this.context;
        this.setIsValid();
        togglePanel(evt, !collapsed);
    };

    //#################### END Header methods

    onFormChange = (evt: any): void => {
        const {model, updateModel } = this.props;
        const id = evt.target.id;
        const value = evt.target.value;
        updateModel(model.set(getFormNameFromId(id), value) as SampleTypeModel);
    };

    parentAliasChanges = (id:string, field: string, newValue: any): void => {
        const {onParentAliasChange,} = this.props;
        onParentAliasChange(id, field, newValue);
    };

    addParentAlias = (): void => {
        const {onAddParentAlias} = this.props;

        const newId = SampleTypePropertiesPanelImpl.generateAliasId();
        const newParentAlias = {
            id: newId,
            alias:'',
            parentValue: undefined,
            ignoreAliasError: true,
            ignoreSelectError: true,
            isDupe: false,
        };

        onAddParentAlias(newId, newParentAlias);
    };

    renderAddEntityHelper = ():any => {
        return (
            <>
                <span>
                    {PARENT_ALIAS_HELPER_TEXT}
                    <p>{helpLinkNode(DERIVE_SAMPLES_ALIAS_TOPIC, "More info")}</p>
                </span>
            </>
        );
    };

    renderParentAliases = () => {
        const {model, parentOptions, updateDupeParentAliases} = this.props;
        const {parentAliases} = model;

        if (!parentAliases || !parentOptions)
            return [];

        return parentAliases.valueSeq().map((alias:IParentAlias) => {
            return (
                <SampleSetParentAliasRow
                    key={alias.id}
                    id={alias.id}
                    parentAlias={alias}
                    parentOptions={parentOptions}
                    onAliasChange={this.parentAliasChanges}
                    onRemove={this.removeParentAlias}
                    updateDupeParentAliases={updateDupeParentAliases}
                />
            );
        });
    };

    removeParentAlias = (index: string): void => {
        let {onRemoveParentAlias} = this.props;
        onRemoveParentAlias(index);
        this.setIsValid();
    };

    render = () => {
        const {model, parentOptions, nameExpressionInfoUrl, nameExpressionPlaceholder, noun, collapsible, controlledCollapse, panelStatus, useTheme} = this.props;
        const {isValid} = this.state;
        const {collapsed} = this.context;

        return (
            <>
                <Panel
                    className={getDomainPanelClass(collapsed, controlledCollapse, useTheme)}
                    expanded={!collapsed}
                    onToggle={function () {}}
                >
                    <CollapsiblePanelHeader
                        id={PROPERTIES_HEADER_ID}
                        title={'Properties'}
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
                        <div className={'entity-form--headerhelp'}>
                            Sample types help you organize samples in your lab and allow you to add properties
                            for easy tracking of data.
                        </div>
                        <EntityDetailsForm
                            noun={noun}
                            onFormChange={this.onFormChange}
                            data={model}
                            nameReadOnly={model.nameReadOnly}
                            nameExpressionInfoUrl={nameExpressionInfoUrl}
                            nameExpressionPlaceholder={nameExpressionPlaceholder}
                        />
                        {this.renderParentAliases()}
                        {parentOptions &&
                        <Row>
                            <Col xs={3}>
                            </Col>
                            <Col xs={9}>
                                    <span>
                                        <AddEntityButton entity="Parent Alias" onClick={this.addParentAlias}
                                                         helperBody={this.renderAddEntityHelper}/>
                                    </span>
                            </Col>
                        </Row>
                        }
                    </Panel.Body>
                </Panel>
                {!isValid &&
                <div
                        onClick={(evt: any) => this.toggleLocalPanel(evt)}
                        className={getDomainAlertClasses(collapsed, true, useTheme)}
                >
                    <Alert bsStyle="danger">{ERROR_MSG}</Alert>
                </div>
                }
            </>
        )
    };
}
