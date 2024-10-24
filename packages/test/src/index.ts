/*
 * Copyright (c) 2020 LabKey Corporation
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
    hookServer,
    IntegrationTestServer,
    RequestOptions,
    successfulResponse,
    TestUser,
} from './integrationUtils';
import {
    sleep,
    shuffleArray,
    selectRandomN,
} from './utils';
import {
    insertRows,
    insertSamples,
    createSource,
    importSample,
    updateRows,
    updateSamples,
    saveRows,
    doCrossFolderSamplesAction,
    deleteRows,
    deleteSamples,
    getRows,
    getSamplesData,
    sampleExists,
    getSampleDataByName,
    getSourcesData,
    sourceExists,
    createSample,
    getAliquotsByRootId,
    getAllRows,
    importData
} from './ExperimentCrudUtils';

const ExperimentCRUDUtils = {
    insertRows,
    insertSamples,
    createSource,
    importSample,
    updateRows,
    updateSamples,
    saveRows,
    doCrossFolderSamplesAction,
    deleteRows,
    deleteSamples,
    getRows,
    getSamplesData,
    sampleExists,
    getSampleDataByName,
    getSourcesData,
    sourceExists,
    createSample,
    getAliquotsByRootId,
    getAllRows,
    importData,
}

export {
    hookServer,
    IntegrationTestServer,
    RequestOptions,
    sleep,
    successfulResponse,
    TestUser,
    ExperimentCRUDUtils,
    shuffleArray,
    selectRandomN,
};
