/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, {FC, memo} from 'react';
import moment from 'moment';
import { Button, Col, Modal, Panel, Row } from 'react-bootstrap';
import { Map } from 'immutable';
import {Filter, getServerContext, Utils} from '@labkey/api';

import { EffectiveRolesList } from '../permissions/EffectiveRolesList';

import { getMomentDateTimeFormat } from '../../util/Date';

import { SecurityPolicy, SecurityRole } from '../permissions/models';

import { caseInsensitive } from '../../util/utils';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';
import { UserActivateChangeConfirmModal } from './UserActivateChangeConfirmModal';
import { UserResetPasswordConfirmModal } from './UserResetPasswordConfirmModal';
import classNames from 'classnames';
import {selectRows} from "../../query/selectRows";
import {SCHEMAS} from "../../schemas";
import {flattenValuesFromRow} from "../../../public/QueryModel/QueryModel";
import {getUserProperties} from "./actions";


interface UserDetailRowProps {
    label: string;
    value: React.ReactNode;
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

interface GroupsListingProps {
    groups: [{ displayValue: string; value: number }];
}

const GroupsListing: FC<GroupsListingProps> = memo(props => {
    const { groups } = props;

    if (!groups) return null;

    const body = (
        <ul className="principal-detail-ul">
            {groups.length > 0 ? (
                groups.map(group => <li key={group.value} className="principal-detail-li">{group.displayValue}</li>)
            ) : (
                <li className="principal-detail-li">None</li>
            )}
        </ul>
    );

    return (
        <>
            <hr className="principal-hr" />
            <UserDetailRow label="Groups" value={body} />
        </>
    );
});

export const selectRowsUserProps = function(userId: number): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
        selectRows({
            filterArray: [Filter.create('UserId', userId)],
            schemaQuery: SCHEMAS.CORE_TABLES.USERS,
        }).then(response => {
            const row = response.rows[0];
            const rowValues = flattenValuesFromRow(row, Object.keys(row));

            // special case for the Groups prop as it is an array
            rowValues.Groups = caseInsensitive(row, 'Groups');

            resolve(rowValues);
        }).catch(error => {
            console.error(error);
            reject(error);
        });
    });
};

interface Props {
    allowDelete?: boolean;
    allowResetPassword?: boolean;
    isSelf?: boolean;
    onUsersStateChangeComplete?: (response: any, resetSelection: boolean) => any;
    policy?: SecurityPolicy;
    rolesByUniqueName?: Map<string, SecurityRole>;
    rootPolicy?: SecurityPolicy;
    toggleDetailsModal?: () => void;
    userId: number;
}

interface State {
    loading: boolean;
    roles: string[];
    showDialog: string;
    userProperties: {};
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
        const { userId, isSelf } = this.props;

        if (userId) {
            this.setState(() => ({ loading: true }));

            if (isSelf) {
                getUserProperties(userId)
                    .then(response => {
                        this.setState(() => ({ userProperties: response.props, loading: false }));
                    })
                    .catch(() => {
                        this.setState(() => ({ userProperties: undefined, loading: false }));
                    });
            } else {
                selectRowsUserProps(userId)
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
                    {!!hasPassword && <UserDetailRow label="Has Password" value={hasPassword.toString()} />}
                    <EffectiveRolesList {...this.props} />
                    <GroupsListing groups={caseInsensitive(userProperties, 'groups')} />
                </>
            );
        }

        return <div>No user selected.</div>;
    }

    renderHeader() {
        const {loading, userProperties} = this.state;
        if (loading || !userProperties) return 'User Details';

        const displayName = caseInsensitive(userProperties, 'displayName');
        const active = caseInsensitive(userProperties, 'active');

        return (
            <>
                <span>{displayName}</span>
                {!!active && (
                    <span className={classNames('margin-left status-pill', {
                            'active': active,
                            'inactive': !active
                        }
                    )}>{active ? 'Active' : 'Inactive'}</span>
                )}
            </>
        )
    }

    render() {
        const { userId, allowDelete, allowResetPassword, toggleDetailsModal, onUsersStateChangeComplete } = this.props;
        const { showDialog, userProperties } = this.state;
        const isSelf = userId === getServerContext().user.id;

        if (toggleDetailsModal) {
            return (
                <Modal onHide={toggleDetailsModal} show={true}>
                    <Modal.Header closeButton>
                        <Modal.Title>{this.renderHeader()}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{this.renderBody()}</Modal.Body>
                </Modal>
            );
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
