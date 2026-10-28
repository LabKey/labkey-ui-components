import { request, RequestHandler } from '../../request';
import { ActionURL } from '@labkey/api';
import { ChatMessage } from './models';

export interface AssistanceSegment {
    html?: string;
    sql?: string;
    type: 'expression' | 'html' | 'sql' | string;
}

export interface AssistanceResponse {
    conversationId: string;
    error?: string;
    // The server closed the conversation (e.g. "/clear"), so the client should clear its messages too
    reset?: boolean;
    segments?: AssistanceSegment[];
    success: boolean;
    text?: string;
}

interface LabKeyAssistantOptions {
    containerPath?: string;
    conversationId?: string;
    prompt: string;
    requestHandler?: RequestHandler;
}

interface ChatHistoryOptions {
    containerPath?: string;
    conversationId: string;
}

export interface ChatHistoryResponse {
    conversationId: string;
    messages: ChatMessage[];
    success: boolean;
}

export interface LabKeyAssistantAPIWrapper {
    getChatHistory: (options: ChatHistoryOptions) => Promise<ChatHistoryResponse>;
    labkeyAssistant: (options: LabKeyAssistantOptions) => Promise<AssistanceResponse>;
}

export const LabKeyAssistantServerAPIWrapper: LabKeyAssistantAPIWrapper = {
    getChatHistory: (options: ChatHistoryOptions): Promise<ChatHistoryResponse> => {
        const { containerPath, conversationId } = options;

        return request<ChatHistoryResponse>({
            url: ActionURL.buildURL('core', 'getChatHistory.api', containerPath),
            method: 'GET',
            params: { conversationId },
            // Callers log, since a 404 is an expected outcome
            errorLogMsg: '',
        });
    },
    labkeyAssistant: (options: LabKeyAssistantOptions): Promise<AssistanceResponse> => {
        const { containerPath, requestHandler, ...jsonData } = options;

        return request<AssistanceResponse>({
            url: ActionURL.buildURL('core', 'labkeyAssistantAgent.api', containerPath),
            method: 'POST',
            jsonData,
            errorLogMsg: 'Failed to assist',
            requestHandler,
        });
    },
};

export function getDocumentationAssistantTestAPIWrapper(
    mockFn = (): unknown => () => {},
    overrides: Partial<LabKeyAssistantAPIWrapper>
) {
    return {
        labkeyAssistant: mockFn(),
        getChatHistory: mockFn(),
        ...overrides,
    };
}
