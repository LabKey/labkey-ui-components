import { quoteValueColumnWithDelimiters } from "./api";
import { List } from 'immutable';

describe('quoteValueColumnWithDelimiters', () => {
    const results = {
        key: 'test',
        models: {
            test: {
                1: { Name: { value: 'one', url: "http://one/test"}},
                2: { Name: { value: 'with, comma', url: "http://with, comma/test"}},
                4: { Name: { value: 'with "quotes", and comma'}},
                3: { NoName: { value: 'nonesuch', url: "http://with, comma/test"}},
                5: { Name: { value: ', comma first', displayValue: ',', url: "http://with, comma/test"}}
            }
        },
        orderedModels: List([1, 2, 3, 4, 5]),
        queries: {},
        totalRows: 5,
    };
    test('encode', () => {
        expect(quoteValueColumnWithDelimiters(results, 'Name', ',')).toStrictEqual(
        {
            key: 'test',
            models: {
                test: {
                    1: { Name: { value: 'one', url: "http://one/test", displayValue: 'one'}},
                    2: { Name: { value: '"with, comma"', url: 'http://with, comma/test', displayValue: 'with, comma'}},
                    4: { Name: { value: '"with ""quotes"", and comma"', url: undefined, displayValue:  'with "quotes", and comma'}},
                    3: { NoName: { value: 'nonesuch', url: "http://with, comma/test" }},
                    5: { Name: { value: '", comma first"', displayValue: ',', url: "http://with, comma/test"}}
                }
            },
            orderedModels: List([1, 2, 3, 4, 5]),
                queries: {},
            totalRows: 5,
        });
    });
});
