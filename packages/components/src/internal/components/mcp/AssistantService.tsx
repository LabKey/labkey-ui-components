import React, { createContext, FC, PropsWithChildren, useContext, useMemo } from 'react';
import { ModalState, useModalState } from '../../hooks';
import { useServerContext } from '../base/ServerContext';
import { isLabKeyAssistantEnabled } from '../../app/utils';

function holdConversationLock(id: string): Promise<boolean> {
    return new Promise(resolve => {
        navigator.locks.request(id, { ifAvailable: true }, lock => {
            resolve(!!lock);
            if (!lock) return;
            // Return an unresolvable promise to prevent the lock from being released while the tab is alive
            return new Promise(() => {});
        });
    });
}

const CONVERSATION_ID_STORAGE_KEY = 'ASSISTANT_CONVERSATION_ID';

export async function getSavedConversationId() {
    let conversationId = sessionStorage.getItem(CONVERSATION_ID_STORAGE_KEY) ?? undefined;

    if (conversationId) {
        sessionStorage.removeItem(CONVERSATION_ID_STORAGE_KEY);
        const held = await holdConversationLock(conversationId);
        // another tab, probably a duplicated one, is already holding the lock for this conversation, so we need to drop
        // the conversation to prevent the user from the same conversation across tabs
        if (!held) {
            console.log('Conversation id held by another tab, dropping conversation');
            conversationId = undefined;
        }
    }

    return conversationId;
}

export function saveConversationId(id: string): void {
    if (!id) return;
    sessionStorage.setItem(CONVERSATION_ID_STORAGE_KEY, id);
}

interface AssistantServiceState extends ModalState {
    enabled: boolean;
}

const voidFn = (): void => {}; // eslint-disable-line @typescript-eslint/no-empty-function

// Note: in the near future we are going to add a mechanism for our apps to send additional context to LabKey Assistant,
// we will use this context to add that functionality.
export const AssistantServiceContext = createContext<AssistantServiceState>({
    close: voidFn,
    enabled: false,
    open: voidFn,
    show: false,
});

export const AssistantService: FC<PropsWithChildren> = ({ children }) => {
    const modalState = useModalState();
    const { moduleContext, mcpReady } = useServerContext();
    const enabled = mcpReady === true && isLabKeyAssistantEnabled(moduleContext);
    const state = useMemo(() => ({ ...modalState, enabled }), [enabled, modalState]);
    return <AssistantServiceContext.Provider value={state}>{children}</AssistantServiceContext.Provider>;
};
AssistantServiceContext.displayName = 'AssistantServiceContext';

export const useAssistantService = () => {
    // We set a default value above so we don't need to guard against undefined here like other useContext hooks we have
    return useContext(AssistantServiceContext);
};
