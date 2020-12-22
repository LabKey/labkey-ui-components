import React, { PureComponent, ReactNode } from 'react';
import { Col, Row } from 'react-bootstrap';
import { Draft, produce } from 'immer';

import { EntityDetailsForm } from '../entities/EntityDetailsForm';
import { QuerySelect, SCHEMAS } from '../../../..';
import { DEFINE_DATA_CLASS_TOPIC, DATA_CLASS_NAME_EXPRESSION_TOPIC, getHelpLink } from '../../../util/helpLinks';
import { ENTITY_FORM_ID_PREFIX } from '../entities/constants';
import { getFormNameFromId } from '../entities/actions';

import { HelpTopicURL } from '../HelpTopicURL';
import { initQueryGridState } from '../../../global';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';
import { DomainFieldLabel } from '../DomainFieldLabel';

import { DataClassModel } from './models';

const PROPERTIES_HEADER_ID = 'dataclass-properties-hdr';
const FORM_IDS = {
    CATEGORY: ENTITY_FORM_ID_PREFIX + 'category',
    SAMPLE_TYPE_ID: ENTITY_FORM_ID_PREFIX + 'sampleSet',
};

interface OwnProps {
    model: DataClassModel;
    onChange: (model: DataClassModel) => any;
    appPropertiesOnly?: boolean;
    headerText?: string;
    helpTopic?: string;
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;
    nounSingular?: string;
    nounPlural?: string;
}

type Props = OwnProps & BasePropertiesPanelProps;

interface State {
    isValid: boolean;
}

// Note: exporting this class for jest test case
export class DataClassPropertiesPanelImpl extends PureComponent<
    Props & InjectedDomainPropertiesPanelCollapseProps,
    State
> {
    static defaultProps = {
        nounSingular: 'Data Class',
        nounPlural: 'Data Classes',
        helpTopic: DEFINE_DATA_CLASS_TOPIC,
        nameExpressionInfoUrl: getHelpLink(DATA_CLASS_NAME_EXPRESSION_TOPIC),
        nameExpressionPlaceholder: 'Enter a naming pattern (e.g., DC-${now:date}-${genId})',
        appPropertiesOnly: false,
    };

    constructor(props: Props & InjectedDomainPropertiesPanelCollapseProps) {
        super(props);
        initQueryGridState(); // needed for QuerySelect usage

        this.state = {
            isValid: true,
        };

        this.state = produce({ isValid: true }, () => {});
    }

    updateValidStatus = (newModel?: DataClassModel): void => {
        const { model, onChange } = this.props;
        const updatedModel = newModel || model;
        const isValid = updatedModel && updatedModel.hasValidProperties;
        this.setState(
            produce((draft: Draft<State>) => {
                draft.isValid = isValid;
            }),
            () => {
                // Issue 39918: only consider the model changed if there is a newModel param
                if (newModel) {
                    onChange(updatedModel);
                }
            }
        );
    };

    onFormChange = (evt: any): void => {
        const id = evt.target.id;
        const value = evt.target.value;
        this.onChange(id, value);
    };

    onChange = (id: string, value: any): void => {
        const { model } = this.props;
        const newModel = produce(model, (draft: Draft<DataClassModel>) => {
            draft[getFormNameFromId(id)] = value;
        });
        this.updateValidStatus(newModel);
    };

    renderSampleTypeSelect(): ReactNode {
        const { model, nounSingular } = this.props;

        return (
            <Row>
                <Col xs={2}>
                    <DomainFieldLabel
                        label="Sample Type"
                        helpTipBody={`The default Sample Type where new samples will be created for this ${nounSingular.toLowerCase()}.`}
                    />
                </Col>
                <Col xs={10}>
                    <QuerySelect
                        componentId={FORM_IDS.SAMPLE_TYPE_ID}
                        name={FORM_IDS.SAMPLE_TYPE_ID}
                        schemaQuery={SCHEMAS.EXP_TABLES.SAMPLE_SETS}
                        formsy={false}
                        showLabel={false}
                        preLoad={true}
                        loadOnChange={true}
                        onQSChange={this.onChange}
                        value={model.sampleSet}
                    />
                </Col>
            </Row>
        );
    }

    renderCategorySelect(): ReactNode {
        const { model } = this.props;

        return (
            <Row>
                <Col xs={2}>
                    <DomainFieldLabel label="Category" />
                </Col>
                <Col xs={10}>
                    <QuerySelect
                        componentId={FORM_IDS.CATEGORY}
                        name={FORM_IDS.CATEGORY}
                        schemaQuery={SCHEMAS.EXP_TABLES.DATA_CLASS_CATEGORY_TYPE}
                        displayColumn="Value"
                        valueColumn="Value"
                        formsy={false}
                        showLabel={false}
                        preLoad={true}
                        loadOnChange={true}
                        onQSChange={this.onChange}
                        value={model.category}
                    />
                </Col>
            </Row>
        );
    }

    render(): ReactNode {
        const {
            model,
            headerText,
            appPropertiesOnly,
            nounSingular,
            nounPlural,
            nameExpressionInfoUrl,
            nameExpressionPlaceholder,
            helpTopic,
        } = this.props;
        const { isValid } = this.state;

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                title={nounSingular + ' Properties'}
                titlePrefix={model.name}
                updateValidStatus={this.updateValidStatus}
                isValid={isValid}
            >
                <Row className="margin-bottom">
                    {headerText && (
                        <Col xs={9}>
                            <div className="entity-form--headerhelp">{headerText}</div>
                        </Col>
                    )}
                    <Col xs={headerText ? 3 : 12}>
                        <HelpTopicURL helpTopic={helpTopic} nounPlural={nounPlural} />
                    </Col>
                </Row>
                <EntityDetailsForm
                    noun={nounSingular}
                    onFormChange={this.onFormChange}
                    data={model.entityDataMap}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                />
                {!appPropertiesOnly && this.renderCategorySelect()}
                {!appPropertiesOnly && this.renderSampleTypeSelect()}
            </BasePropertiesPanel>
        );
    }
}

export const DataClassPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(DataClassPropertiesPanelImpl);
