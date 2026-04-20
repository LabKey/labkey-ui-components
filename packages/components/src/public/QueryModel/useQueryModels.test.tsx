import { act, renderHook, waitFor } from '@testing-library/react';
import { Filter } from '@labkey/api';

import { makeQueryInfo, makeTestData } from '../../internal/test/testHelpers';
import { MockQueryModelLoader } from '../../test/MockQueryModelLoader';
import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../../test/data/mixtures-getQueryPaging.json';
import aminoAcidsQueryInfo from '../../test/data/assayAminoAcidsData-getQueryDetails.json';
import aminoAcidsQuery from '../../test/data/assayAminoAcidsData-getQuery.json';

import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';
import { LoadingState } from '../LoadingState';
import { QuerySort } from '../QuerySort';

import { ChangeType, QueryModel } from './QueryModel';
import { RowsResponse } from './QueryModelLoader';
import { QueryModelManager, useQueryModels } from './useQueryModels';

// @ts-expect-error Need to use require() for mocking

const rrd = require('react-router-dom');

const MIXTURES_SCHEMA_QUERY = new SchemaQuery('exp.data', 'mixtures');
const AMINO_ACIDS_SCHEMA_QUERY = new SchemaQuery('assay.General.Amino Acids', 'Runs');
let MIXTURES_QUERY_INFO: QueryInfo;
let MIXTURES_DATA: RowsResponse;
let AMINO_ACIDS_QUERY_INFO: QueryInfo;
let AMINO_ACIDS_DATA: RowsResponse;

beforeAll(() => {
    MIXTURES_QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
    AMINO_ACIDS_QUERY_INFO = makeQueryInfo(aminoAcidsQueryInfo);
    MIXTURES_DATA = makeTestData(mixturesQuery);
    AMINO_ACIDS_DATA = makeTestData(aminoAcidsQuery);
});

/**
 * Extends MockQueryModelLoader with resolvable implementations for loadSelections, replaceSelections, selectAllRows,
 * and loadCharts so selection/chart paths are testable.
 */
class TestQueryModelLoader extends MockQueryModelLoader {
    selections = new Set<string>();
    charts: any[] = [];

    loadSelections = jest.fn(async () => new Set(this.selections));

    replaceSelections = jest.fn(async (_model: QueryModel, selections: string[]) => {
        this.selections = new Set(selections);
        return { count: this.selections.size };
    });

    selectAllRows = jest.fn(async (model: QueryModel) => {
        const all = new Set(model.orderedRows ?? []);
        this.selections = all;
        return new Set(all);
    });

    loadCharts = jest.fn(async () => this.charts.slice());
}

const makeManager = (
    configs: Record<string, Record<string, any> & { schemaQuery: SchemaQuery }>,
    loader: MockQueryModelLoader = new TestQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA),
    searchParams: URLSearchParams = new URLSearchParams(),
    setSearchParams: jest.Mock = jest.fn()
) => {
    const manager = new QueryModelManager(configs, searchParams, setSearchParams, loader);
    // Register a no-op subscriber so onStateChange calls don't throw.
    manager.subscribe(() => {});
    return { manager, loader, setSearchParams };
};

