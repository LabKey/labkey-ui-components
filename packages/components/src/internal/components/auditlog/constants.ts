import { Query } from '@labkey/api';

export type AuditQuery = {
    containerFilter?: Query.ContainerFilter;
    hasDetail?: boolean;
    label: string;
    value: string;
};

export const ATTACHMENT_AUDIT_QUERY: AuditQuery = { label: 'Attachment Events', value: 'attachmentauditevent' };
export const DOMAIN_AUDIT_QUERY: AuditQuery = { label: 'Domain Events', value: 'domainauditevent' };
export const DOMAIN_PROPERTY_AUDIT_QUERY: AuditQuery = {
    label: 'Domain Property Events',
    value: 'domainpropertyauditevent',
};
export const DATA_UPDATE_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    label: 'Data Update Events',
    value: 'queryupdateauditevent',
};
export const INVENTORY_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    label: 'Storage Management Events',
    value: 'inventoryauditevent',
};
export const LIST_AUDIT_QUERY: AuditQuery = { label: 'List Events', value: 'listauditevent' };
export const GROUP_AUDIT_QUERY: AuditQuery = {
    containerFilter: Query.ContainerFilter.allFolders,
    label: 'Roles and Assignment Events',
    value: 'groupauditevent',
};
export const PROJECT_AUDIT_QUERY: AuditQuery = {
    containerFilter: Query.ContainerFilter.allFolders,
    label: 'Project Events',
    value: 'containerauditevent',
};
export const SAMPLE_TYPE_AUDIT_QUERY: AuditQuery = { label: 'Sample Type Events', value: 'samplesetauditevent' };
export const SAMPLE_TIMELINE_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    label: 'Sample Timeline Events',
    value: 'sampletimelineevent',
};
export const USER_AUDIT_QUERY: AuditQuery = {
    containerFilter: Query.ContainerFilter.allFolders,
    label: 'User Events',
    value: 'userauditevent',
};
export const ASSAY_AUDIT_QUERY: AuditQuery = { value: 'experimentauditevent', label: 'Assay Events' };
export const WORKFLOW_AUDIT_QUERY: AuditQuery = {
    hasDetail: true,
    label: 'Sample Workflow Events',
    value: 'samplesworkflowauditevent',
};
export const SOURCE_AUDIT_QUERY: AuditQuery = { hasDetail: true, label: 'Sources Events', value: 'sourcesauditevent' };

export const NOTEBOOK_AUDIT_QUERY: AuditQuery = {
    label: 'Notebook Events',
    value: 'LabBookEvent',
};

export const NOTEBOOK_REVIEW_AUDIT_QUERY: AuditQuery = {
    label: 'Notebook Review Events',
    value: 'NotebookEvent',
};

export const REGISTRY_AUDIT_QUERY: AuditQuery = { label: 'Registry Events', value: 'RegistryEvent' };

export const AUDIT_EVENT_TYPE_PARAM = 'eventType';

export const COMMON_AUDIT_QUERIES: AuditQuery[] = [
    ATTACHMENT_AUDIT_QUERY,
    DOMAIN_AUDIT_QUERY,
    DOMAIN_PROPERTY_AUDIT_QUERY,
    DATA_UPDATE_AUDIT_QUERY,
    INVENTORY_AUDIT_QUERY,
    LIST_AUDIT_QUERY,
    GROUP_AUDIT_QUERY,
    SAMPLE_TYPE_AUDIT_QUERY,
    SAMPLE_TIMELINE_AUDIT_QUERY,
    USER_AUDIT_QUERY,
];
