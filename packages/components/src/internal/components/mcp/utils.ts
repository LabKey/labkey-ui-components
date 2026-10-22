import { ChatMessage } from './models';
import { generateId } from '../../util/utils';

export function createChatMessage(message: Partial<ChatMessage>): ChatMessage {
    return {
        ...message,
        id: generateId('chat-'),
        timestamp: Date.now(),
    } as ChatMessage;
}
