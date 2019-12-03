/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import * as React from 'react'
import { storiesOf } from '@storybook/react'
import { withKnobs, text, boolean } from '@storybook/addon-knobs'
import { List, Map } from 'immutable'
import { Security } from '@labkey/api'
import { PermissionAssignments, SecurityPolicy, SecurityRole } from "..";
import { Principal } from "../components/permissions/models";
import policyJSON from "../test/data/security-getPolicy.json";
import {
    getPrincipals,
    getPrincipalsById,
    getRolesByUniqueName,
    processGetRolesResponse
} from "../components/permissions/actions";
import './stories.scss'

interface Props {
    title?: string
    hideGroups?: boolean
    showFilteredRoles?: boolean
    showDetailsPanel?: boolean
}

interface State {
    policy: SecurityPolicy
    roles: List<SecurityRole>
    rolesByUniqueName: Map<string, SecurityRole>
    principals: List<Principal>
    principalsById: Map<number, Principal>
    error: string
    message: string
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
            error: undefined,
            message: undefined
        };
    }

    componentDidMount() {
        Security.getRoles({
            success: (response: any) => {
                const roles = processGetRolesResponse(response);
                const rolesByUniqueName = getRolesByUniqueName(roles);
                this.setState(() => ({roles, rolesByUniqueName}));
            }
        });

        getPrincipals()
            .then((principals: List<Principal>) => {
                const principalsById = getPrincipalsById(principals);
                this.setState((state) => ({
                    principals, principalsById,
                    policy: SecurityPolicy.updateAssignmentsData(state.policy, principalsById)
                }));
            }).catch((response) => {
            this.setState(() => ({error: response.message}));
        });
    }

    onChange = (policy: SecurityPolicy) => {
        this.setState(() => ({policy}));
    };

    render() {
        const { title, hideGroups, showFilteredRoles } = this.props;
        const rolesToShow = showFilteredRoles
            ? List<string>(['org.labkey.api.security.roles.FolderAdminRole', 'org.labkey.api.security.roles.EditorRole', 'org.labkey.api.security.roles.ReaderRole'])
            : undefined;

        return (
            <PermissionAssignments
                {...this.props}
                {...this.state}
                title={title && title.length > 0 ? title : undefined}
                typesToShow={hideGroups ? List<string>(['u']) : List<string>(['g', 'u'])}
                rolesToShow={rolesToShow}
                containerPath={'test'}
                onChange={this.onChange}
                onSuccess={() => console.log('Success')}
            />
        )
    }
}

storiesOf("PermissionAssignments", module)
    .addDecorator(withKnobs)
    .add("with knobs", () => {
        return (
            <PermissionAssignmentsWrapper
                title={text('title', undefined)}
                hideGroups={boolean('hideGroups', false)}
                showFilteredRoles={boolean('showFilteredRoles', true)}
                showDetailsPanel={boolean('showDetailsPanel', true)}
            />
        )
    });
