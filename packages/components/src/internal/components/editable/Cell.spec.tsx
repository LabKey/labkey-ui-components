/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { List } from 'immutable';

import { CELL_SELECTION_HANDLE_CLASSNAME } from '../../constants';

import { QueryColumn, QueryLookup } from '../../../public/QueryColumn';

import { ValueDescriptor } from './models';

import { Cell, CellProps } from './Cell';
import { LookupCell } from './LookupCell';
import { DateInputCell } from './DateInputCell';

const queryColumn = new QueryColumn({ lookup: undefined, name: 'myColumn' });
const lookupCol = new QueryColumn({ name: 'test', lookup: { isPublic: false } as QueryLookup });
const publicLookupCol = new QueryColumn({ name: 'test', lookup: { isPublic: true } as QueryLookup });
const validValuesCol = new QueryColumn({ name: 'test', validValues: ['a', 'b'] });
const dateCol = new QueryColumn({ name: 'test', jsonType: 'date', caption: 'Test' });
const timeCol = new QueryColumn({ name: 'test', jsonType: 'time', caption: 'Test' });

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
        const cell = mount(<Cell {...defaultProps()} />);
        expect(cell.find('div')).toHaveLength(1);
        expect(cell.find('textarea')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    test('with focus', () => {
        const cell = mount(<Cell {...defaultProps()} focused selected />);
        expect(cell.find('div')).toHaveLength(0);
        expect(cell.find('textarea')).toHaveLength(1);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    test('with placeholder', () => {
        const cell = mount(
            <Cell {...defaultProps()} col={queryColumn} colIdx={2} placeholder="placeholder text" rowIdx={3} />
        );
        const div = cell.find('div');
        expect(div).toHaveLength(1);
        expect(div.text()).toBe('placeholder text');
        expect(cell.find('textarea')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    test('with placeholder while focused', () => {
        const cell = mount(
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
        expect(cell.find('div')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
        const input = cell.find('textarea');
        expect(input).toHaveLength(1);
        expect(input.prop('placeholder')).toBe('placeholder text');
    });

    test('readOnly property', () => {
        const cell = mount(<Cell {...defaultProps()} colIdx={3} readOnly rowIdx={3} />);
        expect(cell.find('div')).toHaveLength(1);
        expect(cell.find('textarea')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    test('column is readOnly', () => {
        const roColumn = new QueryColumn({ readOnly: true, name: 'roColumn' });
        const cell = mount(<Cell {...defaultProps()} col={roColumn} colIdx={4} readOnly={false} rowIdx={3} />);
        expect(cell.find('div')).toHaveLength(1);
        expect(cell.find('textarea')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    test('with placeholder and readOnly', () => {
        const cell = mount(
            <Cell {...defaultProps()} colIdx={3} placeholder="readOnly placeholder" readOnly rowIdx={3} />
        );

        const div = cell.find('div');
        expect(div).toHaveLength(1);
        expect(div.text()).toBe('readOnly placeholder');
        expect(cell.find('textarea')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    test('col is lookup, not public', () => {
        const cell = mount(<Cell {...defaultProps()} col={lookupCol} colIdx={1} rowIdx={2} />);
        expect(cell.find('div')).toHaveLength(1);
        expect(cell.find('.cell-menu')).toHaveLength(0);
        expect(cell.find('textarea')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    const expectLookup = (cell: ReactWrapper, focused = false, readOnly = false): void => {
        expect(cell.find('.cell-menu')).toHaveLength(focused ? 0 : 1);
        expect(cell.find('.cell-menu-selector')).toHaveLength(focused || readOnly ? 0 : 1);
        expect(cell.find('.' + CELL_SELECTION_HANDLE_CLASSNAME)).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(focused ? 1 : 0);
    };

    test('col is lookup, public', () => {
        const cell = mount(<Cell {...defaultProps()} col={publicLookupCol} />);
        expectLookup(cell);
    });

    test('col is lookup, public and focused', () => {
        const cell = mount(<Cell {...defaultProps()} col={publicLookupCol} focused selected />);
        expectLookup(cell, true);
    });

    test('col has validValues', () => {
        const cell = mount(<Cell {...defaultProps()} col={validValuesCol} />);
        expectLookup(cell);
    });

    test('col is a lookup with valid values, but readonly', () => {
        const readOnlyLookup = new QueryColumn({
            name: 'test',
            readOnly: true,
            lookup: { isPublic: false } as QueryLookup,
            validValues: ['a', 'b'],
        });
        const cell = mount(<Cell {...defaultProps()} col={readOnlyLookup} readOnly />);
        expectLookup(cell, false, true);
    });

    test('col has validValues and focused', () => {
        const cell = mount(<Cell {...defaultProps()} col={validValuesCol} focused selected />);
        expect(cell.find('div')).toHaveLength(9);
        expect(cell.find('.cell-menu')).toHaveLength(0);
        expect(cell.find('.cell-menu-value')).toHaveLength(0);
        expect(cell.find('.cell-menu-selector')).toHaveLength(0);
        expect(cell.find('.' + CELL_SELECTION_HANDLE_CLASSNAME)).toHaveLength(0);
        expect(cell.find('input')).toHaveLength(1);
        expect(cell.find(LookupCell)).toHaveLength(1);
    });

    test('cell renderDragHandle', () => {
        const cell = mount(<Cell {...defaultProps()} col={validValuesCol} renderDragHandle />);
        expect(cell.find('div')).toHaveLength(2);
        expect(cell.find('.cell-menu')).toHaveLength(1);
        expect(cell.find('.cell-menu-value')).toHaveLength(1);
        expect(cell.find('.cell-menu-selector')).toHaveLength(1);
        expect(cell.find('.' + CELL_SELECTION_HANDLE_CLASSNAME)).toHaveLength(1);
        expect(cell.find('textarea')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    const expectDate = (cell: ReactWrapper, focused = false, value?: string, rawValue?: string): void => {
        expect(cell.find('input')).toHaveLength(focused ? 1 : 0);
        expect(cell.find(DateInputCell)).toHaveLength(focused ? 1 : 0);
        if (value) {
            if (focused) {
                expect(cell.find(DateInputCell).prop('defaultValue')).toEqual(rawValue);
                expect(cell.find('input.date-input-cell').prop('value')).toEqual(value);
            } else {
                expect(cell.find('.cellular-display').text()).toEqual(value);
            }
        }
    };

    test('col is date', () => {
        const cell = mount(<Cell {...defaultProps()} col={dateCol} />);
        expectDate(cell);
        cell.unmount();
    });

    test('col is time', () => {
        const cell = mount(<Cell {...defaultProps()} col={timeCol} />);
        expectDate(cell);
        cell.unmount();
    });

    test('col is date, has value', () => {
        const values = List<ValueDescriptor>([
            {
                display: '2022-08-05 00:00',
                raw: '2022-08-05 00:00:00.000',
            },
        ]);
        const cell = mount(<Cell {...defaultProps()} col={dateCol} values={values} />);
        expectDate(cell, false, '2022-08-05 00:00');
        cell.unmount();
    });

    test('col is time, has value', () => {
        const values = List<ValueDescriptor>([
            {
                display: '13:14',
                raw: '13:14:00',
            },
        ]);
        const cell = mount(<Cell {...defaultProps()} col={timeCol} values={values} />);
        expectDate(cell, false, '13:14');
        cell.unmount();
    });

    test('col is date, focused', () => {
        const cell = mount(<Cell {...defaultProps()} col={dateCol} focused selected />);
        expectDate(cell, true);
        cell.unmount();
    });

    test('col is time, focused', () => {
        const cell = mount(<Cell {...defaultProps()} col={timeCol} focused selected />);
        expectDate(cell, true);
        cell.unmount();
    });

    test('col is date, has value, focused', () => {
        const values = List<ValueDescriptor>([
            {
                display: '2022-08-05 00:00',
                raw: '2022-08-05 00:00:00.000',
            },
        ]);
        const cell = mount(<Cell {...defaultProps()} col={dateCol} values={values} focused selected />);
        expectDate(cell, true, '2022-08-05 00:00', '2022-08-05 00:00:00.000');
        cell.unmount();
    });

    test('col is time, has value, focused', () => {
        const values = List<ValueDescriptor>([
            {
                display: '13:14',
                raw: '13:14:00',
            },
        ]);
        const cell = mount(<Cell {...defaultProps()} col={timeCol} values={values} focused selected />);
        expectDate(cell, true, '', '13:14:00');
        cell.unmount();
    });
});
