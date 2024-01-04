/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent, ReactNode } from 'react';
import { List, OrderedMap } from 'immutable';
import { Col, Row } from 'react-bootstrap';
import { ActionURL, PermissionTypes } from '@labkey/api';

import { QueryInfoForm } from '../forms/QueryInfoForm';

import { QueryInfo } from '../../../public/QueryInfo';
import { hasPermissions, User } from '../base/models/User';
import { SCHEMAS } from '../../schemas';
import { insertColumnFilter, QueryColumn } from '../../../public/QueryColumn';
import { FileInput } from '../forms/input/FileInput';
import { Alert } from '../base/Alert';
import { getActionErrorMessage, resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { caseInsensitive } from '../../util/utils';

import { GroupsList } from '../permissions/GroupsList';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { getUserDetailsRowData } from './actions';

const FIELDS_TO_EXCLUDE = List<string>([
    'userid',
    'owner',
    'groups',
    'lastlogin',
    'lastactivity',
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
    avatar: File;
    groups: [{ displayValue: string; value: number }];
    hasError: boolean;
    queryInfo: QueryInfo;
    reloadRequired: boolean;
    removeCurrentAvatar: boolean;
}

interface Props {
    api?: ComponentsAPIWrapper;
    onSuccess: (result: {}, shouldReload: boolean) => void;
    setIsDirty: (isDirty: boolean) => void;
    user: User;
    userProperties: Record<string, any>;
}

export class UserProfile extends PureComponent<Props, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
    };

    constructor(props: Props) {
        super(props);

        this.state = {
            queryInfo: undefined,
            avatar: undefined,
            removeCurrentAvatar: false,
            reloadRequired: false,
            hasError: false,
            groups: undefined,
        };
    }

    componentDidMount = async (): Promise<void> => {
        const { user, api } = this.props;

        try {
            const queryInfo = await api.query.getQueryDetails(SCHEMAS.CORE_TABLES.USERS);
            this.setState(() => ({ queryInfo }));
        } catch (e) {
            console.error(e.message);
            this.setState(() => ({ hasError: true }));
        }

        if (hasPermissions(user, [PermissionTypes.CanSeeUserDetails])) {
            try {
                const response = await api.security.getUserPropertiesForOther(user.id);
                const groups = caseInsensitive(response, 'Groups');
                this.setState(() => ({ groups }));
            } catch (e) {
                console.error(resolveErrorMessage(e) ?? 'Failed to load group data');
                this.setState(() => ({ hasError: true }));
            }
        }
    };

    columnFilter = (col: QueryColumn): boolean => {
        // make sure all columns are set as shownInInsertView and those that are marked as editable are not also readOnly.
        // Issue 47532 We want users to be able to update the fields on their own profile page, even if only readers
        const _col = col.mutate({ shownInInsertView: true, readOnly: !col.userEditable });
        return insertColumnFilter(_col) && !FIELDS_TO_EXCLUDE.contains(_col.fieldKey.toLowerCase());
    };

    footer(): ReactNode {
        const { user } = this.props;
        const { groups } = this.state;

        if (groups) {
            return (
                <div className="form-group row">
                    <label className="control-label col-sm-3 text-left col-xs-12"> Groups </label>
                    <div className="col-sm-9 col-md-9 col-xs-12">
                        <GroupsList currentUser={user} groups={groups} asRow={false} />
                    </div>
                </div>
            );
        }
    }

    onAvatarFileChange = (files: {}): void => {
        this.onFormChange();
        this.setState(() => ({ avatar: files[USER_AVATAR_FILE] }));
    };

    removeCurrentAvatar = (): void => {
        this.onFormChange();
        this.setState({ removeCurrentAvatar: true });
    };

    onFormChange = (): void => {
        this.props.setIsDirty(true);
    };

    submitUserDetails = (data: OrderedMap<string, any>): Promise<any> => {
        const { api, user } = this.props;
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

        return api.security.updateUserDetails(getUserDetailsRowData(user, data, avatar));
    };

    onSuccess = (result: {}): void => {
        this.props.onSuccess(result, this.state.reloadRequired);
    };

    render() {
        const { user, userProperties } = this.props;
        const { hasError, queryInfo, removeCurrentAvatar } = this.state;
        const isDefaultAvatar = !user.avatar || user.avatar.indexOf(DEFAULT_AVATAR_PATH) > -1;
        const isLoading = !queryInfo || !userProperties;
        const avatarSrc = removeCurrentAvatar ? ActionURL.getContextPath() + DEFAULT_AVATAR_PATH : user.avatar;

        return (
            <>
                {hasError && (
                    <Alert>{getActionErrorMessage('There was a problem loading your user profile', 'profile')}</Alert>
                )}
                {isLoading && <LoadingSpinner />}
                {!isLoading && (
                    <>
                        <Row>
                            <Col sm={3} xs={12}>
                                <p className="user-section-header">Avatar</p>
                            </Col>
                            <Col sm={2} xs={12}>
                                <img src={avatarSrc} className="detail__header-icon" />
                            </Col>
                            <Col sm={7} xs={12}>
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
                            </Col>
                        </Row>
                        <Row>
                            <Col xs={12}>
                                <hr />
                            </Col>
                        </Row>

                        <p className="user-section-header">User Details</p>

                        <QueryInfoForm
                            columnFilter={this.columnFilter}
                            queryInfo={queryInfo}
                            fieldValues={userProperties}
                            includeCountField={false}
                            submitText="Save"
                            isSubmittedText="Save"
                            isSubmittingText="Saving..."
                            onFormChange={this.onFormChange}
                            onSubmit={this.submitUserDetails}
                            onSuccess={this.onSuccess}
                            disabledFields={DISABLED_FIELDS}
                            footer={this.footer()}
                            stickyButtons={false}
                            showErrorsAtBottom
                        />
                    </>
                )}
            </>
        );
    }
}
