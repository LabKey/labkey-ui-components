/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { boolean, text, withKnobs } from '@storybook/addon-knobs';
import { List, Map } from 'immutable';
import { Security } from '@labkey/api';

import { PermissionAssignments } from '../internal/components/permissions/PermissionAssignments';
import { SecurityPolicy, SecurityRole, Principal } from '../internal/components/permissions/models';

import {
    getInactiveUsers,
    getPrincipals,
    getPrincipalsById,
    getRolesByUniqueName,
    processGetRolesResponse,
} from '../internal/components/permissions/actions';
import { JEST_SITE_ADMIN_USER_ID } from '../test/data/constants';
import policyJSON from '../test/data/security-getPolicy.json';
import './stories.scss';

interface Props {
    title?: string;
    showUsersOnly?: boolean;
    showFilteredRoles?: boolean;
    showDetailsPanel?: boolean;
}

interface State {
    policy: SecurityPolicy;
    roles: List<SecurityRole>;
    rolesByUniqueName: Map<string, SecurityRole>;
    principals: List<Principal>;
    principalsById: Map<number, Principal>;
    inactiveUsersById: Map<number, Principal>;
    error: string;
    message: string;
}

class PermissionAssignmentsWrapper extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            policy: SecurityPolicy.create(policyJSON),
            roles: undefined,
            rolesByUniqueName: undefined,
            principals: undefined,
            principalsById: undefined,
            inactiveUsersById: undefined,
            error: undefined,
            message: undefined,
        };
    }

    componentDidMount() {
        Security.getRoles({
            success: (response: any) => {
                const roles = processGetRolesResponse(response);
                const rolesByUniqueName = getRolesByUniqueName(roles);
                this.setState(() => ({ roles, rolesByUniqueName }));
            },
        });

        getPrincipals()
            .then((principals: List<Principal>) => {
                const principalsById = getPrincipalsById(principals);
                this.setState(state => ({
                    principals,
                    principalsById,
                    policy: SecurityPolicy.updateAssignmentsData(state.policy, principalsById),
                }));
            })
            .catch(response => {
                this.setState(() => ({ error: response.message }));
            });

        getInactiveUsers()
            .then((principals: List<Principal>) => {
                const inactiveUsersById = getPrincipalsById(principals);
                this.setState(state => ({
                    inactiveUsersById,
                    policy: SecurityPolicy.updateAssignmentsData(state.policy, inactiveUsersById),
                }));
            })
            .catch(response => {
                this.setState(() => ({ error: response.message }));
            });
    }

    onChange = (policy: SecurityPolicy) => {
        this.setState(() => ({ policy }));
    };

    render() {
        const { title, showUsersOnly, showFilteredRoles } = this.props;
        const rolesToShow = showFilteredRoles
            ? List<string>([
                  'org.labkey.api.security.roles.FolderAdminRole',
                  'org.labkey.api.security.roles.EditorRole',
                  'org.labkey.api.security.roles.ReaderRole',
              ])
            : undefined;

        return (
            <PermissionAssignments
                {...this.props}
                {...this.state}
                title={title && title.length > 0 ? title : undefined}
                typeToShow={showUsersOnly ? 'u' : undefined}
                rolesToShow={rolesToShow}
                containerId="BOGUS"
                disabledId={JEST_SITE_ADMIN_USER_ID}
                onChange={this.onChange}
                onSuccess={() => console.log('Success')}
            />
        );
    }
}

storiesOf('PermissionAssignments', module)
    .addDecorator(withKnobs)
    .add('with knobs', () => {
        return (
            <PermissionAssignmentsWrapper
                title={text('title', undefined)}
                showUsersOnly={boolean('showUsersOnly', false)}
                showFilteredRoles={boolean('showFilteredRoles', true)}
                showDetailsPanel={boolean('showDetailsPanel', true)}
            />
        );
    });
