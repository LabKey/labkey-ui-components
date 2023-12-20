import { getQueryParams } from './URL';

describe('getQueryParams', () => {
    test('from URLSearchParams', () => {
        const searchParams = new URLSearchParams({ one: 'one' });
        searchParams.append('two', 't');
        searchParams.append('two', 'w');
        searchParams.append('two', 'o');
        const queryParams = getQueryParams(searchParams);
        expect(queryParams.one).toEqual('one');
        expect(queryParams.two).toEqual(['t', 'w', 'o'])
    });
    test('from string', () => {
        const queryParams = getQueryParams('one=one&two=t&two=w&two=o');
        expect(queryParams.one).toEqual('one');
        expect(queryParams.two).toEqual(['t', 'w', 'o'])
    });
})
