/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import moment from 'moment';
import { Panel, Row, Col, Button } from 'react-bootstrap';
import { List, Map } from 'immutable';
import { Utils } from '@labkey/api';

import { SecurityPolicy, SecurityRole } from '../permissions/models';
import { EffectiveRolesList } from '../permissions/EffectiveRolesList';
import { getUserProperties } from '../base/actions';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { caseInsensitive } from '../../util/utils';
import { getDateTimeFormat } from '../../util/Date';

import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';
import { UserActivateChangeConfirmModal } from './UserActivateChangeConfirmModal';
import { UserResetPasswordConfirmModal } from './UserResetPasswordConfirmModal';

interface Props {
    userId: number;
    policy?: SecurityPolicy;
    rootPolicy?: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    allowDelete?: boolean;
    allowResetPassword?: boolean;
    onUsersStateChangeComplete?: (response: any, resetSelection: boolean) => any;
}

interface State {
    loading: boolean;
    userProperties: {};
    showDialog: string; // valid options are 'deactivate', 'reactivate', 'delete', 'reset', undefined
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

    loadUserDetails() {
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
    }

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

    renderUserProp(title: string, prop: string, formatDate = false) {
        let value = caseInsensitive(this.state.userProperties, prop);
        if (formatDate && value) {
            value = moment(value).format(getDateTimeFormat());
        }

        return (
            <Row>
                <Col xs={4} className="principal-detail-label">
                    {title}:
                </Col>
                <Col xs={8} className="principal-detail-value">
                    {value}
                </Col>
            </Row>
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
        const { onUsersStateChangeComplete, userId } = this.props;
        const { loading, userProperties } = this.state;
        const isSelf = userId === LABKEY.user.id;

        if (loading) {
            return <LoadingSpinner />;
        }

        if (userProperties) {
            const displayName = caseInsensitive(userProperties, 'displayName');
            const description = caseInsensitive(userProperties, 'description');

            return (
                <>
                    <p className="principal-title-primary">{displayName}</p>
                    {this.renderUserProp('Email', 'email')}
                    {this.renderUserProp('First Name', 'firstName')}
                    {this.renderUserProp('Last Name', 'lastName')}

                    {description && (
                        <>
                            <hr className="principal-hr" />
                            {this.renderUserProp('Description', 'description')}
                        </>
                    )}

                    <hr className="principal-hr" />
                    {this.renderUserProp('Created', 'created', true)}
                    {this.renderUserProp('Last Login', 'lastLogin', true)}

                    <EffectiveRolesList {...this.props} />
                    {/* TODO when groups are implemented, add "Member of" for users*/}

                    {!isSelf && onUsersStateChangeComplete && this.renderButtons()}
                </>
            );
        }

        return <div>No user selected.</div>;
    }

    render() {
        const { userId, allowDelete, allowResetPassword } = this.props;
        const { showDialog, userProperties } = this.state;

        return (
            <Panel>
                <Panel.Heading>User Details</Panel.Heading>
                <Panel.Body>
                    {this.renderBody()}
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
                            userIds={List<number>([userId])}
                            reactivate={showDialog === 'reactivate'}
                            onComplete={response => this.onUsersStateChangeComplete(response, false)}
                            onCancel={() => this.toggleDialog(undefined)}
                        />
                    )}
                    {allowDelete && showDialog === 'delete' && (
                        <UserDeleteConfirmModal
                            userIds={List<number>([userId])}
                            onComplete={response => this.onUsersStateChangeComplete(response, true)}
                            onCancel={() => this.toggleDialog(undefined)}
                        />
                    )}
                </Panel.Body>
            </Panel>
        );
    }
}
