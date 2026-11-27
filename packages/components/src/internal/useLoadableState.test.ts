/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { renderHook, waitFor } from '@testing-library/react';

import { LoadingState } from '../public/LoadingState';

import { useLoadableState } from './useLoadableState';

describe('useLoadableState', () => {
    let consoleError: jest.SpyInstance;

    beforeEach(() => {
        consoleError = jest.spyOn(console, 'error').mockImplementation(jest.fn());
    });

    afterEach(() => {
        consoleError.mockRestore();
    });

    test('loads the value', async () => {
        const loader = () => Promise.resolve('loaded');
        const { result } = renderHook(() => useLoadableState(loader));

        await waitFor(() => expect(result.current.loadingState).toBe(LoadingState.LOADED));
        expect(result.current.value).toBe('loaded');
        expect(result.current.error).toBeUndefined();
    });

    test('reports a failure', async () => {
        const loader = () => Promise.reject({ exception: 'Bad things', status: 500 });
        const { result } = renderHook(() => useLoadableState(loader));

        await waitFor(() => expect(result.current.loadingState).toBe(LoadingState.LOADED));
        expect(result.current.error).toBeDefined();
        expect(consoleError).toHaveBeenCalled();
    });

    test('treats an aborted request as not loaded rather than failed', async () => {
        const loader = () => Promise.reject({ aborted: true, message: 'Communication failure.', status: 0 });
        const { result } = renderHook(() => useLoadableState(loader));

        await waitFor(() => expect(result.current.loadingState).toBe(LoadingState.INITIALIZED));
        expect(result.current.error).toBeUndefined();
        expect(result.current.value).toBeUndefined();
        expect(consoleError).not.toHaveBeenCalled();
    });
});
