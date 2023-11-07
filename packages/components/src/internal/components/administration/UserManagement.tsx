/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PureComponent, ReactNode } from 'react';
import { List } from 'immutable';
import { MenuItem } from 'react-bootstrap';
import { PermissionRoles, Project, Utils } from '@labkey/api';
import { WithRouterProps } from 'react-router';

import { User } from '../base/models/User';
import { Container } from '../base/models/Container';
import { SecurityPolicy } from '../permissions/models';
import { ManageDropdownButton } from '../buttons/ManageDropdownButton';
import { AppURL } from '../../url/AppURL';
import { BasePermissionsCheckPage } from '../permissions/BasePermissionsCheckPage';
import { UsersGridPanel } from '../user/UsersGridPanel';

import { ModuleContext, useServerContext } from '../base/ServerContext';

import { InjectedPermissionsPage, withPermissionsPage } from '../permissions/withPermissionsPage';

import { AppContext, useAppContext } from '../../AppContext';
import { SecurityAPIWrapper } from '../security/APIWrapper';

import { ActiveUserLimitMessage } from '../settings/ActiveUserLimit';

import { UserLimitSettings } from '../permissions/actions';

import { NotificationsContextProps, withNotificationsContext } from '../notifications/NotificationsContext';

import { AUDIT_EVENT_TYPE_PARAM, USER_AUDIT_QUERY } from '../auditlog/constants';

import { AUDIT_KEY } from '../../app/constants';

import { NotFound } from '../base/NotFound';

import { isProductProjectsEnabled } from '../../app/utils';

import { isLoginAutoRedirectEnabled, showPremiumFeatures } from './utils';
import { getUserGridFilterURL, updateSecurityPolicy } from './actions';

import { APPLICATION_SECURITY_ROLES, SITE_SECURITY_ROLES } from './constants';
import { useAdminAppContext } from './useAdminAppContext';

export function getNewUserRoles(
    user: User,
    container: Partial<Container>,
    project: Project,
    extraRoles?: string[][],
    moduleContext?: ModuleContext
): Array<Record<string, any>> {
    const roles = [
        {
            id: PermissionRoles.Reader.toString(),
            label: APPLICATION_SECURITY_ROLES.get(PermissionRoles.Reader) + ' (default)',
        },
        { id: PermissionRoles.Editor.toString(), label: APPLICATION_SECURITY_ROLES.get(PermissionRoles.Editor) },
        {
            id: PermissionRoles.EditorWithoutDelete.toString(),
            label: APPLICATION_SECURITY_ROLES.get(PermissionRoles.EditorWithoutDelete),
        },
    ];
    if (showPremiumFeatures(moduleContext)) {
        roles.push({
            id: PermissionRoles.FolderAdmin.toString(),
            label: APPLICATION_SECURITY_ROLES.get(PermissionRoles.FolderAdmin),
        });
        if (container.parentId === project.rootId) {
            roles.push({
                id: PermissionRoles.ProjectAdmin.toString(),
                label: APPLICATION_SECURITY_ROLES.get(PermissionRoles.ProjectAdmin),
            });
        }
    }
    extraRoles?.forEach(role => {
        roles.push({ id: role[0], label: role[1] });
    });
    if (user.isAppAdmin()) {
        roles.push({
            id: PermissionRoles.ApplicationAdmin,
            label: SITE_SECURITY_ROLES.get(PermissionRoles.ApplicationAdmin),
        });
    }
    return roles;
}

interface OwnProps {
    allowResetPassword: boolean;
    api: SecurityAPIWrapper;
    container: Container;
    extraRoles?: string[][];
    project: Project;
    user: User;
}

// exported for jest testing
export type UserManagementProps = OwnProps & InjectedPermissionsPage & NotificationsContextProps & WithRouterProps;

interface State {
    policy: SecurityPolicy;
    userLimitSettings: UserLimitSettings;
}

// exported for jest testing
export class UserManagement extends PureComponent<UserManagementProps, State> {
    constructor(props: UserManagementProps) {
        super(props);

        this.state = {
            policy: undefined,
            userLimitSettings: undefined,
        };
    }

    componentDidMount(): void {
        this.loadSecurityPolicy();
        this.loadUserLimitSettings();
    }

    loadUserLimitSettings = async (): Promise<void> => {
        const { api, user } = this.props;
        if (!user.hasAddUsersPermission()) return;

        try {
            const userLimitSettings = await api.getUserLimitSettings();
            this.setState({ userLimitSettings });
        } catch (error) {
            this.props.createNotification({
                alertClass: 'danger',
                message: 'Unable to load user limit settings. ' + (error.exception ? error.exception : ''),
            });
        }
    };

    loadSecurityPolicy = async (): Promise<void> => {
        const { api, container, principalsById, user } = this.props;
        if (!user.isAdmin) return;

        try {
            const policy = await api.fetchPolicy(container.id, principalsById);
            this.setState({ policy: SecurityPolicy.updateAssignmentsData(policy, principalsById) });
        } catch (error) {
            this.props.createNotification({
                alertClass: 'danger',
                message: 'Unable to load permissions information. ' + (error.exception ? error.exception : ''),
            });
        }
    };

