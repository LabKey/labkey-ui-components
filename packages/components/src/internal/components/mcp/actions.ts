import { request, RequestHandler } from '../../request';
import { ActionURL } from '@labkey/api';

export interface AssistanceSegment {
    html?: string;
    sql?: string;
    type: 'expression' | 'html' | 'sql' | string;
}

export interface AssistanceResponse {
    conversationId: string;
    error?: string;
    segments?: AssistanceSegment[];
    success: boolean;
    text?: string;
}

interface DocumentationAssistOptions {
    containerPath?: string;
    conversationId?: string;
    prompt: string;
    requestHandler?: RequestHandler;
}

export function documentationAssistant(options: DocumentationAssistOptions): Promise<AssistanceResponse> {
    const { containerPath, requestHandler, ...jsonData } = options;

    return request<AssistanceResponse>({
        url: ActionURL.buildURL('core', 'documentationAssistantAgent.api', containerPath),
        method: 'POST',
        jsonData: {
            ...jsonData,
        },
        errorLogMsg: 'Failed to assist',
        requestHandler,
    });
}
