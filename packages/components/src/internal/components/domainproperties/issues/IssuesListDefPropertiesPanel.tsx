import React from 'react';
import { Utils } from '@labkey/api';
import { produce } from 'immer';

import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';

import { HelpTopicURL } from '../HelpTopicURL';

import { DEFINE_ISSUES_LIST_TOPIC } from '../../../util/helpLinks';

import { isRestrictedIssueListSupported } from '../../../app/utils';

import {
    AssignmentOptions,
    BasicPropertiesFields,
    RestrictedOptions,
} from './IssuesListDefPropertiesPanelFormElements';
import { IssuesListDefModel } from './models';
import { getDefaultIssuesAPIWrapper, IssuesAPIWrapper } from './actions';

const PROPERTIES_HEADER_ID = 'issues-properties-hdr';

interface OwnProps {
    api?: IssuesAPIWrapper;
    model: IssuesListDefModel;
    onChange: (model: IssuesListDefModel) => void;
}

type Props = OwnProps & BasePropertiesPanelProps;

interface State {
    isValid: boolean;
}

export class IssuesListDefPropertiesPanelImpl extends React.PureComponent<
    Props & InjectedDomainPropertiesPanelCollapseProps,
    State
> {
    static defaultProps = {
        api: getDefaultIssuesAPIWrapper(),
    };

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

    onRestrictedListCheckChange = e => {
        const name = e.target.name;
        const value = e.target.checked;

        if (!value) {
            // clear out the group dropdown
            this.onChange(name, value, 'restrictedIssueListGroup');
        } else {
            this.onChange(name, value);
        }
    };

    render() {
        const { api, model } = this.props;
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
                <div className="row margin-bottom">
                    <div className="col-xs-12">
                        <HelpTopicURL helpTopic={DEFINE_ISSUES_LIST_TOPIC} nounPlural="issues lists" />
                    </div>
                </div>
                <form>
                    <div className="col-xs-12 col-md-6">
                        <div className="domain-field-padding-bottom">
                            <BasicPropertiesFields
                                model={model}
                                onInputChange={this.onInputChange}
                                onSelect={this.onSelectChange}
                            />
                        </div>
                        {isRestrictedIssueListSupported() && (
                            <div className="domain-field-padding-bottom">
                                <RestrictedOptions
                                    api={api}
                                    model={model}
                                    onCheckChange={this.onRestrictedListCheckChange}
                                    onSelect={this.onSelectChange}
                                />
                            </div>
                        )}
                    </div>
                    <AssignmentOptions api={api} model={model} onSelect={this.onSelectChange} />
                </form>
            </BasePropertiesPanel>
        );
    }
}

export const IssuesListDefPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(IssuesListDefPropertiesPanelImpl);
