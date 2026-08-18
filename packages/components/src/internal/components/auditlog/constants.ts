/*
 * Copyright (c) 2022-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Query } from '@labkey/api';

export type AuditQuery = {
    containerFilter?: Query.ContainerFilter;
    hasDetail?: boolean;
    hasTransactionId?: boolean;
    /** Indicates that the audit event is backed by a query update event. */
    isQueryUpdateEvent?: boolean;
    label: string;
    value: string;
};

export const AUDIT_EVENT_TYPE_PARAM = 'eventType';

export const ATTACHMENT_AUDIT_QUERY: AuditQuery = { label: 'Attachment Events', value: 'AttachmentAuditEvent' };
export const DOMAIN_AUDIT_QUERY: AuditQuery = { label: 'Domain Events', value: 'DomainAuditEvent' };
export const DOMAIN_PROPERTY_AUDIT_QUERY: AuditQuery = {
    label: 'Domain Property Events',
    value: 'DomainPropertyAuditEvent',
};
export const QUERY_UPDATE_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    label: 'Query Update Events',
    value: 'QueryUpdateAuditEvent',
};

export const DATACLASS_DATA_UPDATE_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    isQueryUpdateEvent: true,
    label: 'Data Update Events',
    value: 'DataClassDataAuditEvent',
};

export const INVENTORY_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    label: 'Storage Management Events',
    value: 'InventoryAuditEvent',
};
export const LIST_AUDIT_QUERY: AuditQuery = { hasTransactionId: true, label: 'List Events', value: 'ListAuditEvent' };
export const GRID_VIEW_AUDIT_EVENT: AuditQuery = {
    label: 'Grid View Events',
    value: 'GridViewAuditEvent',
};
export const GROUP_AUDIT_QUERY: AuditQuery = {
    containerFilter: Query.ContainerFilter.allFolders,
    label: 'Roles and Assignment Events',
    value: 'GroupAuditEvent',
};
export const CONTAINER_AUDIT_QUERY: AuditQuery = {
    containerFilter: Query.ContainerFilter.allFolders,
    label: 'Folder Events',
    value: 'ContainerAuditEvent',
};
export const SAMPLE_TYPE_AUDIT_QUERY: AuditQuery = {
    hasTransactionId: true,
    label: 'Sample Type Events',
    value: 'SampleSetAuditEvent',
};
export const SAMPLE_TIMELINE_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    label: 'Sample Timeline Events',
    value: 'SampleTimelineEvent',
};
export const USER_AUDIT_QUERY: AuditQuery = {
    containerFilter: Query.ContainerFilter.allFolders,
    label: 'User Events',
    value: 'UserAuditEvent',
};
export const ASSAY_AUDIT_QUERY: AuditQuery = {
    hasTransactionId: true,
    label: 'Assay Events',
    value: 'AssayAuditEvent',
};
export const ASSAY_RESULT_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    isQueryUpdateEvent: true,
    label: 'Assay Result Events',
    value: 'AssayResultAuditEvent',
};
export const WORKFLOW_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    label: 'Workflow Events',
    value: 'SamplesWorkflowAuditEvent',
};
export const SOURCE_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    isQueryUpdateEvent: true,
    label: 'Sources Events',
    value: 'SourcesAuditEvent',
};

export const NOTEBOOK_AUDIT_QUERY: AuditQuery = { label: 'Notebook Events', value: 'LabBookEvent' };
export const NOTEBOOK_REVIEW_AUDIT_QUERY: AuditQuery = { label: 'Notebook Review Events', value: 'NotebookEvent' };
export const REGISTRY_AUDIT_QUERY: AuditQuery = {
    hasTransactionId: true,
    label: 'Registry Events',
    value: 'RegistryEvent',
};
export const REPORT_AUDIT_QUERY: AuditQuery = { label: 'Report Events', value: 'ReportEvent' };

export const FILE_SYSTEM_AUDIT_QUERY: AuditQuery = {
    hasTransactionId: true,
    label: 'File Events',
    value: 'FileSystem',
};

export const PLATE_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    label: 'Plate Events',
    value: 'PlateEvent',
};

export const PLATE_DATA_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    isQueryUpdateEvent: true,
    label: 'Plate Data Events',
    value: 'PlateDataAuditEvent',
};

export const PLATE_SET_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    label: 'Plate Set Events',
    value: 'PlateSetEvent',
};

// Events live in the root container, so the grid needs to look outside the current folder to find them
export const SYSTEM_UPGRADE_AUDIT_QUERY: AuditQuery = {
    containerFilter: Query.ContainerFilter.allFolders,
    label: 'System Upgrade events',
    value: 'SystemUpgradeAuditEvent',
};

export const COMMON_AUDIT_QUERIES: AuditQuery[] = [
    ATTACHMENT_AUDIT_QUERY,
    DOMAIN_AUDIT_QUERY,
    DOMAIN_PROPERTY_AUDIT_QUERY,
    FILE_SYSTEM_AUDIT_QUERY,
    GRID_VIEW_AUDIT_EVENT,
    GROUP_AUDIT_QUERY,
    INVENTORY_AUDIT_QUERY,
    LIST_AUDIT_QUERY,
    QUERY_UPDATE_AUDIT_QUERY,
    SAMPLE_TYPE_AUDIT_QUERY,
    SAMPLE_TIMELINE_AUDIT_QUERY,
    SYSTEM_UPGRADE_AUDIT_QUERY,
    USER_AUDIT_QUERY,
];

export const EXPERIMENT_AUDIT_EVENT = 'ExperimentAuditEvent';

export const AUDIT_DETAIL_FIELD_VALUE_INHERITED = '$$aliquot-inherited-field$$';
