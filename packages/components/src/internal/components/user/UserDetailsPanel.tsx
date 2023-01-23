/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react';
import moment from 'moment';
import { Button, Col, Modal, Panel, Row } from 'react-bootstrap';
import { Map } from 'immutable';
import { getServerContext, Utils } from '@labkey/api';

import { EffectiveRolesList } from '../permissions/EffectiveRolesList';

import { getMomentDateTimeFormat } from '../../util/Date';

import { SecurityPolicy, SecurityRole } from '../permissions/models';

import { caseInsensitive } from '../../util/utils';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';
import { UserActivateChangeConfirmModal } from './UserActivateChangeConfirmModal';
import { UserResetPasswordConfirmModal } from './UserResetPasswordConfirmModal';
import { getUserGroups, getUserProperties } from './actions';
import { RolesAndGroups } from './RolesAndGroups';
import classNames from 'classnames';


interface UserDetailRowProps {
    label: string,
    value: React.ReactNode
}

const UserDetailRow: FC<UserDetailRowProps> = ({label, value}) => {
    return (
        <Row>
            <Col xs={4} className="principal-detail-label">
                {label}
            </Col>
            <Col xs={8} className="principal-detail-value">
                {value}
            </Col>
        </Row>
    )
};

interface Props {
    allowDelete?: boolean;
    allowResetPassword?: boolean;
    asModal?: boolean;
    onUsersStateChangeComplete?: (response: any, resetSelection: boolean) => any;
    policy?: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    rootPolicy?: SecurityPolicy;
    userId: number;
}

interface State {
    roles: string[];
    loading: boolean;
    showDialog: string;
    userProperties: {}; // valid options are 'deactivate', 'reactivate', 'delete', 'reset', undefined
}

export class UserDetailsPanel extends React.PureComponent<Props, State> {
    static defaultProps = {
        allowDelete: true,
        allowResetPassword: true,
        onUsersStateChangeComplete: undefined,
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            roles: [],
            loading: false,
            userProperties: undefined,
            showDialog: undefined,
        };
    }

    componentDidMount() {
        this.loadUserDetails();
    }

    componentDidUpdate(prevProps: Readonly<Props>) {
        if (this.props.userId !== prevProps.userId) {
            this.loadUserDetails();
        }
    }

    loadUserDetails = (): void => {
        const { userId } = this.props;

        if (userId) {
            this.setState(() => ({ loading: true }));

            getUserProperties(userId)
                .then(response => {
                    this.setState(() => ({ userProperties: response.props, loading: false }));
                })
                .catch(error => {
                    console.error(error);
                    this.setState(() => ({ userProperties: undefined, loading: false }));
                });
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

        return (
            <UserDetailRow label={label} value={value} />
        );
    }

    renderButtons() {
        const { allowDelete, allowResetPassword } = this.props;
        const isActive = caseInsensitive(this.state.userProperties, 'active');

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
        const { userId } = this.props;
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

            return (
                <>
                    {!!name &&
                        <UserDetailRow label={'Name'} value={name}/>
                    }
                    {this.renderUserProp('Email', 'email')}

                    {description && (
                        <>
                            {this.renderUserProp('Description', 'description')}
                        </>
                    )}

                    <hr className="principal-hr" />
                    {this.renderUserProp('Last Login', 'lastLogin', true)}
                    {this.renderUserProp('Created', 'created', true)}

                    <hr className="principal-hr" />
                    {this.renderUserProp('User ID', 'userId')}
                    <UserDetailRow label='Has Password' value={caseInsensitive(userProperties, 'hasPassword').toString()} />
                    <EffectiveRolesList {...this.props} />

                    <RolesAndGroups userId={userId} />
                </>
            );
        }

        return <div>No user selected.</div>;
    }

    renderHeader() {
        const {loading, userProperties} = this.state;
        if (loading || !userProperties)
            return 'User Details';

        const displayName = caseInsensitive(userProperties, 'displayName');
        const active = caseInsensitive(userProperties, 'active');
        return (
            <>
                <span>{displayName}</span>
                <span className={classNames('margin-left status-pill', {
                    'active': active,
                    'inactive': !active
                    }
                )}>{active ? 'Active' : 'Inactive'}</span>
            </>
        )
    }

    render() {
        const { userId, allowDelete, allowResetPassword, asModal, onUsersStateChangeComplete, } = this.props;
        const { showDialog, userProperties } = this.state;
        const isSelf = userId === getServerContext().user.id;

        if (asModal) {
            return (
                <Modal onHide={this.toggleDialog} show={true}>
                    <Modal.Title>{this.renderHeader()}</Modal.Title>
                    <Modal.Body>{this.renderBody()}</Modal.Body>
                    <Modal.Footer>

                    </Modal.Footer>
                </Modal>
            )
        }

        return (
            <Panel>
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
