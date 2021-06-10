/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component, ReactNode } from 'react';
import { List, Map } from 'immutable';
import { Row, Col } from 'react-bootstrap';
import { User as IUser } from '@labkey/api';

import { AppURL, capitalizeFirstChar, getUsersWithPermissions, Grid, GridColumn, LoadingSpinner, User } from '../../..';

import { AuditDetailsModel } from './models';
import { getEventDataValueDisplay } from './utils';

interface Props {
    user: User;
    rowId: number;
    title?: string;
    emptyMsg?: string;
    summary?: string;
    hasUserField?: boolean;
    gridData?: List<Map<string, any>>;
    changeDetails?: AuditDetailsModel;
    fieldValueRenderer?: (label, value, displayValue) => any;
    gridColumnRenderer?: (data: any, row: any, displayValue: any) => any;
}

interface State {
    users: List<IUser>;
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
            users: undefined,
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

    init = (): void => {
        const { hasUserField, rowId, user } = this.props;

        if (!rowId) return;

        if (hasUserField) {
            getUsersWithPermissions()
                .then(users => {
                    this.setState({ users });
                })
                .catch(() => {
                    console.error('Unable to retrieve user data for display.');
                    this.setState(() => ({ users: List<IUser>() }));
                });
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
            let targetUser: IUser = null;
            if (users) {
                targetUser = users.find(user => user.userId === parseInt(value));
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

    getUserDisplay(userId: number, showUserLink: boolean) {
        const user = this.state.users?.find(u => u.userId === userId);

        if (user) {
            const link = AppURL.create('q', 'core', 'siteusers', userId).toHref();
            return showUserLink ? <a href={link}>{user.displayName}</a> : <span>{user.displayName}</span>;
        } else {
            // user may have been deleted
            return (
                <span className="empty-section" title="User deleted from server">
                    {'<' + userId + '>'}
                </span>
            );
        }
    }

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

        if (!rowId) {
            return <div>{emptyMsg}</div>;
        }

        if (hasUserField && !this.state.users) {
            return <LoadingSpinner />;
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
