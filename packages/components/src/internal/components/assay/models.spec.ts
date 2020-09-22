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
import { fromJS, List, Map } from 'immutable';
import { Utils } from '@labkey/api';

import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';

import { initQueryGridState } from '../../../global';
import { getStateQueryGridModel } from '../../../models';
import { gridInit } from '../../../actions';
import { QueryInfo } from '../base/models/QueryInfo';
import { AssayUploadTabs, SchemaQuery } from '../base/models/model';

import { AssayWizardModel, parseDataTextToRunRows } from './models';

const DATA_TEXT = 'test1\ttest2\n1\t2';

let GRID_MODEL;
beforeAll(() => {
    initQueryGridState();

    GRID_MODEL = getStateQueryGridModel('jest-test', SchemaQuery.create('schema', 'query'), {
        editable: true,
        queryInfo: new QueryInfo(),
        loader: {
            fetch: () => {
                return new Promise(resolve => {
                    resolve({
                        data: Map<any, Map<string, any>>(),
                        dataIds: List<any>(),
                    });
                });
            },
        },
    });

    gridInit(GRID_MODEL, true);
});

describe('AssayWizardModel', () => {
    test('getRunName', () => {
        let model = ASSAY_WIZARD_MODEL;

        // if runName is not set and no file selected, use the generateNameWithTimestamp function
        expect(model.getRunName(AssayUploadTabs.Files).indexOf(model.assayDef.name) === 0).toBeTruthy();
        expect(model.getRunName(AssayUploadTabs.Copy).indexOf(model.assayDef.name) === 0).toBeTruthy();
        expect(model.getRunName(AssayUploadTabs.Grid).indexOf(model.assayDef.name) === 0).toBeTruthy();

        // if runName is not set but we have a file selected, the value should be undefined (which means the server will set it)
        model = model.set('attachedFiles', fromJS({ file1: new File([], 'file1') })) as AssayWizardModel;
        expect(model.getRunName(AssayUploadTabs.Files)).toBe(undefined);
        expect(model.getRunName(AssayUploadTabs.Copy).indexOf(model.assayDef.name) === 0).toBeTruthy();
        expect(model.getRunName(AssayUploadTabs.Grid).indexOf(model.assayDef.name) === 0).toBeTruthy();

        // if runName is set, use that
        model = model.set('runName', 'testing') as AssayWizardModel;
        expect(model.getRunName(AssayUploadTabs.Files)).toBe('testing');
        expect(model.getRunName(AssayUploadTabs.Copy)).toBe('testing');
        expect(model.getRunName(AssayUploadTabs.Grid)).toBe('testing');
    });

    test('prepareFormData Files tab', () => {
        let model = ASSAY_WIZARD_MODEL;
        model = model.set('dataText', DATA_TEXT) as AssayWizardModel;
        const data = model.prepareFormData(AssayUploadTabs.Files, GRID_MODEL);

        expect(data.assayId).toBe(model.assayDef.id);
        expect(data.name.indexOf(model.assayDef.name) === 0).toBeTruthy();
        expect(Utils.isArray(data.files) && data.files.length === 0).toBeTruthy();
        expect(data.dataRows === undefined).toBeTruthy();
    });

    test('prepareFormData Copy tab', () => {
        let model = ASSAY_WIZARD_MODEL;
        model = model.set('dataText', DATA_TEXT) as AssayWizardModel;
        const data = model.prepareFormData(AssayUploadTabs.Copy, GRID_MODEL);

        expect(data.assayId).toBe(model.assayDef.id);
        expect(data.name.indexOf(model.assayDef.name) === 0).toBeTruthy();
        expect(data.files === undefined).toBeTruthy();
        expect(Utils.isArray(data.dataRows) && data.dataRows.length === 1).toBeTruthy();
        expect(data.dataRows[0]['test1']).toBe('1');
        expect(data.dataRows[0]['test2']).toBe('2');
    });

    test('prepareFormData Grid tab', () => {
        let model = ASSAY_WIZARD_MODEL;
        model = model.set('dataText', DATA_TEXT) as AssayWizardModel;
        const data = model.prepareFormData(AssayUploadTabs.Grid, GRID_MODEL);

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
