/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react';
import moment from 'moment';
import { Button, Col, Modal, Panel, Row } from 'react-bootstrap';
import { Map } from 'immutable';
import { getServerContext, Utils } from '@labkey/api';

import classNames from 'classnames';

import { caseInsensitive } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { getMomentDateTimeFormat } from '../../util/Date';
import { SecurityPolicy, SecurityRole } from '../permissions/models';
import { EffectiveRolesList } from '../permissions/EffectiveRolesList';

import { GroupsList } from '../permissions/GroupsList';
import { AppURL, createProductUrlFromPartsWithContainer } from '../../url/AppURL';
import { User } from '../base/models/User';
import { getDefaultAPIWrapper } from '../../APIWrapper';
import { SecurityAPIWrapper } from '../security/APIWrapper';
import { Container } from '../base/models/Container';
import { getRolesByUniqueName } from '../permissions/actions';

import { getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';

import { UserResetPasswordConfirmModal } from './UserResetPasswordConfirmModal';
import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';
import { UserActivateChangeConfirmModal } from './UserActivateChangeConfirmModal';

interface UserDetailRowProps {
    label: string;
    value: React.ReactNode;
}

const UserDetailRow: FC<UserDetailRowProps> = ({ label, value }) => {
    return (
        <Row>
            <Col xs={4} className="principal-detail-label">
                {label}
            </Col>
            <Col xs={8} className="principal-detail-value">
                {value}
            </Col>
        </Row>
    );
};

interface Props {
    allowDelete?: boolean;
    allowResetPassword?: boolean;
    api?: SecurityAPIWrapper;
    container?: Container;
    currentUser: User;
    isSelf?: boolean;
    onUsersStateChangeComplete?: (response: any, resetSelection: boolean) => any;
    policy?: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    rootPolicy?: SecurityPolicy;
    showGroupListLinks?: boolean;
    showPermissionListLinks?: boolean;
    toggleDetailsModal?: () => void;
    userId: number;
}

interface State {
    loading: boolean;
    policy?: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    showDialog: string;
    userProperties: Record<string, any>;
}

export class UserDetailsPanel extends React.PureComponent<Props, State> {
    static defaultProps = {
        allowDelete: true,
        allowResetPassword: true,
        api: getDefaultAPIWrapper().security,
        onUsersStateChangeComplete: undefined,
        showGroupListLinks: true,
        showPermissionListLinks: true,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            loading: false,
            policy: undefined,
            rolesByUniqueName: undefined,
            showDialog: undefined,
            userProperties: undefined,
        };
    }

    componentDidMount() {
        this.loadUserDetails();
        this.loadPolicyAndRoles();
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        if (this.props.userId !== prevProps.userId) {
            this.loadUserDetails();
        }
    }

    loadPolicyAndRoles = async (): Promise<void> => {
        const { policy, rolesByUniqueName, container, currentUser, api } = this.props;

        if (currentUser.isAdmin && !policy && !rolesByUniqueName && container) {
            try {
                const policy_ = await api.fetchPolicy(container.id);
                const roles = await api.fetchRoles();
                const rolesByUniqueName_ = getRolesByUniqueName(roles);

                this.setState(() => ({
                    policy: policy_,
                    rolesByUniqueName: rolesByUniqueName_,
                }));
            } catch (e) {
                console.error(e);
            }
        }
    };

    loadUserDetails = (): void => {
        const { userId, isSelf, api } = this.props;

        if (userId) {
            this.setState(() => ({ loading: true }));

            if (isSelf) {
                api.getUserProperties(userId)
                    .then(response => {
                        this.setState(() => ({ userProperties: response.props, loading: false }));
                    })
                    .catch(() => {
                        this.setState(() => ({ userProperties: undefined, loading: false }));
                    });
            } else {
                api.getUserPropertiesForOther(userId)
                    .then(response => {
                        this.setState(() => ({ userProperties: response, loading: false }));
                    })
                    .catch(() => {
                        this.setState(() => ({ userProperties: undefined, loading: false }));
                    });
            }
        } else {
            this.setState(() => ({ userProperties: undefined }));
        }
    };

    toggleDialog = (name: string) => {
        this.setState(() => ({ showDialog: name }));
    };

    onUsersStateChangeComplete = (response: any, isDelete: boolean) => {
        this.toggleDialog(undefined); // close dialog
        if (!isDelete) {
            this.loadUserDetails(); // reload to pickup new user state
        }

        if (this.props.onUsersStateChangeComplete) {
            this.props.onUsersStateChangeComplete(response, isDelete);
        }
    };

    renderUserProp(label: string, prop: string, formatDate = false) {
        let value = caseInsensitive(this.state.userProperties, prop);
        if (formatDate && value) {
            value = moment(value).format(getMomentDateTimeFormat());
        }

        return <UserDetailRow label={label} value={value} />;
    }

    renderButtons() {
        const { allowDelete, allowResetPassword } = this.props;
        const { userProperties } = this.state;

        if (!userProperties) return null;

        const isActive = caseInsensitive(userProperties, 'active');

        return (
            <>
                <hr className="principal-hr" />
                {allowResetPassword && isActive && (
                    <Button onClick={() => this.toggleDialog('reset')}>Reset Password</Button>
                )}
                {allowDelete && (
                    <Button
                        className="pull-right"
                        style={{ marginLeft: '10px' }}
                        onClick={() => this.toggleDialog('delete')}
                    >
                        Delete
                    </Button>
                )}
                <Button
                    className="pull-right"
                    style={{ marginLeft: '10px' }}
                    onClick={() => this.toggleDialog(isActive ? 'deactivate' : 'reactivate')}
                >
                    {isActive ? 'Deactivate' : 'Reactivate'}
                </Button>
            </>
        );
    }

    renderBody() {
        const {
            showGroupListLinks,
            showPermissionListLinks,
            currentUser,
            policy,
            rolesByUniqueName,
            rootPolicy,
            userId,
        } = this.props;
        const { loading, userProperties } = this.state;

        if (loading) {
            return <LoadingSpinner />;
        }

        if (userProperties) {
            const description = caseInsensitive(userProperties, 'description');
            let name = caseInsensitive(userProperties, 'firstName') ?? '';
            if (name) {
                name += ' ';
            }
            name += caseInsensitive(userProperties, 'lastName') ?? '';
            const hasPassword = caseInsensitive(userProperties, 'hasPassword');

            return (
                <>
                    {!!name && <UserDetailRow label="Name" value={name} />}
                    {this.renderUserProp('Email', 'email')}

                    {description && <>{this.renderUserProp('Description', 'description')}</>}

                    <hr className="principal-hr" />
                    {this.renderUserProp('Last Login', 'lastLogin', true)}
                    {this.renderUserProp('Created', 'created', true)}

                    <hr className="principal-hr" />
                    {this.renderUserProp('User ID', 'userId')}
                    {!!hasPassword && <UserDetailRow label="Has Password" value={hasPassword.toString()} />}

                    <EffectiveRolesList
                        currentUser={currentUser}
                        policy={policy ?? this.state.policy}
                        rolesByUniqueName={rolesByUniqueName ?? this.state.rolesByUniqueName}
                        rootPolicy={rootPolicy}
                        showLinks={showPermissionListLinks}
                        userId={userId}
                    />
                    <GroupsList
                        groups={caseInsensitive(userProperties, 'groups')}
                        currentUser={currentUser}
                        showLinks={showGroupListLinks}
                    />
                </>
            );
        }

        return <div>No user selected.</div>;
    }

    renderHeader() {
        const { loading, userProperties } = this.state;
        if (loading || !userProperties) return 'User Details';

        const displayName = caseInsensitive(userProperties, 'displayName');
        const active = caseInsensitive(userProperties, 'active');

        return (
            <>
                <span>{displayName}</span>
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
    }

    render() {
        const { userId, allowDelete, allowResetPassword, toggleDetailsModal, onUsersStateChangeComplete } = this.props;
        const { showDialog, userProperties } = this.state;
        const { user, container, project } = getServerContext();
        const isSelf = userId === user.id;
        const currentProductId = getCurrentAppProperties()?.productId;
        const targetProductId = getPrimaryAppProperties()?.productId;
        // We do not currently support user management in sub folders, so we create the management URL for the project
        // container.
        const manageUrl = createProductUrlFromPartsWithContainer(
            targetProductId,
            currentProductId,
            project.path,
            { usersView: 'all', 'all.UserId~eq': userId },
            'admin',
            'users'
        );

        if (toggleDetailsModal) {
            return (
                <Modal onHide={toggleDetailsModal} show={true} className="user-detail-modal">
                    <Modal.Header closeButton>
                        <Modal.Title>{this.renderHeader()}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{this.renderBody()}</Modal.Body>
                    {user.isAdmin && (
                        <Modal.Footer>
                            <Button
                                className="pull-right"
                                href={manageUrl instanceof AppURL ? manageUrl.toHref() : manageUrl}
                            >
                                Manage
                            </Button>
                        </Modal.Footer>
                    )}
                </Modal>
            );
        }

        return (
            <Panel className="user-details-panel">
                <Panel.Heading>{this.renderHeader()}</Panel.Heading>
                <Panel.Body>
                    {this.renderBody()}
                    {!isSelf && onUsersStateChangeComplete && this.renderButtons()}
                    {allowResetPassword && showDialog === 'reset' && (
                        <UserResetPasswordConfirmModal
                            email={caseInsensitive(userProperties, 'email')}
                            hasLogin={Utils.isString(caseInsensitive(userProperties, 'lastLogin'))}
                            onComplete={response => this.onUsersStateChangeComplete(response, false)}
                            onCancel={() => this.toggleDialog(undefined)}
                        />
                    )}
                    {(showDialog === 'reactivate' || showDialog === 'deactivate') && (
                        <UserActivateChangeConfirmModal
                            userIds={[userId]}
                            reactivate={showDialog === 'reactivate'}
                            onComplete={response => this.onUsersStateChangeComplete(response, false)}
                            onCancel={() => this.toggleDialog(undefined)}
                        />
                    )}
                    {allowDelete && showDialog === 'delete' && (
                        <UserDeleteConfirmModal
                            userIds={[userId]}
                            onComplete={response => this.onUsersStateChangeComplete(response, true)}
                            onCancel={() => this.toggleDialog(undefined)}
                        />
                    )}
                </Panel.Body>
            </Panel>
        );
    }
}
