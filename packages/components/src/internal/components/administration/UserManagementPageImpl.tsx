/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent } from 'react';
import { List } from 'immutable';
import { MenuItem } from 'react-bootstrap';
import { getServerContext, PermissionRoles, Utils } from '@labkey/api';

import { getUserGridFilterURL, updateSecurityPolicy } from './actions';

import {User} from "../base/models/User";
import {Container} from "../base/models/Container";
import {APPLICATION_SECURITY_ROLES, SITE_SECURITY_ROLES} from "../permissions/constants";
import {PermissionsProviderProps, SecurityPolicy} from "../permissions/models";
import {fetchContainerSecurityPolicy} from "../permissions/actions";
import {createNotification} from "../notifications/actions";
import {queryGridInvalidate} from "../../actions";
import {SCHEMAS} from "../../schemas";
import {invalidateUsers} from "../../global";
import {ManageDropdownButton} from "../buttons/ManageDropdownButton";
import {AppURL} from "../../url/AppURL";
import {BasePermissionsCheckPage} from "../permissions/BasePermissionsCheckPage";
import {UsersGridPanel} from "../user/UsersGridPanel";
import {isLoginAutoRedirectEnabled, showPremiumFeatures} from "./utils";

export function getNewUserRoles(user: User, container: Partial<Container>, project: any, extraRoles?: string[][]): Record<string, any>[] {
    const roles = [
        {id: PermissionRoles.Reader.toString(), label: APPLICATION_SECURITY_ROLES.get(PermissionRoles.Reader) + ' (default)'},
        {id: PermissionRoles.Editor.toString(), label: APPLICATION_SECURITY_ROLES.get(PermissionRoles.Editor)},
    ];
    if (showPremiumFeatures()) {
        roles.push({id: PermissionRoles.FolderAdmin.toString(), label: APPLICATION_SECURITY_ROLES.get(PermissionRoles.FolderAdmin)});
        if (container.parentId === project.rootId) {
            roles.push({id: PermissionRoles.ProjectAdmin.toString(), label: APPLICATION_SECURITY_ROLES.get(PermissionRoles.ProjectAdmin)});
        }
    }
    if (extraRoles) {
        extraRoles.forEach(role => {
            roles.push({id: role[0], label: role[1]});
        });
    }
    if (user.isAppAdmin()) {
        roles.push({id: PermissionRoles.ApplicationAdmin, label: SITE_SECURITY_ROLES.get(PermissionRoles.ApplicationAdmin)});
    }
    return roles;
}

interface StateProps {
    extraRoles?: string[][];
    user: User
}

type Props = StateProps & PermissionsProviderProps;

interface State {
    policy: SecurityPolicy
}

// exported for jest testing
export class UserManagementPageImpl extends PureComponent<Props, State> {

    constructor(props: Props) {
        super(props);

        this.state = {
            policy: undefined
        };
    }

    componentDidMount(): void {
        if (this.props.user.isAdmin) {
            this.loadSecurityPolicy();
        }
    }

    loadSecurityPolicy() {
        fetchContainerSecurityPolicy(getServerContext().container.id, this.props.principalsById)
            .then((policy) => {
                this.setState(() => ({policy: SecurityPolicy.updateAssignmentsData(policy, this.props.principalsById)}));
            })
            .catch((error) => {
                console.error(error);
                createNotification({
                    alertClass: 'danger',
                    message: 'Unable to load permissions information. ' + (error.exception ? error.exception : '')
                });
            });
    }

