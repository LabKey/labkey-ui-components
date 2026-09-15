/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';

import { SchemaQuery } from '../SchemaQuery';

import { LoadingState } from '../LoadingState';

import { SelectionStatus } from './SelectionStatus';
import { makeTestActions, makeTestQueryModel } from './testUtils';
import { renderWithAppContext } from '../../internal/test/reactTestLibraryHelpers';

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
    const APP_CONTEXT = { serverContext: { moduleContext: { query: { maxQuerySelection: 100_000 } } } };

    test('loading', () => {
        renderWithAppContext(<SelectionStatus actions={ACTIONS} model={MODEL_LOADING} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(0);
    });

    test('no selections, rowCount less than maxRows', () => {
        const model = MODEL_LOADED.mutate({ selections: new Set() });
        renderWithAppContext(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(1);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(0);
    });

    test('no selections, rowCount greater than maxRows', () => {
        const model = MODEL_LOADED.mutate({ selections: new Set(), rowCount: 21 });
        renderWithAppContext(
            <SelectionStatus actions={ACTIONS} model={model} />,
            APP_CONTEXT
        );
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
        renderWithAppContext(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(1);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(0);
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(0);
    });

    test('has selection, rowCount less than maxRows', () => {
        renderWithAppContext(<SelectionStatus actions={ACTIONS} model={MODEL_LOADED} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(1);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(1);
        expect(document.querySelector('.selection-status__count')).toHaveTextContent('1 of 1 selected');
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__clear-all')).toHaveTextContent('Clear');
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(0);
    });

    test('has selections, rowCount greater than maxRows', () => {
        const model = MODEL_LOADED.mutate({ rowCount: 21 });
        renderWithAppContext(
            <SelectionStatus actions={ACTIONS} model={model} />,
            APP_CONTEXT
        );
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
        renderWithAppContext(
            <SelectionStatus actions={ACTIONS} model={model} />,
            APP_CONTEXT
        );
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
        renderWithAppContext(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(document.querySelectorAll('.selection-status')).toHaveLength(1);
        expect(document.querySelectorAll('.selection-status__count')).toHaveLength(1);
        expect(document.querySelector('.selection-status__count')).toHaveTextContent('1 of selected');
        expect(document.querySelectorAll('.selection-status__clear-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__clear-all')).toHaveTextContent('Clear');
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(0);
    });

    test('selection loaded, rowCount greater than maxRows and maxSelectionSize', () => {
        const model = MODEL_LOADED.mutate({ rowCount: 1_115_000 });
        renderWithAppContext(
            <SelectionStatus actions={ACTIONS} model={model} />,
            APP_CONTEXT
        );
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__select-all')).toHaveTextContent('Select first 100,000');
    });

    test('capped rowCount offers "Select first" even when rowCount does not exceed maxSelectionSize', () => {
        // rowCount equals the cap and is not > maxSelectionSize, so only rowCountCapped forces the "first N" label
        const model = MODEL_LOADED.mutate({ rowCount: 100_000, rowCountCapped: true });
        renderWithAppContext(<SelectionStatus actions={ACTIONS} model={model} />, APP_CONTEXT);
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__select-all')).toHaveTextContent('Select first 100,000');
        // a capped total renders with a trailing "+"
        expect(document.querySelector('.selection-status__count')).toHaveTextContent('1 of 100,000+ selected');
    });

    test('capped rowCount still offers select-all when selectionSize equals rowCount', () => {
        // selectionSize === rowCount would normally read as "all selected", but with a cap more rows exist beyond it
        const selectionSet = [];
        for (let i = 0; i < 25; i++) selectionSet.push(i.toString());
        const model = MODEL_LOADED.mutate({ rowCount: 25, rowCountCapped: true, selections: new Set(selectionSet) });
        renderWithAppContext(<SelectionStatus actions={ACTIONS} model={model} />, APP_CONTEXT);
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(1);
        expect(document.querySelector('.selection-status__select-all')).toHaveTextContent('Select first 100,000');
    });

    test('exact rowCount exceeding maxSelectionSize shows no "+" in the count', () => {
        // Once the exact total is known (rowCountCapped false), the total is precise even though it exceeds the
        // selection cap, so the count must not render a trailing "+".
        const smallLimitContext = { serverContext: { moduleContext: { query: { maxQuerySelection: 3 } } } };
        const model = MODEL_LOADED.mutate({
            rowCount: 5,
            rowCountCapped: false,
            selections: new Set(['1', '2', '3']),
        });
        renderWithAppContext(<SelectionStatus actions={ACTIONS} model={model} />, smallLimitContext);
        expect(document.querySelector('.selection-status__count')).toHaveTextContent('3 of 5 selected');
        // the whole selectable set is already selected, so no select-all button
        expect(document.querySelectorAll('.selection-status__select-all')).toHaveLength(0);
    });
});
