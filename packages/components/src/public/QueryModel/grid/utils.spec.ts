import { List } from 'immutable';
import { Filter } from '@labkey/api';

import { QueryInfo } from '../../QueryInfo';

import { getSearchValueAction } from './utils';
import { ChangeType } from './model';
import { FilterAction } from './actions/Filter';
import { SearchAction } from './actions/Search';

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
