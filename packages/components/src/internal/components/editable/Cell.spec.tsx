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

import { QueryColumn } from '../../..';

import { Cell } from './Cell';
import { LookupCell } from './LookupCell';

let actions;

beforeAll(() => {
    actions = {
        focusCell: jest.fn(),
        modifyCell: jest.fn(),
        selectCell: jest.fn(),
    };
});

const queryColumn = QueryColumn.create({ lookup: undefined, name: 'myColumn' });

describe('Cell', () => {
    test('default props', () => {
        const cell = mount(<Cell cellActions={actions} col={queryColumn} colIdx={1} rowIdx={2} />);
        expect(cell.find('div')).toHaveLength(1);
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    test('with focus', () => {
        const cell = mount(<Cell cellActions={actions} col={queryColumn} colIdx={1} rowIdx={2} focused selected />);
        expect(cell.find('div')).toHaveLength(0);
        expect(cell.find('input')).toHaveLength(1);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    test('with placeholder', () => {
        const cell = mount(
            <Cell cellActions={actions} col={queryColumn} colIdx={2} placeholder="placeholder text" rowIdx={3} />
        );
        const div = cell.find('div');
        expect(div).toHaveLength(1);
        expect(div.text()).toBe('placeholder text');
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    test('with placeholder while focused', () => {
        const cell = mount(
            <Cell
                cellActions={actions}
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
        const input = cell.find('input');
        expect(input).toHaveLength(1);
        expect(input.prop('placeholder')).toBe('placeholder text');
    });

    test('readOnly property', () => {
        const cell = mount(<Cell cellActions={actions} col={queryColumn} colIdx={3} readOnly rowIdx={3} />);
        expect(cell.find('div')).toHaveLength(1);
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    test('column is readOnly', () => {
        const roColumn = QueryColumn.create({ readOnly: true, name: 'roColumn' });
        const cell = mount(<Cell cellActions={actions} col={roColumn} colIdx={4} readOnly={false} rowIdx={3} />);
        expect(cell.find('div')).toHaveLength(1);
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    test('with placeholder and readOnly', () => {
        const cell = mount(
            <Cell
                cellActions={actions}
                col={queryColumn}
                colIdx={3}
                placeholder="readOnly placeholder"
                readOnly
                rowIdx={3}
            />
        );

        const div = cell.find('div');
        expect(div).toHaveLength(1);
        expect(div.text()).toBe('readOnly placeholder');
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    test('col is lookup, not public', () => {
        const lookupCol = QueryColumn.create({ name: 'test', lookup: { isPublic: false } });
        const cell = mount(<Cell cellActions={actions} col={lookupCol} colIdx={1} rowIdx={2} />);
        expect(cell.find('div')).toHaveLength(1);
        expect(cell.find('.cell-menu')).toHaveLength(0);
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
    });

    const expectLookup = (cell: ReactWrapper, focused = false): void => {
        expect(cell.find('div')).toHaveLength(focused ? 11 : 2);
        expect(cell.find('.cell-menu')).toHaveLength(focused ? 0 : 1);
        expect(cell.find('.cell-menu-value')).toHaveLength(focused ? 0 : 1);
        expect(cell.find('.cell-menu-selector')).toHaveLength(focused ? 0 : 1);
        expect(cell.find('input')).toHaveLength(focused ? 1 : 0);
        expect(cell.find(LookupCell)).toHaveLength(focused ? 1 : 0);
    };

    test('col is lookup, public', () => {
        const lookupCol = QueryColumn.create({ name: 'test', lookup: { isPublic: true } });
        const cell = mount(<Cell cellActions={actions} col={lookupCol} colIdx={1} rowIdx={2} />);
        expectLookup(cell);
    });

    test('col is lookup, public and focused', () => {
        const lookupCol = QueryColumn.create({ name: 'test', lookup: { isPublic: true } });
        const cell = mount(<Cell cellActions={actions} col={lookupCol} colIdx={1} rowIdx={2} focused selected />);
        expectLookup(cell, true);
    });

    test('col has validValues', () => {
        const lookupCol = QueryColumn.create({ name: 'test', validValues: ['a', 'b'] });
        const cell = mount(<Cell cellActions={actions} col={lookupCol} colIdx={1} rowIdx={2} />);
        expectLookup(cell);
    });

    test('col has validValues and focused', () => {
        const lookupCol = QueryColumn.create({ name: 'test', validValues: ['a', 'b'] });
        const cell = mount(<Cell cellActions={actions} col={lookupCol} colIdx={1} rowIdx={2} focused selected />);
        expect(cell.find('div')).toHaveLength(11);
        expect(cell.find('.cell-menu')).toHaveLength(0);
        expect(cell.find('.cell-menu-value')).toHaveLength(0);
        expect(cell.find('.cell-menu-selector')).toHaveLength(0);
        expect(cell.find('input')).toHaveLength(1);
        expect(cell.find(LookupCell)).toHaveLength(1);
    });
});
