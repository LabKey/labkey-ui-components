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
import { mount } from 'enzyme';
import mock from 'xhr-mock';

import { getStateQueryGridModel, gridInit, QueryColumn, SchemaQuery } from '../../..';
import * as constants from '../../../test/data/constants';

import { sleep } from '../../testHelpers';
import { initUnitTestMocks } from '../../testHelperMocks';

import { Cell } from './Cell';
import { LookupCell } from './LookupCell';

const GRID_ID = 'CellTestModel';
const SCHEMA_NAME = 'lists';
const QUERY_NAME = 'MixtureTypes';
const MODEL_ID = (GRID_ID + '|' + SCHEMA_NAME + '/' + QUERY_NAME).toLowerCase();

beforeAll(async () => {
    initUnitTestMocks();
    const schemaQuery = new SchemaQuery({
        schemaName: SCHEMA_NAME,
        queryName: QUERY_NAME,
    });
    const model = getStateQueryGridModel(GRID_ID, schemaQuery, {
        editable: true,
        loader: {
            fetch: () => {
                return Promise.resolve({
                    data: constants.GRID_DATA,
                    dataIds: constants.GRID_DATA.keySeq().toList(),
                });
            },
        },
    });
    gridInit(model, true);

    await sleep(100);
});

afterAll(() => {
    mock.reset();
});

const queryColumn = QueryColumn.create({
    lookup: undefined,
    name: 'myColumn',
});

describe('Cell', () => {
    test('default props', () => {
        const cell = mount(<Cell col={queryColumn} colIdx={1} modelId={MODEL_ID} rowIdx={2} />);
        expect(cell.find('div')).toHaveLength(1);
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
        cell.unmount();
    });

    test('with focus', () => {
        const cell = mount(
            <Cell col={queryColumn} colIdx={1} modelId={MODEL_ID} rowIdx={2} focused selected />
        );
        expect(cell.find('div')).toHaveLength(0);
        expect(cell.find('input')).toHaveLength(1);
        expect(cell.find(LookupCell)).toHaveLength(0);
        cell.unmount();
    });

    test('with placeholder', () => {
        const cell = mount(
            <Cell col={queryColumn} colIdx={2} modelId={MODEL_ID} placeholder="placeholder text" rowIdx={3} />
        );
        const div = cell.find('div');
        expect(div).toHaveLength(1);
        expect(div.text()).toBe('placeholder text');
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
        cell.unmount();
    });

    test('with placeholder while focused', () => {
        const cell = mount(
            <Cell
                col={queryColumn}
                colIdx={2}
                modelId={MODEL_ID}
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
        cell.unmount();
    });

    test('readOnly property', () => {
        const cell = mount(<Cell col={queryColumn} colIdx={3} modelId={MODEL_ID} readOnly rowIdx={3} />);
        expect(cell.find('div')).toHaveLength(1);
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
        cell.unmount();
    });

    test('column is readOnly', () => {
        const roColumn = QueryColumn.create({
            readOnly: true,
            name: 'roColumn',
        });
        const cell = mount(<Cell col={roColumn} colIdx={4} modelId={MODEL_ID} readOnly={false} rowIdx={3} />);
        expect(cell.find('div')).toHaveLength(1);
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
        cell.unmount();
    });

    test('with placeholder and readOnly', () => {
        const cell = mount(
            <Cell
                col={queryColumn}
                colIdx={3}
                modelId={MODEL_ID}
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
        cell.unmount();
    });

    test('col is lookup, not public', () => {
        const lookupCol = QueryColumn.create({
            name: 'test',
            lookup: { isPublic: false },
        });
        const cell = mount(<Cell col={lookupCol} colIdx={1} modelId={MODEL_ID} rowIdx={2} />);
        expect(cell.find('div')).toHaveLength(1);
        expect(cell.find('.cell-menu')).toHaveLength(0);
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
        cell.unmount();
    });

    test('col is lookup, public', () => {
        const lookupCol = QueryColumn.create({
            name: 'test',
            lookup: { isPublic: true },
        });
        const cell = mount(<Cell col={lookupCol} colIdx={1} modelId={MODEL_ID} rowIdx={2} />);
        expect(cell.find('div')).toHaveLength(2);
        expect(cell.find('.cell-menu')).toHaveLength(1);
        expect(cell.find('.cell-menu-value')).toHaveLength(1);
        expect(cell.find('.cell-menu-selector')).toHaveLength(1);
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
        cell.unmount();
    });

    test('col is lookup, public and focused', () => {
        const lookupCol = QueryColumn.create({
            name: 'test',
            lookup: { isPublic: true },
        });
        const cell = mount(<Cell col={lookupCol} colIdx={1} modelId={MODEL_ID} rowIdx={2} focused selected />);
        expect(cell.find('div')).toHaveLength(11);
        expect(cell.find('.cell-menu')).toHaveLength(0);
        expect(cell.find('.cell-menu-value')).toHaveLength(0);
        expect(cell.find('.cell-menu-selector')).toHaveLength(0);
        expect(cell.find('input')).toHaveLength(1);
        expect(cell.find(LookupCell)).toHaveLength(1);
        cell.unmount();
    });

    test('col has validValues', () => {
        const lookupCol = QueryColumn.create({
            name: 'test',
            validValues: ['a', 'b'],
        });
        const cell = mount(<Cell col={lookupCol} colIdx={1} modelId={MODEL_ID} rowIdx={2} />);
        expect(cell.find('div')).toHaveLength(2);
        expect(cell.find('.cell-menu')).toHaveLength(1);
        expect(cell.find('.cell-menu-value')).toHaveLength(1);
        expect(cell.find('.cell-menu-selector')).toHaveLength(1);
        expect(cell.find('input')).toHaveLength(0);
        expect(cell.find(LookupCell)).toHaveLength(0);
        cell.unmount();
    });

    test('col has validValues and focused', () => {
        const lookupCol = QueryColumn.create({
            name: 'test',
            validValues: ['a', 'b'],
        });
        const cell = mount(<Cell col={lookupCol} colIdx={1} modelId={MODEL_ID} rowIdx={2} focused selected />);
        expect(cell.find('div')).toHaveLength(11);
        expect(cell.find('.cell-menu')).toHaveLength(0);
        expect(cell.find('.cell-menu-value')).toHaveLength(0);
        expect(cell.find('.cell-menu-selector')).toHaveLength(0);
        expect(cell.find('input')).toHaveLength(1);
        expect(cell.find(LookupCell)).toHaveLength(1);
        cell.unmount();
    });
});
