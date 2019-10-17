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
import mock, { proxy } from 'xhr-mock';
const getMaxPhiLevelJson = require("../test/data/security-GetMaxPhiLevel.json");
const inferDomainJson = require('../test/data/property-inferDomain.json');
const getValidPublishTargetsJson = require('../test/data/assay-getValidPublishTargets.json');

export function initMocks() {
    mock.setup();

    mock.post(/.*\/property\/inferDomain.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(inferDomainJson)
    });

    mock.get(/.*\/security\/GetMaxPhiLevel.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(getMaxPhiLevelJson)
    });

    mock.get(/.*\/assay\/getValidPublishTargets.*/, {
        status: 200,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(getValidPublishTargetsJson)
    });

    mock.use(proxy);
}