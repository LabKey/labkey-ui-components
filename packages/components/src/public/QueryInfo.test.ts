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
import { fromJS, List } from 'immutable';

import sampleSetQueryInfo from '../test/data/sampleSet-getQueryDetails.json';
import sampleSet3QueryColumn from '../test/data/SampleSet3Parent-QueryColumn.json';
import nameExpSetQueryColumn from '../test/data/NameExprParent-QueryColumn.json';

import { ViewInfo } from '../internal/ViewInfo';
import { ExtendedMap } from './ExtendedMap';

import { QueryInfo } from './QueryInfo';

describe('getColumnFieldKeys', () => {
    test('missing params', () => {
        const queryInfo = new QueryInfo({});

        expect(JSON.stringify(queryInfo.getColumnFieldKeys(undefined))).toBe('[]');
        expect(JSON.stringify(queryInfo.getColumnFieldKeys(['test']))).toBe('[]');
    });

    test('queryInfo with columns', () => {
        const queryInfo = QueryInfo.fromJsonForTests({
            columns: [{ fieldKey: 'test1' }, { fieldKey: 'test2' }, { fieldKey: 'test3' }],
        });

        expect(JSON.stringify(queryInfo.getColumnFieldKeys(undefined))).toBe('["test1","test2","test3"]');
        expect(JSON.stringify(queryInfo.getColumnFieldKeys(['test0']))).toBe('[]');
        expect(JSON.stringify(queryInfo.getColumnFieldKeys(['test1']))).toBe('["test1"]');
        expect(JSON.stringify(queryInfo.getColumnFieldKeys(['test1', 'test2']))).toBe('["test1","test2"]');
        expect(JSON.stringify(queryInfo.getColumnFieldKeys(['test1', 'test2', 'test4']))).toBe('["test1","test2"]');
    });
});

