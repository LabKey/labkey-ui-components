import { fromJS } from 'immutable';

import { QueryInfo } from '../../../public/QueryInfo';
import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';

import { parseSelectedQuery, QuerySelectModel, queryColumnNames } from './model';

describe('form actions', () => {
    const setSelectionModel = new QuerySelectModel({
        displayColumn: 'DATA',
        id: 'selection',
        isInit: true,
    });

    const searchResults2 = fromJS({
        '789': {
            DATA: {
                value: 'C-1',
            },
        },
    });

    const searchResults3 = fromJS({
        '123': {
            DATA: {
                value: 'A-1',
            },
            NAME: {
                value: 'Ron Swanson',
            },
        },

        '456': {
            DATA: {
                value: 'B-1',
            },
            NAME: {
                value: 'Swan Ronson',
            },
        },
    });

    test('Should parse a selected query', () => {
        const parsed = parseSelectedQuery(setSelectionModel, searchResults2);

        const parsedSelectionModel = new QuerySelectModel({
            displayColumn: 'NAME',
            delimiter: ';',
        });

        const parsed2 = parseSelectedQuery(parsedSelectionModel, searchResults3);

        expect(parsed).toBe('C-1');
        expect(parsed2).toBe('Ron Swanson;Swan Ronson');
    });

    test('queryColumnNames', () => {
        const displayColumn = 'display';
        const valueColumn = 'value';
        let queryInfo = new QueryInfo({ pkCols: ['pkCol1', 'pkCol2'] });
        expect(queryColumnNames(queryInfo, displayColumn, valueColumn, [], undefined).sort()).toEqual([
            displayColumn,
            'pkCol1',
            'pkCol2',
            valueColumn,
        ]);

        const lookupColumn = 'colA';
        queryInfo = queryInfo.mutate({
            columns: new ExtendedMap({
                [lookupColumn]: new QueryColumn({ fieldKey: lookupColumn, shownInLookupView: true }),
            }),
        });
        expect(queryColumnNames(queryInfo, displayColumn, valueColumn, [], undefined).sort()).toEqual([
            'colA',
            displayColumn,
            'pkCol1',
            'pkCol2',
            valueColumn,
        ]);

        const groupByColumn = 'grouper';
        const someRequiredColumn = `${valueColumn}/${displayColumn}`;
        expect(
            queryColumnNames(
                queryInfo,
                displayColumn,
                valueColumn,
                [displayColumn, someRequiredColumn, valueColumn],
                groupByColumn
            ).sort()
        ).toEqual(['colA', displayColumn, groupByColumn, 'pkCol1', 'pkCol2', valueColumn, someRequiredColumn]);
    });
});
