/*
 * Copyright (c) 2020-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { ASSAYS_KEY, SAMPLES_KEY } from '../../app/constants';
import { ExtendedMap } from '../../../public/ExtendedMap';

import { getAuditDetailMap } from './utils';

export class AuditDetailsModel {
    readonly comment?: string;
    readonly eventDateFormatted?: string;
    readonly eventUserId?: number;
    readonly newData?: ExtendedMap<string, string>;
    readonly oldData?: ExtendedMap<string, string>;
    readonly providedDeltaValues?: Record<string, string>;
    readonly providedValues?: Record<string, string>;
    readonly rowId?: number;
    readonly userComment?: string;

    constructor(values?: Partial<AuditDetailsModel>) {
        Object.assign(this, values);
    }

    static create(raw: any): AuditDetailsModel {
        return new AuditDetailsModel({
            comment: raw.comment,
            eventDateFormatted: raw.eventDateFormatted,
            eventUserId: raw.eventUserId,
            newData: raw.newData ? new ExtendedMap<string, string>(raw.newData) : undefined,
            oldData: raw.oldData ? new ExtendedMap<string, string>(raw.oldData) : undefined,
            providedDeltaValues: raw.providedDeltaValues,
            providedValues: raw.providedValues,
            rowId: raw.rowId,
            userComment: raw.userComment,
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

export interface TimelineMetadataRow {
    field: string;
    value: any;
}

export class TimelineEventModel {
    readonly entity?: Record<string, any>;
    readonly entitySeparator?: string;
    readonly eventTimestamp?: Date;
    readonly eventType?: string; // sample, assay, workflow, inventory, etc
    readonly eventUserId?: number;
    readonly metadata?: TimelineMetadataRow[];
    readonly newData?: ExtendedMap<string, string>;
    readonly oldData?: ExtendedMap<string, string>;
    readonly providedDeltaValues?: Record<string, string>; // field name to user-provided values used to alter the value
    readonly providedValues?: Record<string, string>; // field name to user-provided values that were converted
    readonly rowId?: number;
    readonly subEventType?: string; // for example, inventory item vs inventory storage location
    readonly summary?: string;
    readonly timestamp?: Record<string, any>;
    readonly user?: Record<string, any>;
    readonly userComment?: string;

    constructor(values?: Partial<TimelineEventModel>) {
        Object.assign(this, values);
        this.entitySeparator ??= ' - ';
    }

    getRowKey() {
        return this.eventType + '|' + this.rowId;
    }

    // timezoneStr used for jest test only, to accommodate teamcity timezone difference
    static create(raw: any, timezoneStr?: string, inheritedFieldKeys?: string[]): TimelineEventModel {
        let eventTimestamp: Date;
        if (raw.timestamp.value)
            eventTimestamp = timezoneStr
                ? new Date(raw.timestamp.value + ' ' + timezoneStr)
                : new Date(raw.timestamp.value);

        return new TimelineEventModel({
            entity: raw.entity,
            entitySeparator: raw.entitySeparator,
            eventTimestamp,
            eventType: raw.eventType,
            eventUserId: raw.user?.value,
            metadata: raw.metadata
                ? Object.entries(raw.metadata).map(([field, value]) => ({ field, value }))
                : undefined,
            newData: raw.newData ? getAuditDetailMap(raw.newData, inheritedFieldKeys) : undefined,
            oldData: raw.oldData ? getAuditDetailMap(raw.oldData, inheritedFieldKeys) : undefined,
            providedDeltaValues: raw.providedDeltaValues,
            providedValues: raw.providedValues,
            rowId: raw.rowId,
            subEventType: raw.subEventType,
            summary: raw.summary,
            timestamp: raw.timestamp,
            user: raw.user,
            userComment: raw.userComment,
        });
    }

    getAuditDetailsModel(): AuditDetailsModel {
        if (!this.oldData && !this.newData) return undefined;

        return new AuditDetailsModel({
            rowId: this.rowId,
            oldData: this.oldData,
            newData: this.newData,
            providedValues: this.providedValues,
            providedDeltaValues: this.providedDeltaValues,
            userComment: this.userComment,
        });
    }

    isSameEntity(event: TimelineEventModel): boolean {
        return !!this.entity && !!event.entity && this.entity.value === event.entity.value;
    }

    getComment(): string {
        return this.metadata?.find(row => row.field.toLowerCase() === 'reason')?.value;
    }

    getIcon(): string {
        let icon = this.eventType;

        if (ASSAYS_KEY === this.eventType) icon = 'assay';
        else if (this.eventType === 'inventory') {
            const summary = this.summary.toLowerCase();
            if (summary.indexOf('added to') > -1 || summary.indexOf('added location') > -1) icon = 'storage_insert';
            else if (summary.indexOf('removed') > -1 || summary.indexOf('location deleted') > -1)
                icon = 'storage_remove';
            else if (summary.indexOf('checked in') > -1) icon = 'storage_checkin';
            else if (summary.indexOf('checked out') > -1) icon = 'storage_checkout';
            else if (summary.indexOf('moved') > -1) icon = 'storage_move';
            // for storage update events not associated with check in, use samples icon
            else icon = SAMPLES_KEY;
        }

        return icon;
    }
}

export interface TimelineGroupedEventInfo {
    firstEvent: TimelineEventModel;
    isCompleted: boolean;
    lastEvent: TimelineEventModel;
}