    onCreateComplete = (response: any, roleUniqueNames: string[]): void => {
        const { container, project } = this.props;

        // split response to count new vs existing users separately
        let newUsers = List<number>(),
            existingUsers = List<number>();
        response.users.forEach(user => {
            if (user.isNew) {
                newUsers = newUsers.push(user.userId);
            } else {
                existingUsers = existingUsers.push(user.userId);
            }
        });

        if (newUsers.size > 0) {
            if (roleUniqueNames?.length) {
                const promises = [];
                // application admin role applies to the Site root container, others apply to current project container
                if (roleUniqueNames.indexOf(PermissionRoles.ApplicationAdmin) >= 0) {
                    promises.push(updateSecurityPolicy(project.rootId, newUsers, [PermissionRoles.ApplicationAdmin]));
                }
                const nonAppAdmin = roleUniqueNames.filter(name => name !== PermissionRoles.ApplicationAdmin);
                if (nonAppAdmin.length) {
                    promises.push(updateSecurityPolicy(container.id, newUsers, nonAppAdmin));
                }
                Promise.all(promises)
                    .then(() => {
                        this.afterCreateComplete(newUsers, true);
                        this.loadSecurityPolicy();
                    })
                    .catch(error => {
                        console.error(error);
                        this.props.createNotification({
                            alertClass: 'danger',
                            message:
                                'Unable to update permissions information. ' + (error.exception ? error.exception : ''),
                        });

                        this.afterCreateComplete(newUsers, false);
                    });
            } else {
                this.afterCreateComplete(newUsers, false);
            }
        }

        if (existingUsers.size > 0) {
            this.props.createNotification({
                message: (
                    <>
                        <span>
                            {Utils.pluralBasic(existingUsers.size, 'user')} already existed and{' '}
                            {existingUsers.size > 1 ? 'were' : 'was'} not updated.
                        </span>
                        &nbsp;
                        <a href={getUserGridFilterURL(existingUsers, 'all').addParam('usersView', 'all').toHref()}>
                            view
                        </a>
                    </>
                ),
            });
        }

        if (response.htmlErrors?.length > 0) {
            this.props.createNotification({
                alertClass: 'danger',
                message: response.htmlErrors.join(' '),
            });
        }

        this.loadUserLimitSettings();
    };

    onUsersStateChangeComplete = (response: any): void => {
        if (response.resetPassword) {
            this.props.createNotification({
                message: (
                    <span>
                        Successfully reset password for <b>{response.email}</b>.
                    </span>
                ),
            });
            return;
        }

        const updatedUserIds = List<number>(response.userIds);
        const action = response.delete ? 'deleted' : response.activate ? 'reactivated' : 'deactivated';
        const urlPrefix = response.activate ? 'active' : 'inactive';
        const href = getUserGridFilterURL(updatedUserIds, urlPrefix).addParam('usersView', urlPrefix).toHref();

        this.props.createNotification({
            message: (
                <>
                    <span>
                        Successfully {action} {Utils.pluralBasic(updatedUserIds.size, 'user')}.&nbsp;
                    </span>
                    {!response.delete && <a href={href}>view</a>}
                </>
            ),
        });

        this.loadUserLimitSettings();
    };

    afterCreateComplete(newUsers: List<number>, permissionsSet: boolean): void {
        this.props.createNotification({
            message: (
                <>
                    <span>
                        Successfully created {Utils.pluralBasic(newUsers.size, 'new user')}
                        {permissionsSet ? ' and assigned the selected role' : ''}.
                    </span>
                    &nbsp;
                    <a href={getUserGridFilterURL(newUsers, 'active').addParam('usersView', 'active').toHref()}>view</a>
                </>
            ),
        });
    }

    renderButtons = (): ReactNode => {
        return (
            <ManageDropdownButton collapsed id="user-management-page-manage" pullRight>
                <MenuItem
                    href={AppURL.create(AUDIT_KEY).addParam(AUDIT_EVENT_TYPE_PARAM, USER_AUDIT_QUERY.value).toHref()}
                >
                    View Audit History
                </MenuItem>
            </ManageDropdownButton>
        );
    };

    render(): ReactNode {
        const { allowResetPassword, container, extraRoles, location, project, user, rolesByUniqueName, router } =
            this.props;
        const { policy, userLimitSettings } = this.state;

        // issue 39501: only allow permissions changes to be made if policy is stored in this container (i.e. not inherited)
        const isEditable = policy && !policy.isInheritFromParent();
        const newUserRoleOptions = isEditable ? getNewUserRoles(user, container, project, extraRoles) : undefined;

        return (
            <BasePermissionsCheckPage
                user={user}
                title="User Management"
                hasPermission={user.isAdmin}
                renderButtons={this.renderButtons}
            >
                <ActiveUserLimitMessage settings={userLimitSettings} />
                <UsersGridPanel
                    user={user}
                    onCreateComplete={this.onCreateComplete}
                    onUsersStateChangeComplete={this.onUsersStateChangeComplete}
                    newUserRoleOptions={newUserRoleOptions}
                    policy={policy}
                    rolesByUniqueName={rolesByUniqueName}
                    allowResetPassword={allowResetPassword}
                    showDetailsPanel={user.hasManageUsersPermission()}
                    userLimitSettings={userLimitSettings}
                    router={router}
                    location={location}
                />
            </BasePermissionsCheckPage>
        );
    }
}

type ImplProps = InjectedPermissionsPage & NotificationsContextProps & WithRouterProps;

export const UserManagementPageImpl: FC<ImplProps> = props => {
    const { api } = useAppContext<AppContext>();
    const { container, moduleContext, project, user } = useServerContext();
    const { extraPermissionRoles } = useAdminAppContext();

    if (isProductProjectsEnabled() && !container.isProject) return <NotFound />;

    // console.log('UserManagementImpl location, router', props.location, props.router);

    return (
        <UserManagement
            {...props}
            allowResetPassword={!isLoginAutoRedirectEnabled(moduleContext)}
            api={api.security}
            container={container}
            extraRoles={extraPermissionRoles}
            project={project}
            user={user}
        />
    );
};

export const UserManagementPage = withPermissionsPage(withNotificationsContext(UserManagementPageImpl));
