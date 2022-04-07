import { List } from 'immutable';
import { Filter } from '@labkey/api';

import { QueryInfo } from '../../../public/QueryInfo';
import { QuerySort } from '../../../public/QuerySort';

import { removeActionValue, replaceSearchValue } from './utils';
import { FilterAction } from './actions/Filter';
import { SearchAction } from './actions/Search';
import { ViewAction } from './actions/View';
import { SortAction } from './actions/Sort';
import { ChangeType } from './OmniBox';

const filterAction = {
    action: new FilterAction(
        'query',
        () => List(),
        () => QueryInfo.create({})
    ),
    value: 'test',
    valueObject: Filter.create('A', 'test', Filter.Types.EQUAL),
};
const searchAction = {
    action: new SearchAction('query'),
    value: 'foo',
    valueObject: Filter.create('*', 'foo', Filter.Types.Q),
};
const sortAction = {
    action: new SortAction('query', () => List()),
    value: 'A',
    valueObject: new QuerySort({ fieldKey: 'A', dir: '' }),
};
const viewAction = {
    action: new ViewAction(
        'query',
        () => List(),
        () => QueryInfo.create({})
    ),
    value: 'view',
};

describe('removeActionValue', () => {
    test('invalid index', () => {
        expect(removeActionValue([], 1)).toStrictEqual([]);
        expect(removeActionValue([filterAction], 2)).toStrictEqual([filterAction]);
    });

    test('remove at index', () => {
        expect(removeActionValue([filterAction, searchAction, sortAction, viewAction], 1)).toStrictEqual([
            filterAction,
            sortAction,
            viewAction,
        ]);
    });
});

describe('replaceSearchValue', () => {
    test('add', () => {
        const { actionValues, change } = replaceSearchValue([filterAction], 'bar', searchAction.action);
        expect(change.type).toBe(ChangeType.add);
        expect(actionValues.length).toBe(2);
        expect(actionValues[1].action).toBe(searchAction.action);
        expect(actionValues[1].value).toBe('bar');
    });

    test('modify', () => {
        const { actionValues, change } = replaceSearchValue([filterAction, searchAction], 'bar', searchAction.action);
        expect(change.type).toBe(ChangeType.modify);
        expect(actionValues.length).toBe(2);
        expect(actionValues[1].action).toBe(searchAction.action);
        expect(actionValues[1].value).toBe('bar');
    });

    test('remove', () => {
        const { actionValues, change } = replaceSearchValue([filterAction, searchAction], '', searchAction.action);
        expect(change.type).toBe(ChangeType.remove);
        expect(actionValues.length).toBe(1);
        expect(actionValues[0].action).toBe(filterAction.action);
    });
});
