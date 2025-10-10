import React from 'react';

import { render } from '@testing-library/react';

import { SchemaQuery } from '../SchemaQuery';

import { LoadingState } from '../LoadingState';

import { SelectionStatus } from './SelectionStatus';
import { makeTestActions, makeTestQueryModel } from './testUtils';

describe('SelectionStatus', () => {
    const MODEL_LOADING = makeTestQueryModel(new SchemaQuery('schema', 'query'), undefined, [], 0).mutate({
        queryInfoLoadingState: LoadingState.LOADING,
        selectionsLoadingState: LoadingState.LOADING,
        rowsLoadingState: LoadingState.LOADING,
        totalCountLoadingState: LoadingState.LOADING,
    });
    const MODEL_LOADED = MODEL_LOADING.mutate({
        queryInfoLoadingState: LoadingState.LOADED,
        selectionsLoadingState: LoadingState.LOADED,
        rowsLoadingState: LoadingState.LOADED,
        totalCountLoadingState: LoadingState.LOADED,
        selections: new Set(['1']),
        rowCount: 1,
    });
    const ACTIONS = makeTestActions();

    beforeEach(() => {
        LABKEY.moduleContext.query = { maxQuerySelection: 100_000 };
    });

    test('loading', () => {
        render(<SelectionStatus actions={ACTIONS} model={MODEL_LOADING} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(0);
    });

    test('no selections, rowCount less than maxRows', () => {
        const model = MODEL_LOADED.mutate({ selections: new Set() });
        render(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(1);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(0);
    });

    test('no selections, rowCount greater than maxRows', () => {
        const model = MODEL_LOADED.mutate({ selections: new Set(), rowCount: 21 });
        render(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(1);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__select-all')).toHaveTextContent('Select all 21');
    });

    test('no selections, rowCount greater than maxRows but isLoadingTotalCount', () => {
        const model = MODEL_LOADED.mutate({
            selections: new Set(),
            rowCount: 21,
            totalCountLoadingState: LoadingState.LOADING,
        });
        render(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(1);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(0);
    });

    test('has selection, rowCount less than maxRows', () => {
        render(<SelectionStatus actions={ACTIONS} model={MODEL_LOADED} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(1);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(1);
        expect(document.querySelector('.selection-status__count')).toHaveTextContent('1 of 1 selected');
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__clear-all')).toHaveTextContent('Clear');
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(0);
    });

    test('has selections, rowCount greater than maxRows', () => {
        const model = MODEL_LOADED.mutate({ rowCount: 21 });
        render(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(1);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(1);
        expect(document.querySelector('.selection-status__count')).toHaveTextContent('1 of 21 selected');
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__clear-all')).toHaveTextContent('Clear');
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__select-all')).toHaveTextContent('Select all 21');
    });

    test('has selections, rowCount greater than large maxRows', () => {
        const selectionSet = [];
        for (let i = 0; i < 1031; i++) {
            selectionSet.push(i.toString());
        }
        const model = MODEL_LOADED.mutate({ rowCount: 41321, selections: new Set(selectionSet) });
        render(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(1);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(1);
        expect(document.querySelector('.selection-status__count')).toHaveTextContent('1,031 of 41,321 selected');
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__clear-all')).toHaveTextContent('Clear all');
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__select-all')).toHaveTextContent('Select all 41,321');
    });

    test('has selections, rowCount greater than maxRows but isLoadingTotalCount', () => {
        const model = MODEL_LOADED.mutate({ rowCount: 21, totalCountLoadingState: LoadingState.LOADING });
        render(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(1);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(1);
        expect(document.querySelector('.selection-status__count')).toHaveTextContent('1 of selected');
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__clear-all')).toHaveTextContent('Clear');
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(0);
    });

    test('selection loaded, rowCount greater than maxRows and maxSelectionSize', () => {
        const model = MODEL_LOADED.mutate({ rowCount: 1_115_000 });
        render(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__select-all')).toHaveTextContent('Select first 100,000');
    });
});
