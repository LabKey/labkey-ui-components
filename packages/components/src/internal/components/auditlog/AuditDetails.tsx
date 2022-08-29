/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component, ReactNode } from 'react';
import { List, Map } from 'immutable';
import { Row, Col } from 'react-bootstrap';
import { User as IUser } from '@labkey/api';

import { User } from '../base/models/User';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { getUsersWithPermissions } from '../forms/actions';
import { resolveErrorMessage } from '../../util/messaging';
import { AppURL } from '../../url/AppURL';
import { capitalizeFirstChar } from '../../util/utils';
import { GridColumn } from '../base/models/GridColumn';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { Grid } from '../base/Grid';

import { getEventDataValueDisplay } from './utils';
import { AuditDetailsModel } from './models';

interface Props {
    changeDetails?: AuditDetailsModel;
    emptyMsg?: string;
    fieldValueRenderer?: (label, value, displayValue) => any;
    gridColumnRenderer?: (data: any, row: any, displayValue: any) => any;
    gridData?: List<Map<string, any>>;
    hasUserField?: boolean;
    rowId: number;
    summary?: string;
    title?: string;
    user: User;
}

interface State {
    users: IUser[];
    usersError: string;
    usersLoadingState: LoadingState;
}

export class AuditDetails extends Component<Props, State> {
    static defaultProps = {
        title: 'Audit Event Details',
        emptyMsg: 'No audit event selected.',
    };

    static isUserFieldLabel(field: string): boolean {
        return ['createdby', 'modifiedby'].indexOf(field.toLowerCase()) > -1;
    }

    constructor(props: Props) {
        super(props);

        this.state = {
            users: [],
            usersError: undefined,
            usersLoadingState: LoadingState.INITIALIZED,
        };
    }

    componentDidMount = (): void => {
        this.init();
    };

    componentDidUpdate = (prevProps: Readonly<Props>): void => {
        if (prevProps.rowId !== this.props.rowId) {
            this.init();
        }
    };

    getUserById = (userId: number): IUser => {
        return this.state.users.find(u => u.userId === userId);
    };

    init = async (): Promise<void> => {
        const { hasUserField, rowId } = this.props;

        if (!rowId) return;

        if (hasUserField) {
            this.setState({ usersError: undefined, usersLoadingState: LoadingState.LOADING });

            try {
                const users = await getUsersWithPermissions();
                this.setState({ users });
            } catch (e) {
                this.setState({
                    users: [],
                    usersError: resolveErrorMessage(e) ?? 'Failed to load users',
                });
            }

            this.setState({ usersLoadingState: LoadingState.LOADED });
        }
    };

    renderUpdateValue = (oldVal: string, newVal: string): ReactNode => {
        const changed = oldVal !== newVal;
        const oldDisplay = <span className="display-light old-audit-value right-spacing">{oldVal}</span>;

        if (!changed) return oldDisplay;

        return (
            <>
                {oldDisplay}
                <i className="fa fa-long-arrow-right right-spacing" />
                <span className="new-audit-value">{newVal}</span>
            </>
        );
    };

    renderInsertValue(oldVal: string, newVal: string) {
        return <span className="new-audit-value">{newVal}</span>;
    }

    renderDeleteValue(oldVal: string, newVal: string) {
        return <span className="display-light old-audit-value">{oldVal}</span>;
    }

    getValueDisplay = (field: string, value: string): any => {
        const { fieldValueRenderer, user } = this.props;
        const { users } = this.state;

        let displayVal: any = value;
        if (value == null || value === '') displayVal = 'NA';

        if (AuditDetails.isUserFieldLabel(field)) {
            let targetUser: IUser;
            if (users) {
                const userId = parseInt(value, 10);
                if (!isNaN(userId)) {
                    targetUser = this.getUserById(userId);
                }
            }

            if (targetUser) {
                const link = AppURL.create('q', 'core', 'siteusers', value).toHref();
                displayVal = user.isAdmin ? <a href={link}>{targetUser.displayName}</a> : targetUser.displayName;
            }
        }

        if (fieldValueRenderer) displayVal = fieldValueRenderer(field, value, displayVal);

        return displayVal;
    };

