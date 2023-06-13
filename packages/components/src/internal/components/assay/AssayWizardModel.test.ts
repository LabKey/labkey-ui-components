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
import { fromJS } from 'immutable';
import { Utils } from '@labkey/api';

import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';

import { AssayUploadTabs } from '../../constants';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { LoadingState } from '../../../public/LoadingState';
import { EditorModel } from '../editable/models';

import { AssayWizardModel, parseDataTextToRunRows } from './AssayWizardModel';

const DATA_TEXT = 'test1\ttest2\n1\t2';

const { queryInfo } = ASSAY_WIZARD_MODEL;
const queryModel = new QueryModel({
    id: 'queryModel',
    schemaQuery: queryInfo.schemaQuery,
}).mutate({
    rows: {},
    orderedRows: [],
    rowsLoadingState: LoadingState.LOADED,
    queryInfoLoadingState: LoadingState.LOADED,
    queryInfo,
});
const editorModel = new EditorModel({ id: 'queryModel' });

describe('AssayWizardModel', () => {
    test('getRunName', () => {
        let model = ASSAY_WIZARD_MODEL;

        // if runName is not set and no file selected, use the generateNameWithTimestamp function
        expect(model.getRunName(AssayUploadTabs.Files).indexOf(model.assayDef.name) === 0).toBeTruthy();
        expect(model.getRunName(AssayUploadTabs.Grid).indexOf(model.assayDef.name) === 0).toBeTruthy();

        // if runName is not set but we have a file selected, the value should be undefined (which means the server will set it)
        model = model.set('attachedFiles', fromJS({ file1: new File([], 'file1') })) as AssayWizardModel;
        expect(model.getRunName(AssayUploadTabs.Files)).toBe(undefined);
        expect(model.getRunName(AssayUploadTabs.Grid).indexOf(model.assayDef.name) === 0).toBeTruthy();

        // if runName is set, use that
        model = model.set('runName', 'testing') as AssayWizardModel;
        expect(model.getRunName(AssayUploadTabs.Files)).toBe('testing');
        expect(model.getRunName(AssayUploadTabs.Grid)).toBe('testing');
    });

    test('prepareFormData Files tab', () => {
        const model = ASSAY_WIZARD_MODEL.set('dataText', DATA_TEXT) as AssayWizardModel;
        const data = model.prepareFormData(AssayUploadTabs.Files, editorModel, queryModel);

        expect(data.assayId).toBe(model.assayDef.id);
        expect(data.name.indexOf(model.assayDef.name) === 0).toBeTruthy();
        expect(Utils.isArray(data.files) && data.files.length === 0).toBeTruthy();
        expect(data.dataRows === undefined).toBeTruthy();
    });

    test('prepareFormData Grid tab', () => {
        const model = ASSAY_WIZARD_MODEL.set('dataText', DATA_TEXT) as AssayWizardModel;
        const data = model.prepareFormData(AssayUploadTabs.Grid, editorModel, queryModel);

        expect(data.assayId).toBe(model.assayDef.id);
        expect(data.name.indexOf(model.assayDef.name) === 0).toBeTruthy();
        expect(data.files === undefined).toBeTruthy();
        expect(Utils.isArray(data.dataRows) && data.dataRows.length === 0).toBeTruthy();
    });
});

describe('parseDataTextToRunRows', () => {
    test('empty', () => {
        let rows = parseDataTextToRunRows(undefined);
        expect(rows).toBe(null);
        rows = parseDataTextToRunRows(null);
        expect(rows).toBe(null);
        rows = parseDataTextToRunRows('');
        expect(rows).toBe(null);
    });

    test('header only', () => {
        const rows = parseDataTextToRunRows('test1\ttest2');
        expect(rows).toBe(null);
    });

    test('one row', () => {
        const rows = parseDataTextToRunRows('test1\ttest2\n1\t2');
        expect(Utils.isArray(rows) && rows.length === 1).toBeTruthy();
        expect(rows[0]['test1']).toBe('1');
        expect(rows[0]['test2']).toBe('2');
    });

    test('multiple rows', () => {
        const rows = parseDataTextToRunRows('test1\ttest2\n1\t2\n\n3\n\t4');
        expect(Utils.isArray(rows) && rows.length === 3).toBeTruthy();
        expect(rows[0]['test1']).toBe('1');
        expect(rows[0]['test2']).toBe('2');
        expect(rows[1]['test1']).toBe('3');
        expect(rows[1]['test2']).toBe(undefined);
        expect(rows[2]['test1']).toBe(undefined);
        expect(rows[2]['test2']).toBe('4');
    });
});
