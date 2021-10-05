import { AnnouncementsAPIWrapper } from '../APIWrapper';

export const createTestAPIWrapper = (overrides?: Partial<AnnouncementsAPIWrapper>): AnnouncementsAPIWrapper => {
    const defaultWrapper: AnnouncementsAPIWrapper = {
        createThread: jest.fn(),
        deleteAttachment: jest.fn(),
        deleteThread: jest.fn(),
        getDiscussions: jest.fn().mockResolvedValue([]),
        getThread: jest.fn(),
        renderContent: jest.fn(),
        updateThread: jest.fn(),
    };
    return Object.assign(defaultWrapper, overrides);
};
