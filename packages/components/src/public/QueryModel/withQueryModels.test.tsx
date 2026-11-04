/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, ReactNode, useCallback } from 'react';
import { act, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Filter } from '@labkey/api';

import { LoadingState } from '../LoadingState';
import { QueryInfo } from '../QueryInfo';
import { QuerySort, SORT_ASC, SORT_DESC } from '../QuerySort';
import { SchemaQuery } from '../SchemaQuery';
import { selectRows } from '../../internal/query/selectRows';
import { makeQueryInfo, makeTestData } from '../../internal/test/testHelpers';
import { MockQueryModelLoader } from '../../test/MockQueryModelLoader';
import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../../test/data/mixtures-getQueryPaging.json';
import aminoAcidsQueryInfo from '../../test/data/assayAminoAcidsData-getQueryDetails.json';
import aminoAcidsQuery from '../../test/data/assayAminoAcidsData-getQuery.json';

import { QueryModel } from './QueryModel';
import { QueryModelLoader, RowsResponse } from './QueryModelLoader';
import { Actions, InjectedQueryModels, QueryModelMap, RequestManager, withQueryModels } from './withQueryModels';

// require() returns the same __mocks__/react-router.ts instance withQueryModels uses; jest.requireMock does not
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rrd = require('react-router');

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

