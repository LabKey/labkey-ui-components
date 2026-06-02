/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { Map } from 'immutable';
import { getServerContext, Utils } from '@labkey/api';

import classNames from 'classnames';

import { Modal } from '../../Modal';
import { caseInsensitive } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { formatDate, getDateFNSDateTimeFormat, parseDate } from '../../util/Date';
import { Principal, SecurityPolicy, SecurityRole } from '../permissions/models';
import { EffectiveRolesList } from '../permissions/EffectiveRolesList';

import { GroupsList } from '../permissions/GroupsList';
import { AppURL } from '../../url/AppURL';
import { User } from '../base/models/User';
import { getDefaultAPIWrapper } from '../../APIWrapper';
import { SecurityAPIWrapper } from '../security/APIWrapper';
import { Container } from '../base/models/Container';
import { getRolesByUniqueName } from '../permissions/actions';

import { AppLink } from '../../url/AppLink';

import { hasTotpSettings } from './actions';
import { UserResetPasswordConfirmModal } from './UserResetPasswordConfirmModal';
import { UserResetTotpSettingsConfirmModal } from './UserResetTotpSettingsConfirmModal';
import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';
import { UserActivateChangeConfirmModal } from './UserActivateChangeConfirmModal';
import { ADMIN_KEY } from '../../app/constants';

interface UserDetailRowProps {
    label: string;
    value: React.ReactNode;
}

const UserDetailRow: FC<UserDetailRowProps> = ({ label, value }) => (
    <div className="row">
        <div className="col-xs-4 principal-detail-label">{label}</div>
        <div className="col-xs-8 principal-detail-value">{value}</div>
    </div>
);
UserDetailRow.displayName = 'UserDetailRow';

interface UserPropProps {
    isDate?: boolean;
    label: string;
    prop: string;
    userProperties: Record<string, any>;
}

const UserProp: FC<UserPropProps> = ({ isDate, label, prop, userProperties }) => {
    let value = caseInsensitive(userProperties, prop);
    if (isDate && value) {
        const date = parseDate(value);
        if (date) {
            value = formatDate(date, undefined, getDateFNSDateTimeFormat());
        }
    } else if (value === undefined) {
        value = 'unknown';
    }

    return <UserDetailRow label={label} value={value} />;
};
UserProp.displayName = 'UserProp';

interface Props {
    allowDelete?: boolean;
    allowResetPassword?: boolean;
    api?: SecurityAPIWrapper;
    container?: Container;
    currentUser: User;
    displayName?: string;
    isSelf?: boolean;
    onUsersStateChangeComplete?: (response: any, resetSelection: boolean) => void;
    policy?: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    rootPolicy?: SecurityPolicy;
    showGroupListLinks?: boolean;
    showPermissionListLinks?: boolean;
    toggleDetailsModal?: () => void;
    userId: number;
}

