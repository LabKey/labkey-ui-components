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
import userEvent from '@testing-library/user-event';

import { List } from 'immutable';

import { act } from 'react-dom/test-utils';

import { renderWithAppContext } from '../../../test/reactTestLibraryHelpers';

import getDatasetDesign from '../../../../test/data/dataset-getDatasetDesign.json';
import { NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../../../../test/data/constants';
import { getDomainPropertiesTestAPIWrapper } from '../APIWrapper';

import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';

import { DatasetDesignerPanelImpl, DatasetDesignerPanels } from './DatasetDesignerPanels';

import { DatasetModel } from './models';

describe('Dataset Designer', () => {
    const newDatasetModel = DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE, undefined);
    const populatedDatasetModel = DatasetModel.create(null, getDatasetDesign);

    test('for alert/message', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <DatasetDesignerPanels
                    api={getDomainPropertiesTestAPIWrapper(jest.fn)}
                    initModel={newDatasetModel}
                    onCancel={jest.fn()}
                    onComplete={jest.fn()}
                    testMode={true}
                />
            );
        });

        const datasetHeader = document.querySelector('div#dataset-header-id');
        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(1);
        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(1);

        await act(async () => {
            userEvent.click(datasetHeader);
        });

        expect(document.getElementsByClassName('domain-panel-header-collapsed')).toHaveLength(2);
        expect(document.getElementsByClassName('domain-panel-header-expanded')).toHaveLength(0);

        const alerts = document.getElementsByClassName('alert');
        expect(alerts).toHaveLength(2);
        expect(alerts[0].textContent).toContain(PROPERTIES_PANEL_ERROR_MSG);
        expect(alerts[1].textContent).toContain('Please correct errors in the properties panel before saving.');
    });

    test('New dataset', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <DatasetDesignerPanelImpl
                    api={getDomainPropertiesTestAPIWrapper(jest.fn)}
                    initModel={newDatasetModel}
                    onCancel={jest.fn()}
                    onComplete={jest.fn()}
                    testMode={true}
                    currentPanelIndex={0}
                    firstState={true}
                    onFinish={jest.fn()}
                    onTogglePanel={jest.fn()}
                    setSubmitting={jest.fn()}
                    submitting={false}
                    validatePanel={0}
                    visitedPanels={List()}
                />
            );
        });

        expect(container).toMatchSnapshot();
    });

    test('Edit existing dataset', async () => {
        let container;
        await act(async () => {
            container = renderWithAppContext(
                <DatasetDesignerPanels
                    api={getDomainPropertiesTestAPIWrapper(jest.fn)}
                    initModel={populatedDatasetModel}
                    onCancel={jest.fn()}
                    onComplete={jest.fn()}
                    testMode={true}
                />
            );
        });

        expect(container).toMatchSnapshot();
    });
});
