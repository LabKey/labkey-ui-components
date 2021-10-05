import { User, UserWithPermissions } from '@labkey/api';

import { AnnouncementModel, AnnouncementRenderType } from '../model';

export const NOUN_PLURAL = 'Test Comments';
export const NOUN_SINGULAR = 'Test Comment';

const COMMENTER_PROPS: User = {
    avatar: '/labkey/_images/defaultavatar.png',
    displayName: 'Commenter',
    email: 'commenter@test.fixture',
    id: 1337,
    phone: undefined,
}

const RESPONDER_PROPS: User = {
    avatar: '/labkey/_images/defaultavatar.png',
    displayName: 'Responder',
    email: 'responder@test.fixture',
    id: 3145,
    phone: undefined,
};

export const COMMENTER: UserWithPermissions = {
    ...COMMENTER_PROPS,

    // permissions
    canDelete: true,
    canDeleteOwn: false,
    canInsert: true,
    canUpdate: true,
    canUpdateOwn: false,
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: false,
    isSystemAdmin: false,
    isTrusted: false,
    maxAllowedPhi: 'NotPHI'
};

export const RESPONDER: UserWithPermissions = {
    ...RESPONDER_PROPS,

    canDelete: false,
    canDeleteOwn: false,
    canInsert: true,
    canUpdate: false,
    canUpdateOwn: false,
    isAdmin: false,
    isAnalyst: false,
    isDeveloper: false,
    isGuest: false,
    isRootAdmin: false,
    isSignedIn: false,
    isSystemAdmin: false,
    isTrusted: false,
    maxAllowedPhi: 'NotPHI'
};

const THREAD_ENTITY_ID = '0d39caaa-f65c-1038-82c6-7924e33db606';

export const RESPONSE: AnnouncementModel = {
    author: RESPONDER_PROPS,
    attachments: [],
    body: '# Test Response',
    containerId: 'a44d649a-3991-1038-b9b7-9ed56a6b3cc3',
    containerPath: '/announcements/test/fixture',
    created: '2020-10-23 13:39:32.700',
    createdBy: RESPONDER.id,
    // discussionSrcIdentifier -- responses do not have a "discussionSrcIdentifier"
    entityId: '0d39caaa-f65c-1038-82c6-7924e33db808',
    formattedHtml: '<div class="labkey-wiki">↵<div class="lk-markdown-container">↵<h1>Test Response</h1>↵</div>↵</div>',
    modified: '2020-10-23 13:39:32.706',
    modifiedBy: RESPONDER.id,
    parent: THREAD_ENTITY_ID,
    rendererType: AnnouncementRenderType.MARKDOWN,
    responses: [],
    rowId: 127,
    title: 'RESPONSE'
};

export const THREAD: AnnouncementModel = {
    author: COMMENTER_PROPS,
    attachments: [],
    body: '# Test Thread',
    containerId: 'a44d649a-3991-1038-b9b7-9ed56a6b3cc3',
    containerPath: '/announcements/test/fixture',
    created: '2020-10-22 13:39:32.700',
    createdBy: COMMENTER.id,
    discussionSrcIdentifier: '4f9f9233-f0d3-1038-9d6d-592baaddd020',
    discussionSrcEntityType: 'notebook',
    entityId: THREAD_ENTITY_ID,
    formattedHtml: '<div class="labkey-wiki">↵<div class="lk-markdown-container">↵<h1>Test Thread</h1>↵</div>↵</div>',
    modified: '2020-10-22 13:39:32.706',
    modifiedBy: COMMENTER.id,
    rendererType: AnnouncementRenderType.MARKDOWN,
    responses: [ ],
    rowId: 123,
    title: 'THREAD'
};

export const THREAD_WITH_RESPONSE: AnnouncementModel = Object.assign({}, THREAD, { responses: [ RESPONSE ] });
