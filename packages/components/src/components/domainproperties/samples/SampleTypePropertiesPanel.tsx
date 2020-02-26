import React from 'react';
import {SampleTypeModel} from './models';
import {EntityDetailsForm,} from "../entities/EntityDetailsForm";

//TODO move these to the local models file
import {IParentAlias, IParentOption,} from "../../entities/models";
import {DomainPanelStatus} from "../models";
import {DomainPropertiesPanelProvider} from "../DomainPropertiesPanelContext";
import {getFormNameFromId,} from "../entities/actions";
import {Col, Panel, Row} from "react-bootstrap";
import {AddEntityButton, generateId, helpLinkNode} from "../../..";
import {PARENT_ALIAS_HELPER_TEXT} from "../../../constants";
import {DERIVE_SAMPLES_ALIAS_TOPIC} from "../../../util/helpLinks";
import {SampleSetParentAliasRow} from "../../samples/SampleSetParentAliasRow";

//Splitting these out to clarify where they end-up
interface OwnProps {
    model: SampleTypeModel
    parentOptions: Array<IParentOption>
    updateModel: (newModel: SampleTypeModel) => void
    onParentAliasChange: (id:string, field: string, newValue: any) => void
    onAddParentAlias: (id:string, newAlias: IParentAlias ) => void
    onRemoveParentAlias: (id:string) => void
}

//Splitting these out to clarify where they end-up
interface EntityProps {
    noun: string
    nameExpressionInfoUrl: string
    nameExpressionPlaceholder: string
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

type Props = OwnProps & EntityProps & CollapsiblePanelProps;

interface State {
    isValid: boolean
}

export class SampleTypePropertiesPanel extends React.PureComponent<Props> {
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

class SampleTypePropertiesPanelImpl extends React.Component<Props,State> {
    static defaultProps: {
        noun: 'Sample Type',
        initCollapsed: false,
        validate: false,
        appPropertiesOnly: false,
    };

    constructor(props) {
        super(props);

        this.state = {
            isValid: true
        };
    }

    //Generates a temporary id for add/delete of the import aliases
    static generateAliasId() {
        return generateId("sampletype-parent-import-alias-");
    }

    onFormChange = (evt: any): void => {
        const {model, updateModel } = this.props;
        const id = evt.target.id;
        const value = evt.target.value;
        updateModel(model.set(getFormNameFromId(id), value) as SampleTypeModel);
    };

    parentAliasChanges = (id:string, field: string, newValue: any): void => {
        const {onParentAliasChange} = this.props;
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
        const {model, parentOptions} = this.props;
        const {parentAliases} = model;

        if (!parentAliases || !parentOptions)
            return [];

        return parentAliases.valueSeq().map((alias) =>
            <SampleSetParentAliasRow
                key={alias.id}
                id={alias.id}
                parentAlias={alias}
                parentOptions={parentOptions}
                onAliasChange={this.parentAliasChanges}
                onRemove={this.removeParentAlias}
            />
        );
    };

    removeParentAlias = (index: string): void => {
        let {onRemoveParentAlias} = this.props;
        onRemoveParentAlias(index);
    };

    render = () => {
        const {model, parentOptions, nameExpressionInfoUrl, nameExpressionPlaceholder, noun='Sample Type'} = this.props;

        return (
            <>
                <Panel>
                    <Panel.Body>
                        <div className={'entity-form--headerhelp'}>
                            Sample types help you organize samples in your lab and allows you to add properties
                            for easy tracking of data.
                        </div>
                        <EntityDetailsForm
                            noun={noun}
                            onFormChange={this.onFormChange}
                            data={model}
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
            </>
        )
    };
}
