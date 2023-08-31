import React from 'react';
import { mount } from 'enzyme';

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

    test('loading', () => {
        const wrapper = mount(<SelectionStatus actions={ACTIONS} model={MODEL_LOADING} />);
        expect(wrapper.find('.selection-status')).toHaveLength(0);
        expect(wrapper.find('.selection-status__count')).toHaveLength(0);
        expect(wrapper.find('.selection-status__clear-all')).toHaveLength(0);
        expect(wrapper.find('.selection-status__select-all')).toHaveLength(0);
        wrapper.unmount();
    });

    test('no selections, rowCount less than maxRows', () => {
        const model = MODEL_LOADED.mutate({ selections: new Set() });
        const wrapper = mount(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(wrapper.find('.selection-status')).toHaveLength(1);
        expect(wrapper.find('.selection-status__count')).toHaveLength(0);
        expect(wrapper.find('.selection-status__clear-all')).toHaveLength(0);
        expect(wrapper.find('.selection-status__select-all')).toHaveLength(0);
        wrapper.unmount();
    });

    test('no selections, rowCount greater than maxRows', () => {
        const model = MODEL_LOADED.mutate({ selections: new Set(), rowCount: 21 });
        const wrapper = mount(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(wrapper.find('.selection-status')).toHaveLength(1);
        expect(wrapper.find('.selection-status__count')).toHaveLength(0);
        expect(wrapper.find('.selection-status__clear-all')).toHaveLength(0);
        expect(wrapper.find('.selection-status__select-all')).toHaveLength(1);
        expect(wrapper.find('.selection-status__select-all').text()).toBe('Select all 21');
        wrapper.unmount();
    });

    test('no selections, rowCount greater than maxRows but isLoadingTotalCount', () => {
        const model = MODEL_LOADED.mutate({
            selections: new Set(),
            rowCount: 21,
            totalCountLoadingState: LoadingState.LOADING,
        });
        const wrapper = mount(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(wrapper.find('.selection-status')).toHaveLength(1);
        expect(wrapper.find('.selection-status__count')).toHaveLength(0);
        expect(wrapper.find('.selection-status__clear-all')).toHaveLength(0);
        expect(wrapper.find('.selection-status__select-all')).toHaveLength(1);
        expect(wrapper.find('.selection-status__select-all').text()).toBe('Select all ');
        wrapper.unmount();
    });

    test('has selection, rowCount less than maxRows', () => {
        const wrapper = mount(<SelectionStatus actions={ACTIONS} model={MODEL_LOADED} />);
        expect(wrapper.find('.selection-status')).toHaveLength(1);
        expect(wrapper.find('.selection-status__count')).toHaveLength(1);
        expect(wrapper.find('.selection-status__count').text()).toBe('1 of 1 selected');
        expect(wrapper.find('.selection-status__clear-all')).toHaveLength(1);
        expect(wrapper.find('.selection-status__clear-all').text()).toBe('Clear');
        expect(wrapper.find('.selection-status__select-all')).toHaveLength(0);
        wrapper.unmount();
    });

    test('has selections, rowCount greater than maxRows', () => {
        const model = MODEL_LOADED.mutate({ rowCount: 21 });
        const wrapper = mount(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(wrapper.find('.selection-status')).toHaveLength(1);
        expect(wrapper.find('.selection-status__count')).toHaveLength(1);
        expect(wrapper.find('.selection-status__count').text()).toBe('1 of 21 selected');
        expect(wrapper.find('.selection-status__clear-all')).toHaveLength(1);
        expect(wrapper.find('.selection-status__clear-all').text()).toBe('Clear');
        expect(wrapper.find('.selection-status__select-all')).toHaveLength(1);
        expect(wrapper.find('.selection-status__select-all').text()).toBe('Select all 21');
        wrapper.unmount();
    });

    test('has selections, rowCount greater than large maxRows', () => {
        const selectionSet = [];
        for (let i = 0; i < 1031; i++) selectionSet.push(i.toString());
        const model = MODEL_LOADED.mutate({ rowCount: 41321, selections: new Set(selectionSet) });
        const wrapper = mount(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(wrapper.find('.selection-status')).toHaveLength(1);
        expect(wrapper.find('.selection-status__count')).toHaveLength(1);
        expect(wrapper.find('.selection-status__count').text()).toBe('1,031 of 41,321 selected');
        expect(wrapper.find('.selection-status__clear-all')).toHaveLength(1);
        expect(wrapper.find('.selection-status__clear-all').text()).toBe('Clear all');
        expect(wrapper.find('.selection-status__select-all')).toHaveLength(1);
        expect(wrapper.find('.selection-status__select-all').text()).toBe('Select all 41,321');
        wrapper.unmount();
    });

    test('has selections, rowCount greater than maxRows but isLoadingTotalCount', () => {
        const model = MODEL_LOADED.mutate({ rowCount: 21, totalCountLoadingState: LoadingState.LOADING });
        const wrapper = mount(<SelectionStatus actions={ACTIONS} model={model} />);
        expect(wrapper.find('.selection-status')).toHaveLength(1);
        expect(wrapper.find('.selection-status__count')).toHaveLength(1);
        expect(wrapper.find('.selection-status__count').text()).toBe('1 of   selected');
        expect(wrapper.find('.selection-status__clear-all')).toHaveLength(1);
        expect(wrapper.find('.selection-status__clear-all').text()).toBe('Clear');
        expect(wrapper.find('.selection-status__select-all')).toHaveLength(1);
        expect(wrapper.find('.selection-status__select-all').text()).toBe('Select all ');
        wrapper.unmount();
    });
});
