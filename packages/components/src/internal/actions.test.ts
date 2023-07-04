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
import { List } from 'immutable';

import { Filter, Query } from '@labkey/api';

import { SchemaQuery } from '../public/SchemaQuery';

import { getExportParams } from './actions';
import { EXPORT_TYPES } from './constants';

describe('getExportParams', () => {
    const schemaName = 'test';
    const queryName = 'query';
    const schemaQuery = new SchemaQuery(schemaName, queryName);
    test('no options or advanced options', () => {
        expect(getExportParams(EXPORT_TYPES.TSV, schemaQuery)).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
        });
    });

    test('with schema view', () => {
        expect(getExportParams(EXPORT_TYPES.TSV, new SchemaQuery(schemaName, queryName, 'testView'))).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.viewName': 'testView',
        });
    });

    test('as csv', () => {
        expect(getExportParams(EXPORT_TYPES.CSV, schemaQuery)).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            delim: 'COMMA',
        });
    });

    test('with options, no advanced options', () => {
        expect(
            getExportParams(EXPORT_TYPES.TSV, schemaQuery, {
                showRows: 'SELECTED',
                selectionKey: 'selection-key',
                columns: 'Field1,Field2',
                sorts: '-Field2,Field1',
                filters: List([Filter.create('Field3', 'value', Filter.Types.NEQ)]),
            })
        ).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['SELECTED'],
            'query.selectionKey': 'selection-key',
            'query.columns': 'Field1,Field2',
            'query.sort': '-Field2,Field1',
            'query.Field3~neq': ['value'],
        });
    });

    test('with includeColumn', () => {
        expect(
            getExportParams(
                EXPORT_TYPES.TSV,
                schemaQuery,
                {
                    selectionKey: 'selection-key',
                    columns: 'Field1,Field2',
                    sorts: '-Field2,Field1',
                    filters: List([Filter.create('Field3', 'value', Filter.Types.NEQ)]),
                },
                {
                    includeColumn: ['extra1', 'extra2'],
                }
            )
        ).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.selectionKey': 'selection-key',
            'query.columns': 'Field1,Field2,extra1,extra2',
            'query.sort': '-Field2,Field1',
            'query.Field3~neq': ['value'],
            includeColumn: ['extra1', 'extra2'],
        });
    });

    test('with includeColumn, no columns', () => {
        expect(
            getExportParams(
                EXPORT_TYPES.TSV,
                schemaQuery,
                {
                    selectionKey: 'selection-key',
                    sorts: '-Field2,Field1',
                    filters: List([Filter.create('Field3', 'value', Filter.Types.NEQ)]),
                },
                {
                    includeColumn: ['extra1', 'extra2'],
                }
            )
        ).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.selectionKey': 'selection-key',
            'query.sort': '-Field2,Field1',
            'query.Field3~neq': ['value'],
            includeColumn: ['extra1', 'extra2'],
        });
    });

    test('with excludeColumn', () => {
        expect(
            getExportParams(
                EXPORT_TYPES.TSV,
                schemaQuery,
                {
                    selectionKey: 'selection-key',
                    sorts: '-Field2,Field1',
                    columns: 'Field1,Field2,Field3',
                    filters: List([Filter.create('Field3', 'value', Filter.Types.NEQ)]),
                },
                {
                    excludeColumn: ['Field3', 'extra2'],
                }
            )
        ).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.selectionKey': 'selection-key',
            'query.sort': '-Field2,Field1',
            'query.columns': 'Field1,Field2',
            'query.Field3~neq': ['value'],
            excludeColumn: ['Field3', 'extra2'],
        });
    });

    test('with includeColumn and excludeColumn', () => {
        expect(
            getExportParams(
                EXPORT_TYPES.TSV,
                schemaQuery,
                {
                    selectionKey: 'selection-key',
                    sorts: '-Field2,Field1',
                    columns: 'Field1,Field2,Field3',
                    filters: List([Filter.create('Field3', 'value', Filter.Types.NEQ)]),
                },
                {
                    includeColumn: ['extra1', 'extra2'],
                    excludeColumn: ['Field3', 'extra2'],
                }
            )
        ).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.selectionKey': 'selection-key',
            'query.sort': '-Field2,Field1',
            'query.columns': 'Field1,Field2,extra1',
            'query.Field3~neq': ['value'],
            includeColumn: ['extra1', 'extra2'],
            excludeColumn: ['Field3', 'extra2'],
        });
    });

    test('container filter', () => {
        // explicit container filter
        expect(
            getExportParams(EXPORT_TYPES.TSV, schemaQuery, {
                containerFilter: Query.ContainerFilter.currentAndFirstChildren,
            })
        ).toStrictEqual({
            schemaName,
            'query.queryName': queryName,
            'query.showRows': ['ALL'],
            'query.containerFilterName': Query.ContainerFilter.currentAndFirstChildren,
        });
    });
});
