import { fromJS } from 'immutable';

import { Location } from '../../util/URL';

import { getLocationString } from './actions';

describe('lineage actions', () => {
    test('getLocationString', () => {
        let location = { query: fromJS({}) } as Location;
        expect(getLocationString(location)).toBe('');

        location = { query: fromJS({ distance: 1, members: 2, p: 3, seeds: 4 }) } as Location;
        expect(getLocationString(location)).toBe('distance=1&members=2&p=3&seeds=4');

        location = { query: fromJS({ distance: 1, members: 2, p: 3, seeds: 4, other: 5 }) } as Location;
        expect(getLocationString(location)).toBe('distance=1&members=2&p=3&seeds=4');

        location = { query: fromJS({ other: 5 }) } as Location;
        expect(getLocationString(location)).toBe('');
    });
});