    onCreateComplete = (response: any, roleUniqueNames: string[]) => {
        this.invalidateGlobal();

        // split response to count new vs existing users separately
        let newUsers = List<number>(), existingUsers = List<number>();
        response.users.forEach((user) => {
            if (user.isNew) {
                newUsers = newUsers.push(user.userId);
            }
            else {
                existingUsers = existingUsers.push(user.userId);
            }
        });

        if (newUsers.size > 0) {
            if (roleUniqueNames?.length) {
                const promises = [];
                // application admin role applies to the Site root container, others apply to current project container
                if (roleUniqueNames.indexOf(PermissionRoles.ApplicationAdmin) >= 0) {
                    promises.push(updateSecurityPolicy(getServerContext().project.rootId, newUsers, [PermissionRoles.ApplicationAdmin]));
                }
                const nonAppAdmin = roleUniqueNames.filter(name => name !== PermissionRoles.ApplicationAdmin);
                if (nonAppAdmin.length) {
                    promises.push(updateSecurityPolicy(getServerContext().container.id, newUsers, nonAppAdmin))
                }
                Promise.all(promises)
                    .then(() => {
                        this.afterCreateComplete(newUsers, true);
                        this.loadSecurityPolicy();
                    })
                    .catch((error) => {
                        console.error(error);
                        createNotification({
                            alertClass: 'danger',
                            message: 'Unable to update permissions information. ' + (error.exception ? error.exception : '')
                        });

                        this.afterCreateComplete(newUsers, false);
                    });
            }
            else {
                this.afterCreateComplete(newUsers, false);
            }
        }

        if (existingUsers.size > 0) {
            createNotification({
                message: () => {
                    return (
                        <>
                            <span>
                                {Utils.pluralBasic(existingUsers.size, 'user')} already
                                existed and {(existingUsers.size > 1 ? 'were' : 'was')} not updated.
                            </span>
                            &nbsp;<a href={getUserGridFilterURL(existingUsers, 'all').addParam('usersView', 'all').toHref()}>view</a>
                        </>
                    )
                }
            });
        }
    };

    onUsersStateChangeComplete = (response: any) => {
        this.invalidateGlobal();

        if (response.resetPassword) {
            createNotification({
                message: () => {
                    return <span>Successfully reset password for <b>{response.email}</b>.</span>
                }
            });
            return;
        }

        const updatedUserIds = List<number>(response.userIds);
        const action = response.delete ? 'deleted' : (response.activate ? 'reactivated' : 'deactivated');
        const urlPrefix = response.activate ? 'active' : 'inactive';

        createNotification({
            message: () => {
                return (
                    <>
                        <span>
                            Successfully {action} {Utils.pluralBasic(updatedUserIds.size, 'user')}.&nbsp;
                        </span>
                        {!response.delete &&
                            <a href={getUserGridFilterURL(updatedUserIds, urlPrefix).addParam('usersView', urlPrefix).toHref()}>view</a>
                        }
                    </>
                )
            }
        });
    };

    afterCreateComplete(newUsers: List<number>, permissionsSet: boolean) {
        createNotification({
            message: () => {
                return (
                    <>
                        <span>
                            Successfully created {Utils.pluralBasic(newUsers.size, 'new user')}
                            {permissionsSet ? ' and assigned the selected role' : ''}.
                        </span>
                        &nbsp;<a href={getUserGridFilterURL(newUsers, 'active').addParam('usersView', 'active').toHref()}>view</a>
                    </>
                )
            }
        });
    }

    invalidateGlobal() {
        queryGridInvalidate(SCHEMAS.CORE_TABLES.USERS);
        invalidateUsers();
    }

    renderButtons = () => {
        return (
            <ManageDropdownButton id={'user-management-page-manage'} pullRight={true} collapsed={true}>
                <MenuItem href={AppURL.create('audit', 'userauditevent').toHref()}>View Audit History</MenuItem>
            </ManageDropdownButton>
        )
    };

    render() {
        const { user, extraRoles } = this.props;
        const { policy } = this.state;
        const { container, project } = getServerContext();

        // issue 39501: only allow permissions changes to be made if policy is stored in this container (i.e. not inherited)
        const newUserRoleOptions = policy && !policy.isInheritFromParent() ? getNewUserRoles(user, container, project, extraRoles) : undefined;

        return (
            <BasePermissionsCheckPage
                user={user}
                title={'User Management'}
                hasPermission={user.isAdmin}
                renderButtons={this.renderButtons}
            >
                <UsersGridPanel
                    {...this.props}
                    onCreateComplete={this.onCreateComplete}
                    onUsersStateChangeComplete={this.onUsersStateChangeComplete}
                    newUserRoleOptions={newUserRoleOptions}
                    policy={policy}
                    allowResetPassword={!isLoginAutoRedirectEnabled()}
                    showDetailsPanel={user.hasManageUsersPermission()}
                />
            </BasePermissionsCheckPage>
        )
    }
}
