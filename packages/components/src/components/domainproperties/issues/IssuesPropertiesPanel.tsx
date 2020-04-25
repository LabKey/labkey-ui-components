import React from 'react';

import { Form } from 'react-bootstrap';

import { Utils } from '@labkey/api';

import { List } from 'immutable';

import { DomainDesign } from '../models';

import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import {getCoreGroups, getCoreUsersInGroups} from '../../permissions/actions';
import { Principal } from '../../..';

import { AssignmentOptions, IssuesBasicPropertiesFields } from './IssuesPropertiesPanelFormElements';
import { IssuesModel } from './models';
import {UserGroup} from "../../permissions/models";

const PROPERTIES_HEADER_ID = 'issues-properties-hdr';

interface OwnProps {
    model: IssuesModel;
    onChange: (model: IssuesModel) => void;
    successBsStyle?: string;
}

type Props = OwnProps & BasePropertiesPanelProps;

interface State {
    isValid: boolean;
    coreGroups: List<Principal>;
    coreUsers: List<UserGroup>;
}

export class IssuesPropertiesPanelImpl extends React.PureComponent<
    Props & InjectedDomainPropertiesPanelCollapseProps,
    State
> {
    constructor(props: Props & InjectedDomainPropertiesPanelCollapseProps) {
        super(props);

        this.state = {
            isValid: true,
            coreGroups: List<Principal>(),
            coreUsers: List<UserGroup>()
        };
    }

    componentDidMount() {
        getCoreGroups().then((coreGroupsData: List<Principal>) => {
            this.setState(() => ({
                coreGroups: coreGroupsData,
            }));
        });

        getCoreUsersInGroups().then((coreUsersData: List<UserGroup>) => {
            this.setState(() => ({
                coreUsers: coreUsersData,
            }));
        });
    }

    updateValidStatus = (newModel?: IssuesModel) => {
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

    onChange = (identifier, value): void => {
        const { model } = this.props;

        // Name must be set on Domain as well
        let newDomain = model.domain;
        if (identifier == 'name') {
            newDomain = model.domain.merge({ name: value }) as DomainDesign;
        }

        const newModel = model.merge({
            [identifier]: value,
            domain: newDomain,
        }) as IssuesModel;

        this.updateValidStatus(newModel);
    };

    onSelectChange = principal => {
        this.onChange('assignedToGroup', principal.userId);
    };

    render() {
        const { model, successBsStyle } = this.props;
        const { isValid, coreGroups, coreUsers } = this.state;

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                title="Issues Properties"
                titlePrefix={model.name}
                updateValidStatus={this.updateValidStatus}
                isValid={isValid}
            >
                <Form>
                    <IssuesBasicPropertiesFields model={model} onInputChange={this.onInputChange} />
                    <AssignmentOptions
                        model={model}
                        coreGroups={coreGroups}
                        coreUsers={coreUsers}
                        onSelect={(selected: Principal) => this.onSelectChange(selected)}
                    />
                </Form>
            </BasePropertiesPanel>
        );
    }
}

export const IssuesPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(IssuesPropertiesPanelImpl);
