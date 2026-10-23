/*
 * Copyright (c) 2024-2026 LabKey Corporation. All rights reserved. No portion of this work may be reproduced
 * in any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import { userEvent } from '@testing-library/user-event';
import { render } from '@testing-library/react';
import { Filter } from '@labkey/api';

import { SearchAction } from './grid/actions/Search';
import { ViewAction } from './grid/actions/View';
import { FilterAction } from './grid/actions/Filter';

import { FilterStatus } from './FilterStatus';
import { SortAction } from './grid/actions/Sort';

describe('FilterStatus', () => {
    const ON_CLICK = jest.fn();
    const ON_REMOVE = jest.fn();
    const ON_REMOVE_ALL = jest.fn();
    const DEFAULT_PROPS = {
        actionValues: [],
        onClick: ON_CLICK,
        onRemove: ON_REMOVE,
        onRemoveAll: ON_REMOVE_ALL,
    };

    beforeEach(() => {
        ON_REMOVE_ALL.mockClear();
    });

    const filterAction1 = {
        action: new FilterAction(() => 'display'),
        value: 'test1',
        valueObject: Filter.create('A', 'test1', Filter.Types.EQUAL),
    };
    const filterAction2 = {
        action: new FilterAction(() => 'display'),
        value: 'test2',
        valueObject: Filter.create('A', undefined, Filter.Types.NONBLANK),
    };
    const filterAction1Locked = {
        ...filterAction1,
        isReadOnly: 'locked filter',
    };
    const filterAction2Locked = {
        ...filterAction2,
        isReadOnly: 'locked filter',
    };
    const searchAction = {
        action: new SearchAction(),
        value: 'foo',
        valueObject: Filter.create('*', 'foo', Filter.Types.Q),
    };
    const viewAction = {
        action: new ViewAction(),
        value: 'view',
    };
    const sortAction = {
        action: new SortAction(),
        value: 'sort',
    };

    function validate(valueCount: number, filterCount: number): void {
        expect(document.querySelectorAll('.grid-panel__filter-status')).toHaveLength(1);
        expect(document.querySelectorAll('.filter-status-value')).toHaveLength(valueCount);
        expect(document.querySelectorAll('.remove-all-filters')).toHaveLength(filterCount > 1 ? 1 : 0);
    }

    test('no actionValues', () => {
        render(<FilterStatus {...DEFAULT_PROPS} />);
        validate(0, 0);
    });

    test('search actionValue', () => {
        render(<FilterStatus {...DEFAULT_PROPS} actionValues={[searchAction]} />);
        validate(1, 1);
    });

    test('only sortAction', () => {
        render(<FilterStatus {...DEFAULT_PROPS} actionValues={[sortAction]} />);
        validate(0, 0);
    });

    test('view, search and one filter actionValue', async () => {
        render(<FilterStatus {...DEFAULT_PROPS} actionValues={[viewAction, searchAction, filterAction1]} />);
        validate(3, 2);
        expect(document.querySelectorAll('.fa-table')).toHaveLength(1);
        expect(document.querySelectorAll('.filter-status-value')[0]).toHaveTextContent('view');
        expect(document.querySelectorAll('.fa-search')).toHaveLength(1);
        expect(document.querySelectorAll('.filter-status-value')[1]).toHaveTextContent('foo');
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);
        expect(document.querySelectorAll('.filter-status-value')[2]).toHaveTextContent('test1');
        expect(document.querySelectorAll('.fa-close')).toHaveLength(0);
        await userEvent.click(document.querySelector('.remove-all-filters'));
        expect(ON_REMOVE_ALL).toHaveBeenCalledTimes(1);
    });

    test('multiple filter actionValue', async () => {
        render(<FilterStatus {...DEFAULT_PROPS} actionValues={[filterAction1, filterAction2]} />);
        validate(2, 2);
        expect(document.querySelectorAll('.fa-table')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-search')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(2);
        expect(document.querySelectorAll('.filter-status-value')[0]).toHaveTextContent('test1');
        expect(document.querySelectorAll('.filter-status-value')[1]).toHaveTextContent('test2');
        expect(document.querySelectorAll('.fa-close')).toHaveLength(0);
        expect(document.querySelectorAll('.remove-all-filters')).toHaveLength(1);
        expect(ON_REMOVE_ALL).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector('.remove-all-filters'));
        expect(ON_REMOVE_ALL).toHaveBeenCalledTimes(1);
    });

    test('multiple locked filter actionValue', async () => {
        render(<FilterStatus {...DEFAULT_PROPS} actionValues={[filterAction1Locked, filterAction2Locked]} />);
        validate(2, 2);
        expect(document.querySelectorAll('.fa-table')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-search')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(2);
        expect(document.querySelectorAll('.filter-status-value')[0]).toHaveTextContent('test1');
        expect(document.querySelectorAll('.filter-status-value')[1]).toHaveTextContent('test2');
        expect(document.querySelectorAll('.fa-close')).toHaveLength(0);
        expect(document.querySelectorAll('.remove-all-filters')).toHaveLength(1);
    });

    test('multiple locked filter actionValue, cannot remove', async () => {
        render(
            <FilterStatus
                {...DEFAULT_PROPS}
                actionValues={[filterAction1Locked, filterAction2Locked]}
                lockReadOnlyForDelete
            />
        );
        expect(document.querySelectorAll('.fa-table')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-search')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-lock')).toHaveLength(2);
        expect(document.querySelectorAll('.filter-status-value')[0]).toHaveTextContent('test1');
        expect(document.querySelectorAll('.filter-status-value')[1]).toHaveTextContent('test2');
        expect(document.querySelectorAll('.fa-close')).toHaveLength(0);
        expect(document.querySelectorAll('.remove-all-filters')).toHaveLength(0);
    });

    test('with add filter', async () => {
        render(
            <FilterStatus
                {...DEFAULT_PROPS}
                actionValues={[filterAction1]}
                lockReadOnlyForDelete
                onAddFilterClick={jest.fn()}
            />
        );
        expect(document.querySelectorAll('.fa-table')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-search')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(2);
        expect(document.querySelectorAll('.remove-all-filters')).toHaveLength(0);
    });

    test('add filter is spaced from a search', () => {
        render(<FilterStatus {...DEFAULT_PROPS} actionValues={[searchAction]} onAddFilterClick={jest.fn()} />);
        expect(document.querySelector('.btn').classList).toContain('margin-left');
    });

    describe('keyboard removal moves focus', () => {
        const search = (value: string) => ({
            action: new SearchAction(),
            value,
            valueObject: Filter.create('*', value, Filter.Types.Q),
        });
        const [a, b, c] = [search('a'), search('b'), search('c')];
        const focusedText = (): string => document.activeElement.textContent;

        test('to the next pill', async () => {
            const onRemove = jest.fn();
            const { rerender } = render(
                <FilterStatus {...DEFAULT_PROPS} actionValues={[a, b, c]} onRemove={onRemove} />
            );
            await userEvent.tab();
            await userEvent.tab();
            expect(focusedText()).toBe('b');

            await userEvent.keyboard('{Delete}');
            expect(onRemove).toHaveBeenCalledWith(1, expect.anything());
            (document.activeElement as HTMLElement).blur();
            rerender(<FilterStatus {...DEFAULT_PROPS} actionValues={[a, c]} onRemove={onRemove} />);
            expect(focusedText()).toBe('c');
        });

        test('to the previous pill when the last is removed', async () => {
            const { rerender } = render(<FilterStatus {...DEFAULT_PROPS} actionValues={[a, b]} />);
            await userEvent.tab();
            await userEvent.tab();
            await userEvent.keyboard('{Backspace}');
            rerender(<FilterStatus {...DEFAULT_PROPS} actionValues={[a]} />);
            expect(focusedText()).toBe('a');
        });

        test('not on mouse removal', async () => {
            const { rerender } = render(<FilterStatus {...DEFAULT_PROPS} actionValues={[a, b, c]} />);
            await userEvent.click(document.querySelectorAll('.symbol')[1]);
            (document.activeElement as HTMLElement).blur();
            rerender(<FilterStatus {...DEFAULT_PROPS} actionValues={[a, c]} />);
            expect(document.activeElement).toBe(document.body);
        });
    });

    test('without actionValues, with add', async () => {
        render(
            <FilterStatus
                {...DEFAULT_PROPS}
                actionValues={undefined}
                lockReadOnlyForDelete
                onAddFilterClick={jest.fn()}
            />
        );
        expect(document.querySelectorAll('.filter-status-value')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);
    });
});
