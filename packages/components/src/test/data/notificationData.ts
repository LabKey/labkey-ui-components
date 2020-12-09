import { ServerActivityData } from '../../internal/components/notifications/model';

export const DONE_NOT_READ = new ServerActivityData({
    RowId: 1,
    Type: 'org.labkey.api.pipeline.PipelineJob$TaskStatus$3.complete',
    ActionLinkText: 'view',
    CreatedBy: 'susan',
    ActionLinkUrl: '/labkey/Study/project-begin.view?',
    IconCls: 'fa-check-circle',
    ObjectId: 'fab36211-065a-1039-ab39-94ed22e93520',
    ContainerId: 'testContainerEntityId',
    HtmlContent: 'Sample Import complete',
    UserId: 1005,
    ReadOn: null,
    Created: '2020-11-11 12:47:32.317',
});

export const DONE_AND_READ = new ServerActivityData({
    RowId: 2,
    Type: 'org.labkey.api.pipeline.PipelineJob$TaskStatus$3.complete',
    ActionLinkText: 'view',
    CreatedBy: 'susan',
    ActionLinkUrl: '/labkey/Study/project-begin.view?',
    IconCls: 'fa-check-circle',
    ObjectId: 'D',
    ContainerId: 'testContainerEntityId',
    HtmlContent: 'This one has been read',
    UserId: 1005,
    ReadOn: '2020-11-11 09:27:41.000',
    Created: '2020-11-14 04:47:32.317',
});

export const IN_PROGRESS = new ServerActivityData({
    RowId: undefined,
    Type: 'org.labkey.api.pipeline.PipelineJob$TaskStatus$3.complete',
    ActionLinkText: 'view',
    CreatedBy: 'susan',
    ActionLinkUrl: '/labkey/Study/project-begin.view?',
    IconCls: 'fa-check-circle',
    ObjectId: 'C',
    ContainerId: 'testContainerEntityId',
    HtmlContent: 'Source import started',
    UserId: 1005,
    ReadOn: null,
    Created: '2020-01-22 13:47:32.317',
    inProgress: true,
});

export const UNREAD_WITH_ERROR = new ServerActivityData({
    RowId: 3,
    Type: 'org.labkey.api.pipeline.PipelineJob$TaskStatus$3.complete',
    ActionLinkText: 'view',
    CreatedBy: 'susan',
    ActionLinkUrl: '/labkey/Study/project-begin.view?',
    IconCls: 'fa-check-circle',
    ObjectId: 'B',
    ContainerId: 'testContainerEntityId',
    HtmlContent: 'Sample import from file file1.xlsx',
    UserId: 1005,
    ReadOn: null,
    Created: '2020-11-11 07:47:32.317',
    hasError: true,
});
