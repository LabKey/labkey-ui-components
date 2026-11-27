/*
 * Copyright (c) 2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, ReactNode, useCallback, useState } from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Filter } from '@labkey/api';

import { LoadingState } from '../LoadingState';
import { QueryInfo } from '../QueryInfo';
import { QuerySort, SORT_DESC } from '../QuerySort';
import { SchemaQuery } from '../SchemaQuery';
import { selectRows } from '../../internal/query/selectRows';

import { QueryModelLoader, RowsResponse } from './QueryModelLoader';
import { ChangeType, InjectedQueryModels, RequestManager, withQueryModels } from './withQueryModels';

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
        const onSort = useCallback(
            () => actions.setSorts(MODEL_ID, [new QuerySort({ fieldKey: 'Name', dir: SORT_DESC })]),
            [actions]
        );
        const onSetPageSize = useCallback(() => actions.setMaxRows(MODEL_ID, 50), [actions]);
        const onFilter = useCallback(() => actions.setFilters(MODEL_ID, [Filter.create('Name', 'a')], true), [actions]);
        const onDeleteRows = useCallback(
            () =>
                actions.onModelChange(MODEL_ID, {
                    changeType: ChangeType.delete,
                    options: { selectionsForReplace: ['1'] },
                }),
            [actions]
        );

        return (
            <div>
                <div className="rows-state">{model.rowsLoadingState}</div>
                <div className="rows-error">{model.rowsError}</div>
                <div className="selections-state">{model.selectionsLoadingState}</div>
                <div className="selections-error">{model.selectionsError}</div>
                <div className="total-count-state">{model.totalCountLoadingState}</div>
                <div className="total-count-error">{model.totalCountError}</div>
                <button className="reload-rows" onClick={onReloadRows} type="button" />
                <button className="sort-rows" onClick={onSort} type="button" />
                <button className="set-page-size" onClick={onSetPageSize} type="button" />
                <button className="filter-rows" onClick={onFilter} type="button" />
                <button className="delete-rows" onClick={onDeleteRows} type="button" />
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

    // Resolves rows immediately, except for the loads listed in `deferred` (1-based call numbers), which wait to be
    // rejected so the test can cancel them first
    function rowsLoader(...deferred: number[]): { loadRows: jest.Mock; rejectLoad: (call: number) => void } {
        const rejects: Record<number, (reason: unknown) => void> = {};
        let calls = 0;
        const loadRows = jest.fn((model, requestHandler) => {
            const call = ++calls;
            requestHandler?.(mockXHR());
            if (!deferred.includes(call)) return Promise.resolve(ROWS_RESPONSE);
            return new Promise((resolve, reject) => {
                rejects[call] = reject;
            });
        });
        // A load we canceled rejects with status 0
        return { loadRows, rejectLoad: call => rejects[call]({ status: 0 }) };
    }

    it.each([
        ['a sort', '.sort-rows'],
        ['a page size change', '.set-page-size'],
    ])('loads selections when %s cancels the initial rows load', async (_, trigger) => {
        const { loadRows, rejectLoad } = rowsLoader(1);
        const loadSelections = jest.fn().mockResolvedValue(new Set<string>());
        renderModel(testLoader({ loadRows, loadSelections }));

        await waitFor(() => {
            expect(textOf('.rows-state')).toBe(LoadingState.LOADING);
        });

        await userEvent.click(document.querySelector(trigger));
        rejectLoad(1);

        await waitFor(() => {
            expect(textOf('.selections-state')).toBe(LoadingState.LOADED);
        });
        expect(textOf('.rows-state')).toBe(LoadingState.LOADED);
        expect(loadSelections).toHaveBeenCalledTimes(1);
    });

    it('loads selections when a URL change cancels the initial rows load', async () => {
        const { loadRows, rejectLoad } = rowsLoader(1);
        const loadSelections = jest.fn().mockResolvedValue(new Set<string>());
        const modelLoader = testLoader({ loadRows, loadSelections });
        const queryConfigs = { [MODEL_ID]: { id: MODEL_ID, bindURL: true, schemaQuery: SCHEMA_QUERY } };
        // A fresh element each time, since rerendering an identical element is a no-op
        const component = (): ReactNode => (
            <ModelStateWithQueryModels autoLoad modelLoader={modelLoader} queryConfigs={queryConfigs} />
        );
        rrd.__setSearchParams(new URLSearchParams());
        rrd.__setSetSearchParams(jest.fn());
        const { rerender } = render(component());

        await waitFor(() => {
            expect(textOf('.rows-state')).toBe(LoadingState.LOADING);
        });

        // e.g. browser back/forward while the slow initial load is in flight
        rrd.__setSearchParams(new URLSearchParams({ 'query.sort': 'Name' }));
        rerender(component());
        rejectLoad(1);

        await waitFor(() => {
            expect(textOf('.selections-state')).toBe(LoadingState.LOADED);
        });
        expect(textOf('.rows-state')).toBe(LoadingState.LOADED);
        expect(loadSelections).toHaveBeenCalledTimes(1);
    });

    it('loads selections when a sort cancels a filter reload', async () => {
        const { loadRows, rejectLoad } = rowsLoader(2);
        const loadSelections = jest.fn().mockResolvedValue(new Set<string>());
        renderModel(testLoader({ loadRows, loadSelections }));

        await waitFor(() => {
            expect(textOf('.selections-state')).toBe(LoadingState.LOADED);
        });

        // Filtering reloads rows and selections; the previous rows stay rendered, so a user can sort mid-load
        await userEvent.click(document.querySelector('.filter-rows'));
        await userEvent.click(document.querySelector('.sort-rows'));
        rejectLoad(2);

        await waitFor(() => {
            expect(loadSelections).toHaveBeenCalledTimes(2);
        });
        await waitFor(() => {
            expect(textOf('.selections-state')).toBe(LoadingState.LOADED);
        });
    });

    it('does not reload selections for a sort once they have loaded', async () => {
        const loadSelections = jest.fn().mockResolvedValue(new Set<string>());
        const loadRows = jest.fn().mockResolvedValue(ROWS_RESPONSE);
        renderModel(testLoader({ loadRows, loadSelections }));

        await waitFor(() => {
            expect(textOf('.selections-state')).toBe(LoadingState.LOADED);
        });

        await userEvent.click(document.querySelector('.sort-rows'));

        await waitFor(() => {
            expect(loadRows).toHaveBeenCalledTimes(2);
        });
        await waitFor(() => {
            expect(textOf('.rows-state')).toBe(LoadingState.LOADED);
        });
        expect(loadSelections).toHaveBeenCalledTimes(1);
    });

    it('replaces selections after a delete while the initial rows load is still in flight', async () => {
        const { loadRows } = rowsLoader(1);
        const loadSelections = jest.fn().mockResolvedValue(new Set<string>());
        const replaceSelections = jest.fn().mockResolvedValue({ count: 1 });
        renderModel(testLoader({ loadRows, loadSelections, replaceSelections }));

        await waitFor(() => {
            expect(textOf('.rows-state')).toBe(LoadingState.LOADING);
        });

        // The delete's reload is untracked, so it neither cancels the initial load nor takes over its selection load
        await userEvent.click(document.querySelector('.delete-rows'));

        await waitFor(() => {
            expect(replaceSelections).toHaveBeenCalledWith(expect.anything(), ['1']);
        });
        expect(loadSelections).not.toHaveBeenCalled();
    });

    it('keeps the saved grid settings when another source aborted the rows request', async () => {
        const removeItem = jest.spyOn(Storage.prototype, 'removeItem');
        const aborted = { aborted: true, exception: 'Request aborted', status: 0 };
        renderModel(testLoader({ loadRows: jest.fn().mockRejectedValue(aborted) }));

        await waitFor(() => {
            expect(textOf('.rows-state')).toBe(LoadingState.LOADED);
        });
        expect(removeItem).not.toHaveBeenCalled();
    });

    it('clears the saved grid settings when the rows request failed', async () => {
        const removeItem = jest.spyOn(Storage.prototype, 'removeItem');
        renderModel(testLoader({ loadRows: jest.fn().mockRejectedValue(TRANSPORT_FAILURE) }));

        await waitFor(() => {
            expect(textOf('.rows-state')).toBe(LoadingState.LOADED);
        });
        expect(removeItem).toHaveBeenCalled();
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

describe('withQueryModels onModelChange', () => {
    const SCHEMA_QUERY = new SchemaQuery('schema', 'query');
    const MODEL_ID = 'model';

    it('never renders the stale rows after an update', async () => {
        const loader: QueryModelLoader = {
            clearSelections: jest.fn().mockResolvedValue({ count: 0 }),
            loadCharts: jest.fn().mockResolvedValue([]),
            loadQueryInfo: jest.fn().mockResolvedValue(new QueryInfo({ schemaQuery: SCHEMA_QUERY })),
            loadRows: jest.fn().mockResolvedValue({ messages: [], orderedRows: [], rowCount: 0, rows: {} }),
            loadSelections: jest.fn().mockResolvedValue(new Set<string>()),
            replaceSelections: jest.fn().mockResolvedValue({ count: 0 }),
            selectAllRows: jest.fn().mockResolvedValue(new Set<string>()),
            setSelections: jest.fn().mockResolvedValue({ count: 0 }),
        };
        const statesAfterSave: LoadingState[] = [];

        const EditablePage: FC<InjectedQueryModels> = ({ actions, queryModels }) => {
            const model = queryModels[MODEL_ID];
            const [editing, setEditing] = useState(true);
            const onSave = useCallback(() => {
                setEditing(false);
                actions.onModelChange(MODEL_ID, { changeType: ChangeType.update });
            }, [actions]);

            if (!editing) statesAfterSave.push(model.rowsLoadingState);

            return (
                <div>
                    <div className="rows-state">{model.rowsLoadingState}</div>
                    <button className="save" onClick={onSave} type="button" />
                </div>
            );
        };
        const EditablePageWithQueryModels = withQueryModels(EditablePage);

        render(
            <EditablePageWithQueryModels
                autoLoad
                modelLoader={loader}
                queryConfigs={{ [MODEL_ID]: { id: MODEL_ID, schemaQuery: SCHEMA_QUERY } }}
            />
        );
        await waitFor(() => {
            expect(document.querySelector('.rows-state').textContent).toBe(LoadingState.LOADED);
        });

        await userEvent.click(document.querySelector('.save'));
        await waitFor(() => {
            expect(loader.loadRows).toHaveBeenCalledTimes(2);
        });
        await waitFor(() => {
            expect(document.querySelector('.rows-state').textContent).toBe(LoadingState.LOADED);
        });

        // The first render without the edit form must already show the reload
        expect(statesAfterSave[0]).toBe(LoadingState.LOADING);
    });
});
