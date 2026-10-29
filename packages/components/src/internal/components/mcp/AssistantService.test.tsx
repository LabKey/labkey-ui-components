/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC } from 'react';
import { act, render, screen } from '@testing-library/react';

import { ServerContext, ServerContextProvider } from '../base/ServerContext';
import { TEST_LKSM_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { AssistantService, getSavedConversationId, saveConversationId, useAssistantService } from './AssistantService';

const STORAGE_KEY = 'ASSISTANT_CONVERSATION_ID';

const ENABLED_MODULE_CONTEXT = {
    ...TEST_LKSM_STARTER_MODULE_CONTEXT,
    samplemanagement: { ...TEST_LKSM_STARTER_MODULE_CONTEXT.samplemanagement, labKeyAssistantEnabled: true },
};

function mockLocks(lockAvailable: boolean): jest.Mock {
    const request = jest.fn((_id, _options, callback) => callback(lockAvailable ? { name: _id } : null));
    Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } });
    return request;
}

describe('getSavedConversationId', () => {
    afterEach(() => {
        sessionStorage.clear();
        jest.restoreAllMocks();
    });

    test('returns undefined without a saved id', async () => {
        const request = mockLocks(true);

        expect(await getSavedConversationId()).toBeUndefined();
        expect(request).not.toHaveBeenCalled();
    });

    test('returns the saved id, holds its lock, and removes it from storage', async () => {
        const request = mockLocks(true);
        saveConversationId('abc');

        expect(await getSavedConversationId()).toBe('abc');
        expect(request).toHaveBeenCalledWith('abc', { ifAvailable: true }, expect.any(Function));
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });

    test('drops the saved id when another tab holds its lock', async () => {
        mockLocks(false);
        const log = jest.spyOn(console, 'log').mockReturnValue(undefined);
        saveConversationId('abc');

        expect(await getSavedConversationId()).toBeUndefined();
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
        expect(log).toHaveBeenCalledWith('Conversation id held by another tab, dropping conversation');
    });
});

describe('saveConversationId', () => {
    afterEach(() => {
        sessionStorage.clear();
    });

    test('ignores an empty id', () => {
        saveConversationId(undefined);
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
    });
});

describe('AssistantService', () => {
    let state: ReturnType<typeof useAssistantService>;
    const Consumer: FC = () => {
        state = useAssistantService();
        return <div>{state.show ? 'shown' : 'hidden'}</div>;
    };

    function renderService(serverContext: Partial<ServerContext>): void {
        render(
            <ServerContextProvider initialContext={serverContext as ServerContext}>
                <AssistantService>
                    <Consumer />
                </AssistantService>
            </ServerContextProvider>
        );
    }

    test('enabled when MCP is ready and the module enables the assistant', () => {
        renderService({ mcpReady: true, moduleContext: ENABLED_MODULE_CONTEXT });
        expect(state.enabled).toBe(true);
    });

    test('disabled when MCP is not ready', () => {
        renderService({ mcpReady: false, moduleContext: ENABLED_MODULE_CONTEXT });
        expect(state.enabled).toBe(false);
    });

    test('disabled when the module does not enable the assistant', () => {
        renderService({ mcpReady: true, moduleContext: TEST_LKSM_STARTER_MODULE_CONTEXT });
        expect(state.enabled).toBeFalsy();
    });

    test('open and close toggle show', () => {
        renderService({ mcpReady: true, moduleContext: ENABLED_MODULE_CONTEXT });
        expect(screen.getByText('hidden')).toBeInTheDocument();

        act(() => state.open());
        expect(screen.getByText('shown')).toBeInTheDocument();

        act(() => state.close());
        expect(screen.getByText('hidden')).toBeInTheDocument();
    });

    test('is disabled outside the provider', () => {
        render(<Consumer />);
        expect(state.enabled).toBe(false);
        expect(state.show).toBe(false);
    });
});
