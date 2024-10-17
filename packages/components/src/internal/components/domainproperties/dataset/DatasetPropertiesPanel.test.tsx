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
import React, { act } from 'react';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../../../../test/data/constants';

import getDatasetDesign from '../../../../test/data/dataset-getDatasetDesign.json';

import { DatasetModel } from './models';

import { DatasetPropertiesPanel } from './DatasetPropertiesPanel';
import { VISIT_TIMEPOINT_TYPE } from './constants';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    fetchCohorts: jest.fn().mockResolvedValue([]),
    fetchCategories: jest.fn().mockResolvedValue([]),
}));

describe('Dataset Properties Panel', () => {
    const studyProperties = {
        SubjectColumnName: 'subject',
        SubjectNounSingular: 'Participant',
        SubjectNounPlural: 'Participants',
        TimepointType: VISIT_TIMEPOINT_TYPE,
    };

    test('New dataset', async () => {
        await act(async () => {
            renderWithAppContext(
                <DatasetPropertiesPanel
                    initCollapsed={false}
                    model={DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE)}
                    controlledCollapse={true}
                    panelStatus="COMPLETE"
                    validate={false}
                    studyProperties={studyProperties}
                    onToggle={jest.fn()}
                    onChange={jest.fn()}
                />
            );
        });

        expect(document.getElementById('name')).toHaveValue('');
        expect(document.getElementById('label')).toHaveValue('');
        expect(document.getElementById('description').textContent).toBe('');
    });

    test('Edit existing dataset', async () => {
        await act(async () => {
            renderWithAppContext(
                <DatasetPropertiesPanel
                    initCollapsed={false}
                    model={DatasetModel.create(null, getDatasetDesign)}
                    controlledCollapse={true}
                    panelStatus="COMPLETE"
                    validate={false}
                    studyProperties={studyProperties}
                    onToggle={jest.fn()}
                    onChange={jest.fn()}
                />
            );
        });

        expect(document.getElementById('name')).toHaveValue('Dataset1');
        expect(document.getElementById('label')).toHaveValue('Dataset One');
        expect(document.getElementById('description').textContent).toBe('This is the first dataset');
    });
});
