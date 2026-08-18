/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback } from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LoadingState } from '../LoadingState';
import { QueryInfo } from '../QueryInfo';
import { SchemaQuery } from '../SchemaQuery';
import { selectRows } from '../../internal/query/selectRows';

import { QueryModelLoader, RowsResponse } from './QueryModelLoader';
import { InjectedQueryModels, RequestManager, withQueryModels } from './withQueryModels';

jest.mock('../../internal/query/selectRows', () => ({
    selectRows: jest.fn(),
}));

describe('RequestManager', () => {
    let manager: RequestManager;
    let mockXHR: any;

    beforeEach(() => {
        manager = new RequestManager();
        mockXHR = () => ({
            abort: jest.fn(),
            addEventListener: jest.fn(),
        });
    });

    const ID = 'some|model|id|123';
    const REQUEST_TYPE = 'someLoadAction';

    it('should abort an existing request when a new one of the same type starts', () => {
        const handler = manager.trackRequest(ID, REQUEST_TYPE).handler;
        const req1 = mockXHR();
        const req2 = mockXHR();

        handler(req1);
        handler(req2);

        expect(req1.abort).toHaveBeenCalledTimes(1);
        expect(manager._requests[ID][REQUEST_TYPE]).toBe(req2);
    });

    it('should clean up references on loadend', () => {
        const handler = manager.trackRequest(ID, REQUEST_TYPE).handler;
        const req = mockXHR();

        let cleanup: () => void;
        req.addEventListener.mockImplementation((event: string, cb: () => void) => {
            if (event === 'loadend') cleanup = cb;
        });

        handler(req);
        expect(manager._requests[ID]).toBeDefined();

        // Simulate the request finishing
        cleanup();

        expect(manager._requests[ID]).toBeUndefined();
    });

    it('should not delete a new request if an old request finishes', () => {
        const handler = manager.trackRequest(ID, REQUEST_TYPE).handler;

        const req1 = mockXHR();
        let cleanup: () => void;
        req1.addEventListener.mockImplementation((event: string, cb: () => void) => {
            if (event === 'loadend') cleanup = cb;
        });

        handler(req1);

        const req2 = mockXHR();
        handler(req2);

        // Simulate request 1 finally finishing its 'loadend' event
        cleanup();

        // Validate request 2 is still there
        expect(manager._requests[ID][REQUEST_TYPE]).toBe(req2);
    });

    it('should report a tracked request as canceled when a new one of the same type starts', () => {
        const tracked1 = manager.trackRequest(ID, REQUEST_TYPE);
        const req1 = mockXHR();
        tracked1.handler(req1);

        expect(tracked1.wasCancelled()).toBe(false);

        const tracked2 = manager.trackRequest(ID, REQUEST_TYPE);
        tracked2.handler(mockXHR());

        expect(req1.abort).toHaveBeenCalledTimes(1);
        expect(tracked1.wasCancelled()).toBe(true);
        // Only the aborted request was canceled, the one that replaced it was not
        expect(tracked2.wasCancelled()).toBe(false);
    });

    it('should not report a failing request as canceled while it is still registered', () => {
        // GitHub Issue 1364: @labkey/api rejects from the XHR 'readystatechange' handler, which runs before the
        // 'loadend' cleanup, so a request that fails at the transport level is still registered when its failure is
        // handled. Cancellation cannot be inferred from what is registered.
        const tracked = manager.trackRequest(ID, REQUEST_TYPE);
        const req = mockXHR();
        tracked.handler(req);

        expect(manager._requests[ID][REQUEST_TYPE]).toBe(req);
        expect(tracked.wasCancelled()).toBe(false);
    });

    it('should not report a request that was never sent as canceled', () => {
        const tracked = manager.trackRequest(ID, REQUEST_TYPE);
        expect(tracked.wasCancelled()).toBe(false);
    });

    it('should report tracked requests as canceled after cancelAllRequests', () => {
        const tracked = manager.trackRequest(ID, REQUEST_TYPE);
        const req = mockXHR();
        tracked.handler(req);

        manager.cancelAllRequests();

        expect(req.abort).toHaveBeenCalledTimes(1);
        expect(tracked.wasCancelled()).toBe(true);
    });

    it('should handle requests object mutation during abort', () => {
        const manager = new RequestManager();
        const handler = manager.trackRequest(ID, REQUEST_TYPE).handler;
        const req1 = mockXHR();
        handler(req1);

        // Mock abort() so that the moment we try to start Req 2,
        // the manager deletes the whole ID entry (simulating a concurrent loadend cleanup).
        req1.abort.mockImplementation(() => {
            delete manager._requests[ID];
        });

        const req2 = mockXHR();

        // The manager should have correctly re-attached the ID to the state
        expect(() => handler(req2)).not.toThrow();
        expect(manager._requests[ID][REQUEST_TYPE]).toBe(req2);
    });
});

