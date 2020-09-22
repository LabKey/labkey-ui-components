import React from 'react';

import { Col, Form, Row } from 'react-bootstrap';

import { Utils } from '@labkey/api';

import produce from 'immer';

import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';

import { HelpTopicURL } from '../HelpTopicURL';

import { DEFINE_ISSUES_LIST_TOPIC } from '../../../../util/helpLinks';

import { AssignmentOptions, BasicPropertiesFields } from './IssuesListDefPropertiesPanelFormElements';
import { IssuesListDefModel } from './models';

const PROPERTIES_HEADER_ID = 'issues-properties-hdr';

interface OwnProps {
    model: IssuesListDefModel;
    onChange: (model: IssuesListDefModel) => void;
    successBsStyle?: string;
}

type Props = OwnProps & BasePropertiesPanelProps;

interface State {
    isValid: boolean;
}

export class IssuesListDefPropertiesPanelImpl extends React.PureComponent<
    Props & InjectedDomainPropertiesPanelCollapseProps,
    State
> {
    constructor(props: Props & InjectedDomainPropertiesPanelCollapseProps) {
        super(props);

        this.state = produce(
            {
                isValid: true,
            },
            () => {}
        );
    }

    updateValidStatus = (newModel?: IssuesListDefModel) => {
        const { model, onChange } = this.props;
        const updatedModel = newModel || model;
        const isValid = updatedModel && updatedModel.hasValidProperties();
        this.setState(
            () => ({ isValid }),
            () => {
                if (newModel) {
                    onChange(updatedModel);
                }
            }
        );
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

    onChange = (identifier: string, value: any, clearingField?: string): void => {
        const { model } = this.props;
        const newModel = produce(model, (draft: IssuesListDefModel) => {
            draft[identifier] = value;
            if (clearingField) {
                draft[clearingField] = undefined;
            }
        });
        this.updateValidStatus(newModel);
    };

    onSelectChange = (name, value) => {
        if (name === 'assignedToGroup') {
            this.onChange(name, value, 'assignedToUser');
        } else {
            this.onChange(name, value);
        }
    };

    render() {
        const { model } = this.props;
        const { isValid } = this.state;
        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                title="Issues List Properties"
                titlePrefix={model.issueDefName}
                updateValidStatus={this.updateValidStatus}
                isValid={isValid}
            >
                <Row className="margin-bottom">
                    <Col xs={12}>
                        <HelpTopicURL helpTopic={DEFINE_ISSUES_LIST_TOPIC} nounPlural="issues lists" />
                    </Col>
                </Row>
                <Form>
                    <BasicPropertiesFields
                        model={model}
                        onInputChange={this.onInputChange}
                        onSelect={this.onSelectChange}
                    />
                    <AssignmentOptions model={model} onSelect={this.onSelectChange} />
                </Form>
            </BasePropertiesPanel>
        );
    }
}

export const IssuesListDefPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(IssuesListDefPropertiesPanelImpl);
