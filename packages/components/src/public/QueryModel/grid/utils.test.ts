import { List } from 'immutable';
import { Filter } from '@labkey/api';

import { QueryInfo } from '../../QueryInfo';

import { filterActionValuesByType, getSearchValueAction } from './utils';
import { ChangeType } from './model';
import { FilterAction } from './actions/Filter';
import { SearchAction } from './actions/Search';
import { ActionValue } from './actions/Action';

const filterAction = {
    action: new FilterAction(
        'query',
        () => List(),
        () => new QueryInfo({})
    ),
    value: 'test',
    valueObject: Filter.create('A', 'test', Filter.Types.EQUAL),
};
const searchAction = {
    action: new SearchAction('query'),
    value: 'foo',
    valueObject: Filter.create('*', 'foo', Filter.Types.Q),
};

describe('replaceSearchValue', () => {
    test('add', () => {
        const change = getSearchValueAction([filterAction], 'bar');
        expect(change.type).toBe(ChangeType.add);
    });

    test('modify', () => {
        const change = getSearchValueAction([filterAction, searchAction], 'bar');
        expect(change.type).toBe(ChangeType.modify);
    });

    test('remove', () => {
        const change = getSearchValueAction([filterAction, searchAction], '');
        expect(change.type).toBe(ChangeType.remove);
    });
});

describe('filterActionValuesByType', () => {
    const mockActionValues: ActionValue[] = [
        {
            action: { keyword: 'search' },
        },
        {
            action: { keyword: 'filter' },
        },
        {
            action: { keyword: 'filter' },
            isReadOnly: 'locked',
        },
    ];

    it('returns only action values matching the keyword', () => {
        const result = filterActionValuesByType(mockActionValues, 'search', false);
        expect(result.length).toBe(1);
        expect(result.every(av => av.action.keyword === 'search')).toBe(true);
    });

    it('excludes read-only action values when lockReadOnlyForDelete is true', () => {
        const result = filterActionValuesByType(mockActionValues, 'search', true);
        expect(result.length).toBe(1);
        expect(result[0].isReadOnly).toBeUndefined();
    });

    it('returns an empty array when no action values match the keyword', () => {
        const result = filterActionValuesByType(mockActionValues, 'nonexistent', false);
        expect(result.length).toBe(0);
    });

    it('returns non-readonly filter action values when lockReadOnlyForDelete is true', () => {
        const result = filterActionValuesByType(mockActionValues, 'filter', true);
        expect(result.length).toBe(1);
        expect(result[0].isReadOnly).toBeUndefined();
    });

    it('returns all matching action values when lockReadOnlyForDelete is false', () => {
        const result = filterActionValuesByType(mockActionValues, 'filter', false);
        expect(result.length).toBe(2);
        expect(result[0].isReadOnly).toBeUndefined();
        expect(result[1].isReadOnly).toBe('locked');
    });
});
