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
import {
    AssayDefinitionModel,
    AssayStateModel,
    GENERAL_ASSAY_PROVIDER_NAME,
    LoadingState,
} from '../../..';

const ASSAY_STATE_MODEL = new AssayStateModel({
    definitionsLoadingState: LoadingState.LOADED,
    definitions: [
        AssayDefinitionModel.create({ id: 1, name: 'GPAT 1', type: GENERAL_ASSAY_PROVIDER_NAME }),
        AssayDefinitionModel.create({ id: 2, name: 'GPAT 2', type: GENERAL_ASSAY_PROVIDER_NAME }),
        AssayDefinitionModel.create({ id: 3, name: 'NAb 1', type: 'NAb' }),
    ],
});

describe('AssayStateModel', () => {
    test('getById', () => {
        expect(ASSAY_STATE_MODEL.getById(0)?.name).toBe(undefined);
        expect(ASSAY_STATE_MODEL.getById(1)?.name).toBe('GPAT 1');
        expect(ASSAY_STATE_MODEL.getById(3)?.name).toBe('NAb 1');
    });

    test('getByName', () => {
        expect(ASSAY_STATE_MODEL.getByName('BOGUS')?.id).toBe(undefined);
        expect(ASSAY_STATE_MODEL.getByName('GPAT 1')?.id).toBe(1);
        expect(ASSAY_STATE_MODEL.getByName('NAb 1')?.id).toBe(3);
    });

    test('getDefinitionsByType', () => {
        expect(ASSAY_STATE_MODEL.getDefinitionsByType('BOGUS')).toHaveLength(0);
        expect(ASSAY_STATE_MODEL.getDefinitionsByType(GENERAL_ASSAY_PROVIDER_NAME)).toHaveLength(2);
        expect(ASSAY_STATE_MODEL.getDefinitionsByType('NAb')).toHaveLength(1);
    });
});
