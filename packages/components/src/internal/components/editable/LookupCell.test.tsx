import React from 'react';
import { List } from 'immutable';

import { render } from '@testing-library/react';

import { QueryColumn, QueryLookup } from '../../../public/QueryColumn';

import { ValueDescriptor } from './models';

import { LookupCell, LookupCellProps } from './LookupCell';

describe('LookupCell', () => {
    function defaultProps(): LookupCellProps {
        return {
            col: new QueryColumn({
                lookup: new QueryLookup({
                    schemaName: 'schema',
                    queryName: 'query',
                    displayColumn: 'display',
                    keyColumn: 'key',
                }),
            }),
            colIdx: 0,
            forUpdate: false,
            modifyCell: jest.fn(),
            row: undefined,
            rowIdx: 0,
            select: jest.fn(),
            values: List.of({ raw: 'a' } as ValueDescriptor, { raw: 'b' } as ValueDescriptor, {} as ValueDescriptor),
        };
    }

    test('col with validValues', () => {
        render(
            <LookupCell
                {...defaultProps()}
                col={
                    new QueryColumn({
                        validValues: ['a', 'b'],
                    })
                }
            />
        );
        expect(document.querySelectorAll('.select-input-cell')).toHaveLength(1);
        expect(document.querySelector('.select-input__single-value').textContent).toBe('a');
        expect(document.querySelectorAll('.select-input__option')).toHaveLength(2);
        expect(document.querySelectorAll('.select-input__option')[0].textContent).toBe('a');
        expect(document.querySelectorAll('.select-input__option')[1].textContent).toBe('b');
    });
});
