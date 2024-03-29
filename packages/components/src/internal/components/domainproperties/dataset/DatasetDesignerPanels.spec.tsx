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
import { mount, shallow } from 'enzyme';

import { List } from 'immutable';

import getDatasetDesign from '../../../../test/data/dataset-getDatasetDesign.json';
import { NEW_DATASET_MODEL_WITHOUT_DATASPACE } from '../../../../test/data/constants';
import { getDomainPropertiesTestAPIWrapper } from '../APIWrapper';
import { PROPERTIES_PANEL_ERROR_MSG } from '../constants';

import { Alert } from '../../base/Alert';

import { waitForLifecycle } from '../../../test/enzymeTestHelpers';

import { DatasetDesignerPanelImpl, DatasetDesignerPanels } from './DatasetDesignerPanels';

import { DatasetModel } from './models';

describe('Dataset Designer', () => {
    const newDatasetModel = DatasetModel.create(NEW_DATASET_MODEL_WITHOUT_DATASPACE, undefined);
    const populatedDatasetModel = DatasetModel.create(null, getDatasetDesign);

    test('New dataset', async () => {
        const designerPanels = shallow(
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

        await waitForLifecycle(designerPanels);

        expect(designerPanels).toMatchSnapshot();
        designerPanels.unmount();
    });

    test('Edit existing dataset', async () => {
        const designerPanels = shallow(
            <DatasetDesignerPanels
                api={getDomainPropertiesTestAPIWrapper(jest.fn)}
                initModel={populatedDatasetModel}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
                testMode={true}
            />
        );

        await waitForLifecycle(designerPanels);

        expect(designerPanels).toMatchSnapshot();
        designerPanels.unmount();
    });

    test('for alert/message', async () => {
        const wrapped = mount(
            <DatasetDesignerPanels
                api={getDomainPropertiesTestAPIWrapper(jest.fn)}
                initModel={newDatasetModel}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
                testMode={true}
            />
        );

        await waitForLifecycle(wrapped);

        const datasetHeader = wrapped.find('div#dataset-header-id');
        expect(wrapped.find('#dataset-header-id').at(1).hasClass('domain-panel-header-expanded')).toBeTruthy();
        datasetHeader.simulate('click');
        expect(wrapped.find('#dataset-header-id').at(1).hasClass('domain-panel-header-collapsed')).toBeTruthy();

        const panelHeader = wrapped.find('div#domain-header');
        expect(wrapped.find('#domain-header').at(1).hasClass('domain-panel-header-collapsed')).toBeTruthy();
        panelHeader.simulate('click');
        expect(wrapped.find('#domain-header').at(1).hasClass('domain-panel-header-expanded')).toBeTruthy();

        expect(wrapped.find(Alert)).toHaveLength(2);
        expect(wrapped.find(Alert).at(0).text()).toEqual(PROPERTIES_PANEL_ERROR_MSG);
        expect(wrapped.find(Alert).at(1).text()).toEqual(
            'Please correct errors in the properties panel before saving.'
        );
        wrapped.unmount();
    });
});