describe('QueryInfo', () => {
    const queryInfo = QueryInfo.fromJsonForTests(sampleSetQueryInfo);

    describe('getUpdateColumns', () => {
        test('without readOnly columns', () => {
            const columns = queryInfo.getUpdateColumns();
            expect(columns.length).toBe(2);
            expect(columns[0].fieldKey).toBe('Description');
            expect(columns[1].fieldKey).toBe('New');
        });

        test('with readOnly columns', () => {
            const columns = queryInfo.getUpdateColumns(['Name']);
            expect(columns.length).toBe(3);
            expect(columns[0].fieldKey).toBe('Name');
            expect(columns[1].fieldKey).toBe('Description');
            expect(columns[2].fieldKey).toBe('New');
        });
    });

    describe('getDisplayColumns', () => {
        const queryInfoWithViews = QueryInfo.fromJsonForTests(
            {
                columns: [
                    { fieldKey: 'test1' },
                    { fieldKey: 'test2', addToSystemView: true },
                    { fieldKey: 'test3', addToSystemView: true },
                ],
                views: [{ name: '', default: true }],
            },
            true
        );

        test('system default view with addToSystemView', () => {
            const columns = queryInfoWithViews.getDisplayColumns();
            expect(columns.length).toBe(2);
            expect(columns[0].fieldKey).toBe('test2');
            expect(columns[1].fieldKey).toBe('test3');
        });

        test('system default view with omittedColumns', () => {
            const columns = queryInfoWithViews.getDisplayColumns('', ['test2']);
            expect(columns.length).toBe(1);
            expect(columns[0].fieldKey).toBe('test3');
        });

        test('saved default view should not include addToSystemView', () => {
            const qv = QueryInfo.fromJsonForTests(
                {
                    columns: [
                        { fieldKey: 'test1' },
                        { fieldKey: 'test2', addToSystemView: true },
                        { fieldKey: 'test3', addToSystemView: true },
                    ],
                    views: [{ name: '', default: true, saved: true }],
                },
                true
            );
            const columns = qv.getDisplayColumns();
            expect(columns.length).toBe(0);
        });
    });

    describe('getIconURL', () => {
        test('default', () => {
            const queryInfo = QueryInfo.fromJsonForTests({ schemaName: 'test', name: 'test' });
            expect(queryInfo.getIconURL()).toBe('default');
        });

        test('with custom iconURL', () => {
            const queryInfo = QueryInfo.fromJsonForTests({ schemaName: 'samples', name: 'test', iconURL: 'other' });
            expect(queryInfo.getIconURL()).toBe('other');
        });
    });

    describe('getInsertQueryInfo', () => {
        test('shownInInsertView', () => {
            const queryInfo = QueryInfo.fromJsonForTests({
                columns: [
                    { fieldKey: 'test1', shownInInsertView: true },
                    { fieldKey: 'test2', shownInInsertView: false },
                ],
            }).getInsertQueryInfo();
            expect(queryInfo.columns.size).toBe(1);
            expect(queryInfo.columns.get('test1')).toBeDefined();
            expect(queryInfo.columns.get('test2')).toBeUndefined();
        });

        test('isFileInput', () => {
            const queryInfo = QueryInfo.fromJsonForTests({
                columns: [
                    { fieldKey: 'test1', shownInInsertView: true, inputType: 'text' },
                    { fieldKey: 'test2', shownInInsertView: true, inputType: 'file' },
                ],
            }).getInsertQueryInfo();
            expect(queryInfo.columns.size).toBe(1);
            expect(queryInfo.columns.get('test1')).toBeDefined();
            expect(queryInfo.columns.get('test2')).toBeUndefined();
        });
    });

    describe('getInsertColumns', () => {
        test('includeFileInputs false', () => {
            const insertCol1 = QueryInfo.fromJsonForTests({
                columns: [
                    {
                        fieldKey: 'test1',
                        fieldKeyArray: ['test1'],
                        shownInInsertView: true,
                        userEditable: true,
                        readOnly: false,
                        inputType: 'text',
                    },
                    {
                        fieldKey: 'test2',
                        fieldKeyArray: ['test2'],
                        shownInInsertView: true,
                        userEditable: true,
                        readOnly: false,
                        inputType: 'file',
                    },
                ],
            }).getInsertColumns();
            expect(insertCol1.length).toBe(1);
            expect(insertCol1[0].fieldKey).toBe('test1');
        });
    });

    describe('getFileColumnFieldKeys', () => {
        test('default', () => {
            const fieldKeys = QueryInfo.fromJsonForTests({
                columns: [
                    { fieldKey: 'test1', shownInInsertView: true, inputType: 'text' },
                    { fieldKey: 'test2', shownInInsertView: false, inputType: 'text' },
                    { fieldKey: 'test3', shownInInsertView: true, inputType: 'file' },
                ],
            }).getFileColumnFieldKeys();
            expect(fieldKeys.join(',')).toBe('test3');
        });
    });

    describe('getShowImportDataButton', () => {
        test('respects settings', () => {
            const qi = new QueryInfo({
                importUrl: '#/importUrl',
                importUrlDisabled: false,
                showInsertNewButton: true, // yes, "getShowImportDataButton()" respects the "showInsertNewButton" flag
            });

            expect(qi.getShowImportDataButton()).toBe(true);
            expect(qi.mutate({ importUrl: undefined }).getShowImportDataButton()).toBe(false);
            expect(qi.mutate({ importUrlDisabled: true }).getShowImportDataButton()).toBe(false);
            expect(qi.mutate({ showInsertNewButton: false }).getShowImportDataButton()).toBe(false);
        });
    });

    describe('getShowInsertNewButton', () => {
        test('respects settings', () => {
            const qi = new QueryInfo({
                insertUrl: '#/insertUrl',
                insertUrlDisabled: false,
                showInsertNewButton: true,
            });

            expect(qi.getShowInsertNewButton()).toBe(true);
            expect(qi.mutate({ insertUrl: undefined }).getShowInsertNewButton()).toBe(false);
            expect(qi.mutate({ insertUrlDisabled: true }).getShowInsertNewButton()).toBe(false);
            expect(qi.mutate({ showInsertNewButton: false }).getShowInsertNewButton()).toBe(false);
        });
    });

    describe('getView', () => {
        test('getView works as expected', () => {
            let queryInfo = new QueryInfo({
                views: new ExtendedMap({
                    [ViewInfo.DEFAULT_NAME.toLowerCase()]: ViewInfo.fromJson({ name: 'default' }),
                    [ViewInfo.DETAIL_NAME.toLowerCase()]: ViewInfo.fromJson({ name: 'detail' }),
                    view1: ViewInfo.fromJson({ name: 'view1' }),
                    view2: ViewInfo.fromJson({ name: 'view2' }),
                }),
            });

            expect(queryInfo.getView(undefined)?.name).toBe(undefined);
            expect(queryInfo.getView(undefined, true)?.name).toBe('default');
            expect(queryInfo.getView('')?.name).toBe('default');
            expect(queryInfo.getView('', true)?.name).toBe('default');

            expect(queryInfo.getView('bogus')?.name).toBe(undefined);
            expect(queryInfo.getView('bogus', false)?.name).toBe(undefined);
            expect(queryInfo.getView('bogus', true)?.name).toBe('default');

            expect(queryInfo.getView('view1')?.name).toBe('view1');
            expect(queryInfo.getView('view2')?.name).toBe('view2');
            expect(queryInfo.getView('view2', true)?.name).toBe('view2');

            expect(queryInfo.getView(ViewInfo.DEFAULT_NAME)?.name).toBe('default');
            expect(queryInfo.getView('~~default~~')?.name).toBe('default');

            expect(queryInfo.getView(ViewInfo.DETAIL_NAME)?.name).toBe('detail');
            expect(queryInfo.getView('~~details~~')?.name).toBe('detail');

            queryInfo = new QueryInfo({
                views: fromJS({
                    [ViewInfo.DEFAULT_NAME.toLowerCase()]: ViewInfo.fromJson({ name: 'default' }),
                    [ViewInfo.DETAIL_NAME.toLowerCase()]: ViewInfo.fromJson({ name: 'detail' }),
                    [ViewInfo.BIO_DETAIL_NAME.toLowerCase()]: ViewInfo.fromJson({ name: 'LKB detail' }),
                }),
            });
            expect(queryInfo.getView(ViewInfo.BIO_DETAIL_NAME)?.name).toBe('LKB detail');
            expect(queryInfo.getView(ViewInfo.DETAIL_NAME)?.name).toBe('LKB detail');
            expect(queryInfo.getView('~~details~~')?.name).toBe('LKB detail');
        });
    });
});