describe('withQueryModels capped total count', () => {
    const SCHEMA_QUERY = new SchemaQuery('schema', 'query');
    const QUERY_INFO = new QueryInfo({ schemaQuery: SCHEMA_QUERY });
    const ROWS_RESPONSE: RowsResponse = { messages: [], orderedRows: [], rowCount: 0, rows: {} };
    const MODEL_ID = 'model';

    function testLoader(): QueryModelLoader {
        return {
            clearSelections: jest.fn().mockResolvedValue({ count: 0 }),
            loadCharts: jest.fn().mockResolvedValue([]),
            loadQueryInfo: jest.fn().mockResolvedValue(QUERY_INFO),
            loadRows: jest.fn().mockResolvedValue(ROWS_RESPONSE),
            loadSelections: jest.fn().mockResolvedValue(new Set<string>()),
            replaceSelections: jest.fn().mockResolvedValue({ count: 0 }),
            selectAllRows: jest.fn().mockResolvedValue(new Set<string>()),
            setSelections: jest.fn().mockResolvedValue({ count: 0 }),
        };
    }

    const ModelState: FC<InjectedQueryModels> = ({ actions, queryModels }) => {
        const model = queryModels[MODEL_ID];
        // Jump straight to the last page within the cap (offset + maxRows === rowCount)
        const toCapEdge = useCallback(() => actions.setOffset(MODEL_ID, 80), [actions]);
        const toLastPage = useCallback(() => actions.loadLastPage(MODEL_ID), [actions]);
        const countAll = useCallback(() => actions.loadTotalCount(MODEL_ID, true, true), [actions]);

        return (
            <div>
                <div className="row-count">{model.rowCount}</div>
                <div className="row-count-capped">{String(model.rowCountCapped)}</div>
                <div className="offset">{model.offset}</div>
                <button className="to-cap-edge" onClick={toCapEdge} type="button" />
                <button className="to-last-page" onClick={toLastPage} type="button" />
                <button className="count-all" onClick={countAll} type="button" />
            </div>
        );
    };
    const ModelStateWithQueryModels = withQueryModels(ModelState);

    function textOf(selector: string): string {
        return document.querySelector(selector).textContent;
    }

    beforeEach(() => {
        jest.mocked(selectRows).mockReset();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('re-fires an exact count (maxCount=0) when the user pages to the edge of a capped count', async () => {
        // First count comes back capped at 100; the exact re-fire finds the true total of 151
        jest.mocked(selectRows)
            .mockResolvedValueOnce({ rowCount: 100, rowCountCapped: true } as any)
            .mockResolvedValue({ rowCount: 151, rowCountCapped: false } as any);

        render(
            <ModelStateWithQueryModels
                autoLoad
                modelLoader={testLoader()}
                queryConfigs={{
                    [MODEL_ID]: { id: MODEL_ID, includeTotalCount: true, maxCount: 100, maxRows: 20, schemaQuery: SCHEMA_QUERY },
                }}
            />
        );

        await waitFor(() => expect(textOf('.row-count-capped')).toBe('true'));
        expect(textOf('.row-count')).toBe('100');
        // The initial count request used the configured cap
        expect(jest.mocked(selectRows).mock.calls[0][0]).toEqual(expect.objectContaining({ maxCount: 100 }));

        await userEvent.click(document.querySelector('.to-cap-edge'));

        // Paging to the cap edge re-fires with an exact count and the true total replaces the capped floor
        await waitFor(() => expect(textOf('.row-count-capped')).toBe('false'));
        expect(textOf('.row-count')).toBe('151');
        expect(jest.mocked(selectRows).mock.calls[1][0]).toEqual(expect.objectContaining({ maxCount: 0 }));
    });

    it('Last Page resolves the exact count then jumps to the true last page when capped', async () => {
        // Capped at 100; the exact count reveals 151 rows → last page offset is 140 (maxRows 20)
        jest.mocked(selectRows)
            .mockResolvedValueOnce({ rowCount: 100, rowCountCapped: true } as any)
            .mockResolvedValue({ rowCount: 151, rowCountCapped: false } as any);

        render(
            <ModelStateWithQueryModels
                autoLoad
                modelLoader={testLoader()}
                queryConfigs={{
                    [MODEL_ID]: { id: MODEL_ID, includeTotalCount: true, maxCount: 100, maxRows: 20, schemaQuery: SCHEMA_QUERY },
                }}
            />
        );

        await waitFor(() => expect(textOf('.row-count-capped')).toBe('true'));
        expect(textOf('.offset')).toBe('0');

        await userEvent.click(document.querySelector('.to-last-page'));

        // The exact count is fetched (maxCount=0) and the offset lands on the real last page (140, not the capped 80)
        await waitFor(() => expect(textOf('.row-count-capped')).toBe('false'));
        expect(textOf('.row-count')).toBe('151');
        expect(textOf('.offset')).toBe('140');
        expect(jest.mocked(selectRows).mock.calls[1][0]).toEqual(expect.objectContaining({ maxCount: 0 }));
    });

    it('Count All Rows fetches the exact count without navigating', async () => {
        jest.mocked(selectRows)
            .mockResolvedValueOnce({ rowCount: 100, rowCountCapped: true } as any)
            .mockResolvedValue({ rowCount: 151, rowCountCapped: false } as any);

        render(
            <ModelStateWithQueryModels
                autoLoad
                modelLoader={testLoader()}
                queryConfigs={{
                    [MODEL_ID]: { id: MODEL_ID, includeTotalCount: true, maxCount: 100, maxRows: 20, schemaQuery: SCHEMA_QUERY },
                }}
            />
        );

        await waitFor(() => expect(textOf('.row-count-capped')).toBe('true'));

        await userEvent.click(document.querySelector('.count-all'));

        // Exact count replaces the capped floor, but the offset does not move
        await waitFor(() => expect(textOf('.row-count-capped')).toBe('false'));
        expect(textOf('.row-count')).toBe('151');
        expect(textOf('.offset')).toBe('0');
        expect(jest.mocked(selectRows).mock.calls[1][0]).toEqual(expect.objectContaining({ maxCount: 0 }));
    });
});

describe('withQueryModels actions and URL binding', () => {
    const MIXTURES_SCHEMA_QUERY = new SchemaQuery('exp.data', 'mixtures');
    const AMINO_ACIDS_SCHEMA_QUERY = new SchemaQuery('assay.General.Amino Acids', 'Runs');
    let MIXTURES_QUERY_INFO: QueryInfo;
    let MIXTURES_DATA: RowsResponse;
    let AMINO_ACIDS_QUERY_INFO: QueryInfo;
    let AMINO_ACIDS_DATA: RowsResponse;

    // Tests read state from these variables, which the wrapped component reassigns on every render
    let injectedModels: QueryModelMap;
    let injectedModel: QueryModel;
    let injectedActions: Actions;

    const ModelCapture: FC<InjectedQueryModels> = ({ actions, queryModels }) => {
        injectedModels = queryModels;
        injectedModel = queryModels.model;
        injectedActions = actions;
        return null;
    };
    const WrappedModelCapture = withQueryModels(ModelCapture);

    // Model actions update state outside of React event handlers, so flush them with act. Some actions are async
    // (e.g. loadLastPage); the braces keep act synchronous by discarding the returned promise.
    function dispatch(fn: () => unknown): void {
        act(() => {
            fn();
        });
    }

    async function waitForRowsLoaded(): Promise<void> {
        await waitFor(() => {
            expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADED);
            expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);
        });
    }

    async function renderLoadedModel(modelLoader: MockQueryModelLoader): Promise<void> {
        render(
            <WrappedModelCapture
                autoLoad
                modelLoader={modelLoader}
                queryConfigs={{ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } }}
            />
        );
        await waitForRowsLoaded();
    }

    beforeAll(() => {
        MIXTURES_QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
        AMINO_ACIDS_QUERY_INFO = makeQueryInfo(aminoAcidsQueryInfo);
        AMINO_ACIDS_DATA = makeTestData(aminoAcidsQuery);
        MIXTURES_DATA = makeTestData(mixturesQuery);
    });

    beforeEach(() => {
        rrd.__setSearchParams(new URLSearchParams());
        rrd.__setSetSearchParams(jest.fn());
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    test('loadModel loads the QueryInfo before the rows', async () => {
        // Arrange
        const modelLoader = new MockQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        render(
            <WrappedModelCapture
                modelLoader={modelLoader}
                queryConfigs={{ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } }}
            />
        );

        // Assert - without autoLoad nothing has been fetched yet
        expect(injectedModel.queryInfo).toEqual(undefined);
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.rows).toEqual(undefined);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.INITIALIZED);

        // Act
        dispatch(() => injectedActions.loadModel(injectedModel.id));

        // Assert - rows wait on the QueryInfo, then both load
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.INITIALIZED);
        await waitForRowsLoaded();
        expect(injectedModel.queryInfo).toBe(MIXTURES_QUERY_INFO);
        expect(injectedModel.orderedRows).toEqual(MIXTURES_DATA.orderedRows.slice(0, injectedModel.maxRows));
    });

    test('paging actions update the offset and reload rows', async () => {
        // Arrange
        await renderLoadedModel(new MockQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA));
        const { maxRows } = injectedModel;

        // Act
        dispatch(() => injectedActions.loadPreviousPage(injectedModel.id));

        // Assert - previous page from the first page is a no-op
        expect(injectedModel.offset).toEqual(0);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);

        // Act
        dispatch(() => injectedActions.loadNextPage(injectedModel.id));

        // Assert - next page advances one page and reloads
        expect(injectedModel.offset).toEqual(maxRows);
        expect(injectedModel.currentPage).toEqual(2);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        await waitForRowsLoaded();

        // Act
        dispatch(() => injectedActions.loadLastPage(injectedModel.id));

        // Assert - last page jumps to the last page offset and reloads
        expect(injectedModel.offset).toEqual(injectedModel.lastPageOffset);
        expect(injectedModel.currentPage).toEqual(34);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        await waitForRowsLoaded();

        // Act
        const lastPageOffset = injectedModel.offset;
        dispatch(() => injectedActions.loadNextPage(injectedModel.id));

        // Assert - next page from the last page is a no-op
        expect(injectedModel.offset).toEqual(lastPageOffset);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);

        // Act
        dispatch(() => injectedActions.loadPreviousPage(injectedModel.id));

        // Assert - previous page steps back one page and reloads
        expect(injectedModel.offset).toEqual(lastPageOffset - maxRows);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        await waitForRowsLoaded();

        // Act
        dispatch(() => injectedActions.loadFirstPage(injectedModel.id));

        // Assert - first page resets the offset and reloads
        expect(injectedModel.offset).toEqual(0);
        expect(injectedModel.currentPage).toEqual(1);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        await waitForRowsLoaded();

        // Act
        dispatch(() => injectedActions.setOffset(injectedModel.id, maxRows * 2));

        // Assert - setOffset moves to the given page and reloads
        expect(injectedModel.offset).toEqual(maxRows * 2);
        expect(injectedModel.currentPage).toEqual(3);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        await waitForRowsLoaded();

        // Act
        dispatch(() => injectedActions.setMaxRows(injectedModel.id, 40));

        // Assert - setMaxRows changes the page size, resets the offset, and reloads
        expect(injectedModel.maxRows).toEqual(40);
        expect(injectedModel.offset).toEqual(0);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        await waitForRowsLoaded();
    });

    test('setSchemaQuery and setView reset rows and reload', async () => {
        // Arrange - start off the first page so the offset reset is observable
        const modelLoader = new MockQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        await renderLoadedModel(modelLoader);
        dispatch(() => injectedActions.loadNextPage(injectedModel.id));
        await waitForRowsLoaded();
        modelLoader.queryInfo = AMINO_ACIDS_QUERY_INFO;
        modelLoader.rowsResponse = AMINO_ACIDS_DATA;

        // Act
        dispatch(() => injectedActions.setSchemaQuery(injectedModel.id, AMINO_ACIDS_SCHEMA_QUERY));

        // Assert - QueryInfo and row data are cleared, then reloaded for the new schemaQuery
        expect(injectedModel.schemaQuery).toBe(AMINO_ACIDS_SCHEMA_QUERY);
        expect(injectedModel.queryInfo).toEqual(undefined);
        expect(injectedModel.queryInfoLoadingState).toBe(LoadingState.LOADING);
        expect(injectedModel.offset).toEqual(0);
        expect(injectedModel.rows).toEqual(undefined);
        expect(injectedModel.orderedRows).toEqual(undefined);
        expect(injectedModel.rowCount).toEqual(undefined);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.INITIALIZED);
        await waitForRowsLoaded();
        expect(injectedModel.queryInfo).toBe(AMINO_ACIDS_QUERY_INFO);
        expect(injectedModel.messages).toBe(AMINO_ACIDS_DATA.messages);

        // Act
        dispatch(() => injectedActions.setView(injectedModel.id, 'FakeView'));

        // Assert - row data and messages are cleared and rows reload for the new view
        expect(injectedModel.schemaQuery.viewName).toEqual('FakeView');
        expect(injectedModel.offset).toEqual(0);
        expect(injectedModel.rows).toEqual(undefined);
        expect(injectedModel.orderedRows).toEqual(undefined);
        expect(injectedModel.rowCount).toEqual(undefined);
        expect(injectedModel.messages).toEqual(undefined);
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        await waitForRowsLoaded();
    });

    test('surfaces rows and QueryInfo load errors', async () => {
        // Arrange
        const consoleError = jest.spyOn(console, 'error').mockImplementation(jest.fn());
        const modelLoader = new MockQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        await renderLoadedModel(modelLoader);
        const rowsError = 'Something really bad happened!';
        modelLoader.rowsException = { exception: rowsError };

        // Act
        dispatch(() => injectedActions.loadRows(injectedModel.id));

        // Assert - the resolved rows error is set and the model stops loading
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        await waitFor(() => expect(injectedModel.rowsError).toEqual(rowsError));
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADED);
        expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Error loading rows'), rowsError);

        // Arrange
        const queryInfoError = 'Error loading QueryInfo';
        modelLoader.queryInfoException = { exception: queryInfoError };

        // Act
        dispatch(() => injectedActions.loadModel(injectedModel.id));

        // Assert - the resolved QueryInfo error is set and the model stops loading
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADING);
        await waitFor(() => expect(injectedModel.queryInfoError).toEqual(queryInfoError));
        expect(injectedModel.queryInfoLoadingState).toEqual(LoadingState.LOADED);
        expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('Error loading QueryInfo'), queryInfoError);
    });

    test('addModel adds a model and loads it only when asked', async () => {
        // Arrange
        await renderLoadedModel(new MockQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA));

        // Act
        dispatch(() => injectedActions.addModel({ id: 'model2', schemaQuery: MIXTURES_SCHEMA_QUERY }, false));

        // Assert - model2 exists but is not loading
        expect(injectedModels.model2.id).toEqual('model2');
        expect(injectedModels.model2.schemaQuery).toBe(MIXTURES_SCHEMA_QUERY);
        expect(injectedModels.model2.queryInfoLoadingState).toEqual(LoadingState.INITIALIZED);
        expect(injectedModels.model2.rowsLoadingState).toEqual(LoadingState.INITIALIZED);

        // Act
        dispatch(() => injectedActions.addModel({ id: 'model3', schemaQuery: MIXTURES_SCHEMA_QUERY }, true));

        // Assert - model3 starts loading immediately and finishes
        expect(injectedModels.model3.id).toEqual('model3');
        expect(injectedModels.model3.schemaQuery).toBe(MIXTURES_SCHEMA_QUERY);
        expect(injectedModels.model3.queryInfoLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModels.model3.rowsLoadingState).toEqual(LoadingState.INITIALIZED);
        await waitFor(() => {
            expect(injectedModels.model3.queryInfoLoadingState).toEqual(LoadingState.LOADED);
            expect(injectedModels.model3.rowsLoadingState).toEqual(LoadingState.LOADED);
        });

        // Assert - model3's full load cycle has passed and model2 was still never loaded
        expect(injectedModels.model2.queryInfoLoadingState).toEqual(LoadingState.INITIALIZED);
        expect(injectedModels.model2.rowsLoadingState).toEqual(LoadingState.INITIALIZED);
    });

    test('selectRow selects single rows and ranges from the pivot', async () => {
        // Arrange
        await renderLoadedModel(new MockQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA));
        const selectionKey = injectedModel.orderedRows[0];
        const rangeEndKey = injectedModel.orderedRows[5];

        // Act
        dispatch(() => injectedActions.selectRow(injectedModel.id, true, injectedModel.getRow(selectionKey)));

        // Assert - the row is selected and becomes the pivot
        await waitFor(() => expect(injectedModel.selections.has(selectionKey)).toBe(true));
        expect(injectedModel.selections.size).toEqual(1);
        expect(injectedModel.selectionPivot).toEqual({ checked: true, selection: selectionKey });

        // Act
        dispatch(() => injectedActions.selectRow(injectedModel.id, true, injectedModel.getRow(rangeEndKey), true));

        // Assert - every row from the pivot through the clicked row is selected, and the pivot is unchanged
        await waitFor(() => expect(injectedModel.selections.size).toEqual(6));
        expect(injectedModel.selections).toEqual(new Set(injectedModel.orderedRows.slice(0, 6)));
        expect(injectedModel.selectionPivot).toEqual({ checked: true, selection: selectionKey });

        // Act
        dispatch(() => injectedActions.clearSelections(injectedModel.id));

        // Assert - selections and the pivot are cleared
        await waitFor(() => expect(injectedModel.selections.size).toEqual(0));
        expect(injectedModel.selectionPivot).toBeUndefined();
    });

    test('Bind from URL', async () => {
        // Arrange
        const modelLoader = new MockQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        const queryConfigs = { model: { schemaQuery: MIXTURES_SCHEMA_QUERY, bindURL: true } };
        // A fresh element each time, since rerendering an identical element is a no-op
        const component = (): ReactNode => (
            <WrappedModelCapture autoLoad modelLoader={modelLoader} queryConfigs={queryConfigs} />
        );
        rrd.__setSearchParams(new URLSearchParams({ 'query.p': '2' }));

        // Act
        const { rerender } = render(component());

        // Assert - the initial load starts on the page from the URL
        await waitForRowsLoaded();
        expect(injectedModel.offset).toEqual(20);

        // Act
        rrd.__setSearchParams(new URLSearchParams({ 'query.view': 'noMixtures' }));
        rerender(component());

        // Assert - the view is applied and rows reload
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        await waitForRowsLoaded();
        expect(injectedModel.schemaQuery.viewName).toEqual('noMixtures');

        // Act
        rrd.__setSearchParams(new URLSearchParams({ 'query.Name~eq': 'DMXP' }));
        rerender(component());

        // Assert - the filter is parsed onto the model and rows reload
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.filterArray.length).toEqual(1);
        const filter = injectedModel.filterArray[0];
        expect(filter.getColumnName()).toEqual('Name');
        expect(filter.getValue()).toEqual('DMXP');
        expect(filter.getFilterType()).toEqual(Filter.Types.EQUAL);
        await waitForRowsLoaded();

        // Act
        rrd.__setSearchParams(new URLSearchParams({ 'query.sort': 'Name' }));
        rerender(component());

        // Assert - an unprefixed sort is parsed as ascending and rows reload
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.sorts.length).toEqual(1);
        expect(injectedModel.sorts[0].fieldKey).toEqual('Name');
        expect(injectedModel.sorts[0].dir).toEqual(SORT_ASC);
        await waitForRowsLoaded();

        // Act
        rrd.__setSearchParams(new URLSearchParams({ 'query.sort': 'Name,-expirationTime' }));
        rerender(component());

        // Assert - multiple sorts are parsed in order with their directions and rows reload
        expect(injectedModel.rowsLoadingState).toEqual(LoadingState.LOADING);
        expect(injectedModel.sorts.length).toEqual(2);
        expect(injectedModel.sorts[1].fieldKey).toEqual('expirationTime');
        expect(injectedModel.sorts[1].dir).toEqual(SORT_DESC);
        await waitForRowsLoaded();

        // Act
        rrd.__setSearchParams(new URLSearchParams({ 'query.selectedReportIds': 'db:1;db:2' }));
        rerender(component());

        // Assert - the report ids are split onto the model
        expect(injectedModel.selectedReportIds).toEqual(['db:1', 'db:2']);
    });

    test('Bind to URL', async () => {
        // Arrange
        const mockSetSearchParams = jest.fn();
        rrd.__setSetSearchParams(mockSetSearchParams);
        const modelLoader = new MockQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        const queryConfigs = { model: { schemaQuery: MIXTURES_SCHEMA_QUERY, bindURL: true } };
        render(<WrappedModelCapture autoLoad modelLoader={modelLoader} queryConfigs={queryConfigs} />);
        await waitForRowsLoaded();

        async function expectURLUpdate(
            expected: Record<string, string>,
            current = new URLSearchParams()
        ): Promise<void> {
            await waitFor(() => expect(mockSetSearchParams.mock.lastCall?.[0](current)).toEqual(expected));
            expect(mockSetSearchParams.mock.lastCall[1]).toEqual({ replace: true });
        }

        // Act
        dispatch(() => injectedActions.loadLastPage(injectedModel.id));

        // Assert - the page is written to the URL and params without the model's prefix are kept
        await expectURLUpdate({ 'query.p': '34', other: 'still here' }, new URLSearchParams({ other: 'still here' }));
        await waitForRowsLoaded();

        // Act
        dispatch(() => injectedActions.loadFirstPage(injectedModel.id));

        // Assert - page 1 removes the "p" param
        await expectURLUpdate({});
        await waitForRowsLoaded();

        // Act
        dispatch(() => injectedActions.loadNextPage(injectedModel.id));

        // Assert - the next page is written to the URL
        await expectURLUpdate({ 'query.p': '2' });
        await waitForRowsLoaded();

        // Act
        const expectedQuery: Record<string, string> = { 'query.Name~eq': 'DMXP' };
        dispatch(() =>
            injectedActions.setFilters(injectedModel.id, [Filter.create('Name', 'DMXP', Filter.Types.EQUAL)])
        );

        // Assert - the filter is written and, since filtering resets the offset, "p" is dropped
        await expectURLUpdate(expectedQuery);
        await waitForRowsLoaded();

        // Act
        expectedQuery['query.sort'] = '-Name,+expirationTime';
        dispatch(() =>
            injectedActions.setSorts(injectedModel.id, [
                new QuerySort({ fieldKey: 'Name', dir: SORT_DESC }),
                new QuerySort({ fieldKey: 'expirationTime', dir: SORT_ASC }),
            ])
        );

        // Assert - sorts are written with explicit directions
        await expectURLUpdate(expectedQuery);
        await waitForRowsLoaded();

        // Act
        expectedQuery['query.view'] = 'noMixtures';
        dispatch(() => injectedActions.setView(injectedModel.id, 'noMixtures'));

        // Assert - the view is written to the URL
        await expectURLUpdate(expectedQuery);
        await waitForRowsLoaded();

        // Act
        expectedQuery['query.selectedReportIds'] = 'db:1';
        dispatch(() => injectedActions.selectReport(injectedModel.id, 'db:1', true));

        // Assert - the selected report is written to the URL
        await expectURLUpdate(expectedQuery);

        // Act
        expectedQuery['query.selectedReportIds'] = 'db:1;db:2';
        dispatch(() => injectedActions.selectReport(injectedModel.id, 'db:2', true));

        // Assert - additional reports are appended with ";"
        await expectURLUpdate(expectedQuery);

        // Act
        expectedQuery['query.selectedReportIds'] = 'db:2';
        dispatch(() => injectedActions.selectReport(injectedModel.id, 'db:1', false));

        // Assert - unselecting a report removes only that id
        await expectURLUpdate(expectedQuery);
    });
});
