/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { List, Map, OrderedMap } from 'immutable';
import { Col, Row } from 'react-bootstrap';
import { ActionURL } from '@labkey/api';

import { QueryInfoForm } from '../forms/QueryInfoForm';
import {
    Alert,
    FileInput,
    getActionErrorMessage,
    getQueryDetails,
    LoadingSpinner,
    QueryInfo,
    QueryColumn,
    SCHEMAS,
    User,
} from '../../..';

import { getUserDetailsRowData, updateUserDetails } from './actions';

const FIELDS_TO_EXCLUDE = List<string>([
    'userid',
    'owner',
    'groups',
    'lastlogin',
    'haspassword',
    'phone',
    'mobile',
    'pager',
    'im',
    'avatar',
]);
const DISABLED_FIELDS = List<string>(['email']);
const USER_AVATAR_FILE = 'user_avatar_file';
const DEFAULT_AVATAR_PATH = '/_images/defaultavatar.png';

interface State {
    queryInfo: QueryInfo;
    avatar: File;
    removeCurrentAvatar: boolean;
    reloadRequired: boolean;
    hasError: boolean;
}

interface Props {
    user: User;
    userProperties: Map<string, any>;
    onSuccess: (result: {}, shouldReload: boolean) => any;
    onCancel: () => any;
}

export class UserProfile extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            queryInfo: undefined,
            avatar: undefined,
            removeCurrentAvatar: false,
            reloadRequired: false,
            hasError: false,
        };
    }

    componentDidMount() {
        getQueryDetails(SCHEMAS.CORE_TABLES.USERS)
            .then(queryInfo => {
                this.setState(() => ({ queryInfo }));
            })
            .catch(reason => {
                console.error(reason);
                this.setState(() => ({ hasError: true }));
            });
    }

    getUpdateQueryInfo(): QueryInfo {
        const { queryInfo } = this.state;
        let updateColumns = queryInfo.columns.filter(column => {
            return column.userEditable && !FIELDS_TO_EXCLUDE.contains(column.fieldKey.toLowerCase());
        });

        // make sure all columns are set as shownInInsertView
        updateColumns = updateColumns.map(col => col.set('shownInInsertView', true) as QueryColumn);

        return queryInfo.set('columns', updateColumns) as QueryInfo;
    }

    onAvatarFileChange = (files: {}) => {
        this.setState(() => ({ avatar: files[USER_AVATAR_FILE] }));
    };

    removeCurrentAvatar = () => {
        this.setState(() => ({ removeCurrentAvatar: true }));
    };

    submitUserDetails = (data: OrderedMap<string, any>): Promise<any> => {
        const { user } = this.props;
        const avatar = this.state.avatar || (this.state.removeCurrentAvatar ? null : undefined);

        // Issue 39225: don't submit empty string for required DisplayName
        const displayName = data.get('DisplayName');
        if (displayName.trim() === '') {
            return Promise.reject({ exception: 'Missing required value for Display Name.' });
        }

        // need to reload the page if the avatar changes or is removed since that is coming from LABKEY.user on page load
        if (avatar !== undefined) {
            this.setState(() => ({ reloadRequired: true }));
        }

        return updateUserDetails(SCHEMAS.CORE_TABLES.USERS, getUserDetailsRowData(user, data, avatar));
    };

    onSuccess = (result: {}) => {
        this.props.onSuccess(result, this.state.reloadRequired);
    };

    renderSectionTitle(title: string) {
        return <p className="user-section-header">{title}</p>;
    }

    renderForm() {
        const { user, userProperties, onCancel } = this.props;
        const { queryInfo, removeCurrentAvatar } = this.state;
        const isDefaultAvatar = !user.avatar || user.avatar.indexOf(DEFAULT_AVATAR_PATH) > -1;

        return (
            <>
                <Row>
                    <Col sm={3} xs={12}>
                        {this.renderSectionTitle('Avatar')}
                    </Col>
                    <Col sm={2} xs={12}>
                        <img
                            src={removeCurrentAvatar ? ActionURL.getContextPath() + DEFAULT_AVATAR_PATH : user.avatar}
                            className="detail__header-icon"
                        />
                    </Col>
                    <Col sm={7} xs={12}>
                        <>
                            <FileInput
                                key={USER_AVATAR_FILE}
                                showLabel={false}
                                name={USER_AVATAR_FILE}
                                onChange={this.onAvatarFileChange}
                            />
                            {!isDefaultAvatar && !removeCurrentAvatar && (
                                <div>
                                    <a className="user-text-link" onClick={this.removeCurrentAvatar}>
                                        Delete Current Avatar
                                    </a>
                                </div>
                            )}
                        </>
                    </Col>
                </Row>
                <Row>
                    <Col xs={12}>
                        <hr />
                    </Col>
                </Row>
                {this.renderSectionTitle('User Details')}
                <QueryInfoForm
                    queryInfo={this.getUpdateQueryInfo()}
                    schemaQuery={queryInfo.schemaQuery}
                    fieldValues={userProperties.toJS()}
                    includeCountField={false}
                    submitText="Save"
                    isSubmittedText="Saving..."
                    onSubmit={this.submitUserDetails}
                    onSuccess={this.onSuccess}
                    onHide={onCancel}
                    disabledFields={DISABLED_FIELDS}
                    showErrorsAtBottom={true}
                />
            </>
        );
    }

    render() {
        const { hasError, queryInfo } = this.state;

        return (
            <>
                {hasError ? (
                    <Alert>{getActionErrorMessage('There was a problem loading your user profile', 'profile')}</Alert>
                ) : !queryInfo ? (
                    <LoadingSpinner />
                ) : (
                    this.renderForm()
                )}
            </>
        );
    }
}