    renderRow(field: string, oldVal: string, newVal: string, isUpdate: boolean, isInsert: boolean) {
        const { user } = this.props;

        let valueRenderer;
        if (isUpdate) valueRenderer = this.renderUpdateValue;
        else if (isInsert) valueRenderer = this.renderInsertValue;
        else valueRenderer = this.renderDeleteValue;

        if (!user.isSignedIn && AuditDetails.isUserFieldLabel(field)) return null;

        return (
            <Row className="margin-bottom" key={field}>
                <Col className="left-spacing right-spacing">
                    <span className="audit-detail-row-label right-spacing">{capitalizeFirstChar(field)}:</span>
                </Col>
                <Col className="left-spacing right-spacing">
                    {valueRenderer(this.getValueDisplay(field, oldVal), this.getValueDisplay(field, newVal))}
                </Col>
            </Row>
        );
    }

    renderChanges() {
        const { changeDetails } = this.props;

        const isUpdate = changeDetails.isUpdate();
        const isInsert = changeDetails.isInsert();
        const usedFields = [];

        let oldFields, newFields;
        if (changeDetails.oldData) {
            oldFields = changeDetails.oldData.entrySeq().map(([field, value]) => {
                let newValue;
                if (changeDetails.newData) {
                    newValue = changeDetails.newData.get(field);
                    usedFields.push(field);
                }

                return this.renderRow(field, value, newValue, isUpdate, isInsert);
            });
        }

        if (changeDetails.newData) {
            newFields = changeDetails.newData.entrySeq().map(([field, value]) => {
                if (usedFields.indexOf(field) >= 0) return null;

                return this.renderRow(field, undefined, value, isUpdate, isInsert);
            });
        }

        return (
            <>
                {oldFields}
                {newFields}
            </>
        );
    }

    getUserDisplay = (userId: number, showUserLink: boolean): ReactNode => {
        const user = this.getUserById(userId);

        if (user) {
            const link = AppURL.create('q', 'core', 'siteusers', userId).toHref();
            return showUserLink ? <a href={link}>{user.displayName}</a> : <span>{user.displayName}</span>;
        }

        // user may have been deleted
        return (
            <span className="empty-section" title="User deleted from server">
                {'<' + userId + '>'}
            </span>
        );
    };

    getGridColumns = (): List<GridColumn> => {
        const { user, gridColumnRenderer } = this.props;
        return List<GridColumn>([
            new GridColumn({
                index: 'field',
                title: 'Field',
                showHeader: false,
            }),
            new GridColumn({
                index: 'value',
                title: 'Value',
                showHeader: false,
                cell: (data, row) => {
                    let display;
                    if (row.get('isUser')) display = this.getUserDisplay(data, user.isAdmin);
                    else display = getEventDataValueDisplay(data, user.isAdmin);

                    if (gridColumnRenderer) display = gridColumnRenderer(data, row, display);

                    return display;
                },
            }),
        ]);
    };

    renderBody() {
        const { gridData, changeDetails, rowId, summary, hasUserField, emptyMsg } = this.props;
        const { usersError, usersLoadingState } = this.state;

        if (!rowId) {
            return <div>{emptyMsg}</div>;
        }

        if (hasUserField) {
            if (usersError) {
                return <Alert>{usersError}</Alert>;
            } else if (isLoading(usersLoadingState)) {
                return <LoadingSpinner />;
            }
        }

        return (
            <>
                {summary && (
                    <Row className="margin-bottom display-light">
                        <Col xs={12}>{summary}</Col>
                    </Row>
                )}
                {gridData && <Grid data={gridData} columns={this.getGridColumns()} showHeader={false} />}
                {changeDetails && this.renderChanges()}
            </>
        );
    }

    render() {
        const { title } = this.props;

        return (
            <div className="panel panel-default">
                <div className="panel-heading">{title}</div>
                <div className="panel-body">{this.renderBody()}</div>
            </div>
        );
    }
}
