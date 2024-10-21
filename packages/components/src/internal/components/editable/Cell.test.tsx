import React from 'react';

import { List } from 'immutable';

import { render } from '@testing-library/react';

import { CELL_SELECTION_HANDLE_CLASSNAME } from '../../constants';

import { QueryColumn, QueryLookup } from '../../../public/QueryColumn';

import { ValueDescriptor } from './models';

import { Cell, CellProps } from './Cell';

const queryColumn = new QueryColumn({ lookup: undefined, name: 'myColumn', fieldKey: 'qc' });
const lookupCol = new QueryColumn({ name: 'test', lookup: { isPublic: false } as QueryLookup, fieldKey: 'lookup' });
const publicLookupCol = new QueryColumn({
    name: 'test',
    lookup: { isPublic: true } as QueryLookup,
    fieldKey: 'publiclookup',
});
const validValuesCol = new QueryColumn({ name: 'test', validValues: ['a', 'b'], fieldKey: 'validvalues' });
const dateCol = new QueryColumn({ name: 'test', jsonType: 'date', caption: 'Test', fieldKey: 'date' });
const timeCol = new QueryColumn({ name: 'test', jsonType: 'time', caption: 'Test', fieldKey: 'time' });

describe('Cell', () => {
    function defaultProps(): CellProps {
        return {
            cellActions: {
                clearSelection: jest.fn(),
                fillDown: jest.fn(),
                fillText: jest.fn(),
                focusCell: jest.fn(),
                inDrag: jest.fn(),
                modifyCell: jest.fn(),
                selectCell: jest.fn(),
            },
            col: queryColumn,
            colIdx: 1,
            forUpdate: false,
            rowIdx: 2,
        };
    }

    test('default props', () => {
        render(<Cell {...defaultProps()} />);
        expect(document.querySelectorAll('div.cellular-display')).toHaveLength(1);
        expect(document.querySelectorAll('div.cell-content')).toHaveLength(1);
        expect(document.querySelectorAll('span.cell-content-value')).toHaveLength(1);
        expect(document.querySelectorAll('textarea')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    });

    test('with focus', () => {
        render(<Cell {...defaultProps()} focused selected />);
        expect(document.querySelectorAll('div.cellular-display')).toHaveLength(0);
        expect(document.querySelectorAll('div.cell-content')).toHaveLength(0);
        expect(document.querySelectorAll('span.cell-content-value')).toHaveLength(0);
        expect(document.querySelectorAll('textarea')).toHaveLength(1);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    });

    test('with placeholder', () => {
        render(<Cell {...defaultProps()} col={queryColumn} colIdx={2} placeholder="placeholder text" rowIdx={3} />);
        expect(document.querySelectorAll('div.cellular-display')).toHaveLength(1);
        expect(document.querySelectorAll('div.cell-content')).toHaveLength(1);
        expect(document.querySelectorAll('span.cell-content-value')).toHaveLength(1);
        expect(document.querySelectorAll('span.cell-content-value')[0].textContent).toBe('placeholder text');
        expect(document.querySelectorAll('textarea')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    });

    test('with placeholder while focused', () => {
        render(
            <Cell
                {...defaultProps()}
                col={queryColumn}
                colIdx={2}
                placeholder="placeholder text"
                rowIdx={3}
                selected
                focused
            />
        );
        expect(document.querySelectorAll('div.cellular-display')).toHaveLength(0);
        expect(document.querySelectorAll('div.cell-content')).toHaveLength(0);
        expect(document.querySelectorAll('span.cell-content-value')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
        const input = document.querySelectorAll('textarea');
        expect(input).toHaveLength(1);
        expect(input[0].getAttribute('placeholder')).toBe('placeholder text');
    });

    test('readOnly property', () => {
        render(<Cell {...defaultProps()} colIdx={3} readOnly rowIdx={3} />);
        expect(document.querySelectorAll('div.cellular-display')).toHaveLength(1);
        expect(document.querySelectorAll('div.cell-read-only')).toHaveLength(1);
        expect(document.querySelectorAll('textarea')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    });

    test('column is readOnly', () => {
        const roColumn = new QueryColumn({ readOnly: true, name: 'roColumn' });
        render(<Cell {...defaultProps()} col={roColumn} colIdx={4} readOnly={false} rowIdx={3} />);
        expect(document.querySelectorAll('div.cellular-display')).toHaveLength(1);
        expect(document.querySelectorAll('div.cell-read-only')).toHaveLength(1);
        expect(document.querySelectorAll('textarea')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    });

    test('with placeholder and readOnly', () => {
        render(<Cell {...defaultProps()} colIdx={3} placeholder="readOnly placeholder" readOnly rowIdx={3} />);
        expect(document.querySelectorAll('div.cellular-display')).toHaveLength(1);
        expect(document.querySelectorAll('div.cell-read-only')).toHaveLength(1);
        expect(document.querySelectorAll('div.cell-read-only')[0].textContent).toBe('readOnly placeholder');
        expect(document.querySelectorAll('textarea')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    });

    test('col is lookup, not public', () => {
        render(<Cell {...defaultProps()} col={lookupCol} colIdx={1} rowIdx={2} />);
        expect(document.querySelectorAll('div')).toHaveLength(5);
        expect(document.querySelectorAll('.cell-menu')).toHaveLength(0);
        expect(document.querySelectorAll('textarea')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    });

    const expectLookup = (focused = false, readOnly = false): void => {
        expect(document.querySelectorAll('.cell-menu')).toHaveLength(focused ? 0 : 1);
        expect(document.querySelectorAll('.cell-menu-selector')).toHaveLength(focused || readOnly ? 0 : 1);
        expect(document.querySelectorAll('.' + CELL_SELECTION_HANDLE_CLASSNAME)).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    };

    test('col is lookup, public', () => {
        render(<Cell {...defaultProps()} col={publicLookupCol} />);
        expectLookup();
    });

    test('col is lookup, public and focused', async () => {
        render(<Cell {...defaultProps()} col={publicLookupCol} focused selected />);
        expectLookup(true);
    });

    test('col has validValues', () => {
        render(<Cell {...defaultProps()} col={validValuesCol} />);
        expectLookup();
    });

    test('col is a lookup with valid values, but readonly', () => {
        const readOnlyLookup = new QueryColumn({
            name: 'test',
            readOnly: true,
            lookup: { isPublic: false } as QueryLookup,
            validValues: ['a', 'b'],
        });
        render(<Cell {...defaultProps()} col={readOnlyLookup} readOnly />);
        expectLookup(false, true);
    });

    test('col has validValues and focused', () => {
        render(<Cell {...defaultProps()} col={validValuesCol} focused selected />);
        expect(document.querySelectorAll('div')).toHaveLength(15);
        expect(document.querySelectorAll('.cell-menu')).toHaveLength(0);
        expect(document.querySelectorAll('.cell-menu-value')).toHaveLength(0);
        expect(document.querySelectorAll('.cell-menu-selector')).toHaveLength(0);
        expect(document.querySelectorAll('.' + CELL_SELECTION_HANDLE_CLASSNAME)).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
    });

    test('cell renderDragHandle', () => {
        render(<Cell {...defaultProps()} col={validValuesCol} renderDragHandle />);
        expect(document.querySelectorAll('div')).toHaveLength(6);
        expect(document.querySelectorAll('.cell-menu')).toHaveLength(1);
        expect(document.querySelectorAll('.cell-menu-value')).toHaveLength(1);
        expect(document.querySelectorAll('.cell-menu-selector')).toHaveLength(1);
        expect(document.querySelectorAll('.' + CELL_SELECTION_HANDLE_CLASSNAME)).toHaveLength(1);
        expect(document.querySelectorAll('textarea')).toHaveLength(0);
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
    });

    const expectDate = (focused = false, value?: string): void => {
        expect(document.querySelectorAll('input')).toHaveLength(focused ? 1 : 0);
        expect(document.querySelectorAll('.date-input-cell')).toHaveLength(focused ? 1 : 0);
        if (value) {
            if (focused) {
                expect(document.querySelectorAll('input.date-input-cell')[0].getAttribute('value')).toEqual(value);
            } else {
                expect(document.querySelectorAll('.cellular-display')[0].textContent).toEqual(value);
            }
        }
    };

    test('col is date', () => {
        render(<Cell {...defaultProps()} col={dateCol} />);
        expectDate();
    });

    test('col is time', () => {
        render(<Cell {...defaultProps()} col={timeCol} />);
        expectDate();
    });

    test('col is date, has value', () => {
        const values = List<ValueDescriptor>([
            {
                display: '2022-08-05 00:00',
                raw: '2022-08-05 00:00:00.000',
            },
        ]);
        render(<Cell {...defaultProps()} col={dateCol} values={values} />);
        expectDate(false, '2022-08-05 00:00');
    });

    test('col is time, has value', () => {
        const values = List<ValueDescriptor>([
            {
                display: '13:14',
                raw: '13:14:00',
            },
        ]);
        render(<Cell {...defaultProps()} col={timeCol} values={values} />);
        expectDate(false, '13:14');
    });

    test('col is date, focused', () => {
        render(<Cell {...defaultProps()} col={dateCol} focused selected />);
        expectDate(true);
    });

    test('col is time, focused', () => {
        render(<Cell {...defaultProps()} col={timeCol} focused selected />);
        expectDate(true);
    });

    test('col is date, has value, focused', () => {
        const values = List<ValueDescriptor>([
            {
                display: '2022-08-05 00:00',
                raw: '2022-08-05 00:00:00.000',
            },
        ]);
        render(<Cell {...defaultProps()} col={dateCol} values={values} focused selected />);
        expectDate(true, '2022-08-05 00:00');
    });

    test('col is time, has value, focused', () => {
        const values = List<ValueDescriptor>([
            {
                display: '13:14',
                raw: '13:14:00',
            },
        ]);
        render(<Cell {...defaultProps()} col={timeCol} values={values} focused selected />);
        expectDate(true, '');
    });
});
