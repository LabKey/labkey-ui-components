import { ChatMessage } from './models';
import { generateId } from '../../util/utils';

const CURRENT_CHAT_KEY = 'documentationAssistantChatKey';

export function createChatMessage(message: Partial<ChatMessage>): ChatMessage {
    return {
        ...message,
        id: generateId('chat-'),
        timestamp: Date.now(),
    } as ChatMessage;
}

export function startChat() {
    localStorage.setItem(CURRENT_CHAT_KEY, Date.now().toString());
}

export function stopChat() {
    localStorage.removeItem(CURRENT_CHAT_KEY);
}

export function chatInProgress(): boolean {
    return !!localStorage.getItem(CURRENT_CHAT_KEY);
}
