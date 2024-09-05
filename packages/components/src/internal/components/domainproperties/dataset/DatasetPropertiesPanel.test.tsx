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
import React from 'react';
import { act } from '@testing-library/react';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../../../../test/data/constants';

import getDatasetDesign from '../../../../test/data/dataset-getDatasetDesign.json';

import { DatasetModel } from './models';

import { DatasetPropertiesPanel } from './DatasetPropertiesPanel';
import { VISIT_TIMEPOINT_TYPE } from './constants';
import { sleep } from '../../../test/testHelpers';

describe('Dataset Properties Panel', () => {
    const studyProperties = {
        SubjectColumnName: 'subject',
        SubjectNounSingular: 'Participant',
        SubjectNounPlural: 'Participants',
        TimepointType: VISIT_TIMEPOINT_TYPE,
    };

    // FIXME: these test cases are disabled for several reasons. They can be re-enabled when:
    //  1. DatasetPropertiesAdvancedPanel makes network requests, it needs to be updated so that it uses an APIWrapper
    //  2. DatasetPropertiesFormElements makes network reqquests, it needs tobe updated so that it uses an APIWrapper
    //  3. We have specific things that we are going to test for instead of using snapshots. It is not clear what these
    //  tests are actually testing. Do not enable them with snapshots.
    test('FIXME', () => {});

    // test('New dataset', async () => {
    //     let container;
    //     await act(async () => {
    //         container = renderWithAppContext(
    //             <DatasetPropertiesPanel
    //                 initCollapsed={false}
    //                 model={DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE)}
    //                 controlledCollapse={true}
    //                 panelStatus="COMPLETE"
    //                 validate={false}
    //                 studyProperties={studyProperties}
    //                 onToggle={jest.fn()}
    //                 onChange={jest.fn()}
    //             />
    //         );
    //     });
    //
    //     expect(container).toMatchSnapshot();
    // });
    //
    // test('Edit existing dataset', async () => {
    //     let container;
    //     await act(async () => {
    //         container = renderWithAppContext(
    //             <DatasetPropertiesPanel
    //                 initCollapsed={false}
    //                 model={DatasetModel.create(null, getDatasetDesign)}
    //                 controlledCollapse={true}
    //                 panelStatus="COMPLETE"
    //                 validate={false}
    //                 studyProperties={studyProperties}
    //                 onToggle={jest.fn()}
    //                 onChange={jest.fn()}
    //             />
    //         );
    //     });
    //
    //     expect(container).toMatchSnapshot();
    // });
});
