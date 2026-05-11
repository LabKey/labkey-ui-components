export enum ChatRole {
    assistant = 'assistant',
    user = 'user',
}

export interface ChatMessage {
    allowApplySql?: boolean;
    error?: string;
    html?: string;
    id: string;
    role: ChatRole;
    sql?: string;
    text?: string;
    timestamp: number;
}
