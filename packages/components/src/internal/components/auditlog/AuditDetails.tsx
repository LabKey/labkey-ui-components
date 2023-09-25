/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component, ReactNode } from 'react';
import { List, Map } from 'immutable';
import { Row, Col } from 'react-bootstrap';

import { User } from '../base/models/User';
import { capitalizeFirstChar } from '../../util/utils';
import { GridColumn } from '../base/models/GridColumn';
import { Grid } from '../base/Grid';

import { UserLink } from '../user/UserLink';

import { getEventDataValueDisplay } from './utils';
import { AuditDetailsModel } from './models';

interface Props {
    changeDetails?: AuditDetailsModel;
    emptyMsg?: string;
    fieldValueRenderer?: (label, value, displayValue) => any;
    gridColumnRenderer?: (data: any, row: any, displayValue: any) => any;
    gridData?: List<Map<string, any>>;
    rowId?: number;
    summary?: string;
    title?: string;
    user: User;
}

export class AuditDetails extends Component<Props> {
    static defaultProps = {
        title: 'Audit Event Details',
        emptyMsg: 'No audit event selected.',
    };

    static isUserFieldLabel(field: string): boolean {
        return ['created by', 'createdby', 'modified by', 'modifiedby'].indexOf(field.toLowerCase()) > -1;
    }

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
        const { fieldValueRenderer } = this.props;

        let displayVal: any = value;
        if (value == null || value === '') displayVal = 'NA';

        if (AuditDetails.isUserFieldLabel(field) && value !== undefined) {
            displayVal = <UserLink userId={parseInt(value, 10)} />;
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
                    <span className="audit-detail-row-label right-spacing">{capitalizeFirstChar(field)}</span>
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
                    if (row.get('isUser')) {
                        display = <UserLink userId={row.get('value')} />;
                    } else if (Map.isMap(data) && data.get('urlType') === 'user') {
                        display = <UserLink userId={data.get('value')} userDisplayValue={data.get('displayValue')} />;
                    } else {
                        display = getEventDataValueDisplay(data, user.isAdmin);
                    }

                    if (gridColumnRenderer) display = gridColumnRenderer(data, row, display);

                    return display;
                },
            }),
        ]);
    };

    renderBody() {
        const { gridData, changeDetails, rowId, summary, emptyMsg } = this.props;

        if (!rowId) {
            return <div>{emptyMsg}</div>;
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
