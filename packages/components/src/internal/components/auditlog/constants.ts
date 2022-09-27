import { Query } from '@labkey/api';

export const ATTACHMENT_AUDIT_QUERY = {value: 'attachmentauditevent', label: 'Attachment Events'};
export const DOMAIN_AUDIT_QUERY = {value: 'domainauditevent', label: 'Domain Events'};
export const DOMAIN_PROPERTY_AUDIT_QUERY = {value: 'domainpropertyauditevent', label: 'Domain Property Events'};
export const DATA_UPDATE_AUDIT_QUERY = {value: 'queryupdateauditevent', label: 'Data Update Events', hasDetail: true};
export const INVENTORY_AUDIT_QUERY = {value: 'inventoryauditevent', label: 'Freezer Management Events', hasDetail: true};
export const LIST_AUDIT_QUERY = {value: 'listauditevent', label: 'List Events'};
export const GROUP_AUDIT_QUERY = {
    value: 'groupauditevent',
    label: 'Roles and Assignment Events',
    containerFilter: Query.ContainerFilter.allFolders,
};
export const PROJECT_AUDIT_QUERY = { value: 'containerauditevent', label: 'Project Events' };
export const SAMPLE_TYPE_AUDIT_QUERY = {value: 'samplesetauditevent', label: 'Sample Type Events'};
export const SAMPLE_TIMELINE_AUDIT_QUERY = {
    value: 'sampletimelineevent',
    label: 'Sample Timeline Events',
    hasDetail: true
};
export const USER_AUDIT_QUERY = {
    value: 'userauditevent',
    label: 'User Events',
    containerFilter: Query.ContainerFilter.allFolders
};
export const ASSAY_AUDIT_QUERY = {value: 'experimentauditevent', label: 'Assay Events'};
export const WORKFLOW_AUDIT_QUERY = {
    value: 'samplesworkflowauditevent',
    label: 'Sample Workflow Events',
    hasDetail: true
};
export const SOURCE_AUDIT_QUERY = {value: 'sourcesauditevent', label: 'Sources Events', hasDetail: true};
export const COMMON_AUDIT_QUERIES = [
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

export const AUDIT_EVENT_TYPE_PARAM = 'eventType';
