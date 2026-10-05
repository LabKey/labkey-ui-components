/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { createElement, FC, PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';

import { getTestAPIWrapper } from '../../../APIWrapper';
import { AuditSettingsResponse, getFolderTestAPIWrapper } from '../../container/FolderAPIWrapper';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../../containerFixtures';
import { AppContextTestProvider } from '../../../test/testHelpers';
import { Container } from '../../base/models/Container';
import { ModuleContext } from '../../base/ServerContext';
import { isLoading, LoadingState } from '../../../../public/LoadingState';

import { useDataChangeCommentsRequired } from './useDataChangeCommentsRequired';

interface RenderOptions {
    commentEnabled?: boolean;
    container?: Container;
    getAuditSettings?: jest.Mock;
    moduleContext?: ModuleContext;
}

const renderDataChangeHook = (options: RenderOptions = {}) => {
    const {
        commentEnabled,
        container = TEST_PROJECT_CONTAINER,
        getAuditSettings = jest.fn().mockResolvedValue({ requireUserComments: false }),
        moduleContext = {},
    } = options;
    const appContext = {
        api: getTestAPIWrapper(jest.fn, {
            folder: getFolderTestAPIWrapper(jest.fn, { getAuditSettings }),
        }),
    };
    const wrapper: FC<PropsWithChildren> = ({ children }) =>
        createElement(AppContextTestProvider, { appContext, serverContext: { container, moduleContext } }, children);
    const hook = renderHook(() => useDataChangeCommentsRequired(commentEnabled), { wrapper });

    return { ...hook, getAuditSettings };
};

const waitForLoaded = async (result: { current: { loadingState: LoadingState } }): Promise<void> => {
    await waitFor(() => expect(result.current.loadingState).toBe(LoadingState.LOADED));
};

describe('useDataChangeCommentsRequired', () => {
    test('comments not required allows confirm without a comment', async () => {
        const { result, getAuditSettings } = renderDataChangeHook();
        await waitForLoaded(result);

        expect(getAuditSettings).toHaveBeenCalledTimes(1);
        expect(result.current.requiresUserComment).toBe(false);
        expect(result.current.comment).toBeUndefined();
        expect(result.current.canConfirm).toBe(true);
    });

    test('comments required gates confirm on a non-blank comment', async () => {
        const { result } = renderDataChangeHook({
            getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: true }),
        });
        await waitForLoaded(result);

        expect(result.current.requiresUserComment).toBe(true);
        expect(result.current.canConfirm).toBe(false);

        act(() => result.current.setComment(''));
        expect(result.current.canConfirm).toBe(false);

        act(() => result.current.setComment('  \t\n '));
        expect(result.current.comment).toBe('  \t\n ');
        expect(result.current.canConfirm).toBe(false);

        act(() => result.current.setComment('Fixing a typo'));
        expect(result.current.comment).toBe('Fixing a typo');
        expect(result.current.canConfirm).toBe(true);

        act(() => result.current.setComment(''));
        expect(result.current.canConfirm).toBe(false);
    });

    test('commentEnabled false skips the audit settings request and allows confirm', async () => {
        const getAuditSettings = jest.fn().mockResolvedValue({ requireUserComments: true });
        const { result } = renderDataChangeHook({ commentEnabled: false, getAuditSettings });
        await waitForLoaded(result);

        expect(getAuditSettings).not.toHaveBeenCalled();
        expect(result.current.requiresUserComment).toBe(false);
        expect(result.current.canConfirm).toBe(true);
    });

    test('commentEnabled false allows confirm before loading completes', async () => {
        const { result } = renderDataChangeHook({ commentEnabled: false });

        expect(isLoading(result.current.loadingState)).toBe(true);
        expect(result.current.canConfirm).toBe(true);

        await waitForLoaded(result);
        expect(result.current.canConfirm).toBe(true);
    });

    test('commentEnabled defaults to true', async () => {
        const { result, getAuditSettings } = renderDataChangeHook({
            getAuditSettings: jest.fn().mockResolvedValue({ requireUserComments: true }),
        });
        await waitForLoaded(result);

        expect(getAuditSettings).toHaveBeenCalledTimes(1);
        expect(result.current.canConfirm).toBe(false);
    });

    test('cannot confirm while audit settings are loading', async () => {
        let resolveSettings: (response: AuditSettingsResponse) => void;
        const getAuditSettings = jest.fn().mockReturnValue(
            new Promise<AuditSettingsResponse>(resolve => {
                resolveSettings = resolve;
            })
        );
        const { result } = renderDataChangeHook({ getAuditSettings });

        await waitFor(() => expect(result.current.loadingState).toBe(LoadingState.LOADING));
        act(() => result.current.setComment('A comment'));
        expect(result.current.canConfirm).toBe(false);

        await act(async () => resolveSettings({ requireUserComments: false }));
        expect(result.current.loadingState).toBe(LoadingState.LOADED);
        expect(result.current.canConfirm).toBe(true);
    });

    test('missing audit settings response is treated as comments not required', async () => {
        const { result } = renderDataChangeHook({ getAuditSettings: jest.fn().mockResolvedValue(undefined) });
        await waitForLoaded(result);

        expect(result.current.requiresUserComment).toBe(false);
        expect(result.current.canConfirm).toBe(true);
    });

    test('failed audit settings request does not block confirm', async () => {
        const consoleError = jest.spyOn(console, 'error').mockImplementation(jest.fn());
        const { result } = renderDataChangeHook({
            getAuditSettings: jest.fn().mockRejectedValue(new Error('Request failed')),
        });
        await waitForLoaded(result);

        expect(result.current.requiresUserComment).toBeUndefined();
        expect(result.current.canConfirm).toBe(true);
        consoleError.mockRestore();
    });

    describe('audit settings container path', () => {
        test('project container uses its own path', async () => {
            const { result, getAuditSettings } = renderDataChangeHook({ container: TEST_PROJECT_CONTAINER });
            await waitForLoaded(result);

            expect(getAuditSettings).toHaveBeenCalledWith(TEST_PROJECT_CONTAINER.path);
        });

        test('folder container with product folders enabled uses the parent path', async () => {
            const { result, getAuditSettings } = renderDataChangeHook({
                container: TEST_FOLDER_CONTAINER,
                moduleContext: { query: { isProductFoldersEnabled: true } },
            });
            await waitForLoaded(result);

            expect(getAuditSettings).toHaveBeenCalledWith(TEST_FOLDER_CONTAINER.parentPath);
        });

        test('folder container with product folders disabled uses its own path', async () => {
            const { result, getAuditSettings } = renderDataChangeHook({
                container: TEST_FOLDER_CONTAINER,
                moduleContext: { query: { isProductFoldersEnabled: false } },
            });
            await waitForLoaded(result);

            expect(getAuditSettings).toHaveBeenCalledWith(TEST_FOLDER_CONTAINER.path);
        });
    });
});
