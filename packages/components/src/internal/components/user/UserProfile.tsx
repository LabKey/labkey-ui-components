/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent } from 'react';
import { List, OrderedMap } from 'immutable';
import { Col, Row } from 'react-bootstrap';
import { ActionURL, PermissionTypes } from '@labkey/api';

import { QueryInfoForm } from '../forms/QueryInfoForm';

import { QueryInfo } from '../../../public/QueryInfo';
import { User } from '../base/models/User';
import { getQueryDetails } from '../../query/api';
import { SCHEMAS } from '../../schemas';
import { insertColumnFilter, QueryColumn } from '../../../public/QueryColumn';
import { FileInput } from '../forms/input/FileInput';
import { Alert } from '../base/Alert';
import { getActionErrorMessage, resolveErrorMessage } from '../../util/messaging';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { getUserDetailsRowData, getUserGroups, updateUserDetails } from './actions';
import { hasPermissions } from "../../../entities/SampleListingPage";

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
    avatar: File;
    groups: string;
    hasError: boolean;
    queryInfo: QueryInfo;
    reloadRequired: boolean;
    removeCurrentAvatar: boolean;
}

interface Props {
    onCancel: () => void;
    onSuccess: (result: {}, shouldReload: boolean) => void;
    user: User;
    userProperties: Record<string, any>;
}

export class UserProfile extends PureComponent<Props, State> {
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
        getQueryDetails(SCHEMAS.CORE_TABLES.USERS)
            .then(queryInfo => {
                this.setState(() => ({ queryInfo }));
            })
            .catch(reason => {
                console.error(reason);
                this.setState(() => ({ hasError: true }));
            });

        if (hasPermissions(this.props.user, [PermissionTypes.CanSeeGroupDetails])) {
            try {
                const groupsResult = await getUserGroups(this.props.user.id);
                const groups = groupsResult.join(', ');
                this.setState(() => ({ groups }));
            } catch (e) {
                console.error(resolveErrorMessage(e) ?? 'Failed to load group data');
                this.setState(() => ({ hasError: true }));
            }
        }
    };

    columnFilter = (col: QueryColumn): boolean => {
        // make sure all columns are set as shownInInsertView and those that are marked as editable are not also readOnly
        const _col = col.merge({ shownInInsertView: true, readOnly: !col.get('userEditable') }) as QueryColumn;
        return insertColumnFilter(_col) && !FIELDS_TO_EXCLUDE.contains(_col.fieldKey.toLowerCase());
    };

    footer() {
        const { groups } = this.state;

        if (groups) {
            return (
                <div className="form-group row">
                    <label className="control-label col-sm-3 text-left col-xs-12"> Groups </label>
                    <div className="col-sm-9 col-md-9 col-xs-12"> {groups} </div>
                </div>
            );
        }
        return;
    }

    onAvatarFileChange = (files: {}): void => {
        this.setState(() => ({ avatar: files[USER_AVATAR_FILE] }));
    };

    removeCurrentAvatar = (): void => {
        this.setState({ removeCurrentAvatar: true });
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

    onSuccess = (result: {}): void => {
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
                    columnFilter={this.columnFilter}
                    queryInfo={queryInfo}
                    fieldValues={userProperties}
                    includeCountField={false}
                    submitText="Save"
                    isSubmittedText="Saving..."
                    onSubmit={this.submitUserDetails}
                    onSuccess={this.onSuccess}
                    onHide={onCancel}
                    disabledFields={DISABLED_FIELDS}
                    footer={this.footer()}
                    showErrorsAtBottom
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
