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
import { fromJS, Map } from 'immutable';

import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';

import { AssayUploadTabs } from '../../constants';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { LoadingState } from '../../../public/LoadingState';
import { EditorModel } from '../editable/models';

import { AssayWizardModel } from './AssayWizardModel';

const DATA_TEXT = 'test1\ttest2\n1\t2';

describe('AssayWizardModel', () => {
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
        expect(Array.isArray(data.files) && data.files.length === 0).toBeTruthy();
        expect(data.dataRows === undefined).toBeTruthy();
    });

    test('prepareFormData Grid tab', () => {
        const model = ASSAY_WIZARD_MODEL.set('dataText', DATA_TEXT) as AssayWizardModel;
        const data = model.prepareFormData(AssayUploadTabs.Grid, editorModel, queryModel);

        expect(data.assayId).toBe(model.assayDef.id);
        expect(data.name.indexOf(model.assayDef.name) === 0).toBeTruthy();
        expect(data.files === undefined).toBeTruthy();
        expect(Array.isArray(data.dataRows) && data.dataRows.length === 0).toBeTruthy();
    });

    test('getAttachedFiles', () => {
        expect(ASSAY_WIZARD_MODEL.getAttachedFiles().length).toBe(0);
        expect(ASSAY_WIZARD_MODEL.getTotalAttachedFilesSize()).toBe(0);

        const f1 = new File(['testing'], 'file1.txt');
        const f2 = new File(['something else'], 'file2.txt');

        let model = ASSAY_WIZARD_MODEL.set('resultsFiles', Map.of(f1.name, f1, f2.name, f2)) as AssayWizardModel;
        expect(model.getAttachedFiles().length).toBe(0);
        expect(model.getTotalAttachedFilesSize()).toBe(0);

        model = ASSAY_WIZARD_MODEL.set('attachedFiles', Map.of(f1.name, f1, f2.name, f2)) as AssayWizardModel;
        expect(model.getAttachedFiles().length).toBe(2);
        expect(model.getTotalAttachedFilesSize()).toBe(21);
    });

    test('getResultsFiles', () => {
        expect(ASSAY_WIZARD_MODEL.getResultsFiles().length).toBe(0);
        expect(ASSAY_WIZARD_MODEL.getTotalResultsFilesSize()).toBe(0);

        const f1 = new File(['testing'], 'file1.txt');
        const f2 = new File(['something else'], 'file2.txt');

        let model = ASSAY_WIZARD_MODEL.set('attachedFiles', Map.of(f1.name, f1, f2.name, f2)) as AssayWizardModel;
        expect(model.getResultsFiles().length).toBe(0);
        expect(model.getTotalResultsFilesSize()).toBe(0);

        model = ASSAY_WIZARD_MODEL.set('resultsFiles', Map.of(f1.name, f1, f2.name, f2)) as AssayWizardModel;
        expect(model.getResultsFiles().length).toBe(2);
        expect(model.getTotalResultsFilesSize()).toBe(21);
    });
});
