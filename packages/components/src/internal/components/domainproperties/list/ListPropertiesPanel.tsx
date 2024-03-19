import React from 'react';
import { Utils } from '@labkey/api';

import { DomainDesign } from '../models';

import { DEFINE_LIST_TOPIC } from '../../../util/helpLinks';
import { HelpTopicURL } from '../HelpTopicURL';

import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';

import { AdvancedSettingsForm, ListModel } from './models';
import { AdvancedSettings } from './ListPropertiesAdvancedSettings';
import { AllowableActions, BasicPropertiesFields } from './ListPropertiesPanelFormElements';

const PROPERTIES_HEADER_ID = 'list-properties-hdr';

interface OwnProps {
    model: ListModel;
    onChange: (model: ListModel) => void;
}

type Props = OwnProps & BasePropertiesPanelProps;

interface State {
    isValid: boolean;
}

// Note: exporting this class for jest test case
export class ListPropertiesPanelImpl extends React.PureComponent<
    Props & InjectedDomainPropertiesPanelCollapseProps,
    State
> {
    constructor(props: Props & InjectedDomainPropertiesPanelCollapseProps) {
        super(props);

        this.state = {
            isValid: true,
        };
    }

    updateValidStatus = (newModel?: ListModel) => {
        const { model, onChange } = this.props;
        const updatedModel = newModel || model;
        const isValid = updatedModel && updatedModel.hasValidProperties();
        this.setState(
            () => ({ isValid }),
            () => {
                // Issue 39918: only consider the model changed if there is a newModel param
                if (newModel) {
                    onChange(updatedModel);
                }
            }
        );
    };

    onChange = (name, value): void => {
        const { model } = this.props;

        // Name must be set on Domain as well
        let newDomain = model.domain;
        if (name === 'name') {
            newDomain = model.domain.merge({ name: value }) as DomainDesign;
        }

        const newModel = model.merge({
            [name]: value,
            domain: newDomain,
        }) as ListModel;

        this.updateValidStatus(newModel);
    };

    onInputChange = (e): void => {
        const id = e.target.id;
        let value = e.target.value;

        // special case for empty string, set as null instead
        if (Utils.isString(value) && value.length === 0) {
            value = null;
        }

        this.onChange(id, value);
    };

    applyAdvancedProperties = (advancedSettingsForm: AdvancedSettingsForm) => {
        const { model } = this.props;
        const newModel = model.merge(advancedSettingsForm) as ListModel;
        this.updateValidStatus(newModel);
    };

    render() {
        const { model } = this.props;
        const { isValid } = this.state;

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                title="List Properties"
                titlePrefix={model.name}
                updateValidStatus={this.updateValidStatus}
                isValid={isValid}
            >
                <div className="row margin-bottom">
                    <div className="col-xs-12">
                        <HelpTopicURL helpTopic={DEFINE_LIST_TOPIC} nounPlural="lists" />
                    </div>
                </div>
                <form>
                    <BasicPropertiesFields model={model} onInputChange={this.onInputChange} />
                    <AllowableActions model={model} onChange={this.onChange} />
                    <AdvancedSettings
                        title="Advanced Settings"
                        model={model}
                        applyAdvancedProperties={this.applyAdvancedProperties}
                    />
                </form>
            </BasePropertiesPanel>
        );
    }
}

export const ListPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(ListPropertiesPanelImpl);
