import React from 'react';
import {SampleTypeModel} from './models';
import {EntityDetailsForm, EntityDetailsProps} from "../entities/EntityDetailsForm";

//TODO move these to the local models file
import {IParentAlias, IParentOption, ISampleSetDetails} from "../../samples/models";
import {DomainPanelStatus} from "../models";
import {DomainPropertiesPanelProvider} from "../DomainPropertiesPanelContext";
import {isExistingEntity} from "../entities/actions";
import {Col, Panel, Row} from "react-bootstrap";
import {AddEntityButton, generateId, helpLinkNode} from "../../..";
import {Map} from "immutable";
import {PARENT_ALIAS_HELPER_TEXT} from "../../../constants";
import {DERIVE_SAMPLES_ALIAS_TOPIC} from "../../../util/helpLinks";
import {SampleSetParentAliasRow} from "../../samples/SampleSetParentAliasRow";

interface OwnProps {
    model: SampleTypeModel
    parentOptions: Array<IParentOption>
    onChange: (model: SampleTypeModel) => void
}

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

type Props = OwnProps & EntityDetailsProps & CollapsiblePanelProps;

// interface State {
//     parentOptions: Array<IParentOption>
//     parentAliases: Map<string, IParentAlias>
//
//     error: React.ReactNode
//     submitting: boolean
//
// }

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

    init = (model: SampleTypeModel): void => {

    };

    componentDidMount = (): void => {
        const {model} = this.props;
        this.init(model);
    };

    //Generates a temporary id for add/delete of the import aliases
    static generateAliasId() {
        return generateId("sampletype-parent-import-alias-");
    }

    onFormChange = (evt: any): void => {
        const id = evt.target.id;
        const value = evt.target.value;
        this.onChange(id, value);
    };

    onChange = (id: string, value: any): void => {
        const {model, onChange } = this.props;
        onChange(model.set(getFormNameFromId(id), value) as SampleTypeModel);
    };

    parentAliasChanges = (id:string, field: string, newValue: any): void => {
        const {model} = this.props;
        let {parentAliases} = model;
        parentAliases.get(id)[field] = newValue;

        model.set()
        this.setState({parentAliases});
    };

    addParentAlias = (): void => {
        let {parentAliases} = this.state;
        parentAliases = parentAliases || Map<string, IParentAlias>();

        const newId = SampleTypePropertiesPanelImpl.generateAliasId();
        parentAliases = parentAliases.set(newId, {
            id: newId,
            alias:'',
            parentValue: undefined,
            ignoreAliasError: true,
            ignoreSelectError: true,
        });

        this.setState({parentAliases});
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
        const {parentAliases, parentOptions} = this.props;

        if (!parentAliases || !parentOptions)
            return [];

        return parentAliases.valueSeq().map((parentAlias) =>
            <SampleSetParentAliasRow
                key={parentAlias.id}
                id={parentAlias.id}
                parentAlias={parentAlias}
                parentOptions={parentOptions}
                onAliasChange={this.parentAliasChanges}
                onRemove={this.removeParentAlias}
            />
        );
    };

    removeParentAlias = (id: string): void => {
        let {model} = this.props;
        let {parentAliases} = model;
        if (parentAliases.size === 0)
            return;

        parentAliases = parentAliases.remove(id);
        this.setState((state) => ({
            formValues: {
                ...state.formValues,
            } as ISampleSetDetails,
            parentAliases,
        }));
    };

    render = () => {
        // const {  nameExpressionInfoUrl, nameExpressionPlaceholder, data, nameExpressionInfoUrl, nameExpressionPlaceholder } = this.props;
        const {model, parentOptions, nameExpressionInfoUrl, nameExpressionPlaceholder,} = this.props;
        // const { hasError, parentOptions, formValues } = this.state;
        const isUpdate = isExistingEntity(formValues, data.options);

        return (
            <>
                <Panel>
                    <Panel.Body>
                        <div className={'entity-form--headerhelp'}>
                            Sample types help you organize samples in your lab and allows you to add properties
                            for easy tracking of data.
                        </div>
                        <EntityDetailsForm
                            noun={'Sample Type'}
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
            // }
            // </DomainPropertiesPanelContext.Consumer>
        )
    };
}
