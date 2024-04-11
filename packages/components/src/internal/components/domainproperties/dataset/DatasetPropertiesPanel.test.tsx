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
import { act } from 'react-dom/test-utils';
import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import { NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../../../../test/data/constants';

import getDatasetDesign from '../../../../test/data/dataset-getDatasetDesign.json';

import { DatasetModel } from './models';

import { DatasetPropertiesPanel } from './DatasetPropertiesPanel';

describe('Dataset Properties Panel', () => {
    const newDatasetModel = DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE, undefined);
    const populatedDatasetModel = DatasetModel.create(null, getDatasetDesign);

    test('New dataset', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <DatasetPropertiesPanel
                    initCollapsed={false}
                    model={newDatasetModel}
                    controlledCollapse={true}
                    panelStatus="COMPLETE"
                    validate={false}
                    onToggle={(collapsed, callback) => {}}
                    onChange={jest.fn()}
                />
            );
        });

        expect(container).toMatchSnapshot();
    });

    test('Edit existing dataset', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <DatasetPropertiesPanel
                    initCollapsed={false}
                    model={populatedDatasetModel}
                    controlledCollapse={true}
                    panelStatus="COMPLETE"
                    validate={false}
                    onToggle={jest.fn()}
                    onChange={jest.fn()}
                />
            );
        });

        expect(container).toMatchSnapshot();
    });

});
