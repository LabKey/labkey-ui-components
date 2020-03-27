import React from 'react';
import {SampleTypeModel} from './models';
import {EntityDetailsForm,} from "../entities/EntityDetailsForm";
import {IParentOption} from "../../entities/models";
import {IParentAlias} from "./models";
import {getFormNameFromId,} from "../entities/actions";
import {Col, Row} from "react-bootstrap";
import {AddEntityButton, generateId, helpLinkNode} from "../../..";
import { PARENT_ALIAS_HELPER_TEXT, SAMPLE_SET_DISPLAY_TEXT } from "../../../constants";
import { DERIVE_SAMPLES_ALIAS_TOPIC, DEFINE_SAMPLE_TYPE_TOPIC } from "../../../util/helpLinks";
import {SampleSetParentAliasRow} from "../../samples/SampleSetParentAliasRow";
import { InjectedDomainPropertiesPanelCollapseProps, withDomainPropertiesPanelCollapse } from "../DomainPropertiesPanelCollapse";
import { BasePropertiesPanel, BasePropertiesPanelProps } from "../BasePropertiesPanel";
import { HelpTopicURL } from "../HelpTopicURL";

const PROPERTIES_HEADER_ID = 'sample-type-properties-hdr';

//Splitting these out to clarify where they end-up
interface OwnProps {
    model: SampleTypeModel
    parentOptions: Array<IParentOption>
    updateModel: (newModel: SampleTypeModel) => void
    onParentAliasChange: (id:string, field: string, newValue: any) => void
    onAddParentAlias: (id:string, newAlias: IParentAlias ) => void
    onRemoveParentAlias: (id:string) => void
    updateDupeParentAliases?: (id:string) => void
    appPropertiesOnly?: boolean
    headerText?: string
    helpTopic?: string
}

//Splitting these out to clarify where they end-up
interface EntityProps {
    nameExpressionInfoUrl?: string
    nameExpressionPlaceholder?: string
    nounSingular?: string
    nounPlural?: string
}

interface State {
    isValid: boolean
}

type Props = OwnProps & EntityProps & BasePropertiesPanelProps;


class SampleTypePropertiesPanelImpl extends React.PureComponent<Props & InjectedDomainPropertiesPanelCollapseProps, State> {

    static defaultProps = {
        nounSingular: SAMPLE_SET_DISPLAY_TEXT,
        nounPlural: SAMPLE_SET_DISPLAY_TEXT + 's',
        nameExpressionInfoUrl: '',
        nameExpressionPlaceholder: 'S-\${now:date}-\${dailySampleCount}',
        appPropertiesOnly: false,
        helpTopic: DEFINE_SAMPLE_TYPE_TOPIC
    };

    constructor(props) {
        super(props);

        this.state = {
            isValid: true
        };
    }

    updateValidStatus = (newModel?: SampleTypeModel) => {
        const { model, updateModel } = this.props;
        const updatedModel = newModel || model;
        const isValid = updatedModel && updatedModel.hasValidProperties();
        this.setState(() => ({isValid}),
            () => {
                // Issue 39918: only consider the model changed if there is a newModel param
                if (newModel) {
                    updateModel(updatedModel)
                }
            });
    };

    onFormChange = (evt: any): void => {
        const {model } = this.props;
        const id = evt.target.id;
        const value = evt.target.value;
        const newModel = model.set(getFormNameFromId(id), value) as SampleTypeModel;
        this.updateValidStatus(newModel);
    };

    parentAliasChanges = (id:string, field: string, newValue: any): void => {
        const {onParentAliasChange,} = this.props;
        onParentAliasChange(id, field, newValue);
    };

    addParentAlias = (): void => {
        const {onAddParentAlias} = this.props;

        //Generates a temporary id for add/delete of the import aliases
        const newId = generateId("sampletype-parent-import-alias-");

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
                    <p>{PARENT_ALIAS_HELPER_TEXT}</p>
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
        const {onRemoveParentAlias} = this.props;
        onRemoveParentAlias(index);
        this.updateValidStatus();
    };

    render = () => {
        const { model, parentOptions, nameExpressionInfoUrl, nameExpressionPlaceholder, nounSingular, nounPlural, headerText, helpTopic } = this.props;
        const { isValid } = this.state;

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                title={'Sample Type Properties'}
                titlePrefix={model.name}
                updateValidStatus={this.updateValidStatus}
                isValid={isValid}
            >
                <Row className={'margin-bottom'}>
                    {headerText &&
                        <Col xs={9}>
                            <div className={'entity-form--headerhelp'}>{headerText}</div>
                        </Col>
                    }
                    <Col xs={headerText ? 3 : 12}>
                        <HelpTopicURL helpTopic={helpTopic} nounPlural={nounPlural}/>
                    </Col>
                </Row>
                <EntityDetailsForm
                    noun={nounSingular}
                    onFormChange={this.onFormChange}
                    data={model}
                    nameReadOnly={model.nameReadOnly}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                />
                {this.renderParentAliases()}
                {parentOptions &&
                    <Row>
                        <Col xs={2}>
                        </Col>
                        <Col xs={10}>
                                <span>
                                    <AddEntityButton
                                        entity="Parent Alias"
                                        onClick={this.addParentAlias}
                                        helperBody={this.renderAddEntityHelper}
                                    />
                                </span>
                        </Col>
                    </Row>
                }
            </BasePropertiesPanel>
        )
    }
}

export const SampleTypePropertiesPanel = withDomainPropertiesPanelCollapse<Props>(SampleTypePropertiesPanelImpl);
