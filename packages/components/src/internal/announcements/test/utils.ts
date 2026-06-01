/*
 * Copyright (c) 2021-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
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