export const UserDetailsPanel: FC<Props> = props => {
    const {
        allowDelete = true,
        allowResetPassword = true,
        api = getDefaultAPIWrapper().security,
        container,
        currentUser,
        displayName,
        isSelf,
        onUsersStateChangeComplete,
        policy,
        rolesByUniqueName,
        rootPolicy,
        showGroupListLinks = true,
        showPermissionListLinks = true,
        toggleDetailsModal,
        userId,
    } = props;

    const [loading, setLoading] = useState<boolean>(false);
    const [policyState, setPolicyState] = useState<SecurityPolicy | undefined>(undefined);
    const [principal, setPrincipal] = useState<Principal | undefined>(undefined);
    const [rolesByUniqueNameState, setRolesByUniqueNameState] = useState<Map<string, SecurityRole> | undefined>(
        undefined
    );
    const [showDialog, setShowDialog] = useState<string | undefined>(undefined);
    const [showResetTotp, setShowResetTotp] = useState<boolean>(false);
    const [userProperties, setUserProperties] = useState<Record<string, any> | undefined>(undefined);

    const loadPolicyAndRoles = useCallback(async () => {
        if (currentUser.isAdmin && !policy && !rolesByUniqueName && container) {
            try {
                const policy_ = await api.fetchPolicy(container.id);
                const roles = await api.fetchRoles();
                setPolicyState(policy_);
                setRolesByUniqueNameState(getRolesByUniqueName(roles));
            } catch (e) {
                console.error(e);
            }
        }
    }, [api, container, currentUser.isAdmin, policy, rolesByUniqueName]);

    const loadUserDetails = useCallback(async () => {
        if (!userId) {
            setUserProperties(undefined);
            setPrincipal(undefined);
            setShowResetTotp(false);
            return;
        }

        setLoading(true);

        try {
            const principal = await api.getPrincipalById(userId);
            setPrincipal(principal);

            if (isSelf) {
                const response = await api.getUserProperties(userId);
                setUserProperties(response.props);
            } else {
                const response = await api.getUserPropertiesForOther(userId);
                if (!Utils.isEmptyObj(response)) {
                    setUserProperties(response);
                } else {
                    setUserProperties({ UserId: userId, DisplayName: displayName });
                }
            }
        } catch (e) {
            setUserProperties(undefined);
        }

        if (currentUser.isRootAdmin) {
            try {
                setShowResetTotp(await hasTotpSettings(userId));
            } catch (e) {
                setShowResetTotp(false);
            }
        }

        setLoading(false);
    }, [api, currentUser.isRootAdmin, displayName, isSelf, userId]);

    useEffect(() => {
        loadUserDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    useEffect(() => {
        loadPolicyAndRoles();
    }, [loadPolicyAndRoles]);

    const toggleDialog = useCallback((name?: string) => {
        setShowDialog(name);
    }, []);

    const closeDialog = useCallback(() => toggleDialog(undefined), [toggleDialog]);
    const toggleResetDialog = useCallback(() => toggleDialog('reset'), [toggleDialog]);
    const toggleResetTotpDialog = useCallback(() => toggleDialog('resetTotp'), [toggleDialog]);
    const toggleDeleteDialog = useCallback(() => toggleDialog('delete'), [toggleDialog]);
    const toggleActivateDialog = useCallback(() => toggleDialog('reactivate'), [toggleDialog]);
    const toggleDeactivateDialog = useCallback(() => toggleDialog('deactivate'), [toggleDialog]);

    const handleUsersStateChangeComplete = useCallback(
        (response: any, isDelete = false): void => {
            toggleDialog(undefined); // close dialog
            if (!isDelete) {
                loadUserDetails(); // reload to pickup new user state
            }

            onUsersStateChangeComplete?.(response, isDelete);
        },
        [loadUserDetails, onUsersStateChangeComplete, toggleDialog]
    );

    const onUserDeleteComplete = useCallback(
        (response: any) => {
            handleUsersStateChangeComplete(response, true);
        },
        [handleUsersStateChangeComplete]
    );

    const renderButtons = (): React.ReactNode => {
        if (!userProperties) return null;

        const isActive = caseInsensitive(userProperties, 'active');

        return (
            <>
                <hr className="principal-hr" />
                {allowResetPassword && isActive && (
                    <button className="btn btn-default" onClick={toggleResetDialog} type="button">
                        Reset Password
                    </button>
                )}
                {showResetTotp && isActive && (
                    <button
                        className="btn btn-default"
                        onClick={toggleResetTotpDialog}
                        style={{ marginLeft: '10px' }}
                        type="button"
                    >
                        Reset TOTP Settings
                    </button>
                )}
                {allowDelete && (
                    <button
                        className="pull-right btn btn-default"
                        onClick={toggleDeleteDialog}
                        style={{ marginLeft: '10px' }}
                        type="button"
                    >
                        Delete
                    </button>
                )}
                <button
                    className="pull-right btn btn-default"
                    onClick={isActive ? toggleDeactivateDialog : toggleActivateDialog}
                    style={{ marginLeft: '10px' }}
                    type="button"
                >
                    {isActive ? 'Deactivate' : 'Reactivate'}
                </button>
            </>
        );
    };

    const renderBody = (): React.ReactNode => {
        if (loading) {
            return <LoadingSpinner />;
        }

        if (userProperties) {
            const isGroup = principal?.isGroup() ?? false;
            const description = caseInsensitive(userProperties, 'description');
            let name = caseInsensitive(userProperties, 'firstName') ?? '';
            if (name) {
                name += ' ';
            }
            name += caseInsensitive(userProperties, 'lastName') ?? '';
            const hasPassword = caseInsensitive(userProperties, 'hasPassword');

            return (
                <>
                    {!isGroup && (
                        <>
                            {!!name && <UserDetailRow label="Name" value={name} />}
                            <UserProp label="Email" prop="email" userProperties={userProperties} />
                            {description && (
                                <UserProp label="Description" prop="description" userProperties={userProperties} />
                            )}

                            <hr className="principal-hr" />
                            <UserProp isDate label="Last Login" prop="lastLogin" userProperties={userProperties} />
                            <UserProp isDate label="Created" prop="created" userProperties={userProperties} />

                            <hr className="principal-hr" />
                            <UserProp label="User ID" prop="userId" userProperties={userProperties} />
                            {!!hasPassword && <UserDetailRow label="Has Password" value={hasPassword.toString()} />}
                        </>
                    )}
                    {isGroup && (
                        <>
                            <UserProp label="ID" prop="userId" userProperties={userProperties} />
                        </>
                    )}

                    <EffectiveRolesList
                        currentUser={currentUser}
                        policy={policy ?? policyState}
                        rolesByUniqueName={rolesByUniqueName ?? rolesByUniqueNameState}
                        rootPolicy={rootPolicy}
                        showLinks={showPermissionListLinks}
                        userId={userId}
                    />
                    <GroupsList groups={caseInsensitive(userProperties, 'groups')} showLinks={showGroupListLinks} />
                </>
            );
        }

        return <div>No user selected.</div>;
    };

    const renderHeader = (): React.ReactNode => {
        if (loading || !userProperties) return 'User Details';

        const displayName_ = caseInsensitive(userProperties, 'displayName');
        const active = caseInsensitive(userProperties, 'active');

        return (
            <>
                <span>{displayName_}</span>
                {active !== undefined && (
                    <span
                        className={classNames('margin-left status-pill', {
                            active,
                            inactive: !active,
                        })}
                    >
                        {active ? 'Active' : 'Inactive'}
                    </span>
                )}
            </>
        );
    };

    const { user, project } = getServerContext();
    const isSelfCtx = userId === user.id;
    const isGroup = principal?.isGroup() ?? false;

    if (toggleDetailsModal) {
        let footer: ReactNode;
        if (user.isAdmin && !isGroup) {
            // We do not currently support user management in sub folders, so we create the management URL for the project
            // container.
            const manageUrl = AppURL.create(ADMIN_KEY, 'users')
                .addParams({ usersView: 'all', 'all.UserId~eq': userId })
                .setContainerPath(project.path);

            footer = (
                <AppLink className="pull-right btn btn-default" to={manageUrl}>
                    Manage
                </AppLink>
            );
        }

        return (
            <Modal
                cancelText={isGroup ? 'Close' : 'Cancel'}
                className="user-detail-modal"
                footer={footer}
                onCancel={toggleDetailsModal}
                title={renderHeader()}
            >
                {renderBody()}
            </Modal>
        );
    }

    return (
        <div className="panel panel-default user-details-panel">
            <h2 className="panel-heading">{renderHeader()}</h2>
            <div className="panel-body">
                {renderBody()}
                {!isSelfCtx && !isGroup && onUsersStateChangeComplete && renderButtons()}
                {allowResetPassword && showDialog === 'reset' && (
                    <UserResetPasswordConfirmModal
                        email={caseInsensitive(userProperties, 'email')}
                        hasLogin={Utils.isString(caseInsensitive(userProperties, 'lastLogin'))}
                        onCancel={closeDialog}
                        onComplete={handleUsersStateChangeComplete}
                        userId={caseInsensitive(userProperties, 'userId')}
                    />
                )}
                {showDialog === 'resetTotp' && (
                    <UserResetTotpSettingsConfirmModal
                        displayName={caseInsensitive(userProperties, 'displayName')}
                        email={caseInsensitive(userProperties, 'email')}
                        onCancel={closeDialog}
                        onComplete={handleUsersStateChangeComplete}
                        userId={caseInsensitive(userProperties, 'userId')}
                    />
                )}
                {(showDialog === 'reactivate' || showDialog === 'deactivate') && (
                    <UserActivateChangeConfirmModal
                        onCancel={closeDialog}
                        onComplete={handleUsersStateChangeComplete}
                        reactivate={showDialog === 'reactivate'}
                        userIds={[userId]}
                    />
                )}
                {allowDelete && showDialog === 'delete' && (
                    <UserDeleteConfirmModal
                        onCancel={closeDialog}
                        onComplete={onUserDeleteComplete}
                        userIds={[userId]}
                    />
                )}
            </div>
        </div>
    );
};

UserDetailsPanel.displayName = 'UserDetailsPanel';
