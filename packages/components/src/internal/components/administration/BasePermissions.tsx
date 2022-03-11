/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { ReactNode } from 'react';
import { MenuItem } from 'react-bootstrap';
import { Map } from 'immutable';

import { PermissionsProviderProps, SecurityPolicy } from '../permissions/models';
import { InjectedRouteLeaveProps, withRouteLeave } from '../../util/RouteLeave';
import { fetchContainerSecurityPolicy } from '../permissions/actions';
import { dismissNotifications } from '../notifications/global';
import { createNotification } from '../notifications/actions';
import { invalidateUsers } from '../../global';
import { CreatedModified } from '../base/CreatedModified';
import { ManageDropdownButton } from '../buttons/ManageDropdownButton';
import { ServerContextConsumer } from '../base/ServerContext';
import { AppURL } from '../../url/AppURL';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { PermissionsPageContextProvider } from '../permissions/PermissionsContextProvider';

import { PermissionsPanel } from './PermissionsPanel';

interface OwnProps {
    pageTitle: string;
    panelTitle: string;
    containerId: string;
    rolesMap: Map<string, string>;
    hasPermission: boolean;
    showDetailsPanel: boolean;
    disableRemoveSelf: boolean;
    description?: ReactNode;
}

type Props = PermissionsProviderProps & OwnProps & InjectedRouteLeaveProps;

interface State {
    policy: SecurityPolicy;
    loading: boolean;
    error: string;
}

class BasePermissionsImpl extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            policy: undefined,
            loading: true,
            error: undefined,
        };
    }

    componentDidMount(): void {
        this.loadSecurityPolicy();
    }

    loadSecurityPolicy() {
        this.props.setIsDirty(false);
        this.setState(() => ({ loading: true }));
        fetchContainerSecurityPolicy(this.props.containerId, this.props.principalsById, this.props.inactiveUsersById)
            .then(policy => {
                this.setState(() => ({ loading: false, policy }));
            })
            .catch(response => {
                console.error(response);
                this.setState(() => ({ loading: false, error: response.exception }));
            });
    }

    onChange = (policy: SecurityPolicy) => {
        this.props.setIsDirty(true);
        this.setState(() => ({ policy }));
    };

    onSuccess = () => {
        dismissNotifications();
        createNotification('Successfully updated roles and assignments.');

        this.loadSecurityPolicy();
        invalidateUsers();
    };

    renderButtons = () => {
        const row = this.state.policy ? { Modified: { value: this.state.policy.modified } } : {};

        return (
            <>
                <CreatedModified row={row} />
                <ManageDropdownButton id="admin-page-manage" pullRight={true} collapsed={true}>
                    <MenuItem href={AppURL.create('audit', 'groupauditevent').toHref()}>View Audit History</MenuItem>
                </ManageDropdownButton>
            </>
        );
    };

    render() {
        const { pageTitle, hasPermission, panelTitle, description, children } = this.props;

        return (
            <ServerContextConsumer>
                {context => {
                    const { user } = context;
                    return (
                        <BasePermissionsCheckPage
                            user={user}
                            title={pageTitle}
                            hasPermission={hasPermission}
                            renderButtons={this.renderButtons}
                            description={description}
                        >
                            <PermissionsPanel
                                {...this.props}
                                {...this.state}
                                title={panelTitle}
                                onChange={this.onChange}
                                onSuccess={this.onSuccess}
                            />
                            {children}
                        </BasePermissionsCheckPage>
                    );
                }}
            </ServerContextConsumer>
        );
    }
}

export const BasePermissions = withRouteLeave<OwnProps>(PermissionsPageContextProvider(BasePermissionsImpl));
