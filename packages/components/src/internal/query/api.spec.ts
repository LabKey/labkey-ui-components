import { List } from 'immutable';

import { quoteValueColumnWithDelimiters, Renderers } from './api';

describe('quoteValueColumnWithDelimiters', () => {
    const results = {
        key: 'test',
        models: {
            test: {
                1: { Name: { value: 'one', url: 'http://one/test' } },
                2: { Name: { value: 'with, comma', url: 'http://with, comma/test' } },
                4: { Name: { value: 'with "quotes", and comma' } },
                3: { NoName: { value: 'nonesuch', url: 'http://with, comma/test' } },
                5: { Name: { value: ', comma first', displayValue: ',', url: 'http://with, comma/test' } },
            },
        },
        orderedModels: List([1, 2, 3, 4, 5]),
        queries: {},
        totalRows: 5,
    };
    test('encode', () => {
        expect(quoteValueColumnWithDelimiters(results, 'Name', ',')).toStrictEqual({
            key: 'test',
            models: {
                test: {
                    1: { Name: { value: 'one', url: 'http://one/test', displayValue: 'one' } },
                    2: {
                        Name: { value: '"with, comma"', url: 'http://with, comma/test', displayValue: 'with, comma' },
                    },
                    4: {
                        Name: {
                            value: '"with ""quotes"", and comma"',
                            url: undefined,
                            displayValue: 'with "quotes", and comma',
                        },
                    },
                    3: { NoName: { value: 'nonesuch', url: 'http://with, comma/test' } },
                    5: { Name: { value: '", comma first"', displayValue: ',', url: 'http://with, comma/test' } },
                },
            },
            orderedModels: List([1, 2, 3, 4, 5]),
            queries: {},
            totalRows: 5,
        });
    });
});

describe('applyDetailRenderer', () => {
    test('various types', () => {
        expect(
            Renderers.applyDetailRenderer({}, { multiValue: false, type: 'text', friendlyType: 'text' }, {})
        ).toBeUndefined();
        expect(Renderers.applyDetailRenderer({}, { multiValue: true, type: 'text', friendlyType: 'text' }, {})).toBe(
            'MultiValueDetailRenderer'
        );
        expect(Renderers.applyDetailRenderer({}, { type: 'file', friendlyType: 'text' }, {})).toBe(
            'FileColumnRenderer'
        );
        expect(Renderers.applyDetailRenderer({}, { type: 'text', friendlyType: 'file' }, {})).toBe(
            'FileColumnRenderer'
        );
        expect(
            Renderers.applyDetailRenderer({}, { type: 'text', friendlyType: 'text', lookup: {} }, {})
        ).toBeUndefined();
        expect(
            Renderers.applyDetailRenderer(
                {},
                { type: 'text', friendlyType: 'text', lookup: { schemaName: 'core', queryName: 'test' } },
                {}
            )
        ).toBeUndefined();
        expect(
            Renderers.applyDetailRenderer(
                {},
                { type: 'text', friendlyType: 'text', lookup: { schemaName: 'core', queryName: 'users' } },
                {}
            )
        ).toBe('UserDetailsRenderer');
        expect(
            Renderers.applyDetailRenderer(
                {},
                { type: 'text', friendlyType: 'text', lookup: { schemaName: 'core', queryName: 'siteusers' } },
                {}
            )
        ).toBe('UserDetailsRenderer');
    });
});
