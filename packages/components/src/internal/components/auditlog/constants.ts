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

export const ATTACHMENT_AUDIT_QUERY: AuditQuery = { label: 'Attachment Events', value: 'attachmentauditevent' };
export const DOMAIN_AUDIT_QUERY: AuditQuery = { label: 'Domain Events', value: 'domainauditevent' };
export const DOMAIN_PROPERTY_AUDIT_QUERY: AuditQuery = {
    label: 'Domain Property Events',
    value: 'domainpropertyauditevent',
};
export const QUERY_UPDATE_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    label: 'Query Update Events',
    value: 'queryupdateauditevent',
};

export const DATACLASS_DATA_UPDATE_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    isQueryUpdateEvent: true,
    label: 'Data Update Events',
    value: 'dataclassdataauditevent',
};

export const INVENTORY_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    label: 'Storage Management Events',
    value: 'inventoryauditevent',
};
export const LIST_AUDIT_QUERY: AuditQuery = { hasTransactionId: true, label: 'List Events', value: 'listauditevent' };
export const GROUP_AUDIT_QUERY: AuditQuery = {
    containerFilter: Query.ContainerFilter.allFolders,
    label: 'Roles and Assignment Events',
    value: 'groupauditevent',
};
export const CONTAINER_AUDIT_QUERY: AuditQuery = {
    containerFilter: Query.ContainerFilter.allFolders,
    label: 'Folder Events',
    value: 'containerauditevent',
};
export const SAMPLE_TYPE_AUDIT_QUERY: AuditQuery = {
    hasTransactionId: true,
    label: 'Sample Type Events',
    value: 'samplesetauditevent',
};
export const SAMPLE_TIMELINE_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    label: 'Sample Timeline Events',
    value: 'sampletimelineevent',
};
export const USER_AUDIT_QUERY: AuditQuery = {
    containerFilter: Query.ContainerFilter.allFolders,
    label: 'User Events',
    value: 'userauditevent',
};
export const ASSAY_AUDIT_QUERY: AuditQuery = {
    hasTransactionId: true,
    value: 'assayauditevent',
    label: 'Assay Events',
};
export const ASSAY_RESULT_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    isQueryUpdateEvent: true,
    label: 'Assay Result Events',
    value: 'assayresultauditevent',
};
export const WORKFLOW_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    label: 'Sample Workflow Events',
    value: 'samplesworkflowauditevent',
};
export const SOURCE_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    hasTransactionId: true,
    isQueryUpdateEvent: true,
    label: 'Sources Events',
    value: 'sourcesauditevent',
};

export const NOTEBOOK_AUDIT_QUERY: AuditQuery = {
    label: 'Notebook Events',
    value: 'LabBookEvent',
};

export const NOTEBOOK_REVIEW_AUDIT_QUERY: AuditQuery = {
    label: 'Notebook Review Events',
    value: 'NotebookEvent',
};

export const REGISTRY_AUDIT_QUERY: AuditQuery = { label: 'Registry Events', value: 'RegistryEvent' };

export const REPORT_AUDIT_QUERY: AuditQuery = { label: 'Report Events', value: 'ReportEvent' };

export const FILE_SYSTEM_AUDIT_QUERY: AuditQuery = {
    hasTransactionId: true,
    label: 'File Events',
    value: 'filesystem',
};

export const AUDIT_EVENT_TYPE_PARAM = 'eventType';

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

export const COMMON_AUDIT_QUERIES: AuditQuery[] = [
    ATTACHMENT_AUDIT_QUERY,
    DOMAIN_AUDIT_QUERY,
    DOMAIN_PROPERTY_AUDIT_QUERY,
    FILE_SYSTEM_AUDIT_QUERY,
    GROUP_AUDIT_QUERY,
    INVENTORY_AUDIT_QUERY,
    LIST_AUDIT_QUERY,
    QUERY_UPDATE_AUDIT_QUERY,
    SAMPLE_TYPE_AUDIT_QUERY,
    SAMPLE_TIMELINE_AUDIT_QUERY,
    USER_AUDIT_QUERY,
];

export const EXPERIMENT_AUDIT_EVENT = 'experimentauditevent';

export const AUDIT_DETAIL_FIELD_VALUE_INHERITED = '$$aliquot-inherited-field$$';
