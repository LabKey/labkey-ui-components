/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
export enum ChatRole {
    assistant = 'assistant',
    user = 'user',
}

// Ordered content produced by an assistant response. ChatModal renders these via a default
// renderer; callers can supply `renderSegment` to handle additional segment types or override
// defaults. ChatModal itself is intentionally agnostic to any feature-specific segment types
// (e.g., an applicable SQL expression).
export interface ChatSegment {
    html?: string;
    jdbcType?: string;
    sql?: string;
    text?: string;
    type: string;
}

export interface ChatMessage {
    error?: string;
    id: string;
    role: ChatRole;
    segments?: ChatSegment[];
    text?: string;
    timestamp: number;
}
