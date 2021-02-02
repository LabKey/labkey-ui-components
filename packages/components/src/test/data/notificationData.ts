import { ServerActivityData } from '../../internal/components/notifications/model';

export const DONE_NOT_READ = new ServerActivityData({
    RowId: 1,
    Type: 'org.labkey.api.pipeline.PipelineJob$TaskStatus$3.complete',
    ActionLinkText: 'view sample details',
    CreatedBy: 'susan',
    ActionLinkUrl: '/labkey/Study/project-begin.view?',
    IconCls: 'fa-check-circle',
    ObjectId: 'fab36211-065a-1039-ab39-94ed22e93520',
    ContainerId: 'testContainerEntityId',
    HtmlContent: 'Sample Import complete',
    Content: 'Sample Import complete',
    ContentType: 'text/plain',
    UserId: 1005,
    ReadOn: null,
    Created: '2020-11-11 12:47:32.317',
});

export const DONE_AND_READ = new ServerActivityData({
    RowId: 2,
    Type: 'org.labkey.api.pipeline.PipelineJob$TaskStatus$3.complete',
    ActionLinkText: 'view sources',
    CreatedBy: 'susan',
    ActionLinkUrl: '/labkey/Study/project-begin.view?',
    IconCls: 'fa-check-circle',
    ObjectId: 'D',
    ContainerId: 'testContainerEntityId',
    HtmlContent: 'This one has been read',
    Content: 'This one has been read',
    ContentType: 'text/plain',
    UserId: 1005,
    ReadOn: '2020-11-21 09:27:41.000',
    Created: '2020-11-14 04:47:32.317',
});

export const IN_PROGRESS = new ServerActivityData({
    CreatedBy: 'susan',
    Content: 'Source import started',
    ContentType: 'text/plain',
    Created: '2020-01-22 13:47:32.317',
    inProgress: true,
});

export const UNREAD_WITH_ERROR = new ServerActivityData({
    RowId: 3,
    Type: 'org.labkey.api.pipeline.PipelineJob$TaskStatus$3.error',
    ActionLinkText: 'View error',
    CreatedBy: 'susan',
    ActionLinkUrl: '/labkey/Study/project-begin.view?',
    IconCls: 'fa-check-circle',
    ObjectId: 'B',
    ContainerId: 'testContainerEntityId',
    HtmlContent: 'Sample import failed from file file1.xlsx\n ERROR: duplicate key value violates unique constraint &quot;uq_material_lsid&quot;Detail: Key (lsid)=(urn:lsid:labkey.com:Sample.8.blood:s-d-001) already exists.',
    Content: 'Sample import failed from file file1.xlsx\n ERROR: duplicate key value violates unique constraint &quot;uq_material_lsid&quot;Detail: Key (lsid)=(urn:lsid:labkey.com:Sample.8.blood:s-d-001) already exists.',
    ContentType: 'text/html',
    UserId: 1005,
    ReadOn: null,
    Created: '2020-11-11 07:47:32.317',
    hasError: true,
});

export const UNREAD_WITH_ERROR2 = new ServerActivityData({
    RowId: 4,
    Type: 'org.labkey.api.pipeline.PipelineJob$TaskStatus$3.error',
    ActionLinkText: 'view',
    CreatedBy: 'susan',
    ActionLinkUrl: '/labkey/Study/project-begin.view?',
    IconCls: 'fa-check-circle',
    ObjectId: 'B',
    ContainerId: 'testContainerEntityId',
    HtmlContent: 'Assay import failed from file file1.xlsx\n ERROR:Failed to import assay run from Workflow_Assay01-2021-01-11-123227.tmp\n' +
        'SampleId: Failed to convert &#039;SampleId&#039;: Could not translate value: sdfs.',
    Content: 'Assay import failed from file file1.xlsx\n ERROR:Failed to import assay run from Workflow_Assay01-2021-01-11-123227.tmp\n' +
        'SampleId: Failed to convert \'SampleId\': Could not translate value: sdfs.',
    ContentType: 'text/plain',
    UserId: 1005,
    ReadOn: null,
    Created: '2020-11-11 07:47:32.317',
    hasError: true,
});

export const UNREAD_WITH_ERROR_HTML = new ServerActivityData({
    RowId: 5,
    Type: 'org.labkey.api.pipeline.PipelineJob$TaskStatus$3.error',
    ActionLinkText: 'view',
    CreatedBy: 'susan',
    ActionLinkUrl: '/labkey/Study/project-begin.view?',
    IconCls: 'fa-check-circle',
    ObjectId: 'B',
    ContainerId: 'testContainerEntityId',
    HtmlContent: 'Assay import failed from file file1.xlsx\n ERROR:Failed to import assay run from Workflow_Assay01-2021-01-11-123227.tmp\n' +
        'SampleId: Failed to convert &#039;SampleId&#039;: Could not translate value: sdfs.',
    Content: 'Assay import failed from file file1.xlsx\n ERROR:Failed to import assay run from Workflow_Assay01-2021-01-11-123227.tmp\n' +
        'SampleId: Failed to convert &#039;SampleId&#039;: Could not translate value: sdfs.',
    ContentType: 'text/html',
    UserId: 1005,
    ReadOn: null,
    Created: '2020-11-11 07:47:32.317',
    hasError: true,
});

export function markAllNotificationsRead(): Promise<boolean> {
    return new Promise(resolve => {
        resolve(true);
    });
}