// GitHub Issue 1364: an aborted request and a transport-level failure (e.g. a dropped connection) both report a status
// of 0. Ignoring the former is correct, because the request that replaced it settles the model's loading state, but
// ignoring the latter leaves the model reporting that it is loading forever, which renders as a spinner that never
// goes away.
describe('withQueryModels request failures', () => {
    const SCHEMA_QUERY = new SchemaQuery('schema', 'query');
    const QUERY_INFO = new QueryInfo({ schemaQuery: SCHEMA_QUERY });
    const ROWS_RESPONSE: RowsResponse = { messages: [], orderedRows: [], rowCount: 0, rows: {} };
    const MODEL_ID = 'model';

    // A transport-level failure never invokes the request handler, so the manager has no record of the request
    const TRANSPORT_FAILURE = { exception: 'Connection reset by peer', status: 0 };

    const mockXHR = (): any => ({ abort: jest.fn(), addEventListener: jest.fn() });

    function testLoader(overrides: Partial<QueryModelLoader> = {}): QueryModelLoader {
        return {
            clearSelections: jest.fn().mockResolvedValue({ count: 0 }),
            loadCharts: jest.fn().mockResolvedValue([]),
            loadQueryInfo: jest.fn().mockResolvedValue(QUERY_INFO),
            loadRows: jest.fn().mockResolvedValue(ROWS_RESPONSE),
            loadSelections: jest.fn().mockResolvedValue(new Set<string>()),
            replaceSelections: jest.fn().mockResolvedValue({ count: 0 }),
            selectAllRows: jest.fn().mockResolvedValue(new Set<string>()),
            setSelections: jest.fn().mockResolvedValue({ count: 0 }),
            ...overrides,
        };
    }

    const ModelState: FC<InjectedQueryModels> = ({ actions, queryModels }) => {
        const model = queryModels[MODEL_ID];
        const onReloadRows = useCallback(() => actions.loadRows(MODEL_ID), [actions]);

        return (
            <div>
                <div className="rows-state">{model.rowsLoadingState}</div>
                <div className="rows-error">{model.rowsError}</div>
                <div className="selections-state">{model.selectionsLoadingState}</div>
                <div className="selections-error">{model.selectionsError}</div>
                <div className="total-count-state">{model.totalCountLoadingState}</div>
                <div className="total-count-error">{model.totalCountError}</div>
                <button className="reload-rows" onClick={onReloadRows} type="button" />
            </div>
        );
    };
    const ModelStateWithQueryModels = withQueryModels(ModelState);

    function renderModel(modelLoader: QueryModelLoader): void {
        render(
            <ModelStateWithQueryModels
                autoLoad
                modelLoader={modelLoader}
                queryConfigs={{ [MODEL_ID]: { id: MODEL_ID, includeTotalCount: true, schemaQuery: SCHEMA_QUERY } }}
            />
        );
    }

    function textOf(selector: string): string {
        return document.querySelector(selector).textContent;
    }

    beforeEach(() => {
        jest.mocked(selectRows).mockResolvedValue({ rowCount: 0 } as any);
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('surfaces a rows failure that was not a cancellation', async () => {
        renderModel(testLoader({ loadRows: jest.fn().mockRejectedValue(TRANSPORT_FAILURE) }));

        await waitFor(() => {
            expect(textOf('.rows-error')).toContain('Connection reset by peer');
        });
        // The model must not be left reporting that it is loading rows
        expect(textOf('.rows-state')).toBe(LoadingState.LOADED);
    });

    it('ignores a rows failure that was a cancellation', async () => {
        let rejectFirstLoad: (reason: any) => void;
        const loadRows = jest
            .fn()
            .mockImplementationOnce(
                (model, requestHandler) =>
                    new Promise((resolve, reject) => {
                        rejectFirstLoad = reject;
                        requestHandler?.(mockXHR());
                    })
            )
            .mockImplementation((model, requestHandler) => {
                requestHandler?.(mockXHR());
                return Promise.resolve(ROWS_RESPONSE);
            });
        renderModel(testLoader({ loadRows }));

        await waitFor(() => {
            expect(textOf('.rows-state')).toBe(LoadingState.LOADING);
        });

        // Start a second load, which cancels the first, then fail the canceled request
        await userEvent.click(document.querySelector('.reload-rows'));
        await waitFor(() => {
            expect(textOf('.rows-state')).toBe(LoadingState.LOADED);
        });
        rejectFirstLoad(TRANSPORT_FAILURE);

        await waitFor(() => {
            expect(loadRows).toHaveBeenCalledTimes(2);
        });
        // The request that replaced it already settled the state, so the cancellation must not report an error
        expect(textOf('.rows-error')).toBe('');
        expect(textOf('.rows-state')).toBe(LoadingState.LOADED);
    });

    it('surfaces a selections failure that was not a cancellation', async () => {
        renderModel(testLoader({ loadSelections: jest.fn().mockRejectedValue(TRANSPORT_FAILURE) }));

        await waitFor(() => {
            expect(textOf('.selections-error')).toContain('Connection reset by peer');
        });
        // The model must not be left reporting that it is loading selections
        expect(textOf('.selections-state')).toBe(LoadingState.LOADED);
    });

    it('surfaces a total count failure that was not a cancellation', async () => {
        jest.mocked(selectRows).mockRejectedValue(TRANSPORT_FAILURE);
        renderModel(testLoader());

        await waitFor(() => {
            expect(textOf('.total-count-error')).toContain('Connection reset by peer');
        });
        // The model must not be left reporting that it is loading the total count
        expect(textOf('.total-count-state')).toBe(LoadingState.LOADED);
    });
});