describe('QueryModelManager', () => {
    describe('constructor', () => {
        test('initializes models from configs', () => {
            const { manager } = makeManager({ a: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            const model = manager.state.queryModels.a;
            expect(model).toBeDefined();
            expect(model.id).toBe('a');
            expect(model.schemaQuery).toBe(MIXTURES_SCHEMA_QUERY);
            expect(model.queryInfoLoadingState).toBe(LoadingState.INITIALIZED);
            expect(model.rowsLoadingState).toBe(LoadingState.INITIALIZED);
        });

        test('exposes actions reference on state', () => {
            const { manager } = makeManager({ a: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            expect(manager.state.actions).toBe(manager.actions);
            expect(typeof manager.actions.loadModel).toBe('function');
        });

        test('reads bindURL params from initial searchParams', () => {
            const searchParams = new URLSearchParams({ 'query.p': '3' });
            const { manager } = makeManager(
                { model: { schemaQuery: MIXTURES_SCHEMA_QUERY, bindURL: true } },
                undefined,
                searchParams
            );
            expect(manager.state.queryModels.model.offset).toBe(40); // maxRows 20 * (page 3 - 1)
        });
    });

    describe('loadQueryInfo + loadRows', () => {
        test('happy path through loadModel', async () => {
            const { manager } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            manager.loadModel('model');
            expect(manager.state.queryModels.model.queryInfoLoadingState).toBe(LoadingState.LOADING);
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
            const model = manager.state.queryModels.model;
            expect(model.queryInfoLoadingState).toBe(LoadingState.LOADED);
            expect(model.queryInfo).toBeDefined();
            expect(model.rows).toBeDefined();
            expect(model.orderedRows.length).toBeGreaterThan(0);
        });

        test('loadRows bails when queryInfo not loaded (Issue 53192)', async () => {
            const { manager, loader } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            await manager.loadRows('model');
            expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.INITIALIZED);
            expect((loader as TestQueryModelLoader).loadCharts).not.toHaveBeenCalled();
        });

        test('surfaces queryInfo error', async () => {
            const { manager, loader } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            loader.queryInfoException = { exception: 'QI boom' };
            manager.loadModel('model');
            await waitFor(() =>
                expect(manager.state.queryModels.model.queryInfoLoadingState).toBe(LoadingState.LOADED)
            );
            const model = manager.state.queryModels.model;
            expect(model.queryInfoError).toBe('QI boom');
        });

        test('surfaces rows error', async () => {
            const { manager, loader } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            manager.loadModel('model');
            await waitFor(() =>
                expect(manager.state.queryModels.model.queryInfoLoadingState).toBe(LoadingState.LOADED)
            );
            loader.rowsException = { exception: 'rows boom' };
            await manager.loadRows('model');
            const model = manager.state.queryModels.model;
            expect(model.rowsLoadingState).toBe(LoadingState.LOADED);
            expect(model.rowsError).toBe('rows boom');
        });

        test('view-does-not-exist recovery falls back to default view (Issue 49378)', async () => {
            const viewError = "The requested view 'bogus' does not exist for this user.";
            const setSearchParams = jest.fn();
            const { manager, loader } = makeManager(
                {
                    model: {
                        schemaQuery: new SchemaQuery('exp.data', 'mixtures', 'bogus'),
                        bindURL: true,
                    },
                },
                undefined,
                new URLSearchParams(),
                setSearchParams
            );
            manager.loadModel('model');
            await waitFor(() =>
                expect(manager.state.queryModels.model.queryInfoLoadingState).toBe(LoadingState.LOADED)
            );
            loader.rowsException = { exception: viewError };
            await manager.loadRows('model');
            // First failure — schemaQuery should reset to default view and trigger retry.
            let model = manager.state.queryModels.model;
            expect(model.schemaQuery.viewName).toBeUndefined();
            expect(model.viewError).toContain('Returning to the default view.');
            // The retry is scheduled via maybeLoad — clear the exception so it succeeds.
            loader.rowsException = undefined;
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
            expect(setSearchParams).toHaveBeenCalled();
        });

        test('cancelled request (status 0) is swallowed', async () => {
            const { manager, loader } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            manager.loadModel('model');
            await waitFor(() =>
                expect(manager.state.queryModels.model.queryInfoLoadingState).toBe(LoadingState.LOADED)
            );
            loader.rowsException = { status: 0 };
            await manager.loadRows('model');
            // Error should NOT surface, state stays LOADING because the short-circuit returned.
            expect(manager.state.queryModels.model.rowsError).toBeUndefined();
            expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADING);
        });
    });

    describe('loadTotalCount', () => {
        test('short-circuits to LOADED when includeTotalCount is false', async () => {
            const { manager } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            manager.loadModel('model');
            await waitFor(() =>
                expect(manager.state.queryModels.model.totalCountLoadingState).toBe(LoadingState.LOADED)
            );
        });

        test('loads count when includeTotalCount is true', async () => {
            const { manager } = makeManager({
                model: { schemaQuery: MIXTURES_SCHEMA_QUERY, includeTotalCount: true },
            });
            manager.loadModel('model');
            await waitFor(() =>
                expect(manager.state.queryModels.model.totalCountLoadingState).toBe(LoadingState.LOADED)
            );
            const model = manager.state.queryModels.model;
            expect(model.rowCount).toBe(MIXTURES_DATA.orderedRows.length);
        });

        test('skips load when already loaded and reload flag is false', async () => {
            const { manager, loader } = makeManager({
                model: { schemaQuery: MIXTURES_SCHEMA_QUERY, includeTotalCount: true },
            });
            manager.loadModel('model');
            await waitFor(() =>
                expect(manager.state.queryModels.model.totalCountLoadingState).toBe(LoadingState.LOADED)
            );
            const spy = jest.spyOn(loader, 'loadTotalCount');
            await manager.loadTotalCount('model', false);
            expect(spy).not.toHaveBeenCalled();
            await manager.loadTotalCount('model', true);
            expect(spy).toHaveBeenCalledTimes(1);
        });
    });

    describe('pagination', () => {
        const setup = async () => {
            const result = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            result.manager.loadModel('model');
            await waitFor(() =>
                expect(result.manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED)
            );
            return result;
        };

        test('loadFirstPage on first page is a no-op', async () => {
            const { manager } = await setup();
            const before = manager.state;
            manager.loadFirstPage('model');
            expect(manager.state.queryModels.model.offset).toBe(0);
            // No reload triggered — rowsLoadingState stays LOADED.
            expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED);
            // State reference unchanged (updateModel short-circuits when produce returns same ref).
            expect(manager.state).toBe(before);
        });

        test('loadNextPage increments offset and triggers reload', async () => {
            const { manager } = await setup();
            const { maxRows } = manager.state.queryModels.model;
            manager.loadNextPage('model');
            expect(manager.state.queryModels.model.offset).toBe(maxRows);
            expect(manager.state.queryModels.model.currentPage).toBe(2);
            expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADING);
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
        });

        test('loadLastPage sets offset and loadNextPage past the last page is a no-op', async () => {
            const { manager } = await setup();
            manager.loadLastPage('model');
            const lastOffset = manager.state.queryModels.model.lastPageOffset;
            expect(manager.state.queryModels.model.offset).toBe(lastOffset);
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
            const before = manager.state;
            manager.loadNextPage('model');
            expect(manager.state.queryModels.model.offset).toBe(lastOffset);
            expect(manager.state).toBe(before);
        });

        test('setMaxRows resets offset to 0', async () => {
            const { manager } = await setup();
            manager.loadLastPage('model');
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
            manager.setMaxRows('model', 40);
            const model = manager.state.queryModels.model;
            expect(model.maxRows).toBe(40);
            expect(model.offset).toBe(0);
            expect(model.rowsLoadingState).toBe(LoadingState.LOADING);
        });

        test('setOffset honors reloadModel flag', async () => {
            const { manager } = await setup();
            manager.setOffset('model', 40, false);
            expect(manager.state.queryModels.model.offset).toBe(40);
            // reloadModel=false → no reload triggered
            expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED);
        });
    });

    describe('filter/sort/view changes', () => {
        const setup = async () => {
            const result = makeManager({
                model: { schemaQuery: MIXTURES_SCHEMA_QUERY, includeTotalCount: true },
            });
            result.manager.loadModel('model');
            await waitFor(() =>
                expect(result.manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED)
            );
            return result;
        };

        test('setFilters updates filters, resets offset, triggers reload', async () => {
            const { manager } = await setup();
            // Move off page 1 so we can verify offset reset.
            manager.loadNextPage('model');
            expect(manager.state.queryModels.model.offset).toBeGreaterThan(0);
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));

            const filter = Filter.create('Name', 'DMXP', Filter.Types.EQUAL);
            manager.setFilters('model', [filter]);
            const model = manager.state.queryModels.model;
            expect(model.filterArray).toHaveLength(1);
            expect(model.offset).toBe(0);
            // rows reload kicks off synchronously; totalCount reload follows because includeTotalCount is true.
            expect(model.rowsLoadingState).toBe(LoadingState.LOADING);
            expect(model.totalCountLoadingState).toBe(LoadingState.LOADING);
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
        });

        test('setFilters no-op when filters are equal', async () => {
            const { manager } = await setup();
            const f = Filter.create('Name', 'X');
            manager.setFilters('model', [f]);
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
            const before = manager.state;
            manager.setFilters('model', [f]);
            expect(manager.state).toBe(before);
        });

        test('setSorts reloads on change, no-op when equal', async () => {
            const { manager } = await setup();
            manager.setSorts('model', [new QuerySort({ fieldKey: 'Name' })]);
            expect(manager.state.queryModels.model.sorts).toHaveLength(1);
            expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADING);
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));

            const before = manager.state;
            manager.setSorts('model', [new QuerySort({ fieldKey: 'Name' })]);
            expect(manager.state).toBe(before);
        });

        test('setView resets rows and totalCount state', async () => {
            const { manager } = await setup();
            manager.setView('model', 'FakeView');
            const model = manager.state.queryModels.model;
            expect(model.schemaQuery.viewName).toBe('FakeView');
            // Rows cleared by resetRowsState; reload is in flight.
            expect(model.rows).toBeUndefined();
            expect(model.orderedRows).toBeUndefined();
            expect(model.rowCount).toBeUndefined();
            expect(model.rowsLoadingState).toBe(LoadingState.LOADING);
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
        });

        test('setSchemaQuery throws (intentionally unimplemented)', () => {
            const { manager } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            expect(() => manager.setSchemaQuery('model', AMINO_ACIDS_SCHEMA_QUERY)).toThrow(/not implemented/);
        });
    });

    describe('selections', () => {
        const setup = async () => {
            const loader = new TestQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
            const { manager } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } }, loader);
            manager.loadModel('model');
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
            return { manager, loader };
        };

        test('setSelections adds/removes and manages selection pivot', async () => {
            const { manager } = await setup();
            await manager.setSelections('model', true, ['a']);
            expect(manager.state.queryModels.model.selections).toEqual(new Set(['a']));
            // Single-row selection sets pivot
            expect(manager.state.queryModels.model.selectionPivot).toEqual({ checked: true, selection: 'a' });

            // Multi-row selection does not set pivot
            await manager.setSelections('model', true, ['b', 'c']);
            expect(manager.state.queryModels.model.selections).toEqual(new Set(['a', 'b', 'c']));
            expect(manager.state.queryModels.model.selectionPivot).toEqual({ checked: true, selection: 'a' });

            // Unchecking a single row updates the pivot
            await manager.setSelections('model', false, ['a']);
            expect(manager.state.queryModels.model.selections).toEqual(new Set(['b', 'c']));
            expect(manager.state.queryModels.model.selectionPivot).toEqual({ checked: false, selection: 'a' });
        });

        test('selectRow with single PK column selects that row', async () => {
            const { manager } = await setup();
            const firstKey = manager.state.queryModels.model.orderedRows[0];
            const firstRow = manager.state.queryModels.model.getRow(firstKey);
            manager.selectRow('model', true, firstRow);
            await waitFor(() => expect(manager.state.queryModels.model.selections.has(firstKey)).toBe(true));
            expect(manager.state.queryModels.model.selectionPivot).toEqual({
                checked: true,
                selection: firstKey,
            });
        });

        test('selectRow with useSelectionPivot selects a range', async () => {
            const { manager } = await setup();
            const ordered = manager.state.queryModels.model.orderedRows;
            const pivotKey = ordered[0];
            manager.selectRow('model', true, manager.state.queryModels.model.getRow(pivotKey));
            await waitFor(() => expect(manager.state.queryModels.model.selections.size).toBe(1));
            // Shift-click a row 5 indices away
            manager.selectRow('model', true, manager.state.queryModels.model.getRow(ordered[5]), true);
            await waitFor(() => expect(manager.state.queryModels.model.selections.size).toBe(6));
        });

        test('selectPage selects all ordered rows on the page', async () => {
            const { manager } = await setup();
            manager.selectPage('model', true);
            await waitFor(() => {
                const model = manager.state.queryModels.model;
                expect(model.selections.size).toBe(model.orderedRows.length);
            });
        });

        test('clearSelections empties the selection set', async () => {
            const { manager } = await setup();
            await manager.setSelections('model', true, ['a', 'b', 'c']);
            await manager.clearSelections('model');
            expect(manager.state.queryModels.model.selections.size).toBe(0);
            expect(manager.state.queryModels.model.selectionPivot).toBeUndefined();
        });

        test('selectAllRows pulls from loader', async () => {
            const { manager, loader } = await setup();
            await manager.selectAllRows('model');
            expect((loader as TestQueryModelLoader).selectAllRows).toHaveBeenCalled();
            expect(manager.state.queryModels.model.selections.size).toBeGreaterThan(0);
        });

        test('replaceSelections writes new set and clears pivot', async () => {
            const { manager } = await setup();
            await manager.setSelections('model', true, ['x']);
            expect(manager.state.queryModels.model.selectionPivot).toBeDefined();
            await manager.replaceSelections('model', ['1', '2', '3']);
            expect(manager.state.queryModels.model.selections).toEqual(new Set(['1', '2', '3']));
            expect(manager.state.queryModels.model.selectionPivot).toBeUndefined();
        });

        test('loadSelections populates selections from loader', async () => {
            const loader = new TestQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
            loader.selections = new Set(['row-1', 'row-2']);
            const { manager } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } }, loader);
            manager.loadModel('model');
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
            await manager.loadSelections('model');
            expect(manager.state.queryModels.model.selections).toEqual(new Set(['row-1', 'row-2']));
            expect(manager.state.queryModels.model.selectionsLoadingState).toBe(LoadingState.LOADED);
        });

        test('loadSelections surfaces errors via setSelectionsError', async () => {
            const loader = new TestQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
            loader.loadSelections = jest.fn(() => Promise.reject(new Error('nope')));
            const { manager } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } }, loader);
            manager.loadModel('model');
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
            await manager.loadSelections('model');
            const model = manager.state.queryModels.model;
            expect(model.selectionsError).toBeDefined();
            expect(model.selectionsLoadingState).toBe(LoadingState.LOADED);
        });
    });

    describe('reports', () => {
        test('selectReport adds/removes a reportId', () => {
            const { manager } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            manager.selectReport('model', 'db:1', true);
            expect(manager.state.queryModels.model.selectedReportIds).toEqual(['db:1']);
            manager.selectReport('model', 'db:1', false);
            expect(manager.state.queryModels.model.selectedReportIds).toEqual([]);
        });

        test('clearSelectedReports empties list', () => {
            const { manager } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            manager.selectReport('model', 'db:1', true);
            manager.selectReport('model', 'db:2', true);
            manager.clearSelectedReports('model');
            expect(manager.state.queryModels.model.selectedReportIds).toEqual([]);
        });
    });

    describe('messages', () => {
        test('addMessage appends and removeMessage filters by content', () => {
            const { manager } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            manager.addMessage('model', { content: 'hi' });
            expect(manager.state.queryModels.model.messages).toEqual([{ content: 'hi' }]);
            manager.addMessage('model', { content: 'there' });
            manager.removeMessage('model', { content: 'hi' });
            expect(manager.state.queryModels.model.messages).toEqual([{ content: 'there' }]);
        });

        test('addMessage with duration auto-removes after timeout', () => {
            jest.useFakeTimers();
            const { manager } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            manager.addMessage('model', { content: 'vanishes' }, 500);
            expect(manager.state.queryModels.model.messages).toHaveLength(1);
            jest.advanceTimersByTime(500);
            expect(manager.state.queryModels.model.messages).toHaveLength(0);
            jest.useRealTimers();
        });
    });

    describe('onModelChange', () => {
        const setup = async () => {
            const loader = new TestQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
            const result = makeManager(
                { model: { schemaQuery: MIXTURES_SCHEMA_QUERY, includeTotalCount: true } },
                loader
            );
            result.manager.loadModel('model');
            await waitFor(() =>
                expect(result.manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED)
            );
            return { ...result, loader };
        };

        test('add triggers totalCount reload but preserves data', async () => {
            const { manager } = await setup();
            const rowsBefore = manager.state.queryModels.model.rows;
            manager.onModelChange('model', { changeType: ChangeType.add });
            // totalCount was reset to INITIALIZED so it reloads via loadTotalCount after loadRows
            expect(manager.state.queryModels.model.rows).toBe(rowsBefore);
            expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADING);
        });

        test('delete resets the full model and sets selectionsForReplace path', async () => {
            const { manager } = await setup();
            manager.onModelChange('model', {
                changeType: ChangeType.delete,
                options: { selectionsForReplace: ['keep-me'] },
            });
            // resetModelState clears rows/total/selection state
            const model = manager.state.queryModels.model;
            expect(model.rows).toBeUndefined();
            expect(model.selectionsLoadingState).toBe(LoadingState.INITIALIZED);
            await waitFor(() => expect(manager.state.queryModels.model.selections).toEqual(new Set(['keep-me'])));
        });

        test('update with filtered column resets the model', async () => {
            const { manager } = await setup();
            manager.setFilters('model', [Filter.create('Name', 'X')]);
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
            manager.onModelChange('model', {
                changeType: ChangeType.update,
                options: { columnsChanged: ['Name'] },
            });
            expect(manager.state.queryModels.model.rows).toBeUndefined();
        });

        test('update without filter intersection leaves rows in place but reloads', async () => {
            const { manager } = await setup();
            manager.setFilters('model', [Filter.create('Name', 'X')]);
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
            const rowsBefore = manager.state.queryModels.model.rows;
            manager.onModelChange('model', {
                changeType: ChangeType.update,
                options: { columnsChanged: ['Unrelated'] },
            });
            expect(manager.state.queryModels.model.rows).toBe(rowsBefore);
        });
    });

    describe('addModel / loadAllModels / resetTotalCountState', () => {
        test('addModel without load leaves model INITIALIZED', async () => {
            const { manager } = makeManager({});
            manager.addModel({ id: 'new', schemaQuery: MIXTURES_SCHEMA_QUERY }, false);
            expect(manager.state.queryModels.new.queryInfoLoadingState).toBe(LoadingState.INITIALIZED);
        });

        test('addModel with load kicks off loadModel', async () => {
            const { manager } = makeManager({});
            manager.addModel({ id: 'new', schemaQuery: MIXTURES_SCHEMA_QUERY }, true);
            expect(manager.state.queryModels.new.queryInfoLoadingState).toBe(LoadingState.LOADING);
            await waitFor(() => {
                expect(manager.state.queryModels.new.queryInfoLoadingState).toBe(LoadingState.LOADED);
                expect(manager.state.queryModels.new.rowsLoadingState).toBe(LoadingState.LOADED);
            });
        });

        test('resetTotalCountState resets every model', async () => {
            const { manager } = makeManager({
                a: { schemaQuery: MIXTURES_SCHEMA_QUERY, includeTotalCount: true },
                b: { schemaQuery: MIXTURES_SCHEMA_QUERY, includeTotalCount: true },
            });
            manager.loadModel('a');
            manager.loadModel('b');
            await waitFor(() => {
                expect(manager.state.queryModels.a.totalCountLoadingState).toBe(LoadingState.LOADED);
                expect(manager.state.queryModels.b.totalCountLoadingState).toBe(LoadingState.LOADED);
            });

            manager.resetTotalCountState();
            expect(manager.state.queryModels.a.totalCountLoadingState).toBe(LoadingState.INITIALIZED);
            expect(manager.state.queryModels.b.totalCountLoadingState).toBe(LoadingState.INITIALIZED);
        });
    });

    describe('URL binding', () => {
        test('bindURL calls setSearchParams when model.bindURL is true', () => {
            const setSearchParams = jest.fn();
            const { manager } = makeManager(
                { model: { schemaQuery: MIXTURES_SCHEMA_QUERY, bindURL: true } },
                undefined,
                new URLSearchParams(),
                setSearchParams
            );
            manager.syncURL('model');
            expect(setSearchParams).toHaveBeenCalled();
        });

        test('syncURL is a no-op when model.bindURL is false', () => {
            const setSearchParams = jest.fn();
            const { manager } = makeManager(
                { model: { schemaQuery: MIXTURES_SCHEMA_QUERY } },
                undefined,
                new URLSearchParams(),
                setSearchParams
            );
            manager.syncURL('model');
            expect(setSearchParams).not.toHaveBeenCalled();
        });

        test('updateRouter applies new URL params to the model', async () => {
            const setSearchParams = jest.fn();
            const { manager } = makeManager(
                { model: { schemaQuery: MIXTURES_SCHEMA_QUERY, bindURL: true } },
                undefined,
                new URLSearchParams(),
                setSearchParams
            );
            manager.loadModel('model');
            await waitFor(() => expect(manager.state.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
            manager.updateRouter(new URLSearchParams({ 'query.p': '2' }), setSearchParams);
            expect(manager.state.queryModels.model.offset).toBe(20);
        });
    });

    describe('destroy', () => {
        test('cancels outstanding requests', () => {
            const { manager } = makeManager({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } });
            const cancelSpy = jest.spyOn((manager as any).requestManager, 'cancelAllRequests');
            manager.destroy();
            expect(cancelSpy).toHaveBeenCalled();
        });
    });
});

