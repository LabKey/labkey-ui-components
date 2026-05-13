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
