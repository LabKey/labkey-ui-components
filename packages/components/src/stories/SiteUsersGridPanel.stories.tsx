/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0: http://www.apache.org/licenses/LICENSE-2.0
 */
import React from 'react';
import { storiesOf } from '@storybook/react';
import { withKnobs } from '@storybook/addon-knobs';
import { List, Map } from 'immutable';
import { Security } from '@labkey/api';

import { SecurityPolicy, SecurityRole, SiteUsersGridPanel } from '..';
import { getRolesByUniqueName, processGetRolesResponse } from '../internal/components/permissions/actions';

import policyJSON from '../test/data/security-getPolicy.json';
import { SECURITY_ROLE_AUTHOR, SECURITY_ROLE_EDITOR, SECURITY_ROLE_READER } from '../test/data/constants';

const ROLE_OPTIONS = [
    { id: SECURITY_ROLE_READER, label: 'Reader (default)' },
    { id: SECURITY_ROLE_AUTHOR, label: 'Author' },
    { id: SECURITY_ROLE_EDITOR, label: 'Editor' },
];

interface Props {
    allowDelete: boolean;
    allowResetPassword: boolean;
    showRoleOptions: boolean;
}

interface State {
    policy: SecurityPolicy;
    roles: List<SecurityRole>;
    rolesByUniqueName: Map<string, SecurityRole>;
}

class SiteUsersGridPanelWrapper extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            policy: SecurityPolicy.create(policyJSON),
            roles: undefined,
            rolesByUniqueName: undefined,
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
    }

    render() {
        return (
            <SiteUsersGridPanel
                {...this.state}
                onCreateComplete={(response, role) => console.log(response, role)}
                onUsersStateChangeComplete={response => console.log(response)}
                newUserRoleOptions={this.props.showRoleOptions ? ROLE_OPTIONS : undefined}
                allowDelete={this.props.allowDelete}
                allowResetPassword={this.props.allowResetPassword}
            />
        );
    }
}

storiesOf('SiteUsersGridPanel', module)
    .addDecorator(withKnobs)
    .add('default props', () => {
        return <SiteUsersGridPanelWrapper allowDelete={true} allowResetPassword={true} showRoleOptions={false} />;
    })
    .add('without delete or reset password', () => {
        return <SiteUsersGridPanelWrapper allowDelete={false} allowResetPassword={false} showRoleOptions={false} />;
    })
    .add('with role options on create', () => {
        return <SiteUsersGridPanelWrapper allowDelete={true} allowResetPassword={true} showRoleOptions={true} />;
    });
