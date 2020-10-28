/*
 * Copyright (c) 2016-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS, Map, Record, List } from 'immutable';

import { App } from '../../..';

export class AuditDetailsModel extends Record({
    rowId: undefined,
    comment: undefined,
    eventUserId: undefined,
    eventDateFormatted: undefined,
    oldData: undefined,
    newData: undefined,
}) {
    rowId?: number;
    comment?: string;
    eventUserId?: number;
    eventDateFormatted?: string;
    oldData?: Map<string, string>;
    newData?: Map<string, string>;

    static create(raw: any): AuditDetailsModel {
        return new AuditDetailsModel({
            ...raw,
            oldData: raw.oldData ? fromJS(raw.oldData) : undefined,
            newData: raw.newData ? fromJS(raw.newData) : undefined,
        });
    }

    getActionLabel(): string {
        if (this.isUpdate()) return 'Updated';
        else if (this.isInsert()) return 'Created';
        else if (this.isDelete()) return 'Deleted';
        else return 'Updated';
    }

    isUpdate(): boolean {
        return this.oldData && this.newData && this.oldData.size > 0 && this.newData.size > 0;
    }

    isInsert(): boolean {
        return this.oldData && this.newData && this.oldData.size === 0 && this.newData.size > 0;
    }

    isDelete(): boolean {
        return this.oldData && this.newData && this.oldData.size > 0 && this.newData.size === 0;
    }
}

export class TimelineEventModel extends Record({
    rowId: undefined,
    eventType: undefined,
    summary: undefined,
    user: undefined,
    eventUserId: undefined,
    timestamp: undefined,
    eventTimestamp: undefined,
    entity: undefined,
    metadata: undefined,
    oldData: undefined,
    newData: undefined,
}) {
    rowId?: number;
    eventType?: string;
    summary?: string;
    user?: Map<string, any>;
    eventUserId?: number;
    timestamp?: Map<string, any>;
    eventTimestamp?: any;
    entity?: Map<string, any>;
    metadata?: List<Map<string, any>>;
    oldData?: Map<string, string>;
    newData?: Map<string, string>;

    constructor(values?: { [key: string]: any }) {
        super(values);
    }

    getRowKey() {
        return this.eventType + '|' + this.rowId;
    }

    // timezoneStr used for jest test only, to accommodate teamcity timezone difference
    static create(raw: any, timezoneStr?: string): TimelineEventModel {
        const fields = {} as TimelineEventModel;
        fields.rowId = raw['rowId'];
        fields.eventType = raw['eventType'];
        fields.summary = raw['summary'];
        fields.user = fromJS(raw['user']);
        fields.eventUserId = raw['user']['value'];
        fields.timestamp = fromJS(raw['timestamp']);
        if (raw['timestamp']['value'])
            fields.eventTimestamp = timezoneStr
                ? new Date(raw['timestamp']['value'] + ' ' + timezoneStr)
                : new Date(raw['timestamp']['value']);
        fields.entity = fromJS(raw['entity']);

        if (raw.metadata) {
            const metaRows = [];
            for (const [key, value] of Object.entries(raw.metadata)) {
                metaRows.push({ field: key, value: fromJS(value) });
            }
            fields.metadata = fromJS(metaRows);
        }

        if (raw.oldData) fields.oldData = fromJS(raw.oldData);
        if (raw.newData) fields.newData = fromJS(raw.newData);

        return new TimelineEventModel(fields);
    }

    getAuditDetailsModel(): AuditDetailsModel {
        if (!this.oldData && !this.newData) return undefined;

        return new AuditDetailsModel({
            rowId: this.rowId,
            oldData: this.oldData,
            newData: this.newData,
        });
    }

    isSameEntity(event: TimelineEventModel): boolean {
        return this.entity && event.entity && this.entity.get('value') === event.entity.get('value');
    }

    getComment(): string {
        if (!this.metadata) return undefined;
        const commentField = this.metadata.find(metadataRow => metadataRow.get('field').toLowerCase() === 'comment');
        if (commentField) return commentField.get('value');
        return undefined;
    }

    getIcon(): string {
        let icon = this.eventType;

        if (App.ASSAYS_KEY === this.eventType) icon = 'assay';
        else if (this.eventType === 'inventory') {
            const summary = this.summary.toLowerCase();
            if (summary.indexOf('added to') > -1) icon = 'storage_insert';
            else if (summary.indexOf('discarded') > -1) icon = 'storage_remove';
            else if (summary.indexOf('checked in') > -1) icon = 'storage_checkin';
            else if (summary.indexOf('checked out') > -1) icon = 'storage_checkout';
            else if (summary.indexOf('moved') > -1) icon = 'storage_move';
            // for storage update events not associated with check in, use samples icon
            else icon = App.SAMPLES_KEY;
        }

        return icon;
    }
}

export interface TimelineGroupedEventInfo {
    firstEvent: TimelineEventModel;
    lastEvent: TimelineEventModel;
    isCompleted: boolean;
}