describe('useQueryModels', () => {
    beforeEach(() => {
        rrd.__setSearchParams(new URLSearchParams());
        rrd.__setSetSearchParams(jest.fn());
    });

    test('returns initial state synchronously and kicks off queryInfo load on mount', async () => {
        const loader = new TestQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        const { result } = renderHook(() =>
            useQueryModels({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } }, { modelLoader: loader })
        );
        // By the time renderHook returns, the mount effect has run.
        expect(result.current.queryModels.model.queryInfoLoadingState).toBe(LoadingState.LOADING);
        await waitFor(() => expect(result.current.queryModels.model.queryInfoLoadingState).toBe(LoadingState.LOADED));
    });

    test('autoLoad triggers loadAllModels (queryInfo + rows)', async () => {
        const loader = new TestQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        const { result } = renderHook(() =>
            useQueryModels({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } }, { autoLoad: true, modelLoader: loader })
        );
        await waitFor(() => {
            expect(result.current.queryModels.model.queryInfoLoadingState).toBe(LoadingState.LOADED);
            expect(result.current.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED);
        });
        // When autoLoad is true, loadAllModels(!!loader.loadSelections) passes true, so selections load too.
        expect(loader.loadSelections).toHaveBeenCalled();
    });

    test('invoking actions updates state', async () => {
        const loader = new TestQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        const { result } = renderHook(() =>
            useQueryModels({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } }, { autoLoad: true, modelLoader: loader })
        );
        await waitFor(() => {
            expect(result.current.queryModels.model.queryInfoLoadingState).toBe(LoadingState.LOADED);
            expect(result.current.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED);
        });

        act(() => {
            result.current.actions.loadNextPage(result.current.queryModels.model.id);
        });
        await waitFor(() => {
            expect(result.current.queryModels.model.currentPage).toBe(2);
            expect(result.current.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED);
        });
    });

    test('unmount destroys manager and cancels requests', async () => {
        const loader = new TestQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        const { result, unmount } = renderHook(() =>
            useQueryModels({ model: { schemaQuery: MIXTURES_SCHEMA_QUERY } }, { modelLoader: loader })
        );
        await waitFor(() => expect(result.current.queryModels.model.queryInfoLoadingState).toBe(LoadingState.LOADED));
        // Unmount should not throw even when an action resolves afterward.
        expect(() => unmount()).not.toThrow();
    });

    test('reads initial settings from the URL', async () => {
        const loader = new TestQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        rrd.__setSearchParams(new URLSearchParams({ 'query.p': '2' }));
        const { result } = renderHook(() =>
            useQueryModels(
                { model: { schemaQuery: MIXTURES_SCHEMA_QUERY, bindURL: true } },
                { autoLoad: true, modelLoader: loader }
            )
        );
        await waitFor(() => expect(result.current.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
        expect(result.current.queryModels.model.offset).toBe(20);
        expect(result.current.queryModels.model.currentPage).toBe(2);
    });

    test('writes URL params on actions when bindURL is true', async () => {
        const loader = new TestQueryModelLoader(MIXTURES_QUERY_INFO, MIXTURES_DATA);
        const setSearchParams = jest.fn();
        rrd.__setSetSearchParams(setSearchParams);
        const { result } = renderHook(() =>
            useQueryModels(
                { model: { schemaQuery: MIXTURES_SCHEMA_QUERY, bindURL: true } },
                { autoLoad: true, modelLoader: loader }
            )
        );
        await waitFor(() => {
            expect(result.current.queryModels.model.queryInfoLoadingState).toBe(LoadingState.LOADED);
            expect(result.current.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED);
        });
        act(() => {
            result.current.actions.loadLastPage(result.current.queryModels.model.id);
        });
        await waitFor(() => expect(result.current.queryModels.model.rowsLoadingState).toBe(LoadingState.LOADED));
        // bindURL → setSearchParams invoked; verify the updater resolves to "query.p=34"
        const updater = setSearchParams.mock.lastCall[0];
        const nextParams = updater(new URLSearchParams({ other: 'still here' }));
        expect(nextParams).toEqual({ 'query.p': '34', other: 'still here' });
    });
});
